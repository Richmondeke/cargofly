"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    features: string[];
    href: string;
    featured?: boolean;
}

export default function ServiceCard({
    icon,
    title,
    description,
    features,
    href,
    featured = false,
}: ServiceCardProps) {
    return (
        <motion.div
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
                "group relative rounded-2xl overflow-hidden transition-all duration-500",
                featured
                    ? "bg-[#FFCA00]/10 border border-[#FFCA00]/30 dark:bg-[#4196FF]/10 dark:border-[#4196FF]/30"
                    : "bg-navy-900/5 border border-navy-900/10 hover:border-[#FFCA00]/30 dark:bg-white/5 dark:border-white/10 dark:hover:border-[#FFCA00]/50"
            )}
        >
            {/* Featured Badge */}
            {featured && (
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gold-500 text-navy-900 text-xs font-bold uppercase tracking-wider">
                    Popular
                </div>
            )}

            <div className="p-8">
                {/* Icon */}
                <div
                    className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-300",
                        featured
                            ? "bg-gold-500 text-navy-900"
                            : "bg-white/5 text-gold-400 group-hover:bg-gold-500/20"
                    )}
                >
                    {icon}
                </div>

                {/* Content */}
                <h3 className="font-display text-xl text-navy-900 dark:text-white mb-3">{title}</h3>
                <p className="text-navy-900/70 dark:text-white/70 text-sm font-body leading-relaxed mb-6">
                    {description}
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3">
                            <div
                                className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                                    featured
                                        ? "bg-gold-500/20 text-navy-900 dark:text-gold-400"
                                        : "bg-navy-900/5 text-navy-900/60 dark:bg-white/5 dark:text-white/60"
                                )}
                            >
                                <Check className="w-3 h-3" />
                            </div>
                            <span className="text-sm text-navy-900/80 dark:text-white/70 font-body">{feature}</span>
                        </li>
                    ))}
                </ul>

            </div>

            {/* Hover Glow Effect */}
            <div
                className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                    "bg-transparent"
                )}
            />
        </motion.div>
    );
}
