"use client";

import { useState, useEffect } from "react";
import { getBlogPosts, createBlogPost, deleteBlogPost, BlogPost } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Timestamp } from "firebase/firestore";
import { Plus, Trash2, Edit, AlertCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const DUMMY_POSTS = [
    {
        title: "Introducing Cargofly 3: The Future of Logistics",
        slug: "introducing-cargofly-3",
        excerpt: "We are thrilled to announce the launch of Cargofly 3, a complete overhaul of our logistics platform designed to optimize your supply chain like never before.",
        content: "<p>Welcome to the next generation of global shipping. With Cargofly 3, we have reimagined the entire logistics experience from the ground up...</p><p>Key features include real-time blockchain tracking, AI-powered predictive routing, and a completely redesigned user interface that puts you in control.</p>",
        category: "Announcements",
        author: "Cargofly Team",
        image: "/images/globe-network.jpg",
        isPublished: true,
    },
    {
        title: "Navigating West African Customs: A 2026 Guide",
        slug: "navigating-west-african-customs",
        excerpt: "Cross-border shipping in West Africa can be complex. Learn how Cargofly's dedicated regional teams simplify customs clearance and reduce transit times.",
        content: "<p>The Economic Community of West African States (ECOWAS) has made strides in streamlining trade, but practical challenges remain. Our latest guide covers everything you need to know about documentation, tariffs, and exactly how Cargofly handles the heavy lifting for you.</p>",
        category: "Industry Insights",
        author: "Sarah O.",
        image: "/images/logistics_checklist.jpg",
        isPublished: true,
    },
    {
        title: "Sustainable Aviation: How We're Cutting Emissions",
        slug: "sustainable-aviation-emissions",
        excerpt: "Logistics shouldn't cost the earth. Discover the steps Cargofly is taking to reduce our carbon footprint, from route optimization to biofuels.",
        content: "<p>As a leader in aviation freight, we recognize our responsibility to the environment. This year, we've pledged to reduce our operational emissions by 15% through a combination of more efficient flight routing and investments in sustainable aviation fuel (SAF).</p>",
        category: "Sustainability",
        author: "Cargofly Team",
        image: "/images/aircraft_hangar.jpg",
        isPublished: true,
    }
];

export default function AdminBlogPage() {
    const { userProfile } = useAuth();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);

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

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this post?")) return;

        try {
            await deleteBlogPost(id);
            toast.success("Post deleted");
            setPosts(posts.filter(p => p.id !== id));
        } catch (error) {
            console.error("Error deleting post:", error);
            toast.error("Failed to delete post");
        }
    };

    if (userProfile?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-navy-900">Access Denied</h2>
                <p className="text-gray-500 mt-2">You must be an administrator to view this page.</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-display font-bold text-navy-900">Blog Management</h1>
                    <p className="text-gray-500 font-body">Create, edit, and manage pubic blog posts.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleSeedDummyData}
                        disabled={seeding}
                        className="bg-navy-900/5 hover:bg-navy-900/10 text-navy-900 px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {seeding ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        Generate Dummy Posts
                    </button>
                    <button className="bg-gold-500 hover:bg-gold-600 text-navy-900 px-6 py-2 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-sm">
                        <Plus className="w-5 h-5" />
                        Create New Post
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex justify-center text-gray-400">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
            ) : posts.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-navy-900" />
                    </div>
                    <h3 className="text-xl font-bold text-navy-900 mb-2">No Blog Posts Found</h3>
                    <p className="text-gray-500 mb-6">You haven't published any articles yet.</p>
                    <button
                        onClick={handleSeedDummyData}
                        className="text-gold-500 font-bold hover:underline"
                    >
                        Click here to seed "Introducing Cargofly 3" dummy posts
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="p-4 text-sm font-bold text-navy-900">Title</th>
                                <th className="p-4 text-sm font-bold text-navy-900">Author</th>
                                <th className="p-4 text-sm font-bold text-navy-900">Category</th>
                                <th className="p-4 text-sm font-bold text-navy-900">Status</th>
                                <th className="p-4 text-sm font-bold text-navy-900 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.map((post) => (
                                <tr key={post.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-navy-900">{post.title}</div>
                                        <div className="text-xs text-gray-500 mt-1">{post.slug}</div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">{post.author}</td>
                                    <td className="p-4">
                                        <span className="bg-gray-100 text-gray-600 py-1 px-3 rounded-full text-xs font-medium">
                                            {post.category}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`py-1 px-3 rounded-full text-xs font-bold ${post.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {post.isPublished ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-2 text-gray-400 hover:text-navy-900 transition-colors rounded-lg hover:bg-gray-100">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(post.id!)}
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
