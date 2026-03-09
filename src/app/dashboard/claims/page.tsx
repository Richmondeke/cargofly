'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getClaims, createClaim, Claim, getActiveShipments, DashboardShipment } from '@/lib/dashboard-service';
import EmptyState from '@/components/common/EmptyState';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClaimsPage() {
    const { user } = useAuth();
    const [claims, setClaims] = useState<Claim[]>([]);
    const [shipments, setShipments] = useState<DashboardShipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFileForm, setShowFileForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        shipmentId: '',
        type: 'damage',
        description: '',
        amount: '',
        currency: 'USD',
    });

    useEffect(() => {
        async function fetchData() {
            if (!user) return;
            try {
                const [claimsData, shipmentsData] = await Promise.all([
                    getClaims(user.uid),
                    getActiveShipments(user.uid)
                ]);
                setClaims(claimsData);
                setShipments(shipmentsData);
            } catch (error) {
                console.error('Error fetching claims data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSubmitting(true);
        try {
            await createClaim(user.uid, {
                shipmentId: formData.shipmentId,
                type: formData.type as any,
                description: formData.description,
                amount: parseFloat(formData.amount) || 0,
                currency: formData.currency,
            });
            setShowFileForm(false);
            setFormData({
                shipmentId: '',
                type: 'damage',
                description: '',
                amount: '',
                currency: 'USD',
            });
            // Refresh claims
            const newClaims = await getClaims(user.uid);
            setClaims(newClaims);
        } catch (error) {
            console.error('Error filing claim:', error);
            alert('Failed to file claim');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-8 h-full bg-slate-50 dark:bg-background-dark">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl sm:text-[32px] font-bold text-[#1e293b] dark:text-white leading-tight">Claims Center</h1>
                    <p className="text-[14px] text-[#64748b] dark:text-slate-400 mt-1">File and track insurance claims for your shipments</p>
                </div>
                <button
                    onClick={() => setShowFileForm(!showFileForm)}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">{showFileForm ? 'close' : 'report_problem'}</span>
                    {showFileForm ? 'Cancel' : 'File a Claim'}
                </button>
            </div>

            <AnimatePresence>
                {showFileForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-8"
                    >
                        <form onSubmit={handleSubmit} className="bg-white dark:bg-surface-dark rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">File New Claim</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Shipment</label>
                                    <select name="shipmentId" value={formData.shipmentId} onChange={handleChange} required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
                                        <option value="">Select Shipment</option>
                                        {shipments.map(s => (
                                            <option key={s.id} value={s.id}>{s.id} - {s.destination}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Claim Type</label>
                                    <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
                                        <option value="damage">Damaged Goods</option>
                                        <option value="loss">Lost Package</option>
                                        <option value="delay">Significant Delay</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description of Issue</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} rows={4} required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white resize-none" placeholder="Please describe the issue in detail..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Claim Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                        <input type="number" name="amount" value={formData.amount} onChange={handleChange} required className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white" placeholder="0.00" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowFileForm(false)}
                                    className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Claim'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : claims.length > 0 ? (
                <div className="space-y-4">
                    {claims.map((claim) => (
                        <div key={claim.id} className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <StatusPill status={claim.status === 'under_review' ? 'under_review' : claim.status} />
                                    <span className="text-sm text-slate-400">ID: {claim.id}</span>
                                    <span className="text-sm text-slate-400">•</span>
                                    <span className="text-sm text-slate-400">{claim.createdAt?.toDate ? claim.createdAt.toDate().toLocaleDateString() : 'Date Unknown'}</span>
                                </div>
                                <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-1">
                                    {claim.type === 'damage' ? 'Damaged Goods' : claim.type === 'loss' ? 'Lost Package' : 'Delay Compensation'}
                                    <span className="font-normal text-slate-500 mx-2">for Shipment</span>
                                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-base">{claim.shipmentId}</span>
                                </h4>
                                <p className="text-slate-600 dark:text-slate-300 text-sm max-w-2xl">{claim.description}</p>
                            </div>
                            <div className="flex flex-col items-end justify-center min-w-[120px]">
                                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Claim Amount</span>
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">${claim.amount.toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm border-dashed">
                    <EmptyState
                        title="No active claims"
                        description="Your shipments are all safe and sound."
                        imageSrc="/images/illustrations/warehouse_workers.jpg"
                    />
                </div>
            )}
        </div>
    );
}
