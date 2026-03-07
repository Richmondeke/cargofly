'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getUserTickets, Ticket } from '@/lib/ticket-service';
import EmptyState from '@/components/common/EmptyState';

export default function SupportPage() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

    useEffect(() => {
        async function loadTickets() {
            if (!user) return;
            try {
                const data = await getUserTickets(user.uid);
                setTickets(data);
            } catch (error) {
                console.error('Error loading tickets:', error);
            } finally {
                setLoading(false);
            }
        }
        loadTickets();
    }, [user]);

    const filteredTickets = tickets.filter(t => {
        if (filter === 'all') return true;
        if (filter === 'open') return t.status === 'open' || t.status === 'in-progress';
        if (filter === 'resolved') return t.status === 'resolved' || t.status === 'closed';
        return true;
    });

    const getStatusColor = (status: Ticket['status']) => {
        switch (status) {
            case 'open': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'in-progress': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'resolved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'closed': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400';
        }
    };

    const getPriorityIcon = (priority: Ticket['priority']) => {
        switch (priority) {
            case 'high': return '🔴';
            case 'medium': return '🟡';
            case 'low': return '🟢';
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-8 h-full bg-slate-50 dark:bg-background-dark">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Support</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your support tickets</p>
                </div>
                <Link
                    href="/dashboard/support/new"
                    className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg"
                >
                    <span className="material-symbols-outlined">add</span>
                    New Ticket
                </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {(['all', 'open', 'resolved'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === f
                            ? 'bg-primary text-white'
                            : 'bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Ticket List */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="p-4">
                        <EmptyState
                            title="No tickets yet"
                            description="Need help? Create a support ticket and we'll get back to you."
                            imageSrc="/images/illustrations/ground_crew.jpg"
                            action={
                                <Link
                                    href="/dashboard/support/new"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all"
                                >
                                    <span className="material-symbols-outlined">add</span>
                                    Create Ticket
                                </Link>
                            }
                        />
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredTickets.map((ticket) => (
                            <Link
                                key={ticket.id}
                                href={`/dashboard/support/${ticket.id}`}
                                className="flex items-center gap-4 p-5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary">
                                        {ticket.category === 'shipping' ? 'local_shipping' :
                                            ticket.category === 'billing' ? 'receipt' :
                                                ticket.category === 'technical' ? 'build' : 'help'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono text-slate-400">#{ticket.id}</span>
                                        {ticket.unreadByUser && (
                                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        )}
                                    </div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                                        {ticket.subject}
                                    </h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Updated {ticket.updatedAt?.toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span title={ticket.priority}>{getPriorityIcon(ticket.priority)}</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                        {ticket.status.replace('-', ' ')}
                                    </span>
                                    <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
