/**
 * Blog Service
 * Handles blog post CRUD operations
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
    deleteDoc,
    limit
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface BlogPost {
    id?: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    image: string;
    author: string;
    category: string;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
}

export interface CreateBlogPostData {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    image: string;
    author: string;
    category: string;
    isPublished: boolean;
}

/**
 * Create a new blog post
 */
export async function createBlogPost(data: CreateBlogPostData): Promise<string> {
    const now = Timestamp.now();
    const blogData = {
        ...data,
        createdAt: now,
        updatedAt: now,
        publishedAt: data.isPublished ? now : null,
    };

    const docRef = await addDoc(collection(db, 'blogs'), blogData);
    return docRef.id;
}

/**
 * Get all blog posts (public)
 */
export async function getBlogPosts(publishedOnly = true): Promise<BlogPost[]> {
    const blogsRef = collection(db, 'blogs');
    let q = query(blogsRef, orderBy('createdAt', 'desc'));

    if (publishedOnly) {
        q = query(blogsRef, where('isPublished', '==', true), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        publishedAt: doc.data().publishedAt?.toDate(),
    })) as BlogPost[];
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const blogsRef = collection(db, 'blogs');
    const q = query(blogsRef, where('slug', '==', slug), limit(1));

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        publishedAt: data.publishedAt?.toDate(),
    } as BlogPost;
}

/**
 * Update a blog post
 */
export async function updateBlogPost(id: string, data: Partial<CreateBlogPostData>): Promise<void> {
    const blogRef = doc(db, 'blogs', id);
    const updates: any = {
        ...data,
        updatedAt: Timestamp.now(),
    };

    if (data.isPublished === true) {
        // We could check if it was already published, but for simplicity:
        updates.publishedAt = Timestamp.now();
    }

    await updateDoc(blogRef, updates);
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(id: string): Promise<void> {
    await deleteDoc(doc(db, 'blogs', id));
}
