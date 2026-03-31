"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, MapPin, Package, Plane } from "lucide-react";
const smoothTransition = {
    duration: 1.4,
    ease: [0.23, 1, 0.32, 1] as any
};

export default function Hero() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [activeTab, setActiveTab] = useState<'track' | 'book'>('track');
    const [trackingNumber, setTrackingNumber] = useState("");
    const [bookingData, setBookingData] = useState({ origin: "", destination: "" });

    const handleTrack = (e: React.FormEvent) => {
        e.preventDefault();
        if (trackingNumber.trim()) {
            router.push(`/track?id=${trackingNumber.trim()}`);
        }
    };

    const handleBook = () => {
        router.push("/dashboard/new-booking");
    };

    return (
        <section className="relative min-h-screen flex flex-col bg-navy-950 text-white px-6 overflow-hidden">
            {/* Background Video */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster="/images/illustrations/aircraft_hangar.jpg"
                    preload="auto"
                    className="absolute min-w-full min-h-full object-cover opacity-40 scale-105"
                >
                    <source src="/cargofly-hero.mp4" type="video/mp4" />
                </video>
                {/* Cargofly Blue Overlay - Navy Blue Tint */}
                <div className="absolute inset-0 bg-[#000080]/50 mix-blend-multiply z-[1]" />
                <div className="absolute inset-0 bg-gradient-to-b from-navy-950/80 via-transparent to-navy-950 z-[2]" />
            </div>

            {/* Animated Dot Grid */}
            <div className="absolute inset-0 z-[3] overflow-hidden pointer-events-none opacity-20">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)`,
                        backgroundSize: '48px 48px'
                    }}
                />
            </div>

            <div className="flex-grow flex items-center justify-center pt-32 pb-20">
                <div className="relative z-10 max-w-6xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ ...smoothTransition, duration: 2 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8"
                    >
                        <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/60">Elite Logistics Network</span>
                    </motion.div>

                    <motion.h1
                        className="text-5xl md:text-7xl lg:text-[100px] font-bold tracking-tight mb-6 leading-[0.9] lg:leading-[0.85]"
                        initial={{ opacity: 0, y: 80 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={smoothTransition}
                    >
                        Global Logistics, <br className="hidden md:block" />
                        <span className="text-blue-500 relative inline-block italic">
                            Redefined.
                            <motion.span
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: 1.2, duration: 1, ease: [0.23, 1, 0.32, 1] }}
                                className="absolute -bottom-2 left-0 w-full h-1 bg-gold-500/50 origin-left rounded-full"
                            />
                        </span>
                    </motion.h1>

                    <motion.p
                        className="text-lg md:text-2xl text-white/50 max-w-3xl mx-auto mb-16 font-light leading-relaxed"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...smoothTransition, delay: 0.2 }}
                    >
                        Precision-engineered cargo flight operations for the world's most demanding enterprises. West Africa's premium gateway to global commerce.
                    </motion.p>

                    {/* Tracking & Booking Widget */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...smoothTransition, delay: 0.4 }}
                        className="max-w-4xl mx-auto relative group"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-gold-500/20 rounded-[40px] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                        <div className="relative bg-navy-950/40 backdrop-blur-3xl rounded-[36px] border border-white/10 p-4 md:p-8 shadow-2xl">
                            <div className="flex bg-white/5 backdrop-blur-md rounded-2xl p-1.5 relative overflow-hidden w-full md:w-fit mx-auto border border-white/10 mb-8">
                                <button
                                    className={`flex-1 md:px-12 py-3.5 text-xs font-black tracking-[0.15em] uppercase transition-all duration-500 rounded-xl flex items-center justify-center gap-2.5 ${activeTab === 'track' ? 'bg-navy-900 text-white shadow-xl border border-blue-600/30' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                    onClick={() => setActiveTab('track')}
                                >
                                    <Search className="w-4 h-4" strokeWidth={3} />
                                    <span>Track Shipment</span>
                                </button>
                                <button
                                    className={`flex-1 md:px-12 py-3.5 text-xs font-black tracking-[0.15em] uppercase transition-all duration-500 rounded-xl flex items-center justify-center gap-2.5 ${activeTab === 'book' ? 'bg-navy-900 text-white shadow-xl border border-blue-600/30' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                    onClick={() => setActiveTab('book')}
                                >
                                    <Plane className="w-4 h-4" strokeWidth={3} />
                                    <span>Book Flight</span>
                                </button>
                            </div>

                            <AnimatePresence mode="wait">
                                {activeTab === 'track' ? (
                                    <motion.div
                                        key="track"
                                        initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                        exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                                        transition={smoothTransition}
                                        className="px-2"
                                    >
                                        <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-5 p-2 bg-white/5 rounded-[28px] border border-white/10">
                                            <div className="flex-grow relative flex items-center group/input">
                                                <Search className="absolute left-6 text-white/20 group-focus-within/input:text-blue-500 transition-colors w-6 h-6" strokeWidth={2.5} />
                                                <input
                                                    className="w-full pl-16 pr-6 py-5 rounded-[22px] bg-transparent border-0 focus:ring-0 text-white text-xl placeholder:text-white/20 outline-none font-medium"
                                                    placeholder="Enter AWB or Tracking Number"
                                                    type="text"
                                                    value={trackingNumber}
                                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                className="bg-blue-600 text-white px-12 py-5 rounded-[22px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] active:scale-95 duration-300"
                                            >
                                                Track
                                                <ArrowRight className="w-5 h-5" strokeWidth={3} />
                                            </button>
                                        </form>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="book"
                                        initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                        exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                                        transition={smoothTransition}
                                        className="grid grid-cols-1 md:grid-cols-3 gap-5"
                                    >
                                        <div className="relative group/field">
                                            <input
                                                className="w-full p-5 pl-14 rounded-[22px] bg-white/5 text-white border border-white/5 focus:border-blue-500/50 outline-none transition-all text-lg font-medium placeholder:text-white/20"
                                                placeholder="Origin City"
                                                type="text"
                                                value={bookingData.origin}
                                                onChange={(e) => setBookingData(p => ({ ...p, origin: e.target.value }))}
                                            />
                                            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within/field:text-blue-500 transition-colors" />
                                        </div>
                                        <div className="relative group/field">
                                            <input
                                                className="w-full p-5 pl-14 rounded-[22px] bg-white/5 text-white border border-white/5 focus:border-blue-500/50 outline-none transition-all text-lg font-medium placeholder:text-white/20"
                                                placeholder="Destination City"
                                                type="text"
                                                value={bookingData.destination}
                                                onChange={(e) => setBookingData(p => ({ ...p, destination: e.target.value }))}
                                            />
                                            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within/field:text-blue-500 transition-colors" />
                                        </div>
                                        <button
                                            onClick={handleBook}
                                            className="bg-white text-navy-950 p-5 rounded-[22px] font-black uppercase tracking-widest hover:bg-gold-400 hover:text-navy-950 transition-all shadow-xl active:scale-95 duration-300"
                                        >
                                            Get Quote
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Modernized Scrolling Banner */}
            <motion.div
                className="relative py-12 border-t border-white/5 bg-navy-950 z-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
            >
                {/* Side Fades */}
                <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-navy-950 to-transparent z-30 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-navy-950 to-transparent z-30 pointer-events-none" />

                <div className="flex animate-marquee gap-32 items-center">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-32 flex-shrink-0">
                            <img src="/logo-light.png" alt="Cargofly" className="h-7 w-auto object-contain opacity-30 grayscale brightness-200" />
                            <div className="flex items-center gap-4">
                                <span className="w-2 h-2 rounded-full bg-blue-500/50" />
                                <span className="text-[11px] font-black tracking-[0.3em] opacity-30 uppercase text-white">
                                    Strategic Aviation Network
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            <style jsx global>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 50s linear infinite;
                    display: flex;
                    width: max-content;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </section>
    );
}
