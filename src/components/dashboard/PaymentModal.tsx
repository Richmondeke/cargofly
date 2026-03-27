'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    userId: string;
    shipmentId?: string;
    wallet?: { balanceUSD: number; balanceGBP: number } | null;
    currency?: string;
    description?: string;
    onSuccess?: () => void;
}

export default function PaymentModal({ isOpen, onClose, amount, userId, shipmentId, wallet, currency = 'USD', description = 'Payment', onSuccess }: PaymentModalProps) {
    const { user } = useAuth();
    const [selectedMethod, setSelectedMethod] = useState<'wallet_usd' | 'wallet_gbp' | 'card' | 'bank' | null>(null);
    const [loading, setLoading] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const isExternalMethod = selectedMethod === 'card' || selectedMethod === 'bank';

    const handlePayment = async () => {
        if (!selectedMethod) {
            setError('Please select a payment method');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // --- Wallet balance deductions (internal) ---
            if (selectedMethod === 'wallet_usd' || selectedMethod === 'wallet_gbp') {
                const response = await fetch('/api/payments/graph', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        amount,
                        currency: selectedMethod.includes('gbp') ? 'GBP' : 'USD',
                        method: selectedMethod,
                        description,
                        shipmentId
                    })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Payment failed');
                }

                if (onSuccess) onSuccess();
                onClose();
                return;
            }

            // --- Card / Bank Transfer → open Korapay checkout ---
            const returnPath = shipmentId
                ? `/dashboard/shipments`
                : `/dashboard/wallet`;

            const initRes = await fetch('/api/payments/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    currency: currency === 'NGN' ? 'NGN' : 'USD',
                    description,
                    customer: {
                        email: user?.email || 'user@cargofly.app',
                        name: user?.displayName || 'Cargofly User',
                    },
                    metadata: {
                        userId,
                        shipmentId,
                        returnPath,
                    }
                })
            });

            const initData = await initRes.json();

            if (!initData.status || !initData.data?.checkout_url) {
                throw new Error(initData.message || 'Could not open payment page. Please try again.');
            }

            // Store return path so the callback page knows where to redirect after verify
            sessionStorage.setItem('payment_return_path', returnPath);
            sessionStorage.setItem('payment_reference', initData.data.reference);

            setRedirecting(true);
            // Redirect to Korapay hosted checkout
            window.location.href = initData.data.checkout_url;

        } catch (err: unknown) {
            const error = err as { message?: string };
            setError(error.message || 'An unexpected error occurred during payment');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h2 className="text-xl font-medium text-slate-900 dark:text-white">Complete Payment</h2>
                        <p className="text-sm text-slate-500 mt-1">{description}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Amount Display */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center border-b border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-500 mb-1">Total to Pay</p>
                    <p className="text-4xl font-medium text-slate-900 dark:text-white tracking-tight">
                        {currency === 'USD' ? '$' : '£'}{amount.toFixed(2)}
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Select Payment Method</h3>

                    <div className="space-y-3">
                        {/* Wallet USD */}
                        <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedMethod === 'wallet_usd'
                            ? 'border-primary bg-primary/5'
                            : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                            }`}>
                            <div className="pt-0.5">
                                <input
                                    type="radio"
                                    name="payment_method"
                                    value="wallet_usd"
                                    checked={selectedMethod === 'wallet_usd'}
                                    onChange={(e) => setSelectedMethod(e.target.value as 'wallet_usd' | 'wallet_gbp' | 'card' | 'bank')}
                                    className="w-4 h-4 text-primary accent-primary"
                                />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-green-600 text-sm">payments</span>
                                        USD Wallet
                                    </span>
                                    <span className="text-sm text-slate-500">Balance: ${wallet?.balanceUSD.toFixed(2) || '0.00'}</span>
                                </div>
                                <p className="text-xs text-slate-500">Instant deduction from your virtual USD account.</p>
                            </div>
                        </label>

                        {/* Wallet GBP */}
                        <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedMethod === 'wallet_gbp'
                            ? 'border-primary bg-primary/5'
                            : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                            }`}>
                            <div className="pt-0.5">
                                <input
                                    type="radio"
                                    name="payment_method"
                                    value="wallet_gbp"
                                    checked={selectedMethod === 'wallet_gbp'}
                                    onChange={(e) => setSelectedMethod(e.target.value as 'wallet_usd' | 'wallet_gbp' | 'card' | 'bank')}
                                    className="w-4 h-4 text-primary accent-primary"
                                />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-indigo-600 text-sm">euro</span>
                                        GBP Wallet
                                    </span>
                                    <span className="text-sm text-slate-500">Balance: £{wallet?.balanceGBP.toFixed(2) || '0.00'}</span>
                                </div>
                                <p className="text-xs text-slate-500">Instant deduction from your virtual GBP account.</p>
                            </div>
                        </label>

                        {/* Credit/Debit Card */}
                        <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedMethod === 'card'
                            ? 'border-primary bg-primary/5'
                            : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                            }`}>
                            <div className="pt-0.5">
                                <input
                                    type="radio"
                                    name="payment_method"
                                    value="card"
                                    checked={selectedMethod === 'card'}
                                    onChange={(e) => setSelectedMethod(e.target.value as 'wallet_usd' | 'wallet_gbp' | 'card' | 'bank')}
                                    className="w-4 h-4 text-primary accent-primary"
                                />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center mb-1">
                                    <span className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-slate-600 text-sm">credit_card</span>
                                        Credit / Debit Card
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">Pay securely using an external card.</p>
                            </div>
                        </label>

                        {/* Bank Transfer */}
                        <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedMethod === 'bank'
                            ? 'border-primary bg-primary/5'
                            : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                            }`}>
                            <div className="pt-0.5">
                                <input
                                    type="radio"
                                    name="payment_method"
                                    value="bank"
                                    checked={selectedMethod === 'bank'}
                                    onChange={(e) => setSelectedMethod(e.target.value as 'wallet_usd' | 'wallet_gbp' | 'card' | 'bank')}
                                    className="w-4 h-4 text-primary accent-primary"
                                />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center mb-1">
                                    <span className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-slate-600 text-sm">account_balance</span>
                                        Bank Transfer
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">Transfer directly from your bank to our account.</p>
                            </div>
                        </label>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">error</span>
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePayment}
                        disabled={loading || redirecting || !selectedMethod}
                        className="flex-1 px-4 py-3 font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {redirecting ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                Opening checkout...
                            </>
                        ) : loading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                Processing...
                            </>
                        ) : isExternalMethod ? (
                            <>
                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                                Pay with {selectedMethod === 'card' ? 'Card' : 'Bank Transfer'}
                            </>
                        ) : (
                            `Pay ${currency === 'USD' ? '$' : '£'}${amount.toFixed(2)}`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
