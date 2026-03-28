"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    buttonText?: string;
}

export default function SuccessModal({
    isOpen,
    onClose,
    title,
    message,
    buttonText = "Continue to Dashboard"
}: SuccessModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-[440px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
                >
                    {/* Top Accent Gradient */}
                    <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600" />

                    <div className="p-8 text-center">
                        {/* Success Icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                                type: "spring",
                                stiffness: 260,
                                damping: 20,
                                delay: 0.1
                            }}
                            className="w-20 h-20 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6"
                        >
                            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-500" />
                        </motion.div>

                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                            {title}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                            {message}
                        </p>

                        <button
                            onClick={onClose}
                            className="group w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {buttonText}
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>

                    {/* Fun decorative elements */}
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
