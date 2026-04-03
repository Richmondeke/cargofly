'use client';

import React, { useEffect, useState } from 'react';
import {
    getCustomers,
    getRecentActivities,
    formatActivityTime,
    TeamMember,
    Activity,
    getDashboardStats,
    getActiveShipments,
    DashboardShipment
} from '@/lib/dashboard-service';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const { userProfile } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<TeamMember[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [recentShipments, setRecentShipments] = useState<DashboardShipment[]>([]);
    const [stats, setStats] = useState({ totalShipments: 0, inTransit: 0, delivered: 0, totalRevenue: 0, pending: 0 });

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersData, activityData, statsData, shipmentsData] = await Promise.all([
                getCustomers(),
                getRecentActivities(undefined, 'admin', 10),
                getDashboardStats(),
                getActiveShipments(undefined, 'admin', 'all'),
            ]);
            setUsers(usersData);
            setActivities(activityData);
            setStats(statsData);
            setRecentShipments(shipmentsData.slice(0, 5));
        } catch (error) {
            console.error('Error loading admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleViewShipments = (userId: string) => {
        router.push(`/dashboard/admin/shipments?userId=${userId}`);
    };

    const isAdmin = userProfile?.role === 'admin';

    if (!isAdmin) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-[#0f172a]">
                <div className="text-center max-w-md px-6">
                    <span className="material-symbols-outlined text-6xl text-slate-400 mb-4 block">lock</span>
                    <h2 className="text-2xl font-medium text-slate-900 dark:text-white mb-2">Access Restricted</h2>
                    <p className="text-slate-500 mb-6">You need admin privileges to access this page.</p>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 text-left">
                        <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2 uppercase tracking-wider">Developer Note:</p>
                        <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">If you are testing and need admin access, you can promote your account using the setup tool.</p>
                        <Button
                            onClick={() => router.push('/admin-setup')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Go to Admin Setup
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto h-full bg-slate-50 dark:bg-[#0f172a] p-8">
            <div className="max-w-7xl mx-auto">

                {/* ── Top Header Bar ──────────────────────────────────────────────── */}
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight font-display">
                            Dashboard
                        </h1>
                        <p className="text-xs font-medium text-slate-500">Real-time global logistics oversight</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-navy-800 dark:bg-navy-700 flex items-center justify-center text-white font-medium text-sm border-2 border-slate-100 dark:border-white/10 shadow-sm cursor-pointer hover:border-primary/50 transition-all">
                            {userProfile?.displayName?.split(' ').map(n => n[0]).join('') || 'RE'}
                        </div>
                    </div>
                </header>

                {/* ── 4-Metric Stats ────────────────────────────────────────────── */}
                <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Global Shipments', value: stats.totalShipments.toLocaleString(), icon: 'flight', color: 'blue', path: '/dashboard/admin/shipments' },
                        { label: 'In Transit', value: stats.inTransit.toLocaleString(), icon: 'explore', color: 'emerald', path: '/dashboard/admin/shipments?filter=in_transit' },
                        { label: 'Pending Action', value: stats.pending.toLocaleString(), icon: 'history', color: 'gold', path: '/dashboard/admin/shipments?filter=pending' },
                        { label: 'Total Revenue', value: stats.totalRevenue ? `$${(stats.totalRevenue).toLocaleString()}` : '$0', icon: 'payments', color: 'sky', path: '/dashboard/financial' }
                    ].map((stat, idx) => (
                        <div
                            key={idx}
                            onClick={() => router.push(stat.path)}
                            className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 dark:border-white/5 relative overflow-hidden group cursor-pointer hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 active:scale-[0.98]"
                        >
                            <div className={`absolute top-0 left-0 w-1 h-full bg-${stat.color}-500 opacity-0 group-hover:opacity-100 transition-opacity`} />
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 flex items-center justify-center`}>
                                    <span className={`material-symbols-outlined text-lg text-${stat.color}-600 dark:text-${stat.color}-400`}>{stat.icon}</span>
                                </div>
                            </div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-black text-black dark:text-white tracking-tighter">
                                {loading ? '...' : stat.value}
                            </h3>
                        </div>
                    ))}
                </section>

                {/* ── Main Operations Row ─────────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* Left Col: Operations Table */}
                    <div className="lg:col-span-2 space-y-10">
                        <section>
                            <div className="flex justify-between items-center mb-6 px-2">
                                <h2 className="text-xs font-medium text-slate-900 dark:text-white uppercase tracking-wider">
                                    Global Operations Overview
                                </h2>
                                <button
                                    onClick={() => router.push('/dashboard/admin/shipments')}
                                    className="text-primary text-[10px] font-medium uppercase tracking-widest hover:underline"
                                >
                                    View Detailed Manifest
                                </button>
                            </div>
                            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 dark:border-white/5 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10">
                                            <th className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Shipment ID</th>
                                            <th className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Origin/Dest</th>
                                            <th className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {loading ? (
                                            [1, 2, 3, 4, 5].map(i => (
                                                <tr key={i}><td colSpan={3} className="px-6 py-5"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td></tr>
                                            ))
                                        ) : recentShipments.map((shipment, idx) => (
                                            <tr
                                                key={idx}
                                                onClick={() => router.push(`/dashboard/admin/shipments?search=${shipment.id}`)}
                                                className="hover:bg-slate-50 dark:hover:bg-white/5 hover:pl-8 transition-all duration-300 group cursor-pointer"
                                            >
                                                <td className="px-6 py-5 text-sm font-bold text-black dark:text-blue-300 group-hover:text-primary transition-colors">{shipment.id.slice(0, 10)}</td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                                                        <span>{shipment.origin}</span>
                                                        <span className="material-symbols-outlined text-[14px] text-slate-300">arrow_forward</span>
                                                        <span>{shipment.destination}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`text-[10px] font-medium uppercase tracking-widest px-2.5 py-1 rounded-full ${shipment.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                                        shipment.status === 'cancelled' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' :
                                                            'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                                                        }`}>
                                                        {shipment.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section>
                            <div className="flex justify-between items-center mb-6 px-2">
                                <h2 className="text-xs font-medium text-slate-900 dark:text-white uppercase tracking-wider">
                                    Registered Users
                                </h2>
                            </div>
                            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 dark:border-white/5 overflow-hidden">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10">
                                            <th className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest">User</th>
                                            <th className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Role</th>
                                            <th className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Joined When</th>
                                            <th className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {loading ? (
                                            [1, 2, 3].map(i => (
                                                <tr key={i}><td colSpan={4} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td></tr>
                                            ))
                                        ) : (
                                            users.map((u, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 hover:pl-8 transition-all duration-300 group">
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                                                                {u.displayName[0]}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-medium text-slate-900 dark:text-white">{u.displayName}</p>
                                                                <p className="text-[10px] text-slate-400">{u.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`text-[10px] font-medium uppercase tracking-widest px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-primary text-white' :
                                                            u.role === 'staff' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10' :
                                                                'bg-slate-50 text-slate-500 dark:bg-slate-500/10'
                                                            }`}>
                                                            {u.role || 'customer'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-tight">
                                                            {u.joinedAt ? formatActivityTime(u.joinedAt) : 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <button onClick={() => handleViewShipments(u.uid)} className="text-[10px] font-medium text-primary uppercase tracking-widest hover:underline">View History</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-12">
                        <section>
                            <div className="flex justify-between items-center mb-6 px-2">
                                <h2 className="text-xs font-medium text-slate-900 dark:text-white uppercase tracking-wider">
                                    Recent Activity
                                </h2>
                                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Live Sync</span>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 dark:border-white/5 overflow-hidden">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10">
                                            <th className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Activity</th>
                                            <th className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest text-right">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {loading ? (
                                            [1, 2, 3].map(i => (
                                                <tr key={i}><td colSpan={2} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td></tr>
                                            ))
                                        ) : activities.length === 0 ? (
                                            <tr>
                                                <td colSpan={2} className="px-6 py-10 text-center text-slate-400 text-xs italic">
                                                    No recent activity recorded
                                                </td>
                                            </tr>
                                        ) : activities.map((act, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 hover:pl-8 transition-all duration-300 group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <p className="text-xs font-medium text-slate-900 dark:text-white uppercase tracking-tight">{act.action}</p>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300">
                                                                {act.userName?.[0] || 'U'}
                                                            </div>
                                                            <span className="text-[10px] text-slate-500 dark:text-slate-400">{act.userName}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex flex-col items-end gap-1.5">
                                                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                                            {formatActivityTime(act.timestamp)}
                                                        </span>
                                                        {act.entityId && (
                                                            <button
                                                                onClick={() => router.push(`/dashboard/admin/shipments?search=${act.entityId}`)}
                                                                className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                                                            >
                                                                View
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="relative group cursor-pointer overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border border-slate-200 dark:border-white/5 bg-navy-900 flex flex-col" onClick={() => router.push('/dashboard/admin/announcements')}>
                            <div className="h-48 overflow-hidden relative">
                                <img
                                    src="/images/hero-plane.png"
                                    alt="Cargofly Aircraft"
                                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-navy-900 to-transparent opacity-60" />
                            </div>

                            <div className="p-8 text-white flex flex-col flex-1">
                                <div className="mb-6">
                                    <h4 className="text-2xl font-bold tracking-tight font-display mb-2">
                                        Operations Center
                                    </h4>
                                    <p className="text-sm text-white/60">Manage all logistics and fleet operations.</p>
                                </div>

                                <div className="space-y-6 mt-auto">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Base Location</p>
                                            <p className="text-base font-bold">Lagos HQ</p>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">System Status</p>
                                            <p className="text-base font-bold">Active</p>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={(e) => { e.stopPropagation(); router.push('/dashboard/admin/announcements'); }}
                                        className="w-full bg-white text-navy-900 font-bold text-xs uppercase tracking-wider h-12 rounded-xl hover:bg-primary hover:text-white transition-all shadow-xl"
                                    >
                                        Manage Announcements
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </div>

                </div>

            </div>
        </div>
    );
}
