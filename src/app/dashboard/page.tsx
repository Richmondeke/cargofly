'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    getDashboardStats,
    getActiveShipments,
    seedInitialData,
    DashboardShipment,
    formatTimestamp,
} from '@/lib/dashboard-service';
import { ShipmentDetailsDrawer } from '@/components/dashboard/ShipmentDetailsDrawer';
import { Eye } from 'lucide-react';

// Modals
import QuoteModal from '@/components/dashboard/QuoteModal';
import TrackModal from '@/components/dashboard/TrackModal';
import ReportModal from '@/components/dashboard/ReportModal';

// Status icon helper
function getStatusIcon(status: string) {
    const s = status?.toLowerCase() || '';
    if (s.includes('transit')) return { icon: 'flight', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600' };
    if (s.includes('processing') || s.includes('pending')) return { icon: 'box_edit', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600' };
    if (s.includes('delivered') || s.includes('arrived')) return { icon: 'warehouse', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600' };
    if (s.includes('customs') || s.includes('hold')) return { icon: 'security', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600' };
    return { icon: 'local_shipping', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600' };
}

export default function DashboardPage() {
    const { user, userProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [stats, setStats] = useState({ totalShipments: 0, inTransit: 0, delivered: 0, totalRevenue: 0, pending: 0 });
    const [shipments, setShipments] = useState<DashboardShipment[]>([]);

    // Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedShipment, setSelectedShipment] = useState<DashboardShipment | null>(null);

    // Quick Action Modal States
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
    const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (authLoading || !user) return;

        async function loadDashboardData() {
            try {
                await seedInitialData();
                const [statsData, shipmentsData] = await Promise.all([
                    getDashboardStats(userProfile?.uid, userProfile?.role),
                    getActiveShipments(userProfile?.uid, userProfile?.role),
                ]);
                setStats(statsData);
                setShipments(shipmentsData);
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }
        loadDashboardData();
    }, [authLoading, user]);

    const activeShipments = shipments.filter(s => {
        const st = s.status?.toLowerCase() || '';
        return st.includes('transit') || st.includes('processing') || st.includes('customs');
    });

    const recentBookings = shipments.slice(0, 4);

    return (
        <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark min-h-full">
            <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">

                {/* Announcement Banner */}
                <section className="relative overflow-hidden rounded-xl bg-navy p-10 sm:p-14 flex items-center justify-between group min-h-[300px]">
                    {/* Motif Background Overlay */}
                    <div
                        className="absolute inset-0 z-0 pointer-events-none bg-repeat mix-blend-lighten opacity-100"
                        style={{
                            backgroundImage: "url('/Cargofly motif_transparent.png')",
                            backgroundSize: '150px'
                        }}
                    />

                    <div className="z-10 relative space-y-3">
                        <span className="inline-block px-3 py-1 bg-gold-500 text-navy-900 text-[10px] font-medium uppercase tracking-widest rounded">
                            Route Expansion
                        </span>
                        <h2 className="text-white text-2xl sm:text-3xl font-display font-medium leading-tight">
                            New Route to Singapore <br className="hidden sm:block" />
                            Starting Next Month
                        </h2>
                        <p className="text-white/80 max-w-md text-sm">
                            Book your cargo space early to take advantage of introductory low rates for our new daily service.
                        </p>
                        <div className="flex gap-4 pt-2 flex-wrap">
                            <Link href="/dashboard/new-booking">
                                <button className="bg-gold-500 text-navy-900 px-6 py-3 rounded-xl font-medium text-sm hover:brightness-110 transition-all shadow-xl shadow-gold-500/20 active:scale-95 cursor-pointer">
                                    Book This Route
                                </button>
                            </Link>
                            <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-3 rounded-xl font-medium text-sm hover:bg-white/20 transition-all active:scale-95 cursor-pointer">
                                Learn More
                            </button>
                        </div>
                    </div>
                    <div
                        className="absolute right-0 top-0 h-full w-1/3 sm:w-2/5 opacity-40 pointer-events-none transition-transform group-hover:scale-105 duration-700 z-10"
                        style={{
                            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCj32WxKMQJJjPpeGLU41bKxnpgDqvVvH4DxU94dpj2u-QSOXOb9gIIpMEB7z0msS40fh5EnRzayghD3ChwBJe9nf4XDp7EVafYqL_aqT8k3TcP5batWJQvKvh9S8P9ExMPhbcv48N6ErQ2vyR_8dz8CwgI6BzbjwLOjnq8RdpPCzhlDqDUteub66JOuj0mmXCNrM_zWbbj7JLEC2TgGH63pKmvYjgL4HVwHMP1EQryzNajyDK1YxojNTBGclCFA9V6Wt2L1FmjTUmj')",
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />
                </section>

                {/* Quick Action Bar */}
                <section className="flex flex-wrap gap-4 items-center justify-between border-b border-navy/5 dark:border-white/5 pb-8">
                    <div className="flex gap-4 flex-wrap">
                        <Link href="/dashboard/new-booking">
                            <button className="flex items-center gap-2 bg-navy text-white px-6 py-3.5 rounded-xl font-medium shadow-xl shadow-navy/20 hover:scale-105 transition-all text-sm active:scale-95 cursor-pointer">
                                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                                New Shipment
                            </button>
                        </Link>
                        <button
                            onClick={() => setIsTrackModalOpen(true)}
                            className="flex items-center gap-2 bg-white dark:bg-navy-800 text-navy dark:text-white border border-navy/10 dark:border-navy-600 px-6 py-3.5 rounded-xl font-medium hover:bg-navy/5 dark:hover:bg-navy-700 transition-all text-sm active:scale-95 cursor-pointer shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[20px]">track_changes</span>
                            Track Shipment
                        </button>
                    </div>
                    <div className="flex gap-4 flex-wrap">

                    </div>
                </section>

                {/* Stats Cards */}
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* Total Shipments */}
                    <div className="bg-white dark:bg-navy-900 p-6 rounded-xl border border-navy/10 dark:border-navy-700 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-[10px] font-medium text-navy-700/50 dark:text-sky-400/50 uppercase tracking-widest">Total Shipments</p>
                            <h3 className="text-3xl font-display font-medium mt-1 text-navy dark:text-white">
                                {(!mounted || loading) ? <span className="animate-pulse text-navy-100">—</span> : stats.totalShipments}
                                <span className="text-sm font-normal text-navy/40 ml-1">All time</span>
                            </h3>

                        </div>
                        <div className="size-14 bg-navy/5 dark:bg-navy-800 rounded-2xl flex items-center justify-center text-navy dark:text-sky-400">
                            <span className="material-symbols-outlined text-3xl">weight</span>
                        </div>
                    </div>

                    {/* In Transit */}
                    <div className="bg-white dark:bg-navy-900 p-6 rounded-xl border border-navy/10 dark:border-navy-700 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-[10px] font-medium text-navy-700/50 dark:text-sky-400/50 uppercase tracking-widest">Active Shipments</p>
                            <h3 className="text-3xl font-display font-medium mt-1 text-navy dark:text-white">
                                {(!mounted || loading) ? <span className="animate-pulse text-navy-100">—</span> : stats.inTransit}
                                <span className="text-sm font-normal text-navy/40 ml-1">In Transit</span>
                            </h3>

                        </div>
                        <div className="size-14 bg-gold-50 dark:bg-gold-900/20 rounded-2xl flex items-center justify-center text-gold-600">
                            <span className="material-symbols-outlined text-3xl">local_shipping</span>
                        </div>
                    </div>

                    {/* Pending / Quotes */}
                    <div className="bg-white dark:bg-navy-900 p-6 rounded-xl border border-navy/10 dark:border-navy-700 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-[10px] font-medium text-navy-700/50 dark:text-sky-400/50 uppercase tracking-widest">Pending</p>
                            <h3 className="text-3xl font-display font-medium mt-1 text-navy dark:text-white">
                                {(!mounted || loading) ? <span className="animate-pulse text-navy-100">—</span> : ((stats as any).pending || 0)}
                                <span className="text-sm font-normal text-navy/40 ml-1">Awaiting Action</span>
                            </h3>

                        </div>
                        <div className="size-14 bg-navy/5 dark:bg-navy-800 rounded-2xl flex items-center justify-center text-navy dark:text-sky-400">
                            <span className="material-symbols-outlined text-3xl">request_quote</span>
                        </div>
                    </div>
                </section>

                {/* Data Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Active Shipments List */}
                    <section className="bg-white dark:bg-navy-900 rounded-xl border border-navy/10 dark:border-navy-700 overflow-hidden flex flex-col shadow-sm">
                        <div className="p-6 border-b border-navy/5 dark:border-navy-800 flex items-center justify-between">
                            <h3 className="font-display font-medium text-lg text-navy dark:text-white">Active Shipments</h3>
                            <Link href="/dashboard/shipments" className="text-navy-700 dark:text-sky-400 text-sm font-medium hover:underline">
                                View All
                            </Link>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="p-5 flex items-center gap-4">
                                            <div className="size-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-1/2" />
                                                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-3/4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : activeShipments.length > 0 ? (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {activeShipments.map((s) => {
                                        const statusStyle = getStatusIcon(s.status);
                                        return (
                                            <div
                                                key={s.id}
                                                className="p-5 flex items-center gap-4 hover:bg-navy/5 dark:hover:bg-navy-800/50 transition-colors cursor-pointer"
                                                onClick={() => { setSelectedShipment(s); setIsDrawerOpen(true); }}
                                            >
                                                <div className={`size-10 ${statusStyle.bg} ${statusStyle.text} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                                    <span className="material-symbols-outlined text-[20px]">{statusStyle.icon}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <p className="text-sm font-medium truncate text-navy dark:text-white">
                                                            {s.trackingNumber || s.id}
                                                        </p>
                                                        <StatusBadge status={s.status} />
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-navy/50 dark:text-navy-400 mt-1">
                                                        <span className="font-medium">{s.origin}</span>
                                                        <span className="material-symbols-outlined text-[13px] opacity-40">arrow_forward_ios</span>
                                                        <span className="font-medium">{s.destination}</span>
                                                        <span className="mx-1 opacity-20">•</span>
                                                        <span>ETA: {s.eta || 'TBD'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-10 text-center text-slate-400 text-sm">
                                    <span className="material-symbols-outlined text-4xl block mb-2 opacity-40">local_shipping</span>
                                    No active shipments at the moment.
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Recent Bookings Table */}
                    <section className="bg-white dark:bg-navy-900 rounded-xl border border-navy/10 dark:border-navy-700 overflow-hidden flex flex-col shadow-sm">
                        <div className="p-6 border-b border-navy/5 dark:border-navy-800 flex items-center justify-between">
                            <h3 className="font-display font-medium text-lg text-navy dark:text-white">Recent Bookings</h3>
                            <Link href="/dashboard/shipments">
                                <button className="p-2 hover:bg-navy/5 dark:hover:bg-navy-800/50 rounded-lg transition-colors">
                                    <span className="material-symbols-outlined text-navy-400">filter_list</span>
                                </button>
                            </Link>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left">
                                <thead className="bg-navy/5 dark:bg-navy-800/50 text-[10px] uppercase font-medium text-navy-500/70 dark:text-sky-400/50 tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Booking ID</th>
                                        <th className="px-6 py-4">Route</th>
                                        <th className="px-6 py-4">Weight</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-navy/5 dark:divide-navy-800">
                                    {loading ? (
                                        [1, 2, 3, 4].map(i => (
                                            <tr key={i}>
                                                <td colSpan={4} className="px-6 py-4">
                                                    <div className="h-5 bg-navy/5 dark:bg-navy-800 rounded animate-pulse" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : recentBookings.length > 0 ? (
                                        recentBookings.map(s => (
                                            <tr
                                                key={s.id}
                                                className="hover:bg-navy/5 dark:hover:bg-navy-800/50 cursor-pointer transition-colors"
                                                onClick={() => { setSelectedShipment(s); setIsDrawerOpen(true); }}
                                            >
                                                <td className="px-6 py-4 font-medium text-navy dark:text-white">
                                                    {s.trackingNumber ? s.trackingNumber.slice(0, 12) : s.id.slice(0, 8)}
                                                </td>
                                                <td className="px-6 py-4 text-navy-700 dark:text-sky-400/80">
                                                    {s.origin} → {s.destination}
                                                </td>
                                                <td className="px-6 py-4 text-navy/50 dark:text-navy-400">
                                                    {s.weight || '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={s.status} />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">
                                                No bookings yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                <ShipmentDetailsDrawer
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    shipment={selectedShipment}
                />

                {/* Quick Action Modals */}
                <QuoteModal
                    isOpen={isQuoteModalOpen}
                    onClose={() => setIsQuoteModalOpen(false)}
                />
                <TrackModal
                    isOpen={isTrackModalOpen}
                    onClose={() => setIsTrackModalOpen(false)}
                />
            </div>
        </div>
    );
}
