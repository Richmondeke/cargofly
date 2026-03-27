'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { MessageSquare } from 'lucide-react';

interface SupportBannerProps {
    className?: string;
}

export default function SupportBanner({ className }: SupportBannerProps) {
    return (
        <div className={`relative w-full rounded-2xl overflow-hidden mb-8 min-h-[280px] shadow-2xl ${className}`}>
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                style={{ backgroundImage: 'url("/images/hero-plane.jpg")' }}
            />
            <div className="absolute inset-0 bg-navy-900/80 dark:bg-black/80" />

            {/* Content Overlay */}
            <div className="relative h-full flex items-center px-8 sm:px-12 py-12">
                <div className="max-w-2xl">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#FFCA00]/10 border border-[#FFCA00]/30 text-[#FFCA00] text-[10px] font-medium uppercase tracking-[0.2em] mb-4">
                        <span className="relative flex h-2 w-2 mr-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFCA00] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFCA00]"></span>
                        </span>
                        Premium Support
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-display font-medium text-white tracking-tighter mb-4 leading-tight">
                        24/7 Priority <br />
                        <span className="text-[#FFCA00]">Air Cargo</span> Support
                    </h1>

                    <p className="text-slate-300 text-lg max-w-lg leading-relaxed font-medium">
                        Our global logistics experts are standing by to assist with your most critical shipments.
                    </p>
                </div>

                {/* Action Button */}
                <div className="ml-auto hidden md:block">
                    <Button
                        size="lg"
                        className="bg-[#FFCA00] hover:bg-[#FFCA00]/90 text-navy-900 font-medium px-8 h-14 rounded-xl shadow-xl transition-all hover:-translate-y-1 flex items-center gap-3 border-none"
                    >
                        <MessageSquare className="w-5 h-5" />
                        Chat with Agent
                    </Button>
                </div>
            </div>
        </div>
    );
}
