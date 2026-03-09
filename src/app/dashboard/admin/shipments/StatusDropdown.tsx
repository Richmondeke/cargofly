import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusDropdownProps {
    currentStatus: string;
    onStatusChange: (newStatus: string) => void;
    loading?: boolean;
}

const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'text-amber-600 bg-amber-50 hover:bg-amber-100' },
    { value: 'confirmed', label: 'Confirmed', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
    { value: 'picked_up', label: 'Picked Up', color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' },
    { value: 'in_transit', label: 'In Transit', color: 'text-sky-600 bg-sky-50 hover:bg-sky-100' },
    { value: 'at_hub', label: 'At Hub', color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
    { value: 'out_for_delivery', label: 'Out for Delivery', color: 'text-teal-600 bg-teal-50 hover:bg-teal-100' },
    { value: 'delivered', label: 'Delivered', color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-red-600 bg-red-50 hover:bg-red-100' },
    { value: 'returned', label: 'Returned', color: 'text-slate-600 bg-slate-50 hover:bg-slate-100' },
    { value: 'customs_hold', label: 'Customs Hold', color: 'text-amber-600 bg-amber-50 hover:bg-amber-100' },
];

export default function StatusDropdown({ currentStatus, onStatusChange, loading = false }: StatusDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Update position when opening
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const updatePosition = () => {
                const rect = buttonRef.current?.getBoundingClientRect();
                if (rect) {
                    setPosition({
                        top: rect.bottom + window.scrollY + 8, // 8px gap
                        left: rect.left + window.scrollX,
                        width: 200 // Fixed width for dropdown
                    });
                }
            };

            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);

            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isOpen]);

    // Close on click outside (handling portal)
    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            // Check if click is inside button
            if (buttonRef.current && buttonRef.current.contains(target)) {
                return;
            }
            // Check if click is inside dropdown (we'll attach a distinctive class or ID to portal content if needed, 
            // but effectively we can just listen for clicks in the portal wrapper if we had a ref to it.
            // Simplified: The portal div isn't in this ref tree. 
            // So we rely on the fact that the portal renders into body.
            // We can check if the click target is within a specific data-attribute we set on the dropdown.
            if ((target as Element).closest('[data-portal-dropdown="true"]')) {
                return;
            }

            setIsOpen(false);
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const currentOption = statusOptions.find(opt => opt.value === currentStatus) || {
        value: currentStatus,
        label: currentStatus,
        color: 'text-slate-600 bg-slate-50'
    };

    return (
        <>
            <button
                ref={buttonRef}
                onClick={() => !loading && setIsOpen(!isOpen)}
                disabled={loading}
                className={cn(
                    "relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                    currentOption.color.split(' ')[0], // Text color
                    currentOption.color.split(' ')[1], // Bg color
                    "border-transparent hover:border-current/20",
                    loading && "opacity-50 cursor-not-allowed"
                )}
            >
                {loading ? (
                    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                    <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                )}
                <span className="whitespace-nowrap">{currentOption.label}</span>
                <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && typeof document !== 'undefined' && createPortal(
                <div
                    data-portal-dropdown="true"
                    style={{
                        position: 'fixed', // Fixed ensures it stays relative to viewport, handling interactions better
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
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden text-sm"
                        >
                            <div className="py-1 max-h-64 overflow-y-auto custom-scrollbar">
                                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider sticky top-0 bg-white dark:bg-slate-800 z-10">
                                    Select Status
                                </div>
                                {statusOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            onStatusChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors",
                                            option.value === currentStatus && "bg-slate-50 dark:bg-slate-700/50"
                                        )}
                                    >
                                        <span className={cn(
                                            "font-medium",
                                            option.color.split(' ')[0] // Text color
                                        )}>
                                            {option.label}
                                        </span>
                                        {option.value === currentStatus && (
                                            <Check className="w-4 h-4 text-slate-400" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>,
                document.body
            )}
        </>
    );
}

