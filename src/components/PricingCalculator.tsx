import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { createQuote, getRoutes, Route } from "@/lib/dashboard-service";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Package, MapPin, Scale, Zap, Loader2, ArrowRight, Truck, Plane, Shield, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuoteResult {
    price: number;
    currency: string;
    estimatedDays: string;
    service: string;
    serviceId: string;
}

export default function PricingCalculator() {
    const { user } = useAuth();
    const router = useRouter();
    const [origin, setOrigin] = useState("Lagos");
    const [destination, setDestination] = useState("");
    const [weight, setWeight] = useState("");
    const [dimensions, setDimensions] = useState({ length: "", width: "", height: "" });
    const [service, setService] = useState<"express" | "standard" | "economy">("standard");
    const [isCalculating, setIsCalculating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [cargoType, setCargoType] = useState("general");
    const [quote, setQuote] = useState<QuoteResult | null>(null);
    const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);

    useEffect(() => {
        const fetchRoutes = async () => {
            const routes = await getRoutes();
            setAvailableRoutes(routes);
        };
        fetchRoutes();
    }, []);

    const services = [
        { id: "express", name: "Express Air", icon: Plane, days: "1-2 days" },
        { id: "standard", name: "Standard Air", icon: Zap, days: "3-5 days" },
        { id: "economy", name: "Ground", icon: Truck, days: "7-10 days" },
    ];

    const cargoTypes = [
        { id: "general", name: "General Cargo" },
        { id: "perishable", name: "Perishable" },
        { id: "hazardous", name: "Hazardous" },
        { id: "live_animals", name: "Live Animals" },
        { id: "healthcare", name: "Healthcare" },
    ];

    const calculateQuote = async () => {
        if (!origin || !destination || !weight) return;

        setIsCalculating(true);
        setQuote(null);

        // Simulate API call delay for UX
        await new Promise((resolve) => setTimeout(resolve, 800));

        const selectedRoute = availableRoutes.find(
            (r) => r.origin.toLowerCase() === origin.toLowerCase() &&
                r.destination.toLowerCase() === destination.toLowerCase()
        );

        if (!selectedRoute) {
            alert("No route found for this selection.");
            setIsCalculating(false);
            return;
        }

        const weightNum = parseFloat(weight) || 1;
        const baseRate = selectedRoute.rate;

        // Simple multiplier for service types if not explicitly defined in route
        const multiplier = service === 'express' ? 1.5 : (service === 'standard' ? 1 : 0.8);
        const calculatedPrice = baseRate * weightNum * multiplier;

        setQuote({
            price: Math.round(calculatedPrice),
            currency: selectedRoute.currency,
            estimatedDays: selectedRoute.transitTime || (services.find((s) => s.id === service)?.days || "3-5 days"),
            service: services.find((s) => s.id === service)?.name || "Standard",
            serviceId: service,
        });

        setIsCalculating(false);
    };

    const handleSaveQuote = async () => {
        if (!user || !quote) {
            router.push("/login?redirect=/ship");
            return;
        }

        setIsSaving(true);
        try {
            await createQuote(user.uid, {
                origin,
                destination,
                serviceType: quote.serviceId as any,
                weight: parseFloat(weight),
                dimensions: {
                    length: parseFloat(dimensions.length) || 0,
                    width: parseFloat(dimensions.width) || 0,
                    height: parseFloat(dimensions.height) || 0,
                },
                price: quote.price,
                cargoType,
            });

            setQuote(null);
            router.push("/dashboard/quotes");
        } catch (error) {
            console.error("Failed to save quote:", error);
            alert("Failed to save quote. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="glass-panel rounded-3xl overflow-hidden">
            <div className="p-8 md:p-10">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gold-500 flex items-center justify-center">
                        <Package className="w-6 h-6 text-navy-900" />
                    </div>
                    <div>
                        <h3 className="font-display text-2xl text-white">Get a Quote</h3>
                        <p className="text-white/40 text-sm font-body">
                            Instant pricing for your shipment
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Origin & Destination */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-500/70" />
                            <select
                                value={origin}
                                onChange={(e) => setOrigin(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-gold-500/50 transition-all font-body appearance-none"
                            >
                                <option value="" className="bg-navy-900">Select Origin</option>
                                {[...new Set(availableRoutes.map(r => r.origin))].map(o => (
                                    <option key={o} value={o} className="bg-navy-900">{o}</option>
                                ))}
                            </select>
                        </div>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                            <select
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-gold-500/50 transition-all font-body appearance-none"
                            >
                                <option value="" className="bg-navy-900">Select Destination</option>
                                {availableRoutes
                                    .filter(r => r.origin === origin)
                                    .map(r => (
                                        <option key={r.id} value={r.destination} className="bg-navy-900">
                                            {r.destination} ({r.type})
                                        </option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>

                    {/* Weight & Dimensions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                            <input
                                type="number"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                placeholder="Weight (kg)"
                                min="0.1"
                                step="0.1"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-gold-500/50 transition-all font-body"
                            />
                        </div>

                        {/* Cargo Type Selection */}
                        <div className="md:col-span-2">
                            <label className="block text-sm text-white/40 mb-3 font-body uppercase tracking-wider">
                                Cargo Type
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                                {cargoTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setCargoType(type.id)}
                                        className={cn(
                                            "p-2 md:p-3 rounded-xl border transition-all text-center group",
                                            cargoType === type.id
                                                ? "bg-gold-500/20 border-gold-500/50 text-white shadow-[0_0_15px_rgba(202,138,4,0.15)]"
                                                : "bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                                        )}
                                    >
                                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide font-body truncate block">
                                            {type.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* MSDS Warning */}
                        <AnimatePresence>
                            {cargoType === "hazardous" && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="md:col-span-2 overflow-hidden"
                                >
                                    <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex gap-3 items-start">
                                        <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-orange-400 text-sm font-bold uppercase tracking-wider mb-1">
                                                MSDS Required
                                            </p>
                                            <p className="text-orange-400/80 text-xs font-body leading-relaxed">
                                                A Material Safety Data Sheet (MSDS) is mandatory for hazardous cargo. Please ensure you have this document ready for tender.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="relative">
                                <input
                                    type="number"
                                    value={dimensions.length}
                                    onChange={(e) =>
                                        setDimensions({ ...dimensions, length: e.target.value })
                                    }
                                    placeholder="L (cm)"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 md:py-4 px-2 md:px-3 text-white placeholder:text-white/30 focus:outline-none focus:border-gold-500/50 transition-all font-body text-center text-[10px] md:text-sm"
                                />
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={dimensions.width}
                                    onChange={(e) =>
                                        setDimensions({ ...dimensions, width: e.target.value })
                                    }
                                    placeholder="W (cm)"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 md:py-4 px-2 md:px-3 text-white placeholder:text-white/30 focus:outline-none focus:border-gold-500/50 transition-all font-body text-center text-[10px] md:text-sm"
                                />
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={dimensions.height}
                                    onChange={(e) =>
                                        setDimensions({ ...dimensions, height: e.target.value })
                                    }
                                    placeholder="H (cm)"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 md:py-4 px-2 md:px-3 text-white placeholder:text-white/30 focus:outline-none focus:border-gold-500/50 transition-all font-body text-center text-[10px] md:text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Service Selection */}
                    <div>
                        <label className="block text-sm text-white/40 mb-3 font-body uppercase tracking-wider">
                            Service Type
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {services.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setService(s.id as typeof service)}
                                    className={cn(
                                        "p-4 rounded-xl border transition-all text-center group",
                                        service === s.id
                                            ? "bg-gold-500/20 border-gold-500/50"
                                            : "bg-white/5 border-white/10 hover:border-white/20"
                                    )}
                                >
                                    <s.icon
                                        className={cn(
                                            "w-5 h-5 mx-auto mb-2 transition-colors",
                                            service === s.id ? "text-gold-400" : "text-white/40"
                                        )}
                                    />
                                    <p
                                        className={cn(
                                            "text-sm font-medium font-body",
                                            service === s.id ? "text-white" : "text-white/60"
                                        )}
                                    >
                                        {s.name}
                                    </p>
                                    <p className="text-xs text-white/40 font-body mt-1">
                                        {s.days}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Calculate Button */}
                    <motion.button
                        onClick={calculateQuote}
                        disabled={isCalculating || !origin || !destination || !weight}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 rounded-xl bg-gold-500 text-navy-900 font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(202,138,4,0.3)] transition-all flex items-center justify-center gap-2"
                    >
                        {isCalculating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Calculating...
                            </>
                        ) : (
                            <>
                                Get Quote
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </motion.button>
                </div>

                {/* Quote Result Modal */}
                <AnimatePresence>
                    {quote && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                            onClick={() => setQuote(null)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="w-full max-w-md glass-panel rounded-3xl p-8 relative"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Close Button */}
                                <button
                                    onClick={() => setQuote(null)}
                                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>

                                {/* Success Illustration */}
                                <div className="w-full h-40 mx-auto mb-6 rounded-2xl overflow-hidden relative border border-white/10">
                                    <Image
                                        src="/images/illustrations/logistics_checklist.jpg"
                                        alt="Quote Ready"
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 to-transparent" />
                                </div>

                                <h3 className="font-display text-2xl text-white text-center mb-2">
                                    Your Quote is Ready
                                </h3>
                                <p className="text-white/40 text-sm font-body text-center mb-8">
                                    {origin} → {destination}
                                </p>

                                <div className="bg-gold-500/10 rounded-2xl p-6 border border-gold-500/20 mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-white/60 font-body">
                                            Estimated Price
                                        </span>
                                        <span className="text-xs uppercase tracking-wider text-gold-400 font-body">
                                            {quote.service}
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-2 mb-4">
                                        <span className="font-display text-5xl text-white">
                                            ${quote.price.toFixed(2)}
                                        </span>
                                        <span className="text-white/40 font-body">USD</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-white/60 font-body">
                                        <Zap className="w-4 h-4 text-gold-400" />
                                        <span>Delivery in {quote.estimatedDays}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={handleSaveQuote}
                                        disabled={isSaving}
                                        className="py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-medium hover:bg-white/10 hover:text-white transition-colors"
                                    >
                                        {isSaving ? "Saving..." : "Save Quote"}
                                    </button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="py-3 rounded-xl bg-gold-500 text-navy-900 font-bold uppercase tracking-wider"
                                    >
                                        Book Now
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
