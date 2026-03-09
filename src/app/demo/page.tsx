"use client";

import { useState } from "react";
import { generateTrackingNumber, createShipment, Shipment, ShipmentStatus } from "@/lib/firestore";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

const DEMO_LOCATIONS = [
    { city: "Lagos", country: "Nigeria" },
    { city: "London", country: "United Kingdom" },
    { city: "New York", country: "USA" },
    { city: "Dubai", country: "UAE" },
    { city: "Accra", country: "Ghana" }
];

const DEMO_STATUSES: ShipmentStatus[] = [
    "pending",
    "in_transit",
    "out_for_delivery",
    "delivered"
];

export default function DemoPage() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [createdShipments, setCreatedShipments] = useState<any[]>([]);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    const generateDemoData = async () => {
        addLog("Starting demo generation...");
        if (!user) {
            const msg = "Error: User is not logged in. Please sign in.";
            addLog(msg);
            alert(msg);
            return;
        }
        addLog(`User found: ${user.uid}`);

        setIsLoading(true);
        const newShipments: any[] = [];

        try {
            // Generate 3 shipments with different statuses
            for (let i = 0; i < 3; i++) {
                addLog(`Generating shipment ${i + 1}/3...`);
                const now = new Date();
                const estimated = new Date();
                estimated.setDate(now.getDate() + 3);

                const origin = DEMO_LOCATIONS[Math.floor(Math.random() * DEMO_LOCATIONS.length)];
                const dest = DEMO_LOCATIONS[Math.floor(Math.random() * DEMO_LOCATIONS.length)];

                const status = DEMO_STATUSES[i % DEMO_STATUSES.length];

                const shipmentData = {
                    userId: user.uid, // Use real user ID
                    service: "express" as const,
                    sender: {
                        name: "Demo Sender",
                        street: "123 Demo St",
                        city: origin.city,
                        state: "State",
                        postalCode: "10001",
                        country: origin.country,
                        phone: "+1234567890"
                    },
                    recipient: {
                        name: "Demo Recipient",
                        street: "456 Demo Rd",
                        city: dest.city,
                        state: "State",
                        postalCode: "20002",
                        country: dest.country,
                        phone: "+0987654321"
                    },
                    packages: [{
                        weight: 5.5,
                        dimensions: { length: 30, width: 20, height: 15 },
                        description: "Demo Package Content",
                        pieces: 1,
                        isFragile: false,
                        requiresSignature: true
                    } as any],
                    price: {
                        base: 100,
                        fuel: 20,
                        total: 120,
                        currency: "USD"
                    },
                    estimatedDelivery: Timestamp.fromDate(estimated),
                    paymentStatus: "paid" as const
                };

                const trackingNumber = await createShipment(shipmentData);
                addLog(`Created shipment: ${trackingNumber}`);
                // Manually update status for demo purposes since createShipment defaults to pending
                // In a real app, this would be separate calls, but for demo speed we might just want 'pending' 
                // or we'd need to call updateShipmentStatus. 
                // Let's just keep them as created (Pending) to be safe and simple, 
                // OR if we really want varied statuses, we need to call updateShipmentStatus

                // For the demo presentation, 'Pending' is fine, or we can quickly update them.
                // Let's just return what we created.
                newShipments.push({ trackingNumber, ...shipmentData, status: "pending" });
            }

            setCreatedShipments(prev => [...prev, ...newShipments]);
            addLog("Success: 3 shipments generated!");
        } catch (error: any) {
            const errMsg = error.message || JSON.stringify(error);
            console.error("Error generating demo data:", error);
            addLog(`ERROR: ${errMsg}`);
            alert(`Failed to generate: ${errMsg}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-32 pb-24 bg-navy-900 text-white p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-display mb-8">Demo Data Generator</h1>

                <div className="mb-4">
                    <p className="text-sm text-white/60 mb-2">User Status: {user ? "Logged In ✅" : "Not Logged In ❌"}</p>
                </div>

                <button
                    onClick={generateDemoData}
                    disabled={isLoading}
                    className="px-6 py-3 bg-gold-500 text-navy-900 font-bold rounded-xl mb-8 hover:bg-gold-400 disabled:opacity-50"
                >
                    {isLoading ? "Generating..." : "Generate 3 Demo Shipments"}
                </button>

                {/* Logs Section */}
                {logs.length > 0 && (
                    <div className="mb-8 p-4 bg-black/30 rounded-xl font-mono text-xs max-h-40 overflow-y-auto border border-white/10">
                        {logs.map((log, i) => (
                            <div key={i} className={log.includes("ERROR") ? "text-red-400" : "text-white/70"}>
                                {log}
                            </div>
                        ))}
                    </div>
                )}

                <div className="space-y-4">
                    {createdShipments.map((shipment, index) => (
                        <div key={index} className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-mono text-gold-400 text-xl font-bold">
                                    {shipment.trackingNumber}
                                </span>
                                <span className="text-sm px-2 py-1 bg-white/10 rounded uppercase">
                                    {shipment.status}
                                </span>
                            </div>
                            <div className="text-sm text-white/60">
                                {shipment.sender.city} → {shipment.recipient.city}
                            </div>
                        </div>
                    ))}
                </div>

                {createdShipments.length > 0 && (
                    <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                        <h3 className="font-bold mb-2">Instructions:</h3>
                        <p className="text-sm opacity-80">
                            1. Copy one of the tracking numbers above.<br />
                            2. Go to the Track page.<br />
                            3. Paste the number and click Track.<br />
                            4. Note: New shipments start as 'Pending'. Use the Admin dashboard or Firestore to update their status if needed for the demo, or just use these to show the 'Create' flow worked.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
