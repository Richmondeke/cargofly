"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Package,
    MapPin,
    User,
    CreditCard,
    Check,
    ArrowLeft,
    ArrowRight,
    Shield,
    Clock,
    Plane,
    AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import dynamicImport from "next/dynamic";
const PricingCalculator = dynamicImport(() => import("@/components/PricingCalculator"), { ssr: false });
import { cn } from "@/lib/utils";
import { createShipment, ShipmentAddress, ShipmentPackage } from "@/lib/firestore";
// Removed server-only import. Route type defined locally.

type Route = {
    origin: string;
    destination: string;
    rate: number;
    currency: string;
};
import { useAuth } from "@/contexts/AuthContext";
import { Timestamp } from "firebase/firestore";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select } from "@/components/ui/Select";

type ViewMode = "quote" | "book";
type PaymentMethod = "card";

const steps = [
    { id: 1, title: "Package", icon: Package },
    { id: 2, title: "Sender", icon: User },
    { id: 3, title: "Recipient", icon: MapPin },
    { id: 4, title: "Payment", icon: CreditCard },
];

const cargoTypes = [
    { id: "general", name: "General Cargo" },
    { id: "perishable", name: "Perishable" },
    { id: "hazardous", name: "Hazardous" },
    { id: "live_animals", name: "Live Animals" },
    { id: "healthcare", name: "Healthcare" },
];

export default function ShipPage() {
    const [viewMode, setViewMode] = useState<ViewMode>("quote");
    const [currentStep, setCurrentStep] = useState(1);
    const router = useRouter();
    const { user } = useAuth();
    const [isBooking, setIsBooking] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");

    const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
    const [currentRoute, setCurrentRoute] = useState<Route | undefined>(undefined);

    // Form State
    const [packageDetails, setPackageDetails] = useState({
        weight: "",
        length: "",
        width: "",
        height: "",
        description: "",
        isFragile: false,
        requiresSignature: false,
        insurance: false,
        cargoType: "general",
    });
    // State for MSDS file when hazardous cargo is selected
    const [msdsFile, setMsdsFile] = useState<File | null>(null);

    const [sender, setSender] = useState({
        name: "",
        phone: "",
        address: "",
        city: "",
        country: "",
    });

    const [recipient, setRecipient] = useState({
        name: "",
        phone: "",
        address: "",
        city: "",
        country: "",
    });

    useEffect(() => {
        const fetchRoutes = async () => {
            try {
                const { getRoutes } = await import("@/lib/dashboard-service");
                const routes = await getRoutes();
                setAvailableRoutes(routes);
            } catch (err) {
                console.error("Failed to load routes:", err);
            }
        };
        fetchRoutes();
    }, []);

    // Compute current route whenever sender or recipient city changes and routes are loaded
    useEffect(() => {
        if (sender.city && recipient.city && availableRoutes.length) {
            const route = availableRoutes.find(
                r => r.origin.toLowerCase().includes(sender.city.toLowerCase().trim()) &&
                    r.destination.toLowerCase().includes(recipient.city.toLowerCase().trim())
            );
            setCurrentRoute(route);
        } else {
            setCurrentRoute(undefined);
        }
    }, [sender.city, recipient.city, availableRoutes]);

    const calculatePrices = () => {
        if (!currentRoute) {
            const base = 40 * (parseFloat(packageDetails.weight) || 1);
            const insuranceP = packageDetails.insurance ? 20 : 0;
            return { base, total: base + insuranceP + 25, currency: 'USD' };
        }

        const multiplier = 1.0; // Express by default in this flow or based on some other field
        const base = currentRoute.rate * (parseFloat(packageDetails.weight) || 1) * multiplier;
        const insuranceP = packageDetails.insurance ? 20 : 0;
        return { base, total: base + insuranceP + 25, currency: currentRoute.currency };
    };

    const { base: basePrice, total: totalPrice, currency } = calculatePrices();

    const handleBookShipment = async () => {
        if (!user) {
            router.push("/login?redirect=/ship");
            return;
        }

        // Basic validation
        if (!packageDetails.weight || !sender.name || !recipient.name) {
            alert("Please fill in all required fields.");
            return;
        }
        // Hazardous cargo requires MSDS file
        if (packageDetails.cargoType === "hazardous" && !msdsFile) {
            alert("Please upload the MSDS file for hazardous cargo.");
            return;
        }

        setIsBooking(true);
        try {
            const now = new Date();
            const estimatedDelivery = new Date();
            estimatedDelivery.setDate(now.getDate() + 3);

            // Mock price calculation for now
            const weightNum = parseFloat(packageDetails.weight) || 1;
            const basePrice = 40 * weightNum;
            const insurancePrice = packageDetails.insurance ? 20 : 0;
            const totalPrice = basePrice + insurancePrice + 25; // + fuel

            const trackingNumber = await createShipment({
                userId: user.uid,
                service: "express",
                sender: {
                    name: sender.name,
                    street: sender.address,
                    city: sender.city,
                    state: "", // Optional in UI for now
                    postalCode: "00000", // Default
                    country: sender.country,
                    phone: sender.phone
                },
                recipient: {
                    name: recipient.name,
                    street: recipient.address,
                    city: recipient.city,
                    state: "",
                    postalCode: "00000",
                    country: recipient.country,
                    phone: recipient.phone
                },
                package: {
                    weight: parseFloat(packageDetails.weight),
                    dimensions: {
                        length: parseFloat(packageDetails.length) || 0,
                        width: parseFloat(packageDetails.width) || 0,
                        height: parseFloat(packageDetails.height) || 0
                    },
                    description: packageDetails.description,
                    isFragile: packageDetails.isFragile,
                    requiresSignature: packageDetails.requiresSignature
                },
                price: {
                    base: basePrice,
                    fuel: 25,
                    insurance: insurancePrice,
                    total: totalPrice,
                    currency: currency
                },
                estimatedDelivery: Timestamp.fromDate(estimatedDelivery),
                paymentStatus: "paid",
                cargoType: packageDetails.cargoType
            });

            if (user) {
                router.push(`/dashboard/track/${trackingNumber}`);
            } else {
                router.push(`/track?id=${trackingNumber}`);
            }
        } catch (error) {
            console.error("Booking failed:", error);
            alert("Failed to book shipment. Please try again.");
        } finally {
            setIsBooking(false);
        }
    };

    return (
        <div className="min-h-screen pt-32 pb-24 bg-white dark:bg-navy-900 transition-colors duration-500">
            {/* Background */}
            <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-100 via-white to-gray-50 dark:from-navy-800 dark:via-navy-900 dark:to-black" />
            <div className="fixed inset-0 z-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] dark:invert" />

            <div className="container mx-auto px-6 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <span className="inline-block py-1 px-3 rounded-full bg-gold-500/10 text-gold-400 text-xs font-bold tracking-[0.2em] uppercase mb-6 font-body">
                        Ship with Cargofly
                    </span>
                    <h1 className="font-display text-4xl md:text-5xl text-navy-900 dark:text-white mb-4">
                        Ship Your
                        <span className="block italic text-navy-900/80 dark:text-white/80">Package</span>
                    </h1>
                    <p className="text-navy-900/60 dark:text-white/60 max-w-xl mx-auto font-body">
                        Get an instant quote or book your shipment with our streamlined
                        process.
                    </p>
                </motion.div>

                {/* View Toggle */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex justify-center mb-12"
                >
                    <div className="inline-flex p-1 rounded-xl bg-white/5 border border-white/10">
                        <button
                            onClick={() => setViewMode("quote")}
                            className={cn(
                                "px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-all font-body",
                                viewMode === "quote"
                                    ? "bg-gold-500 text-navy-900"
                                    : "text-navy-900/60 dark:text-white/60 hover:text-navy-900 dark:hover:text-white"
                            )}
                        >
                            Get a Quote
                        </button>
                        <button
                            onClick={() => setViewMode("book")}
                            className={cn(
                                "px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-all font-body",
                                viewMode === "book"
                                    ? "bg-gold-500 text-navy-900"
                                    : "text-navy-900/60 dark:text-white/60 hover:text-navy-900 dark:hover:text-white"
                            )}
                        >
                            Book Shipment
                        </button>
                    </div>
                </motion.div>

                <AnimatePresence mode="wait">
                    {viewMode === "quote" ? (
                        <motion.div
                            key="quote"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="max-w-3xl mx-auto"
                        >
                            <PricingCalculator />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="book"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-4xl mx-auto"
                        >
                            {/* Progress Steps */}
                            <div className="flex justify-between items-center mb-12 relative px-4">
                                <div className="absolute left-0 top-1/2 w-full h-0.5 bg-navy-900/10 dark:bg-white/10 -z-10" />
                                <div
                                    className="absolute left-0 top-1/2 h-0.5 bg-gold-500 -z-10 transition-all duration-500"
                                    style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                                />
                                {steps.map((step) => (
                                    <div
                                        key={step.id}
                                        className={cn(
                                            "relative flex flex-col items-center gap-2",
                                            currentStep >= step.id ? "text-gold-500 dark:text-gold-400" : "text-navy-900/30 dark:text-white/30"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white dark:bg-navy-900",
                                                currentStep >= step.id
                                                    ? "border-gold-500 text-gold-500 shadow-[0_0_20px_rgba(202,138,4,0.3)]"
                                                    : "border-navy-900/10 dark:border-white/10"
                                            )}
                                        >
                                            <step.icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider font-body bg-white dark:bg-navy-900 px-2">
                                            {step.title}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Form Steps */}
                            <div className="glass-panel p-8 rounded-3xl min-h-[500px] flex flex-col justify-between border border-navy-900/10 dark:border-white/10 shadow-xl bg-white/50 dark:bg-navy-900/50 backdrop-blur-md">
                                <AnimatePresence mode="wait">
                                    {currentStep === 1 && (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <h2 className="font-display text-2xl text-navy-900 dark:text-white mb-6">
                                                Package Details
                                            </h2>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="cargoType">Cargo Type</Label>
                                                    <Select
                                                        id="cargoType"
                                                        value={packageDetails.cargoType}
                                                        onChange={(e) => setPackageDetails({ ...packageDetails, cargoType: e.target.value })}
                                                    >
                                                        {cargoTypes.map((type) => (
                                                            <option key={type.id} value={type.id} className="bg-white dark:bg-navy-900">
                                                                {type.name}
                                                            </option>
                                                        ))}
                                                    </Select>
                                                </div>

                                                <AnimatePresence>
                                                    {packageDetails.cargoType === "hazardous" && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex gap-3 items-start">
                                                                <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                                                                <div>
                                                                    <p className="text-orange-400 text-sm font-bold uppercase tracking-wider mb-1">
                                                                        MSDS Required
                                                                    </p>
                                                                    <p className="text-orange-400/80 text-xs font-body leading-relaxed">
                                                                        A Material Safety Data Sheet (MSDS) is mandatory for hazardous cargo. Please upload the file below.
                                                                    </p>
                                                                    <Input
                                                                        type="file"
                                                                        accept=".pdf,.doc,.docx"
                                                                        onChange={e => {
                                                                            const file = e.target.files?.[0] ?? null;
                                                                            setMsdsFile(file);
                                                                        }}
                                                                        className="mt-2"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <Label htmlFor="weight">Weight (kg)</Label>
                                                    <Input
                                                        id="weight"
                                                        type="number"
                                                        value={packageDetails.weight}
                                                        onChange={(e) => setPackageDetails({ ...packageDetails, weight: e.target.value })}
                                                        placeholder="0.0"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <Label>Dimensions (LxWxH cm)</Label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <Input
                                                            type="text"
                                                            value={packageDetails.length}
                                                            onChange={(e) => setPackageDetails({ ...packageDetails, length: e.target.value })}
                                                            placeholder="L"
                                                        />
                                                        <Input
                                                            type="text"
                                                            value={packageDetails.width}
                                                            onChange={(e) => setPackageDetails({ ...packageDetails, width: e.target.value })}
                                                            placeholder="W"
                                                        />
                                                        <Input
                                                            type="text"
                                                            value={packageDetails.height}
                                                            onChange={(e) => setPackageDetails({ ...packageDetails, height: e.target.value })}
                                                            placeholder="H"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <Label htmlFor="description">Contents Description</Label>
                                                <Textarea
                                                    id="description"
                                                    rows={3}
                                                    value={packageDetails.description}
                                                    onChange={(e) => setPackageDetails({ ...packageDetails, description: e.target.value })}
                                                    placeholder="Describe the items..."
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <label className="flex items-center gap-3 p-4 rounded-xl bg-navy-900/5 dark:bg-white/5 border border-navy-900/10 dark:border-white/10 cursor-pointer hover:bg-navy-900/10 dark:hover:bg-white/10 transition-colors">
                                                    <Checkbox
                                                        checked={packageDetails.isFragile}
                                                        onChange={(e) => setPackageDetails({ ...packageDetails, isFragile: e.target.checked })}
                                                    />
                                                    <span className="text-navy-900 dark:text-white font-body">Fragile Item</span>
                                                </label>
                                                <label className="flex items-center gap-3 p-4 rounded-xl bg-navy-900/5 dark:bg-white/5 border border-navy-900/10 dark:border-white/10 cursor-pointer hover:bg-navy-900/10 dark:hover:bg-white/10 transition-colors">
                                                    <Checkbox
                                                        checked={packageDetails.insurance}
                                                        onChange={(e) => setPackageDetails({ ...packageDetails, insurance: e.target.checked })}
                                                    />
                                                    <span className="text-navy-900 dark:text-white font-body">Insurance (+ $20)</span>
                                                </label>
                                            </div>
                                        </motion.div>
                                    )}

                                    {currentStep === 2 && (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <h2 className="font-display text-2xl text-navy-900 dark:text-white mb-6">
                                                Sender Information
                                            </h2>
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div>
                                                    <Label htmlFor="senderName">Full Name</Label>
                                                    <Input
                                                        id="senderName"
                                                        type="text"
                                                        value={sender.name}
                                                        onChange={(e) => setSender({ ...sender, name: e.target.value })}
                                                        placeholder="John Doe"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="senderPhone">Phone Number</Label>
                                                    <Input
                                                        id="senderPhone"
                                                        type="tel"
                                                        value={sender.phone}
                                                        onChange={(e) => setSender({ ...sender, phone: e.target.value })}
                                                        placeholder="+1 (555) 000-0000"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <Label htmlFor="senderAddress">Pickup Address</Label>
                                                <Textarea
                                                    id="senderAddress"
                                                    rows={2}
                                                    value={sender.address}
                                                    onChange={(e) => setSender({ ...sender, address: e.target.value })}
                                                    placeholder="Enter full pickup address..."
                                                />
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div>
                                                    <Label htmlFor="senderCity">City</Label>
                                                    <Input
                                                        id="senderCity"
                                                        type="text"
                                                        value={sender.city}
                                                        onChange={(e) => setSender({ ...sender, city: e.target.value })}
                                                        placeholder="Lagos"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="senderCountry">Country</Label>
                                                    <Input
                                                        id="senderCountry"
                                                        type="text"
                                                        value={sender.country}
                                                        onChange={(e) => setSender({ ...sender, country: e.target.value })}
                                                        placeholder="Nigeria"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {currentStep === 3 && (
                                        <motion.div
                                            key="step3"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <h2 className="font-display text-2xl text-navy-900 dark:text-white mb-6">
                                                Recipient Information
                                            </h2>
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div>
                                                    <Label htmlFor="recipientName">Full Name</Label>
                                                    <Input
                                                        id="recipientName"
                                                        type="text"
                                                        value={recipient.name}
                                                        onChange={(e) => setRecipient({ ...recipient, name: e.target.value })}
                                                        placeholder="Jane Smith"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="recipientPhone">Phone Number</Label>
                                                    <Input
                                                        id="recipientPhone"
                                                        type="tel"
                                                        value={recipient.phone}
                                                        onChange={(e) => setRecipient({ ...recipient, phone: e.target.value })}
                                                        placeholder="+44 20 1234 5678"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <Label htmlFor="recipientAddress">Delivery Address</Label>
                                                <Textarea
                                                    id="recipientAddress"
                                                    rows={2}
                                                    value={recipient.address}
                                                    onChange={(e) => setRecipient({ ...recipient, address: e.target.value })}
                                                    placeholder="Enter full delivery address..."
                                                />
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div>
                                                    <Label htmlFor="recipientCity">City</Label>
                                                    <Input
                                                        id="recipientCity"
                                                        type="text"
                                                        value={recipient.city}
                                                        onChange={(e) => setRecipient({ ...recipient, city: e.target.value })}
                                                        placeholder="London"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="recipientCountry">Country</Label>
                                                    <Input
                                                        id="recipientCountry"
                                                        type="text"
                                                        value={recipient.country}
                                                        onChange={(e) => setRecipient({ ...recipient, country: e.target.value })}
                                                        placeholder="United Kingdom"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {currentStep === 4 && (
                                        <motion.div
                                            key="step4"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <h2 className="font-display text-2xl text-navy-900 dark:text-white mb-6">
                                                Review & Payment
                                            </h2>
                                            <div className="p-6 rounded-xl bg-gold-500/10 border border-gold-500/20">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-navy-900/60 dark:text-white/60 font-body">
                                                        Estimated Total
                                                    </span>
                                                    <span className="font-display text-3xl text-navy-900 dark:text-white">
                                                        {currency === 'NGN' ? '₦' : '$'}{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-navy-900/40 dark:text-white/40 font-body">
                                                    Includes insurance, customs clearance, and tracking
                                                </p>
                                            </div>
                                            <div>
                                                <Label className="mb-4">
                                                    Payment Method
                                                </Label>
                                                <div className="grid grid-cols-2 gap-4 mb-6">
                                                    <button
                                                        onClick={() => setPaymentMethod("card")}
                                                        className={cn(
                                                            "p-4 rounded-xl border flex items-center justify-center gap-2 transition-all",
                                                            "bg-gold-500/10 border-gold-500/50 text-gold-500 dark:text-gold-400"
                                                        )}
                                                    >
                                                        <CreditCard className="w-5 h-5" />
                                                        <span className="font-bold uppercase tracking-wider text-sm">Card</span>
                                                    </button>
                                                </div>

                                                <div className="space-y-6">
                                                    <div>
                                                        <Label>Card Number</Label>
                                                        <Input
                                                            type="text"
                                                            placeholder="1234 5678 9012 3456"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div>
                                                            <Label>Expiry Date</Label>
                                                            <Input
                                                                type="text"
                                                                placeholder="MM/YY"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label>CVV</Label>
                                                            <Input
                                                                type="text"
                                                                placeholder="123"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Checkbox
                                                    id="terms"
                                                    className="mt-1"
                                                />
                                                <label
                                                    htmlFor="terms"
                                                    className="text-sm text-navy-900/60 dark:text-white/60 font-body"
                                                >
                                                    I agree to the{" "}
                                                    <a href="/terms" className="text-gold-600 dark:text-gold-400 hover:text-gold-500 dark:hover:text-gold-300">
                                                        Terms of Service
                                                    </a>{" "}
                                                    and{" "}
                                                    <a href="/privacy" className="text-gold-600 dark:text-gold-400 hover:text-gold-500 dark:hover:text-gold-300">
                                                        Privacy Policy
                                                    </a>
                                                </label>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Navigation */}
                                <div className="flex justify-between mt-8 pt-8 border-t border-navy-900/10 dark:border-white/10">
                                    <button
                                        onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                                        disabled={currentStep === 1}
                                        className={cn(
                                            "flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-body",
                                            currentStep === 1
                                                ? "text-navy-900/30 dark:text-white/30 cursor-not-allowed"
                                                : "text-navy-900/60 dark:text-white/60 hover:text-navy-900 dark:hover:text-white hover:bg-navy-900/5 dark:hover:bg-white/5"
                                        )}
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back
                                    </button>
                                    <motion.button
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() =>
                                            currentStep < 4
                                                ? setCurrentStep((prev) => prev + 1)
                                                : handleBookShipment()
                                        }
                                        disabled={isBooking}
                                        className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gold-500 text-navy-900 font-bold uppercase tracking-wider hover:shadow-[0_0_30px_rgba(202,138,4,0.3)] transition-all"
                                    >
                                        {isBooking ? (
                                            <div className="w-5 h-5 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                {currentStep === 4 ? "Confirm Booking" : "Continue"}
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
