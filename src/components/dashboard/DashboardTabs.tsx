import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface Tab {
    id: string;
    label: string;
    icon?: LucideIcon | any; // Support Lucide icons or material-symbols strings
}

interface DashboardTabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (id: string) => void;
    className?: string;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({
    tabs,
    activeTab,
    onTabChange,
    className
}) => {
    return (
        <div className={cn(
            "inline-flex gap-1 p-1 bg-slate-100/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-x-auto no-scrollbar max-w-full",
            className
        )}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            "relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 whitespace-nowrap outline-none",
                            isActive
                                ? "text-slate-900 dark:text-white bg-white dark:bg-slate-700 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="activeTabBackground"
                                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg"
                                initial={false}
                                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                style={{ zIndex: 0 }}
                            />
                        )}

                        <div className="relative z-10 flex items-center gap-2">
                            {Icon && (
                                typeof Icon === 'string' ? (
                                    <span className={cn("material-symbols-outlined text-[18px] leading-none", isActive ? "text-primary dark:text-sky-400" : "")}>{Icon}</span>
                                ) : (
                                    <Icon className={cn("w-4 h-4", isActive ? "text-primary dark:text-sky-400" : "")} />
                                )
                            )}
                            <span>{tab.label}</span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};
