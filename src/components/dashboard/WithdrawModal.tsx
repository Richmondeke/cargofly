'use client';

import React, { useState } from 'react';
import { withdrawFunds } from '@/lib/wallet-service';

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    wallet?: { balanceUSD: number; balanceGBP: number } | null;
    onSuccess?: () => void;
}

export default function WithdrawModal({ isOpen, onClose, userId, wallet, onSuccess }: WithdrawModalProps) {
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState<'USD' | 'GBP'>('USD');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [sortCode, setSortCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        const withdrawAmount = parseFloat(amount);

        if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        const balance = currency === 'USD' ? wallet?.balanceUSD : wallet?.balanceGBP;
        if (!balance || withdrawAmount > balance) {
            setError(`Insufficient ${currency} balance`);
            return;
        }

        if (!bankName || !accountNumber) {
            setError('Please provided bank details');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await withdrawFunds(
                userId,
                withdrawAmount,
                currency,
                `Withdrawal to ${bankName} (${accountNumber})`
            );

            if (onSuccess) onSuccess();
            onClose();
            // Reset form
            setAmount('');
            setBankName('');
            setAccountNumber('');
            setSortCode('');
        } catch (err: any) {
            setError(err.message || 'Withdrawal failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h2 className="text-xl font-medium text-slate-900 dark:text-white">Withdraw Funds</h2>
                        <p className="text-sm text-slate-500 mt-1">Transfer money to your bank account</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleWithdraw} className="p-6 overflow-y-auto flex-1 space-y-4">
                    {/* Currency Toggle */}
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setCurrency('USD')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${currency === 'USD'
                                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                : 'text-slate-500'}`}
                        >
                            USD Account
                        </button>
                        <button
                            type="button"
                            onClick={() => setCurrency('GBP')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${currency === 'GBP'
                                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                : 'text-slate-500'}`}
                        >
                            GBP Account
                        </button>
                    </div>

                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-1">Available Balance</p>
                        <p className="text-2xl font-medium text-slate-900 dark:text-white">
                            {currency === 'USD' ? '$' : '£'}{currency === 'USD' ? wallet?.balanceUSD.toFixed(2) : wallet?.balanceGBP.toFixed(2)}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount to Withdraw</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                                {currency === 'USD' ? '$' : '£'}
                            </span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-8 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-widest">Bank Details</h3>
                        <div>
                            <input
                                type="text"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                placeholder="Bank Name"
                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="text"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                placeholder="Account Number"
                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                required
                            />
                            <input
                                type="text"
                                value={sortCode}
                                onChange={(e) => setSortCode(e.target.value)}
                                placeholder="Sort Code / Swift"
                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">error</span>
                            {error}
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !amount}
                            className="flex-1 px-4 py-3 font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                            ) : (
                                'Withdraw'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
