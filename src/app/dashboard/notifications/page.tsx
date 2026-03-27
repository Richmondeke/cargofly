"use client";

import React from 'react';
import { useNotifications, Notification } from '@/contexts/NotificationContext';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

const NotificationRow = ({ notification }: { notification: Notification }) => {
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
            variants={fadeInUp}
            className={`p-6 rounded-2xl border transition-all hover:bg-white/5 cursor-pointer ${notification.isRead
                ? 'bg-transparent border-white/5 opacity-70'
                : 'bg-white/5 border-white/10 shadow-lg glow-border'
                }`}
            onClick={() => !notification.isRead && markAsRead(notification.id)}
        >
            <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${colors[notification.type]}`}>
                    <span className="material-symbols-outlined text-[28px]">{icons[notification.type]}</span>
                </div>

                <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                            <h3 className={`text-lg font-medium ${notification.isRead ? 'text-white/80' : 'text-white'}`}>
                                {notification.title}
                            </h3>
                            {!notification.isRead && (
                                <span className="px-2 py-0.5 bg-gold-500 text-navy-900 text-[10px] font-medium rounded uppercase">New</span>
                            )}
                        </div>
                        <span className="text-sm text-white/40 font-medium">
                            {formatTime(notification.timestamp)}
                        </span>
                    </div>
                    <p className="text-white/60 leading-relaxed max-w-4xl">
                        {notification.message}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${colors[notification.type]}`}>
                        {notification.type}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default function NotificationHistoryPage() {
    const { notifications, markAllAsRead, clearAll } = useNotifications();

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="space-y-8"
            >
                {/* Header */}
                <DashboardHeader
                    title="Notification History"
                    subtitle="Keep track of all your shipment updates and system alerts."
                >
                    <div className="flex gap-4">
                        <button
                            onClick={markAllAsRead}
                            className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white text-sm font-medium transition-all border border-slate-200 dark:border-white/10"
                        >
                            Mark All as Read
                        </button>
                        <button
                            onClick={clearAll}
                            className="px-6 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-medium transition-all border border-red-500/20"
                        >
                            Clear All
                        </button>
                    </div>
                </DashboardHeader>

                {/* Content */}
                <div className="space-y-4">
                    {notifications.length > 0 ? (
                        notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).map((n) => (
                            <NotificationRow key={n.id} notification={n} />
                        ))
                    ) : (
                        <div className="py-32 flex flex-col items-center justify-center text-center">
                            <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-5xl text-white/20">notifications_off</span>
                            </div>
                            <h2 className="text-2xl font-medium text-white mb-2">No notifications found</h2>
                            <p className="text-white/40">Your notification history is currently empty.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
