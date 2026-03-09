"use client";

import { useState, useEffect } from "react";
import { getBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost, uploadBlogImage, BlogPost } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Timestamp } from "firebase/firestore";
import { Plus, Trash2, Edit, AlertCircle, RefreshCw } from "lucide-react";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import toast from "react-hot-toast";

const DUMMY_POSTS = [
    // ... existing posts ...
    {
        title: "Introducing Cargofly 3: The Future of Logistics",
        slug: "introducing-cargofly-3",
        excerpt: "We are thrilled to announce the launch of Cargofly 3, a complete overhaul of our logistics platform designed to optimize your supply chain like never before.",
        content: "<p>Welcome to the next generation of global shipping. With Cargofly 3, we have reimagined the entire logistics experience from the ground up...</p><p>Key features include real-time blockchain tracking, AI-powered predictive routing, and a completely redesigned user interface that puts you in control.</p>",
        category: "Announcements",
        author: "Cargofly Team",
        image: "/images/dashboard-banner.png",
        isPublished: true,
    },
    {
        title: "Navigating West African Customs: A 2026 Guide",
        slug: "navigating-west-african-customs",
        excerpt: "Cross-border shipping in West Africa can be complex. Learn how Cargofly's dedicated regional teams simplify customs clearance and reduce transit times.",
        content: "<p>The Economic Community of West African States (ECOWAS) has made strides in streamlining trade, but practical challenges remain. Our latest guide covers everything you need to know about documentation, tariffs, and exactly how Cargofly handles the heavy lifting for you.</p>",
        category: "Industry Insights",
        author: "Sarah O.",
        image: "/images/ground-crew.png",
        isPublished: true,
    },
    {
        title: "Sustainable Aviation: How We're Cutting Emissions",
        slug: "sustainable-aviation-emissions",
        excerpt: "Logistics shouldn't cost the earth. Discover the steps Cargofly is taking to reduce our carbon footprint, from route optimization to biofuels.",
        content: "<p>As a leader in aviation freight, we recognize our responsibility to the environment. This year, we've pledged to reduce our operational emissions by 15% through a combination of more efficient flight routing and investments in sustainable aviation fuel (SAF).</p>",
        category: "Sustainability",
        author: "Cargofly Team",
        image: "/images/hero-aircraft.png",
        isPublished: true,
    }
];

export default function AdminBlogPage() {
    const { userProfile } = useAuth();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [postToDelete, setPostToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Create / Edit State
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [currentPost, setCurrentPost] = useState<Partial<BlogPost> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error("Image must be less than 2MB");
            return;
        }

        const objectUrl = URL.createObjectURL(file);

        // Dimension validation and instant preview
        const img = new window.Image();
        img.onload = async () => {
            if (img.width < 800 || img.height < 400) {
                toast.error("Image dimensions too small. Minimum is 800x400px.");
                URL.revokeObjectURL(objectUrl);
                return;
            }

            // Immediately show local preview
            setCurrentPost(prev => prev ? { ...prev, image: objectUrl } : null);

            try {
                setIsUploading(true);
                const downloadUrl = await uploadBlogImage(file);
                setCurrentPost(prev => prev ? { ...prev, image: downloadUrl } : null);
                // toast.success("Image uploaded successfully");
            } catch (error) {
                console.error("Upload error:", error);
                toast.error("Failed to upload image. Please try again.");
                // Note: we leave the local preview intact so the user can see what they attempted
            } finally {
                setIsUploading(false);
                // We keep objectUrl active in case upload failed but they want to see the image locally
                // Note: clicking save will fail if it's a blob url
            }
        };
        img.onerror = () => {
            toast.error("Invalid image file");
            URL.revokeObjectURL(objectUrl);
        };
        img.src = objectUrl;
    };


    useEffect(() => {
        if (userProfile?.role === 'admin') {
            loadPosts();
        }
    }, [userProfile]);

    const loadPosts = async () => {
        try {
            setLoading(true);
            const fetchedPosts = await getBlogPosts(false); // Fetch all, not just published
            setPosts(fetchedPosts);
        } catch (error) {
            console.error("Error loading posts:", error);
            toast.error("Failed to load blog posts");
        } finally {
            setLoading(false);
        }
    };

    const handleSeedDummyData = async () => {
        if (!confirm("This will add 3 dummy posts. Are you sure?")) return;

        try {
            setSeeding(true);
            for (const post of DUMMY_POSTS) {
                await createBlogPost({
                    ...post,
                    publishedAt: Timestamp.now(),
                    updatedAt: Timestamp.now()
                });
            }
            toast.success("Dummy posts created successfully!");
            await loadPosts();
        } catch (error) {
            console.error("Error seeding posts:", error);
            toast.error("Failed to create dummy posts");
        } finally {
            setSeeding(false);
        }
    };

    const handleDelete = async () => {
        if (!postToDelete) return;

        try {
            setIsDeleting(true);
            await deleteBlogPost(postToDelete);
            toast.success("Post deleted");
            setPosts(posts.filter(p => p.id !== postToDelete));
            setPostToDelete(null);
        } catch (error) {
            console.error("Error deleting post:", error);
            toast.error("Failed to delete post");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSavePost = async () => {
        if (!currentPost?.title || !currentPost?.slug) {
            toast.error("Title and slug are required");
            return;
        }

        try {
            setIsSaving(true);
            if (currentPost.id) {
                await updateBlogPost(currentPost.id, {
                    ...currentPost,
                    updatedAt: Timestamp.now()
                });
                toast.success("Post updated successfully");
            } else {
                await createBlogPost({
                    ...(currentPost as BlogPost),
                    publishedAt: Timestamp.now(),
                    updatedAt: Timestamp.now()
                });
                toast.success("Post created successfully");
            }
            setIsPostModalOpen(false);
            setCurrentPost(null);
            await loadPosts();
        } catch (error) {
            console.error("Error saving post:", error);
            toast.error("Failed to save post");
        } finally {
            setIsSaving(false);
        }
    };


    if (userProfile?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-navy-900 dark:text-white">Access Denied</h2>
                <p className="text-gray-500 dark:text-slate-400 mt-2">You must be an administrator to view this page.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-background-dark h-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-[32px] font-bold text-[#1e293b] dark:text-white leading-tight">Blog Management</h1>
                    <p className="text-[14px] text-[#64748b] dark:text-slate-400 mt-1">Create, edit, and manage public blog posts.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handleSeedDummyData}
                        disabled={seeding}
                        className="rounded-xl shadow-sm"
                        leftIcon={seeding ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        title="Generate Dummy Posts"
                    >
                        <span className="hidden md:inline">Generate Dummy Posts</span>
                    </Button>
                    <Button
                        variant="premium"
                        className="rounded-xl"
                        leftIcon={<Plus className="w-5 h-5" />}
                        onClick={() => {
                            setCurrentPost({ title: '', slug: '', excerpt: '', content: '', category: '', author: '', image: '', isPublished: false });
                            setIsPostModalOpen(true);
                        }}
                    >
                        Create New Post
                    </Button>
                </div>
            </div>

            {loading ? (
                <Card variant="flat" className="border-dashed bg-transparent">
                    <CardContent className="p-12 flex flex-col items-center justify-center text-slate-400">
                        <RefreshCw className="w-8 h-8 animate-spin mb-4" />
                        <p className="text-sm font-medium">Loading blog articles...</p>
                    </CardContent>
                </Card>
            ) : posts.length === 0 ? (
                <Card variant="default" className="text-center">
                    <CardContent className="p-16 flex flex-col items-center">
                        <div className="relative w-64 h-64 mb-6">
                            <img
                                src="/images/illustrations/empty_logistics.png"
                                alt="No Blog Posts"
                                className="object-contain w-full h-full opacity-80"
                            />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Blog Posts Found</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">You haven't published any articles yet. Start by creating a new post or use the dummy generator.</p>
                        <Button
                            variant="link"
                            onClick={handleSeedDummyData}
                            className="font-bold"
                        >
                            Click here to seed "Introducing Cargofly 3" dummy posts
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4">Article Title</th>
                                    <th className="px-6 py-4">Author</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {posts.map((post) => (
                                    <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{post.title}</div>
                                            <div className="text-xs text-slate-500 mt-1 font-mono opacity-60">/{post.slug}</div>
                                        </td>
                                        <td className="px-6 py-5 text-slate-600 dark:text-slate-400 font-medium">{post.author}</td>
                                        <td className="px-6 py-5">
                                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-1 px-3 rounded-lg text-xs font-bold uppercase tracking-wider">
                                                {post.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <StatusPill status={post.isPublished ? 'success' : 'pending'} />
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-8 h-8 text-slate-400 hover:text-primary transition-colors"
                                                    title="Edit Post"
                                                    onClick={() => {
                                                        setCurrentPost(post);
                                                        setIsPostModalOpen(true);
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setPostToDelete(post.id!)}
                                                    className="w-8 h-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                                    title="Delete Post"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Delete Confirmation Modal */}
            {postToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardContent className="p-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Blog Post</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                    Are you sure you want to delete this post? This action cannot be undone.
                                </p>
                                <div className="flex gap-3 w-full">
                                    <Button
                                        variant="outline"
                                        onClick={() => setPostToDelete(null)}
                                        className="flex-1"
                                        disabled={isDeleting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDelete}
                                        loading={isDeleting}
                                        className="flex-1"
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Create / Edit Modal */}
            {isPostModalOpen && currentPost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
                    <Card className="w-full max-w-6xl shadow-2xl animate-in zoom-in-95 duration-200 my-8 flex-shrink-0">
                        <CardContent className="p-0 flex flex-col md:flex-row h-[85vh]">
                            {/* Editor Side */}
                            <div className="flex-1 border-r border-slate-100 dark:border-slate-800 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar">
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                                        {currentPost.id ? 'Edit Blog Post' : 'Create New Post'}
                                    </h3>

                                    <div className="space-y-4 px-1">
                                        <div className="space-y-2">
                                            <Label>Title</Label>
                                            <Input
                                                value={currentPost.title || ''}
                                                onChange={(e) => setCurrentPost({ ...currentPost, title: e.target.value })}
                                                placeholder="Post Title"
                                                className="text-lg font-medium"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Slug</Label>
                                                <Input
                                                    value={currentPost.slug || ''}
                                                    onChange={(e) => setCurrentPost({ ...currentPost, slug: e.target.value })}
                                                    placeholder="post-slug"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Category</Label>
                                                <Input
                                                    value={currentPost.category || ''}
                                                    onChange={(e) => setCurrentPost({ ...currentPost, category: e.target.value })}
                                                    placeholder="Category"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Author</Label>
                                                <Input
                                                    value={currentPost.author || ''}
                                                    onChange={(e) => setCurrentPost({ ...currentPost, author: e.target.value })}
                                                    placeholder="Author Name"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Cover Image</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        disabled={isUploading}
                                                        className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                                    />
                                                    {isUploading && <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">Recommended size: 1200x630px. Max 2MB.</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Excerpt (shown in cards)</Label>
                                            <Textarea
                                                value={currentPost.excerpt || ''}
                                                onChange={(e) => setCurrentPost({ ...currentPost, excerpt: e.target.value })}
                                                placeholder="Brief summary..."
                                                rows={2}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Content (HTML)</Label>
                                            <Textarea
                                                value={currentPost.content || ''}
                                                onChange={(e) => setCurrentPost({ ...currentPost, content: e.target.value })}
                                                placeholder="<p>Full post content...</p>"
                                                rows={8}
                                                className="font-mono text-sm leading-relaxed"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 pt-2">
                                            <input
                                                type="checkbox"
                                                id="isPublished"
                                                checked={currentPost.isPublished || false}
                                                onChange={(e) => setCurrentPost({ ...currentPost, isPublished: e.target.checked })}
                                                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                                            />
                                            <Label htmlFor="isPublished" className="font-bold cursor-pointer">Publish Immediately</Label>
                                        </div>
                                    </div>

                                    <div className="flex justify-start gap-3 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setIsPostModalOpen(false);
                                                setCurrentPost(null);
                                            }}
                                            disabled={isSaving || isUploading}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="premium"
                                            onClick={handleSavePost}
                                            loading={isSaving}
                                            disabled={isUploading}
                                        >
                                            {currentPost.id ? 'Save Changes' : 'Create Post'}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Live Preview Side */}
                            <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 flex flex-col min-h-0 overflow-y-auto custom-scrollbar border-l border-slate-100 dark:border-slate-800">
                                <div className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-3 border-b border-slate-100 dark:border-slate-800 z-10 flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Preview</span>
                                    <StatusPill status={currentPost.isPublished ? 'success' : 'pending'} />
                                </div>
                                <div className="p-8 max-w-2xl mx-auto w-full">
                                    <div className="prose prose-slate dark:prose-invert prose-lg max-w-none">
                                        {currentPost.category && (
                                            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                                                {currentPost.category}
                                            </span>
                                        )}
                                        <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
                                            {currentPost.title || "Your Post Title"}
                                        </h1>
                                        <div className="flex items-center gap-3 text-slate-500 mb-8 pb-8 border-b border-slate-200 dark:border-slate-800">
                                            <div className="font-medium text-slate-700 dark:text-slate-300">
                                                {currentPost.author || "Author Name"}
                                            </div>
                                            <span>•</span>
                                            <time>
                                                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </time>
                                        </div>

                                        {currentPost.image && (
                                            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-8 relative">
                                                <img
                                                    src={currentPost.image}
                                                    alt={currentPost.title || "Cover"}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}

                                        {currentPost.excerpt && (
                                            <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
                                                {currentPost.excerpt}
                                            </p>
                                        )}

                                        <div
                                            className="blog-content space-y-4"
                                            dangerouslySetInnerHTML={{ __html: currentPost.content || "<p class='text-slate-400 italic'>Content will appear here...</p>" }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
