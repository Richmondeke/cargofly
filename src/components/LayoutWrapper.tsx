'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingAnimation from "@/components/common/LoadingAnimation";
import { useTransition } from "@/contexts/TransitionContext";
import { cn } from "@/lib/utils";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const [showSplash, setShowSplash] = useState(true);
    const pathname = usePathname();
    const { isLoading } = useTransition();

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 3500);
        return () => clearTimeout(timer);
    }, []);

    const isDashboard = pathname?.startsWith('/dashboard');

    if (isDashboard) {
        // Dashboard has its own layout, don't wrap with Navbar/Footer
        return (
            <>
                {showSplash && <LoadingAnimation isSplash />}
                {children}
            </>
        );
    }

    const isLanding = pathname === '/' || pathname === '/b' || pathname === '/c';

    return (
        <div className={cn("min-h-screen relative", isLanding ? "bg-white dark:bg-navy-900" : "bg-transparent")}>
            {isLanding && <div className="fixed inset-0 bg-motif opacity-0 dark:opacity-30 pointer-events-none z-0" />}
            <div className="relative z-10 w-full">
                {(showSplash || isLoading) && <LoadingAnimation isSplash={showSplash} />}
                <Navbar />
                <main>{children}</main>
                <Footer isLanding={isLanding} />
            </div>
        </div>
    );
}
