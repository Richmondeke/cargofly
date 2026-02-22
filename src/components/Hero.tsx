"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Plane } from "lucide-react";
import HeroWidget from "./HeroWidget";

// Custom Bezier for smooth "slide in"
const smoothEase: [number, number, number, number] = [0.16, 1, 0.3, 1]; // Custom cubic-bezier for premium feel

const slideUp = {
    hidden: { y: 100, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.8,
            ease: smoothEase
        }
    }
};

const slideRight = {
    hidden: { x: -100, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            duration: 0.8,
            ease: smoothEase
        }
    }
};

const slideLeft = {
    hidden: { x: 100, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            duration: 0.8,
            ease: smoothEase,
            delay: 0.2
        }
    }
};

export default function Hero() {
    return (
        <section className="relative w-full flex justify-center items-center py-spacing-11 bg-transparent">

            {/* Main Content Frame */}
            <div className="w-full max-w-[1200px] min-h-[700px] flex flex-col justify-center items-center gap-spacing-12 px-spacing-06 relative z-10">

                {/* Top Section: Text & Image Row */}
                <div className="w-full grid lg:grid-cols-2 gap-spacing-07 lg:gap-spacing-10 items-center">
                    {/* Left Content - Text */}
                    <div className="space-y-8">
                        <motion.h1
                            variants={slideRight}
                            initial="hidden"
                            animate="visible"
                            className="font-display text-4xl md:text-[72px] font-medium text-white leading-[1.1]"
                        >
                            Global Air
                            <br />
                            Freight, Made
                            <br />
                            Simple
                        </motion.h1>

                        <motion.p
                            variants={slideRight}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: 0.1 }}
                            className="text-white/80 text-[16px] font-body max-w-xl leading-relaxed"
                        >
                            Track, Book, and Move Cargo Worldwide —
                            <br />
                            Faster Than Ever.
                        </motion.p>
                    </div>

                    {/* Right Content - Image */}
                    <div className="relative w-full flex items-center justify-end">
                        <motion.div
                            variants={slideLeft}
                            initial="hidden"
                            animate="visible"
                            className="relative w-full max-w-[500px] aspect-[4/3] rounded-[40px] overflow-hidden shadow-2xl border-4 border-white/10"
                        >
                            <Image
                                src="/images/cargofly-truck.jpg"
                                alt="Cargofly Truck"
                                fill
                                className="object-cover"
                                priority
                            />

                            {/* Notification Badge */}
                            <div className="absolute top-6 right-6 bg-white rounded-2xl p-4 shadow-xl flex items-center gap-4 max-w-[240px] animate-fade-slide-up">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <Plane className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">New</p>
                                    <p className="text-[12px] font-medium text-slate-900 leading-tight">At Cargo, we move it fast! Get premium shipment.</p>
                                </div>
                                <div className="absolute -top-1 -left-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                </div>
                            </div>

                            {/* Logo Overlay on Truck */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                <Image src="/logo-light.png" alt="" width={200} height={60} className="object-contain" />
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Bottom Widget */}
                <motion.div
                    variants={slideUp}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.4 }}
                    className="w-full"
                >
                    <HeroWidget />
                </motion.div>
            </div>
        </section>
    );
}
