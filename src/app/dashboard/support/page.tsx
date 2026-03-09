'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getUserTickets, Ticket } from '@/lib/ticket-service';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LifeBuoy, Plus, MessageSquare, Clock, CheckCircle2, ChevronRight, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="text-left">
                    <h1 className="text-2xl sm:text-[32px] font-bold text-[#1e293b] dark:text-white leading-tight">Support</h1>
                    <p className="text-[14px] text-[#64748b] dark:text-slate-400 mt-1 font-medium italic">We&apos;re here to help you with your logistics</p>
                </div>
                <Button
                    asChild
                    className="w-full sm:w-auto"
                >
                    <Link href="/dashboard/support/new" className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        New Ticket
                    </Link>
                </Button>
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
                    <div className="grid grid-cols-1 gap-6">
                        {filteredTickets.map((ticket) => (
                            <Link key={ticket.id} href={`/dashboard/support/${ticket.id}`} className="group block">
                                <Card variant="default" className="p-6 group-hover:border-primary/50 group-hover:shadow-xl transition-all border-none shadow-md shadow-slate-200/40 dark:shadow-none">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="flex gap-4 items-start text-left">
                                            <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl group-hover:bg-primary/5 transition-colors">
                                                <MessageCircle className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">#{ticket.id}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{ticket.category}</span>
                                                </div>
                                                <h4 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors tracking-tight">
                                                    {ticket.subject}
                                                </h4>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <div className="flex items-center gap-1 text-xs text-slate-500 font-medium italic">
                                                        <Clock className="w-3 h-3" />
                                                        Updated {ticket.updatedAt?.toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                                                        <span className={cn(
                                                            "w-2 h-2 rounded-full",
                                                            ticket.priority === 'high' ? "bg-red-500" :
                                                                ticket.priority === 'medium' ? "bg-amber-500" : "bg-green-500"
                                                        )} />
                                                        <span className="capitalize">{ticket.priority}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between sm:justify-end">
                                            <StatusPill status={ticket.status} />
                                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
