"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PromoSection() {
    return (
        <section className="relative py-40 bg-transparent border-t border-white/10">
            <div className="container mx-auto px-spacing-06">
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white rounded-[40px] p-spacing-05 md:p-spacing-07 shadow-2xl overflow-hidden"
                >
                    <div className="relative rounded-[32px] overflow-hidden aspect-[21/9] w-full">
                        <Image
                            src="/images/hero-plane.jpg"
                            alt="Cargo Plane"
                            fill
                            className="object-contain p-12"
                        />

                        {/* Overlay Content */}
                        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/50 to-transparent flex flex-col justify-end items-center text-center pb-spacing-08 md:pb-spacing-10 px-spacing-05">
                            <h2 className="font-display text-4xl md:text-5xl text-[#003399] mb-spacing-03">
                                Ready to move <span className="text-blue-600 font-bold underline decoration-blue-600/30">cargo</span> faster?
                            </h2>
                            <p className="text-slate-600 max-w-lg mx-auto mb-spacing-07 font-body text-sm">
                                Cargofly helps businesses and individuals book and manage air cargo shipments with ease.
                                Get transparent rates, instant tracking, and shipment updates — all from your dashboard.
                            </p>

                            <div className="flex justify-center">
                                <Link href="/register">
                                    <button className="px-10 py-3 bg-[#003399] text-white rounded-lg font-bold text-sm hover:bg-[#00287a] transition-all shadow-lg">
                                        Get started
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
