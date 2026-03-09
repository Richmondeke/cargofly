'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface MobileHeaderProps {
    onOpenConfig: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onOpenConfig }) => {
    const { userProfile } = useAuth();

    return (
        <div className="md:hidden flex items-center justify-between px-6 py-4 bg-white dark:bg-navy-900 border-b border-slate-200 dark:border-navy-700 sticky top-0 z-30">
            <div className="flex items-center gap-3">
                <button
                    onClick={onOpenConfig}
                    className="p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                >
                    <span className="material-symbols-outlined text-2xl">menu</span>
                </button>
                <img
                    src="/logo-light.png"
                    alt="Cargofly"
                    className="h-6 w-auto block dark:hidden"
                />
                <img
                    src="/logo-dark.png"
                    alt="Cargofly"
                    className="h-6 w-auto hidden dark:block"
                />
            </div>

            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center text-slate-500 font-bold text-sm">
                {userProfile?.displayName?.charAt(0) || 'U'}
            </div>
        </div>
    );
};

export default MobileHeader;
