"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, Notification } from '@/contexts/NotificationContext';

// Simple formatter if date-fns is not available
const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
};

const NotificationItem = ({ notification }: { notification: Notification }) => {
    const { markAsRead } = useNotifications();

    const icons = {
        shipment: 'local_shipping',
        system: 'settings',
        alert: 'warning'
    };

    const colors = {
        shipment: 'text-blue-500 bg-blue-500/10',
        system: 'text-gold-500 bg-gold-500/10',
        alert: 'text-red-500 bg-red-500/10'
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`p-4 rounded-xl border mb-3 transition-all ${notification.isRead
                ? 'bg-white/5 border-white/5 opacity-60'
                : 'bg-white/10 border-white/10 shadow-lg'
                }`}
            onClick={() => !notification.isRead && markAsRead(notification.id)}
        >
            <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colors[notification.type]}`}>
                    <span className="material-symbols-outlined text-[20px]">{icons[notification.type]}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm font-bold truncate ${notification.isRead ? 'text-white/70' : 'text-white'}`}>
                            {notification.title}
                        </h4>
                        {!notification.isRead && (
                            <span className="w-2 h-2 bg-gold-500 rounded-full flex-shrink-0 ml-2"></span>
                        )}
                    </div>
                    <p className="text-xs text-white/60 line-clamp-2 mb-2 leading-relaxed">
                        {notification.message}
                    </p>
                    <span className="text-[10px] text-white/40 uppercase tracking-wider font-medium">
                        {formatTime(notification.timestamp)}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default function NotificationSidebar() {
    const { isSidebarOpen, closeSidebar, notifications, unreadCount, markAllAsRead, clearAll } = useNotifications();

    return (
        <AnimatePresence>
            {isSidebarOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeSidebar}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-[400px] bg-navy-900 border-l border-white/10 z-[101] flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-display font-bold text-white mb-1">Notifications</h2>
                                <p className="text-xs text-white/50">
                                    You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <button
                                onClick={closeSidebar}
                                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-all"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="px-6 py-4 flex items-center justify-between bg-white/5 border-b border-white/5">
                            <button
                                onClick={markAllAsRead}
                                className="text-xs font-bold text-gold-500 hover:text-gold-400 transition-colors uppercase tracking-wider"
                                disabled={unreadCount === 0}
                            >
                                Mark all as read
                            </button>
                            <button
                                onClick={clearAll}
                                className="text-xs font-bold text-white/40 hover:text-white/60 transition-colors uppercase tracking-wider"
                                disabled={notifications.length === 0}
                            >
                                Clear all
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                            <AnimatePresence mode="popLayout">
                                {notifications.length > 0 ? (
                                    notifications.map((n) => (
                                        <NotificationItem key={n.id} notification={n} />
                                    ))
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20"
                                    >
                                        <span className="material-symbols-outlined text-6xl mb-4">notifications_off</span>
                                        <p className="text-sm">No notifications yet</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10 bg-navy-950/50">
                            <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-sm transition-all border border-white/5">
                                View Notification History
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
