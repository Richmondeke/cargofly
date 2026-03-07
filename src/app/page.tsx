'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Globe, Headset, Users, CheckCircle, Search, ArrowRight, Plane, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ExitIntentModal from '@/components/common/ExitIntentModal';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const FeatureCard = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
  <motion.div
    variants={fadeUp}
    whileHover={{ y: -8, scale: 1.02 }}
    transition={{ type: "spring", stiffness: 400, damping: 10 }}
    className="bg-slate-50 dark:bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none transition-all duration-300 cursor-default"
  >
    <div className="w-16 h-16 bg-navy-900/10 dark:bg-white/10 text-navy-900 dark:text-white rounded-2xl flex items-center justify-center mb-6 group-hover:bg-gold-500/20 group-hover:text-gold-500 transition-colors">
      <span className="material-symbols-outlined text-3xl">{icon}</span>
    </div>
    <h3 className="text-xl font-bold mb-4 text-navy-900 dark:text-white">{title}</h3>
    <p className="text-navy-900/70 dark:text-white/70 leading-relaxed font-body text-sm">
      {description}
    </p>
  </motion.div>
);

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'track' | 'book'>('track');

  // Form state
  const [trackingNumber, setTrackingNumber] = useState('');
  const [bookingData, setBookingData] = useState({
    origin: '',
    destination: '',
    cargoType: 'General Cargo'
  });

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = trackingNumber.trim();
    if (!cleanId) {
      alert("Please enter a tracking number");
      return;
    }
    router.push(`/track?id=${encodeURIComponent(cleanId)}`);
  };

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams({
      origin: bookingData.origin,
      destination: bookingData.destination,
      cargoType: bookingData.cargoType
    }).toString();

    const targetPath = `/dashboard/new-booking?${query}`;

    if (user) {
      router.push(targetPath);
    } else {
      router.push(`/login?redirect=${encodeURIComponent(targetPath)}`);
    }
  };

  return (
    <div className="font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200 bg-white dark:bg-navy-900 relative">
      <div className="absolute inset-0 bg-motif opacity-0 dark:opacity-30 pointer-events-none" />
      <div className="relative z-10 w-full">
        <style dangerouslySetInnerHTML={{
          __html: `
        .map-bg { background-image: url(https://lh3.googleusercontent.com/aida-public/AB6AXuBnaIoJae5Y4Txk2M8oRiE3bDMfJilHlHgWQd_LVWXbGItQc8BUTc0ydpnacqerpR-AHc17_dQedWKvY74ZbncbnAx2x2GZ3hDSUaNumgdhN0xTHwZUbod7ZPdeBJCI1rcAIqJfp5hsUi0ZoBDfTstusxEXCn0Qs0lBz811Y1jO1rTD90I-dbJLPJeP4rFwJgeA9nk5uqft-gRA-PBbS0iSGY3ZLS0JroDs2yAoxA3fX-L-N1S03XamP9HNJM3SVc-YWCFHRTQT8KN0); background-size: cover; background-position: center; opacity: 0; transition: opacity 0.3s ease; display: none; }
        .dark .map-bg { opacity: 0.15; display: block; }
      `}} />

        <header className="relative pt-32 pb-20 md:pt-48 md:pb-40 overflow-hidden bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h1 className="text-5xl md:text-7xl font-bold text-navy-900 dark:text-white mb-6 tracking-tight">
                Global Logistics, <span className="text-gold-500">Simplified.</span>
              </h1>
              <p className="text-lg md:text-xl text-navy-900/70 dark:text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed font-body">
                Track your shipments in real-time or book freight across oceans, skies, and roads with a single click.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-4xl mx-auto bg-slate-50/80 dark:bg-navy-900/40 backdrop-blur-3xl rounded-[32px] shadow-2xl p-4 md:p-6 border border-slate-200 dark:border-white/10" id="action-tabs"
            >
              <div className="flex bg-slate-200/50 dark:bg-navy-900/30 backdrop-blur-md rounded-2xl p-1 relative overflow-hidden w-fit mx-auto shadow-sm border border-slate-200 dark:border-white/10 mb-6">
                <button
                  className={"px-8 py-3 text-sm font-bold tracking-wide uppercase transition-all duration-300 min-w-[180px] rounded-xl flex items-center justify-center gap-2 " + (activeTab === 'track' ? 'bg-white text-navy-900 shadow-md' : 'text-navy-900/70 dark:text-white/80 hover:text-navy-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5')}
                  onClick={() => setActiveTab('track')}
                >
                  <span className="material-symbols-outlined text-lg">location_on</span>
                  Track Shipment
                </button>
                <button
                  className={"px-8 py-3 text-sm font-bold tracking-wide uppercase transition-all duration-300 min-w-[180px] rounded-xl flex items-center justify-center gap-2 " + (activeTab === 'book' ? 'bg-white text-navy-900 shadow-md' : 'text-navy-900/70 dark:text-white/80 hover:text-navy-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5')}
                  onClick={() => setActiveTab('book')}
                >
                  <span className="material-symbols-outlined text-lg">local_shipping</span>
                  Book Freight
                </button>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'track' ? (
                  <motion.div
                    key="track"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="px-2 md:px-4 pb-4"
                  >
                    <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4 bg-white p-2 rounded-[24px] shadow-sm">
                      <div className="flex-grow relative flex items-center">
                        <Search className="absolute left-6 text-slate-400 w-5 h-5" />
                        <input
                          className="w-full pl-14 pr-4 py-4 md:py-5 rounded-[20px] bg-transparent border-0 focus:ring-0 text-slate-800 text-lg placeholder:text-slate-400 outline-none"
                          placeholder="Enter Tracking Number (e.g., CF-9283-X1)"
                          type="text"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-gold-500 text-black px-10 py-4 md:py-5 rounded-[20px] font-bold hover:bg-gold-600 transition-colors flex items-center justify-center gap-2 group-btn"
                      >
                        Track Now
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </form>

                  </motion.div>
                ) : (
                  <motion.div
                    key="book"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="px-2 md:px-4 pb-4"
                  >
                    <form onSubmit={handleBook} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-500/5 dark:bg-white/10 p-4 rounded-[24px] border border-slate-200 dark:border-white/10">
                      <div className="relative">
                        <label className="block text-xs font-bold text-navy-900/60 dark:text-white/80 uppercase mb-2 ml-1">Origin</label>
                        <input
                          className="w-full p-4 rounded-xl bg-white text-slate-800 border-0 focus:ring-2 focus:ring-gold-500 placeholder:text-slate-400 outline-none"
                          placeholder="City or Port"
                          type="text"
                          value={bookingData.origin}
                          onChange={(e) => setBookingData(prev => ({ ...prev, origin: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="relative">
                        <label className="block text-xs font-bold text-navy-900/60 dark:text-white/80 uppercase mb-2 ml-1">Destination</label>
                        <input
                          className="w-full p-4 rounded-xl bg-white text-slate-800 border-0 focus:ring-2 focus:ring-gold-500 placeholder:text-slate-400 outline-none"
                          placeholder="City or Port"
                          type="text"
                          value={bookingData.destination}
                          onChange={(e) => setBookingData(prev => ({ ...prev, destination: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="relative">
                        <label className="block text-xs font-bold text-navy-900/60 dark:text-white/80 uppercase mb-2 ml-1">Cargo Type</label>
                        <select
                          className="w-full p-4 rounded-xl bg-white text-slate-800 border-0 focus:ring-2 focus:ring-gold-500 outline-none"
                          value={bookingData.cargoType}
                          onChange={(e) => setBookingData(prev => ({ ...prev, cargoType: e.target.value }))}
                        >
                          <option>General Cargo</option>
                          <option>Fragile</option>
                          <option>Hazardous</option>
                          <option>Temperature Controlled</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.05, backgroundColor: "#EAB308" }}
                          whileTap={{ scale: 0.95 }}
                          className="w-full bg-gold-500 text-black py-4 rounded-xl font-bold transition-colors"
                        >
                          Get Quote
                        </motion.button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Dashboard Preview Section */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-6xl mx-auto px-4 mt-20 relative z-20 group"
          >
            <div className="relative transform transition-transform duration-500 group-hover:scale-[1.01]">
              <div className="absolute -inset-1 bg-gradient-to-r from-gold-500/20 to-blue-500/20 rounded-[40px] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Image
                src="/images/illustrations/aircraft_hangar.jpg"
                alt="Cargofly Aviation Logistics"
                width={1600}
                height={900}
                className="rounded-[32px] shadow-2xl border border-white/10 relative z-10 w-full h-auto grayscale-[10%] opacity-90"
                priority
              />
            </div>

            {/* Decorative elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="absolute -top-10 -right-10 w-32 h-32 bg-gold-500/10 rounded-full blur-3xl"
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"
            ></motion.div>
          </motion.div>
        </header>


        <section className="py-24 bg-white dark:bg-transparent border-t border-slate-200 dark:border-white/10 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <motion.div variants={fadeUp} className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-navy-900 dark:text-white">Elevating Aviation Logistics</h2>
              <p className="text-navy-900/70 dark:text-white/70 font-body">Manage your entire air cargo supply chain with our integrated digital platform.</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <motion.div
                variants={fadeUp}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="group text-center cursor-default"
              >
                <div className="w-20 h-20 bg-navy-900/5 dark:bg-white/10 text-navy-900 dark:text-white rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:bg-gold-500/20 group-hover:text-gold-500 transition-colors duration-300">
                  <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform duration-300">flight</span>
                </div>
                <h3 className="text-xl font-bold mb-4 text-navy-900 dark:text-white">Submit Air Shipment</h3>
                <p className="text-navy-900/70 dark:text-white/70 leading-relaxed font-body">
                  Input your cargo details and choose from our network of premium air carriers across 180+ countries.
                </p>
              </motion.div>
              <motion.div
                variants={fadeUp}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="group text-center cursor-default"
              >
                <div className="w-20 h-20 bg-navy-900/5 dark:bg-white/10 text-navy-900 dark:text-white rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:bg-gold-500/20 group-hover:text-gold-500 transition-colors duration-300">
                  <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform duration-300">radar</span>
                </div>
                <h3 className="text-xl font-bold mb-4 text-navy-900 dark:text-white">Real-time Radar Monitoring</h3>
                <p className="text-navy-900/70 dark:text-white/70 leading-relaxed font-body">
                  Get live flight tracking data, weather alerts, and automatic documentation updates 24/7.
                </p>
              </motion.div>
              <motion.div
                variants={fadeUp}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="group text-center cursor-default"
              >
                <div className="w-20 h-20 bg-navy-900/5 dark:bg-white/10 text-navy-900 dark:text-white rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:bg-gold-500/20 group-hover:text-gold-500 transition-colors duration-300">
                  <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform duration-300">inventory_2</span>
                </div>
                <h3 className="text-xl font-bold mb-4 text-navy-900 dark:text-white">Secure Hangar Delivery</h3>
                <p className="text-navy-900/70 dark:text-white/70 leading-relaxed font-body">
                  Priority handling and digital PODs delivered straight to your inbox upon safe landing.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        <section className="py-24 bg-white dark:bg-transparent border-t border-slate-200 dark:border-white/10 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <motion.div variants={fadeUp} className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-navy-900 dark:text-white">Premium Air Logistics</h2>
                <p className="text-navy-900/70 dark:text-white/70 max-w-xl font-body">Specialized aviation logistics solutions tailored to your business needs, powered by advanced tracking technology.</p>
              </div>
              <motion.a
                whileHover={{ x: 10 }}
                className="text-gold-500 font-semibold flex items-center gap-2 hover:underline" href="#"
              >
                Explore All Aviation Services <span className="material-symbols-outlined">arrow_right_alt</span>
              </motion.a>
            </motion.div>
            <div className="flex justify-center">
              <motion.div
                variants={fadeUp}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)"
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-none transition-all duration-300 max-w-lg w-full cursor-default relative group"
              >
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
                  <Plane className="w-24 h-24 text-gold-500" />
                </div>
                <div className="w-16 h-16 bg-gold-500/10 rounded-2xl flex items-center justify-center text-gold-500 mb-8">
                  <Plane className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-navy-900 dark:text-white">Aviation Freight</h3>
                <p className="text-navy-900/70 dark:text-white/70 mb-8 leading-relaxed font-body">Fast and reliable global delivery for time-sensitive cargo with priority handling and customs clearance for the aviation industry.</p>
                <ul className="space-y-4 mb-10">
                  {[
                    "Next-day global delivery",
                    "Specialized AOG support",
                    "Temperature controlled transport"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-navy-900/80 dark:text-white/80">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: "#EAB308", color: "#000" }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-5 rounded-2xl border-2 border-gold-500/50 dark:border-gold-500/30 text-gold-500 font-bold transition-all duration-300 shadow-md flex items-center justify-center gap-2"
                >
                  Book Air Freight
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </section>


        <section className="py-24 bg-white dark:bg-transparent border-t border-slate-200 dark:border-white/10 relative overflow-hidden z-10">
          <div className="absolute inset-0 map-bg pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
              >
                <span className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4 block">Global Presence</span>
                <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight text-navy-900 dark:text-white">We Bridge the Gap Between Continents</h2>
                <p className="text-lg text-navy-900/70 dark:text-white/70 mb-10 leading-relaxed font-body">
                  With an extensive network spanning across every major trade route, Cargofly ensures your business knows no borders. Our local expertise combined with global scale provides unmatched reliability.
                </p>
                <div className="grid grid-cols-2 gap-8">
                  <motion.div
                    whileHover={{ y: -5, backgroundColor: "rgba(255, 255, 255, 0.12)", borderColor: "rgba(255, 202, 0, 0.3)" }}
                    className="bg-slate-50 dark:bg-white/5 backdrop-blur-md p-6 rounded-[24px] border border-slate-200 dark:border-white/10 transition-all duration-300 shadow-sm"
                  >
                    <div className="w-12 h-12 bg-gold-500/10 rounded-xl flex items-center justify-center text-gold-500 mb-4">
                      <Globe className="w-6 h-6" />
                    </div>
                    <div className="text-4xl font-bold text-navy-900 dark:text-white mb-2">100+</div>
                    <div className="text-navy-900/60 dark:text-white/60 font-medium text-sm">Countries Covered</div>
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -5, backgroundColor: "rgba(255, 255, 255, 0.12)", borderColor: "rgba(255, 202, 0, 0.3)" }}
                    className="bg-slate-50 dark:bg-white/5 backdrop-blur-md p-6 rounded-[24px] border border-slate-200 dark:border-white/10 transition-all duration-300 shadow-sm"
                  >
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-4">
                      <Headset className="w-6 h-6" />
                    </div>
                    <div className="text-4xl font-bold text-navy-900 dark:text-white mb-2">24/7</div>
                    <div className="text-navy-900/60 dark:text-white/60 font-medium text-sm">Global Support</div>
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -5, backgroundColor: "rgba(255, 255, 255, 0.12)", borderColor: "rgba(255, 202, 0, 0.3)" }}
                    className="bg-slate-50 dark:bg-white/5 backdrop-blur-md p-6 rounded-[24px] border border-slate-200 dark:border-white/10 transition-all duration-300 shadow-sm"
                  >
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 mb-4">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="text-4xl font-bold text-navy-900 dark:text-white mb-2">50k+</div>
                    <div className="text-navy-900/60 dark:text-white/60 font-medium text-sm">Active Partners</div>
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -5, backgroundColor: "rgba(255, 255, 255, 0.12)", borderColor: "rgba(255, 202, 0, 0.3)" }}
                    className="bg-slate-50 dark:bg-white/5 backdrop-blur-md p-6 rounded-[24px] border border-slate-200 dark:border-white/10 transition-all duration-300 shadow-sm"
                  >
                    <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 mb-4">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div className="text-4xl font-bold text-navy-900 dark:text-white mb-2">99.9%</div>
                    <div className="text-navy-900/60 dark:text-white/60 font-medium text-sm">On-Time Delivery</div>
                  </motion.div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="aspect-square bg-blue-500/5 rounded-full absolute -inset-10 animate-pulse"></div>
                <Image
                  alt="Global Air Logistics"
                  className="rounded-3xl shadow-2xl relative z-10 w-full object-cover aspect-[4/3] grayscale-[20%] opacity-90"
                  src="/images/illustrations/ground_crew.jpg"
                  width={800}
                  height={600}
                />
              </motion.div>
            </div>
          </div>
        </section>

        <section id="shipping-routes" className="py-24 bg-white dark:bg-transparent border-t border-slate-200 dark:border-white/10 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-navy-900 dark:text-white mb-6">Popular Shipping Routes</h2>
              <p className="text-xl text-navy-900/60 dark:text-white/60 max-w-2xl mx-auto">
                Our most frequented routes across Nigeria and West Africa, optimized for speed and reliability.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Local Routes */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-slate-50 dark:bg-white/5 backdrop-blur-md rounded-[32px] p-8 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gold-500/20 rounded-xl flex items-center justify-center text-gold-500">
                    <span className="material-symbols-outlined">location_on</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-navy-900 dark:text-white">Local Routes</h3>
                    <p className="text-navy-900/50 dark:text-white/50 text-sm">Domestic distribution within Nigeria</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { dest: "North - Central", time: "1.5HRS", rate: "2,500", flag: "ng" },
                    { dest: "North - East", time: "2.6HRS", rate: "3,500", flag: "ng" },
                    { dest: "North - West", time: "2.4HRS", rate: "3,500", flag: "ng" },
                    { dest: "South - East", time: "1.2HRS", rate: "2,500", flag: "ng" },
                    { dest: "South - South", time: "0.9HRS", rate: "2,500", flag: "ng" },
                  ].map((route, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="text-navy-900 dark:text-white font-bold flex items-center gap-3">
                          <img
                            src={`https://flagcdn.com/w40/${route.flag}.png`}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover border border-white/10 shadow-sm"
                          />
                          Lagos <span className="text-gold-500 mx-1">↔</span> {route.dest}
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-navy-900/40 dark:text-white/40 text-sm flex items-center gap-1.5 font-medium">
                          <Clock className="w-4 h-4" />
                          {route.time}
                        </div>
                        <div className="text-gold-500 font-bold">₦{route.rate}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Regional Routes */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-slate-50 dark:bg-white/5 backdrop-blur-md rounded-[32px] p-8 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                    <span className="material-symbols-outlined">public</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-navy-900 dark:text-white">Regional Routes</h3>
                    <p className="text-navy-900/50 dark:text-white/50 text-sm">West African cross-border logistics</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { dest: "Ghana", time: "1.18HRS", rate: "12,500", flag: "gh" },
                    { dest: "Benin", time: "0.32HRS", rate: "8,500", flag: "bj" },
                    { dest: "Togo", time: "0.59HRS", rate: "9,500", flag: "tg" },
                    { dest: "Abidjan", time: "1.76HRS", rate: "15,000", flag: "ci" }
                  ].map((route, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="text-navy-900 dark:text-white font-bold flex items-center gap-3">
                          <img
                            src={`https://flagcdn.com/w40/${route.flag}.png`}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover border border-white/10 shadow-sm"
                          />
                          Lagos <span className="text-gold-500 mx-1">↔</span> {route.dest}
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-navy-900/40 dark:text-white/40 text-sm flex items-center gap-1.5 font-medium">
                          <Clock className="w-4 h-4" />
                          {route.time}
                        </div>
                        <div className="text-gold-500 font-bold">₦{route.rate}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-white dark:bg-transparent border-t border-slate-200 dark:border-white/10 relative z-10 overflow-hidden">
          {/* Decorative background circle */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h3 className="text-gold-500 font-bold tracking-[0.2em] mb-4 uppercase text-sm">Why Choose Cargofly?</h3>
              <h2 className="text-3xl md:text-5xl font-black text-navy-900 dark:text-white mb-6">Built for the Skies, Made for Nigeria.</h2>
              <p className="text-navy-900/70 dark:text-white/70 max-w-2xl font-body">Our specialized aviation infrastructure ensures your cargo reaches its destination with unmatched speed across West Africa.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {/* Our Fleet */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="group"
              >
                <div className="relative aspect-[16/10] mb-8 overflow-hidden rounded-2xl shadow-xl">
                  <Image
                    src="/images/illustrations/courier_plane.jpg"
                    alt="Our Fleet"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <h4 className="text-2xl font-bold text-gold-500 mb-4">Our Fleet</h4>
                <p className="text-navy-900/80 dark:text-white/80 leading-relaxed mb-6">
                  Our modern fleet of specialized cargo aircraft, operated by skilled professionals, ensures your cargo reaches its destination safely and on time.
                </p>
                <button className="text-gold-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 group/btn">
                  LEARN MORE
                  <span className="material-symbols-outlined text-sm transition-transform group-hover/btn:translate-x-1">arrow_forward</span>
                </button>
              </motion.div>

              {/* Our Services */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="group"
              >
                <div className="relative aspect-[16/10] mb-8 overflow-hidden rounded-2xl shadow-xl">
                  <Image
                    src="/images/illustrations/warehouse_workers.jpg"
                    alt="Our Services"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <h4 className="text-2xl font-bold text-gold-500 mb-4">Our Services</h4>
                <p className="text-navy-900/80 dark:text-white/80 leading-relaxed mb-6">
                  Our friendly and knowledgeable team is dedicated to providing every customer a seamless and personalized shipping experience.
                </p>
                <button className="text-gold-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 group/btn">
                  LEARN MORE
                  <span className="material-symbols-outlined text-sm transition-transform group-hover/btn:translate-x-1">arrow_forward</span>
                </button>
              </motion.div>

              {/* Our Network */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="group"
              >
                <div className="relative aspect-[16/10] mb-8 overflow-hidden rounded-2xl shadow-xl">
                  <Image
                    src="/images/illustrations/ground_crew.jpg"
                    alt="Our Network"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <h4 className="text-2xl font-bold text-gold-500 mb-4">Our Network</h4>
                <p className="text-navy-900/80 dark:text-white/80 leading-relaxed mb-6">
                  We provide vital connections across Nigeria and West Africa, supporting individuals, businesses, and communities with reliable air transit.
                </p>
                <button className="text-gold-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 group/btn">
                  LEARN MORE
                  <span className="material-symbols-outlined text-sm transition-transform group-hover/btn:translate-x-1">arrow_forward</span>
                </button>
              </motion.div>
            </div>
          </div>
        </section>


        <section className="py-24 bg-white dark:bg-transparent border-t border-slate-200 dark:border-white/10 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative bg-slate-50 dark:bg-white/5 backdrop-blur-lg rounded-[3rem] p-10 md:p-20 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none overflow-hidden mt-20 text-navy-900 dark:text-white"
            >
              <div className="absolute top-0 right-0 p-10 opacity-10 text-navy-900 dark:text-white">
                <span className="material-symbols-outlined text-[120px] leading-none">format_quote</span>
              </div>
              <div className="relative z-10">
                <div className="max-w-3xl">
                  <div className="flex gap-1 text-yellow-400 mb-6">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    ))}
                  </div>
                  <p className="text-2xl md:text-4xl font-bold text-navy-900 dark:text-white mb-10 leading-tight">
                    &quot;The digital shift with Cargofly has transformed how we handle urgent medical supplies across the region. Total visibility, total trust.&quot;
                  </p>
                  <div>
                    <div className="text-navy-900 dark:text-white font-bold text-xl mb-1">Dr. Amaka Okafor</div>
                    <div className="text-[#003399]/60 dark:text-white/60 font-medium">Logistics Director, West Health</div>
                  </div>
                </div>
                <div className="flex gap-4 mt-12">
                  <motion.button
                    whileHover={{ scale: 1.1, backgroundColor: "rgba(0, 0, 0, 0.05)" }}
                    whileTap={{ scale: 0.9 }}
                    className="w-12 h-12 rounded-full border border-slate-200 dark:border-white/20 text-navy-900 dark:text-white flex items-center justify-center transition-all"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1, backgroundColor: "#EAB308", color: "black", borderColor: "#EAB308" }}
                    whileTap={{ scale: 0.9 }}
                    className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700 text-navy-900 dark:text-white flex items-center justify-center transition-all"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
      <ExitIntentModal />
    </div>
  );
}
