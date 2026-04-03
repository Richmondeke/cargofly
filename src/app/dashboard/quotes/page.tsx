'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getQuotes, Quote } from '@/lib/dashboard-service';
import EmptyState from '@/components/common/EmptyState';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

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
            <DashboardHeader
                title="Saved Quotes"
                subtitle="Manage your saved shipping estimates"
            >
                <button
                    onClick={() => router.push('/ship')}
                    className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:-translate-y-1 hover:scale-[1.02] transition-all active:scale-[0.98] cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    New Quote
                </button>
            </DashboardHeader>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : quotes.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                    {quotes.map((quote) => (
                        <div key={quote.id} className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-widest group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        {quote.serviceType}
                                    </span>
                                    <span className="text-sm text-slate-400">
                                        Created {quote.createdAt?.toDate ? quote.createdAt.toDate().toLocaleDateString() : 'Unknown'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-xl font-bold text-black dark:text-white mb-2 group-hover:text-primary transition-colors">
                                    <span>{quote.origin}</span>
                                    <span className="material-symbols-outlined text-slate-300 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                    <span>{quote.destination}</span>
                                </div>
                                <div className="flex gap-6 text-sm text-slate-500">
                                    <span>{quote.weight} kg</span>
                                    <span className={new Date() > (quote.expiresAt?.toDate ? quote.expiresAt.toDate() : new Date()) ? 'text-red-500' : 'text-green-500'}>
                                        Expires: {quote.expiresAt?.toDate ? quote.expiresAt.toDate().toLocaleDateString() : 'Unknown'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3 min-w-[150px]">
                                <span className="text-3xl font-medium text-primary">${quote.price.toFixed(2)}</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => router.push('/dashboard/new-booking')} // In real app, pre-fill booking
                                        className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold uppercase tracking-tight hover:scale-[1.05] transition-all shadow-lg active:scale-95"
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
