'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { FileText, Download, Calendar, CheckCircle2 } from 'lucide-react';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ReportModal({ isOpen, onClose }: ReportModalProps) {
    const [reportType, setReportType] = useState('shipments');
    const [timeframe, setTimeframe] = useState('current_month');
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleDownload = async () => {
        setIsDownloading(true);
        // Simulate generation and download
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsDownloading(false);
        setIsSuccess(true);

        // Reset and close after a delay
        setTimeout(() => {
            setIsSuccess(false);
            onClose();
        }, 2000);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Download Reports" maxWidth="max-w-md">
            {isSuccess ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="size-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={40} />
                    </div>
                    <div>
                        <h3 className="text-xl font-medium text-slate-900 dark:text-white">Report Ready!</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Your report has been generated and <br /> downloaded successfully.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-medium uppercase tracking-widest text-slate-500 block">Select Report Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'shipments', label: 'Shipments', desc: 'Detailed log of all cargo movements' },
                                { id: 'financial', label: 'Financial', desc: 'Billing, invoices, and payment history' },
                                { id: 'analytics', label: 'Analytics', desc: 'Performance and volume metrics' },
                                { id: 'customs', label: 'Customs', desc: 'Compliance and clearance logs' },
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setReportType(type.id)}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${reportType === type.id
                                            ? 'border-primary bg-primary/5'
                                            : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                                        }`}
                                >
                                    <h4 className={`text-sm font-medium ${reportType === type.id ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                                        {type.label}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{type.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-medium uppercase tracking-widest text-slate-500 block">Select Timeframe</label>
                        <div className="relative">
                            <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                value={timeframe}
                                onChange={(e) => setTimeframe(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-slate-900 rounded-xl outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
                            >
                                <option value="current_month">Current Month (March 2026)</option>
                                <option value="last_month">Last Month (February 2026)</option>
                                <option value="current_quarter">Current Quarter (Q1 2026)</option>
                                <option value="year_to_date">Year to Date (2026)</option>
                                <option value="custom">Custom Range...</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                expand_more
                            </span>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
                        <FileText size={18} className="text-blue-500 mt-0.5" />
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                            Reports are generated in **PDF** format by default. You can change this to **Excel** in your settings.
                        </p>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all uppercase tracking-wider"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="flex-1 px-6 py-4 bg-primary text-white rounded-2xl font-medium text-sm hover:brightness-110 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider"
                        >
                            {isDownloading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <Download size={18} />
                                    <span>Download</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
