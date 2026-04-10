"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Plane, Shield } from "lucide-react";

export default function Products() {
    return (
        <section id="solutions" className="py-32 bg-white text-navy-900 px-6 relative overflow-hidden">
            {/* Soft Background Radial */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(1,111,255,0.03),transparent)] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                    className="mb-20 text-center md:text-left"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-600/20 text-blue-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">
                        The Portfolio
                    </div>
                    <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 leading-[0.9]">
                        Comprehensive <span className="text-blue-600">Solutions</span>
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-500 max-w-3xl font-medium leading-relaxed">
                        Industry-grade logistics infrastructure built for the complexities of continental trade.
                    </p>
                </motion.div>

                <div className="flex justify-center">
                    {/* Air Freight Product Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                        className="group relative bg-white rounded-[3.5rem] p-4 border border-gray-100 shadow-premium hover:shadow-premium-xl transition-all duration-700 max-w-2xl w-full"
                    >
                        <div className="relative w-full aspect-[4/3] rounded-[3rem] overflow-hidden mb-10">
                            <Image
                                src="/brain/82ddc111-7b1a-490b-b6ed-cd272f40a686/air_freight_dashboard_premium_1774668109150.png"
                                alt="Air Freight Solutions"
                                fill
                                className="object-cover transition-transform duration-1000 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-navy-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        </div>

                        <div className="px-8 pb-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 rounded-2xl bg-blue-600/10 text-blue-600">
                                    <Plane className="w-5 h-5" />
                                </div>
                                <h3 className="text-3xl font-bold tracking-tight text-navy-900">CargoOS Platform</h3>
                            </div>
                            <p className="text-lg text-gray-500 mb-10 font-medium leading-relaxed">
                                Take complete digital control of your air cargo. Manifest management, real-time slot allocation, and automated ledgering in one unified portal.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                <Link
                                    href="/dashboard/new-booking"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-navy-900 text-gold-400 px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-navy-800 transition-all shadow-xl"
                                >
                                    Access Console
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
