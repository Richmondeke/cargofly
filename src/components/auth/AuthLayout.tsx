import { motion } from 'framer-motion';

interface AuthLayoutProps {
    children: React.ReactNode;
    imageSrc?: string;
    title?: string;
    subtitle?: string;
}

export default function AuthLayout({
    children,
    imageSrc = "/images/hero-aircraft.png",
    title,
    subtitle
}: AuthLayoutProps) {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
            <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full max-w-[480px] space-y-8 bg-white dark:bg-slate-900 p-10 rounded-2xl shadow-xl shadow-navy/5 border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-500"
            >
                {children}
            </motion.div>
        </div>
    );
}
