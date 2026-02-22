"use client";

import { motion } from "framer-motion";




export default function TrustSection() {
    return (
        <section className="bg-transparent pb-spacing-13 pt-spacing-08">
            <div className="container mx-auto px-spacing-06">
                <div className="text-center mb-spacing-10">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="font-display text-3xl md:text-4xl text-white mb-spacing-05"
                    >
                        Trusted by freight forwarders, exporters,
                        <br />
                        and growing businesses worldwide.
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-white/60 text-lg font-body"
                    >
                        Your shipments deserve full visibility, faster processing, and a system you can rely on.
                    </motion.p>
                </div>

                <div className="flex flex-col items-center gap-8">
                    {/* The TagMarquee will follow this section as seen in the screenshot */}
                </div>
            </div>
        </section>
    );
}
