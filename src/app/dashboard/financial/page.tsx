'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getInvoices, getFinancialStats, Invoice } from '@/lib/dashboard-service';
import { useAuth } from '@/contexts/AuthContext';
import RiveAnimation from '@/components/ui/RiveAnimation';

export default function FinancialPage() {
    const { userProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalRevenue: 0, pendingPayments: 0, paidInvoices: 0 });
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    useEffect(() => {
        async function loadData() {
            try {
                const [statsData, invoicesData] = await Promise.all([
                    getFinancialStats(userProfile?.uid, userProfile?.role),
                    getInvoices(userProfile?.uid, userProfile?.role),
                ]);
                setStats(statsData);
                setInvoices(invoicesData);
            } catch (error) {
                console.error('Error loading financial data:', error);
            } finally {
                setLoading(false);
            }
        }
        if (userProfile) {
            loadData();
        }
    }, [userProfile]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const handleExport = () => {
        if (!invoices.length) return;

        const headers = ['Invoice ID', 'Customer', 'Amount', 'Status', 'Date'];
        const csvContent = [
            headers.join(','),
            ...invoices.map(inv => [
                inv.invoiceNumber,
                `"${inv.customerName}"`, // Quote to handle commas in names
                inv.amount,
                inv.status,
                new Date().toLocaleDateString() // Using current date as placeholder for invoice date if not in object
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const expenseData = [
        { name: 'Fuel', value: 35 },
        { name: 'Labor', value: 25 },
        { name: 'Equipment', value: 20 },
        { name: 'Insurance', value: 12 },
        { name: 'Other', value: 8 },
    ];
    // Brand-aligned palette: Navy, Sky, Gold, Navy-light, Slate
    const COLORS = ['#003399', '#4196FF', '#FFCA00', '#0044CE', '#64748b'];

    return (
        <div className="flex-1 overflow-y-auto p-8 h-full bg-slate-50 dark:bg-background-dark">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-[32px] font-bold text-[#1e293b] dark:text-white leading-tight">Financial Hub</h1>
                    <p className="text-[14px] text-[#64748b] dark:text-slate-400 mt-1">Track revenue, expenses, and invoices</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-all shadow-md active:scale-95"
                >
                    <span className="material-symbols-outlined text-lg">download</span>
                    Export Report
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-sky-100 dark:bg-sky-900/30">
                            <span className="material-symbols-outlined text-sky-600 dark:text-sky-400">payments</span>
                        </div>
                        <span className="text-sm text-slate-500 font-medium">Total Revenue</span>
                    </div>
                    {loading ? (
                        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    ) : (
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.totalRevenue)}</p>
                    )}
                </div>
                <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-gold-100 dark:bg-gold-500/20">
                            <span className="material-symbols-outlined text-gold-600 dark:text-gold-400">pending</span>
                        </div>
                        <span className="text-sm text-slate-500 font-medium">Pending Payments</span>
                    </div>
                    {loading ? (
                        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    ) : (
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.pendingPayments)}</p>
                    )}
                </div>
                <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-gold-100 dark:bg-gold-900/30">
                            <span className="material-symbols-outlined text-gold-600 dark:text-gold-400">receipt_long</span>
                        </div>
                        <span className="text-sm text-slate-500 font-medium">Paid Invoices</span>
                    </div>
                    {loading ? (
                        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    ) : (
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.paidInvoices}</p>
                    )}
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Monthly Revenue</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { month: 'Aug', value: 42000 },
                                { month: 'Sep', value: 38000 },
                                { month: 'Oct', value: 51000 },
                                { month: 'Nov', value: 47000 },
                                { month: 'Dec', value: 55000 },
                                { month: 'Jan', value: 61000 },
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}K`} />
                                <Tooltip formatter={(value) => [`$${(value as number).toLocaleString()}`, 'Revenue']} />
                                <Bar dataKey="value" fill="#003399" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Expense Breakdown */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Expense Breakdown</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={expenseData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                                    {expenseData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`${value}%`, '']} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-4 justify-center">
                        {expenseData.map((entry, i) => (
                            <div key={entry.name} className="flex items-center gap-2 text-xs">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                                <span className="text-slate-600 dark:text-slate-400">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Invoices */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Invoices</h3>
                    <button className="text-sm font-semibold text-primary hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider font-semibold text-xs">
                            <tr>
                                <th className="px-6 py-4">Invoice</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading ? (
                                [1, 2, 3].map((i) => (
                                    <tr key={i}>
                                        <td colSpan={5} className="px-6 py-5">
                                            <div className="h-6 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : invoices.length > 0 ? (
                                invoices.slice(0, 5).map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-5 font-bold text-primary">{inv.invoiceNumber}</td>
                                        <td className="px-6 py-5 text-slate-900 dark:text-white">{inv.customerName}</td>
                                        <td className="px-6 py-5 font-semibold">{formatCurrency(inv.amount)}</td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${inv.status === 'paid'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : inv.status === 'overdue'
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                }`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                                <span className="material-symbols-outlined">visibility</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-48 h-48">
                                                <RiveAnimation src="/icons/empty-state.riv" />
                                            </div>
                                            <p className="font-medium">No invoices found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
