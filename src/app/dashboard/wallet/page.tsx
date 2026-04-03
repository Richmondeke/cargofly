'use client';

import React, { useState, useEffect } from 'react';
import EmptyState from '@/components/common/EmptyState';
import SuccessModal from "@/components/ui/SuccessModal";
import PaymentModal from "@/components/dashboard/PaymentModal";
import WithdrawModal from "@/components/dashboard/WithdrawModal";
import BankDetailsModal from "@/components/dashboard/BankDetailsModal";
import FXConversionModal from "@/components/dashboard/FXConversionModal";
import { KYCBanner } from "@/components/dashboard/KYCBanner";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToWallet, getTransactions, initializeWallet, Wallet, WalletTransaction } from "@/lib/wallet-service";
import { getPendingCustomsDuties, Shipment } from "@/lib/firestore";
import toast from 'react-hot-toast';
import { Package } from 'lucide-react';

export default function WalletPage() {
    const { user } = useAuth();
    const [actionLoading, setActionLoading] = useState(false);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '' });
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
    const [bankModalOpen, setBankModalOpen] = useState(false);
    const [fxModalOpen, setFXModalOpen] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState({ amount: 0, description: '', shipmentId: undefined as string | undefined });
    const [infoBannerVisible, setInfoBannerVisible] = useState(true);

    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [pendingDuties, setPendingDuties] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) return;
        const fetchPendingDuties = async () => {
            const duties = await getPendingCustomsDuties(user.uid);
            setPendingDuties(duties);
        };
        fetchPendingDuties();
        initializeWallet(user.uid);
        const unsubscribe = subscribeToWallet(user.uid, (data) => {
            setWallet(data);
            setLoading(false);
        });
        fetchTransactions();
        return () => unsubscribe();
    }, [user?.uid]);

    const fetchTransactions = async () => {
        if (!user?.uid) return;
        const txns = await getTransactions(user.uid);
        setTransactions(txns);
    };

    const handlePayDuties = (shipment?: Shipment) => {
        if (shipment) {
            setPaymentDetails({
                amount: shipment.customsDuty || 0,
                description: `Customs Duty Payment for ${shipment.trackingNumber}`,
                shipmentId: shipment.id
            });
        } else {
            setPaymentDetails({ amount: 250.00, description: 'Pay Outstanding Shipping Duties (General)', shipmentId: undefined });
        }
        setPaymentModalOpen(true);
    };


    const handleAction = (action: string) => {
        setActionLoading(true);
        setTimeout(() => {
            setActionLoading(false);
            setModalContent({ title: `${action} Successful`, message: `The ${action.toLowerCase()} request has been processed successfully.` });
            setSuccessModalOpen(true);
        }, 800);
    };

    /* ─── Derived values ─────────────────────────────────── */
    const ngnBalance = wallet?.balanceNGN ?? 0;
    const usdBalance = wallet?.balanceUSD ?? 0;
    const ngnBalanceRaw = wallet?.balanceNGN ?? 0;

    const txnIcon = (txn: WalletTransaction) => {
        if (txn.type === 'deposit') return 'account_balance';
        if (txn.description?.toLowerCase().includes('freight') || txn.description?.toLowerCase().includes('air')) return 'flight_takeoff';
        if (txn.description?.toLowerCase().includes('maintenance')) return 'local_shipping';
        return 'payments';
    };

    const txnIconBg = (txn: WalletTransaction) =>
        txn.type === 'deposit' ? 'bg-[#ffe08f]' : 'bg-[#d5e3ff]';

    const txnIconColor = (txn: WalletTransaction) =>
        txn.type === 'deposit' ? 'text-[#755b00]' : 'text-[#005eb2]';

    const txnCategory = (txn: WalletTransaction) => {
        if (txn.type === 'deposit') return { label: 'Deposit', bg: 'bg-[#e9e8e7]', color: 'text-slate-600' };
        if (txn.description?.toLowerCase().includes('duty') || txn.description?.toLowerCase().includes('custom')) return { label: 'Operations', bg: 'bg-[#d5e3ff]', color: 'text-[#004788]' };
        return { label: 'Logistics', bg: 'bg-[#d5e3ff]', color: 'text-[#004788]' };
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[#fbf9f8] dark:bg-[#0f172a] relative min-h-screen">
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
                {/* ── Page Header ────────────────────────────────────────────────── */}
                <div className="flex justify-between items-center sm:items-end">
                    <div>
                        <h2 className="font-display font-medium text-3xl tracking-tighter text-[#1b1c1c] dark:text-white uppercase shrink-0">Wallet</h2>
                        <p className="font-display font-medium tracking-tight text-slate-500 text-sm mt-1">Manage accounts, payments and withdrawals</p>
                    </div>
                    <button
                        onClick={() => toast.success('Funding feature coming soon')}
                        disabled={actionLoading}
                        className="bg-white dark:bg-[#1e293b] text-[#1b1c1c] dark:text-white border border-slate-200 dark:border-slate-800 py-3 px-6 rounded-xl font-display font-medium text-sm flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined">add_card</span>
                        Add Funds
                    </button>
                </div>

                {/* ── KYC Requirement Banner ────────────────────────────────────────── */}
                {wallet?.kycStatus !== 'verified' && (
                    <KYCBanner onCompleteKYC={() => window.location.href = '/dashboard/settings?tab=kyc'} />
                )}

                {/* ── Wallet Cards Grid ───────────────────────────────────────────── */}
                {wallet?.kycStatus === 'verified' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* ── NGN Wallet Card ── */}
                        <div className="bg-[#1b1c1c] text-white rounded-3xl p-8 flex flex-col relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:translate-x-4 transition-transform duration-500"></div>
                            <div className="flex justify-between items-start mb-10 relative z-10">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Main Balance</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">🇳🇬</span>
                                        <span className="font-bold text-lg">NGN</span>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-slate-500 group-hover:text-white transition-colors">account_balance_wallet</span>
                            </div>
                            <div className="mb-10 relative z-10">
                                <p className="text-4xl font-black tracking-tight leading-none">
                                    ₦{ngnBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-slate-500 mt-2 font-medium">Available for immediate withdrawal</p>
                            </div>
                            <div className="mt-auto pt-6 border-t border-white/10 flex justify-between items-center relative z-10">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Exchange Lock</p>
                                    <p className="text-sm font-bold opacity-80">1,650.00 / USD</p>
                                </div>
                                <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                                    <span className="material-symbols-outlined text-sm">swap_vert</span>
                                </button>
                            </div>
                        </div>

                        {/* ── USD Card ── */}
                        <div className="bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-slate-800 rounded-3xl p-8 flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Foreign Reserve</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">🇺🇸</span>
                                        <span className="font-bold text-lg text-black dark:text-white">USD</span>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-slate-300 group-hover:text-[#4397ff] transition-colors">public</span>
                            </div>
                            <div className="mb-10">
                                <p className="text-4xl font-black text-black dark:text-white tracking-tight leading-none">
                                    ${usdBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <div className="mt-4 flex items-center gap-2">
                                    <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                                    <p className="text-xs text-slate-500 font-bold tracking-tight">Active Domestic Account</p>
                                </div>
                            </div>
                            <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <button
                                    onClick={() => setBankModalOpen(true)}
                                    className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-[#005eb2] transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">info</span>
                                    View Bank Details
                                </button>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <span className="material-symbols-outlined text-slate-400 text-3xl">lock</span>
                        </div>
                        <div className="max-w-sm">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Wallet Features Locked</h3>
                            <p className="text-sm text-slate-500 mt-1">Complete your identity verification to view your account balances and manage your funds.</p>
                        </div>
                    </div>
                )}

                {/* ── Transaction Section ────────────────────────────────────────── */}
                <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <h3 className="font-display font-medium text-lg text-[#1b1c1c] dark:text-white uppercase tracking-tight">Activity Log</h3>
                            {wallet?.kycStatus === 'verified' && (
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md text-[10px] font-medium">{transactions.length} Total</span>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <span className="material-symbols-outlined">filter_list</span>
                            </button>
                            <button className="p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <span className="material-symbols-outlined">download</span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto relative">
                        {wallet?.kycStatus !== 'verified' && (
                            <div className="absolute inset-0 z-20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                                <div className="text-center">
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Verification Required to View History</p>
                                </div>
                            </div>
                        )}
                        <table className={`w-full text-left ${wallet?.kycStatus !== 'verified' ? 'filter blur-[4px] pointer-events-none' : ''}`}>
                            <thead className="bg-slate-50/50 dark:bg-[#0f172a]/50">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">Transaction Details</th>
                                    <th className="px-6 py-4 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Amount</th>
                                    <th className="px-6 py-4 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <EmptyState
                                                title="Empty Vault"
                                                description="Your financial history will materialize here once you initiate orders or deposits."
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((txn) => {
                                        const cat = txnCategory(txn);
                                        return (
                                            <tr key={txn.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:pl-8 transition-all duration-300 group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-full ${txnIconBg(txn)} ${txnIconColor(txn)} flex items-center justify-center shrink-0 shadow-sm shadow-current/10`}>
                                                            <span className="material-symbols-outlined text-sm">{txnIcon(txn)}</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-[#1b1c1c] dark:text-white text-sm">
                                                                {txn.description}
                                                            </p>
                                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">{txn.method} · {txn.shipmentId ? `AWB: ${txn.shipmentId.slice(0, 10)}` : 'WALLET'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <p className={`font-display font-medium text-sm ${txn.amount < 0 ? 'text-rose-600' : 'text-[#003399]'}`}>
                                                        {txn.amount > 0 ? '+' : ''} {txn.currency} {Math.abs(txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                                        {txn.createdAt ? (txn.createdAt as any).toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wider ${cat.bg} ${cat.color}`}>
                                                        {cat.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Quick Actions Grid ───────────────────────────────────────────── */}
                {wallet?.kycStatus === 'verified' && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-1000">
                        {[
                            { icon: 'swap_horiz', label: 'FX Conversion', sub: 'Live Mid-Market Rates', action: () => setFXModalOpen(true) },
                            { icon: 'outbound', label: 'Withdraw', sub: 'Cash out to Local Bank', action: () => setWithdrawModalOpen(true) },
                        ].map((item) => (
                            <div
                                key={item.label}
                                onClick={item.action}
                                className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl group hover:bg-black dark:hover:bg-black transition-all duration-300 cursor-pointer shadow-sm border border-slate-100 dark:border-slate-800 hover:scale-[1.05] hover:-translate-y-2 hover:shadow-2xl"
                            >
                                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-black dark:text-white group-hover:bg-white/10 group-hover:text-white mb-4 transition-colors">
                                    <span className="material-symbols-outlined text-sm">{item.icon}</span>
                                </div>
                                <h4 className="font-bold text-black dark:text-white group-hover:text-white text-sm transition-colors uppercase tracking-tight">
                                    {item.label}
                                </h4>
                                <p className="text-xs text-slate-500 group-hover:text-white/60 mt-1 transition-colors font-medium">
                                    {item.sub}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

            </div>

            {/* ── Modals ───────────────────────────────────────────────────────── */}
            {user?.uid && (
                <PaymentModal
                    isOpen={paymentModalOpen}
                    onClose={() => setPaymentModalOpen(false)}
                    userId={user.uid}
                    wallet={wallet}
                    amount={paymentDetails.amount}
                    description={paymentDetails.description}
                    shipmentId={paymentDetails.shipmentId}
                    onSuccess={() => {
                        fetchTransactions();
                        setModalContent({ title: 'Payment Successful', message: 'Your payment was processed and wallet balance updated.' });
                        setSuccessModalOpen(true);
                    }}
                />
            )}
            {user?.uid && (
                <WithdrawModal
                    isOpen={withdrawModalOpen}
                    onClose={() => setWithdrawModalOpen(false)}
                    userId={user.uid}
                    wallet={wallet}
                    onSuccess={() => {
                        fetchTransactions();
                        toast.success('Withdrawal request submitted successfully');
                    }}
                />
            )}
            <BankDetailsModal
                isOpen={bankModalOpen}
                onClose={() => setBankModalOpen(false)}
            />
            <SuccessModal
                isOpen={successModalOpen}
                onClose={() => setSuccessModalOpen(false)}
                title={modalContent.title}
                message={modalContent.message}
            />
            {user?.uid && (
                <>
                    <FXConversionModal
                        isOpen={fxModalOpen}
                        onClose={() => setFXModalOpen(false)}
                        userId={user.uid}
                        wallet={wallet}
                        onSuccess={fetchTransactions}
                    />
                </>
            )}
        </div>
    );
}
