'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    Upload,
    ChevronRight,
    ArrowLeft,
    CreditCard,
    Smartphone,
    FileText,
    ShieldCheck,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { updateKYCStatus } from '@/lib/wallet-service';
import toast from 'react-hot-toast';

interface KYCVerificationProps {
    userId: string;
    onComplete?: () => void;
}

type VerificationStep = 'selection' | 'details' | 'upload' | 'success';

export default function KYCVerification({ userId, onComplete }: KYCVerificationProps) {
    const [step, setStep] = useState<VerificationStep>('selection');
    const [idType, setIdType] = useState<'passport' | 'id_card' | 'drivers_license' | null>(null);
    const [idNumber, setIdNumber] = useState('');
    const [loading, setLoading] = useState(false);

    const handleIdTypeSelect = (type: 'passport' | 'id_card' | 'drivers_license') => {
        setIdType(type);
        setStep('details');
    };

    const handleDetailsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!idNumber) return;
        setStep('upload');
    };

    const handleUploadComplete = async () => {
        setLoading(true);
        try {
            // Simulate API call to upload documents and update status
            await new Promise(resolve => setTimeout(resolve, 2000));
            await updateKYCStatus(userId, 'pending');
            setStep('success');
            toast.success('KYC documents submitted successfully!');
        } catch (error) {
            console.error('KYC submission error:', error);
            toast.error('Failed to submit KYC documents. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
    };

    return (
        <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
                {step === 'selection' && (
                    <motion.div
                        key="selection"
                        variants={containerVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-6"
                    >
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Choose Document Type</h3>
                            <p className="text-slate-500 dark:text-slate-400">Select the type of document you'd like to use for verification</p>
                        </div>

                        <div className="grid gap-4">
                            {[
                                { id: 'passport', label: 'Passport', icon: FileText, desc: 'International travel document' },
                                { id: 'id_card', label: 'National ID Card', icon: CreditCard, desc: 'Government issued identity card' },
                                { id: 'drivers_license', label: 'Driver\'s License', icon: Smartphone, desc: 'Valid driving permit' },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleIdTypeSelect(item.id as any)}
                                    className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:bg-primary/5 transition-all text-left shadow-sm group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-primary group-hover:text-white transition-colors">
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-900 dark:text-white">{item.label}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {step === 'details' && (
                    <motion.div
                        key="details"
                        variants={containerVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-6"
                    >
                        <button
                            onClick={() => setStep('selection')}
                            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Selection
                        </button>

                        <div className="space-y-4">
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Document Details</h3>
                                <p className="text-slate-500 dark:text-slate-400">Enter the details exactly as they appear on your {idType?.replace('_', ' ')}</p>
                            </div>

                            <form onSubmit={handleDetailsSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="idNumber">Document Number</Label>
                                    <Input
                                        id="idNumber"
                                        value={idNumber}
                                        onChange={(e) => setIdNumber(e.target.value)}
                                        placeholder="e.g. A1234567"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="expiryDate">Expiry Date</Label>
                                    <Input
                                        id="expiryDate"
                                        type="date"
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full h-12 rounded-xl text-lg font-semibold mt-4">
                                    Next Step
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                )}

                {step === 'upload' && (
                    <motion.div
                        key="upload"
                        variants={containerVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-6"
                    >
                        <button
                            onClick={() => setStep('details')}
                            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Details
                        </button>

                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Upload Documents</h3>
                            <p className="text-slate-500 dark:text-slate-400">Upload clear photos of your {idType?.replace('_', ' ')}</p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="aspect-[3/2] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center gap-3 p-4 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer group">
                                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Front Side</p>
                                    <p className="text-xs text-slate-500">Tap to upload</p>
                                </div>
                            </div>
                            <div className="aspect-[3/2] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center gap-3 p-4 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer group">
                                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Back Side</p>
                                    <p className="text-xs text-slate-500">Tap to upload</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
                            <div className="flex gap-3">
                                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                                    Ensure that all details on the document are readable and not blurred. Your data is encrypted and used only for identity verification purposes.
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={handleUploadComplete}
                            disabled={loading}
                            className="w-full h-12 rounded-xl text-lg font-semibold"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Complete Verification'
                            )}
                        </Button>
                    </motion.div>
                )}

                {step === 'success' && (
                    <motion.div
                        key="success"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center space-y-6 py-8"
                    >
                        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto text-green-600 mb-6">
                            <CheckCircle2 className="w-12 h-12" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Documents Received</h3>
                            <p className="text-slate-500 dark:text-slate-400">
                                Your identity verification is now under review. This usually takes 24-48 hours.
                            </p>
                        </div>
                        <div className="pt-4">
                            <Button
                                onClick={onComplete}
                                className="w-full h-12 rounded-xl text-lg font-semibold"
                            >
                                Done
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
