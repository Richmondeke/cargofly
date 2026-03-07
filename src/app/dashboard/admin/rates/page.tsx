"use client";

import { useState, useEffect } from "react";
import {
    getRoutes,
    updateRoute,
    addRoute,
    deleteRoute,
    Route
} from "@/lib/dashboard-service";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Check,
    X,
    Globe,
    MapPin,
    DollarSign,
    TrendingUp,
    Filter,
    MoreVertical,
    Save,
    RotateCcw,
    ChevronUp,
    ChevronDown,
    ChevronsUpDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AdminRatesPage() {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Route>>({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [newRoute, setNewRoute] = useState<Partial<Route>>({
        origin: "Lagos",
        destination: "",
        rate: 0,
        currency: "NGN",
        type: "local",
        status: "active",
        modes: ["Air"],
        frequency: "Daily",
        transitTime: "1 Day"
    });
    const [sortConfig, setSortConfig] = useState<{ key: keyof Route; direction: 'asc' | 'desc' | null }>({
        key: 'origin',
        direction: 'asc'
    });

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        setLoading(true);
        try {
            const data = await getRoutes();
            setRoutes(data);
        } catch (error) {
            console.error("Failed to fetch routes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (route: Route) => {
        setEditingId(route.id);
        setEditForm(route);
    };

    const handleSave = async (id: string) => {
        try {
            await updateRoute(id, editForm);
            setEditingId(null);
            fetchRoutes();
        } catch (error) {
            alert("Failed to update route");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to deactivate this route?")) {
            try {
                await deleteRoute(id);
                fetchRoutes();
            } catch (error) {
                alert("Failed to delete route");
            }
        }
    };

    const handleAddRoute = async () => {
        try {
            await addRoute(newRoute as Omit<Route, "id">);
            setShowAddModal(false);
            setNewRoute({
                origin: "Lagos",
                destination: "",
                rate: 0,
                currency: "NGN",
                type: "local",
                status: "active",
                modes: ["Air"],
                frequency: "Daily",
                transitTime: "1 Day"
            });
            fetchRoutes();
        } catch (error) {
            alert("Failed to add route");
        }
    };

    const handleSort = (key: keyof Route) => {
        let direction: 'asc' | 'desc' | null = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = null;
        }
        setSortConfig({ key, direction });
    };

    const sortedRoutes = [...routes].sort((a, b) => {
        if (!sortConfig.key || !sortConfig.direction) return 0;

        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined || bValue === undefined) return 0;

        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const filteredRoutes = sortedRoutes.filter(r =>
        (r.origin || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.destination || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 overflow-y-auto p-8 h-full bg-slate-50 dark:bg-background-dark">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                            Shipping Rates Management
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Manage global shipping routes, base rates, and currency configurations.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold transition-all shadow-lg shadow-gold-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Route
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-navy-900/60 shadow-sm border border-slate-200 dark:border-white/5 rounded-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Globe className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Total Routes</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{routes.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-navy-900/60 shadow-sm border border-slate-200 dark:border-white/5 rounded-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Active Destinations</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {routes.filter(r => r.status === 'active').length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-navy-900/60 shadow-sm border border-slate-200 dark:border-white/5 rounded-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-gold-500" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Currencies</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {[...new Set(routes.map(r => r.currency))].length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white dark:bg-navy-900/60 shadow-sm border border-slate-200 dark:border-white/5 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by origin or destination..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-slate-600 dark:text-slate-300">
                            <Filter className="w-5 h-5" />
                            Filters
                        </button>
                        <button onClick={fetchRoutes} className="p-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-slate-600 dark:text-slate-300">
                            <RotateCcw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Routes Table */}
                <div className="bg-white dark:bg-navy-900/60 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                                <tr>
                                    <th
                                        className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-500 cursor-pointer hover:text-navy-900 dark:hover:text-white transition-colors group/th"
                                        onClick={() => handleSort('origin')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Route
                                            {sortConfig.key === 'origin' ? (
                                                sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-gold-500" /> : <ChevronDown className="w-3 h-3 text-gold-500" />
                                            ) : <ChevronsUpDown className="w-3 h-3 opacity-0 group-hover/th:opacity-100 transition-opacity" />}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-500 cursor-pointer hover:text-navy-900 dark:hover:text-white transition-colors group/th"
                                        onClick={() => handleSort('type')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Type
                                            {sortConfig.key === 'type' ? (
                                                sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-gold-500" /> : <ChevronDown className="w-3 h-3 text-gold-500" />
                                            ) : <ChevronsUpDown className="w-3 h-3 opacity-0 group-hover/th:opacity-100 transition-opacity" />}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-500 cursor-pointer hover:text-navy-900 dark:hover:text-white transition-colors group/th"
                                        onClick={() => handleSort('rate')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Base Rate
                                            {sortConfig.key === 'rate' ? (
                                                sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-gold-500" /> : <ChevronDown className="w-3 h-3 text-gold-500" />
                                            ) : <ChevronsUpDown className="w-3 h-3 opacity-0 group-hover/th:opacity-100 transition-opacity" />}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-500 cursor-pointer hover:text-navy-900 dark:hover:text-white transition-colors group/th"
                                        onClick={() => handleSort('transitTime')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Transit
                                            {sortConfig.key === 'transitTime' ? (
                                                sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-gold-500" /> : <ChevronDown className="w-3 h-3 text-gold-500" />
                                            ) : <ChevronsUpDown className="w-3 h-3 opacity-0 group-hover/th:opacity-100 transition-opacity" />}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-500">Status</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
                                                <p className="text-slate-500">Loading routes...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredRoutes.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <p className="text-slate-500">No routes found matching your search.</p>
                                        </td>
                                    </tr>
                                ) : filteredRoutes.map((route) => (
                                    <tr key={route.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3 font-medium text-slate-900 dark:text-white">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-xs">
                                                    <MapPin className="w-4 h-4 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p>{route.origin} → {route.destination}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                route.type === 'local'
                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                                                    : "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400"
                                            )}>
                                                {route.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingId === route.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={editForm.rate}
                                                        onChange={(e) => setEditForm({ ...editForm, rate: parseFloat(e.target.value) })}
                                                        className="w-20 px-2 py-1 bg-slate-100 dark:bg-white/10 rounded border border-slate-300 dark:border-white/20"
                                                    />
                                                    <span className="text-sm font-bold">{route.currency}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 font-black text-slate-900 dark:text-white">
                                                    {route.currency === 'NGN' ? '₦' : '$'}{(route.rate || 0).toLocaleString()}
                                                    <span className="text-[10px] text-slate-400 font-medium ml-1">/KG</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                            {route.transitTime || "N/A"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "flex items-center gap-1.5 text-xs font-semibold",
                                                route.status === 'active' ? "text-green-500" : "text-slate-400"
                                            )}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full", route.status === 'active' ? "bg-green-500" : "bg-slate-400")} />
                                                {route.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {editingId === route.id ? (
                                                    <button
                                                        onClick={() => handleSave(route.id)}
                                                        className="p-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEdit(route)}
                                                        className="p-2 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-gold-500/20 hover:text-gold-600"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(route.id)}
                                                    className="p-2 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-red-500/20 hover:text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Route Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-navy-900 rounded-3xl p-8 w-full max-w-lg shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Add New Route</h3>
                                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Origin</label>
                                        <input
                                            type="text"
                                            value={newRoute.origin}
                                            onChange={(e) => setNewRoute({ ...newRoute, origin: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Destination</label>
                                        <input
                                            type="text"
                                            value={newRoute.destination}
                                            onChange={(e) => setNewRoute({ ...newRoute, destination: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Base Rate</label>
                                        <input
                                            type="number"
                                            value={newRoute.rate}
                                            onChange={(e) => setNewRoute({ ...newRoute, rate: parseFloat(e.target.value) })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Currency</label>
                                        <select
                                            value={newRoute.currency}
                                            onChange={(e) => setNewRoute({ ...newRoute, currency: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none"
                                        >
                                            <option value="NGN">NGN (₦)</option>
                                            <option value="USD">USD ($)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Type</label>
                                        <select
                                            value={newRoute.type}
                                            onChange={(e) => setNewRoute({ ...newRoute, type: e.target.value as any })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none"
                                        >
                                            <option value="local">Local</option>
                                            <option value="regional">Regional</option>
                                            <option value="international">International</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Transit Time</label>
                                        <input
                                            type="text"
                                            value={newRoute.transitTime}
                                            onChange={(e) => setNewRoute({ ...newRoute, transitTime: e.target.value })}
                                            placeholder="e.g. 1.5HRS"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-6 py-4 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddRoute}
                                    className="flex-1 px-6 py-4 rounded-xl bg-gold-500 text-navy-900 font-bold shadow-lg shadow-gold-500/20"
                                >
                                    Create Route
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
