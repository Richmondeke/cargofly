'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const SidebarLink: React.FC<{ to: string; icon: string; label: string; active?: boolean; onClick?: () => void }> = ({ to, icon, label, active, onClick }) => (
    <Link
        href={to}
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active
            ? 'bg-navy-700 text-white shadow-inner'
            : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
    >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            {icon}
        </span>
        <span className="font-medium tracking-tight text-sm">{label}</span>
    </Link>
);

const SidebarSection: React.FC<{ label: string }> = ({ label }) => (
    <div className="mt-6 mb-2 px-4">
        <span className="font-medium text-[10px] text-white/30 uppercase tracking-widest">{label}</span>
    </div>
);

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
    const pathname = usePathname();
    const { userProfile, signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const sidebarContent = (
        <aside
            className={`fixed left-0 top-0 h-screen w-72 bg-[#003399] flex flex-col py-8 px-4 z-50 transition-transform duration-300 ease-in-out md:translate-x-0 overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >

            {/* Background Image Overlay */}
            <div
                className="absolute inset-0 z-0 opacity-100 pointer-events-none bg-repeat"
                style={{ backgroundImage: "url('/Cargofly motif_transparent.png')", backgroundSize: '300px' }}
            />


            <div className="relative z-10 mb-10 px-4 flex justify-between items-center">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="relative w-32 h-10">
                        <Image
                            src="/logo-light.png"
                            alt="Cargofly"
                            fill
                            className="object-contain object-left brightness-0 invert"
                            priority
                        />
                    </div>
                </Link>
                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="md:hidden p-1 text-white/50 hover:text-white"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            <nav className="relative z-10 flex-grow space-y-1 overflow-y-auto custom-scrollbar pb-10">
                <SidebarSection label="User" />
                <SidebarLink to="/dashboard" icon="dashboard" label="Overview" active={pathname === '/dashboard'} onClick={onClose} />
                <SidebarLink to="/dashboard/shipments" icon="inventory_2" label="My Shipments" active={pathname?.startsWith('/dashboard/shipments')} onClick={onClose} />
                <SidebarLink to="/dashboard/wallet" icon="account_balance_wallet" label="My Wallet" active={pathname === '/dashboard/wallet'} onClick={onClose} />
                <SidebarLink to="/dashboard/tickets" icon="confirmation_number" label="Support Tickets" active={pathname?.startsWith('/dashboard/tickets')} onClick={onClose} />
                <SidebarLink to="/dashboard/settings" icon="settings" label="Account Settings" active={pathname === '/dashboard/settings'} onClick={onClose} />

                {userProfile?.role === 'admin' && (
                    <>
                        <SidebarSection label="Administration" />
                        <SidebarLink to="/dashboard/admin" icon="admin_panel_settings" label="Admin Panel" active={pathname === '/dashboard/admin'} onClick={onClose} />
                        <SidebarLink to="/dashboard/admin/shipments" icon="local_shipping" label="All Shipments" active={pathname === '/dashboard/admin/shipments'} onClick={onClose} />
                        <SidebarLink to="/dashboard/admin/rates" icon="currency_exchange" label="Rates Management" active={pathname === '/dashboard/admin/rates'} onClick={onClose} />
                        <SidebarLink to="/dashboard/admin/support" icon="support_agent" label="Support Console" active={pathname?.startsWith('/dashboard/admin/support')} onClick={onClose} />
                        <SidebarLink to="/dashboard/admin/blog" icon="rss_feed" label="Blog Manager" active={pathname === '/dashboard/admin/blog'} onClick={onClose} />
                    </>
                )}
            </nav>

            <div className="relative z-10 mt-auto space-y-4 px-2 pt-4 border-t border-white/10">
                <button
                    onClick={() => router.push('/dashboard/new-booking')}
                    className="w-full bg-gold-500 text-navy-900 py-3.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-xl shadow-gold-500/10 hover:brightness-110 transition-all active:scale-95 cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    New Shipment
                </button>

                <div className="flex items-center gap-3 px-2">
                    <div className="size-9 rounded-full bg-white/20 overflow-hidden flex items-center justify-center text-white font-medium" >
                        {userProfile?.displayName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="text-sm font-medium text-white truncate">{userProfile?.displayName || 'User'}</span>
                        <span className="text-[10px] text-white/50 uppercase tracking-wider font-medium truncate">{userProfile?.role || 'Guest'}</span>
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
                    className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}
            {sidebarContent}
        </>
    );
};

export default Sidebar;


