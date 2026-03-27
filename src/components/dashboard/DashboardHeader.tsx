'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
    title: string;
    subtitle?: string;
    backUrl?: string;
    children?: React.ReactNode;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, subtitle, backUrl, children }) => {
    const { userProfile, signOut } = useAuth();
    const { toggleSidebar, unreadCount } = useNotifications();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const router = useRouter();
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const initials = (userProfile?.displayName ?
        userProfile.displayName.split(' ').map(n => n[0]).join('') :
        'U'
    ).toUpperCase().slice(0, 2);

    return (
        <div className="flex flex-col mb-8 relative">
            <div className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        {backUrl && (
                            <button
                                onClick={() => router.push(backUrl)}
                                className="p-2 -ml-2 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                            >
                                <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                            </button>
                        )}
                        <h1 className="text-2xl sm:text-[32px] font-medium text-[#1e293b] dark:text-white leading-tight truncate">
                            {title}
                        </h1>
                    </div>
                    {subtitle && (
                        <p className={cn("text-[14px] text-[#64748b] dark:text-slate-400 mt-1 truncate", backUrl && "ml-10")}>
                            {subtitle}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-4 ml-4">
                    {/* Local Actions (e.g. Tabs) */}
                    {children && (
                        <div className="hidden xl:block mr-2">
                            {children}
                        </div>
                    )}

                    {/* Notification Bell */}
                    <button
                        onClick={toggleSidebar}
                        className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined text-[24px]">notifications</span>
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#F8FAFC] dark:border-background-dark"></span>
                        )}
                    </button>

                    {/* Profile Menu */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-medium text-sm hover:ring-2 hover:ring-primary/20 transition-all shadow-sm"
                        >
                            {initials}
                        </button>

                        <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-navy-900 rounded-xl shadow-xl border border-slate-200 dark:border-navy-700 py-2 z-50"
                                >
                                    <div className="px-4 py-2 border-b border-slate-100 dark:border-navy-800 mb-1">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                            {userProfile?.displayName || 'User'}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">
                                            {userProfile?.role || 'Guest'}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            router.push('/dashboard/settings');
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800 flex items-center gap-2 transition-colors"
                                    >
                                        <User className="w-4 h-4" />
                                        Profile
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            router.push('/dashboard/settings?tab=security');
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800 flex items-center gap-2 transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Settings
                                    </button>
                                    <div className="h-px bg-slate-100 dark:border-navy-800 my-1 mx-2" />
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Mobile Local Actions */}
            {children && (
                <div className="xl:hidden mt-4 w-full overflow-x-auto pb-2">
                    {children}
                </div>
            )}
        </div>
    );
};

export default DashboardHeader;
