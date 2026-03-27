import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusType =
    | 'pending'
    | 'confirmed'
    | 'picked_up'
    | 'in_transit'
    | 'at_hub'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled'
    | 'returned'
    | 'customs_hold'
    | 'resolved'
    | 'approved'
    | 'rejected'
    | 'under_review'
    | 'success'
    | 'failed'
    | 'pending_info'
    | 'closed';

interface StatusOption {
    value: string;
    label: string;
    variant: 'amber' | 'blue' | 'indigo' | 'sky' | 'purple' | 'teal' | 'emerald' | 'red' | 'slate';
}

const statusOptions: StatusOption[] = [
    { value: 'pending', label: 'Pending', variant: 'amber' },
    { value: 'confirmed', label: 'Confirmed', variant: 'blue' },
    { value: 'picked_up', label: 'Picked Up', variant: 'indigo' },
    { value: 'in_transit', label: 'In Transit', variant: 'sky' },
    { value: 'at_hub', label: 'At Hub', variant: 'purple' },
    { value: 'out_for_delivery', label: 'Out for Delivery', variant: 'teal' },
    { value: 'delivered', label: 'Delivered', variant: 'emerald' },
    { value: 'cancelled', label: 'Cancelled', variant: 'red' },
    { value: 'returned', label: 'Returned', variant: 'slate' },
    { value: 'customs_hold', label: 'Customs Hold', variant: 'amber' },
    { value: 'resolved', label: 'Resolved', variant: 'emerald' },
    { value: 'approved', label: 'Approved', variant: 'emerald' },
    { value: 'rejected', label: 'Rejected', variant: 'red' },
    { value: 'under_review', label: 'Under Review', variant: 'amber' },
    { value: 'success', label: 'Success', variant: 'emerald' },
    { value: 'failed', label: 'Failed', variant: 'red' },
    { value: 'pending_info', label: 'Pending Info', variant: 'indigo' },
    { value: 'closed', label: 'Closed', variant: 'slate' },
];

const variantStyles: Record<string, string> = {
    amber: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
    blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800",
    sky: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800",
    purple: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
    teal: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    slate: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800",
};

const dotStyles: Record<string, string> = {
    amber: "bg-amber-600 dark:bg-amber-500",
    blue: "bg-blue-600 dark:bg-blue-500",
    indigo: "bg-indigo-600 dark:bg-indigo-500",
    sky: "bg-sky-600 dark:bg-sky-500",
    purple: "bg-purple-600 dark:bg-purple-500",
    teal: "bg-teal-600 dark:bg-teal-500",
    emerald: "bg-emerald-600 dark:bg-emerald-500",
    red: "bg-red-600 dark:bg-red-500",
    slate: "bg-slate-600 dark:bg-slate-500",
};

interface StatusPillProps {
    status: string;
    interactive?: boolean;
    onStatusChange?: (newStatus: string) => void;
    loading?: boolean;
    className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
    status,
    interactive = false,
    onStatusChange,
    loading = false,
    className
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    let normalizedStatus = status.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
    if (normalizedStatus === 'pending_customer') normalizedStatus = 'pending_info';

    const currentOption = statusOptions.find(opt => opt.value === normalizedStatus) || {
        value: status,
        label: status,
        variant: 'slate' as const
    };

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            if (buttonRef.current && buttonRef.current.contains(target)) return;
            if ((target as Element).closest('[data-portal-dropdown="true"]')) return;
            setIsOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const content = (
        <>
            {loading ? (
                <span className="w-2 h-2 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
            ) : (
                <span className={cn("w-2 h-2 rounded-full mr-2", dotStyles[currentOption.variant])} />
            )}
            <span className="whitespace-nowrap font-medium text-[11px] uppercase tracking-wider">{currentOption.label}</span>
            {interactive && (
                <ChevronDown className={cn("w-3 h-3 ml-2 transition-transform", isOpen && "rotate-180")} />
            )}
        </>
    );

    const baseClasses = cn(
        "inline-flex items-center px-4 py-2 rounded-full border transition-all text-xs font-medium",
        variantStyles[currentOption.variant],
        interactive && "cursor-pointer hover:shadow-sm active:scale-[0.98]",
        className
    );

    return (
        <div className="inline-block">
            {interactive ? (
                <button
                    ref={buttonRef}
                    onClick={() => !loading && setIsOpen(!isOpen)}
                    disabled={loading}
                    className={baseClasses}
                >
                    {content}
                </button>
            ) : (
                <div className={baseClasses}>
                    {content}
                </div>
            )}

            {isOpen && interactive && typeof document !== 'undefined' && createPortal(
                <div
                    data-portal-dropdown="true"
                    style={{
                        position: 'fixed',
                        top: buttonRef.current ? buttonRef.current.getBoundingClientRect().bottom + 8 : 0,
                        left: buttonRef.current ? buttonRef.current.getBoundingClientRect().left : 0,
                        zIndex: 9999,
                        width: '200px'
                    }}
                >
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0, y: -5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -5, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden text-sm"
                        >
                            <div className="py-2 max-h-64 overflow-y-auto custom-scrollbar">
                                <div className="px-4 py-2 text-[10px] font-medium text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-800 z-10 border-b border-slate-100 dark:border-slate-700 mb-1">
                                    Update Status
                                </div>
                                {statusOptions.filter(opt => !['approved', 'rejected', 'under_review', 'success', 'failed'].includes(opt.value)).map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            onStatusChange?.(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors",
                                            option.value === normalizedStatus && "bg-slate-50 dark:bg-slate-700/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={cn("w-1.5 h-1.5 rounded-full", dotStyles[option.variant])} />
                                            <span className={cn("font-medium text-[11px] uppercase tracking-wider", (variantStyles[option.variant].split(' ')[1]))}>
                                                {option.label}
                                            </span>
                                        </div>
                                        {option.value === normalizedStatus && (
                                            <Check className="w-4 h-4 text-primary" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>,
                document.body
            )}
        </div>
    );
};
