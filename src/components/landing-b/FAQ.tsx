"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Plus, Minus, HelpCircle } from "lucide-react";

const faqs = [
    {
        question: "What defines Cargofly's technical logistics infrastructure?",
        answer: "Our infrastructure is built on aerospace-grade reliability. We integrate real-time telemetry, automated regulatory compliance, and a global digital ledger to ensure every shipment is tracked with mathematical precision."
    },
    {
        question: "How do you handle mission-critical AOG requirements?",
        answer: "AOG (Aircraft on Ground) shipments are treated with zero-latency priority. Our team is available 24/7 to move critical components through pre-cleared logistics corridors, minimizing downtime and maximizing fleet availability."
    },
    {
        question: "What global regions does Cargofly currently serve?",
        answer: "We maintain primary hubs across West Africa and connect directly to major continental logistics centers in Europe, Asia, and North America. Our network is designed for high-frequency regional trade and intercontinental supply chain stability."
    },
    {
        question: "How is the pricing model structured for enterprise clients?",
        answer: "Pricing is calculated using a dynamic model based on dimensional weight, priority requirements, and regulatory complexity. Enterprise partners benefit from volume-based incentive structures and dedicated capacity allocation."
    },
    {
        question: "Can I integrate Cargofly tracking into my own EPR/WMS?",
        answer: "Yes. Our platform offers a robust API suite for seamless integration into enterprise resource planning and warehouse management systems, providing real-time data flow for full supply chain visibility."
    }
];

export default function FAQ() {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    return (
        <section id="faq" className="py-32 bg-gray-50 text-navy-900 px-6 relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/images/pattern-dots.svg')] bg-[size:20px_20px]" />

            <div className="max-w-4xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                    className="text-center mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-navy-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] mb-8">
                        <HelpCircle className="w-3.5 h-3.5" />
                        Intelligence Base
                    </div>
                    <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 leading-[0.9]">
                        Service <span className="text-blue-600 italic">Clarified</span>
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                        Frequently asked technical questions regarding our global logistical operations.
                    </p>
                </motion.div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{
                                duration: 0.8,
                                delay: index * 0.1,
                                ease: [0.23, 1, 0.32, 1]
                            }}
                            className="group"
                        >
                            <button
                                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                                className={`w-full text-left p-8 md:p-10 rounded-[2.5rem] transition-all duration-500 border ${activeIndex === index
                                        ? "bg-white border-blue-600/30 shadow-premium-xl"
                                        : "bg-white border-gray-100/50 hover:border-blue-600/30 shadow-premium"
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-6">
                                    <h3 className={`text-xl md:text-2xl font-bold transition-colors duration-500 ${activeIndex === index ? "text-blue-600" : "text-navy-900"
                                        }`}>
                                        {faq.question}
                                    </h3>
                                    <div className={`p-2 rounded-2xl transition-all duration-500 shrink-0 ${activeIndex === index ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-blue-600/10 group-hover:text-blue-600"
                                        }`}>
                                        {activeIndex === index ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {activeIndex === index && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-8 text-lg md:text-xl text-gray-500 leading-relaxed font-medium">
                                                {faq.answer}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
