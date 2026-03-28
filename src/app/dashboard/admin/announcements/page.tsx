"use client";

import { useState, useEffect } from "react";
import {
    getAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    Announcement,
    CreateAnnouncementData
} from "@/lib/announcement-service";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2, Edit, AlertCircle, RefreshCw, Megaphone, Bell, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import toast from "react-hot-toast";
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { SuccessModal } from '@/components/common/SuccessModal';

const ANNOUNCEMENT_TYPES = [
    { value: 'info', label: 'Information', icon: <Info className="w-4 h-4 text-blue-500" /> },
    { value: 'warning', label: 'Warning', icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> },
    { value: 'urgent', label: 'Urgent', icon: <AlertCircle className="w-4 h-4 text-red-500" /> },
    { value: 'success', label: 'Success', icon: <CheckCircle className="w-4 h-4 text-emerald-500" /> },
];

export default function AdminAnnouncementsPage() {
    const { userProfile } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);

    // Create / Edit State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentAnnouncement, setCurrentAnnouncement] = useState<Partial<Announcement> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [successModal, setSuccessModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'success' | 'error';
        onConfirm?: () => void;
        confirmLabel?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'success'
    });

    useEffect(() => {
        if (userProfile?.role === 'admin') {
            loadAnnouncements();
        }
    }, [userProfile]);

    const loadAnnouncements = async () => {
        try {
            setLoading(true);
            const fetched = await getAnnouncements(false); // Fetch all, not just active
            setAnnouncements(fetched);
        } catch (error) {
            console.error("Error loading announcements:", error);
            toast.error("Failed to load announcements");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!announcementToDelete) return;

        try {
            setIsDeleting(true);
            await deleteAnnouncement(announcementToDelete);
            toast.success("Announcement deleted");
            setAnnouncements(announcements.filter(a => a.id !== announcementToDelete));
            setAnnouncementToDelete(null);
        } catch (error) {
            console.error("Error deleting announcement:", error);
            toast.error("Failed to delete announcement");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSave = async () => {
        if (!currentAnnouncement?.title || !currentAnnouncement?.content || !currentAnnouncement?.type) {
            toast.error("Title, content, and type are required");
            return;
        }

        try {
            setIsSaving(true);
            const data: CreateAnnouncementData = {
                title: currentAnnouncement.title,
                content: currentAnnouncement.content,
                type: currentAnnouncement.type as Announcement['type'],
                active: currentAnnouncement.active ?? true,
                link: currentAnnouncement.link,
                expiresAt: currentAnnouncement.expiresAt ? new Date(currentAnnouncement.expiresAt) : undefined
            };

            if (currentAnnouncement.id) {
                await updateAnnouncement(currentAnnouncement.id, data);
                toast.success("Announcement updated successfully");
            } else {
                await createAnnouncement(data);
                toast.success("Announcement created successfully");
            }
            setIsModalOpen(false);
            setCurrentAnnouncement(null);
            await loadAnnouncements();
        } catch (error) {
            console.error("Error saving announcement:", error);
            toast.error("Failed to save announcement");
        } finally {
            setIsSaving(false);
        }
    };

    if (userProfile?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-navy-900 dark:text-white">Access Denied</h2>
                <p className="text-gray-500 dark:text-slate-400 mt-2">You must be an administrator to view this page.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-8 h-full bg-slate-50 dark:bg-background-dark">
            <div className="max-w-7xl mx-auto">
                <DashboardHeader
                    title="Announcement Management"
                    subtitle="Manage high-priority messages shown on user dashboards."
                >
                    <Button
                        variant="premium"
                        className="rounded-xl"
                        leftIcon={<Plus className="w-5 h-5" />}
                        onClick={() => {
                            setCurrentAnnouncement({ title: '', content: '', type: 'info', active: true });
                            setIsModalOpen(true);
                        }}
                    >
                        New Announcement
                    </Button>
                </DashboardHeader>

                {loading ? (
                    <Card variant="flat" className="border-dashed bg-transparent">
                        <CardContent className="p-12 flex flex-col items-center justify-center text-slate-400">
                            <RefreshCw className="w-8 h-8 animate-spin mb-4" />
                            <p className="text-sm font-medium">Loading announcements...</p>
                        </CardContent>
                    </Card>
                ) : announcements.length === 0 ? (
                    <Card variant="default" className="text-center">
                        <CardContent className="p-16 flex flex-col items-center">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                                <Megaphone className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Announcements</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">Create your first announcement to reach all users on their dashboard.</p>
                            <Button
                                variant="premium"
                                className="rounded-xl"
                                onClick={() => {
                                    setCurrentAnnouncement({ title: '', content: '', type: 'info', active: true });
                                    setIsModalOpen(true);
                                }}
                            >
                                Create Announcement
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4">Title & Content</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Created</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {announcements.map((ann) => (
                                        <tr key={ann.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-5 max-w-md">
                                                <div className="font-bold text-slate-900 dark:text-white mb-1">{ann.title}</div>
                                                <div className="text-xs text-slate-500 line-clamp-1">{ann.content}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    {ANNOUNCEMENT_TYPES.find(t => t.value === ann.type)?.icon}
                                                    <span className="capitalize text-slate-600 dark:text-slate-400 font-medium">{ann.type}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <StatusPill status={ann.active ? 'success' : 'inactive'} />
                                            </td>
                                            <td className="px-6 py-5 text-slate-500">
                                                {ann.createdAt.toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-8 h-8 text-slate-400 hover:text-primary transition-colors"
                                                        onClick={() => {
                                                            setCurrentAnnouncement(ann);
                                                            setIsModalOpen(true);
                                                        }}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setSuccessModal({
                                                                isOpen: true,
                                                                title: 'Delete Announcement',
                                                                message: 'Are you sure you want to delete this announcement?',
                                                                type: 'error',
                                                                confirmLabel: 'Delete',
                                                                onConfirm: () => {
                                                                    setAnnouncementToDelete(ann.id);
                                                                    handleDelete();
                                                                }
                                                            });
                                                        }}
                                                        className="w-8 h-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* Success/Confirmation Modal */}
                <SuccessModal
                    isOpen={successModal.isOpen}
                    onClose={() => setSuccessModal(prev => ({ ...prev, isOpen: false }))}
                    title={successModal.title}
                    message={successModal.message}
                    type={successModal.type}
                    onConfirm={successModal.onConfirm}
                    confirmLabel={successModal.confirmLabel}
                />

                {/* Edit Modal */}
                {isModalOpen && currentAnnouncement && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <Card className="w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200">
                            <CardContent className="p-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                                    {currentAnnouncement.id ? 'Edit Announcement' : 'New Announcement'}
                                </h3>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Title</Label>
                                        <Input
                                            value={currentAnnouncement.title || ''}
                                            onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, title: e.target.value })}
                                            placeholder="System Update, Scheduled Maintenance, etc."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <select
                                            className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            value={currentAnnouncement.type || 'info'}
                                            onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, type: e.target.value as any })}
                                        >
                                            {ANNOUNCEMENT_TYPES.map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Content (Markdown supported)</Label>
                                        <Textarea
                                            value={currentAnnouncement.content || ''}
                                            onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, content: e.target.value })}
                                            placeholder="Details of the announcement..."
                                            rows={4}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Call to Action Link (Optional)</Label>
                                        <Input
                                            value={currentAnnouncement.link || ''}
                                            onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, link: e.target.value })}
                                            placeholder="https://..."
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 pt-2">
                                        <input
                                            type="checkbox"
                                            id="active"
                                            checked={currentAnnouncement.active || false}
                                            onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, active: e.target.checked })}
                                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                                        />
                                        <Label htmlFor="active" className="font-bold cursor-pointer">Active & Visible</Label>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-8">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsModalOpen(false);
                                            setCurrentAnnouncement(null);
                                        }}
                                        disabled={isSaving}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="premium"
                                        onClick={handleSave}
                                        loading={isSaving}
                                    >
                                        {currentAnnouncement.id ? 'Save Changes' : 'Create'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
