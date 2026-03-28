import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPolicy() {
    return (
        <main className="min-h-screen bg-white dark:bg-[#001A4D] transition-colors duration-300">
            <Navbar />
            <div className="pt-32 pb-20 px-4">
                <div className="max-w-4xl mx-auto prose dark:prose-invert">
                    <h1 className="text-navy-900 dark:text-white font-display">Privacy Policy</h1>
                    <p className="text-slate-600 dark:text-slate-400 font-body">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                    <p>
                        At Cargofly, we take your privacy seriously. This Privacy Policy describes how we collect, use, and protect your personal information when you use our services.
                    </p>
                    <h2>Information We Collect</h2>
                    <p>
                        We may collect personal information such as your name, email address, phone number, and shipping details when you create an account or use our services.
                    </p>
                    <h2>How We Use Your Information</h2>
                    <ul>
                        <li>To provide and improve our services.</li>
                        <li>To communicate with you about your shipments and account.</li>
                        <li>To personalized your experience on our platform.</li>
                        <li>To comply with legal obligations.</li>
                    </ul>
                    <h2>Data Security</h2>
                    <p>
                        We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, or misuse.
                    </p>
                    <h2>Your Rights</h2>
                    <p>
                        You have the right to access, correct, or delete your personal information. You can also object to the processing of your data in certain circumstances.
                    </p>
                    <h2>Changes to This Policy</h2>
                    <p>
                        We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on our website.
                    </p>
                    <h2>Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@cargofly.com">privacy@cargofly.com</a>.
                    </p>
                </div>
            </div>
            <Footer />
        </main>
    );
}
