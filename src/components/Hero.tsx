"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Plane } from "lucide-react";
import HeroWidget from "./HeroWidget";

// Custom Bezier for smooth "slide in"
const smoothEase: [number, number, number, number] = [0.16, 1, 0.3, 1]; // Custom cubic-bezier for premium feel

const slideUpText = {
    hidden: { y: 60, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 1.0,
            ease: smoothEase
        }
    }
};

const slideUpImage = {
    hidden: { y: 60, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 1.0,
            ease: smoothEase,
            delay: 0.2
        }
    }
};

const slideUpWidget = {
    hidden: { y: 60, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 1.0,
            ease: smoothEase,
            delay: 0.4
        }
    }
};

export default function Hero() {
    return (
        <section className="relative w-full flex justify-center items-center py-40 bg-navy-900 overflow-hidden">
            {/* Motif Background Overlay */}
            <div
                className="absolute inset-0 z-0 opacity-100 pointer-events-none bg-repeat mix-blend-lighten brightness-0 invert"
                style={{ backgroundImage: "url('/Cargofly motif_transparent.png')", backgroundSize: '240px' }}
            />

            {/* Main Content Frame */}
            <div className="w-full max-w-[1200px] min-h-[700px] flex flex-col justify-center items-center gap-spacing-12 px-spacing-06 relative z-10">

                {/* Top Section: Text & Image Row */}
                <div className="w-full grid lg:grid-cols-2 gap-spacing-07 lg:gap-spacing-10 items-center">
                    {/* Left Content - Text */}
                    <div className="space-y-8">
                        <motion.h1
                            variants={slideUpText}
                            initial="hidden"
                            animate="visible"
                            className="font-display text-5xl md:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-6"
                        >
                            {"Global Air Freight, Made ".split("").map((char, index) => (
                                <motion.span
                                    key={index}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{
                                        duration: 0.05,
                                        delay: index * 0.05 + 0.5,
                                    }}
                                >
                                    {char}
                                </motion.span>
                            ))}
                            <br />
                            <motion.span
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                    duration: 0.5,
                                    delay: "Global Air Freight, Made ".length * 0.05 + 0.6,
                                }}
                                className="bg-gold-500 text-navy-900 px-4 py-1 rounded-xl inline-block mt-2"
                            >
                                Simple
                            </motion.span>
                        </motion.h1>

                        <motion.p
                            variants={slideUpText}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: 0.1 }}
                            className="text-white/80 text-base md:text-xl font-body max-w-xl leading-relaxed"
                        >
                            Track, Book, and Move Cargo Worldwide —
                            <br />
                            Faster Than Ever.
                        </motion.p>
                    </div>

                    {/* Right Content - Image */}
                    <div className="relative w-full flex items-center justify-end">
                        <motion.div
                            variants={slideUpImage}
                            initial="hidden"
                            animate="visible"
                            className="relative w-full max-w-[500px] aspect-[4/3] rounded-[40px] overflow-hidden shadow-2xl border-4 border-navy-800"
                        >
                            <Image
                                src="/images/cargofly-truck.jpg"
                                alt="Cargofly Truck"
                                fill
                                className="object-cover"
                                priority
                                sizes="(max-width: 768px) 100vw, 500px"
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
                                <Image src="/logo-light.png" alt="" width={200} height={60} className="object-contain" sizes="200px" />
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Bottom Widget */}
                <motion.div
                    variants={slideUpWidget}
                    initial="hidden"
                    animate="visible"
                    className="w-full mt-24 lg:mt-40 relative z-20"
                >
                    <HeroWidget />
                </motion.div>
            </div>
        </section>
    );
}
