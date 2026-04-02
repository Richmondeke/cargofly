"use client";

import {
    collection,
    doc,
    addDoc,
    deleteDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    serverTimestamp,
    QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";
import { Shipment, ShipmentStatus } from "./firestore";

// ============== TYPES ==============

export interface DashboardShipment {
    id: string;
    trackingNumber?: string;
    origin: string;
    destination: string;
    status: string;
    progress: number;
    eta: string;
    price?: { total: number; currency: string };
    paymentStatus?: string;
    totalPrice?: string;
    packages?: { description: string; weight: number; dimensions?: { length: number; width: number; height: number } }[];
    category: string;
    weight: string;
    customsDuty?: number;
    createdAt?: Timestamp;
    estimatedDelivery?: Timestamp;
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
}

export interface MonthlyVolume {
    month: string;
    value: number;
}

export interface Activity {
    id: string;
    userId: string;
    userName: string;
    action: string;
    entityType: "shipment" | "booking" | "invoice" | "system";
    entityId?: string;
    timestamp: Timestamp;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    shipmentId?: string;
    customerId: string;
    customerName: string;
    amount: number;
    currency: string;
    status: "pending" | "paid" | "overdue" | "cancelled";
    issuedAt: Timestamp;
    dueAt: Timestamp;
    paidAt?: Timestamp;
}

export interface Location {
    id: string;
    name: string;
    code: string;
    type: "hub" | "warehouse" | "airport" | "port";
    city: string;
    country: string;
    coordinates?: { lat: number; lng: number };
    status: "active" | "inactive";
    capacity?: number;
}

export interface Quote {
    id: string;
    userId: string;
    origin: string;
    destination: string;
    serviceType: "express" | "standard" | "economy";
    weight: number;
    cargoType?: string;
    price: number;
    expiresAt: Timestamp;
    createdAt: Timestamp;
}

export interface SavedAddress {
    id: string;
    userId: string;
    label: string;
    name: string;
    phone: string;
    email: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
    createdAt: Timestamp;
}

export interface Claim {
    id: string;
    userId: string;
    shipmentId: string;
    type: "loss" | "damage" | "delay";
    description: string;
    amount: number;
    currency: string;
    status: "pending" | "under_review" | "approved" | "rejected";
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Route {
    id: string;
    origin: string;
    destination: string;
    transitTime: string;
    distance?: string;
    rate: number;
    currency: string;
    type: "local" | "regional" | "international";
    modes: string[];
    frequency: string;
    status: "active" | "suspended";
}

export interface TeamMember {
    id: string;
    uid: string;
    displayName: string;
    email: string;
    role: "admin" | "staff" | "manager";
    department: string;
    status: "active" | "inactive";
    joinedAt: Timestamp;
}

// ============== DASHBOARD STATS ==============

// ============== DASHBOARD STATS ==============

export async function getDashboardStats(userId?: string, role?: string) {
    console.log("Fetching dashboard stats...", { userId, role });
    try {
        const shipmentsRef = collection(db, "shipments");
        let q = query(shipmentsRef);

        if (role !== 'admin' && userId) {
            q = query(shipmentsRef, where("userId", "==", userId));
        }

        const snapshot = await getDocs(q);
        console.log(`Fetched ${snapshot.size} shipments for stats`);

        let totalShipments = 0;
        let inTransit = 0;
        let delivered = 0;
        let totalRevenue = 0;
        let pending = 0;

        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            totalShipments++;

            // Normalize status to lowercase for comparison
            const status = (data.status || '').toLowerCase();

            // Mapping logic for in_transit
            const inTransitStatuses = ["in_transit", "in transit", "at_hub", "at hub", "out_for_delivery", "out for delivery", "on_way", "at_destination_hub"];
            if (inTransitStatuses.includes(status)) {
                inTransit++;
            }
            if (status === "delivered" || status === "completed") {
                delivered++;
            }
            if (status === "pending" || status === "confirmed" || status === "awaiting_pickup") {
                pending++;
            }
            if (data.price?.total) {
                totalRevenue += (data.price.total || 0);
            }
        });

        return {
            totalShipments,
            inTransit,
            delivered,
            pending,
            totalRevenue,
        };
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        throw error;
    }
}

// ============== SHIPMENTS ==============

// ============== SHIPMENTS ==============

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

export function formatActivityTime(timestamp: Timestamp): string {
    if (!timestamp?.toDate) return "";
    const date = timestamp.toDate();
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
}


export async function getActiveShipments(userId?: string, role?: string, statusFilter?: string): Promise<DashboardShipment[]> {
    const shipmentsRef = collection(db, "shipments");
    const constraints: QueryConstraint[] = [];

    // To avoid composite index requirements for every filter combination,
    // we only use orderBy when NO filters are applied. Otherwise we sort in memory.
    const hasUserId = !!userId;
    const hasStatusFilter = !!(statusFilter && statusFilter.toLowerCase() !== "all");
    const hasAnyFilter = hasUserId || hasStatusFilter;

    if (hasUserId) {
        constraints.push(where("userId", "==", userId));
    }

    if (hasStatusFilter) {
        const _filter = statusFilter!.toLowerCase();
        const statusMap: Record<string, ShipmentStatus[]> = {
            "in transit": ["in_transit", "at_hub", "out_for_delivery", "picked_up"],
            "customs hold": ["customs_hold"],
            "delivered": ["delivered"],
            "pending": ["pending", "confirmed"],
        };
        const statuses = statusMap[_filter];
        if (statuses && statuses.length > 0) {
            constraints.push(where("status", "in", statuses));
        }
    }

    if (!hasAnyFilter) {
        constraints.push(orderBy("createdAt", "desc"));
    }

    constraints.push(limit(50));

    const q = query(shipmentsRef, ...constraints);
    const snapshot = await getDocs(q);

    console.log("getActiveShipments DEBUG:", {
        queryUserId: userId,
        role,
        statusFilter,
        resultsCount: snapshot.size,
    });

    // Map to DashboardShipment format
    const results = snapshot.docs.map((doc) => {
        const data = doc.data() as Shipment;
        const eta = data.estimatedDelivery
            ? formatTimestamp(data.estimatedDelivery)
            : "Processing...";

        return {
            id: doc.id,
            trackingNumber: data.trackingNumber,
            origin: data.sender?.city || "Unknown",
            destination: data.recipient?.city || "Unknown",
            status: data.status,
            progress: data.progress || 0,
            eta,
            price: data.price,
            paymentStatus: data.paymentStatus || 'pending',
            totalPrice: data.price ? `${data.price.currency === 'NGN' ? '₦' : '$'}${data.price.total.toLocaleString()}` : 'N/A',
            packages: data.packages,
            category: data.service || "General",
            weight: data.packages?.length > 0
                ? `${data.packages.reduce((sum, p) => sum + p.weight, 0).toFixed(1)}kg`
                : ((data as any).package?.weight ? `${(data as any).package.weight}kg` : "N/A"),
            createdAt: data.createdAt,
            estimatedDelivery: data.estimatedDelivery,
            consignmentMedia: data.consignmentMedia
        };
    });

    // Sort in memory when filtering (since we couldn't use orderBy)
    if (hasAnyFilter) {
        results.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return timeB - timeA;
        });
    }

    // Remove createdAt from final output (not part of DashboardShipment type)
    return results.map(({ createdAt, ...rest }) => rest);
}

function formatEta(date: Date): string {
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return "Delivered";
    if (diff === 1) return "1 day";
    return `${diff} days`;
}

function formatStatus(status: ShipmentStatus): string {
    const map: Record<ShipmentStatus, string> = {
        pending: "Pending",
        confirmed: "Pending",
        picked_up: "Picked Up",
        at_hub: "At Hub",
        in_transit: "In Transit",
        out_for_delivery: "Out for Delivery",
        delivered: "Delivered",
        cancelled: "Cancelled",
        returned: "Returned",
        customs_hold: "Customs Hold"
    };
    return map[status] || status;
}

import { pushNotification, notifyShipmentUpdate } from "./notification-service";

export async function updateShipmentStatus(
    shipmentId: string,
    status: ShipmentStatus,
    location?: string,
    action: string = "Status Update",
    userName: string = "System",
    userId?: string
): Promise<void> {
    const shipmentRef = doc(db, "shipments", shipmentId);

    // Get shipment data first to find recipient UID and info
    const shipmentSnap = await getDoc(shipmentRef);
    if (!shipmentSnap.exists()) return;
    const shipmentData = shipmentSnap.data() as Shipment;
    const ownerId = shipmentData.userId;

    const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
    };

    if (location) {
        updateData.currentLocation = location;
    }

    if (status === "delivered") {
        updateData.progress = 100;
        updateData.estimatedDelivery = serverTimestamp(); // Actual delivery time
    } else if (status === "picked_up") {
        updateData.progress = 25;
    } else if (status === "in_transit") {
        updateData.progress = 50;
    } else if (status === "out_for_delivery") {
        updateData.progress = 75;
    }

    await updateDoc(shipmentRef, updateData);

    // Notify the user (shipment owner)
    if (ownerId) {
        // 1. In-App Notification
        await pushNotification(ownerId, {
            title: `Shipment Update: ${status}`,
            message: `Your shipment ${shipmentId} is now ${status}${location ? ` @ ${location}` : ''}.`,
            type: 'shipment'
        });

        // 2. External Notifications (Email/SMS)
        const userSettings = await getUserSettings(ownerId);
        if (userSettings) {
            const preferences = userSettings.notificationPreferences || { email: true, sms: false, push: true };
            await notifyShipmentUpdate(
                ownerId,
                preferences,
                shipmentId,
                status,
                userSettings.email,
                userSettings.phone
            );
        }
    }

    // Log the activity
    if (userId) {
        await logActivity(userId, userName, `${action}: ${status}`, "shipment", shipmentId);
    }
}

// ============== MONTHLY VOLUME ==============

export async function getMonthlyVolume(userId?: string, role?: string): Promise<MonthlyVolume[]> {
    const shipmentsRef = collection(db, "shipments");
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const constraints: QueryConstraint[] = [
        where("createdAt", ">=", Timestamp.fromDate(sixMonthsAgo)),
        orderBy("createdAt", "asc")
    ];

    if (role !== 'admin' && userId) {
        constraints.unshift(where("userId", "==", userId));
    }

    const q = query(shipmentsRef, ...constraints);

    const snapshot = await getDocs(q);
    const monthCounts: Record<string, number> = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.createdAt?.toDate) {
            const date = data.createdAt.toDate();
            const monthKey = months[date.getMonth()];
            monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
        }
    });

    // Return last 6 months in order
    const now = new Date();
    const result: MonthlyVolume[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        const monthName = months[d.getMonth()];
        result.push({ month: monthName, value: monthCounts[monthName] || 0 });
    }

    return result;
}

// ============== ACTIVITIES ==============

// ============== ACTIVITIES ==============

export async function getRecentActivities(userId?: string, role?: string, limitCount = 10): Promise<Activity[]> {
    const activitiesRef = collection(db, "activities");

    // If we have a userId filter, we can't use orderBy("timestamp") without a composite index.
    // So we'll fetch filtered by userId, then sort in memory.
    const constraints: QueryConstraint[] = [limit(limitCount)]; // Removed orderBy from here

    if (role !== 'admin' && userId) {
        constraints.unshift(where("userId", "==", userId));
    } else {
        // If NO userId filter (admin view all), we CAN use orderBy timestamp (single field index exists by default)
        constraints.unshift(orderBy("timestamp", "desc"));
    }

    const q = query(activitiesRef, ...constraints);

    const snapshot = await getDocs(q);
    const activities = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Activity[];

    // Sort in memory if we couldn't use the index
    if (role !== 'admin' && userId) {
        activities.sort((a, b) => {
            const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
            const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
            return tB - tA;
        });
    }

    return activities;
}

export async function logActivity(
    userId: string,
    userName: string,
    action: string,
    entityType: Activity["entityType"],
    entityId?: string
): Promise<void> {
    await addDoc(collection(db, "activities"), {
        userId,
        userName,
        action,
        entityType,
        entityId,
        timestamp: serverTimestamp(),
    });
}

// The formatTimestamp function was requested to be removed.
// As it was not present in the provided content, no change was made to remove it.
// If the intention was to remove formatActivityTime, please clarify.

// ============== INVOICES ==============

// ============== INVOICES ==============

export async function getInvoices(userId?: string, role?: string, statusFilter?: string): Promise<Invoice[]> {
    const invoicesRef = collection(db, "invoices");
    const constraints: QueryConstraint[] = [orderBy("issuedAt", "desc"), limit(50)];

    if (role !== 'admin' && userId) {
        constraints.unshift(where("customerId", "==", userId));
    }

    if (statusFilter && statusFilter !== "all") {
        constraints.push(where("status", "==", statusFilter));
    }

    const q = query(invoicesRef, ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Invoice[];
}

export async function getFinancialStats(userId?: string, role?: string) {
    const invoicesRef = collection(db, "invoices");
    let q = query(invoicesRef);

    if (role !== 'admin' && userId) {
        q = query(invoicesRef, where("customerId", "==", userId));
    }

    const snapshot = await getDocs(q);

    let totalRevenue = 0;
    let pendingPayments = 0;
    let paidInvoices = 0;

    snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.status === "paid") {
            totalRevenue += data.amount || 0;
            paidInvoices++;
        } else if (data.status === "pending" || data.status === "overdue") {
            pendingPayments += data.amount || 0;
        }
    });

    return { totalRevenue, pendingPayments, paidInvoices };
}

// ============== QUOTES ==============

export async function getQuotes(userId: string): Promise<Quote[]> {
    const quotesRef = collection(db, "quotes");
    const q = query(quotesRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Quote[];
}

export async function createQuote(userId: string, data: Omit<Quote, "id" | "userId" | "createdAt" | "expiresAt">): Promise<string> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Valid for 7 days

    const docRef = await addDoc(collection(db, "quotes"), {
        userId,
        ...data,
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: serverTimestamp(),
    });

    return docRef.id;
}



// ============== ADDRESS BOOK ==============

export async function getAddresses(userId: string): Promise<SavedAddress[]> {
    const addressesRef = collection(db, "addresses");
    const q = query(addressesRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as SavedAddress[];
}

export async function addAddress(userId: string, data: Omit<SavedAddress, "id" | "userId" | "createdAt">): Promise<string> {
    const docRef = await addDoc(collection(db, "addresses"), {
        userId,
        ...data,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function deleteAddress(addressId: string): Promise<void> {
    await deleteDoc(doc(db, "addresses", addressId));
}

// ============== CLAIMS ==============

export async function getClaims(userId: string): Promise<Claim[]> {
    const claimsRef = collection(db, "claims");
    const q = query(claimsRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Claim[];
}

export async function createClaim(userId: string, data: Omit<Claim, "id" | "userId" | "createdAt" | "updatedAt" | "status">, userName: string = "User"): Promise<string> {
    const docRef = await addDoc(collection(db, "claims"), {
        ...data,
        userId,
        status: "under_review",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    // Log the activity
    await logActivity(userId, userName, `Filed a claim for shipment ${data.shipmentId}`, "system", docRef.id);

    return docRef.id;
}

// ============== LOCATIONS & ROUTES ==============

export async function getLocations(): Promise<Location[]> {
    const locationsRef = collection(db, "locations");
    const q = query(locationsRef, orderBy("name", "asc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Location[];
}

export async function getRoutes(): Promise<Route[]> {
    const routesRef = collection(db, "routes");
    const q = query(routesRef, where("status", "==", "active"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Route[];
}

// ============== TEAM MEMBERS ==============

export async function getTeamMembers(): Promise<TeamMember[]> {
    const teamRef = collection(db, "team_members");
    const q = query(teamRef, orderBy("displayName", "asc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as TeamMember[];
}

export async function updateTeamMemberRole(memberId: string, role: TeamMember["role"]): Promise<void> {
    const memberRef = doc(db, "team_members", memberId);
    await updateDoc(memberRef, { role, updatedAt: serverTimestamp() });
}

export async function inviteTeamMember(email: string, role: TeamMember["role"], department: string): Promise<{ success: boolean; message: string }> {
    try {
        // 1. Check if user exists in 'users' collection
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        let uid = "";
        let displayName = "";
        let status: TeamMember["status"] = "inactive";

        if (!querySnapshot.empty) {
            // User exists
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            uid = userDoc.id;
            displayName = userData.displayName || email.split("@")[0];
            status = "active";

            // Update user's role in 'users' collection so they can access dashboard/views immediately
            await updateDoc(doc(db, "users", uid), {
                role: role,
                updatedAt: serverTimestamp()
            });
        } else {
            // User does not exist - Invite Pending
            // In a real app, trigger an email invite here (e.g., via Firebase Extension or API)
            status = "inactive"; // Pending until they sign up
            displayName = email.split("@")[0];
        }

        // 2. Add to 'team_members' collection
        // Check if already in team to avoid duplicates
        const teamRef = collection(db, "team_members");
        const teamQ = query(teamRef, where("email", "==", email));
        const teamSnapshot = await getDocs(teamQ);

        if (!teamSnapshot.empty) {
            return { success: false, message: "User is already a team member." };
        }

        await addDoc(collection(db, "team_members"), {
            uid, // Empty if not registered yet
            email,
            displayName,
            role,
            department,
            status,
            joinedAt: serverTimestamp(),
        });

        return { success: true, message: status === "active" ? "User added to team successfully." : "Invite sent to email." };

    } catch (error: any) {
        console.error("Error inviting team member:", error);
        return { success: false, message: error.message || "Failed to invite." };
    }
}

// ============== USER SETTINGS ==============

export async function getUserSettings(userId: string) {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() : null;
}

export async function updateUserSettings(userId: string, settings: Record<string, unknown>): Promise<void> {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
        ...settings,
        updatedAt: serverTimestamp(),
    });
}

// ============== USER MANAGEMENT ==============

export async function getCustomers(): Promise<TeamMember[]> {
    const usersRef = collection(db, "users");
    // DEBUG: Fetch all to see what's in there, handle filtering in memory if needed or just debugging
    const q = query(usersRef);
    const snapshot = await getDocs(q);

    console.log("DEBUG: Fetched users:", snapshot.size);
    snapshot.docs.forEach(doc => console.log(doc.id, doc.data()));

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            uid: doc.id,
            displayName: data.displayName || "Unknown",
            email: data.email || "",
            role: data.role || "customer",
            department: "Client",
            status: "active",
            joinedAt: data.createdAt,
        } as TeamMember;
    });
}

// Get a single user by ID for displaying user details in filter banner
export async function getUserById(userId: string): Promise<{ displayName: string; email: string } | null> {
    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const data = userSnap.data();
            return {
                displayName: data.displayName || "Unknown User",
                email: data.email || "",
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
}

// ============== NEW BOOKING ==============

export async function createBooking(
    userId: string,
    bookingData: {
        origin: string;
        destination: string;
        serviceType: string;
        packageDetails: {
            weight: number;
            description: string;
            isFragile: boolean;
        }[];
        sender: {
            name: string;
            phone: string;
            email?: string;
        };
        recipient: {
            name: string;
            phone: string;
            email?: string;
        };
        price: {
            base: number;
            fuel: number;
            total: number;
            currency: string;
        };
    },
    paymentStatus: Shipment['paymentStatus'] = "pending",
    userName: string = "User"
): Promise<string> {


    // Generate tracking number
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let trackingNumber = "CF-";
    for (let i = 0; i < 8; i++) {
        trackingNumber += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const shipment = {
        trackingNumber,
        userId,
        status: "pending" as ShipmentStatus,
        currentLocation: bookingData.origin,
        progress: 0,
        sender: {
            name: bookingData.sender.name,
            street: "",
            city: bookingData.origin.split(",")[0].trim(),
            state: "",
            postalCode: "",
            country: bookingData.origin.split(",")[1]?.trim() || "",
            phone: bookingData.sender.phone,
            email: bookingData.sender.email,
        },
        recipient: {
            name: bookingData.recipient.name,
            street: "",
            city: bookingData.destination.split(",")[0].trim(),
            state: "",
            postalCode: "",
            country: bookingData.destination.split(",")[1]?.trim() || "",
            phone: bookingData.recipient.phone,
            email: bookingData.recipient.email,
        },
        packages: bookingData.packageDetails.map(p => ({
            weight: p.weight,
            description: p.description,
            pieces: 1,
            isFragile: p.isFragile,
            requiresSignature: true,
        })),
        service: bookingData.serviceType as "express" | "standard" | "economy",
        estimatedDelivery: Timestamp.fromDate(
            new Date(Date.now() + (bookingData.serviceType === "express" ? 3 : 7) * 24 * 60 * 60 * 1000)
        ),
        price: bookingData.price,
        paymentStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await addDoc(collection(db, "shipments"), shipment);

    // Log activity
    await logActivity(userId, userName, `Created new booking ${trackingNumber}`, "booking", trackingNumber);

    return trackingNumber;
}

// ============== SEED DATA ==============

export async function seedInitialData(): Promise<void> {
    // Seed locations
    const locationsRef = collection(db, "locations");
    const locSnapshot = await getDocs(locationsRef);
    const existingLocNames = new Set(locSnapshot.docs.map(d => d.data().name));

    const locations = [
        { name: "Lagos Hub", code: "LOS", type: "hub", city: "Lagos", country: "Nigeria", status: "active", capacity: 5000 },
        { name: "London Warehouse", code: "LHR", type: "warehouse", city: "London", country: "UK", status: "active", capacity: 8000 },
        { name: "Dubai Airport", code: "DXB", type: "airport", city: "Dubai", country: "UAE", status: "active", capacity: 12000 },
        { name: "New York Hub", code: "JFK", type: "hub", city: "New York", country: "USA", status: "active", capacity: 10000 },
        { name: "Shanghai Port", code: "SHA", type: "port", city: "Shanghai", country: "China", status: "active", capacity: 15000 },
        { name: "Accra", code: "ACC", type: "airport", city: "Accra", country: "Ghana", status: "active", capacity: 2000 },
        { name: "Cotonou", code: "COO", type: "airport", city: "Cotonou", country: "Benin", status: "active", capacity: 1500 },
        { name: "Lomé", code: "LFW", type: "airport", city: "Lomé", country: "Togo", status: "active", capacity: 1500 },
        { name: "Abidjan", code: "ABJ", type: "airport", city: "Abidjan", country: "Ivory Coast", status: "active", capacity: 2500 },
    ];

    for (const loc of locations) {
        if (!existingLocNames.has(loc.name)) {
            await addDoc(locationsRef, { ...loc, createdAt: serverTimestamp() });
        }
    }

    // Seed routes
    const routesRef = collection(db, "routes");
    const routeSnapshot = await getDocs(routesRef);
    const existingRouteDestinations = new Set(routeSnapshot.docs.map(d => d.data().destination));

    const routes = [
        // LOCAL
        { origin: "Lagos", destination: "North - Central", transitTime: "1.5HRS", distance: "1.5HRS", rate: 2500, currency: "NGN", type: "local", modes: ["Air"], frequency: "Daily", status: "active" },
        { origin: "Lagos", destination: "North - East", transitTime: "2.6HRS", distance: "2.6HRS", rate: 3500, currency: "NGN", type: "local", modes: ["Air"], frequency: "Daily", status: "active" },
        { origin: "Lagos", destination: "North-West", transitTime: "2.4HRS", distance: "2.4HRS", rate: 3500, currency: "NGN", type: "local", modes: ["Air"], frequency: "Daily", status: "active" },
        { origin: "Lagos", destination: "South - East", transitTime: "1.2HRS", distance: "1.2HRS", rate: 2500, currency: "NGN", type: "local", modes: ["Air"], frequency: "Daily", status: "active" },
        { origin: "Lagos", destination: "South - South", transitTime: "0.9HRS", distance: "0.9HRS", rate: 2500, currency: "NGN", type: "local", modes: ["Air"], frequency: "Daily", status: "active" },
        // REGIONAL
        { origin: "Lagos", destination: "Ghana", transitTime: "1.18HRS", distance: "1.18HRS", rate: 8, currency: "USD", type: "regional", modes: ["Air"], frequency: "Daily", status: "active" },
        { origin: "Lagos", destination: "Benin", transitTime: "0.32HRS", distance: "0.32HRS", rate: 7, currency: "USD", type: "regional", modes: ["Air"], frequency: "Daily", status: "active" },
        { origin: "Lagos", destination: "Togo", transitTime: "0.59HRS", distance: "0.59HRS", rate: 7, currency: "USD", type: "regional", modes: ["Air"], frequency: "Daily", status: "active" },
        { origin: "Lagos", destination: "Abidjan", transitTime: "1.76HRS", distance: "1.76HRS", rate: 8.5, currency: "USD", type: "regional", modes: ["Air"], frequency: "Daily", status: "active" },
    ];

    for (const route of routes) {
        if (!existingRouteDestinations.has(route.destination)) {
            await addDoc(routesRef, { ...route, createdAt: serverTimestamp() });
        }
    }
}

export async function updateRoute(routeId: string, data: Partial<Omit<Route, "id">>): Promise<void> {
    const routeRef = doc(db, "routes", routeId);
    await updateDoc(routeRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

export async function addRoute(data: Omit<Route, "id">): Promise<string> {
    const routesRef = collection(db, "routes");
    const docRef = await addDoc(routesRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function deleteRoute(routeId: string): Promise<void> {
    const routeRef = doc(db, "routes", routeId);
    await updateDoc(routeRef, {
        status: "inactive",
        updatedAt: serverTimestamp(),
    });
}
