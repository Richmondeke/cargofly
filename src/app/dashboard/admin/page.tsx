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
                            Precision Navigator
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
                        { label: 'Global Shipments', value: stats.totalShipments.toLocaleString(), icon: 'local_shipping', color: 'blue' },
                        { label: 'In Transit', value: stats.inTransit.toLocaleString(), icon: 'explore', color: 'emerald' },
                        { label: 'Pending Action', value: stats.pending.toLocaleString(), icon: 'history', color: 'amber' },
                        { label: 'Total Revenue', value: stats.totalRevenue ? `$${(stats.totalRevenue).toLocaleString()}` : '$0', icon: 'payments', color: 'indigo' }
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 dark:border-white/5 relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all">
                            <div className={`absolute top-0 left-0 w-1 h-full bg-${stat.color}-500 opacity-0 group-hover:opacity-100 transition-opacity`} />
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 flex items-center justify-center`}>
                                    <span className={`material-symbols-outlined text-lg text-${stat.color}-600 dark:text-${stat.color}-400`}>{stat.icon}</span>
                                </div>
                            </div>
                            <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-medium text-slate-900 dark:text-white tracking-tighter">
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
                                                className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                                            >
                                                <td className="px-6 py-5 text-sm font-medium text-slate-900 dark:text-blue-300 group-hover:text-primary transition-colors">{shipment.id.slice(0, 10)}</td>
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
                                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
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

                    {/* Right Col: Recent Activity */}
                    <div className="space-y-10">
                        <section>
                            <h2 className="text-xs font-medium text-slate-900 dark:text-white uppercase tracking-wider mb-6 px-2">
                                System Activity
                            </h2>
                            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 dark:border-white/5 p-6 space-y-6">
                                {loading ? (
                                    [1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-50 rounded animate-pulse" />)
                                ) : activities.length === 0 ? (
                                    <div className="text-center py-4 text-slate-400 text-[10px] uppercase font-medium tracking-widest">No recent activity</div>
                                ) : activities.map((act, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs font-medium text-slate-900 dark:text-white leading-tight mb-1">{act.action}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{act.userName}</span>
                                                <span className="text-[10px] text-slate-300">•</span>
                                                <span className="text-[10px] text-slate-400">{formatActivityTime(act.timestamp)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="bg-navy-900 dark:bg-indigo-600 p-8 rounded-3xl shadow-xl shadow-primary/20 relative overflow-hidden text-white group cursor-pointer hover:shadow-2xl transition-all" onClick={() => router.push('/dashboard/admin/shipments')}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            <div className="relative z-10">
                                <p className="text-[10px] font-medium uppercase tracking-widest text-white/60 mb-2">Internal Manifest</p>
                                <h4 className="text-xl font-medium mb-6">Operations Center</h4>
                                <div className="space-y-4">
                                    <div className="p-3 bg-white/10 rounded-xl flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white text-sm">hub</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-medium uppercase text-white/70">Transit Hub Status</p>
                                            <p className="text-lg font-medium">Lagos Main Hub</p>
                                        </div>
                                    </div>
                                    <Button className="w-full bg-white text-navy-900 font-medium text-xs uppercase tracking-widest h-10 rounded-xl hover:bg-white/90 shadow-lg">
                                        Open Monitor
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
