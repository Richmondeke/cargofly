"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type NotificationType = 'shipment' | 'system' | 'alert';

export interface Notification {
    id: string;
    title: string;
    message: string;
    timestamp: Date;
    type: NotificationType;
    isRead: boolean;
}

interface NotificationContextType {
    notifications: Notification[];
    isSidebarOpen: boolean;
    unreadCount: number;
    toggleSidebar: () => void;
    closeSidebar: () => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        title: 'Shipment Verified',
        message: 'Shipment CF-DPSM8GRD has been verified and is ready for processing.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
        type: 'shipment',
        isRead: false
    },
    {
        id: '2',
        title: 'New Booking',
        message: 'A new booking has been created for your account from Lagos to London.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        type: 'shipment',
        isRead: false
    },
    {
        id: '3',
        title: 'System Update',
        message: 'Cargofly Dashboard version 2.1 is now live with enhanced tracking.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        type: 'system',
        isRead: true
    }
];

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const closeSidebar = () => setIsSidebarOpen(false);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            isSidebarOpen,
            unreadCount,
            toggleSidebar,
            closeSidebar,
            markAsRead,
            markAllAsRead,
            clearAll
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
