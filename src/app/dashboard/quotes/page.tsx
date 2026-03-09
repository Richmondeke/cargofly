'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getQuotes, Quote } from '@/lib/dashboard-service';
import EmptyState from '@/components/common/EmptyState';
import { useRouter } from 'next/navigation';

export default function QuotesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchQuotes() {
            if (!user) return;
            try {
                const data = await getQuotes(user.uid);
                setQuotes(data);
            } catch (error) {
                console.error('Error fetching quotes:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchQuotes();
    }, [user]);

    return (
        <div className="flex-1 overflow-y-auto p-8 h-full bg-slate-50 dark:bg-background-dark">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl sm:text-[32px] font-bold text-[#1e293b] dark:text-white leading-tight">Saved Quotes</h1>
                    <p className="text-[14px] text-[#64748b] dark:text-slate-400 mt-1">Manage your saved shipping estimates</p>
                </div>
                <button
                    onClick={() => router.push('/ship')}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">add</span>
                    New Quote
                </button>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : quotes.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                    {quotes.map((quote) => (
                        <div key={quote.id} className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition-shadow">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
                                        {quote.serviceType}
                                    </span>
                                    <span className="text-sm text-slate-400">
                                        Created {quote.createdAt?.toDate ? quote.createdAt.toDate().toLocaleDateString() : 'Unknown'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-lg font-bold text-slate-900 dark:text-white mb-2">
                                    <span>{quote.origin}</span>
                                    <span className="material-symbols-outlined text-slate-300">arrow_forward</span>
                                    <span>{quote.destination}</span>
                                </div>
                                <div className="flex gap-6 text-sm text-slate-500">
                                    <span>{quote.weight} kg</span>
                                    <span>{quote.dimensions?.length}x{quote.dimensions?.width}x{quote.dimensions?.height} cm</span>
                                    <span className={new Date() > (quote.expiresAt?.toDate ? quote.expiresAt.toDate() : new Date()) ? 'text-red-500' : 'text-green-500'}>
                                        Expires: {quote.expiresAt?.toDate ? quote.expiresAt.toDate().toLocaleDateString() : 'Unknown'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3 min-w-[150px]">
                                <span className="text-3xl font-bold text-primary">${quote.price.toFixed(2)}</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => router.push('/dashboard/new-booking')} // In real app, pre-fill booking
                                        className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                                    >
                                        Book Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm border-dashed">
                    <EmptyState
                        title="No saved quotes"
                        description="Get a quote for your shipment and save it for later to lock in the price."
                        imageSrc="/images/illustrations/logistics_checklist.jpg"
                        action={
                            <button
                                onClick={() => router.push('/ship')}
                                className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Get a Quote
                            </button>
                        }
                    />
                </div>
            )}
        </div>
    );
}
