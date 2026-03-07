'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import EmptyState from '@/components/common/EmptyState';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    getDashboardStats,
    getActiveShipments,
    seedInitialData,
    DashboardShipment,
} from '@/lib/dashboard-service';
import RiveAnimation from '@/components/ui/RiveAnimation';
import { useNotifications } from '@/contexts/NotificationContext';

// --- Components ---

function TrackOrderModal({ onClose }: { onClose: () => void }) {
    const [trackingId, setTrackingId] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingId.trim()) {
            setError('Please enter a tracking ID');
            return;
        }
        router.push(`/dashboard/track/${trackingId.trim()}`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-navy-900 rounded-2xl w-full max-w-sm p-6 shadow-xl border border-slate-200 dark:border-navy-700 animate-in fade-in zoom-in duration-200">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Track Order</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Enter your tracking ID to see shipment details.</p>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tracking ID</label>
                        <input
                            type="text"
                            autoFocus
                            value={trackingId}
                            onChange={(e) => setTrackingId(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none uppercase placeholder:normal-case"
                            placeholder="e.g., CF-12345"
                        />
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 rounded-lg border border-slate-300 dark:border-navy-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 font-medium transition-colors shadow-sm"
                        >
                            Track
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { user, userProfile, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalShipments: 0, inTransit: 0, delivered: 0, totalRevenue: 0, pending: 0 });
    const [shipments, setShipments] = useState<DashboardShipment[]>([]);
    const [showTrackModal, setShowTrackModal] = useState(false);
    const { toggleSidebar, unreadCount } = useNotifications();

    useEffect(() => {
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

    return (
        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-background-dark min-h-full">
            {showTrackModal && <TrackOrderModal onClose={() => setShowTrackModal(false)} />}

            <div className="p-8">
                {/* Header - Spacing: 32px bottom */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-[32px] font-bold text-[#1e293b] dark:text-white leading-tight">Dashboard</h1>
                        <p className="text-[14px] text-[#64748b] dark:text-slate-400 mt-1">
                            Welcome back {userProfile?.displayName ? userProfile.displayName.split(' ')[0] : 'Richmond'}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleSidebar}
                            className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <span className="material-symbols-outlined text-[24px]">notifications</span>
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#F8FAFC]"></span>
                            )}
                        </button>
                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                            {(userProfile?.displayName?.[0] || 'BO').toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* Banner - Height 220px */}
                <div className="flex flex-col lg:flex-row h-auto lg:h-[220px] rounded-[24px] overflow-hidden shadow-lg mb-8">
                    {/* Left Side - Dark Blue */}
                    <div className="flex-1 bg-[#003399] p-8 lg:p-10 flex flex-col justify-center relative">
                        <h2 className="text-[32px] font-bold text-white mb-2">In-Transit</h2>
                        <p className="text-[14px] text-blue-100 mb-6 max-w-sm">
                            Active shipments currently moving across our network.
                        </p>
                        <Link href="/dashboard/new-booking">
                            <button className="bg-[#FFD700] hover:bg-[#FFC000] text-navy-900 px-6 py-3 rounded-xl font-bold text-[14px] transition-colors w-fit">
                                Create Order
                            </button>
                        </Link>
                    </div>

                    {/* Right Side - Image */}
                    <div className="w-full lg:w-[45%] bg-blue-50 relative h-[220px] lg:h-full">
                        <div
                            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                            style={{ backgroundImage: 'url(/images/illustrations/aircraft_hangar.jpg)' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#003399]/10 to-transparent"></div>
                    </div>
                </div>

                {/* Stats Cards - Height 118px, Radius 16px, Padding 24px */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Shipments - Blue */}
                    <div className="bg-[#003399] p-[24px] rounded-[16px] shadow-sm flex flex-col justify-between h-[118px]">
                        <div className="flex justify-between items-start">
                            <span className="text-[14px] text-blue-100 font-medium">Total Shipments</span>
                            <span className="material-symbols-outlined text-blue-200 text-lg">info</span>
                        </div>
                        <p className="text-[32px] font-bold text-white">{stats.totalShipments}</p>
                    </div>

                    {/* Pending Approvals - White with specific border */}
                    <div className="bg-white dark:bg-surface-dark p-[24px] rounded-[16px] border border-[#EFEFEF] dark:border-slate-700 flex flex-col justify-between h-[118px] gap-[12px]">
                        <div className="flex justify-between items-start">
                            <span className="text-[14px] text-slate-600 dark:text-slate-300 font-medium">Pending Approvals</span>
                            <span className="material-symbols-outlined text-slate-400 text-lg">info</span>
                        </div>
                        <p className="text-[32px] font-bold text-slate-900 dark:text-white">{(stats as any).pending || 0}</p>
                    </div>

                    {/* Delivered - White with specific border */}
                    <div className="bg-white dark:bg-surface-dark p-[24px] rounded-[16px] border border-[#EFEFEF] dark:border-slate-700 flex flex-col justify-between h-[118px] gap-[12px]">
                        <div className="flex justify-between items-start">
                            <span className="text-[14px] text-slate-600 dark:text-slate-300 font-medium">Delivered</span>
                            <span className="material-symbols-outlined text-slate-400 text-lg">info</span>
                        </div>
                        <p className="text-[32px] font-bold text-slate-900 dark:text-white">{stats.delivered}</p>
                    </div>

                    {/* In Transit - Light Blue */}
                    <div className="bg-[#DBEAFE] dark:bg-blue-900/30 p-[24px] rounded-[16px] shadow-sm flex flex-col justify-between h-[118px]">
                        <div className="flex justify-between items-start">
                            <span className="text-[14px] text-slate-700 dark:text-blue-200 font-medium">In Transit</span>
                            <span className="material-symbols-outlined text-slate-500 dark:text-blue-300 text-lg">info</span>
                        </div>
                        <p className="text-[32px] font-bold text-slate-900 dark:text-white">{stats.inTransit}</p>
                    </div>
                </div>

                {/* Shipping History Table */}
                <div className="bg-white dark:bg-surface-dark rounded-[24px] p-8 shadow-sm">
                    <h3 className="text-[18px] font-bold text-slate-900 dark:text-white mb-6">Shipping History</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-[12px] text-slate-500 font-medium border-b border-slate-100 dark:border-slate-700">
                                <tr>
                                    <th className="pb-4 pl-2 font-normal">Shipping ID</th>
                                    <th className="pb-4 font-normal">Category</th>
                                    <th className="pb-4 font-normal">Origin</th>
                                    <th className="pb-4 font-normal">Destination</th>
                                    <th className="pb-4 font-normal">Weight</th>
                                    <th className="pb-4 font-normal">Status</th>
                                    <th className="pb-4 font-normal">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-[14px]">
                                {loading ? (
                                    [1, 2, 3].map((i) => (
                                        <tr key={i}>
                                            <td colSpan={7} className="py-4">
                                                <div className="h-8 bg-slate-100 dark:bg-slate-700 rounded animate-pulse"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : shipments.length > 0 ? (
                                    shipments.slice(0, 5).map((s) => (
                                        <tr key={s.id} className="border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="py-5 pl-2 font-medium text-slate-900 dark:text-white">{s.trackingNumber || s.id}</td>
                                            <td className="py-5 text-slate-600 dark:text-slate-300">{s.category}</td>
                                            <td className="py-5 text-slate-600 dark:text-slate-300">{s.origin}</td>
                                            <td className="py-5 text-slate-600 dark:text-slate-300">{s.destination}</td>
                                            <td className="py-5 text-slate-600 dark:text-slate-300">{s.weight}</td>
                                            <td className="py-5">
                                                <span className={`px-3 py-1 rounded-full text-[12px] font-medium ${s.status.toLowerCase().includes('delivered') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    s.status.toLowerCase().includes('transit') || s.status.toLowerCase().includes('progress') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        s.status.toLowerCase().includes('verified') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                    {s.status === 'in_transit' ? 'Verified' : s.status}  {/* Mocking 'Verified' style if needed, or keeping status */}
                                                </span>
                                            </td>
                                            <td className="py-5">
                                                <Link href={`/dashboard/track/${s.id}`}>
                                                    <button className="px-4 py-1.5 border border-slate-200 dark:border-slate-700 rounded-full text-[12px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                                        Process
                                                    </button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-4">
                                            <EmptyState
                                                title="No shipments found"
                                                description="You haven't made any bookings yet."
                                            />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div >
            </div >
        </div >
    );
}
