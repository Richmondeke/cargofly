'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createTicket, Ticket } from '@/lib/ticket-service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ArrowLeft, Send } from 'lucide-react';

export default function NewTicketPage() {
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        subject: '',
        category: 'general' as Ticket['category'],
        priority: 'medium' as Ticket['priority'],
        description: '',
        shipmentId: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            const ticketId = await createTicket({
                userId: user.uid,
                userEmail: user.email || '',
                userName: userProfile?.displayName || user.displayName || 'Customer',
                subject: form.subject,
                category: form.category,
                priority: form.priority,
                description: form.description,
                shipmentId: form.shipmentId || undefined,
            });
            router.push(`/dashboard/support/${ticketId}`);
        } catch (error) {
            console.error('Error creating ticket:', error);
            alert('Failed to create ticket. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 h-full bg-slate-50 dark:bg-background-dark">
            {/* Header */}
            <div className="mb-8">
                <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="mb-4 -ml-2"
                >
                    <Link href="/dashboard/support" className="flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Support
                    </Link>
                </Button>
                <div className="mt-2">
                    <h1 className="text-2xl sm:text-[32px] font-bold text-[#1e293b] dark:text-white leading-tight">New Ticket</h1>
                    <p className="text-[14px] text-[#64748b] dark:text-slate-400 mt-1">Describe your issue and we&apos;ll help you out</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="max-w-3xl">
                <Card className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle>Ticket Details</CardTitle>
                        <CardDescription>Fill in the details below to open a new support request.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6-pt-4">
                        {/* Subject */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Subject *
                            </label>
                            <Input
                                type="text"
                                required
                                value={form.subject}
                                onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                                placeholder="Brief description of your issue"
                            />
                        </div>

                        {/* Category & Priority */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Category
                                </label>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Category
                                    </label>
                                    <Select
                                        value={form.category}
                                        onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value as any }))}
                                    >
                                        <option value="general">General Inquiry</option>
                                        <option value="shipment">Shipment Issue</option>
                                        <option value="payment">Payment/Billing</option>
                                        <option value="duties">Customs & Duties</option>
                                        <option value="tracking">Tracking Help</option>
                                        <option value="claims">Shipping Claims</option>
                                        <option value="technical">Technical Problem</option>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Priority
                                </label>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Priority
                                    </label>
                                    <Select
                                        value={form.priority}
                                        onChange={(e) => setForm(prev => ({ ...prev, priority: e.target.value as typeof form.priority }))}
                                    >
                                        <option value="low">🟢 Low</option>
                                        <option value="medium">🟡 Medium</option>
                                        <option value="high">🔴 High</option>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Shipment ID (optional) */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Related Shipment ID (optional)
                            </label>
                            <Input
                                type="text"
                                value={form.shipmentId}
                                onChange={(e) => setForm(prev => ({ ...prev, shipmentId: e.target.value }))}
                                placeholder="e.g. SHP-1234"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Description *
                            </label>
                            <Textarea
                                required
                                rows={6}
                                value={form.description}
                                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Please describe your issue in detail..."
                                className="resize-none"
                            />
                        </div>

                        {/* Submit */}
                        <div className="flex gap-4 pt-4">
                            <Button
                                variant="ghost"
                                className="flex-1"
                                onClick={() => router.push('/dashboard/support')}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || !form.subject || !form.description}
                                loading={loading}
                                leftIcon={<Send className="w-4 h-4" />}
                                className="flex-1"
                            >
                                Submit Ticket
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
