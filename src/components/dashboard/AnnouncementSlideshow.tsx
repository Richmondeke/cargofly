"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Info,
    AlertTriangle,
    CheckCircle2,
    Zap,
    ChevronLeft,
    ChevronRight,
    ExternalLink
} from "lucide-react";
import { Announcement, subscribeToAnnouncements } from "@/lib/announcement-service";

export default function AnnouncementSlideshow() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToAnnouncements((data) => {
            setAnnouncements(data);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (announcements.length <= 1 || isHovered) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % announcements.length);
        }, 8000);

        return () => clearInterval(timer);
    }, [announcements.length, isHovered]);

    if (announcements.length === 0) return null;

    const current = announcements[currentIndex];

    const getTypeStyles = (type: Announcement['type']) => {
        switch (type) {
            case 'urgent':
                return {
                    bg: "bg-red-500/10",
                    border: "border-red-500/20",
                    icon: <Zap className="w-5 h-5 text-red-500" />,
                    text: "text-red-700",
                    label: "Urgent Update"
                };
            case 'warning':
                return {
                    bg: "bg-amber-500/10",
                    border: "border-amber-500/20",
                    icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
                    text: "text-amber-700",
                    label: "Action Required"
                };
            case 'success':
                return {
                    bg: "bg-emerald-500/10",
                    border: "border-emerald-500/20",
                    icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
                    text: "text-emerald-700",
                    label: "System Status"
                };
            default:
                return {
                    bg: "bg-blue-500/10",
                    border: "border-blue-500/20",
                    icon: <Info className="w-5 h-5 text-blue-500" />,
                    text: "text-blue-700",
                    label: "Information"
                };
        }
    };

    const styles = getTypeStyles(current.type);

    return (
        <div
            className="mb-8"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`relative overflow-hidden rounded-3xl border ${styles.border} ${styles.bg} p-6 md:p-8 transition-colors duration-500`}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                    >
                        <div className="flex items-start gap-4">
                            <div className="mt-1 p-2 bg-white rounded-xl shadow-sm">
                                {styles.icon}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${styles.text}`}>
                                        {styles.label}
                                    </span>
                                    {announcements.length > 1 && (
                                        <span className="text-[10px] font-medium text-gray-400">
                                            {currentIndex + 1} of {announcements.length}
                                        </span>
                                    )}
                                </div>
                                <h3 className={`text-xl font-bold mb-2 ${styles.text}`}>
                                    {current.title}
                                </h3>
                                <p className="text-gray-600 font-medium leading-relaxed max-w-2xl">
                                    {current.content}
                                </p>
                            </div>
                        </div>

                        {current.link && (
                            <a
                                href={current.link}
                                className={`shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg active:scale-95 ${current.type === 'urgent' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' :
                                        current.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' :
                                            current.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' :
                                                'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                                    }`}
                            >
                                Learn More
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Progress Bar */}
                {announcements.length > 1 && !isHovered && (
                    <div className="absolute bottom-0 left-0 h-1 bg-black/5 w-full">
                        <motion.div
                            key={currentIndex}
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 8, ease: "linear" }}
                            className={`h-full ${current.type === 'urgent' ? 'bg-red-500' :
                                    current.type === 'warning' ? 'bg-amber-500' :
                                        current.type === 'success' ? 'bg-emerald-500' :
                                            'bg-blue-500'
                                }`}
                        />
                    </div>
                )}

                {/* Navigation Controls */}
                {announcements.length > 1 && (
                    <div className="absolute top-6 right-6 flex items-center gap-2">
                        <button
                            onClick={() => setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length)}
                            className="p-1.5 hover:bg-white/50 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setCurrentIndex((prev) => (prev + 1) % announcements.length)}
                            className="p-1.5 hover:bg-white/50 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
