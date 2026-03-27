'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Search, Package, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface TrackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function TrackModal({ isOpen, onClose }: TrackModalProps) {
    const [trackingNumber, setTrackingNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const validateTracking = (value: string): boolean => {
        // Basic validation - alphanumeric, 8-20 characters
        const pattern = /^[A-Za-z0-9-]{8,20}$/;
        return pattern.test(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const trimmed = trackingNumber.trim();
        if (!trimmed) {
            setError('Please enter a tracking number');
            return;
        }

        if (!validateTracking(trimmed)) {
            setError('Invalid tracking number format');
            return;
        }

        setIsLoading(true);

        // Simulate API call or validation
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setIsLoading(false);
        onClose();
        router.push(`/dashboard/track/${encodeURIComponent(trimmed)}`);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Track Shipment" maxWidth="max-w-md">
            <div className="space-y-6">
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-4">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <Package size={20} />
                    </div>
                    <div>
                        <h4 className="font-medium text-slate-900 dark:text-white text-sm">Real-time GPS Tracking</h4>
                        <p className="text-xs text-slate-500 mt-1">Enter your tracking ID to see exactly where your cargo is right now.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <label className="text-[10px] font-medium uppercase tracking-widest text-slate-500 mb-1.5 block">Tracking Number</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                                track_changes
                            </span>
                            <input
                                type="text"
                                value={trackingNumber}
                                onChange={(e) => {
                                    setTrackingNumber(e.target.value.toUpperCase());
                                    if (error) setError('');
                                }}
                                placeholder="e.g. CF-2025-8473629"
                                required
                                className={cn(
                                    "w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all text-base font-mono font-medium tracking-wider",
                                    error && "border-red-500/50 focus:border-red-500"
                                )}
                                maxLength={20}
                            />
                        </div>
                        {error && (
                            <p className="mt-2 text-xs text-red-500 font-medium flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">error</span>
                                {error}
                            </p>
                        )}
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-primary text-white rounded-2xl font-medium text-sm hover:brightness-110 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                <>
                                    <span>Track Shipment</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-center text-xs text-slate-400">
                        Can't find your tracking number? Check your confirmation email or contact support.
                    </p>
                </div>
            </div>
        </Modal>
    );
}
