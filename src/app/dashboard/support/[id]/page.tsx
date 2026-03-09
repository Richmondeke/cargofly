'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    getTicketById,
    subscribeToMessages,
    addMessage,
    markTicketAsRead,
    Ticket,
    Message,
    updateTicketStatus
} from '@/lib/ticket-service';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Send, Truck, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TicketDetailPage() {
    const { id } = useParams();
    const { user, userProfile } = useAuth();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function loadTicket() {
            if (!id || typeof id !== 'string') return;
            try {
                const data = await getTicketById(id);
                setTicket(data);
                // Mark as read
                if (data && user) {
                    markTicketAsRead(id, 'user');
                }
            } catch (error) {
                console.error('Error loading ticket:', error);
            } finally {
                setLoading(false);
            }
        }
        loadTicket();
    }, [id, user]);

    // Subscribe to messages
    useEffect(() => {
        if (!id || typeof id !== 'string') return;

        const unsubscribe = subscribeToMessages(id, (msgs) => {
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [id]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || !user || !ticket) return;

        setSending(true);
        try {
            await addMessage(ticket.id, {
                senderId: user.uid,
                senderName: userProfile?.displayName || user.displayName || 'Customer',
                senderRole: 'customer',
                content: newMessage.trim(),
            });
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!ticket) return;
        try {
            await updateTicketStatus(ticket.id, newStatus as any);
            setTicket({ ...ticket, status: newStatus as any });
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-background-dark">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-background-dark">
                <ShieldAlert className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Ticket not found</h3>
                <Link href="/dashboard/support" className="text-primary hover:underline">
                    Back to Support
                </Link>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-background-dark">
            {/* Header */}
            <div className="flex-shrink-0 p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark">
                <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="mb-3 -ml-2 text-slate-500 hover:text-primary"
                >
                    <Link href="/dashboard/support" className="flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Tickets
                    </Link>
                </Button>
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-mono font-bold text-slate-400">#{ticket.id}</span>
                            <StatusPill
                                status={ticket.status}
                                interactive={userProfile?.role === 'admin'}
                                onStatusChange={handleStatusChange}
                            />
                        </div>
                        <h1 className="text-2xl sm:text-[32px] font-bold text-[#1e293b] dark:text-white leading-tight">{ticket.subject}</h1>
                        <p className="text-[14px] text-[#64748b] dark:text-slate-400 mt-1">
                            <span className="capitalize">{ticket.category}</span> • Created {ticket.createdAt?.toLocaleDateString()}
                        </p>
                    </div>
                    {ticket.shipmentId && (
                        <Button
                            variant="link"
                            size="sm"
                            asChild
                            className="text-primary font-bold"
                        >
                            <Link href={`/dashboard/shipments/${ticket.shipmentId}`} className="flex items-center gap-2">
                                <Truck className="w-4 h-4" />
                                {ticket.shipmentId}
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex flex-col ${msg.senderRole === 'customer' ? 'items-end' : 'items-start'}`}
                    >
                        <div
                            className={cn(
                                "max-w-[80%] rounded-2xl px-5 py-3 shadow-sm",
                                msg.senderRole === 'customer'
                                    ? "bg-primary text-white shadow-lg shadow-primary/20 rounded-tr-none"
                                    : "bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-tl-none"
                            )}
                        >
                            {msg.senderRole === 'admin' && (
                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary mb-2">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Support Agent
                                </div>
                            )}
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                            {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {msg.attachments.map((url, i) => (
                                        <a
                                            key={url}
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block h-20 w-20 rounded-lg overflow-hidden border border-white/20 hover:scale-105 transition-transform"
                                        >
                                            <img src={url} alt="attachment" className="h-full w-full object-cover" />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={cn(
                            "flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400 font-bold tracking-tight uppercase",
                            msg.senderRole === 'customer' ? "flex-row-reverse" : "flex-row"
                        )}>
                            <span>{msg.createdAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {msg.senderRole === 'customer' && (
                                <span className={cn("flex items-center gap-0.5", msg.seen ? "text-primary font-black" : "text-slate-300 font-medium")}>
                                    {msg.seen ? "Seen" : "Sent"}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {ticket.status !== 'closed' && (
                <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark">
                    <div className="flex gap-3 max-w-5xl mx-auto">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder="Type your message..."
                            className="flex-1 px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        />
                        <Button
                            onClick={handleSend}
                            disabled={sending || !newMessage.trim()}
                            loading={sending}
                            className="px-8 rounded-2xl"
                            rightIcon={<Send className="w-4 h-4" />}
                        >
                            Send
                        </Button>
                    </div>
                </div>
            )}

            {ticket.status === 'closed' && (
                <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-center text-slate-500">
                    This ticket has been closed.
                    <Link href="/dashboard/support/new" className="text-primary hover:underline ml-1">
                        Open a new ticket
                    </Link>
                </div>
            )}
        </div>
    );
}
