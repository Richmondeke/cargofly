import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsConditions() {
    return (
        <main className="min-h-screen bg-white dark:bg-[#001A4D] transition-colors duration-300">
            <Navbar />
            <div className="pt-32 pb-20 px-4">
                <div className="max-w-4xl mx-auto prose dark:prose-invert">
                    <h1 className="text-navy-900 dark:text-white font-display">Terms & Conditions</h1>
                    <p className="text-slate-600 dark:text-slate-400 font-body">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                    <p>
                        By using Cargofly's services, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.
                    </p>
                    <h2>Use of Services</h2>
                    <p>
                        You must be at least 18 years old to use our services. You agree to provide accurate and complete information when creating an account.
                    </p>
                    <h2>Shipment Terms</h2>
                    <p>
                        All shipments are subject to our shipping policies and rates. You are responsible for ensuring that your shipments comply with all applicable laws and regulations.
                    </p>
                    <h2>Payment</h2>
                    <p>
                        Payments for services must be made in accordance with our pricing and payment terms. We reserve the right to change our prices at any time.
                    </p>
                    <h2>Limitation of Liability</h2>
                    <p>
                        Cargofly shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use of our services.
                    </p>
                    <h2>Governing Law</h2>
                    <p>
                        These terms and conditions are governed by the laws of the jurisdiction in which Cargofly is headquartered.
                    </p>
                    <h2>Changes to Terms</h2>
                    <p>
                        We reserve the right to modify these terms and conditions at any time. Your continued use of our services after any changes indicates your acceptance of the new terms.
                    </p>
                    <h2>Contact Us</h2>
                    <p>
                        If you have any questions about these terms and conditions, please contact us at <a href="mailto:legal@cargofly.com">legal@cargofly.com</a>.
                    </p>
                </div>
            </div>
            <Footer />
        </main>
    );
}
