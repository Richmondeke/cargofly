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
    Plus,
    Trash2,
    Calendar,
    Search,
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
    { id: 1, title: "Shipper", icon: User },
    { id: 2, title: "Recipient", icon: MapPin },
    { id: 3, title: "Instructions", icon: Clock },
    { id: 4, title: "Freight", icon: Package },
    { id: 5, title: "Payment", icon: CreditCard },
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
    const [packages, setPackages] = useState<any[]>([{
        id: Math.random().toString(36).substr(2, 9),
        weight: "",
        length: "",
        width: "",
        height: "",
        pieces: "1",
        description: "",
        ticketNumber: "",
        isFragile: false,
    }]);

    const [shippingInstructions, setShippingInstructions] = useState({
        poNumber: "",
        departureDate: "",
        bookingComments: "",
        isDangerousGoods: false,
        cargoType: "general",
    });

    const [accountNumber, setAccountNumber] = useState("");
    const [isSearchingAccount, setIsSearchingAccount] = useState(false);

    // State for insurance which applies to the whole shipment
    const [hasInsurance, setHasInsurance] = useState(false);

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

    const addPackage = () => {
        setPackages([...packages, {
            id: Math.random().toString(36).substr(2, 9),
            weight: "",
            length: "",
            width: "",
            height: "",
            pieces: "1",
            description: "",
            ticketNumber: "",
            isFragile: false,
        }]);
    };

    const removePackage = (id: string) => {
        if (packages.length > 1) {
            setPackages(packages.filter(p => p.id !== id));
        }
    };

    const updatePackage = (id: string, updates: any) => {
        setPackages(packages.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const handleAccountLookup = async () => {
        if (!accountNumber) return;
        setIsSearchingAccount(true);

        try {
            const { getDoc, doc } = await import("firebase/firestore");
            const { db } = await import("@/lib/firebase");

            // Try lookup by UID first (common for account numbers in this app)
            const userRef = doc(db, "users", accountNumber.trim());
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                setSender({
                    name: data.displayName || data.name || "",
                    phone: data.phone || "",
                    address: data.address || "",
                    city: data.city || "",
                    country: data.country || ""
                });
            } else {
                // Secondary lookup: Search by a field 'accountNumber' if it exists
                const { query, collection, where, getDocs } = await import("firebase/firestore");
                const q = query(collection(db, "users"), where("accountNumber", "==", accountNumber.trim().toUpperCase()));
                const querySnap = await getDocs(q);

                if (!querySnap.empty) {
                    const data = querySnap.docs[0].data();
                    setSender({
                        name: data.displayName || data.name || "",
                        phone: data.phone || "",
                        address: data.address || "",
                        city: data.city || "",
                        country: data.country || ""
                    });
                } else {
                    alert("Account number not found. Please enter details manually.");
                }
            }
        } catch (error) {
            console.error("Account lookup error:", error);
            alert("Error looking up account. Please enter details manually.");
        } finally {
            setIsSearchingAccount(false);
        }
    };

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
        const totalWeight = packages.reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0);

        if (!currentRoute) {
            const base = 40 * (totalWeight || 1);
            const insuranceP = hasInsurance ? 20 : 0;
            return { base, total: base + insuranceP + 25, currency: 'USD' };
        }

        const multiplier = 1.0;
        const base = currentRoute.rate * (totalWeight || 1) * multiplier;
        const insuranceP = hasInsurance ? 20 : 0;
        return { base, total: base + insuranceP + 25, currency: currentRoute.currency };
    };

    const { base: basePrice, total: totalPrice, currency } = calculatePrices();

    const handleBookShipment = async () => {
        if (!user) {
            router.push("/login?redirect=/ship");
            return;
        }

        // Basic validation
        if (packages.some(p => !p.weight || !p.description) || !sender.name || !recipient.name || !sender.phone || !recipient.phone) {
            alert("Please fill in all required fields.");
            return;
        }

        // Hazardous cargo requires MSDS file
        if (shippingInstructions.cargoType === "hazardous" && !msdsFile) {
            alert("Please upload the MSDS file for hazardous cargo.");
            return;
        }

        setIsBooking(true);
        try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            const now = new Date();
            const estimatedDelivery = new Date();
            estimatedDelivery.setDate(now.getDate() + 3);

            const { base: basePrice, total: totalPrice, currency } = calculatePrices();

            const trackingNumber = await createShipment({
                userId: user.uid,
                service: "express",
                sender: {
                    name: sender.name,
                    street: sender.address,
                    city: sender.city,
                    state: "",
                    postalCode: "00000",
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
                packages: packages.map(p => ({
                    weight: parseFloat(p.weight),
                    dimensions: {
                        length: parseFloat(p.length) || 0,
                        width: parseFloat(p.width) || 0,
                        height: parseFloat(p.height) || 0
                    },
                    pieces: parseInt(p.pieces) || 1,
                    description: p.description,
                    ticketNumber: p.ticketNumber,
                    isFragile: p.isFragile,
                    requiresSignature: true
                })),
                price: {
                    base: basePrice,
                    fuel: 25,
                    insurance: hasInsurance ? 20 : 0,
                    total: totalPrice,
                    currency: currency
                },
                estimatedDelivery: Timestamp.fromDate(estimatedDelivery),
                departureDate: shippingInstructions.departureDate ? Timestamp.fromDate(new Date(shippingInstructions.departureDate)) : undefined,
                poNumber: shippingInstructions.poNumber,
                bookingComments: shippingInstructions.bookingComments,
                isDangerousGoods: shippingInstructions.isDangerousGoods,
                paymentStatus: "paid",
                cargoType: shippingInstructions.cargoType
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
        <div className="min-h-screen pt-24 md:pt-32 pb-12 md:pb-24 bg-white dark:bg-navy-900 transition-colors duration-500">
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
                    <div className="inline-flex p-1 rounded-xl bg-white/5 border border-white/10 w-full sm:w-auto">
                        <button
                            onClick={() => setViewMode("quote")}
                            className={cn(
                                "flex-1 sm:px-6 py-3 rounded-lg text-xs md:text-sm font-semibold uppercase tracking-wider transition-all font-body",
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
                                "flex-1 sm:px-6 py-3 rounded-lg text-xs md:text-sm font-semibold uppercase tracking-wider transition-all font-body",
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
                            <div className="flex justify-between items-center mb-8 md:mb-12 relative px-2 md:px-4 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
                                <div className="absolute left-0 top-[20px] md:top-1/2 w-full h-0.5 bg-navy-900/10 dark:bg-white/10 -z-10" />
                                <div
                                    className="absolute left-0 top-[20px] md:top-1/2 h-0.5 bg-gold-500 -z-10 transition-all duration-500"
                                    style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
                                />
                                {steps.map((step) => (
                                    <div
                                        key={step.id}
                                        className={cn(
                                            "relative flex flex-col items-center gap-2 min-w-[70px] md:min-w-fit",
                                            currentStep >= step.id ? "text-gold-500 dark:text-gold-400" : "text-navy-900/30 dark:text-white/30"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white dark:bg-navy-900",
                                                currentStep >= step.id
                                                    ? "border-gold-500 text-gold-500 shadow-[0_0_20px_rgba(202,138,4,0.3)]"
                                                    : "border-navy-900/10 dark:border-white/10"
                                            )}
                                        >
                                            <step.icon className="w-4 h-4 md:w-5 md:h-5" />
                                        </div>
                                        <span className={cn(
                                            "text-[10px] md:text-xs font-bold uppercase tracking-wider font-body bg-white dark:bg-navy-900 px-1 md:px-2 transition-all",
                                            currentStep === step.id ? "opacity-100 scale-100" : "opacity-40 scale-90 md:opacity-60 md:scale-100"
                                        )}>
                                            {step.title}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Form Steps */}
                            <div className="glass-panel p-4 md:p-8 rounded-2xl md:rounded-3xl min-h-[500px] flex flex-col justify-between border border-navy-900/10 dark:border-white/10 shadow-xl bg-white/50 dark:bg-navy-900/50 backdrop-blur-md transition-all">
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
                                                Shipper Information
                                            </h2>

                                            {/* Account Lookup */}
                                            <div className="p-4 md:p-6 rounded-2xl bg-navy-900/5 dark:bg-white/5 border border-navy-900/10 dark:border-white/10 mb-8">
                                                <Label htmlFor="accountNumber" className="mb-2 block text-sm font-bold uppercase tracking-wider text-navy-900/60 dark:text-white/60">Auto Populate Shipper Details</Label>
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <div className="relative flex-1">
                                                        <Input
                                                            id="accountNumber"
                                                            type="text"
                                                            value={accountNumber}
                                                            onChange={(e) => setAccountNumber(e.target.value)}
                                                            placeholder="Shipper's Account Number"
                                                            className="pl-10"
                                                        />
                                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-900/40 dark:text-white/40" />
                                                    </div>
                                                    <button
                                                        onClick={handleAccountLookup}
                                                        disabled={isSearchingAccount || !accountNumber}
                                                        className="px-6 py-2 bg-navy-900 dark:bg-white text-white dark:text-navy-900 rounded-xl font-bold text-sm uppercase flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                                                    >
                                                        {isSearchingAccount ? (
                                                            <div className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                                                        ) : (
                                                            <Search className="w-4 h-4" />
                                                        )}
                                                        Search
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div>
                                                    <Label htmlFor="senderName">Shipper's Name *</Label>
                                                    <Input
                                                        id="senderName"
                                                        type="text"
                                                        value={sender.name}
                                                        onChange={(e) => setSender({ ...sender, name: e.target.value })}
                                                        placeholder="Full Name"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="senderPhone">Shipper's Phone *</Label>
                                                    <Input
                                                        id="senderPhone"
                                                        type="tel"
                                                        value={sender.phone}
                                                        onChange={(e) => setSender({ ...sender, phone: e.target.value })}
                                                        placeholder="Phone Number"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <Label htmlFor="senderAddress">Shipper's Contact Address *</Label>
                                                <Textarea
                                                    id="senderAddress"
                                                    rows={3}
                                                    value={sender.address}
                                                    onChange={(e) => setSender({ ...sender, address: e.target.value })}
                                                    placeholder="Full Address"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

                                    {currentStep === 2 && (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <h2 className="font-display text-2xl text-navy-900 dark:text-white mb-6">
                                                Recipient Information
                                            </h2>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

                                    {currentStep === 3 && (
                                        <motion.div
                                            key="step3"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <h2 className="font-display text-2xl text-navy-900 dark:text-white mb-6">
                                                Shipping Instructions
                                            </h2>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div>
                                                    <Label>Purchase Order OR Job Number</Label>
                                                    <Input
                                                        type="text"
                                                        value={shippingInstructions.poNumber}
                                                        onChange={(e) => setShippingInstructions({ ...shippingInstructions, poNumber: e.target.value })}
                                                        placeholder="e.g. PO-12345"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Desired Departure Date</Label>
                                                    <div className="relative">
                                                        <Input
                                                            type="date"
                                                            value={shippingInstructions.departureDate}
                                                            onChange={(e) => setShippingInstructions({ ...shippingInstructions, departureDate: e.target.value })}
                                                            className="pl-10"
                                                        />
                                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-900/40 dark:text-white/40" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <Label>Booking Comments</Label>
                                                <Textarea
                                                    rows={4}
                                                    value={shippingInstructions.bookingComments}
                                                    onChange={(e) => setShippingInstructions({ ...shippingInstructions, bookingComments: e.target.value })}
                                                    placeholder="Add any specific instructions for the carrier..."
                                                />
                                            </div>
                                            <div>
                                                <Label>Cargo Type</Label>
                                                <Select
                                                    value={shippingInstructions.cargoType}
                                                    onChange={(e) => setShippingInstructions({ ...shippingInstructions, cargoType: e.target.value })}
                                                >
                                                    {cargoTypes.map((type) => (
                                                        <option key={type.id} value={type.id}>
                                                            {type.name}
                                                        </option>
                                                    ))}
                                                </Select>
                                            </div>
                                        </motion.div>
                                    )}

                                    {currentStep === 4 && (
                                        <motion.div
                                            key="step4"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-8"
                                        >
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <h2 className="font-display text-xl md:text-2xl text-navy-900 dark:text-white">
                                                    Freight Items
                                                </h2>
                                                <button
                                                    onClick={addPackage}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-navy-900 rounded-xl font-bold text-xs uppercase hover:shadow-lg transition-all"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Add New Freight Item
                                                </button>
                                            </div>

                                            <div className="space-y-6">
                                                {packages.map((pkg, idx) => (
                                                    <motion.div
                                                        key={pkg.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="p-4 md:p-6 rounded-2xl bg-navy-900/5 dark:bg-white/5 border border-navy-900/10 dark:border-white/10 relative"
                                                    >
                                                        {packages.length > 1 && (
                                                            <button
                                                                onClick={() => removePackage(pkg.id)}
                                                                className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <h3 className="font-display text-sm uppercase tracking-widest text-gold-600 dark:text-gold-400 mb-6">
                                                            Freight Item #{idx + 1}
                                                        </h3>

                                                        <div className="space-y-6">
                                                            <div>
                                                                <Label>Freight Description *</Label>
                                                                <Input
                                                                    value={pkg.description}
                                                                    onChange={(e) => updatePackage(pkg.id, { description: e.target.value })}
                                                                    placeholder="e.g. Industrial Machinery Parts"
                                                                />
                                                            </div>

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                                                <div>
                                                                    <Label>Approx. No of Pieces *</Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={pkg.pieces}
                                                                        onChange={(e) => updatePackage(pkg.id, { pieces: e.target.value })}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label>Gross Weight (kg) *</Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={pkg.weight}
                                                                        onChange={(e) => updatePackage(pkg.id, { weight: e.target.value })}
                                                                    />
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <Label>Dimensions (LxWxH cm)</Label>
                                                                    <div className="grid grid-cols-3 gap-2">
                                                                        <Input
                                                                            placeholder="L"
                                                                            value={pkg.length}
                                                                            onChange={(e) => updatePackage(pkg.id, { length: e.target.value })}
                                                                            className="px-2 text-center"
                                                                        />
                                                                        <Input
                                                                            placeholder="W"
                                                                            value={pkg.width}
                                                                            onChange={(e) => updatePackage(pkg.id, { width: e.target.value })}
                                                                            className="px-2 text-center"
                                                                        />
                                                                        <Input
                                                                            placeholder="H"
                                                                            value={pkg.height}
                                                                            onChange={(e) => updatePackage(pkg.id, { height: e.target.value })}
                                                                            className="px-2 text-center"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <Label>Ticket/Voucher # (Optional)</Label>
                                                                <Input
                                                                    value={pkg.ticketNumber}
                                                                    onChange={(e) => updatePackage(pkg.id, { ticketNumber: e.target.value })}
                                                                    placeholder="Reference number"
                                                                />
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                <Checkbox
                                                                    id={`fragile-${pkg.id}`}
                                                                    checked={pkg.isFragile}
                                                                    onChange={(e) => updatePackage(pkg.id, { isFragile: e.target.checked })}
                                                                />
                                                                <Label htmlFor={`fragile-${pkg.id}`} className="cursor-pointer">Fragile Item</Label>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>

                                            {/* Dangerous Goods Section */}
                                            <div className="p-4 md:p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                                                <h3 className="text-red-500 font-bold uppercase tracking-wider text-xs md:text-sm mb-4">Dangerous Goods Declaration *</h3>
                                                <p className="text-red-500/80 text-sm font-body mb-4">
                                                    DOES this shipment contain dangerous goods regulated in Air Transport?
                                                </p>
                                                <Select
                                                    value={shippingInstructions.isDangerousGoods ? "yes" : "no"}
                                                    onChange={(e) => setShippingInstructions({ ...shippingInstructions, isDangerousGoods: e.target.value === "yes" })}
                                                    className="w-full sm:max-w-[200px]"
                                                >
                                                    <option value="no">No</option>
                                                    <option value="yes">Yes</option>
                                                </Select>

                                                <AnimatePresence>
                                                    {shippingInstructions.isDangerousGoods && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="mt-4 pt-4 border-t border-red-500/20"
                                                        >
                                                            <Label className="text-red-500">Upload MSDS File *</Label>
                                                            <Input
                                                                type="file"
                                                                onChange={(e) => setMsdsFile(e.target.files?.[0] || null)}
                                                                className="mt-2 text-red-500 border-red-500/30"
                                                            />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            <div className="bg-navy-900/5 dark:bg-white/5 p-4 rounded-xl text-center font-body text-navy-900/60 dark:text-white/60">
                                                You currently have <span className="font-bold text-navy-900 dark:text-white">{packages.length}</span> freight items
                                            </div>
                                        </motion.div>
                                    )}

                                    {currentStep === 5 && (
                                        <motion.div
                                            key="step5"
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
                                                <div className="space-y-2 mb-4">
                                                    <div className="flex justify-between text-sm text-navy-900/60 dark:text-white/60">
                                                        <span>Base Freight</span>
                                                        <span>{currency === 'NGN' ? '₦' : '$'}{basePrice.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm text-navy-900/60 dark:text-white/60">
                                                        <span>Fuel Surcharge</span>
                                                        <span>{currency === 'NGN' ? '₦' : '$'}25.00</span>
                                                    </div>
                                                    {hasInsurance && (
                                                        <div className="flex justify-between text-sm text-navy-900/60 dark:text-white/60">
                                                            <span>Insurance</span>
                                                            <span>{currency === 'NGN' ? '₦' : '$'}20.00</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Freight Summary */}
                                                <div className="border-t border-gold-500/20 pt-4 mt-4 space-y-3">
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">Shipment Summary</h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-body">
                                                        <div>
                                                            <span className="block text-navy-900/40 dark:text-white/40 text-[10px] uppercase font-bold">Items</span>
                                                            <span className="text-navy-900 dark:text-white">{packages.length} Packages</span>
                                                        </div>
                                                        <div>
                                                            <span className="block text-navy-900/40 dark:text-white/40 text-[10px] uppercase font-bold">Total Pieces</span>
                                                            <span className="text-navy-900 dark:text-white">{packages.reduce((sum, p) => sum + (parseInt(p.pieces) || 0), 0)} Pieces</span>
                                                        </div>
                                                        <div>
                                                            <span className="block text-navy-900/40 dark:text-white/40 text-[10px] uppercase font-bold">Total Weight</span>
                                                            <span className="text-navy-900 dark:text-white">{packages.reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0)} kg</span>
                                                        </div>
                                                        <div>
                                                            <span className="block text-navy-900/40 dark:text-white/40 text-[10px] uppercase font-bold">Service</span>
                                                            <span className="text-navy-900 dark:text-white capitalize">{shippingInstructions.cargoType.replace('_', ' ')}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <p className="text-xs text-navy-900/40 dark:text-white/40 font-body border-t border-gold-500/20 pt-3 mt-4">
                                                    Includes customs clearance, and real-time tracking
                                                </p>
                                            </div>
                                            <div>
                                                <Label className="mb-4 block">
                                                    Payment Method
                                                </Label>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                                    <button
                                                        onClick={() => setPaymentMethod("card")}
                                                        className={cn(
                                                            "p-4 rounded-xl border flex items-center justify-center gap-2 transition-all",
                                                            "bg-gold-500/10 border-gold-500/50 text-gold-500 dark:text-gold-400"
                                                        )}
                                                    >
                                                        <CreditCard className="w-5 h-5" />
                                                        <span className="font-bold uppercase tracking-wider text-sm">Debit/Credit Card</span>
                                                    </button>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <Label htmlFor="cardNumber">Card Number</Label>
                                                        <Input
                                                            id="cardNumber"
                                                            type="text"
                                                            placeholder="1234 5678 9012 3456"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label htmlFor="expiry">Expiry Date</Label>
                                                            <Input
                                                                id="expiry"
                                                                type="text"
                                                                placeholder="MM/YY"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="cvv">CVV</Label>
                                                            <Input
                                                                id="cvv"
                                                                type="password"
                                                                placeholder="123"
                                                                maxLength={3}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                            <div className="flex items-start gap-3 mt-8">
                                                <Checkbox
                                                    id="terms"
                                                    className="mt-1"
                                                />
                                                <label
                                                    htmlFor="terms"
                                                    className="text-sm text-navy-900/60 dark:text-white/60 font-body leading-relaxed"
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

                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-8 border-t border-navy-900/10 dark:border-white/10">
                                    <button
                                        onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                                        disabled={currentStep === 1}
                                        className={cn(
                                            "flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all font-body w-full sm:w-auto",
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
                                            currentStep < 5
                                                ? setCurrentStep((prev) => prev + 1)
                                                : handleBookShipment()
                                        }
                                        disabled={isBooking}
                                        className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gold-500 text-navy-900 font-bold uppercase tracking-wider hover:shadow-[0_0_30px_rgba(202,138,4,0.3)] transition-all text-sm md:text-base w-full sm:w-auto"
                                    >
                                        {isBooking ? (
                                            <div className="w-5 h-5 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                {currentStep === 5 ? "Confirm Booking" : "Continue"}
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
