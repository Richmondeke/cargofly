'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext'; // Assuming this context exists or we will use local state

const SidebarLink: React.FC<{ to: string; icon: string; label: string; active?: boolean; onClick?: () => void }> = ({ to, icon, label, active, onClick }) => (
    <Link
        href={to}
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${active
            ? 'bg-white/10 text-white shadow-sm'
            : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
    >
        <span className={`material-symbols-outlined text-xl ${active ? 'fill-1' : 'group-hover:text-white transition-colors'}`}>
            {icon}
        </span>
        <span className="text-sm font-medium">{label}</span>
    </Link>
);

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
    const pathname = usePathname();
    const { userProfile, signOut } = useAuth(); // Connect to AuthContext
    const router = useRouter();

    const [darkMode, setDarkMode] = React.useState(false);

    React.useEffect(() => {
        if (document.documentElement.classList.contains('dark')) {
            setDarkMode(true);
        }
    }, []);

    const toggleTheme = () => {
        const isDark = !darkMode;
        setDarkMode(isDark);
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const sidebarContent = (
        <aside className={`flex h-full w-[253px] flex-col bg-[#003399] transition-transform duration-300 ease-in-out shrink-0
            fixed md:relative z-40 md:z-0
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            top-0 left-0 bottom-0
            pt-12 pb-12 pl-8 pr-6
        `} style={{ backgroundImage: 'url("/Cargofly motif_transparent.png")', backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                    <img
                        src="/logo-dark.png"
                        alt="Cargofly"
                        className="h-8 w-auto"
                    />
                </div>
                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="md:hidden p-1 text-white/50 hover:text-white"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
                <SidebarLink to="/dashboard" icon="dashboard" label="Dashboard" active={pathname === '/dashboard'} onClick={onClose} />
                <SidebarLink to="/dashboard/shipments" icon="inventory_2" label="Shipments" active={pathname?.startsWith('/dashboard/shipments')} onClick={onClose} />
                <SidebarLink to="/dashboard/new-booking" icon="add_circle" label="New Booking" active={pathname === '/dashboard/new-booking'} onClick={onClose} />
                <SidebarLink to="/dashboard/wallet" icon="account_balance_wallet" label="Wallet" active={pathname === '/dashboard/wallet'} onClick={onClose} />
                <SidebarLink to="/dashboard/support" icon="support_agent" label="Support" active={pathname?.startsWith('/dashboard/support') && !pathname?.includes('admin')} onClick={onClose} />

                {userProfile?.role === 'admin' && (
                    <>
                        <div className="mt-8 mb-2 px-4">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Management</span>
                        </div>
                        <SidebarLink to="/dashboard/admin" icon="admin_panel_settings" label="Operations" active={pathname === '/dashboard/admin'} onClick={onClose} />
                        <SidebarLink to="/dashboard/admin/users" icon="group" label="Users" active={pathname === '/dashboard/admin/users'} onClick={onClose} />
                        <SidebarLink to="/dashboard/admin/support" icon="confirmation_number" label="Tickets" active={pathname?.startsWith('/dashboard/admin/support')} onClick={onClose} />
                        <SidebarLink to="/dashboard/admin/rates" icon="currency_exchange" label="Shipping Rates" active={pathname === '/dashboard/admin/rates'} onClick={onClose} />
                        <SidebarLink to="/dashboard/admin/blog" icon="article" label="Blog Posts" active={pathname?.startsWith('/dashboard/admin/blog')} onClick={onClose} />
                    </>
                )}
                <SidebarLink to="/dashboard/settings" icon="settings" label="Settings" active={pathname === '/dashboard/settings'} onClick={onClose} />
            </div>

            <div className="mt-auto pt-6 border-t border-white/10">
                <div className="flex items-center gap-3 mt-4 px-3">
                    <div className="size-9 rounded-full bg-white/20 overflow-hidden bg-cover bg-center flex items-center justify-center text-white font-bold" >
                        {userProfile?.displayName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="text-sm font-medium text-white truncate">{userProfile?.displayName || 'User'}</span>
                        <span className="text-xs text-white/50 capitalize">{userProfile?.role || 'Guest'}</span>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                        title="Sign Out"
                    >
                        <span className="material-symbols-outlined">logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}
            {sidebarContent}
        </>
    );
};

export default Sidebar;


