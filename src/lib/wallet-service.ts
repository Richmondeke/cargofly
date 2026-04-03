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
    balanceNGN: number;
    kycStatus?: 'none' | 'pending' | 'verified';
    updatedAt: Timestamp;
}

export interface WalletTransaction {
    id?: string;
    type: 'deposit' | 'withdrawal' | 'payment' | 'transfer';
    amount: number;
    currency: 'USD' | 'NGN';
    description: string;
    shipmentId?: string;
    status: 'success' | 'pending' | 'failed';
    method: 'wallet' | 'card' | 'bank';
    createdAt: Timestamp;
}

export interface EInvoice {
    id: string;
    userId: string;
    amount: number;
    currency: 'USD' | 'NGN' | 'NGN';
    vendor: string;
    description: string;
    status: 'paid' | 'pending' | 'overdue';
    dueDate: Timestamp;
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
            balanceNGN: 0,
            updatedAt: serverTimestamp()
        });
    }
}

import { pushNotification } from "./notification-service";

/**
 * Records a transaction and updates balance in an atomic transaction
 */
export async function executeWalletPayment(
    userId: string,
    amount: number,
    currency: 'USD' | 'NGN',
    description: string,
    shipmentId?: string
) {
    const walletRef = doc(db, "wallets", userId);
    const txnRef = collection(db, "wallets", userId, "transactions");

    const result = await runTransaction(db, async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        if (!walletDoc.exists()) {
            throw new Error("Wallet not found");
        }

        const data = walletDoc.data() as Wallet;
        const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceNGN';
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

    // Notify user of payment success
    await pushNotification(userId, {
        title: 'Payment Successful',
        message: `Your payment of ${currency === 'USD' ? '$' : '₦'}${amount.toLocaleString()} for ${description} was successful.`,
        type: 'alert'
    });

    return result;
}


/**
 * Withdraws funds from the wallet and records the transaction
 */
export async function withdrawFunds(
    userId: string,
    amount: number,
    currency: 'USD' | 'NGN',
    description: string = 'Withdrawal'
) {
    const walletRef = doc(db, "wallets", userId);
    const txnRef = collection(db, "wallets", userId, "transactions");

    const result = await runTransaction(db, async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        if (!walletDoc.exists()) {
            throw new Error("Wallet not found");
        }

        const data = walletDoc.data() as Wallet;
        const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceNGN';
        const currentBalance = data[balanceField] || 0;

        if (currentBalance < amount) {
            throw new Error(`Insufficient ${currency} balance for withdrawal`);
        }

        // Update Balance
        transaction.update(walletRef, {
            [balanceField]: currentBalance - amount,
            updatedAt: serverTimestamp()
        });

        // Add Transaction Record
        const newTxnDoc = doc(txnRef);
        transaction.set(newTxnDoc, {
            type: 'withdrawal',
            amount: -amount,
            currency,
            description,
            status: 'success',
            method: 'bank',
            createdAt: serverTimestamp()
        });

        return newTxnDoc.id;
    });

    // Notify user of withdrawal
    await pushNotification(userId, {
        title: 'Withdrawal Processed',
        message: `Your withdrawal of ${currency === 'USD' ? '$' : '₦'}${amount.toLocaleString()} has been processed.`,
        type: 'alert'
    });

    return result;
}

/**
 * Processes a settlement payout to a vendor
 */
export async function processSettlement(
    userId: string,
    amount: number,
    currency: 'USD' | 'NGN',
    vendor: string,
    description: string = 'Vendor Settlement'
) {
    const walletRef = doc(db, "wallets", userId);
    const txnRef = collection(db, "wallets", userId, "transactions");

    return await runTransaction(db, async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        if (!walletDoc.exists()) throw new Error("Wallet not found");

        const data = walletDoc.data() as Wallet;
        const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceNGN';
        const currentBalance = data[balanceField] || 0;

        if (currentBalance < amount) {
            throw new Error(`Insufficient ${currency} balance for settlement`);
        }

        transaction.update(walletRef, {
            [balanceField]: currentBalance - amount,
            updatedAt: serverTimestamp()
        });

        const newTxnDoc = doc(txnRef);
        transaction.set(newTxnDoc, {
            type: 'transfer',
            amount: -amount,
            currency,
            description: `Settlement: ${vendor} - ${description}`,
            status: 'success',
            method: 'bank',
            createdAt: serverTimestamp()
        });

        await pushNotification(userId, {
            title: 'Settlement Processed',
            message: `Your settlement of ${currency === 'USD' ? '$' : '₦'}${amount.toLocaleString()} to ${vendor} was successful.`,
            type: 'system'
        });

        return newTxnDoc.id;
    });
}

/**
 * Generates a mock E-Invoice (persisted in Firestore)
 */
export async function generateEInvoice(
    userId: string,
    amount: number,
    currency: 'USD' | 'NGN' | 'NGN',
    vendor: string,
    description: string
) {
    const invoiceRef = collection(db, "wallets", userId, "invoices");
    const newInvoiceDoc = doc(invoiceRef);

    const invoiceData: EInvoice = {
        id: newInvoiceDoc.id,
        userId,
        amount,
        currency,
        vendor,
        description,
        status: 'pending',
        dueDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days from now
        createdAt: Timestamp.now()
    };

    await setDoc(newInvoiceDoc, invoiceData);

    await pushNotification(userId, {
        title: 'New E-Invoice Generated',
        message: `A new invoice for ${currency} ${amount} from ${vendor} has been created.`,
        type: 'shipment'
    });

    return newInvoiceDoc.id;
}

/**
 * Gets a user's digital invoices
 */
export async function getEInvoices(userId: string): Promise<EInvoice[]> {
    const invoiceRef = collection(db, "wallets", userId, "invoices");
    const q = query(invoiceRef, orderBy("createdAt", "desc"), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data() })) as EInvoice[];
}

/**
 * Converts currency within the wallet (USD <-> NGN)
 */
export async function convertCurrency(
    userId: string,
    fromAmount: number,
    fromCurrency: 'USD' | 'NGN',
    toCurrency: 'USD' | 'NGN',
    rate: number
) {
    const walletRef = doc(db, "wallets", userId);
    const txnRef = collection(db, "wallets", userId, "transactions");

    return await runTransaction(db, async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        if (!walletDoc.exists()) throw new Error("Wallet not found");

        const data = walletDoc.data() as Wallet;
        const fromField = fromCurrency === 'USD' ? 'balanceUSD' : 'balanceNGN';
        const toField = toCurrency === 'USD' ? 'balanceUSD' : 'balanceNGN';

        const currentFromBalance = data[fromField] || 0;
        const currentToBalance = data[toField] || 0;

        if (currentFromBalance < fromAmount) {
            throw new Error(`Insufficient ${fromCurrency} balance for conversion`);
        }

        const toAmount = fromAmount * rate;

        transaction.update(walletRef, {
            [fromField]: currentFromBalance - fromAmount,
            [toField]: currentToBalance + toAmount,
            updatedAt: serverTimestamp()
        });

        // Record two transaction legs or one summary
        const txnDoc = doc(txnRef);
        transaction.set(txnDoc, {
            type: 'transfer',
            amount: toAmount,
            currency: toCurrency,
            description: `FX Swap: ${fromCurrency} to ${toCurrency} @ ${rate}`,
            status: 'success',
            method: 'wallet',
            createdAt: serverTimestamp()
        });

        await pushNotification(userId, {
            title: 'FX Conversion Success',
            message: `Converted ${fromCurrency} ${fromAmount} to ${toCurrency} ${toAmount.toFixed(2)}.`,
            type: 'system'
        });

        return txnDoc.id;
    });
}
/**
 * Updates the KYC status for a user's wallet
 */
export async function updateKYCStatus(userId: string, status: Wallet['kycStatus']) {
    const walletRef = doc(db, "wallets", userId);
    await updateDoc(walletRef, {
        kycStatus: status,
        updatedAt: serverTimestamp()
    });
}
