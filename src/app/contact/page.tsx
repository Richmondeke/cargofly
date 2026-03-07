"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    MapPin,
    Phone,
    Mail,
    Clock,
    Send,
    Loader2,
    MessageSquare,
    Globe,
    ChevronDown,
    Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeInUp, fadeInLeft, fadeInRight } from "@/lib/animations";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";

const locations = [
    {
        city: "Lagos, Nigeria",
        address: "Murtala Muhammed International Airport, Ikeja",
        phone: "+234 1 279 9999",
        email: "lagos@cargofly.com",
        hours: "24/7 Operations",
    },
    {
        city: "London, UK",
        address: "Heathrow Cargo Centre, Hounslow",
        phone: "+44 20 8759 1234",
        email: "london@cargofly.com",
        hours: "08:00 - 20:00 GMT",
    },
    {
        city: "Dubai, UAE",
        address: "Dubai Logistics City, DWC",
        phone: "+971 4 887 1234",
        email: "dubai@cargofly.com",
        hours: "24/7 Operations",
    },
];

const faqs = [
    {
        question: "What types of shipping services does Cargofly offer?",
        answer: "We offer per-pound cargo, Express for dedicated aircraft and flexible scheduling, and courier services for urgent documents and small packages. We also handle special cargo such as live animals, healthcare products, and fresh goods."
    },
    {
        question: "How are freight charges determined?",
        answer: "Pricing is based on a combination of weight and dimensions. Exact charges are determined when the shipment is tendered. Minimum fees and dimensional weight rules apply."
    },
    {
        question: "When do I need to pay for my shipment?",
        answer: "All shipments must be paid in full before departing from the origin facility. Please note that a 3% processing fee applies to credit card payments, while debit cards are exempt."
    },
    {
        question: "What are the requirements for picking up shipments?",
        answer: "Major shipments must be picked up within 48 hours of arrival at our neighbor island facilities to avoid storage fees."
    },
    {
        question: "Do you partner with major retailers?",
        answer: "Yes, we partner with major retailers like Home Depot and Lowe's for inter-island shipping. Through our retail partnerships, we also facilitate shopping from Oʻahu retailers like Costco, Sam's Club, Target, and Walmart."
    },
    {
        question: "Can you handle perishable or special items?",
        answer: "Yes, we handle fresh, refrigerated, and frozen items with temperature-controlled handling. We also offer expert transportation for live animals, ensuring their safety and well-being."
    }
];

export default function ContactPage() {
    const [activeFaq, setActiveFaq] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "general",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setIsSubmitting(false);
        setIsSuccess(true);
        setFormData({ name: "", email: "", subject: "general", message: "" });
        setTimeout(() => setIsSuccess(false), 5000);
    };

    return (
        <div className="min-h-screen pt-32 pb-24 bg-white dark:bg-navy-900 transition-colors duration-500">
            {/* Background */}
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
                    <span className="inline-block py-1 px-3 rounded-full bg-gold-500/10 text-gold-400 text-xs font-bold tracking-[0.2em] uppercase mb-6 font-body">
                        Contact Us
                    </span>
                    <h1 className="font-display text-4xl md:text-5xl text-navy-900 dark:text-white mb-4">
                        Get in
                        <span className="block italic text-navy-900/80 dark:text-white/80">Touch</span>
                    </h1>
                    <p className="text-navy-900/60 dark:text-white/60 max-w-xl mx-auto font-body">
                        Our dedicated team is here to assist you 24/7. Reach out for quotes,
                        support, or general inquiries.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-16 mb-24">
                    {/* Contact Form */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInLeft}
                    >
                        <div className="glass-panel p-8 md:p-10">
                            <h2 className="font-display text-2xl text-white mb-6">
                                Send us a message
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <Label htmlFor="name" className="text-white/40">
                                            Your Name
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, name: e.target.value })
                                            }
                                            placeholder="John Doe"
                                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-gold-500/50 dark:bg-white/5 dark:border-white/10 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="email" className="text-white/40">
                                            Email Address
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) =>
                                                setFormData({ ...formData, email: e.target.value })
                                            }
                                            placeholder="john@example.com"
                                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-gold-500/50 dark:bg-white/5 dark:border-white/10 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="subject" className="text-white/40">
                                        Subject
                                    </Label>
                                    <Select
                                        id="subject"
                                        value={formData.subject}
                                        onChange={(e) =>
                                            setFormData({ ...formData, subject: e.target.value })
                                        }
                                        className="bg-white/5 border-white/10 text-white focus:border-gold-500/50 dark:bg-white/5 dark:border-white/10 dark:text-white"
                                    >
                                        <option value="general" className="bg-navy-900 text-white">General Inquiry</option>
                                        <option value="quote" className="bg-navy-900 text-white">Request a Quote</option>
                                        <option value="support" className="bg-navy-900 text-white">Shipment Support</option>
                                        <option value="careers" className="bg-navy-900 text-white">Careers</option>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="message" className="text-white/40">
                                        Message
                                    </Label>
                                    <Textarea
                                        id="message"
                                        required
                                        rows={5}
                                        value={formData.message}
                                        onChange={(e) =>
                                            setFormData({ ...formData, message: e.target.value })
                                        }
                                        placeholder="How can we help you today?"
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-gold-500/50 dark:bg-white/5 dark:border-white/10 dark:text-white resize-none"
                                    />
                                </div>

                                <motion.button
                                    type="submit"
                                    disabled={isSubmitting}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={cn(
                                        "w-full py-4 rounded-xl bg-gold-500 text-navy-900 font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                                        isSubmitting
                                            ? "opacity-70 cursor-not-allowed"
                                            : "hover:shadow-[0_0_30px_rgba(202,138,4,0.3)]"
                                    )}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Sending...
                                        </>
                                    ) : isSuccess ? (
                                        <>
                                            <div className="w-5 h-5 bg-navy-900 rounded-full flex items-center justify-center">
                                                <Check className="w-3 h-3 text-gold-500" />
                                            </div>
                                            Message Sent!
                                        </>
                                    ) : (
                                        <>
                                            Send Message
                                            <Send className="w-4 h-4" />
                                        </>
                                    )}
                                </motion.button>
                            </form>
                        </div>
                    </motion.div>

                    {/* Contact Info & Locations */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInRight}
                        className="space-y-8"
                    >
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                <div className="w-12 h-12 rounded-xl bg-gold-500/20 flex items-center justify-center mb-4">
                                    <Phone className="w-5 h-5 text-gold-400" />
                                </div>
                                <h3 className="font-display text-lg text-white mb-1">
                                    Call Us
                                </h3>
                                <p className="text-white/60 text-sm font-body">
                                    +234 1 279 9999
                                </p>
                                <p className="text-white/40 text-xs mt-1 font-body">
                                    Mon-Fri, 8am-6pm WAT
                                </p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                <div className="w-12 h-12 rounded-xl bg-gold-500/20 flex items-center justify-center mb-4">
                                    <Mail className="w-5 h-5 text-gold-400" />
                                </div>
                                <h3 className="font-display text-lg text-white mb-1">
                                    Email Us
                                </h3>
                                <p className="text-white/60 text-sm font-body">
                                    concierge@cargofly.com
                                </p>
                                <p className="text-white/40 text-xs mt-1 font-body">
                                    Response within 2 hours
                                </p>
                            </div>
                        </div>

                        <div className="glass-panel p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <Globe className="w-5 h-5 text-gold-400" />
                                <h3 className="font-display text-xl text-white">
                                    Our Global Hubs
                                </h3>
                            </div>
                            <div className="space-y-6">
                                {locations.map((location, index) => (
                                    <div
                                        key={index}
                                        className="flex gap-4 pb-6 last:pb-0 border-b border-white/10 last:border-0"
                                    >
                                        <div className="mt-1">
                                            <MapPin className="w-5 h-5 text-white/30" />
                                        </div>
                                        <div>
                                            <h4 className="font-display text-lg text-white mb-1">
                                                {location.city}
                                            </h4>
                                            <p className="text-white/60 text-sm font-body mb-2">
                                                {location.address}
                                            </p>
                                            <div className="flex flex-wrap gap-4 text-xs text-white/40 font-body">
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {location.phone}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {location.email}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {location.hours}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* FAQ Section */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    className="max-w-3xl mx-auto"
                >
                    <div className="text-center mb-12">
                        <h2 className="font-display text-3xl text-white mb-4">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-white/60 font-body">
                            Common questions about our services and shipping process.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className="glass-panel overflow-hidden transition-all duration-300"
                            >
                                <button
                                    onClick={() =>
                                        setActiveFaq(activeFaq === faq.question ? null : faq.question)
                                    }
                                    className="w-full flex items-center justify-between p-6 text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                            <MessageSquare className="w-4 h-4 text-gold-400" />
                                        </div>
                                        <span className="font-display text-lg text-white">
                                            {faq.question}
                                        </span>
                                    </div>
                                    <ChevronDown
                                        className={cn(
                                            "w-5 h-5 text-white/40 transition-transform duration-300",
                                            activeFaq === faq.question ? "rotate-180" : ""
                                        )}
                                    />
                                </button>
                                <div
                                    className={cn(
                                        "px-6 transition-all duration-300 overflow-hidden font-body text-white/60 leading-relaxed",
                                        activeFaq === faq.question
                                            ? "max-h-40 pb-6 opacity-100"
                                            : "max-h-0 opacity-0"
                                    )}
                                >
                                    <p className="pl-12">{faq.answer}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
