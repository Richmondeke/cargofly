import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CookieUsage() {
    return (
        <main className="min-h-screen bg-white dark:bg-[#001A4D] transition-colors duration-300">
            <Navbar />
            <div className="pt-32 pb-20 px-4">
                <div className="max-w-4xl mx-auto prose dark:prose-invert">
                    <h1 className="text-navy-900 dark:text-white font-display">Cookie Usage Policy</h1>
                    <p className="text-slate-600 dark:text-slate-400 font-body">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                    <p>
                        Cargofly uses cookies to improve your experience on our website. This policy explains what cookies are, how we use them, and your choices regarding their use.
                    </p>
                    <h2>What are Cookies?</h2>
                    <p>
                        Cookies are small text files that are stored on your device when you visit a website. They help the website recognize your device and remember information about your visit, such as your preferences and login status.
                    </p>
                    <h2>How We Use Cookies</h2>
                    <ul>
                        <li><strong>Essential Cookies:</strong> These are necessary for the website to function properly, such as for authentication and security.</li>
                        <li><strong>Analytics Cookies:</strong> These help us understand how visitors interact with our website, allowing us to improve its performance and user experience.</li>
                        <li><strong>Preference Cookies:</strong> These remember your settings and preferences, such as your preferred language or region.</li>
                    </ul>
                    <h2>Your Choices</h2>
                    <p>
                        You can manage your cookie preferences through your browser settings. Most browsers allow you to block or delete cookies. However, please note that blocking essential cookies may affect the functionality of our website.
                    </p>
                    <h2>Contact Us</h2>
                    <p>
                        If you have any questions about our use of cookies, please contact us at <a href="mailto:support@cargofly.com">support@cargofly.com</a>.
                    </p>
                </div>
            </div>
            <Footer />
        </main>
    );
}
