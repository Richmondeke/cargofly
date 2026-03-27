'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getUserTickets, Ticket } from '@/lib/ticket-service';

/* ── Helpers ───────────────────────────────────────────────── */
function priorityStyle(p: string) {
    if (p === 'high') return 'bg-rose-50 text-rose-600';
    if (p === 'medium') return 'bg-amber-50 text-amber-600';
    return 'bg-emerald-50 text-emerald-600';
}

function statusDot(s: string) {
    if (s === 'open') return 'bg-blue-500';
    if (s === 'in-progress') return 'bg-amber-500';
    if (s === 'resolved') return 'bg-emerald-500';
    return 'bg-slate-400';
}

function statusLabel(s: string) {
    const map: Record<string, string> = {
        'open': 'Open',
        'in-progress': 'In Progress',
        'resolved': 'Resolved',
        'closed': 'Closed',
        'pending-customer': 'Awaiting Response',
    };
    return map[s] ?? s;
}

function timeAgo(date: Date | undefined): string {
    if (!date) return '—';
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

const TABS = ['All', 'Open', 'In Progress', 'Resolved'];
const PAGE_SIZE = 8;

/* ── Page ───────────────────────────────────────────────────── */
export default function TicketsPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        if (!user?.uid) return;
        setLoading(true);
        getUserTickets(user.uid)
            .then(setTickets)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user?.uid]);

    /* ── Filtering ── */
    const filtered = tickets.filter((t) => {
        // Tab
        if (activeTab === 'Open' && t.status !== 'open') return false;
        if (activeTab === 'In Progress' && t.status !== 'in-progress') return false;
        if (activeTab === 'Resolved' && t.status !== 'resolved' && t.status !== 'closed') return false;
        // Search
        const q = searchQuery.toLowerCase();
        if (q && !t.subject.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q)) return false;
        return true;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    /* ── Stats ── */
    const openCount = tickets.filter((t) => t.status === 'open' || t.status === 'in-progress').length;
    const awaitingCount = tickets.filter((t) => t.status === 'pending-customer').length;
    const resolvedCount = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;

    const stats = [
        { label: 'Open', value: openCount, color: 'text-[#003399]', bg: 'bg-[#003399]/10', icon: 'confirmation_number' },
        { label: 'Awaiting My Response', value: awaitingCount, color: 'text-tertiary-container', bg: 'bg-tertiary-container/10', icon: 'pending_actions' },
        { label: 'Resolved', value: resolvedCount, color: 'text-green-600', bg: 'bg-green-100', icon: 'check_circle' },
    ];

    return (
        <div className="flex-1 overflow-y-auto bg-[#fbf9f8] relative min-h-screen">
            {/* Background motif */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: 'url(https://lh3.googleusercontent.com/aida-public/AB6AXuAw5RwnItKFfrFWWL4ViJD7cHiuxKNv556NDYXaQTNuVwYNclhVjaKCqFgczyFX5QDnZ0_WdzuH_E9Whd6AZBZE138MHh-7dB_O0Cjwz96j668K565S02cwCjyJrZviFMRoT1Nl5nOhb_tQPllW416gJw_PJXZw1qdB5dubson4aMunQFoep26NSD6IN8Bo23uLSR0A6U65JKM3JYjIHzw7NQELOTi1MBrwZtc-hlaHkzM2Ujts6NBhAZceqOU6SizRW3pdMRZlOpQk)',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'bottom right',
                    backgroundSize: '40%',
                }}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-display font-medium text-3xl tracking-tighter text-[#1b1c1c] uppercase">Support Tickets</h2>
                        <p className="font-display font-medium tracking-tight text-slate-500 text-sm mt-1">Manage and track your support inquiries</p>
                    </div>
                    <Link
                        href="/dashboard/support/new"
                        className="bg-primary text-white py-3 px-6 rounded-xl font-medium text-sm flex items-center gap-2 shadow-lg hover:bg-navy-800 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Create New Ticket
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat) => (
                        <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                                    <span className="material-symbols-outlined">{stat.icon}</span>
                                </div>
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Last 30 Days</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-4xl font-display font-medium tracking-tighter ${stat.color}`}>
                                    {stat.value.toString().padStart(2, '0')}
                                </span>
                                <span className="text-slate-500 font-medium">{stat.label}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Ticket Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Table Header / Filters */}
                    <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
                            {TABS.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setPage(1); }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-white text-[#003399] shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 20 }}>search</span>
                                <input
                                    type="text"
                                    placeholder="Search tickets..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                    className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm w-full focus:ring-2 focus:ring-[#003399]/10 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table Body */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Ticket ID</th>
                                    <th className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Subject</th>
                                    <th className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Category</th>
                                    <th className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Priority</th>
                                    <th className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Last Activity</th>
                                    <th className="px-6 py-4" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={7} className="px-6 py-4">
                                                <div className="h-5 bg-slate-100 animate-pulse rounded-lg w-full" />
                                            </td>
                                        </tr>
                                    ))
                                ) : paged.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <span className="material-symbols-outlined text-4xl text-slate-300">confirmation_number</span>
                                                <p className="text-sm font-medium text-slate-500">
                                                    {searchQuery ? 'No tickets match your search.' : 'No tickets yet.'}
                                                </p>
                                                {!searchQuery && (
                                                    <Link
                                                        href="/dashboard/support/new"
                                                        className="mt-2 inline-flex items-center gap-2 bg-[#003399] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#003399]/90 transition-all"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">add</span>
                                                        Create your first ticket
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paged.map((ticket) => (
                                        <tr
                                            key={ticket.id}
                                            onClick={() => router.push(`/dashboard/support/${ticket.id}`)}
                                            className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-display font-medium text-[#003399] text-sm">{ticket.id}</span>
                                                {ticket.unreadByUser && (
                                                    <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-[#003399] align-middle" />
                                                )}
                                            </td>
                                            <td className="px-6 py-4 max-w-xs">
                                                <span className="font-medium text-slate-900 text-sm line-clamp-1">{ticket.subject}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest capitalize">{ticket.category}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wider ${priorityStyle(ticket.priority)}`}>
                                                    {ticket.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`size-1.5 rounded-full ${statusDot(ticket.status)}`} />
                                                    <span className="text-xs font-medium text-slate-600">{statusLabel(ticket.status)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                                    {timeAgo(ticket.updatedAt)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-slate-300 group-hover:text-[#003399] transition-colors">
                                                    <span className="material-symbols-outlined">chevron_right</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                            Showing {paged.length} of {filtered.length} ticket{filtered.length !== 1 ? 's' : ''}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30"
                            >
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-[#003399] text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    {p}
                                </button>
                            ))}
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30"
                            >
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
