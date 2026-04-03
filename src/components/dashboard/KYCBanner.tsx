"use client";

import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

interface KYCBannerProps {
    onCompleteKYC?: () => void;
}

export function KYCBanner({ onCompleteKYC }: KYCBannerProps) {
    return (
        <section className="relative overflow-hidden rounded-3xl bg-[#016FFF] p-8 sm:p-12 flex items-center justify-between group min-h-[320px] shadow-2xl shadow-sky-900/20">
            {/* Motif Background Overlay */}
            <div
                className="absolute inset-0 z-0 pointer-events-none bg-repeat opacity-40 mix-blend-overlay"
                style={{
                    backgroundImage: "url('/Cargofly motif_transparent.png')",
                    backgroundSize: '280px'
                }}
            />

            <div className="z-10 relative space-y-8 w-full sm:w-2/3">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center p-2 bg-gold-500 rounded-xl shadow-lg shadow-gold-500/20">
                        <ShieldCheck className="w-5 h-5 text-navy-900" />
                    </span>
                    <span className="text-white/90 text-xs font-bold uppercase tracking-[0.2em]">
                        Requirement: graph.finance
                    </span>
                </div>

                <div className="space-y-3">
                    <h2 className="text-white text-4xl sm:text-5xl font-display font-bold leading-[1.1] tracking-tight">
                        Identity <br /> Verification
                    </h2>
                    <p className="text-white/90 max-w-lg text-lg leading-relaxed font-medium">
                        Complete your KYC verification to unlock full wallet functionality and secure your financial assets.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                        onClick={onCompleteKYC}
                        className="bg-gold-500 text-black px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:brightness-110 hover:scale-[1.02] transition-all shadow-2xl shadow-gold-500/30 active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                        Complete KYC
                    </button>
                    <Link href="/dashboard/support">
                        <button className="w-full bg-white/10 backdrop-blur-3xl text-white border border-white/20 px-10 py-4 rounded-2xl font-bold text-sm hover:bg-white/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap">
                            Learn More
                        </button>
                    </Link>
                </div>
            </div>

            {/* Visual Element */}
            <div
                className="absolute right-0 top-0 h-full w-1/3 sm:w-1/2 opacity-100 pointer-events-none transition-transform group-hover:scale-105 duration-1000 z-10"
                style={{
                    backgroundImage: "url('/Cargofly.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    maskImage: 'linear-gradient(to left, black 20%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to left, black 20%, transparent 100%)'
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-[#016FFF]/80 to-transparent" />
            </div>
        </section>
    );
}

export default KYCBanner;

