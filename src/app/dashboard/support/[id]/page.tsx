'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
import { ArrowLeft, Loader2, ShieldAlert, Paperclip, Send, Save, Trash2, PlusCircle, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────
   Status + Priority helpers
   Standardized to match the premium dashboard aesthetic
───────────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: Ticket['status'] }) {
    const map: Record<string, { label: string; cls: string; icon: string }> = {
        open: { label: 'Open', cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', icon: 'radio_button_checked' },
        'in-progress': { label: 'In Progress', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400', icon: 'autorenew' },
        resolved: { label: 'Resolved', cls: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400', icon: 'check_circle' },
        closed: { label: 'Closed', cls: 'bg-slate-50 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400', icon: 'lock' },
    };
    const { label, cls, icon } = map[status] ?? map['open'];
    return (
        <span className={cn('inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-medium uppercase tracking-widest', cls)}>
            <span className="material-symbols-outlined text-sm">{icon}</span>
            {label}
        </span>
    );
}

function PriorityBadge({ priority }: { priority: Ticket['priority'] }) {
    const map: Record<string, { label: string; cls: string }> = {
        high: { label: 'High Priority', cls: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' },
        medium: { label: 'Medium Priority', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
        low: { label: 'Low Priority', cls: 'bg-slate-50 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400' },
    };
    const { label, cls } = map[priority] ?? map['medium'];
    return (
        <span className={cn('inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-medium uppercase tracking-widest', cls)}>
            <span className="material-symbols-outlined text-sm">priority_high</span>
            {label}
        </span>
    );
}

/* ─────────────────────────────────────────────────────────────
   Avatar helper
───────────────────────────────────────────────────────────── */
function Avatar({ name, role }: { name: string; role: 'customer' | 'admin' | 'support' }) {
    const initials = name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
    const isAgent = role === 'admin' || role === 'support';

    return (
        <div className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-xs shadow-sm",
            isAgent ? "bg-navy-900 dark:bg-indigo-600" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
        )}>
            {isAgent ? (
                <span className="material-symbols-outlined text-base">support_agent</span>
            ) : initials}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   Message Bubble
───────────────────────────────────────────────────────────── */
function MessageBubble({ msg }: { msg: Message }) {
    const isAgent = msg.senderRole === 'admin' || msg.senderRole === 'staff';
    const time = msg.createdAt
        ? (typeof msg.createdAt === 'string' ? new Date(msg.createdAt) : msg.createdAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        })
        : '';

    return (
        <div className="flex gap-4 group">
            <Avatar name={msg.senderName} role={msg.senderRole as any} />
            <div className="flex-1">
                <div className={cn(
                    'p-5 rounded-2xl border shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)] transition-all',
                    isAgent
                        ? 'bg-blue-50/50 dark:bg-indigo-500/5 border-blue-100 dark:border-indigo-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                )}>
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-900 dark:text-white uppercase tracking-tight">
                                {msg.senderName}
                            </span>
                            {isAgent && (
                                <span className="text-[9px] bg-navy-900 dark:bg-indigo-600 text-white px-1.5 py-0.5 rounded-md uppercase font-medium tracking-widest leading-none">
                                    Support
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{time}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                        {msg.content}
                    </p>

                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-5 flex gap-3 flex-wrap">
                            {msg.attachments.map((url, i) => (
                                <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-primary hover:shadow-md transition-all group/file"
                                >
                                    <span className="material-symbols-outlined text-primary text-lg group-hover/file:scale-110 transition-transform">description</span>
                                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-widest">attachment_{i + 1}</span>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────── */
export default function TicketDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, userProfile } = useAuth();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'staff';

    useEffect(() => {
        async function loadTicket() {
            if (!id || typeof id !== 'string') return;
            try {
                const data = await getTicketById(id);
                setTicket(data);
                if (data && user) markTicketAsRead(id, isAdmin ? 'admin' : 'user');

                // Load draft if exists
                const draft = localStorage.getItem(`ticket_draft_${id}`);
                if (draft) setNewMessage(draft);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadTicket();
    }, [id, user, isAdmin]);

    useEffect(() => {
        if (!id || typeof id !== 'string') return;
        const unsub = subscribeToMessages(id, (msgs) => {
            setMessages(msgs);
        });
        return unsub;
    }, [id]);

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
                senderRole: isAdmin ? 'staff' : 'customer',
                content: newMessage.trim(),
                attachments: [] // Would handle firestore storage upload here in a real app
            });
            setNewMessage('');
            setAttachments([]);
            localStorage.removeItem(`ticket_draft_${ticket.id}`);
        } catch (err) {
            console.error(err);
        } finally {
            setSending(false);
        }
    };

    const handleSaveDraft = () => {
        if (!ticket) return;
        localStorage.setItem(`ticket_draft_${ticket.id}`, newMessage);
        // Toast or simple visual feedback could be added here
    };

    const handleCloseTicket = async () => {
        if (!ticket) return;
        try {
            await updateTicketStatus(ticket.id, 'closed');
            setTicket({ ...ticket, status: 'closed' });
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(Array.from(e.target.files));
        }
    };

    const triggerFilePicker = () => {
        fileInputRef.current?.click();
    };

    /* ── Loading ── */
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-[#0f172a]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    /* ── Not Found ── */
    if (!ticket) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f172a] gap-4">
                <ShieldAlert className="w-16 h-16 text-slate-300 dark:text-slate-600 hover:scale-110 transition-transform" />
                <h3 className="text-xl font-medium text-slate-900 dark:text-white tracking-tight">Ticket not found</h3>
                <Link href="/dashboard/support" className="text-primary hover:underline text-xs font-medium uppercase tracking-widest">
                    ← Back to Support
                </Link>
            </div>
        );
    }

    const createdDate = ticket.createdAt
        ? (typeof ticket.createdAt === 'string' ? new Date(ticket.createdAt) : ticket.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0f172a] scroll-smooth">
            <div className="max-w-7xl mx-auto px-6 py-10">

                {/* Breadcrumbs */}
                <nav className="flex items-center mb-8 text-[10px] font-medium uppercase tracking-widest text-slate-400">
                    <Link href="/dashboard" className="hover:text-primary transition-colors">Support</Link>
                    <span className="mx-3 opacity-30">/</span>
                    <Link href="/dashboard/tickets" className="hover:text-primary transition-colors">Tickets</Link>
                    <span className="mx-3 opacity-30">/</span>
                    <span className="text-slate-900 dark:text-white">#{ticket.id}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">

                    {/* ── Left: Conversation ── */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Ticket Header Card */}
                        <div className="bg-white dark:bg-[#1e293b] p-8 rounded-3xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-white/5 group">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                                <div>
                                    <h2 className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight mb-2">
                                        {ticket.subject}
                                    </h2>
                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                                        Reported by{' '}
                                        <span className="text-slate-600 dark:text-slate-300">
                                            {ticket.userName || 'Customer'}
                                        </span>{' '}
                                        • {createdDate}
                                    </p>
                                </div>
                                {ticket.status !== 'closed' && (
                                    <button
                                        onClick={handleCloseTicket}
                                        className="bg-navy-900 dark:bg-indigo-600 text-white hover:opacity-90 px-6 py-2.5 rounded-xl font-medium text-xs uppercase tracking-widest transition-all shadow-lg shadow-navy-900/10"
                                    >
                                        Close Ticket
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <StatusBadge status={ticket.status} />
                                <PriorityBadge priority={ticket.priority} />
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400 text-[10px] font-medium uppercase tracking-widest">
                                    <span className="material-symbols-outlined text-sm">inventory_2</span>
                                    {ticket.category || 'General'}
                                </span>
                            </div>
                        </div>

                        {/* Conversation Thread */}
                        <div className="space-y-8">
                            {messages.length === 0 ? (
                                <div className="bg-white dark:bg-[#1e293b] p-12 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400">
                                    <span className="material-symbols-outlined text-5xl mb-4 block animate-bounce">chat_bubble</span>
                                    <p className="text-xs font-medium uppercase tracking-widest">Awaiting interaction</p>
                                    <p className="text-[10px] mt-1">Start the conversation below.</p>
                                </div>
                            ) : (
                                messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply Editor */}
                        {ticket.status !== 'closed' ? (
                            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-100 dark:border-white/5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] overflow-hidden">
                                {/* Toolbar */}
                                <div className="flex items-center border-b border-slate-50 dark:border-white/5 p-4 gap-2 bg-slate-50/50 dark:bg-white/5">
                                    {['format_bold', 'format_italic', 'link', 'format_list_bulleted'].map((icon) => (
                                        <button
                                            key={icon}
                                            type="button"
                                            className="w-8 h-8 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-primary"
                                        >
                                            <span className="material-symbols-outlined text-lg">{icon}</span>
                                        </button>
                                    ))}
                                    <div className="flex-grow" />
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        multiple
                                        onChange={handleFileChange}
                                    />
                                    <button
                                        type="button"
                                        onClick={triggerFilePicker}
                                        className={cn(
                                            "w-8 h-8 flex items-center justify-center rounded-lg transition-all",
                                            attachments.length > 0 ? "bg-primary/10 text-primary" : "text-slate-400 hover:text-primary hover:bg-white"
                                        )}
                                    >
                                        <span className="material-symbols-outlined text-lg">attach_file</span>
                                    </button>
                                </div>

                                {/* Textarea */}
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder="Type your response here..."
                                    rows={6}
                                    className="w-full p-6 min-h-[180px] bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 resize-none outline-none leading-relaxed"
                                />

                                {attachments.length > 0 && (
                                    <div className="px-6 pb-4 flex flex-wrap gap-2">
                                        {attachments.map((f, i) => (
                                            <div key={i} className="flex items-center gap-2 px-2 py-1 bg-slate-50 dark:bg-white/5 rounded-md border border-slate-100 dark:border-white/5 text-[9px] font-medium uppercase tracking-widest text-slate-500">
                                                <span className="truncate max-w-[100px]">{f.name}</span>
                                                <button onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}>
                                                    <span className="material-symbols-outlined text-[10px] hover:text-rose-500">close</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="p-5 flex justify-end gap-3 border-t border-slate-50 dark:border-white/5">
                                    <button
                                        type="button"
                                        onClick={handleSaveDraft}
                                        className="px-6 py-2.5 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-xl font-medium text-[10px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                                    >
                                        Save Draft
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSend}
                                        disabled={sending || !newMessage.trim()}
                                        className="px-8 py-2.5 bg-primary text-white rounded-xl font-medium text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {sending && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                                        Send Reply
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-100 dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-white/5 p-10 text-center">
                                <p className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-4">Conversation Concluded</p>
                                <Link
                                    href="/dashboard/support"
                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-medium text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90"
                                >
                                    <PlusCircle className="w-4 h-4" />
                                    Open New Ticket
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* ── Right: Sidebar ── */}
                    <div className="space-y-8">

                        {/* Ticket Info */}
                        <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-white/5 overflow-hidden">
                            <div className="p-6 border-b border-slate-50 dark:border-white/5 flex items-center gap-3">
                                <LayoutGrid className="w-4 h-4 text-primary" />
                                <h3 className="font-medium text-slate-900 dark:text-white uppercase text-[10px] tracking-widest">
                                    Ticket Intelligence
                                </h3>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[9px] text-slate-400 uppercase font-medium tracking-widest">Ticket ID</span>
                                    <span className="text-sm font-medium text-slate-900 dark:text-blue-300 tracking-tight">
                                        #{ticket.id}
                                    </span>
                                </div>

                                {ticket.shipmentId && (
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[9px] text-slate-400 uppercase font-medium tracking-widest">Related Entity</span>
                                        <Link
                                            href={`/dashboard/shipments/${ticket.shipmentId}`}
                                            className="group flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-primary/30 transition-all"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-medium uppercase text-slate-400">Shipment</span>
                                                <span className="text-xs font-medium text-slate-900 dark:text-white group-hover:text-primary transition-colors">{ticket.shipmentId}</span>
                                            </div>
                                            <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">open_in_new</span>
                                        </Link>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] text-slate-400 uppercase font-medium tracking-widest">Category</span>
                                        <span className="text-xs font-medium text-slate-900 dark:text-white capitalize">
                                            {ticket.category || 'General'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] text-slate-400 uppercase font-medium tracking-widest">Created</span>
                                        <span className="text-xs font-medium text-slate-900 dark:text-white">{createdDate}</span>
                                    </div>
                                </div>

                                {isAdmin && (
                                    <div className="flex flex-col gap-2 pt-4 border-t border-slate-50 dark:border-white/5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] text-slate-400 uppercase font-medium tracking-widest">SLA Compliance</span>
                                            <span className="text-[9px] font-medium text-emerald-500 uppercase tracking-widest">Active</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                                            <div className="bg-primary h-full w-[85%] rounded-full shadow-[0_0_10px_rgba(37,99,235,0.3)]" />
                                        </div>
                                        <span className="text-[8px] font-medium text-slate-400 uppercase tracking-widest text-center">Response due in 2h 15m</span>
                                    </div>
                                )}

                                {/* Admin: Status Control */}
                                {isAdmin && ticket.status !== 'closed' && (
                                    <div className="pt-4 border-t border-slate-50 dark:border-white/5">
                                        <span className="text-[9px] text-slate-400 uppercase font-medium tracking-widest mb-3 block text-center">Operator Controls</span>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(['open', 'in-progress', 'resolved', 'closed'] as const).map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={async () => {
                                                        await updateTicketStatus(ticket.id, s);
                                                        setTicket({ ...ticket, status: s });
                                                    }}
                                                    className={cn(
                                                        'px-2 py-2 rounded-xl text-[9px] font-medium uppercase tracking-widest transition-all',
                                                        ticket.status === s
                                                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                            : 'bg-slate-50 dark:bg-white/5 text-slate-400 hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20'
                                                    )}
                                                >
                                                    {s.replace('-', ' ')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Participants */}
                        {isAdmin && (
                            <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-white/5 overflow-hidden">
                                <div className="p-6 border-b border-slate-50 dark:border-white/5 flex justify-between items-center">
                                    <h3 className="font-medium text-slate-900 dark:text-white uppercase text-[10px] tracking-widest">
                                        Network Stakeholders
                                    </h3>
                                    <button className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-primary hover:bg-white transition-all">
                                        <span className="material-symbols-outlined text-sm">person_add</span>
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    {/* Customer */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 font-medium text-[10px]">
                                            {(ticket.userName || 'C').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-slate-900 dark:text-white tracking-tight">
                                                {ticket.userName || 'Customer'}
                                            </span>
                                            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Client</span>
                                        </div>
                                    </div>
                                    {/* Support Agent */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-navy-900 dark:bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
                                            <span className="material-symbols-outlined text-xs">support_agent</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-slate-900 dark:text-white tracking-tight">Support Node</span>
                                            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Operator</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-white/5 overflow-hidden p-2">
                            <div className="space-y-1">
                                <Link
                                    href="/dashboard/tickets"
                                    className="flex items-center gap-3 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 group transition-all"
                                >
                                    <div className="w-8 h-8 flex items-center justify-center bg-slate-50 dark:bg-white/5 rounded-xl text-slate-400 group-hover:text-primary transition-colors">
                                        <ArrowLeft className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">
                                        Return to Nexus
                                    </span>
                                </Link>
                                <Link
                                    href="/dashboard/support"
                                    className="flex items-center gap-3 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 group transition-all"
                                >
                                    <div className="w-8 h-8 flex items-center justify-center bg-slate-50 dark:bg-white/5 rounded-xl text-slate-400 group-hover:text-emerald-500 transition-colors">
                                        <PlusCircle className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">
                                        Initialize New Ticket
                                    </span>
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
