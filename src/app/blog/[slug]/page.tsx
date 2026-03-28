"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { getBlogPostBySlug, BlogPost } from "@/lib/blog-service";
import { Calendar, User, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function BlogPostDetail() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;

        const fetchPost = async () => {
            try {
                const fetchedPost = await getBlogPostBySlug(slug);
                if (fetchedPost && fetchedPost.isPublished) {
                    setPost(fetchedPost);
                } else {
                    // Not found or not published
                    setPost(null);
                }
            } catch (error) {
                console.error("Error fetching post:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [slug]);

    const formatDate = (date: Date | undefined) => {
        if (!date) return "";
        return new Intl.DateTimeFormat('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-white dark:bg-[#001A4D] transition-colors duration-300 flex items-center justify-center">
                <Navbar />
                <Loader2 className="w-12 h-12 text-gold-500 animate-spin" />
            </main>
        );
    }

    if (!post) {
        return (
            <main className="min-h-screen bg-white dark:bg-[#001A4D] transition-colors duration-300 flex flex-col pt-32 pb-20 px-4">
                <Navbar />
                <div className="max-w-2xl mx-auto text-center mt-20">
                    <AlertCircle className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-6" />
                    <h1 className="text-4xl font-bold text-navy-900 dark:text-white mb-4">Post Not Found</h1>
                    <p className="text-slate-500 dark:text-gray-400 mb-8 font-body">
                        The article you are looking for has been moved, unpublished, or doesn't exist.
                    </p>
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 bg-navy-900 dark:bg-white text-white dark:text-navy-900 px-8 py-4 rounded-xl font-bold transition-all hover:bg-navy-800 dark:hover:bg-slate-100"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Return to Insights
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white dark:bg-[#001A4D] transition-colors duration-300">
            <Navbar />

            <article className="pt-32 pb-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Back Button */}
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-slate-500 dark:text-gray-400 hover:text-navy-900 dark:hover:text-white transition-colors font-bold mb-12 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Insights
                    </Link>

                    {/* Header */}
                    <header className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="bg-navy-100 dark:bg-white/10 text-navy-900 dark:text-white tracking-widest text-xs font-bold uppercase px-4 py-2 rounded-full">
                                {post.category}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-navy-900 dark:text-white leading-tight mb-8">
                            {post.title}
                        </h1>

                        <div className="flex items-center gap-6 text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider py-6 border-y border-slate-200 dark:border-white/10">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gold-500" />
                                {post.author}
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gold-500" />
                                {formatDate(post.publishedAt)}
                            </div>
                        </div>
                    </header>

                    {/* Featured Image */}
                    {post.image && (
                        <div className="relative w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden mb-16 shadow-2xl">
                            <Image
                                src={post.image}
                                alt={post.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div
                        className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-gold-500 hover:prose-a:text-gold-600 font-body text-slate-600 dark:text-gray-300 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                </div>
            </article>

            <Footer />
        </main>
    );
}
