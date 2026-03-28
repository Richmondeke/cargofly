"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { getBlogPosts, BlogPost } from "@/lib/blog-service";
import { ArrowRight, Calendar, User } from "lucide-react";

export default function BlogSection() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const allPosts = await getBlogPosts(true);
                setPosts(allPosts.slice(0, 3)); // Get latest 3
            } catch (error) {
                console.error("Error fetching blog posts for homepage:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    if (!loading && posts.length === 0) return null;

    const formatDate = (date: Date | undefined) => {
        if (!date) return "";
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    };

    return (
        <section className="py-24 bg-black relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-gold-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-navy-500/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div>
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-gold-500 font-bold tracking-[0.2em] text-xs uppercase mb-3 block"
                        >
                            Insights & News
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-3xl md:text-5xl font-display font-medium text-white leading-tight"
                        >
                            Latest from <span className="text-gold-500">Cargofly</span>
                        </motion.h2>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <Link
                            href="/blog"
                            className="group flex items-center gap-2 text-white/60 hover:text-gold-500 transition-colors font-medium border-b border-white/10 pb-1"
                        >
                            View All Articles
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {loading ? (
                        [1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse">
                                <div className="bg-white/5 h-64 rounded-2xl mb-6"></div>
                                <div className="h-4 bg-white/5 w-1/4 mb-4"></div>
                                <div className="h-8 bg-white/5 w-3/4 mb-4"></div>
                                <div className="h-20 bg-white/5 w-full"></div>
                            </div>
                        ))
                    ) : (
                        posts.map((post, index) => (
                            <motion.article
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="group flex flex-col"
                            >
                                <Link href={`/blog/${post.slug}`} className="flex-1 flex flex-col">
                                    <div className="relative h-64 rounded-2xl overflow-hidden mb-6">
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors duration-500 z-10" />
                                        {post.image ? (
                                            <Image
                                                src={post.image}
                                                alt={post.title}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-navy-900 flex items-center justify-center">
                                                <span className="text-white/20 font-display">No image</span>
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4 z-20">
                                            <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10">
                                                {post.category}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col">
                                        <div className="flex items-center gap-4 text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3 h-3 text-gold-500" />
                                                {formatDate(post.publishedAt)}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <User className="w-3 h-3 text-gold-500" />
                                                {post.author}
                                            </span>
                                        </div>

                                        <h3 className="text-xl md:text-2xl font-display font-medium text-white mb-4 group-hover:text-gold-500 transition-colors leading-snug">
                                            {post.title}
                                        </h3>

                                        <p className="text-white/50 font-body text-sm line-clamp-3 mb-6">
                                            {post.excerpt}
                                        </p>

                                        <div className="mt-auto flex items-center gap-2 text-gold-500 text-sm font-bold uppercase tracking-widest group-hover:gap-3 transition-all duration-300">
                                            Read More
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </Link>
                            </motion.article>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
