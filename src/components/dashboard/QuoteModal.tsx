'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Plane, Ship, Truck, Package, MapPin } from 'lucide-react';

interface QuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function QuoteModal({ isOpen, onClose }: QuoteModalProps) {
    const [service, setService] = useState('air');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSubmitting(false);
        setIsSuccess(true);

        // Reset and close after a delay
        setTimeout(() => {
            setIsSuccess(false);
            onClose();
        }, 2500);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isSuccess ? "" : "Request a Quote"} maxWidth="max-w-lg">
            {isSuccess ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="size-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Package size={40} />
                    </div>
                    <div>
                        <h3 className="text-xl font-medium text-slate-900 dark:text-white">Quote Request Sent!</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Our logistics experts are reviewing your request. <br /> You'll receive a detailed quote via email within 2 hours.</p>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ... (rest of the form stays the same) */}
                    {/* Service Selection */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { id: 'air', label: 'Air', icon: Plane },
                            { id: 'sea', label: 'Sea', icon: Ship },
                            { id: 'road', label: 'Road', icon: Truck },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setService(item.id)}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${service === item.id
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-200 dark:hover:border-slate-700'
                                    }`}
                            >
                                <item.icon size={24} className="mb-2" />
                                <span className="text-xs font-medium uppercase tracking-wider">{item.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Route */}
                    <div className="space-y-4">
                        <div className="relative">
                            <label className="text-[10px] font-medium uppercase tracking-widest text-slate-500 mb-1.5 block">Origin</label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="City or Airport (e.g. Lagos, LOS)"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-slate-900 rounded-xl outline-none transition-all text-sm font-medium"
                                />
                            </div>
                        </div>
                        <div className="relative">
                            <label className="text-[10px] font-medium uppercase tracking-widest text-slate-500 mb-1.5 block">Destination</label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="City or Airport (e.g. London, LHR)"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-slate-900 rounded-xl outline-none transition-all text-sm font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Cargo Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-medium uppercase tracking-widest text-slate-500 block">Total Weight (KG)</label>
                            <div className="relative">
                                <Package size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    required
                                    min="1"
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-slate-900 rounded-xl outline-none transition-all text-sm font-medium"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-medium uppercase tracking-widest text-slate-500 block">Item Count</label>
                            <input
                                type="number"
                                placeholder="1"
                                required
                                min="1"
                                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-slate-900 rounded-xl outline-none transition-all text-sm font-medium"
                            />
                        </div>
                    </div>

                    {/* Dimensions (Simplified) */}
                    <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10">
                        <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400 mb-3">Optional Details</p>
                        <textarea
                            placeholder="Additional details (oversized cargo, special handling, etc.)"
                            className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 focus:border-primary/50 rounded-lg outline-none transition-all text-sm font-medium min-h-[80px] resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3.5 bg-primary text-white rounded-xl font-medium text-sm hover:brightness-110 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                    Requesting...
                                </>
                            ) : (
                                'Get Quote'
                            )}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
