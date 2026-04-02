import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    serverTimestamp,
    arrayUnion,
    writeBatch,
} from "firebase/firestore";
import {
    ref,
    uploadBytes,
    getDownloadURL
} from "firebase/storage";
import { db, storage } from "./firebase";
import { pushNotification } from "./notification-service";

// Types
export interface ShipmentAddress {
    name: string;
    company?: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
    email?: string;
}

export interface ShipmentPackage {
    id?: string; // Internal parcel ID
    parcelId?: string; // User-facing tracking ID for Agent sub-users
    weight: number;
    dimensions?: {
        length: number;
        width: number;
        height: number;
    };
    description: string;
    pieces: number;
    ticketNumber?: string;
    declaredValue?: number;
    isFragile: boolean;
    requiresSignature: boolean;
}

export interface ShipmentPrice {
    base: number;
    fuel: number;
    insurance?: number;
    total: number;
    currency: string;
}

export type ShipmentStatus =
    | "pending"
    | "confirmed"
    | "picked_up"
    | "in_transit"
    | "at_hub"
    | "out_for_delivery"
    | "delivered"
    | "cancelled"
    | "returned"
    | "customs_hold";

export interface Shipment {
    id?: string;
    trackingNumber: string;
    userId: string;
    cargoType?: string;
    status: ShipmentStatus;
    currentLocation: string;
    progress: number;
    packages: ShipmentPackage[];
    sender: ShipmentAddress;
    recipient: ShipmentAddress;
    service: "express" | "standard" | "economy";
    estimatedDelivery: Timestamp;
    departureDate?: Timestamp;
    poNumber?: string;
    bookingComments?: string;
    isDangerousGoods?: boolean;
    customsDuty?: number;
    customsDutyStatus?: "none" | "pending" | "paid";
    consignmentMedia?: {
        url: string;
        type: 'image' | 'video';
        name: string;
        createdAt: Timestamp;
    }[];
    shippingDocuments?: {
        url: string;
        name: string;
        type: string;
        createdAt: Timestamp;
    }[];
    price: ShipmentPrice;
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    paymentMethod?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    pickedUpAt?: Timestamp;
    deliveredAt?: Timestamp;
}

export interface TrackingEvent {
    id?: string;
    shipmentId: string;
    status: ShipmentStatus;
    location: string;
    description: string;
    timestamp: Timestamp;
    createdBy?: string;
}

// Shipping Tracking handled below

// Upload a blog cover image
export async function uploadBlogImage(file: File): Promise<string> {
    const filename = `blog_covers/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
}

// Generate tracking number
export function generateTrackingNumber(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "CF-";
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Create a new shipment
export async function createShipment(
    shipmentData: Omit<Shipment, "id" | "trackingNumber" | "createdAt" | "updatedAt" | "status" | "progress" | "currentLocation">
): Promise<string> {
    const trackingNumber = generateTrackingNumber();

    const shipment: Omit<Shipment, "id"> = {
        ...shipmentData,
        trackingNumber,
        packages: shipmentData.packages.map((pkg, index) => ({
            ...pkg,
            id: pkg.id || `pkg-${Date.now()}-${index}`,
            parcelId: pkg.parcelId || `${trackingNumber}-${(index + 1).toString().padStart(2, '0')}`
        })),
        status: "pending",
        currentLocation: shipmentData.sender.city + ", " + shipmentData.sender.country,
        progress: 0,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
    };

    const docRef = await addDoc(collection(db, "shipments"), shipment);

    // Create initial tracking event
    await addTrackingEvent(docRef.id, {
        shipmentId: docRef.id,
        status: "pending",
        location: shipment.currentLocation,
        description: "Shipment created and awaiting pickup",
        timestamp: serverTimestamp() as Timestamp,
    });

    return trackingNumber;
}

// Helper to get random item
export const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];


// Get shipment by tracking number
export async function getShipmentByTracking(trackingNumber: string): Promise<Shipment | null> {
    try {
        const q = query(
            collection(db, "shipments"),
            where("trackingNumber", "==", trackingNumber.toUpperCase())
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() } as Shipment;
        }
    } catch (e) {
        console.error("Firestore fetch failed:", e);
    }

    return null;
}

// Get shipment by ID
export async function getShipmentById(shipmentId: string): Promise<Shipment | null> {

    try {
        const docRef = doc(db, "shipments", shipmentId);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() } as Shipment;
        }
    } catch (e) {
        console.warn("Firestore fetch by ID failed:", e);
    }
    return null;
}

// Get all shipments (Admin)
export async function getAllShipments(): Promise<Shipment[]> {
    try {
        const q = query(
            collection(db, "shipments"),
            orderBy("createdAt", "desc"),
            limit(100)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Shipment);
    } catch (error) {
        console.error("Error fetching all shipments:", error);
        return [];
    }
}

// Update customs duty (Admin) - Batch version recommended for complex flows
export async function updateShipmentCustomsDuty(
    shipmentId: string,
    amount: number,
    status: "pending" | "paid" = "pending"
): Promise<void> {
    const shipmentRef = doc(db, "shipments", shipmentId);
    await updateDoc(shipmentRef, {
        customsDuty: amount,
        customsDutyStatus: status,
        updatedAt: serverTimestamp()
    });
}

// Atomic apply customs duty and set status to customs_hold
export async function applyCustomsDutyWithStatus(
    shipmentId: string,
    amount: number,
    location: string,
    description: string,
    updatedBy?: string
): Promise<void> {

    const batch = writeBatch(db);
    const shipmentRef = doc(db, "shipments", shipmentId);
    const eventRef = doc(collection(db, "shipments", shipmentId, "tracking_events"));

    // Progress for customs_hold is 50
    batch.update(shipmentRef, {
        customsDuty: amount,
        customsDutyStatus: "pending",
        status: "customs_hold",
        currentLocation: location,
        progress: 50,
        updatedAt: serverTimestamp()
    });

    const eventData: any = {
        shipmentId,
        status: "customs_hold",
        location,
        description,
        timestamp: serverTimestamp() as Timestamp,
    };

    if (updatedBy) {
        eventData.createdBy = updatedBy;
    }

    batch.set(eventRef, eventData);

    await batch.commit();

    // Push customs hold notification to shipment owner
    try {
        const shipmentSnap = await getDoc(shipmentRef);
        if (shipmentSnap.exists()) {
            const shipmentData = shipmentSnap.data();
            await pushNotification(shipmentData.userId, {
                title: 'Customs Duty Required',
                message: `Your shipment ${shipmentData.trackingNumber} has been placed on customs hold. A duty of $${amount.toFixed(2)} is required to proceed.`,
                type: 'alert',
            });
        }
    } catch (e) {
        console.error("Failed to send customs notification:", e);
    }
}

// Get shipments with pending customs duties for a user
export async function getPendingCustomsDuties(userId: string): Promise<Shipment[]> {
    try {
        const q = query(
            collection(db, "shipments"),
            where("userId", "==", userId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }) as Shipment)
            .filter(shipment => shipment.customsDutyStatus === "pending" && (shipment.customsDuty || 0) > 0);
    } catch (error) {
        console.error("Error fetching pending duties:", error);
        return [];
    }
}

// Get user's shipments
export async function getUserShipments(userId: string): Promise<Shipment[]> {
    const q = query(
        collection(db, "shipments"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Shipment);
    }

    // No shipments found for this user – return empty array as fallback
    console.warn("No shipments found for user", userId, "- returning empty array");
    return [];
}

// Add tracking event
export async function addTrackingEvent(
    shipmentId: string,
    event: Omit<TrackingEvent, "id">
): Promise<void> {
    await addDoc(collection(db, "shipments", shipmentId, "tracking_events"), event);
}

// Get tracking events for a shipment
export async function getTrackingEvents(shipmentId: string): Promise<TrackingEvent[]> {

    try {
        const q = query(
            collection(db, "shipments", shipmentId, "tracking_events"),
            orderBy("timestamp", "desc")
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as TrackingEvent);
    } catch (error) {
        console.error("Error fetching events, returning empty array", error);
        return [];
    }
}

// Update shipment status
export async function updateShipmentStatus(
    shipmentId: string,
    status: ShipmentStatus,
    location: string,
    description: string,
    updatedBy?: string
): Promise<void> {

    const batch = writeBatch(db);
    const shipmentRef = doc(db, "shipments", shipmentId);
    const eventRef = doc(collection(db, "shipments", shipmentId, "tracking_events"));

    // Calculate progress based on status
    const progressMap: Record<ShipmentStatus, number> = {
        pending: 0,
        confirmed: 15,
        picked_up: 30,
        in_transit: 50,
        at_hub: 65,
        out_for_delivery: 85,
        delivered: 100,
        cancelled: 0,
        returned: 0,
        customs_hold: 50,
    };

    batch.update(shipmentRef, {
        status,
        currentLocation: location,
        progress: progressMap[status],
        updatedAt: serverTimestamp(),
        ...(status === "delivered" && { deliveredAt: serverTimestamp() }),
        ...(status === "picked_up" && { pickedUpAt: serverTimestamp() }),
    });

    const eventData: any = {
        shipmentId,
        status: status,
        location,
        description,
        timestamp: serverTimestamp() as Timestamp,
    };

    if (updatedBy) {
        eventData.createdBy = updatedBy;
    }

    batch.set(eventRef, eventData);

    await batch.commit();

    // Push notification to shipment owner
    try {
        const shipmentSnap = await getDoc(shipmentRef);
        if (shipmentSnap.exists()) {
            const shipmentData = shipmentSnap.data();
            await pushNotification(shipmentData.userId, {
                title: `Shipment ${getStatusDisplay(status)}`,
                message: `Your shipment ${shipmentData.trackingNumber} is now: ${getStatusDisplay(status)}.`,
                type: 'shipment',
            });
        }
    } catch (e) {
        console.error("Failed to send shipment status notification:", e);
    }
}


// Upload shipment files (media or documents)
export async function uploadShipmentFiles(
    shipmentId: string,
    files: File[],
    category: 'media' | 'document'
): Promise<void> {
    const shipmentRef = doc(db, "shipments", shipmentId);

    for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const folder = category === 'media' ? 'consignment_media' : 'shipping_documents';
        const storageRef = ref(storage, `shipments/${shipmentId}/${folder}/${fileName}`);

        // 1. Upload to Storage
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        // 2. Update Firestore based on category
        if (category === 'media') {
            await updateDoc(shipmentRef, {
                consignmentMedia: arrayUnion({
                    url: downloadURL,
                    type: file.type.startsWith('video') ? 'video' : 'image',
                    name: file.name,
                    createdAt: Timestamp.now()
                }),
                updatedAt: serverTimestamp()
            });
        } else {
            await updateDoc(shipmentRef, {
                shippingDocuments: arrayUnion({
                    url: downloadURL,
                    name: file.name,
                    type: fileExt || 'unknown',
                    createdAt: Timestamp.now()
                }),
                updatedAt: serverTimestamp()
            });
        }
    }
}

// Kept for backward compatibility if any other components use it
export async function uploadConsignmentMedia(
    shipmentId: string,
    file: File
): Promise<void> {
    return uploadShipmentFiles(shipmentId, [file], 'media');
}

// Format timestamp for display
export function formatTimestamp(timestamp: Timestamp): string {
    if (!timestamp || !timestamp.toDate) return "";
    return timestamp.toDate().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

// Get status display text
export function getStatusDisplay(status: ShipmentStatus): string {
    const displayMap: Record<ShipmentStatus, string> = {
        pending: "Pending",
        confirmed: "Confirmed",
        picked_up: "Picked Up",
        in_transit: "In Transit",
        at_hub: "At Sorting Hub",
        out_for_delivery: "Out for Delivery",
        delivered: "Delivered",
        cancelled: "Cancelled",
        returned: "Returned",
        customs_hold: "Customs Hold",
    };
    return displayMap[status];
}

// Wallet Types
export interface WalletTransaction {
    id: string;
    userId: string;
    type: "credit" | "debit";
    amount: number;
    description: string;
    reference?: string; // Shipment ID or Payment Ref
    status: "pending" | "success" | "failed";
    createdAt: Timestamp;
}

// Fund Wallet
export async function fundWallet(userId: string, amount: number, reference?: string): Promise<void> {
    const userRef = doc(db, "users", userId);

    // 1. Transaction record
    await addDoc(collection(db, "users", userId, "transactions"), {
        userId,
        type: "credit",
        amount,
        description: "Wallet Funding",
        reference: reference || `FUND-${Date.now()}`,
        status: "success",
        createdAt: serverTimestamp(),
    });

    // 2. Update balance
    // Note: For production, use runTransaction to ensure atomicity
    const userSnap = await getDoc(userRef);
    const currentBalance = userSnap.data()?.walletBalance || 0;

    await updateDoc(userRef, {
        walletBalance: currentBalance + amount,
        updatedAt: serverTimestamp(),
    });

    // Notify user of funding
    await pushNotification(userId, {
        title: 'Wallet Funded',
        message: `Your wallet has been credited with $${amount.toLocaleString()}.`,
        type: 'alert',
    });
}

// Pay with Wallet
export async function payWithWallet(userId: string, amount: number, shipmentId: string): Promise<void> {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const currentBalance = userSnap.data()?.walletBalance || 0;

    if (currentBalance < amount) {
        throw new Error("Insufficient wallet balance");
    }

    // 1. Transaction record
    await addDoc(collection(db, "users", userId, "transactions"), {
        userId,
        type: "debit",
        amount,
        description: `Payment for Shipment #${shipmentId}`,
        reference: shipmentId,
        status: "success",
        createdAt: serverTimestamp(),
    });

    // 2. Deduct balance
    await updateDoc(userRef, {
        walletBalance: currentBalance - amount,
        updatedAt: serverTimestamp(),
    });

    // Notify user of payment
    await pushNotification(userId, {
        title: 'Payment Successful',
        message: `Your payment of $${amount.toLocaleString()} for shipment #${shipmentId} was successful.`,
        type: 'shipment',
    });
}

// Get Wallet Transactions
export async function getWalletTransactions(userId: string): Promise<WalletTransaction[]> {
    const q = query(
        collection(db, "users", userId, "transactions"),
        orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as WalletTransaction);
}
