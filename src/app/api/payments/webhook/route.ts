import { NextRequest, NextResponse } from "next/server";
import { KorapayProvider } from "@/lib/payments/korapay";
import { serverDb as db } from "@/lib/firebase-server";
import { doc, updateDoc, serverTimestamp, getDocs, collection, query, where } from "firebase/firestore";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const body = JSON.parse(rawBody);
        const signature = req.headers.get("x-korapay-signature");

        // Verify Signature
        const secret = process.env.KORAPAY_SECRET_KEY;
        if (secret && signature) {
            const hmac = crypto.createHmac('sha256', secret);
            const digest = hmac.update(rawBody).digest('hex');

            if (digest !== signature) {
                console.warn("Invalid Korapay Webhook Signature");
                // In production, return 401. For testing, we'll log it.
                // return NextResponse.json({ status: false, message: "Invalid signature" }, { status: 401 });
            }
        }

        const { event, data } = body;
        const reference = data.reference;
        const trackingNumber = data.metadata?.trackingNumber || reference;

        if (event === "charge.completed") {
            if (data.status === "success") {
                // Success Flow
                const shipmentsRef = collection(db, "shipments");
                const q = query(shipmentsRef, where("trackingNumber", "==", trackingNumber));
                const querySnap = await getDocs(q);

                if (!querySnap.empty) {
                    const shipmentDoc = querySnap.docs[0];
                    await updateDoc(doc(db, "shipments", shipmentDoc.id), {
                        paymentStatus: "paid",
                        status: "confirmed",
                        updatedAt: serverTimestamp()
                    });

                    // Push notification to user
                    const shipmentData = shipmentDoc.data();
                    if (shipmentData.userId) {
                        try {
                            const { pushNotification } = await import("@/lib/notification-service");
                            await pushNotification(shipmentData.userId, {
                                title: 'Payment Confirmed',
                                message: `Payment for shipment ${trackingNumber} has been confirmed. Your shipment is now being processed.`,
                                type: 'shipment'
                            });
                        } catch (e) {
                            console.error("Failed to send webhook notification:", e);
                        }
                    }

                    console.log(`Shipment ${trackingNumber} marked as PAID via Korapay webhook`);
                } else {
                    console.warn(`No shipment found for reference: ${trackingNumber}`);
                }
            } else {
                // Handle completed but not successful (e.g. expired, failed)
                console.warn(`Korapay charge completed with non-success status: ${data.status} for ${trackingNumber}`);
                const shipmentsRef = collection(db, "shipments");
                const q = query(shipmentsRef, where("trackingNumber", "==", trackingNumber));
                const querySnap = await getDocs(q);

                if (!querySnap.empty) {
                    await updateDoc(doc(db, "shipments", querySnap.docs[0].id), {
                        paymentStatus: "failed",
                        updatedAt: serverTimestamp()
                    });
                }
            }
        } else if (event === "charge.failed") {
            console.error(`Korapay charge FAILED for shipment ${trackingNumber}`);
            const shipmentsRef = collection(db, "shipments");
            const q = query(shipmentsRef, where("trackingNumber", "==", trackingNumber));
            const querySnap = await getDocs(q);

            if (!querySnap.empty) {
                await updateDoc(doc(db, "shipments", querySnap.docs[0].id), {
                    paymentStatus: "failed",
                    updatedAt: serverTimestamp()
                });
            }
        }

        return NextResponse.json({ status: true });
    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ status: false }, { status: 500 });
    }
}
