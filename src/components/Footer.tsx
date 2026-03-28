"use client";

import TransitionLink from "@/components/TransitionLink";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    MapPin,
    Phone,
    Mail,
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    ArrowRight,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const footerLinks = {
    company: [
        { name: "About", href: "/about" },
        { name: "Staffing", href: "/staffing" },
        { name: "Drivers", href: "/drivers" },
    ],
    resources: [
        { name: "Blog", href: "/blog" },
        { name: "Support", href: "/contact" },
        { name: "Newsletter", href: "/#newsletter" },
    ],
    legal: [
        { name: "Cookie Usage", href: "/cookie-usage" },
        { name: "Privacy Policy", href: "/privacy-policy" },
        { name: "Terms and Conditions", href: "/terms-conditions" },
    ],
};

import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/animations";

export default function Footer({ isLanding }: { isLanding?: boolean }) {
    const { theme } = useTheme();
    return (
        <motion.footer
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className={cn("relative border-t border-white/5 py-16 md:py-40", isLanding ? "bg-transparent" : "bg-navy-900")}
        >
            {/* Background Effects */}
            <div className="absolute inset-0 bg-navy-900 pointer-events-none transition-opacity duration-300" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 border-b border-navy-800/50">
                    {/* Brand Column */}
                    <div className="lg:col-span-4">
                        <TransitionLink href="/" className="mb-6 block">
                            <Image
                                src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
                                alt="Cargofly"
                                width={160}
                                height={40}
                                className="object-contain"
                            />
                        </TransitionLink>
                        <p className="text-[#003399]/70 dark:text-white/60 text-sm font-body mb-8 max-w-sm">
                            The pinnacle of West African aviation logistics. Premium cargo services, real-time tracking, and white-glove delivery.
                        </p>
                        <div className="flex gap-4">
                            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => {
                                const urls = [
                                    "https://facebook.com/cargofly",
                                    "https://twitter.com/cargofly",
                                    "https://instagram.com/cargofly",
                                    "https://linkedin.com/company/cargofly"
                                ];
                                return (
                                    <TransitionLink key={i} href={urls[i]} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gold-500 hover:text-navy-900 transition-all">
                                        <Icon className="w-4 h-4" />
                                    </TransitionLink>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Links Group */}
                    <div className="lg:col-span-5 grid grid-cols-2 md:grid-cols-3 gap-8">
                        <div>
                            <h4 className="font-display text-xs uppercase tracking-widest text-[#003399]/60 mb-spacing-06">Company</h4>
                            <ul className="space-y-3">
                                {footerLinks.company.map((link) => (
                                    <li key={link.name}>
                                        <TransitionLink
                                            href={link.href}
                                            className="text-[#003399] dark:text-white/80 hover:text-blue-500 transition-colors text-sm font-body"
                                        >
                                            {link.name}
                                        </TransitionLink>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-display text-xs uppercase tracking-widest text-[#003399]/60 mb-spacing-06">Resources</h4>
                            <ul className="space-y-3">
                                {footerLinks.resources.map((link) => (
                                    <li key={link.name}>
                                        <TransitionLink
                                            href={link.href}
                                            className="text-[#003399] dark:text-white/80 hover:text-blue-500 transition-colors text-sm font-body"
                                        >
                                            {link.name}
                                        </TransitionLink>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="hidden md:block">
                            <h4 className="font-display text-xs uppercase tracking-widest text-[#003399]/60 mb-spacing-06">Legal</h4>
                            <ul className="space-y-3">
                                {footerLinks.legal.map((link) => (
                                    <li key={link.name}>
                                        <TransitionLink
                                            href={link.href}
                                            className="text-[#003399] dark:text-white/80 hover:text-blue-500 transition-colors text-sm font-body"
                                        >
                                            {link.name}
                                        </TransitionLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Contact Column */}
                    <div className="lg:col-span-3">
                        <h4 className="font-display text-xs uppercase tracking-widest text-[#003399]/60 mb-spacing-06">Contact Us</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-gold-500 mt-1 flex-shrink-0" />
                                <span className="text-[#003399] dark:text-white/80 text-sm font-body">
                                    Aviation Estate, Murtala Muhammed International Airport, Lagos, Nigeria
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-gold-500 flex-shrink-0" />
                                <span className="text-[#003399] dark:text-white/80 text-sm font-body">+234 800 CARGOFLY</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-gold-500 flex-shrink-0" />
                                <span className="text-[#003399] dark:text-white/80 text-sm font-body">info@cargofly.caverton.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="py-spacing-07 border-t border-navy-900/10 flex flex-col md:flex-row items-center justify-between gap-spacing-05">
                    <p className="text-[#003399]/60 text-xs font-body">
                        (c) Cargofly, 2026
                    </p>
                </div>
            </div>

            {/* Animated Iconmark */}
            <motion.div
                className="absolute bottom-20 right-10 pointer-events-none hidden lg:block"
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
                <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center">
                    <Image
                        src="/images/iconmark-blue.png"
                        alt="Cargofly"
                        width={80}
                        height={80}
                        className="object-contain opacity-80"
                    />
                </div>
            </motion.div>
        </motion.footer>
    );
}
