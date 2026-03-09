'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createBooking, getRoutes, Route } from '@/lib/dashboard-service';
import LottieAnimation from '@/components/ui/LottieAnimation';
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";

type Step = 1 | 2 | 3 | 4;

export default function NewBookingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, userProfile } = useAuth();
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState<string | null>(null);

    const [packages, setPackages] = useState([{
        weight: '',
        length: '',
        width: '',
        height: '',
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
        cardName: '',
        cardNumber: '',
        expiry: '',
        cvv: '',
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

    const handlePackageChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setPackages(prev => {
            const newPackages = [...prev];
            newPackages[index] = {
                ...newPackages[index],
                [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
            };
            return newPackages;
        });
    };

    const addPackage = () => {
        setPackages(prev => [...prev, {
            weight: '',
            length: '',
            width: '',
            height: '',
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
            alert('Please login to create a booking');
            return;
        }

        // Basic validation for payment
        if (!formData.cardNumber || !formData.expiry || !formData.cvv) {
            alert('Please enter payment details');
            return;
        }

        setLoading(true);
        try {
            const tracking = await createBooking(user.uid, {
                origin: formData.origin,
                destination: formData.destination,
                serviceType: formData.serviceType,
                packageDetails: packages.map(p => ({
                    weight: parseFloat(p.weight) || 0,
                    length: parseFloat(p.length) || 0,
                    width: parseFloat(p.width) || 0,
                    height: parseFloat(p.height) || 0,
                    description: p.description,
                    isFragile: p.isFragile,
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
                    fuel: 25,
                    total: totalPrice,
                    currency: currency,
                },
            }, "paid");

            setTrackingNumber(tracking);
            setCurrentStep(4);
        } catch (error) {
            console.error('Error creating booking:', error);
            alert('Failed to create booking. Please try again.');
        } finally {
            setLoading(false);
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

        if (!currentRoute) {
            const base = formData.serviceType === 'express' ? 250 : (formData.serviceType === 'standard' ? 150 : 100);
            const weightP = totalWeight * 10;
            return { base, total: base + weightP + 25, currency: 'USD' };
        }

        const multiplier = formData.serviceType === 'express' ? 1.5 : (formData.serviceType === 'standard' ? 1 : 0.8);
        const base = currentRoute.rate * totalWeight * multiplier;
        return { base, total: base + 25, currency: currentRoute.currency };
    };

    const { base: basePrice, total: totalPrice, currency } = calculatePrices();

    return (
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 h-full bg-slate-50 dark:bg-background-dark">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-[32px] font-bold text-[#1e293b] dark:text-white leading-tight">New Booking</h1>
                <p className="text-[14px] text-[#64748b] dark:text-slate-400 mt-1">Create a new shipment request</p>
            </div>

            {/* Progress Steps - Responsive */}
            <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10 overflow-x-auto py-2 no-scrollbar">
                {steps.map((step, index) => (
                    <React.Fragment key={step.number}>
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${currentStep >= step.number
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                }`}>
                                {currentStep > step.number ? (
                                    <span className="material-symbols-outlined text-sm sm:text-base">check</span>
                                ) : (
                                    step.number
                                )}
                            </div>
                            <span className={`text-[10px] sm:text-sm font-semibold whitespace-nowrap ${currentStep >= step.number ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                {step.label}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`w-8 sm:w-16 h-0.5 shrink-0 ${currentStep > step.number ? 'bg-primary shadow-sm' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Form Content */}
            <div className="max-w-2xl mx-auto w-full">
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 sm:p-8">
                    {currentStep === 1 && (
                        <>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Shipment Details</h3>
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="origin">Origin</Label>
                                        <Input
                                            id="origin"
                                            type="text"
                                            name="origin"
                                            value={formData.origin}
                                            onChange={handleChange}
                                            placeholder="e.g., Lagos, NG"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="destination">Destination</Label>
                                        <Input
                                            id="destination"
                                            type="text"
                                            name="destination"
                                            value={formData.destination}
                                            onChange={handleChange}
                                            placeholder="e.g., London, UK"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="serviceType">Service Type</Label>
                                    <Select
                                        id="serviceType"
                                        name="serviceType"
                                        value={formData.serviceType}
                                        onChange={handleChange}
                                    >
                                        <option value="express">Express Air (2-3 days)</option>
                                        <option value="standard">Standard (5-7 days)</option>
                                        <option value="economy">Economy (7-14 days)</option>
                                    </Select>
                                </div>
                            </div>
                        </>
                    )}

                    {currentStep === 2 && (
                        <>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Package & Contact Details</h3>
                            <div className="space-y-8">
                                {packages.map((pkg, index) => (
                                    <div key={index} className="space-y-5 relative">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-slate-900 dark:text-white">
                                                Package {index + 1}
                                            </h4>
                                            {packages.length > 1 && (
                                                <button
                                                    onClick={() => removePackage(index)}
                                                    className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1 font-medium"
                                                >
                                                    <span className="material-symbols-outlined text-base">delete</span>
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            <div>
                                                <Label htmlFor={`weight-${index}`}>Weight (kg)</Label>
                                                <Input
                                                    id={`weight-${index}`}
                                                    type="number"
                                                    name="weight"
                                                    value={pkg.weight}
                                                    onChange={(e) => handlePackageChange(index, e as any)}
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor={`length-${index}`}>L (cm)</Label>
                                                <Input
                                                    id={`length-${index}`}
                                                    type="number"
                                                    name="length"
                                                    value={pkg.length}
                                                    onChange={(e) => handlePackageChange(index, e as any)}
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor={`width-${index}`}>W (cm)</Label>
                                                <Input
                                                    id={`width-${index}`}
                                                    type="number"
                                                    name="width"
                                                    value={pkg.width}
                                                    onChange={(e) => handlePackageChange(index, e as any)}
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor={`height-${index}`}>H (cm)</Label>
                                                <Input
                                                    id={`height-${index}`}
                                                    type="number"
                                                    name="height"
                                                    value={pkg.height}
                                                    onChange={(e) => handlePackageChange(index, e as any)}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor={`description-${index}`}>Description</Label>
                                            <Textarea
                                                id={`description-${index}`}
                                                name="description"
                                                value={pkg.description}
                                                onChange={(e) => handlePackageChange(index, e as any)}
                                                rows={2}
                                                placeholder="Describe the package contents"
                                                className="resize-none"
                                            />
                                        </div>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <Checkbox
                                                name="isFragile"
                                                checked={pkg.isFragile}
                                                onChange={(e) => handlePackageChange(index, { target: { name: 'isFragile', type: 'checkbox', checked: e.target.checked } } as any)}
                                            />
                                            <span className="text-sm text-slate-600 dark:text-slate-400">This package is fragile</span>
                                        </label>

                                        {index < packages.length - 1 && (
                                            <hr className="border-slate-100 dark:border-slate-800 my-6" />
                                        )}
                                    </div>
                                ))}

                                <button
                                    onClick={addPackage}
                                    className="w-full py-3 border-2 border-dashed border-primary/30 text-primary font-semibold rounded-xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined pb-0.5 text-lg">add_circle</span>
                                    Add Another Package
                                </button>

                                <hr className="border-slate-200 dark:border-slate-700" />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-slate-900 dark:text-white">Sender</h4>
                                        <Input
                                            type="text"
                                            name="senderName"
                                            value={formData.senderName}
                                            onChange={handleChange}
                                            placeholder="Full Name"
                                        />
                                        <Input
                                            type="tel"
                                            name="senderPhone"
                                            value={formData.senderPhone}
                                            onChange={handleChange}
                                            placeholder="Phone"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-slate-900 dark:text-white">Recipient</h4>
                                        <Input
                                            type="text"
                                            name="recipientName"
                                            value={formData.recipientName}
                                            onChange={handleChange}
                                            placeholder="Full Name"
                                        />
                                        <Input
                                            type="tel"
                                            name="recipientPhone"
                                            value={formData.recipientPhone}
                                            onChange={handleChange}
                                            placeholder="Phone"
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {currentStep === 3 && (
                        <>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Review & Payment</h3>
                            <div className="space-y-6">
                                <div className="p-6 rounded-xl bg-gold-50 dark:bg-gold-900/10 border border-gold-200 dark:border-gold-800/30">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-slate-600 dark:text-slate-400">Total Estimated Cost</span>
                                        <span className="text-3xl font-black text-slate-900 dark:text-white">
                                            {currency === 'NGN' ? '₦' : '$'}{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500">Includes base rate, weight charges, and fuel surcharge.</p>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-semibold text-slate-900 dark:text-white">Payment Method</h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="border border-primary bg-primary/5 rounded-xl p-4 flex items-center gap-3">
                                            <span className="material-symbols-outlined text-primary">credit_card</span>
                                            <span className="font-medium text-slate-900 dark:text-white">Credit/Debit Card</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Input
                                            type="text"
                                            name="cardName"
                                            value={formData.cardName}
                                            onChange={handleChange}
                                            placeholder="Name on Card"
                                        />
                                        <Input
                                            type="text"
                                            name="cardNumber"
                                            value={formData.cardNumber}
                                            onChange={handleChange}
                                            placeholder="Card Number"
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                type="text"
                                                name="expiry"
                                                value={formData.expiry}
                                                onChange={handleChange}
                                                placeholder="MM/YY"
                                            />
                                            <Input
                                                type="text"
                                                name="cvv"
                                                value={formData.cvv}
                                                onChange={handleChange}
                                                placeholder="CVV"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {currentStep === 4 && trackingNumber && (
                        <div className="text-center py-8">
                            <div className="w-32 h-32 mx-auto mb-2">
                                <LottieAnimation
                                    src="https://assets9.lottiefiles.com/packages/lf20_yom6uvgj.json"
                                    loop={false}
                                    width="100%"
                                    height="100%"
                                />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Booking Confirmed!</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">Your payment was successful and shipment created.</p>
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 mb-6">
                                <p className="text-sm text-slate-500 mb-2">Tracking Number</p>
                                <p className="text-2xl font-bold text-primary">{trackingNumber}</p>
                            </div>
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => router.push('/dashboard/shipments')}
                                    className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    View Shipments
                                </button>
                                <button
                                    onClick={() => router.push(`/dashboard/track/${trackingNumber}`)}
                                    className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
                                >
                                    Track Package
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    {currentStep < 4 && (
                        <div className="flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setCurrentStep(prev => (prev > 1 ? (prev - 1) as Step : prev))}
                                disabled={currentStep === 1}
                                className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Back
                            </button>
                            {currentStep === 3 ? (
                                <button
                                    onClick={handlePaymentAndSubmit}
                                    disabled={loading}
                                    className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                            Processing...
                                        </>
                                    ) : (
                                        'Pay & Book'
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setCurrentStep(prev => (prev < 4 ? (prev + 1) as Step : prev))}
                                    className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all"
                                >
                                    Continue
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
