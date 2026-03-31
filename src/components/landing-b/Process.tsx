"use client";
import { motion } from "framer-motion";

const steps = [
    {
        title: "Digital Manifesting",
        description: "Initiate your logistics workflow with our secure digital portal. Real-time slot allocation and automated regulatory checks ensure your cargo is ready for departure.",
        number: "01"
    },
    {
        title: "Airside Integration",
        description: "Our ground operations team coordinates directly with flight crews. Precision loading and technical inspection protocols ensure fleet security and shipment integrity.",
        number: "02"
    },
    {
        title: "Global Distribution",
        description: "Last-mile precision across continental hubs. Full lifecycle visibility with encrypted chain-of-custody tracking from takeoff to final handover.",
        number: "03"
    }
];

export default function Process() {
    return (
        <section className="py-32 bg-white text-navy-900 px-6 relative overflow-hidden">




            {/* Background Accent */}

            <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/5 -skew-x-12 translate-x-1/4" />

            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                    className="mb-24"
                >
                    <div className="inline-block px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-600/20 text-blue-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">
                        The Workflow
                    </div>
                    <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 max-w-4xl text-navy-900">
                        Logistics <span className="text-blue-600 font-black">Engineered</span> for Scale
                    </h2>
                    <p className="text-xl md:text-2xl text-navy-900/60 max-w-3xl font-medium leading-relaxed">
                        We don&apos;t just move cargo; we manage a complex system of aerospace-grade operations to ensure your supply chain never breaks.
                    </p>

                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{
                                duration: 0.8,
                                delay: index * 0.15,
                                ease: [0.23, 1, 0.32, 1]
                            }}
                            className="group relative"
                        >
                            <div className="mb-10 flex items-center gap-6">
                                <div className="text-4xl font-black text-blue-600/10 group-hover:text-blue-500/20 transition-colors duration-500">
                                    {step.number}
                                </div>
                                <div className="h-[2px] flex-1 bg-gradient-to-r from-blue-600/10 to-transparent" />
                            </div>

                            <h3 className="text-2xl md:text-3xl font-bold mb-6 tracking-tight group-hover:text-blue-600 transition-colors duration-500 text-navy-900">
                                {step.title}
                            </h3>
                            <p className="text-lg text-navy-900/50 leading-relaxed font-medium group-hover:text-navy-900/70 transition-colors duration-500">
                                {step.description}
                            </p>

                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
