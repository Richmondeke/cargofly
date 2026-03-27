'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Copy, CheckCircle2, ShieldCheck, Landmark } from 'lucide-react';
import toast from 'react-hot-toast';

interface BankDetails {
    account_name: string;
    account_number: string;
    bank_name: string;
    routing_number?: string;
    swift_code?: string;
    currency: string;
}

interface BankDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BankDetailsModal({ isOpen, onClose }: BankDetailsModalProps) {
    const [details, setDetails] = useState<BankDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchDetails();
        }
    }, [isOpen]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/payments/graph/bank-details');
            const data = await res.json();
            setDetails(data);
        } catch (error) {
            console.error('Failed to fetch bank details:', error);
            toast.error('Failed to load bank details');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast.success(`${field} copied to clipboard`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            <div className="relative bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 border border-slate-100 dark:border-white/5 overflow-hidden transform transition-all">
                {/* Header Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full transform translate-x-8 -translate-y-8"></div>

                <div className="p-8">
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group">
                                <Landmark className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            </div>
                            <div>
                                <h3 className="font-display font-medium text-xl text-[#1b1c1c] dark:text-white uppercase tracking-tight">Virtual Account</h3>
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Global Settlement Network</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-400"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Details...</p>
                        </div>
                    ) : details ? (
                        <div className="space-y-6">
                            {/* Account Card Look */}
                            <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5 space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Account Name</p>
                                    <div className="flex justify-between items-center group">
                                        <p className="font-medium text-slate-900 dark:text-white text-base">{details.account_name}</p>
                                        <button
                                            onClick={() => copyToClipboard(details.account_name, 'Account Name')}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-all"
                                        >
                                            {copiedField === 'Account Name' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Account Number</p>
                                    <div className="flex justify-between items-center group">
                                        <p className="font-mono font-medium text-slate-900 dark:text-primary text-xl tracking-wider leading-none">
                                            {details.account_number}
                                        </p>
                                        <button
                                            onClick={() => copyToClipboard(details.account_number, 'Account Number')}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-all"
                                        >
                                            {copiedField === 'Account Number' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 pt-2">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Bank Name</p>
                                        <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">{details.bank_name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Currency</p>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">{details.currency}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Supplementary Info */}
                            <div className="grid grid-cols-2 gap-4">
                                {details.routing_number && (
                                    <div className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 space-y-1 group">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-[8px] font-medium text-slate-400 uppercase tracking-widest">Routing No</p>
                                            <button onClick={() => copyToClipboard(details.routing_number!, 'Routing Number')}>
                                                <Copy className="w-3 h-3 text-slate-300 hover:text-primary transition-colors" />
                                            </button>
                                        </div>
                                        <p className="font-medium text-slate-900 dark:text-white text-xs">{details.routing_number}</p>
                                    </div>
                                )}
                                {details.swift_code && (
                                    <div className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 space-y-1 group">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-[8px] font-medium text-slate-400 uppercase tracking-widest">Swift Code</p>
                                            <button onClick={() => copyToClipboard(details.swift_code!, 'Swift Code')}>
                                                <Copy className="w-3 h-3 text-slate-300 hover:text-primary transition-colors" />
                                            </button>
                                        </div>
                                        <p className="font-medium text-slate-900 dark:text-white text-xs">{details.swift_code}</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-indigo-50/50 dark:bg-primary/5 rounded-2xl border border-indigo-100/50 dark:border-primary/10 flex gap-3 items-start">
                                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm shrink-0">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-medium text-indigo-900 dark:text-primary uppercase tracking-widest">Secured Infrastructure</p>
                                    <p className="text-[10px] font-medium text-slate-500 leading-relaxed uppercase tracking-tighter">
                                        This account is unique to you. Funds deposited will be automatically reconciled to your wallet.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 text-center text-slate-400">
                            <p className="text-xs uppercase font-medium tracking-widest">Error materializing data</p>
                        </div>
                    )}

                    <div className="mt-8">
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-[#1b1c1c] dark:bg-indigo-600 text-white rounded-2xl font-display font-medium text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-navy-900/10"
                        >
                            Return to Wallet
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
