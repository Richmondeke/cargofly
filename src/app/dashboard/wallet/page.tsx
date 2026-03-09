'use client';

import React, { useState, useEffect } from 'react';
import EmptyState from '@/components/common/EmptyState';
import SuccessModal from "@/components/ui/SuccessModal";
import PaymentModal from "@/components/dashboard/PaymentModal";
import WithdrawModal from "@/components/dashboard/WithdrawModal";
import { useAuth } from "@/contexts/AuthContext";
import { StatusPill } from '@/components/dashboard/StatusPill';
import { subscribeToWallet, getTransactions, mockDeposit, initializeWallet, Wallet, WalletTransaction } from "@/lib/wallet-service";
import { getPendingCustomsDuties, Shipment } from "@/lib/firestore";
import toast from 'react-hot-toast';
import { AlertCircle, ArrowRight, DollarSign, Package } from 'lucide-react';

export default function WalletPage() {
    const { user } = useAuth();
    const [actionLoading, setActionLoading] = useState(false);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '' });
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState({ amount: 0, description: '', shipmentId: undefined as string | undefined });

    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [pendingDuties, setPendingDuties] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) return;

        // Fetch pending duties
        const fetchPendingDuties = async () => {
            const duties = await getPendingCustomsDuties(user.uid);
            setPendingDuties(duties);
        };
        fetchPendingDuties();

        // 1. Initialize wallet if first time
        initializeWallet(user.uid);

        // 2. Subscribe to real-time balance
        const unsubscribe = subscribeToWallet(user.uid, (data) => {
            setWallet(data);
            setLoading(false);
        });

        // 3. Fetch transaction history
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
            // Default check (fallback)
            setPaymentDetails({
                amount: 250.00,
                description: 'Pay Outstanding Shipping Duties (General)',
                shipmentId: undefined
            });
        }
        setPaymentModalOpen(true);
    };

    const handleMockDeposit = async () => {
        if (!user?.uid) return;
        setActionLoading(true);
        try {
            await mockDeposit(user.uid, 1000, 'USD');
            fetchTransactions();
            setModalContent({
                title: 'Deposit Successful',
                message: 'A mock deposit of $1,000 has been added to your USD account for testing.'
            });
            setSuccessModalOpen(true);
        } catch (error: any) {
            setModalContent({ title: 'Deposit Failed', message: error.message });
            setSuccessModalOpen(true);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAction = (action: string) => {
        setActionLoading(true);
        setTimeout(() => {
            setActionLoading(false);
            setModalContent({
                title: `${action} Successful`,
                message: `The ${action.toLowerCase()} request has been processed successfully.`
            });
            setSuccessModalOpen(true);
        }, 800);
    };

    return (
        <div className="flex-1 overflow-y-auto p-8 h-full bg-slate-50 dark:bg-background-dark">
            <SuccessModal
                isOpen={successModalOpen}
                onClose={() => setSuccessModalOpen(false)}
                title={modalContent.title}
                message={modalContent.message}
            />

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-[32px] font-bold text-[#1e293b] dark:text-white leading-tight">Wallet & Billing</h1>
                <p className="text-[14px] text-[#64748b] dark:text-slate-400 mt-1">Manage your virtual accounts, payments, and view transaction history</p>
            </div>

            <div className="max-w-4xl space-y-8">
                {/* Pending Duties Alert */}
                {pendingDuties.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-6 mb-8">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pending Customs Duties</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                                    You have {pendingDuties.length} shipment{pendingDuties.length > 1 ? 's' : ''} awaiting customs duty payment to proceed.
                                </p>

                                <div className="mt-4 space-y-3">
                                    {pendingDuties.map((shipment) => (
                                        <div key={shipment.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-amber-100 dark:border-amber-700/50 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <Package className="w-5 h-5 text-slate-400" />
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">{shipment.trackingNumber}</div>
                                                    <div className="text-xs text-slate-500">To: {shipment.recipient.city}, {shipment.recipient.country}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-slate-900 dark:text-white">${shipment.customsDuty?.toFixed(2)}</div>
                                                    <div className="text-[10px] text-amber-600 font-bold uppercase">Pending Duty</div>
                                                </div>
                                                <button
                                                    onClick={() => handlePayDuties(shipment)}
                                                    className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2"
                                                >
                                                    Pay Now
                                                    <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                        Virtual Accounts
                    </h3>

                    <SuccessModal
                        isOpen={successModalOpen}
                        onClose={() => setSuccessModalOpen(false)}
                        title={modalContent.title}
                        message={modalContent.message}
                    />

                    {/* Virtual Accounts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-green-600">payments</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">USD Account</span>
                                </div>
                                <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">Active</span>
                            </div>
                            <div className="mb-4">
                                <p className="text-sm border-b border-dashed border-slate-300 dark:border-slate-600 pb-2 mb-2 flex justify-between">
                                    <span className="text-slate-500">Bank:</span>
                                    <span className="font-medium text-slate-900 dark:text-white">Citi Bank</span>
                                </p>
                                <p className="text-sm flex justify-between">
                                    <span className="text-slate-500">Account No:</span>
                                    <span className="font-medium text-slate-900 dark:text-white">0281938192</span>
                                </p>
                            </div>
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-sm text-slate-500 mb-1">Available Balance</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                    {loading ? "..." : `$${wallet?.balanceUSD.toFixed(2) || '0.00'}`}
                                </p>
                            </div>
                        </div>

                        <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-indigo-600">euro</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">GBP Account</span>
                                </div>
                                <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">Active</span>
                            </div>
                            <div className="mb-4">
                                <p className="text-sm border-b border-dashed border-slate-300 dark:border-slate-600 pb-2 mb-2 flex justify-between">
                                    <span className="text-slate-500">Bank:</span>
                                    <span className="font-medium text-slate-900 dark:text-white">Barclays</span>
                                </p>
                                <p className="text-sm flex justify-between">
                                    <span className="text-slate-500">Account No:</span>
                                    <span className="font-medium text-slate-900 dark:text-white">90823901</span>
                                </p>
                            </div>
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-sm text-slate-500 mb-1">Available Balance</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                    {loading ? "..." : `£${wallet?.balanceGBP.toFixed(2) || '0.00'}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mb-8">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">Quick Actions</h4>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleMockDeposit}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">add_circle</span>
                                Mock Deposit ($1k)
                            </button>
                            <button
                                onClick={() => handleAction('Transfer Funds')}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-primary/10 text-primary font-medium rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">swap_horiz</span>
                                Transfer Funds
                            </button>
                            <button
                                onClick={() => handlePayDuties()}
                                className="px-4 py-2 bg-primary/10 text-primary font-medium rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">receipt_long</span>
                                Pay Duties
                            </button>
                            <button
                                onClick={() => setWithdrawModalOpen(true)}
                                className="px-4 py-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">outbox</span>
                                Withdraw Funds
                            </button>
                            <button
                                onClick={() => handleAction('Raise Ticket')}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">support_agent</span>
                                Raise Ticket
                            </button>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">Recent Transactions</h4>
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Date</th>
                                        <th className="px-4 py-3 font-medium">Description</th>
                                        <th className="px-4 py-3 font-medium">Shipment ID</th>
                                        <th className="px-4 py-3 font-medium text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8">
                                                <EmptyState
                                                    title="No transactions found"
                                                    description="Your financial activity will appear here once you start shipping."
                                                    imageSrc="/images/illustrations/logistics_checklist.jpg"
                                                />
                                            </td>
                                        </tr>
                                    ) : transactions.map((txn) => (
                                        <tr key={txn.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                {txn.createdAt ? (txn.createdAt as any).toDate().toLocaleDateString() : 'Pending'}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                                {txn.description}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-500 font-normal capitalize">{txn.type} • {txn.method}</span>
                                                    <StatusPill status={txn.status} className="py-0.5 px-2 scale-90 origin-left" />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {txn.shipmentId ? (
                                                    <span className="inline-flex items-center gap-1 text-primary hover:underline cursor-pointer">
                                                        <span className="material-symbols-outlined text-xs">local_shipping</span>
                                                        {txn.shipmentId}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic">N/A</span>
                                                )}
                                            </td>
                                            <td className={`px-4 py-3 text-right font-medium ${txn.amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                {txn.amount > 0 ? '+' : ''}
                                                {txn.currency === 'USD' ? '$' : '£'}{Math.abs(txn.amount).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

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
                        setModalContent({
                            title: 'Payment Successful',
                            message: 'Your payment was processed successfully and your wallet balance has been updated.'
                        });
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
        </div>
    );
}
