import { NextRequest, NextResponse } from 'next/server';
import { serverDb as db } from "@/lib/firebase-server";
import { collection, addDoc, doc, runTransaction, updateDoc, serverTimestamp } from "firebase/firestore";

const GRAPH_API_URL = process.env.GRAPH_API_URL || 'https://api.usegraph.io/v1';
const GRAPH_API_KEY = process.env.GRAPH_API_KEY || '';

async function graphRequest(path: string, body: Record<string, unknown>) {
    const res = await fetch(`${GRAPH_API_URL}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GRAPH_API_KEY}`,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(err?.message || `Graph API error: ${res.status}`);
    }

    return res.json();
}

export async function POST(req: NextRequest) {
    try {
        const { userId, amount, currency, method, description, shipmentId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }
        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }
        if (!method) {
            return NextResponse.json({ error: 'Payment method is required' }, { status: 400 });
        }

        // --- Wallet Payment (USD or GBP) ---
        if (method === 'wallet_usd' || method === 'wallet_gbp') {
            const walletRef = doc(db, "wallets", userId);
            const txnRef = collection(db, "wallets", userId, "transactions");

            const txnId = await runTransaction(db, async (transaction) => {
                const walletDoc = await transaction.get(walletRef);
                if (!walletDoc.exists()) throw new Error("Wallet not initialized");

                const data = walletDoc.data();
                const balanceField = method.includes('gbp') ? 'balanceGBP' : 'balanceUSD';
                const currentBalance = data[balanceField] || 0;

                if (currentBalance < amount) throw new Error("Insufficient balance");

                // Deduct
                transaction.update(walletRef, {
                    [balanceField]: currentBalance - amount,
                    updatedAt: serverTimestamp()
                });

                // Log
                const newTxnDoc = doc(collection(db, "wallets", userId, "transactions"));
                transaction.set(newTxnDoc, {
                    type: 'payment',
                    amount: -amount,
                    currency: method.includes('gbp') ? 'GBP' : 'USD',
                    description,
                    shipmentId: shipmentId || null,
                    status: 'success',
                    method: 'wallet',
                    createdAt: serverTimestamp()
                });

                // Update shipment if this was a duty payment
                if (shipmentId) {
                    const shipmentRef = doc(db, "shipments", shipmentId);
                    transaction.update(shipmentRef, {
                        customsDutyStatus: 'paid',
                        status: 'confirmed', // Release hold
                        updatedAt: serverTimestamp()
                    });
                }

                return newTxnDoc.id;
            });

            return NextResponse.json({
                success: true,
                transactionId: txnId,
                method,
                amount,
                currency,
                message: `Wallet payment successful. Transaction logged.`,
            });
        }

        // --- Card / Bank Transfer via Graph API ---
        if (method === 'card' || method === 'bank') {
            let externalTxnId = `MOCK-TXN-${Date.now()}`;
            let graphResponse = null;

            if (GRAPH_API_KEY) {
                const graphPayload = {
                    amount: Math.round(amount * 100),
                    currency: currency || 'USD',
                    description,
                    source: method === 'card' ? 'card' : 'bank_transfer',
                };
                graphResponse = await graphRequest('/payouts', graphPayload);
                externalTxnId = graphResponse?.id;
            }

            // Log the external transaction to Firestore
            const txnRef = collection(db, "wallets", userId, "transactions");
            await addDoc(txnRef, {
                type: 'payment',
                amount: -amount,
                currency: currency || 'USD',
                description,
                shipmentId: shipmentId || null,
                status: 'success', // For card, we assume success or handle webhook later
                method,
                externalId: externalTxnId,
                createdAt: serverTimestamp()
            });

            // Update shipment if this was a duty payment
            if (shipmentId) {
                const shipmentRef = doc(db, "shipments", shipmentId);
                await updateDoc(shipmentRef, {
                    customsDutyStatus: 'paid',
                    status: 'confirmed', // Release hold
                    updatedAt: serverTimestamp()
                });
            }

            return NextResponse.json({
                success: true,
                transactionId: externalTxnId,
                method,
                amount,
                currency,
                description,
                graphResponse,
            });
        }

        return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });

    } catch (error: any) {
        console.error('[Graph API Payment Error]', error);
        return NextResponse.json(
            { error: error?.message || 'Payment processing failed.' },
            { status: 500 }
        );
    }
}
