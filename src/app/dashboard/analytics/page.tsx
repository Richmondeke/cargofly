'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardStats, getMonthlyVolume, getFinancialStats, MonthlyVolume } from '@/lib/dashboard-service';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from 'recharts';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [volumeData, setVolumeData] = useState<MonthlyVolume[]>([]);
    const [financials, setFinancials] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!user) return;
            try {
                const [statsData, volume, finData] = await Promise.all([
                    getDashboardStats(user.uid),
                    getMonthlyVolume(user.uid),
                    getFinancialStats(user.uid)
                ]);
                setStats(statsData);
                setVolumeData(volume);
                setFinancials(finData);
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [user]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    const statusData = stats ? [
        { name: 'In Transit', value: stats.inTransit },
        { name: 'Delivered', value: stats.delivered },
        { name: 'Pending', value: stats.totalShipments - (stats.inTransit + stats.delivered) },
    ] : [];

    return (
        <div className="flex-1 overflow-y-auto p-8 h-full bg-slate-50 dark:bg-background-dark">
            <DashboardHeader
                title="Analytics Dashboard"
                subtitle="Insights into your shipping performance and spend"
            />

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Shipments</h3>
                            <p className="text-3xl font-medium text-slate-900 dark:text-white">{stats?.totalShipments}</p>
                        </div>
                        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Delivered</h3>
                            <p className="text-3xl font-medium text-green-500">{stats?.delivered}</p>
                        </div>
                        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">In Transit</h3>
                            <p className="text-3xl font-medium text-blue-500">{stats?.inTransit}</p>
                        </div>
                        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Spend</h3>
                            <p className="text-3xl font-medium text-slate-900 dark:text-white">${financials?.totalRevenue.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Shipment Volume Chart */}
                        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm h-[400px]">
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-6">Shipment Volume (Last 6 Months)</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={volumeData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Shipment Status Distribution */}
                        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm h-[400px]">
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-6">Shipment Status Distribution</h3>
                            <div className="flex h-full items-center justify-center pb-12">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={120}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
