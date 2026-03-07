'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getActiveShipments, getUserById, DashboardShipment } from '@/lib/dashboard-service';
import EmptyState from '@/components/common/EmptyState';

import { useAuth } from '@/contexts/AuthContext';

type FilterStatus = 'All' | 'In Transit' | 'Customs Hold' | 'Delivered';

export default function ShipmentsPage() {
    const { userProfile } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();

    // Admin filtering
    const userIdFilter = searchParams.get('userId');

    const [activeFilter, setActiveFilter] = useState<FilterStatus>('All');
    const [shipments, setShipments] = useState<DashboardShipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filteredUserInfo, setFilteredUserInfo] = useState<{ displayName: string; email: string } | null>(null);

    // Fetch user info when filtering by userId
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

    useEffect(() => {
        async function loadShipments() {
            setLoading(true);
            try {
                // If admin and userIdFilter is present, use that. Otherwise use current user's ID (unless admin, then undefined for all)
                let targetUserId = userProfile?.uid;

                if (userProfile?.role === 'admin') {
                    // Admins see all by default (targetUserId = undefined), or specific user if filtered
                    targetUserId = userIdFilter || undefined;
                }

                const data = await getActiveShipments(targetUserId, userProfile?.role, activeFilter === 'All' ? undefined : activeFilter);
                setShipments(data);
            } catch (error) {
                console.error('Error loading shipments:', error);
            } finally {
                setLoading(false);
            }
        }
        if (userProfile) {
            loadShipments();
        }
    }, [activeFilter, userProfile, userIdFilter]);

    const clearUserFilter = () => {
        router.push('/dashboard/shipments');
    };

    const filters: FilterStatus[] = ['All', 'In Transit', 'Customs Hold', 'Delivered'];

    // Get user initials for avatar
    const getUserInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="flex-1 overflow-y-auto p-8 h-full bg-slate-50 dark:bg-background-dark">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {filteredUserInfo ? `${filteredUserInfo.displayName}'s Shipments` : 'Active Shipments'}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {filteredUserInfo
                            ? `Viewing shipments for ${filteredUserInfo.email}`
                            : 'Manage and track your active cargo worldwide.'}
                    </p>
                </div>
                <div className="flex gap-2 bg-white dark:bg-surface-dark p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    {filters.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeFilter === filter
                                ? 'bg-primary text-white shadow-md'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Admin Filter Banner - Redesigned with brand colors and user info */}
            {userIdFilter && (
                <div className="mb-6 bg-sky-500/10 dark:bg-navy-900/30 border border-sky-200 dark:border-sky-800/50 p-5 rounded-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* User Avatar */}
                            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {filteredUserInfo ? getUserInitials(filteredUserInfo.displayName) : '?'}
                            </div>

                            <div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                                    {filteredUserInfo?.displayName || 'Loading...'}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {filteredUserInfo?.email || userIdFilter}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={clearUserFilter}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/30 rounded-lg transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">close</span>
                            Clear Filter
                        </button>
                    </div>
                </div>
            )}

            {/* Shipments Table */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider font-semibold text-xs">
                            <tr>
                                <th className="px-6 py-4">Shipment ID</th>
                                <th className="px-6 py-4">Route</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Progress</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading ? (
                                [1, 2, 3, 4, 5].map((i) => (
                                    <tr key={i}>
                                        <td colSpan={5} className="px-6 py-5">
                                            <div className="h-6 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : shipments.length > 0 ? (
                                shipments.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-5 font-bold text-primary">{s.id}</td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-slate-900 dark:text-white">{s.origin}</span>
                                                <span className="material-symbols-outlined text-slate-400 text-base">arrow_forward</span>
                                                <span className="text-slate-600 dark:text-slate-300">{s.destination}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${s.status === 'Delivered'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : s.status === 'Pending'
                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                    : s.status === 'Customs'
                                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                        : 'bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400'
                                                }`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 w-24 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${s.progress}%` }}></div>
                                                </div>
                                                <span className="text-xs text-slate-500 w-12">{s.eta}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/dashboard/track/${s.id.replace('#', '').replace('CF-', '')}`}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                    title="Track Shipment"
                                                >
                                                    <span className="material-symbols-outlined">map</span>
                                                </Link>
                                                <Link
                                                    href={`/dashboard/track/${s.id.replace('#', '').replace('CF-', '')}`}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                    title="View Details"
                                                >
                                                    <span className="material-symbols-outlined">visibility</span>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <td colSpan={5} className="px-6 py-4">
                                    <EmptyState
                                        title="No shipments found"
                                        description="You don't have any cargo in transit at the moment."
                                        action={
                                            <Link href="/dashboard/new-booking" className="text-primary hover:underline">
                                                Create your first booking
                                            </Link>
                                        }
                                    />
                                </td>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {shipments.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                        <span className="text-sm text-slate-500">Showing {shipments.length} shipments</span>
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50" disabled>
                                Prev
                            </button>
                            <button className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50" disabled>
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
