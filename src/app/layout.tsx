
import localFont from "next/font/local";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TransitionProvider } from "@/contexts/TransitionContext";

const humanist = localFont({
  src: "./fonts/Humanist521BT.ttf",
  variable: "--font-humanist",
  display: "swap",
});



export const metadata = {
  title: "Cargofly | Caverton Cargo Division - Premium Aviation Logistics",
  description:
    "The pinnacle of West African aviation logistics. Premium cargo services, real-time tracking, and white-glove delivery for discerning clients worldwide.",
  keywords: [
    "cargo",
    "logistics",
    "aviation",
    "shipping",
    "premium freight",
    "West Africa",
    "Caverton",
    "air cargo",
    "express delivery",
  ],
  authors: [{ name: "Caverton Group" }],
  openGraph: {
    title: "Cargofly | Premium Aviation Logistics",
    description:
      "Where luxury meets logistics. Premium cargo services for discerning clients.",
    type: "website",
    locale: "en_US",
    siteName: "Cargofly",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cargofly | Premium Aviation Logistics",
    description:
      "Where luxury meets logistics. Premium cargo services for discerning clients.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.png",
  },
};

import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${humanist.variable}`} suppressHydrationWarning>
      <head>
        {/* Security Headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />

        <meta name="referrer" content="strict-origin-when-cross-origin" />
        {/* Material Symbols for dashboard icons */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        {/* Inter, Public Sans, and Work Sans fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Public+Sans:wght@300;400;500;600;700;800;900&family=Work+Sans:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-white dark:bg-navy-900 text-navy-900 dark:text-white transition-colors duration-300 font-body antialiased">
        <Toaster position="top-right" />
        <AuthProvider>
          <ThemeProvider>
            <TransitionProvider>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </TransitionProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

