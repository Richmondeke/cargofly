'use client';

import React, { useEffect, useState } from 'react';
import { getLocations, getRoutes, Location, Route } from '@/lib/dashboard-service';

import dynamic from 'next/dynamic';

const NetworkMap = dynamic(() => import('@/components/dashboard/NetworkMap'), {
    ssr: false,
    loading: () => (
        <div className="h-64 bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center rounded-2xl">
            <span className="text-slate-400">Loading Map...</span>
        </div>
    ),
});

export default function NetworkPage() {
    const [loading, setLoading] = useState(true);
    const [locations, setLocations] = useState<Location[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);

    useEffect(() => {
        async function loadData() {
            try {
                const [locData, routeData] = await Promise.all([
                    getLocations(),
                    getRoutes(),
                ]);
                setLocations(locData);
                setRoutes(routeData);
            } catch (error) {
                console.error('Error loading network data:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const stats = {
        activeLocations: locations.filter(l => l.status === 'active').length,
        totalRoutes: routes.length,
        countries: new Set(locations.map(l => l.country)).size,
    };

    return (
        <div className="flex-1 overflow-y-auto p-8 h-full bg-slate-50 dark:bg-background-dark">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-[32px] font-bold text-[#1e293b] dark:text-white leading-tight">Global Network</h1>
                    <p className="text-[14px] text-[#64748b] dark:text-slate-400 mt-1">View hubs, warehouses, and shipping routes</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-surface-dark rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-gold-500">location_on</span>
                        <span className="text-sm font-medium text-slate-500">Active Locations</span>
                    </div>
                    {loading ? (
                        <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    ) : (
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.activeLocations}</p>
                    )}
                </div>
                <div className="bg-white dark:bg-surface-dark rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-sky-500">route</span>
                        <span className="text-sm font-medium text-slate-500">Active Routes</span>
                    </div>
                    {loading ? (
                        <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    ) : (
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalRoutes}</p>
                    )}
                </div>
                <div className="bg-white dark:bg-surface-dark rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-primary">public</span>
                        <span className="text-sm font-medium text-slate-500">Countries</span>
                    </div>
                    {loading ? (
                        <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    ) : (
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.countries}</p>
                    )}
                </div>
            </div>

            {/* Map Section */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-8 overflow-hidden relative z-0">
                <div className="h-96 w-full">
                    <NetworkMap locations={locations} routes={routes} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Locations Table */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Locations</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider font-semibold text-xs">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Country</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {loading ? (
                                    [1, 2, 3].map((i) => (
                                        <tr key={i}>
                                            <td colSpan={4} className="px-6 py-4">
                                                <div className="h-5 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : locations.length > 0 ? (
                                    locations.map((loc) => (
                                        <tr key={loc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-900 dark:text-white">{loc.name}</span>
                                                    <span className="text-xs text-slate-400">({loc.code})</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 capitalize text-slate-600 dark:text-slate-300">{loc.type}</td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{loc.country}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${loc.status === 'active'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                    }`}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                    {loc.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No locations found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Routes Table */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Routes</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider font-semibold text-xs">
                                <tr>
                                    <th className="px-6 py-4">Route</th>
                                    <th className="px-6 py-4">Transit</th>
                                    <th className="px-6 py-4">Mode</th>
                                    <th className="px-6 py-4">Frequency</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {loading ? (
                                    [1, 2, 3].map((i) => (
                                        <tr key={i}>
                                            <td colSpan={4} className="px-6 py-4">
                                                <div className="h-5 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : routes.length > 0 ? (
                                    routes.map((route) => (
                                        <tr key={route.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-900 dark:text-white">{route.origin}</span>
                                                    <span className="material-symbols-outlined text-slate-400 text-sm">arrow_forward</span>
                                                    <span className="text-slate-600 dark:text-slate-300">{route.destination}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{route.transitTime}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-1">
                                                    {route.modes.map((mode) => (
                                                        <span key={mode} className="px-2 py-0.5 bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400 rounded text-xs font-medium">
                                                            {mode}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{route.frequency}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No routes found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
