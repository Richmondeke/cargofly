'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createBooking, getRoutes, Route } from '@/lib/dashboard-service';
import LottieAnimation from '@/components/ui/LottieAnimation';
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import {
    Package,
    ArrowRight,
    ShieldCheck,
    CreditCard,
    Wallet,
    ChevronRight,
    ChevronLeft,
    Box,
    Activity,
    Plane,
    User,
    CheckCircle2,
    X,
    AlertCircle
} from 'lucide-react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { SuccessModal } from '@/components/common/SuccessModal';

type Step = 1 | 2 | 3 | 4;

export default function NewBookingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, userProfile } = useAuth();
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
    const [notification, setNotification] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'success' | 'error';
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'success'
    });

    const [packages, setPackages] = useState([{
        weight: '',
        description: '',
        isFragile: searchParams.get('cargoType')?.toLowerCase() === 'fragile',
    }]);

    const [formData, setFormData] = useState({
        origin: searchParams.get('origin') || '',
        destination: searchParams.get('destination') || '',
        serviceType: searchParams.get('cargoType')?.toLowerCase() || 'express',
        // Sender
        senderName: '',
        senderPhone: '',
        senderEmail: '',
        // Recipient
        recipientName: '',
        recipientPhone: '',
        recipientEmail: '',
        // Payment
        paymentMethod: 'card' as 'card' | 'wallet',
    });

    // Update form if search params change
    useEffect(() => {
        const origin = searchParams.get('origin');
        const destination = searchParams.get('destination');
        const cargoType = searchParams.get('cargoType')?.toLowerCase();

        if (origin || destination || cargoType) {
            setFormData(prev => ({
                ...prev,
                origin: origin || prev.origin,
                destination: destination || prev.destination,
                serviceType: cargoType || prev.serviceType,
            }));
            if (cargoType === 'fragile') {
                setPackages(prev => {
                    const newPackages = [...prev];
                    newPackages[0].isFragile = true;
                    return newPackages;
                });
            }
        }
    }, [searchParams]);

    const handlePackageChange = (index: number, field: string, value: any) => {
        setPackages(prev => {
            const newPackages = [...prev];
            newPackages[index] = {
                ...newPackages[index],
                [field]: value,
            };
            return newPackages;
        });
    };

    const addPackage = () => {
        setPackages([...packages, {
            weight: '',
            description: '',
            isFragile: false,
        }]);
    };

    const removePackage = (index: number) => {
        setPackages(prev => prev.filter((_, i) => i !== index));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handlePaymentAndSubmit = async () => {
        if (!user) {
            setNotification({
                isOpen: true,
                title: 'Authentication Required',
                message: 'Please login to create a booking.',
                type: 'error'
            });
            return;
        }

        if (formData.paymentMethod === 'wallet' && (userProfile?.walletBalance || 0) < totalPrice) {
            setNotification({
                isOpen: true,
                title: 'Insufficient Balance',
                message: 'Insufficient wallet balance. Please fund your wallet or use a card.',
                type: 'error'
            });
            return;
        }

        setLoading(true);
        try {
            // 1. Create the booking FIRST (with pending status)
            const tracking = await createBooking(user.uid, {
                origin: formData.origin,
                destination: formData.destination,
                serviceType: formData.serviceType,
                packageDetails: packages.map(p => ({
                    weight: parseFloat(p.weight),
                    description: p.description,
                    isFragile: p.isFragile
                })),
                sender: {
                    name: formData.senderName,
                    phone: formData.senderPhone,
                    email: formData.senderEmail,
                },
                recipient: {
                    name: formData.recipientName,
                    phone: formData.recipientPhone,
                    email: formData.recipientEmail,
                },
                price: {
                    base: basePrice,
                    fuel: 0,
                    total: totalPrice,
                    currency: currency,
                },
            }, "pending", user.displayName || userProfile?.displayName || 'User');

            setTrackingNumber(tracking);

            // 2. Process Payment
            if (formData.paymentMethod === 'card') {
                const response = await fetch('/api/payments/initialize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: totalPrice,
                        currency: currency === 'USD' ? 'USD' : 'NGN',
                        customer: {
                            name: user.displayName || formData.senderName,
                            email: user.email
                        },
                        description: `Shipment #${tracking}`,
                        metadata: {
                            trackingNumber: tracking,
                            userId: user.uid
                        }
                    })
                });

                const result = await response.json();

                if (result.status && result.data?.checkout_url) {
                    // Redirect to Korapay Checkout
                    window.location.href = result.data.checkout_url;
                } else {
                    throw new Error(result.message || "Failed to initialize secure checkout");
                }
            } else {
                // Wallet payment
                const res = await fetch('/api/payments/graph', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user.uid,
                        amount: totalPrice,
                        currency: currency,
                        method: 'wallet_usd',
                        description: `Payment for Shipment #${tracking}`,
                        shipmentId: tracking
                    })
                });

                if (res.ok) {
                    setCurrentStep(4);
                } else {
                    const err = await res.json();
                    throw new Error(err.message || "Wallet payment failed");
                }
            }
        } catch (error: any) {
            console.error('Error creating booking:', error);
            setNotification({
                isOpen: true,
                title: 'Booking Failed',
                message: error.message || 'Failed to create booking. Please try again.',
                type: 'error'
            });
        } finally {
            if (formData.paymentMethod !== 'card') {
                setLoading(false);
            }
        }
    };

    const steps = [
        { number: 1, label: 'Details' },
        { number: 2, label: 'Package' },
        { number: 3, label: 'Payment' },
        { number: 4, label: 'Confirm' },
    ];

    const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);

    useEffect(() => {
        const fetchRoutes = async () => {
            const routes = await getRoutes();
            setAvailableRoutes(routes);
        };
        fetchRoutes();
    }, []);

    // Find current route
    const currentRoute = availableRoutes.find(
        r => r.origin.toLowerCase().includes(formData.origin.toLowerCase().split(',')[0]) &&
            r.destination.toLowerCase().includes(formData.destination.toLowerCase().split(',')[0])
    );

    // Calculate estimated price
    const calculatePrices = () => {
        const totalWeight = packages.reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0) || 1;
        const weightToUse = Math.max(totalWeight, 0);

        if (!currentRoute) {
            const base = formData.serviceType === 'express' ? 250 : (formData.serviceType === 'standard' ? 150 : 100);
            const weightP = weightToUse * 10;
            const total = base + weightP;
            return {
                base,
                total: isNaN(total) ? 275 : total,
                currency: 'USD'
            };
        }

        const rate = currentRoute.rate || 0;
        const multiplier = formData.serviceType === 'express' ? 1.5 : (formData.serviceType === 'standard' ? 1 : 0.8);
        const base = rate * weightToUse * multiplier;
        const total = base;

        return {
            base,
            total: isNaN(total) ? 0 : total,
            currency: currentRoute.currency || 'USD'
        };
    };

    const { base: basePrice, total: totalPrice, currency } = calculatePrices();

    const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100;
    const stepLabel = steps.find(s => s.number === currentStep)?.label || '';

    return (
        <div className="flex-1 overflow-y-auto py-10 px-4 md:px-10 h-full bg-[#f8f6f6] dark:bg-background-dark">
            <div className="flex flex-col max-w-[800px] mx-auto flex-1">

                {/* Progress Section */}
                <div className="flex flex-col gap-4 mb-8 bg-white dark:bg-slate-900/40 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">New Shipment</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Step {currentStep}: {stepLabel}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-primary font-bold text-lg">{Math.round(progressPercent === 0 ? 33 : progressPercent)}%</p>
                            <p className="text-slate-400 text-xs uppercase tracking-wider">Complete</p>
                        </div>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                        <div
                            className="bg-primary h-full rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent === 0 ? 33.33 : progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Form Content */}
                <div className="w-full relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        >
                            {currentStep === 1 && (
                                <>
                                    {/* Step 1 Form Card */}
                                    <div className="bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                        {/* Section Header */}
                                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">location_on</span>
                                                Origin &amp; Destination
                                            </h3>
                                        </div>

                                        {/* Fields Grid */}
                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Origin */}
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Origin City/Airport</label>
                                                <AddressAutocomplete
                                                    id="origin"
                                                    label=""
                                                    value={formData.origin}
                                                    onChange={(val) => setFormData(prev => ({ ...prev, origin: val }))}
                                                    placeholder="e.g. London (LHR)"
                                                />
                                            </div>

                                            {/* Destination */}
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Destination City/Airport</label>
                                                <AddressAutocomplete
                                                    id="destination"
                                                    label=""
                                                    value={formData.destination}
                                                    onChange={(val) => setFormData(prev => ({ ...prev, destination: val }))}
                                                    placeholder="e.g. New York (JFK)"
                                                />
                                            </div>

                                            {/* Departure Date */}
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Preferred Departure Date</label>
                                                <div className="relative">
                                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">calendar_month</span>
                                                    <input
                                                        type="date"
                                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                                                    />
                                                </div>
                                            </div>

                                            {/* Service Level dropdown */}
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Service Level</label>
                                                <div className="relative">
                                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">layers</span>
                                                    <select
                                                        name="serviceType"
                                                        value={formData.serviceType}
                                                        onChange={handleChange}
                                                        className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none text-sm"
                                                    >
                                                        <option value="express">Express (1-2 days)</option>
                                                        <option value="standard">Standard (3-5 days)</option>
                                                        <option value="economy">Eco (5-7 days)</option>
                                                    </select>
                                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[20px]">expand_more</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Service Level Quick Select Cards */}
                                        <div className="px-6 pb-8">
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Quick Service Select</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                {[
                                                    { value: 'express', icon: 'bolt', label: 'Express', sub: 'Highest priority' },
                                                    { value: 'standard', icon: 'package_2', label: 'Standard', sub: 'Most popular' },
                                                    { value: 'economy', icon: 'eco', label: 'Economy', sub: 'Lowest cost' },
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => setFormData(prev => ({ ...prev, serviceType: opt.value }))}
                                                        className={cn(
                                                            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center group",
                                                            formData.serviceType === opt.value
                                                                ? "border-primary bg-primary/5"
                                                                : "border-slate-100 dark:border-slate-800 hover:border-primary/50"
                                                        )}
                                                    >
                                                        <span className={cn(
                                                            "material-symbols-outlined text-3xl",
                                                            formData.serviceType === opt.value ? "text-primary" : "text-slate-400 group-hover:text-primary"
                                                        )}>{opt.icon}</span>
                                                        <span className="font-bold text-sm">{opt.label}</span>
                                                        <span className="text-xs text-slate-500">{opt.sub}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Action Footer */}
                                        <div className="bg-slate-50 dark:bg-slate-800/30 p-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                                            <button
                                                onClick={() => router.push('/dashboard')}
                                                className="px-6 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => setCurrentStep(2)}
                                                className="px-10 py-2.5 rounded-xl bg-primary text-white font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                                            >
                                                Next Step
                                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Info Alert */}
                                    <div className="mt-6 flex items-start gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                                        <span className="material-symbols-outlined text-blue-500">info</span>
                                        <div>
                                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Pro-Tip</p>
                                            <p className="text-xs text-blue-700 dark:text-blue-300">You can save this shipment as a template later if you frequently ship between these locations.</p>
                                        </div>
                                    </div>
                                </>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    {/* Section: Shipment Specifications - per package */}
                                    {packages.map((pkg, index) => {
                                        return (
                                            <div key={index} className="space-y-4">
                                                {/* Shipment Specifications */}
                                                <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden">
                                                    <div className="p-6 pb-4 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-primary">inventory_2</span>
                                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                                {packages.length > 1 ? `Shipment #${index + 1} – Specifications` : 'Shipment Specifications'}
                                                            </h3>
                                                        </div>
                                                        {packages.length > 1 && (
                                                            <button
                                                                onClick={() => removePackage(index)}
                                                                className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="px-6 pb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                                                        {/* Total Weight */}
                                                        <div className="flex flex-col gap-2">
                                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Weight (kg)</label>
                                                            <div className="relative">
                                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">weight</span>
                                                                <input
                                                                    type="number"
                                                                    name="weight"
                                                                    value={pkg.weight}
                                                                    onChange={(e) => handlePackageChange(index, 'weight', e.target.value)}
                                                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                                                                    placeholder="e.g. 500"
                                                                />
                                                            </div>
                                                        </div>
                                                        {/* Commodity Type */}
                                                        <div className="flex flex-col gap-2">
                                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Commodity Type</label>
                                                            <div className="relative">
                                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">category</span>
                                                                <select
                                                                    name="description"
                                                                    value={pkg.description}
                                                                    onChange={(e) => handlePackageChange(index, 'description', e.target.value)}
                                                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none text-sm"
                                                                >
                                                                    <option value="">Select Type</option>
                                                                    <option value="General Cargo">General Cargo</option>
                                                                    <option value="Perishable Goods">Perishable Goods</option>
                                                                    <option value="Hazardous Materials">Hazardous Materials</option>
                                                                    <option value="Valuables">Valuables</option>
                                                                    <option value="Fragile Items">Fragile Items</option>
                                                                </select>
                                                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xl">expand_more</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </section>

                                                {/* Fragile toggle */}
                                                <div className="px-6 pb-6 flex items-center gap-3">
                                                    <Checkbox
                                                        checked={pkg.isFragile}
                                                        onChange={(e) => handlePackageChange(index, 'isFragile', e.target.checked)}
                                                    />
                                                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">Fragile handling required</label>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Add Another Shipment */}
                                    <button
                                        onClick={addPackage}
                                        className="w-full py-4 border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">add_circle</span>
                                        Add Another Shipment
                                    </button>

                                    {/* Pro-Tip Banner */}
                                    <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                                        <span className="material-symbols-outlined text-primary mt-0.5">lightbulb</span>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-sm font-bold text-primary">Pro-Tip: Cargo Description</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                                Accurate descriptions help us ensure your cargo is handled with the correct priority and safety protocols during flight.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Contacts Section */}
                                    <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden">
                                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">contacts</span>
                                                Contact Information
                                            </h3>
                                        </div>
                                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-slate-400" />
                                                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Sender</h4>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                                                    <input
                                                        name="senderName"
                                                        value={formData.senderName}
                                                        onChange={handleChange}
                                                        placeholder="Legal full name"
                                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
                                                    <PhoneInput
                                                        id="senderPhone"
                                                        label=""
                                                        value={formData.senderPhone}
                                                        onChange={(val) => setFormData(prev => ({ ...prev, senderPhone: val }))}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-slate-400" />
                                                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Recipient</h4>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                                                    <input
                                                        name="recipientName"
                                                        value={formData.recipientName}
                                                        onChange={handleChange}
                                                        placeholder="Receiver full name"
                                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
                                                    <PhoneInput
                                                        id="recipientPhone"
                                                        label=""
                                                        value={formData.recipientPhone}
                                                        onChange={(val) => setFormData(prev => ({ ...prev, recipientPhone: val }))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Left: Details */}
                                    <div className="lg:col-span-2 space-y-5">

                                        {/* Route Details Card */}
                                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">distance</span>
                                                <h3 className="font-bold text-slate-900 dark:text-white">Route Details</h3>
                                            </div>
                                            <div className="p-5">
                                                <div className="flex items-start gap-4">
                                                    <div className="flex flex-col items-center shrink-0">
                                                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                                                        <div className="w-0.5 h-10 border-l-2 border-dashed border-slate-300 dark:border-slate-700"></div>
                                                        <div className="w-3 h-3 rounded-full border-2 border-primary"></div>
                                                    </div>
                                                    <div className="flex-1 space-y-4">
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-400 uppercase">Origin</p>
                                                            <p className="text-base font-bold text-slate-900 dark:text-white">{formData.origin || '—'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-400 uppercase">Destination</p>
                                                            <p className="text-base font-bold text-slate-900 dark:text-white">{formData.destination || '—'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0">
                                                        <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded text-xs font-bold capitalize">{formData.serviceType}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Cargo Specifications Card */}
                                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">inventory_2</span>
                                                <h3 className="font-bold text-slate-900 dark:text-white">Cargo Specifications</h3>
                                            </div>
                                            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-lg">
                                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Shipments</p>
                                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{packages.length}</p>
                                                    <p className="text-xs text-slate-500">Total units</p>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-lg">
                                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Weight</p>
                                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                                        {packages.reduce((s, p) => s + (parseFloat(p.weight) || 0), 0)} kg
                                                    </p>
                                                    <p className="text-xs text-slate-500">Gross inclusive</p>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-lg">
                                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Volume</p>
                                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                                        {packages.reduce((s, p) => s + ((parseFloat((p as any).length) || 0) * (parseFloat((p as any).width) || 0) * (parseFloat((p as any).height) || 0)) / 1000000, 0).toFixed(2)} m³
                                                    </p>
                                                    <p className="text-xs text-slate-500">Combined volume</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Selected Service Card */}
                                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">verified_user</span>
                                                <h3 className="font-bold text-slate-900 dark:text-white">Selected Service</h3>
                                            </div>
                                            <div className="p-5 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                        <span className="material-symbols-outlined text-2xl">
                                                            {formData.serviceType === 'express' ? 'bolt' : formData.serviceType === 'standard' ? 'package_2' : 'eco'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white capitalize">{formData.serviceType} Freight</p>
                                                        <p className="text-sm text-slate-500">
                                                            {formData.serviceType === 'express' ? '1–2 business days' : formData.serviceType === 'standard' ? '3–5 business days' : '5–7 business days'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold">Insurance Opt.</span>
                                            </div>
                                        </div>

                                        {/* Sender / Recipient */}
                                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">contacts</span>
                                                <h3 className="font-bold text-slate-900 dark:text-white">Contacts</h3>
                                            </div>
                                            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Sender</p>
                                                    <p className="font-semibold text-slate-900 dark:text-white">{formData.senderName || '—'}</p>
                                                    <p className="text-sm text-slate-500">{formData.senderPhone || '—'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Recipient</p>
                                                    <p className="font-semibold text-slate-900 dark:text-white">{formData.recipientName || '—'}</p>
                                                    <p className="text-sm text-slate-500">{formData.recipientPhone || '—'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Final Quote Sidebar */}
                                    <div className="space-y-5">
                                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border-2 border-primary p-6 sticky top-8">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Final Quote</h3>
                                            <div className="space-y-3 mb-6">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500">Service Fee</span>
                                                    <span className="font-semibold text-slate-900 dark:text-white">{currency === 'NGN' ? '₦' : '$'}{basePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </div>
                                                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-3">
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-400 uppercase">Total Amount</p>
                                                            <p className="text-3xl font-bold text-slate-900 dark:text-white leading-none mt-1">
                                                                {currency === 'NGN' ? '₦' : '$'}{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </p>
                                                        </div>
                                                        <p className="text-xs text-slate-400 mb-1">{currency}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Payment Method */}
                                            <div className="space-y-2 mb-5">
                                                <p className="text-xs font-bold text-slate-400 uppercase">Payment Method</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {(['card', 'wallet'] as const).map(method => (
                                                        <button
                                                            key={method}
                                                            onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method }))}
                                                            className={cn(
                                                                "p-3 rounded-lg border-2 text-sm font-bold flex items-center gap-2 transition-all",
                                                                formData.paymentMethod === method
                                                                    ? 'border-primary bg-primary/5 text-primary'
                                                                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-primary/50'
                                                            )}
                                                        >
                                                            {method === 'card' ? <CreditCard className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                                                            <span className="capitalize">{method === 'card' ? 'Card' : 'Wallet'}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                                {formData.paymentMethod === 'wallet' && (
                                                    <p className="text-xs text-slate-500">
                                                        Balance: {currency === 'NGN' ? '₦' : '$'}{(userProfile?.walletBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </p>
                                                )}
                                                {formData.paymentMethod === 'wallet' && (userProfile?.walletBalance || 0) < totalPrice && (
                                                    <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
                                                        <p className="text-xs font-bold text-red-600">Insufficient balance</p>
                                                        <button onClick={() => router.push('/dashboard/wallet')} className="text-xs font-bold text-red-600 underline">Top Up</button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                <button
                                                    onClick={handlePaymentAndSubmit}
                                                    disabled={loading}
                                                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {loading ? (
                                                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing</>
                                                    ) : (
                                                        <><span className="material-symbols-outlined">check_circle</span>Confirm Booking</>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => setCurrentStep(2)}
                                                    className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                    Back to Cargo Info
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-slate-400 text-center mt-4">
                                                Quote valid for 48 hours. Subject to space availability.
                                            </p>
                                        </div>

                                        {/* Help Section */}
                                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Need Assistance?</h4>
                                            <div className="space-y-3">
                                                {[
                                                    { icon: 'support_agent', label: 'Live Chat with Support' },
                                                    { icon: 'call', label: '+1 (800) AIR-CARGO' },
                                                    { icon: 'help_center', label: 'Booking Guidelines' },
                                                ].map(item => (
                                                    <div key={item.icon} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                        <span className="material-symbols-outlined text-primary text-lg">{item.icon}</span>
                                                        <span>{item.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 4 && trackingNumber && (
                                <div className="max-w-[640px] mx-auto text-center py-4">
                                    {/* Success Icon */}
                                    <div className="mb-6 flex justify-center">
                                        <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center border-4 border-primary/20">
                                            <span className="material-symbols-outlined text-primary text-5xl">check_circle</span>
                                        </div>
                                    </div>

                                    {/* Header */}
                                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight mb-2">Booking Confirmed!</h1>
                                    <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full mb-8">
                                        <span className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Air Waybill (AWB):</span>
                                        <span className="text-slate-900 dark:text-primary text-lg font-bold">{trackingNumber}</span>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(trackingNumber)}
                                            className="ml-1 text-slate-400 hover:text-primary transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-base">content_copy</span>
                                        </button>
                                    </div>

                                    {/* Shipment Details Card */}
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-8 text-left">
                                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                                            <h3 className="font-bold text-lg flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">inventory_2</span>
                                                Booking Details Summary
                                            </h3>
                                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded uppercase">{formData.serviceType}</span>
                                        </div>
                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-5">
                                                <div>
                                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Route</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-900 dark:text-white text-sm">{formData.origin || '—'}</span>
                                                        <span className="material-symbols-outlined text-primary text-sm">trending_flat</span>
                                                        <span className="font-bold text-slate-900 dark:text-white text-sm">{formData.destination || '—'}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Cargo Type</p>
                                                    <p className="text-slate-900 dark:text-slate-200 font-medium">
                                                        {packages.map(p => p.description).filter(Boolean).join(', ') || 'General Cargo'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-5">
                                                <div>
                                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Weight</p>
                                                    <p className="text-slate-900 dark:text-slate-200 font-medium">
                                                        {packages.reduce((s, p) => s + (parseFloat(p.weight) || 0), 0)} kg
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Charged</p>
                                                    <p className="text-primary font-bold text-lg">
                                                        {currency === 'NGN' ? '₦' : '$'}{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                                        <button
                                            onClick={() => router.push(`/dashboard/track/${trackingNumber}`)}
                                            className="w-full sm:w-auto flex min-w-[200px] items-center justify-center rounded-xl h-14 px-8 bg-primary text-white text-base font-bold hover:bg-primary/90 hover:scale-[1.02] transition-all shadow-lg shadow-primary/20 gap-2"
                                        >
                                            <span className="material-symbols-outlined">location_searching</span>
                                            Track Shipment
                                        </button>
                                        <button
                                            onClick={() => router.push('/dashboard/shipments')}
                                            className="w-full sm:w-auto flex min-w-[200px] items-center justify-center rounded-xl h-14 px-8 bg-white dark:bg-transparent border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-base font-bold hover:border-primary hover:text-primary transition-all gap-2"
                                        >
                                            <span className="material-symbols-outlined">dashboard</span>
                                            Dashboard
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => router.push('/dashboard')}
                                        className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-semibold"
                                    >
                                        <span className="material-symbols-outlined">arrow_back</span>
                                        Return to Dashboard
                                    </button>
                                </div>
                            )}

                            {/* Navigation Bar for Step 2 only — Step 3 has its own actions in the sidebar */}
                            {currentStep === 2 && (
                                <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800 mt-2">
                                    <button
                                        onClick={() => setCurrentStep(1)}
                                        className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                    >
                                        <span className="material-symbols-outlined">arrow_back</span>
                                        Back to Route
                                    </button>
                                    <button
                                        onClick={() => setCurrentStep(3)}
                                        className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                                    >
                                        Continue to Review
                                        <span className="material-symbols-outlined">arrow_forward</span>
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <SuccessModal
                    isOpen={notification.isOpen}
                    onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
                    title={notification.title}
                    message={notification.message}
                    type={notification.type}
                />
            </div>
        </div >
    );
}
