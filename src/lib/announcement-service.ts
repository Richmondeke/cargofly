/**
 * Announcement Service
 * Handles administrative announcement CRUD operations
 */

import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    deleteDoc,
    onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface Announcement {
    id: string;
    title: string;
    content: string;
    type: 'info' | 'warning' | 'success' | 'urgent';
    active: boolean;
    link?: string;
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
}

export interface CreateAnnouncementData {
    title: string;
    content: string;
    type: Announcement['type'];
    active: boolean;
    link?: string;
    expiresAt?: Date;
}

/**
 * Create a new announcement
 */
export async function createAnnouncement(data: CreateAnnouncementData): Promise<string> {
    const now = Timestamp.now();
    const announcementData = {
        ...data,
        createdAt: now,
        updatedAt: now,
        expiresAt: data.expiresAt ? Timestamp.fromDate(data.expiresAt) : null,
    };

    const docRef = await addDoc(collection(db, 'announcements'), announcementData);
    return docRef.id;
}

/**
 * Get all announcements
 */
export async function getAnnouncements(activeOnly = true): Promise<Announcement[]> {
    const announcementsRef = collection(db, 'announcements');
    let q = query(announcementsRef, orderBy('createdAt', 'desc'));

    if (activeOnly) {
        q = query(announcementsRef, where('active', '==', true), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate(),
    })) as Announcement[];
}

/**
 * Subscribe to active announcements
 */
export function subscribeToAnnouncements(callback: (announcements: Announcement[]) => void): () => void {
    const q = query(
        collection(db, 'announcements'),
        where('active', '==', true),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const announcements = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            expiresAt: doc.data().expiresAt?.toDate(),
        })) as Announcement[];
        callback(announcements);
    });
}

/**
 * Update an announcement
 */
export async function updateAnnouncement(id: string, data: Partial<CreateAnnouncementData>): Promise<void> {
    const announcementRef = doc(db, 'announcements', id);
    const updates: any = {
        ...data,
        updatedAt: Timestamp.now(),
    };

    if (data.expiresAt) {
        updates.expiresAt = Timestamp.fromDate(data.expiresAt);
    }

    await updateDoc(announcementRef, updates);
}

/**
 * Delete an announcement
 */
export async function deleteAnnouncement(id: string): Promise<void> {
    await deleteDoc(doc(db, 'announcements', id));
}
