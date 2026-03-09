'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getActiveShipments, getUserById, DashboardShipment } from '@/lib/dashboard-service';
import EmptyState from '@/components/common/EmptyState';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { Package, Truck, ShieldAlert, CheckCircle } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { ShipmentDetailsDrawer } from '@/components/dashboard/ShipmentDetailsDrawer';
import { Eye } from 'lucide-react';

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
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedShipment, setSelectedShipment] = useState<DashboardShipment | null>(null);

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
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 h-full bg-slate-50 dark:bg-background-dark">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-2xl sm:text-[32px] font-bold text-[#1e293b] dark:text-white leading-tight">
                        {filteredUserInfo ? `${filteredUserInfo.displayName}'s Shipments` : 'Active Shipments'}
                    </h1>
                    <p className="text-[14px] text-[#64748b] dark:text-slate-400 mt-1">
                        {filteredUserInfo
                            ? `Viewing shipments for ${filteredUserInfo.email}`
                            : 'Manage and track your active cargo worldwide.'}
                    </p>
                </div>
                <DashboardTabs
                    tabs={[
                        { id: 'All', label: 'All', icon: Package },
                        { id: 'In Transit', label: 'In Transit', icon: Truck },
                        { id: 'Customs Hold', label: 'Customs Hold', icon: ShieldAlert },
                        { id: 'Delivered', label: 'Delivered', icon: CheckCircle },
                    ]}
                    activeTab={activeFilter}
                    onTabChange={(id) => setActiveFilter(id as FilterStatus)}
                />
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
            <div className="bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-navy-800 text-slate-500 uppercase tracking-widest font-black text-[10px] border-b border-slate-100 dark:border-navy-700">
                            <tr>
                                <th className="px-6 py-4">Shipment ID</th>
                                <th className="px-6 py-4">Route</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Shipment Details</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-navy-700/50">
                            {loading ? (
                                [1, 2, 3, 4, 5].map((i) => (
                                    <tr key={i}>
                                        <td colSpan={5} className="px-6 py-6">
                                            <div className="h-6 w-full bg-slate-100 dark:bg-navy-800 rounded-lg animate-pulse"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : shipments.length > 0 ? (
                                shipments.map((s) => (
                                    <tr key={s.id} className="group hover:bg-slate-50/80 dark:hover:bg-navy-800/50 transition-all duration-200">
                                        <td className="px-6 py-6">
                                            <div className="font-display font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                                {s.trackingNumber || s.id}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="font-semibold text-slate-700 dark:text-slate-200">{s.origin}</div>
                                                <div className="flex items-center text-slate-300 dark:text-slate-600">
                                                    <div className="w-4 h-px bg-current"></div>
                                                    <span className="material-symbols-outlined text-[16px] -ml-1">arrow_forward_ios</span>
                                                </div>
                                                <div className="font-semibold text-slate-700 dark:text-slate-200">{s.destination}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <StatusPill status={s.status} />
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{s.weight}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">{s.category} Route</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-slate-900 dark:text-white">{s.totalPrice}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${s.paymentStatus === 'paid'
                                                        ? 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                                                        : 'bg-amber-100/50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                                                        }`}>
                                                        {s.paymentStatus}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                                                    <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                                                    ETA: {s.eta}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link
                                                    href={`/dashboard/track/${s.id.replace('#', '').replace('CF-', '')}`}
                                                    className="p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
                                                    title="Track Shipment"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">map</span>
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        setSelectedShipment(s);
                                                        setIsDrawerOpen(true);
                                                    }}
                                                    className="p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr className="border-t border-slate-100 dark:border-navy-700/50">
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        <div className="w-48 h-48 mx-auto mb-4 relative opacity-80 dark:opacity-60 grayscale-[10%]">
                                            <Image
                                                src="/images/illustrations/empty_logistics.png"
                                                alt="No shipments found"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No shipments found</h3>
                                        <p className="text-sm font-medium">There are currently no shipments matching your filters.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {shipments.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 dark:border-navy-700/50 flex justify-between items-center bg-white dark:bg-navy-900">
                        <span className="text-sm text-slate-500 font-medium">Showing <span className="text-slate-900 dark:text-white font-bold">{shipments.length}</span> shipments</span>
                        <div className="flex gap-2">
                            <button className="px-4 py-2 text-sm font-bold border border-slate-200 dark:border-navy-600 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-navy-800 transition-colors disabled:opacity-50" disabled>
                                Prev
                            </button>
                            <button className="px-4 py-2 text-sm font-bold border border-slate-200 dark:border-navy-600 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-navy-800 transition-colors disabled:opacity-50" disabled>
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ShipmentDetailsDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                shipment={selectedShipment}
            />
        </div>
    );
}
