import Header from "@/components/landing-b/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/landing-b/Hero";
import DetailedServices from "@/components/landing-b/DetailedServices";
import Process from "@/components/landing-b/Process";
import Products from "@/components/landing-b/Products";
import FAQ from "@/components/landing-b/FAQ";
import Newsletter from "@/components/landing-b/Newsletter";
import BlogSection from "@/components/landing-b/BlogSection";

export default function Home() {
    return (
        <main className="min-h-screen font-sans selection:bg-gold-500/30 overflow-x-hidden bg-black">
            <Header />

            <Hero />
            <DetailedServices />
            <Process />
            <Products />
            <BlogSection />
            <FAQ />
            <Newsletter />

            <Footer isLanding />
        </main>
    );
}
