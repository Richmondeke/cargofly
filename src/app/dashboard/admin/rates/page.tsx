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
    ChevronsUpDown,
    Clock,
    Ship
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import DashboardHeader from '@/components/dashboard/DashboardHeader';

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
            if (data.length === 0) {
                // FALLBACK MOCK DATA FOR THE USER'S SPECIFIC REQUEST
                const mockRoutes: Route[] = [
                    { id: 'r1', origin: 'Lagos', destination: 'Benin', rate: 2500, currency: 'NGN', type: 'regional', status: 'active', modes: ['Air'], frequency: 'Daily', transitTime: '1.5 Hours' },
                    { id: 'r2', origin: 'Lagos', destination: 'Abidjan', rate: 4200, currency: 'NGN', type: 'regional', status: 'active', modes: ['Air'], frequency: '3x Weekly', transitTime: '2 Hours' },
                    { id: 'r3', origin: 'Lagos', destination: 'Togo', rate: 2800, currency: 'NGN', type: 'regional', status: 'active', modes: ['Air'], frequency: 'Daily', transitTime: '45 Mins' },
                    { id: 'r4', origin: 'Lagos', destination: 'Dubai', rate: 12.5, currency: 'USD', type: 'international', status: 'active', modes: ['Air'], frequency: 'Daily', transitTime: '7 Hours' },
                    { id: 'r5', origin: 'Lagos', destination: 'Ghana', rate: 3500, currency: 'NGN', type: 'regional', status: 'active', modes: ['Air'], frequency: 'Daily', transitTime: '1 Hour' },
                    { id: 'r6', origin: 'Lagos', destination: 'London', rate: 18.2, currency: 'USD', type: 'international', status: 'active', modes: ['Air'], frequency: '5x Weekly', transitTime: '6.5 Hours' },
                    { id: 'r7', origin: 'Regional', destination: 'West Africa', rate: 15.0, currency: 'USD', type: 'regional', status: 'active', modes: ['Air'], frequency: 'Variable', transitTime: '2-4 Hours' },
                ];
                setRoutes(mockRoutes);
            } else {
                setRoutes(data);
            }
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
                <DashboardHeader
                    title="Shipping Rates"
                    subtitle="Manage global shipping routes, base rates, and currency configurations."
                >
                    <Button
                        onClick={() => setShowAddModal(true)}
                        leftIcon={<Plus className="w-5 h-5" />}
                        className="shadow-xl shadow-primary/20"
                    >
                        Add New Route
                    </Button>
                </DashboardHeader>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card variant="default">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                    <Globe className="w-6 h-6 text-blue-500" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Total Routes</p>
                                    <p className="text-2xl font-medium text-slate-900 dark:text-white tracking-tighter">{routes.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card variant="default">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Active Destinations</p>
                                    <p className="text-2xl font-medium text-slate-900 dark:text-white tracking-tighter">
                                        {routes.filter(r => r.status === 'active').length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card variant="premium">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-medium text-white/70 uppercase tracking-widest">Currencies</p>
                                    <p className="text-2xl font-medium text-white tracking-tighter">
                                        {[...new Set(routes.map(r => r.currency))].length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters & Search */}
                <Card variant="flat" className="p-4 mb-8 flex flex-col md:flex-row gap-4 border-none items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                        <Input
                            type="text"
                            placeholder="Search by origin or destination..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 bg-white dark:bg-slate-900 border-none shadow-none"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button
                            variant="outline"
                            leftIcon={<Filter className="w-4 h-4" />}
                            className="flex-1 md:flex-none"
                        >
                            Filters
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={fetchRoutes}
                            className="flex-shrink-0"
                        >
                            <RotateCcw className={cn("w-4 h-4 text-slate-500", loading && "animate-spin")} />
                        </Button>
                    </div>
                </Card>

                {/* Routes Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array(6).fill(0).map((_, i) => (
                            <div key={i} className="bg-white dark:bg-navy-900/40 rounded-3xl p-6 border border-slate-100 dark:border-white/5 animate-pulse h-64" />
                        ))}
                    </div>
                ) : filteredRoutes.length === 0 ? (
                    <div className="bg-white dark:bg-navy-900/40 rounded-3xl p-12 text-center border border-slate-100 dark:border-white/5">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-1">No routes found</h3>
                        <p className="text-slate-500 text-sm">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredRoutes.map((route) => (
                            <motion.div
                                layout
                                key={route.id}
                                className="group relative bg-white dark:bg-[#1e293b] rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/5 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] transition-all duration-500"
                            >
                                {/* Top Badges */}
                                <div className="flex justify-between items-start mb-8">
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[9px] font-medium uppercase tracking-[0.15em]",
                                        route.type === 'international'
                                            ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                                            : route.type === 'regional'
                                                ? "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
                                                : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                                    )}>
                                        {route.type}
                                    </span>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(route)}
                                            className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-primary transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(route.id)}
                                            className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Flow Visualization */}
                                <div className="flex items-center justify-between mb-8 px-2">
                                    <div className="text-left">
                                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Origin</p>
                                        <h4 className="text-xl font-medium text-slate-900 dark:text-white tracking-tight">{route.origin}</h4>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center px-4">
                                        <div className="w-full h-[2px] bg-slate-100 dark:bg-white/10 relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#1e293b] px-2">
                                                <span className="material-symbols-outlined text-primary text-lg animate-pulse">flight</span>
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-medium text-slate-400 mt-3 uppercase tracking-widest">{route.transitTime} Transit</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Dest</p>
                                        <h4 className="text-xl font-medium text-slate-900 dark:text-white tracking-tight">{route.destination}</h4>
                                    </div>
                                </div>

                                {/* Bottom Info Drawer-style */}
                                <div className="bg-slate-50/50 dark:bg-white/5 rounded-3xl p-5 border border-slate-100 dark:border-white/5 flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mb-1">Base Rate</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-medium text-slate-900 dark:text-white tracking-tighter">
                                                {route.currency === 'NGN' ? '₦' : '$'}{(route.rate || 0).toLocaleString()}
                                            </span>
                                            <span className="text-[10px] font-medium text-slate-400">/KG</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <div className={cn("w-1.5 h-1.5 rounded-full", route.status === 'active' ? 'bg-emerald-500' : 'bg-red-500')} />
                                            <span className={cn(
                                                "text-[10px] font-medium uppercase tracking-widest",
                                                route.status === 'active' ? 'text-emerald-600' : 'text-red-500'
                                            )}>
                                                {route.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
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
                                <h3 className="text-2xl font-medium text-slate-900 dark:text-white">Add New Route</h3>
                                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Origin</label>
                                        <input
                                            type="text"
                                            value={newRoute.origin}
                                            onChange={(e) => setNewRoute({ ...newRoute, origin: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Destination</label>
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
                                        <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Base Rate</label>
                                        <input
                                            type="number"
                                            value={newRoute.rate}
                                            onChange={(e) => setNewRoute({ ...newRoute, rate: parseFloat(e.target.value) })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Currency</label>
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
                                        <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Type</label>
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
                                        <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Transit Time</label>
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
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddRoute}
                                    className="flex-1 shadow-lg shadow-primary/20"
                                >
                                    Create Route
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
