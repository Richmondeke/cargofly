/**
 * Ticket Service
 * Handles support ticket CRUD and messaging operations
 */

import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    onSnapshot,
    limit
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface Ticket {
    id: string;
    userId: string;
    userEmail: string;
    userName: string;
    subject: string;
    category: 'shipment' | 'payment' | 'duties' | 'tracking' | 'claims' | 'technical' | 'general';
    status: 'open' | 'in-progress' | 'pending-customer' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high';
    shipmentId?: string;
    createdAt: Date;
    updatedAt: Date;
    lastMessageAt: Date;
    assignedTo?: string;
    unreadByAdmin: boolean;
    unreadByUser: boolean;
}

export interface Message {
    id: string;
    senderId: string;
    senderName: string;
    senderRole: 'customer' | 'admin' | 'staff';
    content: string;
    createdAt: Date;
    attachments?: string[];
    seen?: boolean;
}

export interface CreateTicketData {
    userId: string;
    userEmail: string;
    userName: string;
    subject: string;
    category: Ticket['category'];
    priority: Ticket['priority'];
    description: string;
    shipmentId?: string;
}

// Generate ticket ID
function generateTicketId(): string {
    const num = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TKT-${num}`;
}

/**
 * Create a new support ticket
 */
export async function createTicket(data: CreateTicketData): Promise<string> {
    const ticketId = generateTicketId();
    const now = Timestamp.now();

    const ticketRef = doc(db, 'tickets', ticketId);
    const ticketData = {
        id: ticketId,
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        subject: data.subject,
        category: data.category,
        priority: data.priority,
        status: 'open',
        shipmentId: data.shipmentId || null,
        createdAt: now,
        updatedAt: now,
        lastMessageAt: now,
        assignedTo: null,
        unreadByAdmin: true,
        unreadByUser: false,
    };

    await import('firebase/firestore').then(({ setDoc }) => setDoc(ticketRef, ticketData));

    // Add initial message (the description)
    await addMessage(ticketId, {
        senderId: data.userId,
        senderName: data.userName,
        senderRole: 'customer',
        content: data.description,
    });

    return ticketId;
}

/**
 * Get all tickets for a user
 */
export async function getUserTickets(userId: string): Promise<Ticket[]> {
    const ticketsRef = collection(db, 'tickets');
    // Remove orderBy to avoid missing index error
    const q = query(
        ticketsRef,
        where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const tickets = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastMessageAt: doc.data().lastMessageAt?.toDate(),
    })) as Ticket[];

    // Sort in memory
    return tickets.sort((a, b) => {
        const timeA = a.updatedAt?.getTime() || 0;
        const timeB = b.updatedAt?.getTime() || 0;
        return timeB - timeA;
    });
}

/**
 * Get all tickets (for admin)
 */
export async function getAllTickets(statusFilter?: Ticket['status']): Promise<Ticket[]> {
    const ticketsRef = collection(db, 'tickets');
    let q = query(ticketsRef, orderBy('updatedAt', 'desc'));

    if (statusFilter) {
        q = query(ticketsRef, where('status', '==', statusFilter), orderBy('updatedAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastMessageAt: doc.data().lastMessageAt?.toDate(),
    })) as Ticket[];
}

/**
 * Get a single ticket by ID
 */
export async function getTicketById(ticketId: string): Promise<Ticket | null> {
    const ticketRef = doc(db, 'tickets', ticketId);
    const snapshot = await getDoc(ticketRef);

    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    return {
        ...data,
        id: snapshot.id,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        lastMessageAt: data.lastMessageAt?.toDate(),
    } as Ticket;
}

import { pushNotification } from './notification-service';

/**
 * Update ticket status
 */
export async function updateTicketStatus(
    ticketId: string,
    status: Ticket['status'],
    assignedTo?: string
): Promise<void> {
    const ticketRef = doc(db, 'tickets', ticketId);

    // Get ticket data to find userId
    const ticketSnap = await getDoc(ticketRef);
    if (!ticketSnap.exists()) return;
    const ticketData = ticketSnap.data() as Ticket;
    const userId = ticketData.userId;

    const updates: Record<string, unknown> = {
        status,
        updatedAt: Timestamp.now(),
    };

    if (assignedTo !== undefined) {
        updates.assignedTo = assignedTo;
    }

    await updateDoc(ticketRef, updates);

    // Notify user of status change
    if (userId) {
        await pushNotification(userId, {
            title: `Ticket ${ticketId} Updated`,
            message: `The status of your support ticket has been changed to ${status}.`,
            type: 'system'
        });
    }
}

/**
 * Mark ticket as read
 */
export async function markTicketAsRead(ticketId: string, role: 'admin' | 'user'): Promise<void> {
    const ticketRef = doc(db, 'tickets', ticketId);
    const field = role === 'admin' ? 'unreadByAdmin' : 'unreadByUser';
    await updateDoc(ticketRef, { [field]: false });
}

/**
 * Add a message to a ticket
 */
export async function addMessage(
    ticketId: string,
    data: Omit<Message, 'id' | 'createdAt'>
): Promise<string> {
    const messagesRef = collection(db, 'tickets', ticketId, 'messages');
    const now = Timestamp.now();

    const messageDoc = await addDoc(messagesRef, {
        ...data,
        createdAt: now,
        seen: false,
    });

    // Update ticket timestamps and unread status
    const ticketRef = doc(db, 'tickets', ticketId);
    const isFromAdmin = data.senderRole !== 'customer';
    const unreadField = !isFromAdmin ? 'unreadByAdmin' : 'unreadByUser';

    await updateDoc(ticketRef, {
        lastMessageAt: now,
        updatedAt: now,
        [unreadField]: true,
    });

    // If from admin, notify the user
    if (isFromAdmin) {
        const ticketSnap = await getDoc(ticketRef);
        if (ticketSnap.exists()) {
            const ticketData = ticketSnap.data() as Ticket;
            await pushNotification(ticketData.userId, {
                title: 'New Support Message',
                message: `An agent has replied to your ticket: ${ticketId}`,
                type: 'system'
            });
        }
    }

    return messageDoc.id;
}

/**
 * Get messages for a ticket
 */
export async function getTicketMessages(ticketId: string): Promise<Message[]> {
    const messagesRef = collection(db, 'tickets', ticketId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
    })) as Message[];
}

/**
 * Subscribe to real-time messages
 */
export function subscribeToMessages(
    ticketId: string,
    callback: (messages: Message[]) => void
): () => void {
    const messagesRef = collection(db, 'tickets', ticketId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            createdAt: doc.data().createdAt?.toDate(),
        })) as Message[];
        callback(messages);
    });
}

/**
 * Get unread ticket count (for badges)
 */
export async function getUnreadCount(role: 'admin' | 'user', userId?: string): Promise<number> {
    const ticketsRef = collection(db, 'tickets');
    const field = role === 'admin' ? 'unreadByAdmin' : 'unreadByUser';

    let q;
    if (role === 'user' && userId) {
        q = query(ticketsRef, where('userId', '==', userId), where(field, '==', true));
    } else {
        q = query(ticketsRef, where(field, '==', true), limit(100));
    }

    const snapshot = await getDocs(q);
    return snapshot.size;
}
