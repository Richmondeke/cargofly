"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    phone?: string;
    company?: string;
    role: "customer" | "admin" | "staff";
    walletBalance: number;
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, displayName: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    refreshBalance: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Create user profile in Firestore
    async function createUserProfile(user: User, displayName?: string) {
        if (!db) {
            console.warn("Firestore not initialized. Skipping profile creation.");
            return null;
        }
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            const profile: UserProfile = {
                uid: user.uid,
                email: user.email || "",
                displayName: displayName || user.displayName || "User",
                role: (["richmondeke@gmail.com", "godliverse@gmail.com", "admin_test_v1@cargofly.com"].includes(user.email || "")) ? "admin" : "customer",
                walletBalance: 0,
            };

            await setDoc(userRef, {
                ...profile,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                savedAddresses: [],
            });

            return profile;
        }

        const data = userSnap.data() as UserProfile;
        const adminEmails = ["richmondeke@gmail.com", "godliverse@gmail.com"];
        if (adminEmails.includes(data.email) && data.role !== "admin") {
            // Auto-fix admin role in Firestore
            try {
                await updateDoc(doc(db, "users", user.uid), {
                    role: "admin",
                    updatedAt: serverTimestamp()
                });
                console.log(`Auto-promoted ${data.email} to admin in Firestore`);
            } catch (err) {
                console.error("Failed to auto-promote admin in Firestore:", err);
            }
            return { ...data, role: "admin" as const };
        }

        return data;
    }

    // Fetch balance from Graph.finance
    async function fetchAndSyncBalance(uid: string) {
        try {
            const resp = await fetch('/api/payments/graph/balance');
            if (resp.ok) {
                const data = await resp.json();
                const balance = data.balance || 0;

                if (!db) return;

                // Update Firestore if balance changed
                const userRef = doc(db, "users", uid);
                await updateDoc(userRef, {
                    walletBalance: balance,
                    updatedAt: serverTimestamp(),
                });

                setUserProfile(prev => prev ? { ...prev, walletBalance: balance } : null);
            }
        } catch (error) {
            console.error("Error fetching Graph.finance balance:", error);
        }
    }

    async function refreshBalance() {
        if (user) {
            await fetchAndSyncBalance(user.uid);
        }
    }

    // Listen for auth state changes
    useEffect(() => {
        if (!auth) {
            console.warn("Firebase Auth not initialized. Auth provider is disabled.");
            setLoading(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);

            if (user) {
                const profile = await createUserProfile(user);
                setUserProfile(profile);

                // Initial balance fetch
                fetchAndSyncBalance(user.uid);

                // Synchronize Firebase auth state with server-side session cookie
                try {
                    const idToken = await user.getIdToken();
                    await fetch('/api/auth/session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ idToken })
                    });
                } catch (error) {
                    console.error("Failed to sync session cookie:", error);
                }
            } else {
                setUserProfile(null);

                // Clear session cookie
                try {
                    await fetch('/api/auth/session', { method: 'DELETE' });
                } catch (error) {
                    console.error("Failed to clear session cookie:", error);
                }
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Sign in with email/password
    async function signIn(email: string, password: string) {
        await signInWithEmailAndPassword(auth, email, password);
    }

    // Sign up with email/password
    async function signUp(email: string, password: string, displayName: string) {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName });
        await createUserProfile(user, displayName);
    }

    // Sign in with Google
    async function signInWithGoogle() {
        const provider = new GoogleAuthProvider();
        const { user } = await signInWithPopup(auth, provider);
        await createUserProfile(user);
    }

    // Sign out
    async function signOut() {
        await firebaseSignOut(auth);
        setUser(null);
        setUserProfile(null);
    }

    // Password Reset
    async function resetPassword(email: string) {
        await sendPasswordResetEmail(auth, email);
    }

    const value: AuthContextType = {
        user,
        userProfile,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
        refreshBalance,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
