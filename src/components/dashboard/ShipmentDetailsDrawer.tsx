"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Truck, MapPin, DollarSign, AlertCircle, Image as ImageIcon, Video, Download, Upload, FileText, ImagePlus, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { DashboardShipment } from '@/lib/dashboard-service';
import { StatusPill } from './StatusPill';
import { useAuth } from '@/contexts/AuthContext';

interface ShipmentDetailsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    shipment: DashboardShipment | null;
    isAdmin?: boolean;
    onUploadMedia?: (file: File) => Promise<void>;
    onRefresh?: () => Promise<void>;
}

export function ShipmentDetailsDrawer({
    isOpen,
    onClose,
    shipment,
    isAdmin = false,
    onUploadMedia,
    onRefresh
}: ShipmentDetailsDrawerProps) {
    const { user } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [paying, setPaying] = useState(false);

    const handleInitializePayment = async () => {
        if (!shipment || !user || paying) return;
        setPaying(true);
        try {
            // Extract numeric amount from string if necessary
            const amount = typeof shipment.totalPrice === 'string'
                ? parseFloat(shipment.totalPrice.replace(/[^0-9.]/g, ''))
                : shipment.totalPrice || 0;

            const response = await fetch('/api/payments/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: amount,
                    currency: shipment.totalPrice?.toString().includes('₦') ? 'NGN' : 'USD',
                    customer: {
                        name: user.displayName || 'Customer',
                        email: user.email
                    },
                    description: `Payment for Shipment #${shipment.trackingNumber}`,
                    metadata: {
                        trackingNumber: shipment.trackingNumber,
                        userId: user.uid
                    }
                })
            });

            const result = await response.json();
            if (result.status && result.data?.checkout_url) {
                window.location.href = result.data.checkout_url;
            } else {
                throw new Error(result.message || "Failed to initialize payment");
            }
        } catch (error) {
            console.error("Payment initialization failed:", error);
        } finally {
            setPaying(false);
        }
    };

    const handleVerifyPayment = React.useCallback(async () => {
        if (!shipment?.trackingNumber || verifying) return;
        setVerifying(true);
        try {
            const res = await fetch(`/api/payments/verify?reference=${shipment.trackingNumber}`);
            const result = await res.json();
            if (result.status && onRefresh) {
                await onRefresh();
            }
        } catch (error) {
            console.error("Manual verification failed:", error);
        } finally {
            setVerifying(false);
        }
    }, [shipment?.trackingNumber, verifying, onRefresh]);

    // Auto-verify if payment is pending or failed when drawer opens
    React.useEffect(() => {
        if (isOpen && shipment && shipment.paymentStatus !== 'paid' && !verifying) {
            handleVerifyPayment();
        }
    }, [isOpen, shipment, verifying, handleVerifyPayment]);

    if (!shipment) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onUploadMedia) {
            setUploading(true);
            try {
                await onUploadMedia(file);
            } finally {
                setUploading(false);
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full md:max-w-[500px] bg-white dark:bg-navy-900 z-[101] flex flex-col shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-navy/10 dark:border-white/10 flex items-center justify-between bg-white dark:bg-navy-900 sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl font-display font-medium text-navy dark:text-white mb-1">Shipment Details</h2>
                                <p className="text-xs text-navy/50 dark:text-white/50 uppercase tracking-widest font-medium">
                                    {shipment.trackingNumber}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-navy/5 dark:bg-white/5 flex items-center justify-center text-navy/40 dark:text-white/70 hover:bg-navy/10 dark:hover:bg-white/10 hover:text-navy dark:hover:text-white transition-all underline-none cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                            {/* Quick Info Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-navy/5 dark:bg-white/5 border border-navy/10 dark:border-white/5">
                                    <div className="text-[10px] text-navy/40 dark:text-white/40 uppercase font-medium mb-1">Status</div>
                                    <StatusPill status={shipment.status} />
                                </div>
                                <div className="p-4 rounded-2xl bg-navy/5 dark:bg-white/5 border border-navy/10 dark:border-white/5">
                                    <div className="text-[10px] text-navy/40 dark:text-white/40 uppercase font-medium mb-1">ETA</div>
                                    <div className="text-sm font-medium text-navy dark:text-white">{shipment.eta}</div>
                                </div>
                            </div>

                            {/* Logistics Details */}
                            <section className="space-y-4">
                                <h3 className="text-xs font-medium text-navy/40 dark:text-white/40 uppercase tracking-widest px-1">Logistics</h3>
                                <div className="space-y-4 p-5 rounded-2xl border border-navy/10 dark:border-white/5 bg-navy/5 dark:bg-white/5">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-navy/40 dark:text-white/40 font-medium uppercase">Origin</div>
                                            <div className="text-sm font-medium text-navy dark:text-white">{shipment.origin}</div>
                                        </div>
                                    </div>
                                    <div className="w-px h-4 bg-navy/10 dark:bg-white/10 ml-4"></div>
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
                                            <Truck className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-navy/40 dark:text-white/40 font-medium uppercase">Destination</div>
                                            <div className="text-sm font-medium text-navy dark:text-white">{shipment.destination}</div>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-navy/10 dark:border-white/5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Package className="w-4 h-4 text-navy/40" />
                                                <span className="text-sm font-medium text-navy/70 dark:text-slate-300">Total {shipment.weight}</span>
                                            </div>
                                            <div className="text-sm font-medium text-navy/50 dark:text-slate-400 capitalize">{shipment.category} Service</div>
                                        </div>

                                        {shipment.packages && shipment.packages.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-navy/10 dark:border-white/5 space-y-2">
                                                <div className="text-[10px] text-navy/40 dark:text-white/40 font-medium uppercase mb-3">
                                                    Packages enclosed ({shipment.packages.length})
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    {shipment.packages.map((pkg, idx) => (
                                                        <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white dark:bg-white/5 border border-navy/10 dark:border-white/5">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="text-sm font-medium text-navy dark:text-white">
                                                                    {pkg.description || `Package ${idx + 1}`}
                                                                </div>
                                                                {pkg.dimensions && (
                                                                    <div className="text-[10px] font-medium text-navy/50 dark:text-slate-400 uppercase tracking-wider">
                                                                        {pkg.dimensions.length}x{pkg.dimensions.width}x{pkg.dimensions.height} CM
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-xs font-medium text-navy/70 dark:text-slate-300 bg-navy/5 dark:bg-white/10 px-2 py-1 rounded">
                                                                {pkg.weight} kg
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Financial Details */}
                            <section className="space-y-4">
                                <h3 className="text-xs font-medium text-navy/40 dark:text-white/40 uppercase tracking-widest px-1">Payment & Customs</h3>
                                <div className="p-5 rounded-2xl border border-navy/10 dark:border-white/5 bg-navy/5 dark:bg-white/5 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-navy/40" />
                                            <span className="text-sm text-navy/60 dark:text-slate-400">Shipment Fee</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-navy dark:text-white">{shipment.totalPrice}</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase shadow-sm ${shipment.paymentStatus === 'paid'
                                                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                                    : shipment.paymentStatus === 'failed'
                                                        ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                                                        : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                                    }`}>
                                                    {verifying ? 'VERIFYING...' : (shipment.paymentStatus || 'pending')}
                                                </span>
                                                {shipment.paymentStatus !== 'paid' && !verifying && (
                                                    <button
                                                        onClick={handleVerifyPayment}
                                                        className="text-[10px] font-medium text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">refresh</span>
                                                        VERIFY
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customs Duty Display */}
                                    <div className="pt-4 border-t border-navy/10 dark:border-white/5 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-amber-500" />
                                            <span className="text-sm text-navy/60 dark:text-slate-400">Customs Duty</span>
                                        </div>
                                        <div className="text-sm font-medium text-navy dark:text-white">
                                            {shipment.customsDuty ? `$${shipment.customsDuty.toFixed(2)}` : "None"}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Consignment Media */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-xs font-medium text-navy/40 dark:text-white/40 uppercase tracking-widest">Consignment Media</h3>
                                    {isAdmin && (
                                        <label className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 cursor-pointer transition-colors">
                                            <Upload className="w-3.5 h-3.5" />
                                            UPLOAD
                                            <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} disabled={uploading} />
                                        </label>
                                    )}
                                </div>

                                {uploading && (
                                    <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 flex items-center justify-center gap-3">
                                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-xs font-medium text-primary italic">Uploading consignment media...</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    {shipment.consignmentMedia && shipment.consignmentMedia.length > 0 ? (
                                        shipment.consignmentMedia.map((media, idx) => (
                                            <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden bg-navy/5 dark:bg-white/5 border border-navy/10 dark:border-white/5">
                                                {media.type === 'image' ? (
                                                    <Image
                                                        src={media.url}
                                                        alt={media.name}
                                                        fill
                                                        className="object-cover transition-transform group-hover:scale-110"
                                                        sizes="(max-width: 768px) 50vw, 250px"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                                        <Video className="w-8 h-8 text-navy/40" />
                                                        <span className="text-[10px] font-medium text-navy/50 uppercase">Video File</span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-navy/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center">
                                                    <span className="text-[10px] text-white font-medium truncate pr-4">{media.name}</span>
                                                    <a href={media.url} target="_blank" rel="noopener noreferrer" className="p-1 bg-white/20 hover:bg-white/40 rounded-lg text-white">
                                                        <Download className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-2 py-10 rounded-2xl border-2 border-dashed border-navy/10 dark:border-white/5 flex flex-col items-center justify-center text-navy/30 dark:text-white/20">
                                            <ImageIcon className="w-8 h-8 mb-2 opacity-30" />
                                            <p className="text-xs font-medium italic">No media uploaded yet</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-navy/10 dark:border-white/10 bg-navy-50/50 dark:bg-navy-950/50 space-y-3">
                            {shipment.paymentStatus !== 'paid' && (
                                <button
                                    onClick={handleInitializePayment}
                                    disabled={paying}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {paying ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <DollarSign className="w-4 h-4" />
                                            PAY NOW
                                        </>
                                    )}
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-navy dark:bg-white text-white dark:text-navy-900 font-medium rounded-2xl text-sm transition-all shadow-xl shadow-navy/10 dark:shadow-white/5 hover:-translate-y-0.5 cursor-pointer"
                            >
                                CLOSE DETAILS
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
