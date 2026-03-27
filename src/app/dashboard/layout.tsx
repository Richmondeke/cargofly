"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileHeader from '@/components/dashboard/MobileHeader';
import LoadingAnimation from '@/components/common/LoadingAnimation';
import { useAuth } from '@/contexts/AuthContext';
import { useTransition } from '@/contexts/TransitionContext';

import { NotificationProvider } from '@/contexts/NotificationContext';
import NotificationSidebar from '@/components/dashboard/NotificationSidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const { isLoading } = useTransition();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return <LoadingAnimation />;
    }

    if (!user) {
        return null; // Will redirect via useEffect
    }

    return (
        <NotificationProvider>
            <div className="flex h-screen w-full flex-row overflow-hidden bg-background-light dark:bg-background-dark">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                <main className="flex-1 flex flex-col h-full overflow-hidden relative md:ml-72">
                    {isLoading && <LoadingAnimation />}
                    <MobileHeader onOpenConfig={() => setIsSidebarOpen(true)} />
                    {children}
                </main>
                <NotificationSidebar />
            </div>
        </NotificationProvider>
    );
}
