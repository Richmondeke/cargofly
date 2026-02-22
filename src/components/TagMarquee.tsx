"use client";

import { motion } from "framer-motion";

const ROW1 = [
    "Pharmaceuticals & Healthcare",
    "Aerospace & AOG",
    "E-commerce Logistics",
    "Perishables & Food",
    "Automotive Parts",
    "High-Value Cargo",
    "Oversized Freight",
    "Live Animals",
];

const ROW2 = [
    "Cold Chain Solutions",
    "Charters",
    "Dangerous Goods",
    "Humanitarian Relief",
    "Time-Critical Delivery",
    "Supply Chain Management",
    "Customs Clearance",
    "Project Cargo",
    "Temperature Controlled",
    "Express Freight",
    "Global Distribution",
    "Freight Consolidation",
    "Last-Mile Delivery",
    "Warehouse Management",
];

export default function TagMarquee() {
    return (
        <div className="w-full py-40 bg-transparent relative z-10 space-y-4 border-t border-white/10">
            {/* Row 1 */}
            <div className="flex overflow-hidden">
                <motion.div
                    className="flex gap-4 pr-4"
                    animate={{ x: "-50%" }}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    style={{ width: "fit-content" }}
                >
                    {[...ROW1, ...ROW1, ...ROW1].map((tag, i) => (
                        <div
                            key={i}
                            className="whitespace-nowrap px-6 py-3 bg-[#E0E7FF] border border-navy-900/10 text-navy-900 text-xs font-bold uppercase tracking-tight rounded-md shadow-sm"
                        >
                            {tag}
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Row 2 */}
            <div className="flex overflow-hidden">
                <motion.div
                    className="flex gap-4 pr-4"
                    animate={{ x: "0%" }}
                    initial={{ x: "-50%" }}
                    transition={{
                        duration: 40,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    style={{ width: "fit-content" }}
                >
                    {[...ROW2, ...ROW2, ...ROW2].map((tag, i) => (
                        <div
                            key={i}
                            className="whitespace-nowrap px-6 py-3 bg-[#E0E7FF] border border-navy-900/10 text-navy-900 text-xs font-bold uppercase tracking-tight rounded-md shadow-sm"
                        >
                            {tag}
                        </div>
                    ))}
                </motion.div>
            </div>

            <div className="flex overflow-hidden">
                <motion.div
                    className="flex gap-4 pr-4"
                    animate={{ x: "-50%" }}
                    transition={{
                        duration: 35,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    style={{ width: "fit-content" }}
                >
                    {[...ROW1, ...ROW2].map((tag, i) => (
                        <div
                            key={i}
                            className="whitespace-nowrap px-6 py-3 bg-[#E0E7FF] border border-navy-900/10 text-navy-900 text-xs font-bold uppercase tracking-tight rounded-md shadow-sm"
                        >
                            {tag}
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
