'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getAllTickets, updateTicketStatus, Ticket } from '@/lib/ticket-service';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Inbox, Clock, CheckCircle2, List, Shield, Zap, Info, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminSupportPage() {
    const { userProfile } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'open' | 'in-progress' | 'resolved'>('all');

    useEffect(() => {
        loadTickets();
    }, []);

    async function loadTickets() {
        try {
            const data = await getAllTickets();
            setTickets(data);
        } catch (error) {
            console.error('Error loading tickets:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredTickets = tickets.filter(t => {
        if (filter === 'all') return true;
        return t.status === filter;
    });



    const getPriorityBadge = (priority: Ticket['priority']) => {
        switch (priority) {
            case 'high': return <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded text-xs font-medium">High</span>;
            case 'medium': return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded text-xs font-medium">Medium</span>;
            case 'low': return <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded text-xs font-medium">Low</span>;
        }
    };

    const handleStatusChange = async (ticketId: string, status: Ticket['status']) => {
        try {
            await updateTicketStatus(ticketId, status);
            loadTickets();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    // Stats
    const openCount = tickets.filter(t => t.status === 'open').length;
    const inProgressCount = tickets.filter(t => t.status === 'in-progress').length;
    const unreadCount = tickets.filter(t => t.unreadByAdmin).length;

    const getCategoryIcon = (category: Ticket['category']) => {
        switch (category) {
            case 'shipment': return 'local_shipping';
            case 'payment': return 'payments';
            case 'duties': return 'gavel';
            case 'tracking': return 'location_on';
            case 'claims': return 'fact_check';
            case 'technical': return 'build';
            default: return 'help';
        }
    };

    if (userProfile?.role !== 'admin') {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-background-dark">
                <p className="text-slate-500">Access denied</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 h-full bg-slate-50 dark:bg-background-dark">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-[32px] font-bold text-[#1e293b] dark:text-white leading-tight">Support Tickets</h1>
                <p className="text-[14px] text-[#64748b] dark:text-slate-400 mt-1">Manage customer support requests</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                <Card variant="flat" className="p-6 border-none">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{tickets.length}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Tickets</div>
                        </div>
                        <div className="p-2 bg-slate-200/50 dark:bg-white/5 rounded-lg">
                            <List className="w-4 h-4 text-slate-500" />
                        </div>
                    </div>
                </Card>
                <Card variant="flat" className="p-6 border-none group hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-3xl font-black text-red-500 tracking-tighter">{openCount}</div>
                            <div className="text-[10px] font-black text-red-400/80 uppercase tracking-widest mt-1">Open Priority</div>
                        </div>
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <Inbox className="w-4 h-4 text-red-500" />
                        </div>
                    </div>
                </Card>
                <Card variant="flat" className="p-6 border-none group hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-3xl font-black text-amber-500 tracking-tighter">{inProgressCount}</div>
                            <div className="text-[10px] font-black text-amber-400/80 uppercase tracking-widest mt-1">Processing</div>
                        </div>
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Clock className="w-4 h-4 text-amber-500" />
                        </div>
                    </div>
                </Card>
                <Card variant="flat" className="p-6 border-none group hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-3xl font-black text-primary tracking-tighter">{unreadCount}</div>
                            <div className="text-[10px] font-black text-primary/80 uppercase tracking-widest mt-1">New Messages</div>
                        </div>
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Zap className="w-4 h-4 text-primary" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <DashboardTabs
                tabs={[
                    { id: 'all', label: 'All Tickets', icon: List },
                    { id: 'open', label: 'Open', icon: Inbox },
                    { id: 'in-progress', label: 'In Progress', icon: Clock },
                    { id: 'pending-customer', label: 'Pending Info', icon: Clock },
                    { id: 'resolved', label: 'Resolved', icon: CheckCircle2 },
                ]}
                activeTab={filter}
                onTabChange={(id) => setFilter(id as any)}
                className="mb-8"
            />

            {/* Ticket Table */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                        ))}
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="p-12 text-center">
                        <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4 block">
                            inbox
                        </span>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No tickets found</h3>
                        <p className="text-slate-500 dark:text-slate-400">
                            {filter === 'all' ? 'No support tickets yet.' : `No ${filter} tickets.`}
                        </p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ticket</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Updated</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredTickets.map((ticket) => (
                                <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            {ticket.unreadByAdmin && (
                                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
                                            )}
                                            <div>
                                                <span className="text-[10px] font-black text-slate-400 tracking-tighter uppercase">#{ticket.id}</span>
                                                <p className="font-bold text-slate-900 dark:text-white truncate max-w-[220px]">
                                                    {ticket.subject}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{ticket.userName}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 italic">{ticket.userEmail}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm text-slate-400">
                                                {getCategoryIcon(ticket.category)}
                                            </span>
                                            <span className="text-[11px] font-black text-slate-600 dark:text-white/70 uppercase tracking-widest">{ticket.category}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{getPriorityBadge(ticket.priority)}</td>
                                    <td className="px-6 py-4">
                                        <StatusPill
                                            status={ticket.status}
                                            interactive={true}
                                            onStatusChange={(s) => handleStatusChange(ticket.id, s as any)}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-slate-500">{ticket.updatedAt?.toLocaleDateString()}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            asChild
                                            className="font-bold text-primary hover:text-primary hover:bg-primary/5"
                                        >
                                            <Link href={`/dashboard/admin/support/${ticket.id}`} className="flex items-center gap-2">
                                                View Details
                                                <ChevronRight className="w-4 h-4" />
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
