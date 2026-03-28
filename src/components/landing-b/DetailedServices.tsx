import { Plane, Activity, Thermometer, ShieldCheck, ArrowRight } from "lucide-react";

const serviceCategories = [
    {
        title: "Global Air Freight",
        description: "Priority handling and real-time monitoring for time-critical shipments across six continents. Our network ensures your cargo never stops moving.",
        icon: <Plane className="w-6 h-6" />,
    },
    {
        title: "AOG Specialist",
        description: "Dedicated 24/7 support for Aircraft on Ground logistics. We move critical components with zero-latency response times to keep fleets airborne.",
        icon: <Activity className="w-6 h-6" />,
    },
    {
        title: "Sensitive Cargo",
        description: "Precision-controlled logistics for pharmaceuticals and high-value tech. Advanced thermal monitoring and vibration-dampened handling.",
        icon: <Thermometer className="w-6 h-6" />,
    },
    {
        title: "Secure Logistics",
        description: "Military-grade security protocols for high-value assets. Full chain of custody with end-to-end encryption for all digital documentation.",
        icon: <ShieldCheck className="w-6 h-6" />,
    },
];

const expertiseTags = [
    "Precision Logistics", "Customs Authority", "Express Aviation", "Fleet Monitoring",
    "Digital Ledger POD", "Secure Hangarage", "Asset Insurance", "Global Logistics Hub",
    "Route Optimization", "Priority Clearing", "Technical Logistics", "Freight Intelligence"
];

const topTags = [
    "Smart Logistics", "Live Portals", "Inventory Intelligence",
    "West Africa Reach", "E-commerce Priority", "AOG Response", "Predictive Analytics"
];

export default function DetailedServices() {
    return (
        <section id="detailed-services" className="bg-white text-navy-900 py-32 px-6 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                    className="mb-20 text-center md:text-left"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-navy-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] mb-8 shadow-premium">
                        <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
                        Logistics Intelligence
                    </div>

                    <h2 className="text-6xl md:text-8xl font-bold mb-8 tracking-tighter leading-[0.9]">
                        Operational <span className="text-blue-600 italic">Precision</span>
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-500 max-w-3xl mb-12 font-medium">
                        Integrating aerospace-grade technology with a global logistics network to deliver cargo with mathematical certainty.
                    </p>

                    <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-16">
                        {topTags.map((tag) => (
                            <span key={tag} className="px-6 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs font-bold text-navy-600 uppercase tracking-widest hover:border-blue-600/30 transition-all cursor-default">
                                {tag}
                            </span>
                        ))}
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-6 mb-20">
                        <button onClick={() => window.location.href = '/dashboard/new-booking'} className="group px-10 py-5 bg-navy-900 text-gold-400 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-navy-800 transition-all shadow-2xl flex items-center gap-3">
                            Start Booking
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </motion.div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
                    {serviceCategories.map((category, idx) => (
                        <motion.div
                            key={category.title}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{
                                delay: idx * 0.1,
                                duration: 0.8,
                                ease: [0.23, 1, 0.32, 1]
                            }}
                            className="group p-10 md:p-14 rounded-[3rem] bg-gray-50 border border-gray-100 hover:border-blue-600/30 transition-all duration-700 hover:shadow-premium-xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <category.icon.type {...category.icon.props} className="w-32 h-32" />
                            </div>

                            <div className="relative z-10">
                                <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center text-white mb-10 shadow-premium group-hover:scale-110 transition-transform duration-500">
                                    {category.icon}
                                </div>
                                <h3 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight text-navy-900">{category.title}</h3>
                                <p className="text-xl text-gray-500 leading-relaxed font-medium">
                                    {category.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Expertise Tag Cloud - Marquee */}
                <div className="relative pt-20 border-t border-gray-100/50 overflow-hidden flex flex-col gap-6">
                    <div className="flex overflow-hidden whitespace-nowrap">
                        <motion.div
                            className="flex gap-6 pr-6"
                            animate={{ x: [0, -2000] }}
                            transition={{
                                x: { repeat: Infinity, duration: 60, ease: "linear" }
                            }}
                        >
                            {[...expertiseTags, ...expertiseTags, ...expertiseTags, ...expertiseTags].map((tag, i) => (
                                <div key={i} className="flex items-center gap-2 text-[10px] text-navy-900/40 font-black uppercase tracking-[0.3em] px-8 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 whitespace-nowrap">
                                    {tag}
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
