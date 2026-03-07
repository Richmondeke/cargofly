"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Theme = "dark" | "light";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void; // Keeping in interface for backwards compatibility if needed, though unused
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    // Default to dark, but we will override based on route
    const [theme, setTheme] = useState<Theme>("dark");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        // Determine enforced theme based on path
        const isDashboard = pathname?.startsWith('/dashboard');
        const enforcedTheme: Theme = isDashboard ? "light" : "dark";

        setTheme(enforcedTheme);
        document.documentElement.classList.toggle("dark", enforcedTheme === "dark");

        // Remove saved theme logic as we are strictly enforcing by route now
        localStorage.removeItem("theme");
    }, [pathname]);

    const toggleTheme = () => {
        // Disabled manually toggling - theme is enforced by route
        console.warn("Manual theme toggling is disabled. Theme is enforced by route.");
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {/* Prevent hydration mismatch by only rendering children when mounted, 
                OR accept that server render is 'dark' and client might switch. 
                For this app, defaulting to dark is consistent with design. 
            */}
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
