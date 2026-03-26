'use client';

import React from 'react';
import Image from 'next/image';
import TransitionLink from "@/components/TransitionLink";


export default function ABTestB() {
  return (
    <div className="bg-background-light dark:bg-background-dark text-navy-900 dark:text-slate-100 font-display min-h-screen selection:bg-gold-500/30">
      <div className="relative flex h-auto min-screen w-full flex-col overflow-x-hidden">
        {/* Navigation */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-200 dark:border-white/10 px-6 md:px-20 py-4 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md sticky top-0 z-50">
          <TransitionLink href="/" className="flex items-center gap-3">
            <div className="relative w-32 md:w-40 h-10 md:h-12">
              <Image
                src="/logo-dark.png"
                alt="Cargofly"
                fill
                className="object-contain"
                priority
              />
            </div>
          </TransitionLink>
          <div className="hidden md:flex flex-1 justify-center gap-8">
            <TransitionLink className="text-navy-900/70 dark:text-slate-300 text-sm font-medium hover:text-navy-900 dark:hover:text-gold-500 transition-colors" href="/services">Services</TransitionLink>
            <TransitionLink className="text-navy-900/70 dark:text-slate-300 text-sm font-medium hover:text-navy-900 dark:hover:text-gold-500 transition-colors" href="/track">Tracking</TransitionLink>
            <TransitionLink className="text-navy-900/70 dark:text-slate-300 text-sm font-medium hover:text-navy-900 dark:hover:text-gold-500 transition-colors" href="/blog">Blog</TransitionLink>
            <TransitionLink className="text-navy-900/70 dark:text-slate-300 text-sm font-medium hover:text-navy-900 dark:hover:text-gold-500 transition-colors" href="/about">About</TransitionLink>
          </div>
          <div className="flex items-center gap-4">
            <TransitionLink href="/login" className="hidden sm:flex min-w-[100px] cursor-pointer items-center justify-center rounded-xl h-10 px-4 bg-slate-100 dark:bg-white/10 text-navy-900 dark:text-white text-sm font-bold transition-transform active:scale-95 hover:bg-slate-200">
              Sign In
            </TransitionLink>
            <TransitionLink href="/contact" className="hidden sm:flex min-w-[120px] cursor-pointer items-center justify-center rounded-xl h-10 px-4 bg-navy-900 text-white text-sm font-bold transition-transform active:scale-95 hover:bg-navy-800">
              Contact Us
            </TransitionLink>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1">
          <div className="relative bg-motif py-16 md:py-32 px-6">
            <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-8">
              <div className="flex flex-col gap-4 max-w-3xl">
                <h1 className="text-navy-900 dark:text-white text-4xl md:text-6xl font-black leading-tight tracking-tight">
                  Reliable Freight. <br /><span className="text-navy-800 dark:text-gold-500">Real-Time Tracking.</span>
                </h1>
                <p className="text-navy-900/70 dark:text-slate-400 text-base md:text-lg font-normal font-body">
                  Streamlined air cargo solutions for global enterprises with end-to-end visibility and 24/7 dedicated support.
                </p>
              </div>

              {/* Tracking Widget */}
              <div className="w-full max-w-2xl bg-white dark:bg-white/5 backdrop-blur-xl p-2 rounded-2xl shadow-2xl shadow-navy-900/5 border border-slate-200 dark:border-white/10">
                <div className="flex flex-col md:flex-row items-stretch gap-2">
                  <div className="flex flex-1 items-center px-4 py-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-transparent focus-within:border-navy-900/50 transition-all">
                    <span className="material-symbols-outlined text-slate-400 mr-3">search</span>
                    <input className="w-full bg-transparent border-none focus:ring-0 text-navy-900 dark:text-white placeholder:text-slate-400 font-medium text-sm" placeholder="Enter Tracking Number (e.g., AWB-123456)" type="text" />
                  </div>
                  <button className="bg-navy-900 text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-navy-800 transition-colors shadow-lg shadow-navy-900/20 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-xl">location_on</span>
                    Track Shipment
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 min-w-[180px] justify-center rounded-xl h-14 px-6 bg-gold-500 text-navy-900 text-base font-bold transition-all hover:bg-gold-400 active:scale-95 shadow-lg shadow-gold-500/20">
                  <span className="material-symbols-outlined">request_quote</span>
                  Request a Quote
                </button>
              </div>
            </div>
          </div>

          {/* Services Section */}
          <section className="max-w-6xl mx-auto px-6 py-32">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div className="max-w-xl">
                <h2 className="text-navy-900 dark:text-white text-3xl font-bold leading-tight tracking-tight mb-2">Our Specialized Services</h2>
                <p className="text-navy-900/70 dark:text-slate-400 font-body">Expert logistics solutions tailored to your industry's specific demands.</p>
              </div>
              <a className="text-gold-500 font-bold flex items-center gap-1 hover:underline" href="#">
                View all services
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Service Card 1 */}
              <div className="group flex flex-col bg-white dark:bg-white/5 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 hover:shadow-2xl transition-all hover:-translate-y-1">
                <div className="h-48 overflow-hidden relative">
                  <img alt="Air Charter Service" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-75 group-hover:brightness-100" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvlYo-OjOfhicRIA7EIKA-LElAKKzFEiTKB0wAYxCt-Oeh7ye26CIbcnc5HlKazqMMDk8gndzNNGJYGs1m57Z_MwxgNI4mgLQLbN9bv3MhxpmxUpu0AouwbIOSwHd2_opkwAApygW-W2XW90CMUXSkNpQ4b82GRLIcHurjX76KmHAEsxNvVOQmlS7GlKLUUHGj3rfegDhb7Aj96K1bbcY2i573KVSVbSj7iP7NX6qKndZ8GIM6txBKAnAlKO-Creyh_BlUayvTrJjh" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white flex items-center gap-2">
                    <span className="material-symbols-outlined">flight</span>
                    <span className="font-bold">Air Charter</span>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-navy-900/70 dark:text-slate-400 text-sm leading-relaxed font-body">
                    Tailored flight solutions for urgent, oversized, or high-value cargo across the globe with full aircraft control.
                  </p>
                  <button className="mt-4 text-gold-500 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                    Learn More
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                  </button>
                </div>
              </div>
              {/* Service Card 2 */}
              <div className="group flex flex-col bg-white dark:bg-white/5 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 hover:shadow-2xl transition-all hover:-translate-y-1">
                <div className="h-48 overflow-hidden relative">
                  <img alt="Express Cargo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-75 group-hover:brightness-100" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCr6tGTAYO_dgVSX4USIHgX4xQbFNB7cYJi0NNE9oHqGXt-dtoKrlnAGk1zgHt-smnmd-PqkA7EAuWJGE_6zqDViHfgxOca3PFE11uSCfDkkaYikg4imNObeXbWxpbK_X53O9bVmo3DCrjMzx_IB54X9JpWKWO0fwmUXQViq3cIBwheKV0uc3PgSg_tDknedalzqKv9AEH09t05ZLyTG8_gUCCPyocrogty3EY0IqVkpR7vI7boowfkzCoeahleZjSKfy0qblOQw1Yf" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white flex items-center gap-2">
                    <span className="material-symbols-outlined">speed</span>
                    <span className="font-bold">Express Cargo</span>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-navy-900/70 dark:text-slate-400 text-sm leading-relaxed font-body">
                    Time-definite delivery for high-priority shipments with guaranteed transit windows and priority handling.
                  </p>
                  <button className="mt-4 text-gold-500 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                    Learn More
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                  </button>
                </div>
              </div>
              {/* Service Card 3 */}
              <div className="group flex flex-col bg-white dark:bg-white/5 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 hover:shadow-2xl transition-all hover:-translate-y-1">
                <div className="h-48 overflow-hidden relative">
                  <img alt="Specialized Handling" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-75 group-hover:brightness-100" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6GoJivcxBW3dYQAU-aLS7dkceBLrg1KvVCHNY01eWAikZvJ235MeEXRerilzW2_qSUmWRRY0ZdRjNJZSmX-NVgEcNZM5pz-cEcwgj1vJKSUbE4nRM_IXHJPCV5neeTJZ5_H54dTPy8MNcmJwM8atrs3BbrlNxWNdOLy8Ozf6zS2OViSq4wQgJC05UKwD41SK8MM-BsX4rrKJH5GxhRiIo1ZItWt-XXUkuaarH1BovlbTItsPnIPM1zvxQHWRzUCd0Y5iArEc70AUp" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white flex items-center gap-2">
                    <span className="material-symbols-outlined">ac_unit</span>
                    <span className="font-bold">Specialized Handling</span>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-navy-900/70 dark:text-slate-400 text-sm leading-relaxed font-body">
                    Expert care for temperature-controlled, dangerous, or fragile goods with certified handling protocols.
                  </p>
                  <button className="mt-4 text-gold-500 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                    Learn More
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="max-w-4xl mx-auto px-6 py-32 border-t border-slate-200 dark:border-white/10">
            <div className="text-center mb-16">
              <h2 className="text-navy-900 dark:text-white text-3xl font-bold leading-tight tracking-tight mb-4">Frequently Asked Questions</h2>
              <p className="text-navy-900/70 dark:text-slate-400 font-body">Everything you need to know about our global air freight operations.</p>
            </div>
            <div className="space-y-4">
              {/* FAQ Item 1 */}
              <details className="group bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <h3 className="font-bold text-navy-900 dark:text-white pr-4">How do I track my shipment?</h3>
                  <span className="material-symbols-outlined text-gold-500 group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <div className="px-6 pb-6 pt-0 text-navy-900/70 dark:text-slate-400 text-sm leading-relaxed font-body">
                  You can track your shipment in real-time using our digital tracking widget at the top of this page. Simply enter your Air Waybill (AWB) number to see the current status, location, and estimated arrival time of your cargo.
                </div>
              </details>
              {/* FAQ Item 2 */}
              <details className="group bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <h3 className="font-bold text-navy-900 dark:text-white pr-4">What documentation is required?</h3>
                  <span className="material-symbols-outlined text-gold-500 group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <div className="px-6 pb-6 pt-0 text-navy-900/70 dark:text-slate-400 text-sm leading-relaxed font-body">
                  Standard documentation includes the Commercial Invoice, Packing List, and Air Waybill. Depending on the destination and type of goods, you may also need a Certificate of Origin, export licenses, or specific dangerous goods declarations.
                </div>
              </details>
              {/* FAQ Item 3 */}
              <details className="group bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <h3 className="font-bold text-navy-900 dark:text-white pr-4">Do you offer door-to-door delivery?</h3>
                  <span className="material-symbols-outlined text-gold-500 group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <div className="px-6 pb-6 pt-0 text-navy-900/70 dark:text-slate-400 text-sm leading-relaxed font-body">
                  Yes, Cargofly provides comprehensive door-to-door logistics. This includes pickup from your facility, export customs clearance, air transport, import clearance, and final-mile delivery.
                </div>
              </details>
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-navy-900/5 dark:bg-white/5 py-24">
            <div className="max-w-4xl mx-auto px-6 text-center">
              <h3 className="text-navy-900 dark:text-white text-2xl md:text-4xl font-black mb-4">Ready to move your freight?</h3>
              <p className="text-navy-900/70 dark:text-slate-400 mb-8 max-w-lg mx-auto font-body">Get in touch with our logistics experts today for a personalized quote and supply chain consultation.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button className="bg-navy-900 text-white px-10 py-5 rounded-xl font-bold hover:bg-navy-800 transition-all shadow-xl shadow-navy-900/20">Start Shipping Now</button>
                <button className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 px-10 py-5 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-white/20 transition-all text-navy-900 dark:text-white">Talk to an Expert</button>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-navy-900 border-t border-slate-200 dark:border-white/10 pt-24 pb-12 px-6 md:px-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <TransitionLink href="/" className="flex items-center gap-2 mb-6">
                <div className="relative w-24 h-8">
                  <Image
                    src="/logo-dark.png"
                    alt="Cargofly"
                    fill
                    className="object-contain"
                  />
                </div>
              </TransitionLink>
              <p className="text-navy-900/60 dark:text-slate-400 text-sm leading-relaxed font-body">
                Setting the global standard in air cargo logistics with innovative tracking and dedicated professional service.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-navy-900 dark:text-white mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-navy-900/60 dark:text-slate-400 font-body">
                <li><a className="hover:text-gold-500 transition-colors" href="#">About Us</a></li>
                <li><a className="hover:text-gold-500 transition-colors" href="#">Our Network</a></li>
                <li><a className="hover:text-gold-500 transition-colors" href="#">Careers</a></li>
                <li><a className="hover:text-gold-500 transition-colors" href="#">Press Release</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-navy-900 dark:text-white mb-6">Solutions</h4>
              <ul className="space-y-4 text-sm text-navy-900/60 dark:text-slate-400 font-body">
                <li><a className="hover:text-gold-500 transition-colors" href="#">E-commerce Logistics</a></li>
                <li><a className="hover:text-gold-500 transition-colors" href="#">Pharma Express</a></li>
                <li><a className="hover:text-gold-500 transition-colors" href="#">Oversized Cargo</a></li>
                <li><a className="hover:text-gold-500 transition-colors" href="#">Secure Transport</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-navy-900 dark:text-white mb-6">Global Reach</h4>
              <div className="rounded-xl overflow-hidden h-32 w-full bg-slate-100 dark:bg-white/5">
                <div className="w-full h-full opacity-50 bg-[url('https://placeholder.pics/svg/400')] bg-cover"></div>
              </div>
              <p className="text-xs text-navy-900/40 dark:text-slate-500 mt-3 font-body">Connecting 200+ destinations worldwide.</p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto pt-8 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-navy-900/40 dark:text-slate-500 font-body">
            <p>© {new Date().getFullYear()} Cargofly Logistics. All rights reserved.</p>
            <div className="flex gap-6">
              <a className="hover:text-gold-500 transition-colors" href="#">Privacy Policy</a>
              <a className="hover:text-gold-500 transition-colors" href="#">Terms of Service</a>
              <a className="hover:text-gold-500 transition-colors" href="#">Cookie Settings</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
