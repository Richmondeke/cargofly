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
                    className="bg-white rounded-[40px] p-[32px] shadow-2xl flex flex-col items-center text-center"
                >
                    <div className="relative w-full aspect-video overflow-hidden mb-10">
                        <Image
                            src="/images/hero-plane.jpg"
                            alt="Cargo Plane"
                            fill
                            className="object-cover"
                        />
                    </div>

                    <div className="flex flex-col items-center max-w-2xl mx-auto">
                        <h2 className="font-display text-4xl md:text-5xl text-[#003399] mb-4">
                            Ready to move <span className="text-blue-600 font-bold underline decoration-blue-600/30">cargo</span> faster?
                        </h2>
                        <p className="text-slate-600 mb-8 font-body text-sm md:text-base leading-relaxed">
                            Cargofly helps businesses and individuals book and manage air cargo shipments with ease.
                            Get transparent rates, instant tracking, and shipment updates — all from your dashboard.
                        </p>

                        <Link href="/register">
                            <button className="px-10 py-3 bg-[#003399] text-white rounded-lg font-bold text-sm hover:bg-[#00287a] transition-all shadow-lg">
                                Get started
                            </button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
