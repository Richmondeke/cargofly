'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface TransitionContextType {
    isExiting: boolean;
    isLoading: boolean;
    startExitAnimation: (href: string) => void;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export function TransitionProvider({ children }: { children: ReactNode }) {
    const [isExiting, setIsExiting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const startExitAnimation = (href: string) => {
        if (pathname === href) return;

        setIsExiting(true);
        setIsLoading(true);

        // Animate out duration: Match this with your Framer Motion exit duration
        setTimeout(() => {
            router.push(href);
            // Wait a slight tick for router to catch up before resetting
            setTimeout(() => {
                setIsExiting(false);
                setIsLoading(false);
            }, 500); // Increased delay to ensure visibility of the Lottie animation
        }, 500); // 500ms duration for the exit animation
    };

    return (
        <TransitionContext.Provider value={{ isExiting, isLoading, startExitAnimation }}>
            {children}
        </TransitionContext.Provider>
    );
}

export function useTransition() {
    const context = useContext(TransitionContext);
    if (context === undefined) {
        throw new Error('useTransition must be used within a TransitionProvider');
    }
    return context;
}
