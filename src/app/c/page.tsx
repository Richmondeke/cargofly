'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function LandingPageVariantC() {
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
    if (!trackingNumber.trim()) return;
    router.push(`/track?id=${encodeURIComponent(trackingNumber.trim())}`);
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
    <div className="font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200 bg-transparent">
      <style dangerouslySetInnerHTML={{
        __html: `
        .map-bg { background-image: url(https://lh3.googleusercontent.com/aida-public/AB6AXuBnaIoJae5Y4Txk2M8oRiE3bDMfJilHlHgWQd_LVWXbGItQc8BUTc0ydpnacqerpR-AHc17_dQedWKvY74ZbncbnAx2x2GZ3hDSUaNumgdhN0xTHwZUbod7ZPdeBJCI1rcAIqJfp5hsUi0ZoBDfTstusxEXCn0Qs0lBz811Y1jO1rTD90I-dbJLPJeP4rFwJgeA9nk5uqft-gRA-PBbS0iSGY3ZLS0JroDs2yAoxA3fX-L-N1S03XamP9HNJM3SVc-YWCFHRTQT8KN0); background-size: cover; background-position: center; opacity: 0.05 }
      `}} />

      <header className="relative pt-32 pb-20 md:pt-48 md:pb-40 overflow-hidden bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              Global Logistics, <span className="text-gold-500">Simplified.</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Track your shipments in real-time or book freight across oceans and skies with a single click.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-4xl mx-auto bg-navy-900/40 backdrop-blur-3xl rounded-[32px] shadow-2xl p-4 md:p-6 border border-white/10" id="action-tabs"
          >
            <div className="flex bg-navy-900/30 backdrop-blur-md rounded-2xl p-1 relative overflow-hidden w-fit mx-auto shadow-sm border border-white/10 mb-6">
              <button
                className={"px-8 py-3 text-sm font-bold tracking-wide uppercase transition-all duration-300 min-w-[180px] rounded-xl flex items-center justify-center gap-2 " + (activeTab === 'track' ? 'bg-white text-primary shadow-md' : 'text-white/80 hover:text-white hover:bg-white/5')}
                onClick={() => setActiveTab('track')}
              >
                <span className="material-symbols-outlined text-lg">location_on</span>
                Track Shipment
              </button>
              <button
                className={"px-8 py-3 text-sm font-bold tracking-wide uppercase transition-all duration-300 min-w-[180px] rounded-xl flex items-center justify-center gap-2 " + (activeTab === 'book' ? 'bg-white text-primary shadow-md' : 'text-white/80 hover:text-white hover:bg-white/5')}
                onClick={() => setActiveTab('book')}
              >
                <span className="material-symbols-outlined text-lg">flight</span>
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
                  <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4 bg-white p-2 rounded-[24px]">
                    <div className="flex-grow relative flex items-center">
                      <span className="material-symbols-outlined absolute left-6 text-slate-400">search</span>
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
                      className="bg-gold-500 text-black px-10 py-4 md:py-5 rounded-[20px] font-bold hover:bg-gold-600 transition-colors flex items-center justify-center gap-2"
                    >
                      Track Now
                      <span className="material-symbols-outlined">arrow_forward</span>
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
                  <form onSubmit={handleBook} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/10 p-4 rounded-[24px] border border-white/10">
                    <div className="relative">
                      <label className="block text-xs font-bold text-white/80 uppercase mb-2 ml-1">Origin</label>
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
                      <label className="block text-xs font-bold text-white/80 uppercase mb-2 ml-1">Destination</label>
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
                      <label className="block text-xs font-bold text-white/80 uppercase mb-2 ml-1">Cargo Type</label>
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
      </header>

      <section className="py-24 bg-transparent border-t border-white/10 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <motion.div variants={fadeUp} className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Elevating Aviation Logistics</h2>
            <p className="text-white/70 font-body">Manage your entire air cargo supply chain with our integrated digital platform.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="group text-center cursor-default"
            >
              <div className="w-20 h-20 bg-white/10 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:bg-gold-500/20 group-hover:text-gold-500 transition-colors duration-300">
                <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform duration-300">flight</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Submit Air Shipment</h3>
              <p className="text-white/70 leading-relaxed font-body">
                Input your cargo details and choose from our network of premium air carriers across 180+ countries.
              </p>
            </motion.div>
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="group text-center cursor-default"
            >
              <div className="w-20 h-20 bg-white/10 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:bg-gold-500/20 group-hover:text-gold-500 transition-colors duration-300">
                <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform duration-300">radar</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Real-time Radar Monitoring</h3>
              <p className="text-white/70 leading-relaxed font-body">
                Get live flight tracking data, weather alerts, and automatic documentation updates 24/7.
              </p>
            </motion.div>
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="group text-center cursor-default"
            >
              <div className="w-20 h-20 bg-white/10 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:bg-gold-500/20 group-hover:text-gold-500 transition-colors duration-300">
                <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform duration-300">inventory_2</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Secure Hangar Delivery</h3>
              <p className="text-white/70 leading-relaxed font-body">
                Priority handling and digital PODs delivered straight to your inbox upon safe landing.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section className="py-24 bg-transparent border-t border-white/10 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <motion.div variants={fadeUp} className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Premium Air Logistics</h2>
              <p className="text-white/70 max-w-xl font-body">Specialized aviation logistics solutions tailored to your business needs, powered by advanced tracking technology.</p>
            </div>
            <motion.a
              whileHover={{ x: 10 }}
              className="text-gold-500 font-semibold flex items-center gap-2 hover:underline" href="/dashboard/new-booking"
            >
              Explore All Aviation Services <span className="material-symbols-outlined">arrow_right_alt</span>
            </motion.a>
          </motion.div>
          <div className="flex justify-center">
            <motion.div
              variants={fadeUp}
              whileHover={{
                scale: 1.03,
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                boxShadow: "0 20px 40px -15px rgba(0,0,0,0.5)"
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 transition-all duration-300 max-w-lg w-full cursor-default"
            >
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-6">
                <span className="material-symbols-outlined text-3xl">flight_takeoff</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Aviation Freight</h3>
              <p className="text-white/70 mb-6 leading-relaxed font-body">Fast and reliable global delivery for time-sensitive cargo with priority handling and customs clearance for the aviation industry.</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <span className="material-symbols-outlined text-gold-500 text-lg">check_circle</span> Next-day global delivery
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <span className="material-symbols-outlined text-gold-500 text-lg">check_circle</span> Specialized AOG support
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <span className="material-symbols-outlined text-gold-500 text-lg">check_circle</span> Temperature controlled transport
                </li>
              </ul>
              <motion.button
                onClick={() => router.push('/dashboard/new-booking')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-xl border-2 border-white/20 text-white font-bold hover:bg-gold-500 hover:border-gold-500 hover:text-black transition-all duration-300"
              >
                Book Air Freight
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section className="py-24 bg-transparent border-t border-white/10 relative overflow-hidden z-10">
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
              <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight text-white">We Bridge the Gap Between Continents</h2>
              <p className="text-lg text-white/70 mb-10 leading-relaxed font-body">
                With an extensive network spanning across every major trade route, Cargofly ensures your business knows no borders. Our local expertise combined with global scale provides unmatched reliability.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <motion.div whileHover={{ y: -5, backgroundColor: "rgba(255, 255, 255, 0.1)" }} className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 transition-colors">
                  <div className="text-4xl font-bold text-white mb-2">100+</div>
                  <div className="text-white/70 font-medium">Countries Covered</div>
                </motion.div>
                <motion.div whileHover={{ y: -5, backgroundColor: "rgba(255, 255, 255, 0.1)" }} className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 transition-colors">
                  <div className="text-4xl font-bold text-white mb-2">24/7</div>
                  <div className="text-white/70 font-medium">Global Support</div>
                </motion.div>
                <motion.div whileHover={{ y: -5, backgroundColor: "rgba(255, 255, 255, 0.1)" }} className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 transition-colors">
                  <div className="text-4xl font-bold text-white mb-2">50k+</div>
                  <div className="text-white/70 font-medium">Active Partners</div>
                </motion.div>
                <motion.div whileHover={{ y: -5, backgroundColor: "rgba(255, 255, 255, 0.1)" }} className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 transition-colors">
                  <div className="text-4xl font-bold text-white mb-2">99.9%</div>
                  <div className="text-white/70 font-medium">On-Time Delivery</div>
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
                className="rounded-3xl shadow-2xl relative z-10 w-full object-cover aspect-[4/3]"
                src="https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&q=80&w=2000"
                width={800}
                height={600}
              />
              <motion.div
                whileHover={{ scale: 1.05, x: 10 }}
                className="absolute -bottom-6 -left-6 bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl shadow-xl z-20 border border-white/10 hidden md:block"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center rounded-full">
                    <span className="material-symbols-outlined">public</span>
                  </div>
                  <div>
                    <div className="text-xs text-white/70 uppercase font-bold tracking-wider">Live Status</div>
                    <div className="text-lg font-bold text-white">Network Operating Normally</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-transparent border-t border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl font-bold text-white/70 uppercase tracking-widest mb-10">Trusted by Industry Leaders</h2>
            <div className="flex flex-wrap justify-center gap-12 items-center opacity-50 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 text-white">
              <span className="text-2xl font-bold">Company A</span>
              <span className="text-2xl font-bold">Company B</span>
              <span className="text-2xl font-bold">Company C</span>
              <span className="text-2xl font-bold">Company D</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative bg-white/5 backdrop-blur-lg rounded-[3rem] p-10 md:p-20 border border-white/10 overflow-hidden mt-20"
          >
            <div className="absolute top-0 right-0 p-10 opacity-10 text-white">
              <span className="material-symbols-outlined text-[120px] leading-none">format_quote</span>
            </div>
            <div className="relative z-10">
              <div className="max-w-3xl">
                <div className="flex gap-1 text-yellow-400 mb-6">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span key={star} className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
                </div>
                <p className="text-2xl md:text-3xl font-medium leading-relaxed mb-10 text-white">
                  &quot;Cargofly has completely transformed how we handle our international supply chain. The real-time visibility and ease of booking have saved us countless hours of manual coordination.&quot;
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full border-2 border-primary/20 bg-slate-200"></div>
                  <div>
                    <div className="font-bold text-lg text-white">David Chen</div>
                    <div className="text-white/70 text-sm">VP of Operations, TechFlow Int.</div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-12">
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 rounded-full border border-white/20 text-white flex items-center justify-center transition-all"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: "#EAB308", color: "black", borderColor: "#EAB308" }}
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700 text-white flex items-center justify-center transition-all"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
