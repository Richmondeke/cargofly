import React from 'react';
import Image from 'next/image';

interface AuthLayoutProps {
    children: React.ReactNode;
    imageSrc?: string;
    title?: string;
    subtitle?: string;
}

export default function AuthLayout({
    children,
    imageSrc = "/images/hero-aircraft.png",
    title,
    subtitle
}: AuthLayoutProps) {
    return (
        <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950">
            {/* Left Side - Image */}
            <div className="hidden lg:block w-1/2 relative bg-slate-900">
                <Image
                    src={imageSrc}
                    alt="Auth Background"
                    fill
                    className="object-cover opacity-90"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex flex-col justify-end p-12 text-white">
                    {/* Optional Caption Overlay */}
                    <div className="max-w-md">
                        <h2 className="text-3xl font-bold mb-4">{title || "Manage your logistics with confidence"}</h2>
                        <p className="text-slate-300 text-lg leading-relaxed">
                            {subtitle || "Track shipments, manage bookings, and view analytics all in one place."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
                <div className="w-full max-w-[480px] space-y-8 bg-white dark:bg-slate-900 p-10 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                    {children}
                </div>
            </div>
        </div>
    );
}
