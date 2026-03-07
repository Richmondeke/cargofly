// Wallet Service for Firestore Operations

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    query,
    orderBy,
    limit,
    Timestamp,
    serverTimestamp,
    onSnapshot,
    runTransaction,
} from "firebase/firestore";
import { db } from "./firebase";

// ============== TYPES ==============

export interface Wallet {
    balanceUSD: number;
    balanceGBP: number;
    updatedAt: Timestamp;
}

export interface WalletTransaction {
    id?: string;
    type: 'deposit' | 'withdrawal' | 'payment' | 'transfer';
    amount: number;
    currency: 'USD' | 'GBP';
    description: string;
    shipmentId?: string;
    status: 'success' | 'pending' | 'failed';
    method: 'wallet' | 'card' | 'bank';
    createdAt: Timestamp;
}

// ============== WALLET SERVICE ==============

/**
 * Listens for real-time changes to a user's wallet
 */
export function subscribeToWallet(userId: string, callback: (wallet: Wallet | null) => void) {
    const walletRef = doc(db, "wallets", userId);
    return onSnapshot(walletRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.data() as Wallet);
        } else {
            callback(null);
        }
    });
}

/**
 * Gets a user's transaction history
 */
export async function getTransactions(userId: string, limitCount: number = 20): Promise<WalletTransaction[]> {
    const txnRef = collection(db, "wallets", userId, "transactions");
    const q = query(txnRef, orderBy("createdAt", "desc"), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as WalletTransaction[];
}

/**
 * Initializes a wallet for a new user if it doesn't exist
 */
export async function initializeWallet(userId: string) {
    const walletRef = doc(db, "wallets", userId);
    const snapshot = await getDoc(walletRef);
    if (!snapshot.exists()) {
        await setDoc(walletRef, {
            balanceUSD: 0,
            balanceGBP: 0,
            updatedAt: serverTimestamp()
        });
    }
}

/**
 * Records a transaction and updates balance in an atomic transaction
 */
export async function executeWalletPayment(
    userId: string,
    amount: number,
    currency: 'USD' | 'GBP',
    description: string,
    shipmentId?: string
) {
    const walletRef = doc(db, "wallets", userId);
    const txnRef = collection(db, "wallets", userId, "transactions");

    return await runTransaction(db, async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        if (!walletDoc.exists()) {
            throw new Error("Wallet not found");
        }

        const data = walletDoc.data() as Wallet;
        const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceGBP';
        const currentBalance = data[balanceField] || 0;

        if (currentBalance < amount) {
            throw new Error(`Insufficient ${currency} balance`);
        }

        // Update Balance
        transaction.update(walletRef, {
            [balanceField]: currentBalance - amount,
            updatedAt: serverTimestamp()
        });

        // Add Transaction Record
        const newTxnDoc = doc(txnRef);
        transaction.set(newTxnDoc, {
            type: 'payment',
            amount: -amount,
            currency,
            description,
            shipmentId: shipmentId || null,
            status: 'success',
            method: 'wallet',
            createdAt: serverTimestamp()
        });

        return newTxnDoc.id;
    });
}

/**
 * Mock Deposit for testing purposes
 */
export async function mockDeposit(userId: string, amount: number, currency: 'USD' | 'GBP') {
    const walletRef = doc(db, "wallets", userId);
    const txnRef = collection(db, "wallets", userId, "transactions");

    await runTransaction(db, async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        const data = walletDoc.exists() ? walletDoc.data() as Wallet : { balanceUSD: 0, balanceGBP: 0 };

        const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceGBP';
        const currentBalance = data[balanceField] || 0;

        if (!walletDoc.exists()) {
            transaction.set(walletRef, {
                balanceUSD: currency === 'USD' ? amount : 0,
                balanceGBP: currency === 'GBP' ? amount : 0,
                updatedAt: serverTimestamp()
            });
        } else {
            transaction.update(walletRef, {
                [balanceField]: currentBalance + amount,
                updatedAt: serverTimestamp()
            });
        }

        const newTxnDoc = doc(txnRef);
        transaction.set(newTxnDoc, {
            type: 'deposit',
            amount: amount,
            currency,
            description: 'Mock Deposit (Testing)',
            status: 'success',
            method: 'bank',
            createdAt: serverTimestamp()
        });
    });
}
