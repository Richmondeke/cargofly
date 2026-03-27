'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getActiveShipments, getUserById, DashboardShipment } from '@/lib/dashboard-service';
import { useAuth } from '@/contexts/AuthContext';
import { ShipmentDetailsDrawer } from '@/components/dashboard/ShipmentDetailsDrawer';

type FilterStatus = 'All' | 'In Transit' | 'Customs Hold' | 'Delivered';

// Status pill matching screenshot style
function StatusPill({ status }: { status: string }) {
    const s = status?.toLowerCase() || '';
    if (s.includes('transit')) return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
            In Transit
        </span>
    );
    if (s.includes('delivered') || s.includes('arrived')) return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Delivered
        </span>
    );
    if (s.includes('customs') || s.includes('hold')) return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <span className="size-1.5 rounded-full bg-amber-500" />
            Pending Customs
        </span>
    );
    if (s.includes('delay') || s.includes('delayed')) return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <span className="size-1.5 rounded-full bg-red-500" />
            Delayed
        </span>
    );
    if (s.includes('pending') || s.includes('processing')) return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
            <span className="size-1.5 rounded-full bg-orange-500 animate-pulse" />
            Processing
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <span className="size-1.5 rounded-full bg-slate-400" />
            {status}
        </span>
    );
}

// Infer commodity type from category/notes
function getCommodity(s: DashboardShipment): string {
    const cat = s.category?.toLowerCase() || '';
    if (cat.includes('express')) return 'Express Cargo';
    if (cat.includes('standard')) return 'Standard Freight';
    if (cat.includes('danger')) return 'Dangerous Goods';
    if (cat.includes('temp') || cat.includes('cold')) return 'Temperature Controlled';
    return s.category || 'General Cargo';
}

const PAGE_SIZE = 8;

export default function ShipmentsPage() {
    const { userProfile } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();

    const userIdFilter = searchParams.get('userId');

    const [statusFilter, setStatusFilter] = useState<FilterStatus>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [shipments, setShipments] = useState<DashboardShipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filteredUserInfo, setFilteredUserInfo] = useState<{ displayName: string; email: string } | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedShipment, setSelectedShipment] = useState<DashboardShipment | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        async function loadUserInfo() {
            if (userIdFilter) {
                const userInfo = await getUserById(userIdFilter);
                setFilteredUserInfo(userInfo);
            } else {
                setFilteredUserInfo(null);
            }
        }
        loadUserInfo();
    }, [userIdFilter]);

    // Auto-verify payment if reference is in URL (Korapay redirect)
    useEffect(() => {
        const reference = searchParams.get('reference');
        if (reference && userProfile) {
            async function verifyPayment() {
                setVerifying(true);
                try {
                    const res = await fetch(`/api/payments/verify?reference=${reference}`);
                    const result = await res.json();
                    if (result.status) {
                        const targetUserId = userProfile?.uid;
                        const data = await getActiveShipments(targetUserId, userProfile?.role, statusFilter === 'All' ? undefined : statusFilter);
                        setShipments(data);
                        router.replace('/dashboard/shipments');
                    }
                } catch (error) {
                    console.error('Auto-verification failed:', error);
                } finally {
                    setVerifying(false);
                }
            }
            verifyPayment();
        }
    }, [searchParams, userProfile, statusFilter, router]);

    useEffect(() => {
        async function loadShipments() {
            setLoading(true);
            try {
                let targetUserId = userProfile?.uid;
                if (userProfile?.role === 'admin') {
                    targetUserId = userIdFilter || undefined;
                }
                const data = await getActiveShipments(targetUserId, userProfile?.role, statusFilter === 'All' ? undefined : statusFilter);
                setShipments(data);
                setCurrentPage(1);
            } catch (error) {
                console.error('Error loading shipments:', error);
            } finally {
                setLoading(false);
            }
        }
        if (userProfile) loadShipments();
    }, [statusFilter, userProfile, userIdFilter]);

    const clearUserFilter = () => router.push('/dashboard/shipments');

    const filtered = shipments.filter(s => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            s.id?.toLowerCase().includes(q) ||
            s.trackingNumber?.toLowerCase().includes(q) ||
            s.origin?.toLowerCase().includes(q) ||
            s.destination?.toLowerCase().includes(q)
        );
    });

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const statusFilters: FilterStatus[] = ['All', 'In Transit', 'Customs Hold', 'Delivered'];

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark min-h-full">

            <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">

                {/* Page Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-medium text-slate-900 dark:text-white">
                            {filteredUserInfo ? `${filteredUserInfo.displayName}'s Shipments` : 'Active Shipments'}
                        </h1>
                        <p className="text-sm text-primary font-medium mt-0.5">
                            {filteredUserInfo
                                ? `Viewing shipments for ${filteredUserInfo.email}`
                                : 'Monitor and manage your global cargo movements.'}
                        </p>
                    </div>
                    <Link href="/dashboard/new-booking">
                        <button className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all">
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            New Shipment
                        </button>
                    </Link>
                </div>

                {/* Admin User Filter Banner */}
                {userIdFilter && (
                    <div className="bg-sky-50 dark:bg-sky-900/10 border border-sky-200 dark:border-sky-800/50 p-4 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-medium text-sm">
                                {filteredUserInfo?.displayName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                            </div>
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white text-sm">{filteredUserInfo?.displayName || 'Loading...'}</p>
                                <p className="text-xs text-slate-500">{filteredUserInfo?.email || userIdFilter}</p>
                            </div>
                        </div>
                        <button onClick={clearUserFilter} className="flex items-center gap-1.5 text-sm text-sky-600 font-medium hover:bg-sky-100 dark:hover:bg-sky-900/30 px-3 py-1.5 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-base">close</span>
                            Clear Filter
                        </button>
                    </div>
                )}

                {/* Search + Filters Bar */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex flex-wrap gap-3 items-center">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                            <input
                                type="text"
                                placeholder="AWB Number..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative min-w-[160px]">
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value as FilterStatus)}
                                className="w-full pl-4 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                            >
                                {statusFilters.map(f => (
                                    <option key={f} value={f}>{f === 'All' ? 'All Statuses' : f}</option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">expand_more</span>
                        </div>

                        {/* Date Range (decorative for now) */}
                        <div className="relative min-w-[180px]">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">calendar_month</span>
                            <input
                                type="text"
                                readOnly
                                defaultValue="Last 30 Days"
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>

                        {/* Refresh */}
                        <button
                            onClick={() => {
                                if (!userProfile) return;
                                setLoading(true);
                                const targetUserId = userProfile?.role === 'admin' ? (userIdFilter || undefined) : userProfile?.uid;
                                getActiveShipments(targetUserId, userProfile?.role, statusFilter === 'All' ? undefined : statusFilter)
                                    .then(data => { setShipments(data); setLoading(false); })
                                    .catch(() => setLoading(false));
                            }}
                            className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-primary hover:border-primary transition-colors"
                            title="Refresh"
                        >
                            <span className="material-symbols-outlined text-[20px]">refresh</span>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase font-medium text-slate-500 tracking-wider border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4">AWB Number</th>
                                    <th className="px-6 py-4">Route</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Weight / Vol</th>
                                    <th className="px-6 py-4">ETA / Delivery</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <tr key={i}>
                                            <td colSpan={6} className="px-6 py-5">
                                                <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                            </td>
                                        </tr>
                                    ))
                                ) : paginated.length > 0 ? (
                                    paginated.map(s => (
                                        <tr key={s.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="font-medium text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                                    {s.trackingNumber || s.id}
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-0.5 font-medium">{getCommodity(s)}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-slate-700 dark:text-slate-200">{s.origin}</span>
                                                    <span className="material-symbols-outlined text-slate-400 text-[15px]">arrow_forward</span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-200">{s.destination}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <StatusPill status={s.status} />
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="font-medium text-slate-900 dark:text-white">{s.weight || '—'}</div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">{s.totalPrice || ''}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-slate-700 dark:text-slate-300 font-medium">{s.eta || 'TBD'}</div>
                                                {s.paymentStatus && (
                                                    <div className={`text-[11px] mt-0.5 font-medium ${s.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                        {s.paymentStatus === 'paid' ? 'Scheduled' : 'Awaiting clearance'}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={`/dashboard/track/${s.id.replace('#', '').replace('CF-', '')}`}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                        title="Track on map"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">location_on</span>
                                                    </Link>
                                                    <button
                                                        onClick={() => { setSelectedShipment(s); setIsDrawerOpen(true); }}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                        title="View documents"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">description</span>
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedShipment(s); setIsDrawerOpen(true); }}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                        title="More options"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="w-40 h-40 mx-auto mb-4 relative opacity-60">
                                                <Image
                                                    src="/images/illustrations/empty_logistics.png"
                                                    alt="No shipments"
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                            <h3 className="text-base font-medium text-slate-900 dark:text-white mb-1">No shipments found</h3>
                                            <p className="text-sm text-slate-400">Try adjusting your filters or search query.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {filtered.length > 0 && (
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                            <span className="text-sm text-slate-500">
                                Showing <span className="text-slate-900 dark:text-white font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
                                <span className="text-slate-900 dark:text-white font-medium">{Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> of{' '}
                                <span className="text-slate-900 dark:text-white font-medium">{filtered.length}</span> shipments
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            <ShipmentDetailsDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                shipment={selectedShipment}
                onRefresh={async () => {
                    const targetUserId = userProfile?.role === 'admin' ? (userIdFilter || undefined) : userProfile?.uid;
                    const data = await getActiveShipments(targetUserId, userProfile?.role, statusFilter === 'All' ? undefined : statusFilter);
                    setShipments(data);
                    const updated = data.find(s => s.id === selectedShipment?.id);
                    if (updated) setSelectedShipment(updated);
                }}
            />
        </div>
    );
}
