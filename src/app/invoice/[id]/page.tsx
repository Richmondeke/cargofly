"use client";

import { useEffect, useState } from "react";
import { getShipmentById, Shipment } from "@/lib/firestore";
import Image from "next/image";

export default function InvoicePage({ params }: { params: { id: string } }) {
    const [shipment, setShipment] = useState<Shipment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchShipment() {
            try {
                const data = await getShipmentById(params.id);
                setShipment(data);
            } catch (error) {
                console.error("Failed to load generic invoice:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchShipment();
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!shipment) {
        return (
            <div className="min-h-screen bg-white text-black flex items-center justify-center font-display text-2xl">
                Invoice not found.
            </div>
        );
    }

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "Pending";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    };

    const totalWeight = shipment.packages ? shipment.packages.reduce((sum, p) => sum + p.weight, 0) : 0;

    return (
        <div className="min-h-screen bg-white text-black p-8 md:p-16 font-body">
            <div className="max-w-4xl mx-auto border border-gray-200 p-12 shadow-sm rounded-sm print:shadow-none print:border-none print:p-0">

                {/* Header */}
                <div className="flex justify-between items-start border-b pb-8 mb-8">
                    <div>
                        <Image src="/images/logo_icon.png" alt="Cargofly Logo" width={60} height={60} className="mb-4" />
                        <h1 className="text-4xl font-black uppercase tracking-tight text-navy-900 font-display">CARGOFLY</h1>
                        <p className="text-gray-500 font-mono text-sm mt-1">THE PINNACLE OF WEST AFRICAN AVIATION LOGISTICS</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-light text-gray-400 mb-2 uppercase font-display">Invoice</h2>
                        <p className="font-mono font-bold">#{shipment.id ? shipment.id.substring(0, 8).toUpperCase() : 'INV'}</p>
                        <p className="text-sm text-gray-500 mt-2">Date: {formatDate(shipment.createdAt)}</p>
                        <p className="text-sm font-bold text-navy-900 mt-1">Tracking: {shipment.trackingNumber}</p>
                    </div>
                </div>

                {/* Addresses */}
                <div className="grid grid-cols-2 gap-12 mb-12">
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 border-b pb-2">Sender Information</h3>
                        <p className="font-bold text-lg">{shipment.sender.name}</p>
                        <p className="text-gray-600 mt-1">{shipment.sender.email}</p>
                        {shipment.sender.phone && <p className="text-gray-600">{shipment.sender.phone}</p>}
                        <p className="text-gray-600 mt-2 leading-relaxed">{shipment.sender.street}</p>
                        <p className="text-gray-600">{shipment.sender.city}, {shipment.sender.state} {shipment.sender.postalCode}<br />{shipment.sender.country}</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 border-b pb-2">Recipient Information</h3>
                        <p className="font-bold text-lg">{shipment.recipient.name}</p>
                        <p className="text-gray-600 mt-1">{shipment.recipient.email}</p>
                        {shipment.recipient.phone && <p className="text-gray-600">{shipment.recipient.phone}</p>}
                        <p className="text-gray-600 mt-2 leading-relaxed">{shipment.recipient.street}</p>
                        <p className="text-gray-600">{shipment.recipient.city}, {shipment.recipient.state} {shipment.recipient.postalCode}<br />{shipment.recipient.country}</p>
                    </div>
                </div>

                {/* Packages */}
                <div className="mb-12">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 border-b pb-2">Shipment details</h3>
                    <table className="w-full text-left mb-4">
                        <thead>
                            <tr className="border-b border-gray-200 text-sm">
                                <th className="py-3 font-semibold text-gray-500">Description</th>
                                <th className="py-3 font-semibold text-gray-500 text-right">Dimensions (cm)</th>
                                <th className="py-3 font-semibold text-gray-500 text-right">Qty</th>
                                <th className="py-3 font-semibold text-gray-500 text-right">Weight (kg)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shipment.packages?.map((pkg, index) => (
                                <tr key={index} className="border-b border-gray-100">
                                    <td className="py-4 text-gray-800">{pkg.description || 'Cargo'}</td>
                                    <td className="py-4 text-gray-800 text-right">{pkg.dimensions?.length || '-'} x {pkg.dimensions?.width || '-'} x {pkg.dimensions?.height || '-'}</td>
                                    <td className="py-4 text-gray-800 text-right">1</td>
                                    <td className="py-4 text-gray-800 text-right font-mono">{pkg.weight?.toFixed(2) || '0.00'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-end pt-4">
                        <div className="w-64">
                            <div className="flex justify-between py-2 text-sm">
                                <span className="text-gray-500">Service Level</span>
                                <span className="font-bold text-gold-600">Priority Air Freight</span>
                            </div>
                            <div className="flex justify-between py-2 text-sm">
                                <span className="text-gray-500">Total Weight</span>
                                <span className="font-bold font-mono">{totalWeight.toFixed(2)} kg</span>
                            </div>
                            <div className="flex justify-between py-4 border-t border-gray-200 mt-2 text-xl font-bold font-display px-2 bg-gray-50">
                                <span>Total Amount</span>
                                <span>{shipment.price?.total ? `$${shipment.price.total.toFixed(2)}` : 'Prepaid'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Notes */}
                <div className="text-sm text-gray-400 border-t border-gray-200 pt-8 mt-16">
                    <p className="mb-1">Terms and conditions apply as defined in the Cargofly Air Waybill terms of carriage.</p>
                    <p>For support, contact support@cargofly.com or call our logistics center.</p>
                </div>

                {/* Print Button (Hidden in Print View) */}
                <div className="mt-12 text-center print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="bg-navy-900 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-navy-800 transition-all hover:scale-105 active:scale-95 border border-navy-700 font-display tracking-wide"
                    >
                        Print Invoice
                    </button>
                </div>
            </div>
        </div>
    );
}
