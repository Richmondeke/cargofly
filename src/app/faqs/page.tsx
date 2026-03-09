"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    ChevronDown,
    MessageSquare,
    Package,
    CreditCard,
    ShieldCheck,
    Truck,
    HelpCircle,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { Input } from "@/components/ui/Input";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";

const categories = [
    { id: "all", name: "All Questions", icon: HelpCircle },
    { id: "shipping", name: "Shipping", icon: Truck },
    { id: "billing", name: "Billing & Rates", icon: CreditCard },
    { id: "services", name: "Services", icon: Package },
    { id: "safety", name: "Safety & Rules", icon: ShieldCheck },
];

const faqs = [
    {
        category: "services",
        question: "What types of shipping services does Cargofly offer?",
        answer: "We offer per-pound cargo, Express for dedicated aircraft and flexible scheduling, and courier services for urgent documents and small packages. We also handle special cargo such as live animals, healthcare products, and fresh goods."
    },
    {
        category: "billing",
        question: "How are freight charges determined?",
        answer: "Pricing is based on a combination of weight and dimensions. Exact charges are determined when the shipment is tendered. Minimum fees and dimensional weight rules apply."
    },
    {
        category: "billing",
        question: "When do I need to pay for my shipment?",
        answer: "All shipments must be paid in full before departing from the origin facility. Please note that a 3% processing fee applies to credit card payments, while debit cards are exempt."
    },
    {
        category: "shipping",
        question: "What are the requirements for picking up shipments?",
        answer: "Major shipments must be picked up within 48 hours of arrival at our neighbor island facilities to avoid storage fees."
    },
    {
        category: "services",
        question: "Do you partner with major retailers?",
        answer: "Yes, we partner with major retailers like Home Depot and Lowe's for inter-island shipping. Through our retail partnerships, we also facilitate shopping from Oʻahu retailers like Costco, Sam's Club, Target, and Walmart."
    },
    {
        category: "safety",
        question: "Can you handle perishable or special items?",
        answer: "Yes, we handle fresh, refrigerated, and frozen items with temperature-controlled handling. We also offer expert transportation for live animals, ensuring their safety and well-being."
    },
    {
        category: "safety",
        question: "Are there restricted items I cannot ship?",
        answer: "Yes, we comply with all aviation security regulations. Hazardous materials, explosives, and certain lithium batteries require special handling and documentation (MSDS). Please contact our dangerous goods team for specific inquiries."
    },
    {
        category: "shipping",
        question: "Can I track my shipment in real-time?",
        answer: "Absolutely. Once your shipment is booked, you will receive a tracking number. Use our 'Track' page to see real-time status updates from origin to final destination."
    },
];

export default function FAQsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const filteredFaqs = useMemo(() => {
        return faqs.filter((faq) => {
            const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
            const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [searchQuery, activeCategory]);

    return (
        <div className="min-h-screen pt-32 pb-24 bg-white dark:bg-navy-900 transition-colors duration-500 overflow-x-hidden">
            {/* Premium Background Elements */}
            <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-100 via-white to-gray-50 dark:from-navy-800 dark:via-navy-900 dark:to-black" />
            <div className="fixed inset-0 z-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] dark:invert" />

            <div className="container mx-auto px-6 relative z-10">
                {/* Header */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeInUp}
                    className="text-center mb-16"
                >
                    <span className="inline-block py-1 px-3 rounded-full bg-gold-500/10 text-gold-500 dark:text-gold-400 text-xs font-bold tracking-[0.2em] uppercase mb-6 font-body">
                        Help Center
                    </span>
                    <h1 className="font-display text-4xl md:text-6xl text-navy-900 dark:text-white mb-6">
                        Frequently Asked
                        <span className="block italic text-navy-900/80 dark:text-white/80">Questions</span>
                    </h1>
                    <p className="text-navy-900/60 dark:text-white/60 max-w-2xl mx-auto font-body text-lg">
                        Find everything you need to know about shipping with Cargofly.
                        Search our knowledge base or browse by category.
                    </p>
                </motion.div>

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-2xl mx-auto mb-12"
                >
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gold-500/20 blur-xl rounded-2xl group-hover:bg-gold-500/30 transition-all opacity-0 group-focus-within:opacity-100" />
                        <div className="relative flex items-center bg-white/40 dark:bg-white/5 backdrop-blur-md border border-navy-900/10 dark:border-white/10 rounded-2xl px-6 py-4 transition-all focus-within:border-gold-500/50">
                            <Search className="w-5 h-5 text-navy-900/40 dark:text-white/40 mr-4" />
                            <input
                                type="text"
                                placeholder="Search for answers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent border-none focus:ring-0 text-navy-900 dark:text-white placeholder:text-navy-900/30 dark:placeholder:text-white/30 font-body"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="p-1 hover:bg-navy-900/5 dark:hover:bg-white/5 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4 text-navy-900/40 dark:text-white/40" />
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Categories */}
                <div className="flex justify-center mb-16">
                    <DashboardTabs
                        tabs={categories.map(cat => ({
                            id: cat.id,
                            label: cat.name,
                            icon: cat.icon
                        }))}
                        activeTab={activeCategory}
                        onTabChange={(id) => {
                            setActiveCategory(id);
                            setOpenIndex(null);
                        }}
                    />
                </div>

                {/* FAQ List */}
                <div className="max-w-3xl mx-auto">
                    <AnimatePresence mode="wait">
                        {filteredFaqs.length > 0 ? (
                            <motion.div
                                key={activeCategory + searchQuery}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4"
                            >
                                {filteredFaqs.map((faq, index) => (
                                    <motion.div
                                        key={faq.question}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={cn(
                                            "group p-1 rounded-2xl transition-all duration-300 bg-white/40 dark:bg-white/5 border border-navy-900/5 dark:border-white/5 hover:border-gold-500/30",
                                            openIndex === index ? "shadow-2xl ring-1 ring-gold-500/20" : "hover:bg-white/60 dark:hover:bg-white/10"
                                        )}
                                    >
                                        <button
                                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                            className="w-full flex items-center justify-between p-5 text-left"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                                    openIndex === index ? "bg-gold-500/20 text-gold-500" : "bg-navy-900/5 dark:bg-white/5 text-navy-900/40 dark:text-white/40 group-hover:bg-gold-500/10"
                                                )}>
                                                    <MessageSquare className="w-5 h-5" />
                                                </div>
                                                <span className="font-display text-lg md:text-xl text-navy-900 dark:text-white group-hover:text-gold-500 transition-colors">
                                                    {faq.question}
                                                </span>
                                            </div>
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                                openIndex === index ? "bg-gold-500 text-navy-900 rotate-180" : "bg-navy-900/5 dark:bg-white/5 text-navy-900/40 dark:text-white/40"
                                            )}>
                                                <ChevronDown className="w-4 h-4" />
                                            </div>
                                        </button>
                                        <AnimatePresence>
                                            {openIndex === index && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-5 pb-6 pt-2 pl-16 font-body text-navy-900/70 dark:text-white/70 leading-relaxed text-lg whitespace-pre-wrap">
                                                        {faq.answer}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-20"
                            >
                                <div className="w-20 h-20 bg-navy-900/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <HelpCircle className="w-10 h-10 text-navy-900/20 dark:text-white/20" />
                                </div>
                                <h3 className="font-display text-2xl text-navy-900 dark:text-white mb-2">No results found</h3>
                                <p className="text-navy-900/40 dark:text-white/40 font-body">
                                    We couldn't find any FAQs matching your search.
                                    Try different keywords or contact us directly.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-24 text-center"
                >
                    <div className="bg-navy-900 dark:bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 md:p-16 relative overflow-hidden group">
                        {/* Decorative gradients */}
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gold-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        <h2 className="font-display text-3xl md:text-4xl text-white mb-6 relative z-10">
                            Still have <span className="italic">questions?</span>
                        </h2>
                        <p className="text-white/60 mb-10 max-w-xl mx-auto font-body text-lg relative z-10">
                            Can't find what you're looking for? Our support team is ready to help you with any specific inquiries.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                            <button className="bg-gold-500 text-navy-900 px-8 py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-gold-400 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                                Contact Support
                            </button>
                            <button className="bg-white/10 text-white border border-white/10 px-8 py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-white/20 transition-all duration-300">
                                Send an Email
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
