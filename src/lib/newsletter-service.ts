import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export interface NewsletterSubscription {
    id?: string;
    email: string;
    subscribedAt: any;
    status: "active" | "unsubscribed";
}

/**
 * Subscribe a new email to the newsletter
 */
export async function subscribeToNewsletter(email: string): Promise<{ success: boolean; message: string }> {
    try {
        // Check if already exists
        const q = query(collection(db, "newsletter"), where("email", "==", email.toLowerCase()));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            return { success: false, message: "This email is already subscribed." };
        }

        // Add new subscription
        await addDoc(collection(db, "newsletter"), {
            email: email.toLowerCase(),
            subscribedAt: serverTimestamp(),
            status: "active"
        });

        return { success: true, message: "Successfully subscribed!" };
    } catch (error) {
        console.error("Newsletter subscription error:", error);
        return { success: false, message: "An error occurred. Please try again later." };
    }
}
