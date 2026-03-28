import { useState } from "react";
import { motion } from "framer-motion";
import { Send, ShieldCheck, Mail, Loader2 } from "lucide-react";
import { subscribeToNewsletter } from "@/lib/newsletter-service";
import { toast } from "react-hot-toast";

export default function Newsletter() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            const result = await subscribeToNewsletter(email);
            if (result.success) {
                toast.success(result.message, {
                    style: {
                        background: '#001A4D',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }
                });
                setEmail("");
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="py-24 bg-white px-6">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                    className="relative bg-navy-900 rounded-[3rem] overflow-hidden p-12 md:p-20 text-center"
                >
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] -mr-48 -mt-48" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/10 blur-[100px] -ml-48 -mb-48" />
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('/images/pattern-dots.svg')] bg-[size:20px_20px]" />

                    <div className="relative z-10 max-w-2xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white/80 text-[10px] font-bold uppercase tracking-[0.2em] mb-10"
                        >
                            <Mail className="w-3.5 h-3.5" />
                            Technical Briefing
                        </motion.div>

                        <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tighter mb-8 leading-[0.9]">
                            Subscribe to <span className="text-blue-400">Market Intelligence</span>
                        </h2>

                        <p className="text-lg md:text-xl text-white/50 mb-12 font-medium leading-relaxed">
                            Receive real-time updates on global logistics corridors, regulatory changes, and technical operational improvements.
                        </p>

                        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 mb-8">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter corporate email address"
                                required
                                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors font-medium"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        Processing <Loader2 className="w-4 h-4 animate-spin" />
                                    </>
                                ) : (
                                    <>
                                        Secure Access <Send className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="flex items-center justify-center gap-2 text-white/30 text-xs font-bold uppercase tracking-widest">
                            <ShieldCheck className="w-4 h-4 text-blue-400" />
                            256-Bit Data Protection Guaranteed
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
