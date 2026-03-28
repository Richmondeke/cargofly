import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Notification Service
 * Handles all notification channels: Email (Resend), SMS (Twilio), Push (FCM)
 */

// Email notification types
export interface EmailNotification {
    to: string;
    subject: string;
    template: 'shipment_update' | 'shipment_delivered' | 'payment_received' | 'welcome';
    data: Record<string, string | number>;
}

// SMS notification types
export interface SMSNotification {
    to: string; // Phone number in E.164 format
    message: string;
    type: 'critical' | 'update';
}

// Push notification types
export interface PushNotification {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, string>;
    icon?: string;
}

// Notification preferences from user settings
export interface NotificationPreferences {
    email: boolean;
    sms: boolean;
    push: boolean;
}

/**
 * Send email notification via Resend API
 */
export async function sendEmail(notification: EmailNotification): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch('/api/notifications/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notification),
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Send SMS notification via Twilio API
 */
export async function sendSMS(notification: SMSNotification): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch('/api/notifications/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notification),
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Failed to send SMS:', error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Shipment status change notification
 * Sends notifications based on user preferences
 */
export async function notifyShipmentUpdate(
    userId: string,
    preferences: NotificationPreferences,
    shipmentId: string,
    status: string,
    userEmail: string,
    userPhone?: string,
): Promise<void> {
    const promises: Promise<unknown>[] = [];

    // Email notification
    if (preferences.email && userEmail) {
        promises.push(
            sendEmail({
                to: userEmail,
                subject: `Shipment ${shipmentId} - ${status}`,
                template: status === 'Delivered' ? 'shipment_delivered' : 'shipment_update',
                data: {
                    shipmentId,
                    status,
                    timestamp: new Date().toISOString(),
                },
            })
        );
    }

    // SMS notification (only for critical updates)
    if (preferences.sms && userPhone && ['Delivered', 'Customs Hold', 'Delayed'].includes(status)) {
        promises.push(
            sendSMS({
                to: userPhone,
                message: `Cargofly: Shipment ${shipmentId} is now ${status}`,
                type: 'critical',
            })
        );
    }

    // Push notification is handled separately via FCM Cloud Functions

    await Promise.allSettled(promises);
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneE164(phone: string, countryCode = '+234'): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // If already has country code
    if (phone.startsWith('+')) {
        return '+' + digits;
    }

    // Remove leading 0 if present and add country code
    const cleaned = digits.startsWith('0') ? digits.slice(1) : digits;
    return countryCode + cleaned;
}

/**
 * Push an in-app notification to Firestore
 */
export async function pushNotification(
    userId: string,
    notification: {
        title: string;
        message: string;
        type: 'shipment' | 'system' | 'alert';
        timestamp?: Timestamp | null;
    }
): Promise<void> {
    try {
        await addDoc(collection(db, 'users', userId, 'notifications'), {
            ...notification,
            isRead: false,
            userId,
            timestamp: notification.timestamp ?? serverTimestamp(),
        });
    } catch (e) {
        console.error('Failed to push notification:', e);
    }
}

/**
 * Validate phone number
 */
export function isValidPhone(phone: string): boolean {
    const e164 = formatPhoneE164(phone);
    // E.164 format: + followed by 10-15 digits
    return /^\+[1-9]\d{9,14}$/.test(e164);
}
