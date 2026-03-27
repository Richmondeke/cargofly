'use client';

import React, { useState, useEffect } from 'react';
import {
    getAllShipments,
    updateShipmentStatus,
    updateShipmentCustomsDuty,
    applyCustomsDutyWithStatus,
    Shipment,
    ShipmentStatus,
    getStatusDisplay,
    formatTimestamp,
    uploadConsignmentMedia
} from "@/lib/firestore";
import { pushNotification } from '@/contexts/NotificationContext';
import { StatusPill } from "@/components/dashboard/StatusPill";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { ShipmentDetailsDrawer } from "@/components/dashboard/ShipmentDetailsDrawer";
import { DashboardShipment } from "@/lib/dashboard-service";
import {
    Search,
    Filter,
    MoreVertical,
    Eye,
    DollarSign,
    AlertCircle,
    Package,
    ArrowRight,
    RefreshCcw,
    ChevronRight,
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from 'react-hot-toast';
import Link from 'next/link';
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useSearchParams } from 'next/navigation';

export default function AdminShipmentsPage() {
    const searchParams = useSearchParams();
    const initialSearch = searchParams.get('search') || "";
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Duty Modal State
    const [dutyModalOpen, setDutyModalOpen] = useState(false);
    const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
    const [dutyAmount, setDutyAmount] = useState("");
    const [submittingDuty, setSubmittingDuty] = useState(false);

    // Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerShipment, setDrawerShipment] = useState<DashboardShipment | null>(null);

    const handleUploadMedia = async (file: File) => {
        if (!drawerShipment?.id) return;
        try {
            await uploadConsignmentMedia(drawerShipment.id, file);
            toast.success("Media uploaded successfully");
            fetchShipments();
            // Update drawer shipment with new media
            const updated = shipments.find(s => s.id === drawerShipment.id);
            if (updated) setDrawerShipment(updated as any);
        } catch (error) {
            toast.error("Failed to upload media");
            console.error(error);
        }
    };

    useEffect(() => {
        fetchShipments();
    }, []);

    const fetchShipments = async () => {
        setLoading(true);
        const data = await getAllShipments();
        setShipments(data);
        setLoading(false);
    };

    const handleStatusChange = async (shipmentId: string, newStatus: string) => {
        // Optimistic update
        const originalShipments = [...shipments];
        setShipments(prev => prev.map(s => s.id === shipmentId ? { ...s, status: newStatus as ShipmentStatus } : s));

        try {
            const shipment = shipments.find(s => s.id === shipmentId);
            await updateShipmentStatus(
                shipmentId,
                newStatus as ShipmentStatus,
                "Admin Office",
                `Status updated to ${newStatus} by Admin`
            );
            // Push real notification to shipment owner
            if (shipment?.userId) {
                await pushNotification(shipment.userId, {
                    title: `Shipment ${newStatus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
                    message: `Your shipment ${shipment.trackingNumber} has been updated to "${getStatusDisplay(newStatus as ShipmentStatus)}".`,
                    type: 'shipment',
                });
            }
            toast.success(`Shipment status updated to ${newStatus}`);
            // No need for immediate fetchShipments() as optimistic update handles it, 
            // but we call it to sync with server timestamps/progress
            fetchShipments();
        } catch (error: any) {
            // Rollback on failure
            setShipments(originalShipments);
            console.error("Status update error:", error);
            toast.error(`Failed to update status: ${error.message || 'Unknown error'}`);
        }
    };

    const handleApplyDuty = async () => {
        if (!selectedShipment || !dutyAmount || !selectedShipment.id) return;

        const amount = parseFloat(dutyAmount);
        const originalShipments = [...shipments];

        // Optimistic update
        setShipments(prev => prev.map(s => s.id === selectedShipment.id
            ? {
                ...s,
                customsDuty: amount,
                customsDutyStatus: "pending",
                status: "customs_hold",
                progress: 50
            }
            : s
        ));

        setSubmittingDuty(true);
        try {
            await applyCustomsDutyWithStatus(
                selectedShipment.id,
                amount,
                "Customs Processing",
                `Customs duty of $${amount} applied. Shipment placed on hold.`
            );

            // Push customs hold notification to shipment owner
            if (selectedShipment.userId) {
                await pushNotification(selectedShipment.userId, {
                    title: 'Customs Duty Required',
                    message: `Your shipment ${selectedShipment.trackingNumber} has been placed on customs hold. A duty of $${amount.toFixed(2)} is required to proceed.`,
                    type: 'alert',
                });
            }
            toast.success("Customs duty applied and shipment placed on hold");
            setDutyModalOpen(false);
            setDutyAmount("");
            setSelectedShipment(null);
            fetchShipments();
        } catch (error: any) {
            setShipments(originalShipments);
            console.error("Apply duty error:", error);
            toast.error(`Failed to apply duty: ${error.message || 'Unknown error'}`);
        } finally {
            setSubmittingDuty(false);
        }
    };

    const filteredShipments = shipments.filter(shipment => {
        const matchesSearch =
            shipment.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            shipment.sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            shipment.recipient.name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || shipment.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-background-dark h-full">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <DashboardHeader
                    title="Manage Shipments"
                    subtitle="Monitor all active shipments, update statuses, and apply customs duties."
                >
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={fetchShipments}
                            className="rounded-xl"
                        >
                            <RefreshCcw className={cn("w-4 h-4 text-slate-500", loading && "animate-spin")} />
                        </Button>
                    </div>
                </DashboardHeader>

                {/* Filters */}
                <Card variant="flat" className="p-4 mb-8 flex flex-col md:flex-row gap-4 border-none items-center">
                    <div className="flex-1 relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                        <Input
                            type="text"
                            placeholder="Search by Tracking ID, Sender, or Recipient..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 bg-white dark:bg-slate-900 border-none shadow-none"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-white dark:bg-slate-900 border-none shadow-none min-w-[160px]"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="picked_up">Picked Up</option>
                            <option value="in_transit">In Transit</option>
                            <option value="customs_hold">Customs Hold</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </Select>
                    </div>
                </Card>

                {/* Shipments Table */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4">Shipment / Tracking</th>
                                    <th className="px-6 py-4">Sender & Recipient</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Duty & Payment</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={5} className="px-6 py-8">
                                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full mb-2"></div>
                                                <div className="h-3 bg-slate-50 dark:bg-slate-800/50 rounded w-2/3"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredShipments.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            No shipments found matching your filters.
                                        </td>
                                    </tr>
                                ) : filteredShipments.map((shipment) => (
                                    <tr key={shipment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                    <Package className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900 dark:text-white uppercase tracking-tight">{shipment.trackingNumber}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                        <span className="capitalize">{shipment.service}</span>
                                                        <span>•</span>
                                                        <span>{formatTimestamp(shipment.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="text-slate-400 w-8">From:</span>
                                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{shipment.sender.name}</span>
                                                    <span className="text-slate-400 italic">({shipment.sender.city})</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="text-slate-400 w-8">To:</span>
                                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{shipment.recipient.name}</span>
                                                    <span className="text-slate-400 italic">({shipment.recipient.city})</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusPill
                                                status={shipment.status || 'pending'}
                                                interactive={true}
                                                onStatusChange={(status: string) => shipment.id && handleStatusChange(shipment.id, status)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {shipment.customsDuty ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${shipment.customsDutyStatus === 'paid'
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse'
                                                            }`}>
                                                            Duty: ${shipment.customsDuty.toFixed(2)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">No duty applied</span>
                                                )}
                                                <div className="text-[10px] text-slate-500 flex items-center gap-1 uppercase font-medium">
                                                    <span>Shipment:</span>
                                                    <span className={shipment.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}>
                                                        {shipment.paymentStatus}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedShipment(shipment);
                                                        setDutyAmount(shipment.customsDuty?.toString() || "");
                                                        setDutyModalOpen(true);
                                                    }}
                                                    className="text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                                    title="Set Customs Duty"
                                                >
                                                    <DollarSign className="w-5 h-5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setDrawerShipment(shipment as any);
                                                        setIsDrawerOpen(true);
                                                    }}
                                                    className="text-slate-400 hover:text-primary hover:bg-primary/5"
                                                    title="View Details"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Apply Duty Modal */}
                {dutyModalOpen && selectedShipment && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                                <h2 className="text-xl font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                    <AlertCircle className="w-6 h-6 text-amber-500" />
                                    Apply Customs Duty
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">Shipment {selectedShipment.trackingNumber}</p>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Duty Amount (USD)</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</div>
                                        <input
                                            type="number"
                                            value={dutyAmount}
                                            onChange={(e) => setDutyAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Setting this will automatically place the shipment on <span className="font-medium">Customs Hold</span> and notify the user to pay.
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                                <button
                                    onClick={() => {
                                        setDutyModalOpen(false);
                                        setSelectedShipment(null);
                                    }}
                                    className="flex-1 py-3 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApplyDuty}
                                    disabled={submittingDuty || !dutyAmount}
                                    className="flex-1 py-3 font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                >
                                    {submittingDuty ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                    Update Shipment
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                <ShipmentDetailsDrawer
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    shipment={drawerShipment}
                    isAdmin={true}
                    onUploadMedia={handleUploadMedia}
                />
            </div>
        </div>
    );
}
