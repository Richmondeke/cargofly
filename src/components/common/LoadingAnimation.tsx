'use client';

import React from 'react';
import Lottie from 'lottie-react';
import animationData from '../../../public/animations/Simple-Dot-remix.json';
import { cn } from "@/lib/utils";

interface LoadingAnimationProps {
    isSplash?: boolean;
}

const LoadingAnimation = ({ isSplash = false }: LoadingAnimationProps) => {
    return (
        <div className={cn(
            "fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500",
            isSplash ? "bg-white" : "bg-white/80 backdrop-blur-sm"
        )}>
            <div className="w-64 h-64">
                <Lottie
                    animationData={animationData}
                    loop={true}
                    autoplay={true}
                />
            </div>
        </div>
    );
};

export default LoadingAnimation;
