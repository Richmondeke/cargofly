"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { getBlogPosts, BlogPost } from "@/lib/firestore";
import { Calendar, User, ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function BlogIndex() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const publishedPosts = await getBlogPosts(true);
                setPosts(publishedPosts);
            } catch (error) {
                console.error("Error fetching blog posts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "";
        const date = timestamp.toDate();
        return new Intl.DateTimeFormat('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    };

    return (
        <main className="min-h-screen bg-white dark:bg-[#001A4D] transition-colors duration-300">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-navy-900/5 to-transparent dark:from-white/5 dark:to-transparent z-0" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-display font-bold text-navy-900 dark:text-white mb-6"
                    >
                        Cargofly <span className="text-gold-500">Insights</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-navy-900/60 dark:text-white/60 max-w-2xl mx-auto font-body"
                    >
                        Industry news, company updates, and expert insights into global aviation logistics.
                    </motion.p>
                </div>
            </section>

            {/* Blog Grid */}
            <section className="py-20 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="bg-gray-200 dark:bg-white/10 h-64 rounded-3xl mb-4"></div>
                                    <div className="bg-gray-200 dark:bg-white/10 h-6 rounded w-1/4 mb-4"></div>
                                    <div className="bg-gray-200 dark:bg-white/10 h-8 rounded w-3/4 mb-4"></div>
                                    <div className="bg-gray-200 dark:bg-white/10 h-20 rounded w-full"></div>
                                </div>
                            ))}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10">
                            <h3 className="text-2xl font-bold text-navy-900 dark:text-white mb-2">No articles yet</h3>
                            <p className="text-navy-900/60 dark:text-white/60">Check back later for industry insights and updates.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {posts.map((post, index) => (
                                <motion.article
                                    key={post.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group cursor-pointer bg-white dark:bg-navy-800 rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                                >
                                    <Link href={`/blog/${post.slug}`} className="flex-1 flex flex-col">
                                        <div className="relative h-64 overflow-hidden">
                                            <div className="absolute inset-0 bg-navy-900/20 group-hover:bg-transparent transition-colors z-10" />
                                            {post.image ? (
                                                <Image
                                                    src={post.image}
                                                    alt={post.title}
                                                    fill
                                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-slate-100 dark:bg-navy-700 flex items-center justify-center">
                                                    <span className="text-navy-900/20 dark:text-white/20 font-display">No image</span>
                                                </div>
                                            )}
                                            <div className="absolute top-4 left-4 z-20">
                                                <span className="bg-white/90 dark:bg-navy-900/90 backdrop-blur-sm text-navy-900 dark:text-white tracking-widest text-[10px] font-bold uppercase px-3 py-1.5 rounded-full">
                                                    {post.category}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-8 flex-1 flex flex-col">
                                            <div className="flex items-center gap-4 text-xs font-bold text-slate-400 dark:text-gray-400 mb-4 uppercase tracking-wider">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {formatDate(post.publishedAt)}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <User className="w-3.5 h-3.5" />
                                                    {post.author}
                                                </div>
                                            </div>

                                            <h2 className="text-2xl font-display font-bold text-navy-900 dark:text-white mb-4 group-hover:text-gold-500 transition-colors">
                                                {post.title}
                                            </h2>

                                            <p className="text-slate-500 dark:text-gray-400 font-body line-clamp-3 mb-8 flex-1">
                                                {post.excerpt}
                                            </p>

                                            <div className="flex items-center text-navy-900 dark:text-white font-bold text-sm tracking-wide group-hover:text-gold-500 transition-colors mt-auto">
                                                Read Article <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </Link>
                                </motion.article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
            <Footer />
        </main>
    );
}
