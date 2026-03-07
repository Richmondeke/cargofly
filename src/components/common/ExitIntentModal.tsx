"use strict";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const ExitIntentModal = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Check if user has already seen/dismissed it in this session
        const hasSeen = sessionStorage.getItem("hasSeenExitModal");
        if (hasSeen) {
            setIsDismissed(true);
            return;
        }

        const handleMouseLeave = (e: MouseEvent) => {
            // Trigger when mouse moves out of the top of the window
            if (e.clientY <= 0 && !isDismissed) {
                setIsVisible(true);
                sessionStorage.setItem("hasSeenExitModal", "true");
            }
        };

        document.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            document.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [isDismissed]);

    const handleClose = () => {
        setIsVisible(false);
        setIsDismissed(true);
    };

    if (isDismissed && !isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-4xl bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl border border-white/10 flex flex-col md:flex-row min-h-[500px]"
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-6 right-6 z-20 w-10 h-10 bg-blue-600 text-white flex items-center justify-center rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                        >
                            <span className="material-symbols-outlined font-bold">close</span>
                        </button>

                        {/* Image Side (Left) */}
                        <div className="relative w-full md:w-1/2 min-h-[300px] md:min-h-full">
                            <Image
                                src="/images/illustrations/ground_crew.jpg"
                                alt="Get Priority Updates"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent md:bg-gradient-to-r md:from-transparent md:to-slate-900/10"></div>
                        </div>

                        {/* Form Side (Right) */}
                        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-slate-900">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                                    Get Priority Cargo Updates & Offers
                                </h2>
                                <p className="text-white/60 mb-8 leading-relaxed">
                                    Be the first to know about cargo space, new routes, and special discounts from Cargofly.
                                </p>

                                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                                    <div>
                                        <label className="block text-sm font-medium text-white/80 mb-2">First Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50 transition-colors"
                                            placeholder="Enter your first name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/80 mb-2">Last Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50 transition-colors"
                                            placeholder="Enter your last name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/80 mb-2">
                                            Email<span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50 transition-colors"
                                            placeholder="Enter your email address"
                                        />
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-xl shadow-blue-600/20 transition-all mt-6"
                                    >
                                        Submit
                                    </motion.button>
                                </form>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ExitIntentModal;
