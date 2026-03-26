import Header from "@/components/landing-b/Header";
import Hero from "@/components/landing-b/Hero";
import DetailedServices from "@/components/landing-b/DetailedServices";
import Process from "@/components/landing-b/Process";
import Products from "@/components/landing-b/Products";
import Team from "@/components/landing-b/Team";
import Newsletter from "@/components/landing-b/Newsletter";

export default function Home() {
    return (
        <main className="min-h-screen font-sans selection:bg-gold-500/30 overflow-x-hidden bg-black">
            <Header />

            <Hero />
            <DetailedServices />
            <Process />
            <Products />
            <Team />
            <Newsletter />

            <footer className="bg-black text-white py-12 px-6 border-t border-white/10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <img src="/logo-light.png" alt="Cargofly" className="h-8 w-auto object-contain brightness-0 invert opacity-50" />
                    <div className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} Cargofly Inc. All rights reserved.
                    </div>
                </div>
            </footer>
        </main>
    );
}
