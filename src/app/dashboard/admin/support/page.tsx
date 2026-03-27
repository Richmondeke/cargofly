'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getAllTickets, updateTicketStatus, Ticket, createTicket } from '@/lib/ticket-service';
import { getCustomers, TeamMember } from '@/lib/dashboard-service';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import SupportBanner from '@/components/dashboard/SupportBanner';
import {
    Inbox, Clock, CheckCircle2, List, Shield, Zap, Info, ChevronRight,
    Plus, Search, MoreHorizontal, MessageSquare, History, Reply, X, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function AdminSupportPage() {
    const { userProfile } = useAuth();
    const router = useRouter();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'open' | 'in-progress' | 'resolved'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // New Ticket Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [allUsers, setAllUsers] = useState<TeamMember[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
    const [newTicketSubject, setNewTicketSubject] = useState('');
    const [newTicketMessage, setNewTicketMessage] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadTickets();
        loadUsers();
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

    async function loadUsers() {
        try {
            const data = await getCustomers();
            setAllUsers(data);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    const filteredTickets = tickets.filter(t => {
        const matchesFilter = filter === 'all' || t.status === filter;
        const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.userName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const searchedUsers = allUsers.filter(u =>
        u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    ).slice(0, 5);

    const handleCreateTicket = async () => {
        if (!selectedUser || !newTicketSubject || !newTicketMessage) {
            toast.error('Please fill in all fields');
            return;
        }

        setCreating(true);
        try {
            const ticketId = await createTicket({
                userId: selectedUser.uid,
                userEmail: selectedUser.email,
                userName: selectedUser.displayName,
                subject: newTicketSubject,
                category: 'general',
                priority: 'medium',
                description: newTicketMessage,
            });
            toast.success('Ticket created successfully');
            setShowCreateModal(false);
            setSelectedUser(null);
            setNewTicketSubject('');
            setNewTicketMessage('');
            router.push(`/dashboard/admin/support/${ticketId}`);
        } catch (error) {
            console.error('Error creating ticket:', error);
            toast.error('Failed to create ticket');
        } finally {
            setCreating(false);
        }
    };

    const getPriorityBadge = (priority: Ticket['priority']) => {
        switch (priority) {
            case 'low': return <span className="px-3 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded text-[10px] font-medium uppercase tracking-wider">Low</span>;
            default: return <span className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded text-[10px] font-medium uppercase tracking-wider">Critical</span>;
        }
    };

    // Stats
    const openCount = tickets.filter(t => t.status === 'open').length;
    const resolvedCount = tickets.filter(t => t.status === 'resolved').length;

    if (userProfile?.role !== 'admin') {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-background-dark">
                <p className="text-slate-500">Access denied</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-8 h-full bg-slate-50 dark:bg-background-dark">
            <div className="max-w-7xl mx-auto">
                {/* New Banner Header */}
                <SupportBanner />

                {/* Premium Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <Card variant="flat" className="p-8 border-none bg-white dark:bg-surface-dark shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl">
                                        <List className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <div className="text-xs font-medium text-slate-400 uppercase tracking-widest">Total Tickets</div>
                                </div>
                                <div className="text-5xl font-display font-medium text-slate-900 dark:text-white tracking-tighter mb-2">{tickets.length}</div>
                                <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-500">
                                    <Zap className="w-3 h-3 fill-current" />
                                    +12% from last month
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card variant="flat" className="p-8 border-none bg-white dark:bg-surface-dark border-l-4 border-orange-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-orange-50 dark:bg-orange-950/20 rounded-xl">
                                        <Inbox className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <div className="text-xs font-medium text-slate-400 uppercase tracking-widest">Open</div>
                                </div>
                                <div className="text-5xl font-display font-medium text-slate-900 dark:text-white tracking-tighter mb-2">{openCount}</div>
                                <div className="text-[11px] font-medium text-slate-400">Requiring immediate attention</div>
                            </div>
                        </div>
                    </Card>

                    <Card variant="flat" className="p-8 border-none bg-white dark:bg-surface-dark shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div className="text-xs font-medium text-slate-400 uppercase tracking-widest">Resolved</div>
                                </div>
                                <div className="text-5xl font-display font-medium text-slate-900 dark:text-white tracking-tighter mb-2">{resolvedCount}</div>
                                <div className="text-[11px] font-medium text-slate-400">Average resolution time: 4.2h</div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Table Section */}
                <div className="bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                    {/* Table Header with Title and Search */}
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                        <div>
                            <h2 className="text-2xl font-display font-medium text-slate-900 dark:text-white tracking-tighter mb-1">Support Tickets</h2>
                            <p className="text-sm text-slate-500 font-medium">Manage and track your cargo inquiries and technical issues</p>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search tickets..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>
                            <Button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-orange-500 hover:bg-orange-600 text-white font-medium h-11 px-6 rounded-xl flex items-center gap-2 border-none"
                            >
                                <Plus className="w-4 h-4" />
                                Create New Ticket
                            </Button>
                        </div>
                    </div>
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
                            <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">No tickets found</h3>
                            <p className="text-slate-500 dark:text-slate-400">
                                {filter === 'all' ? 'No support tickets yet.' : `No ${filter} tickets.`}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="text-left px-8 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-[0.15em]">Ticket ID</th>
                                    <th className="text-left px-8 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-[0.15em]">Subject</th>
                                    <th className="text-left px-8 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-[0.15em]">Priority</th>
                                    <th className="text-left px-8 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-[0.15em]">Status</th>
                                    <th className="text-left px-8 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-[0.15em]">Last Updated</th>
                                    <th className="text-right px-8 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-[0.15em]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {filteredTickets.map((ticket) => (
                                    <tr key={ticket.id} className="group hover:bg-slate-50/80 dark:hover:bg-primary/5 transition-all">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                {ticket.unreadByAdmin && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)] flex-shrink-0" />
                                                )}
                                                <span className="text-xs font-medium text-slate-400 tracking-tighter uppercase whitespace-nowrap">#TK-{ticket.id.slice(0, 4)}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="max-w-[300px]">
                                                <p className="font-medium text-slate-900 dark:text-white leading-tight mb-0.5">
                                                    {ticket.subject}
                                                </p>
                                                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                                                    {ticket.userName}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {getPriorityBadge(ticket.priority)}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    ticket.status === 'open' ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" :
                                                        ticket.status === 'in-progress' ? "bg-blue-500" : "bg-emerald-500"
                                                )} />
                                                <span className="text-xs font-medium text-slate-700 dark:text-white/80 capitalize">
                                                    {ticket.status.replace('-', ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-medium text-slate-500 italic">
                                                14 mins ago
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <Button
                                                    onClick={() => router.push(`/dashboard/admin/support/${ticket.id}`)}
                                                    variant="outline"
                                                    size="sm"
                                                    className={cn(
                                                        "h-9 px-5 rounded-lg font-medium text-xs transition-all",
                                                        ticket.status === 'open'
                                                            ? "border-orange-100 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                                                            : "border-slate-100 text-slate-600 hover:bg-slate-50"
                                                    )}
                                                >
                                                    {ticket.status === 'open' ? 'Reply' : 'View History'}
                                                </Button>
                                                <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* Pagination Footer */}
                    {!loading && filteredTickets.length > 0 && (
                        <div className="px-8 py-6 bg-slate-50/30 dark:bg-white/5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                                Showing <span className="text-slate-900 dark:text-white">1-{Math.min(filteredTickets.length, 10)}</span> of <span className="text-slate-900 dark:text-white">{filteredTickets.length}</span> tickets
                            </div>

                            <div className="flex items-center gap-2">
                                <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-white dark:hover:bg-white/5 transition-all">
                                    <ChevronRight className="w-4 h-4 rotate-180" />
                                </button>
                                <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-white dark:hover:bg-white/5 transition-all">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create New Ticket Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="text-xl font-display font-medium text-slate-900 dark:text-white tracking-tight">Initiate Support Channel</h3>
                                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Create a proactive support ticket for a user</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* User Selection */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Select User</label>
                                {selectedUser ? (
                                    <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-medium text-sm">
                                                {selectedUser.displayName[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white text-sm">{selectedUser.displayName}</p>
                                                <p className="text-xs text-slate-500">{selectedUser.email}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedUser(null)} className="text-[10px] font-medium text-slate-400 hover:text-red-500 uppercase tracking-wider">Change</button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search by name or email..."
                                                value={userSearch}
                                                onChange={(e) => setUserSearch(e.target.value)}
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>

                                        {userSearch && searchedUsers.length > 0 && (
                                            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xl">
                                                {searchedUsers.map(u => (
                                                    <button
                                                        key={u.uid}
                                                        onClick={() => setSelectedUser(u)}
                                                        className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700 text-left border-b last:border-none border-slate-50 dark:border-slate-700 transition-colors"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center font-medium text-xs text-slate-600 dark:text-slate-300">
                                                            {u.displayName[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-900 dark:text-white text-xs">{u.displayName}</p>
                                                            <p className="text-[10px] text-slate-500">{u.email}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Ticket Details */}
                            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Inquiry Subject</label>
                                    <input
                                        type="text"
                                        placeholder="Brief title of the issue"
                                        value={newTicketSubject}
                                        onChange={(e) => setNewTicketSubject(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Initial Message</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Provide context or instructions for the user..."
                                        value={newTicketMessage}
                                        onChange={(e) => setNewTicketMessage(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 pt-4 bg-slate-50/50 dark:bg-slate-800/50 flex gap-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 h-12 rounded-2xl text-sm font-medium uppercase tracking-widest border-slate-200 text-slate-600"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateTicket}
                                disabled={creating || !selectedUser || !newTicketSubject || !newTicketMessage}
                                className="flex-[2] h-12 bg-primary text-white rounded-2xl text-sm font-medium uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                {creating ? 'Initiating...' : 'Open Support Ticket'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
