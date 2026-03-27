'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserSettings, updateUserSettings, getTeamMembers, inviteTeamMember, TeamMember } from '@/lib/dashboard-service';
import RiveAnimation from '@/components/ui/RiveAnimation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserPlus } from 'lucide-react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
    requestPushPermission,
    getNotificationPermission,
    isPushSupported,
    onForegroundMessage,
    showNotificationToast
} from '@/lib/push-notifications';
import {
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    multiFactor,
    PhoneAuthProvider,
    PhoneMultiFactorGenerator,
    RecaptchaVerifier
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import SuccessModal from "@/components/ui/SuccessModal";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Invite Modal (unchanged)                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */
function InviteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<TeamMember['role']>('staff');
    const [department, setDepartment] = useState('Operations');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const result = await inviteTeamMember(email, role, department);
            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setError(result.message);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to invite user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md shadow-2xl border-none">
                <CardHeader>
                    <CardTitle>Invite Team Member</CardTitle>
                    <CardDescription>Send an invitation to join your team.</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 tracking-tight">Email Address</label>
                            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@example.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 tracking-tight">Role</label>
                            <Select value={role} onChange={(e) => setRole(e.target.value as any)}>
                                <option value="staff">Staff</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 tracking-tight">Department</label>
                            <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
                                <option value="Operations">Operations</option>
                                <option value="Finance">Finance</option>
                                <option value="Logistics">Logistics</option>
                                <option value="IT">IT</option>
                                <option value="Customer Support">Customer Support</option>
                            </Select>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
                            <Button type="submit" loading={loading} className="flex-1">Send Invite</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Main Page                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */
type SettingsSection = 'profile' | 'company' | 'notifications' | 'security' | 'team';

export default function SettingsPage() {
    const { user, userProfile } = useAuth();
    const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pushStatus, setPushStatus] = useState<'checking' | 'unsupported' | 'denied' | 'granted' | 'default'>('checking');
    const [enablingPush, setEnablingPush] = useState(false);

    // Success Modal
    const [successModal, setSuccessModal] = useState({ isOpen: false, title: '', message: '' });

    // Security modals
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
    const [passwordError, setPasswordError] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [twoFactorStep, setTwoFactorStep] = useState<'phone' | 'verify'>('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [verificationId, setVerificationId] = useState('');
    const [twoFactorLoading, setTwoFactorLoading] = useState(false);
    const [twoFactorError, setTwoFactorError] = useState('');

    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        phone: '',
        company: '',
        location: '',
        timezone: 'UTC',
        notifications: { email: true, sms: false, push: true },
    });

    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [teamLoading, setTeamLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    /* ── data loading ── */
    const loadTeam = async () => {
        if (userProfile?.role === 'admin') {
            setTeamLoading(true);
            try {
                const data = await getTeamMembers();
                setTeamMembers(data);
            } catch (error) {
                console.error('Error loading team members:', error);
            } finally {
                setTeamLoading(false);
            }
        } else {
            setTeamLoading(false);
        }
    };

    useEffect(() => { loadTeam(); }, [userProfile]);

    useEffect(() => {
        async function loadSettings() {
            if (!user) return;
            try {
                const settings = await getUserSettings(user.uid);
                if (settings) {
                    setFormData({
                        displayName: settings.displayName || '',
                        email: settings.email || '',
                        phone: settings.phone || '',
                        company: settings.company || '',
                        location: settings.location || '',
                        timezone: settings.timezone || 'UTC',
                        notifications: settings.notifications || { email: true, sms: false, push: true },
                    });
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            } finally {
                setLoading(false);
            }
        }
        loadSettings();
    }, [user]);

    useEffect(() => {
        async function checkPushStatus() {
            const supported = await isPushSupported();
            if (!supported) { setPushStatus('unsupported'); return; }
            const permission = getNotificationPermission();
            setPushStatus(permission === 'unsupported' ? 'unsupported' : permission);
        }
        checkPushStatus();
    }, []);

    useEffect(() => {
        if (pushStatus !== 'granted') return;
        const unsubscribe = onForegroundMessage((payload) => {
            showNotificationToast(payload.title, payload.body, () => {
                if (payload.data?.shipmentId) window.location.href = `/dashboard/shipments/${payload.data.shipmentId}`;
            });
        });
        return unsubscribe;
    }, [pushStatus]);

    /* ── handlers ── */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('notifications.')) {
            const key = name.split('.')[1] as keyof typeof formData.notifications;
            setFormData(prev => ({ ...prev, notifications: { ...prev.notifications, [key]: (e.target as HTMLInputElement).checked } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await updateUserSettings(user.uid, {
                displayName: formData.displayName,
                phone: formData.phone,
                company: formData.company,
                location: formData.location,
                timezone: formData.timezone,
                notifications: formData.notifications,
            });
            setSuccessModal({ isOpen: true, title: 'Settings Saved', message: 'Your profile settings have been successfully updated.' });
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleEnablePush = async () => {
        if (!user) return;
        setEnablingPush(true);
        try {
            const result = await requestPushPermission(user.uid);
            if (result.success) {
                setPushStatus('granted');
                setFormData(prev => ({ ...prev, notifications: { ...prev.notifications, push: true } }));
            } else {
                setPushStatus('denied');
                alert(result.error || 'Failed to enable push notifications');
            }
        } catch (error) {
            console.error('Error enabling push:', error);
        } finally {
            setEnablingPush(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!user || !user.email) return;
        setPasswordError('');
        if (passwordForm.new.length < 6) { setPasswordError('New password must be at least 6 characters'); return; }
        if (passwordForm.new !== passwordForm.confirm) { setPasswordError('Passwords do not match'); return; }
        setPasswordLoading(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, passwordForm.current);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, passwordForm.new);
            setShowPasswordModal(false);
            setPasswordForm({ current: '', new: '', confirm: '' });
            setSuccessModal({ isOpen: true, title: 'Password Updated', message: 'Your password has been changed successfully.' });
        } catch (error: unknown) {
            const err = error as { code?: string };
            if (err.code === 'auth/wrong-password') {
                setPasswordError('Current password is incorrect');
            } else if (err.code === 'auth/weak-password') {
                setPasswordError('Password is too weak. Use at least 6 characters.');
            } else {
                setPasswordError('Failed to update password. Please try again.');
            }
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleSendVerification = async () => {
        if (!user) return;
        setTwoFactorError('');
        setTwoFactorLoading(true);
        try {
            let formattedPhone = phoneNumber;
            if (!phoneNumber.startsWith('+')) formattedPhone = '+234' + phoneNumber.replace(/^0/, '');
            const recaptchaContainer = document.getElementById('recaptcha-container');
            if (!recaptchaContainer) throw new Error('Recaptcha container not found');
            const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainer, { size: 'invisible' });
            const mfaUser = multiFactor(user);
            const session = await mfaUser.getSession();
            const phoneProvider = new PhoneAuthProvider(auth);
            const verId = await phoneProvider.verifyPhoneNumber({ phoneNumber: formattedPhone, session }, recaptchaVerifier);
            setVerificationId(verId);
            setTwoFactorStep('verify');
        } catch (error: unknown) {
            const err = error as { code?: string; message?: string };
            if (err.code === 'auth/requires-recent-login') {
                setTwoFactorError('Please log out and log back in to enable 2FA');
            } else {
                setTwoFactorError(err.message || 'Failed to send verification code');
            }
        } finally {
            setTwoFactorLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!user) return;
        setTwoFactorError('');
        setTwoFactorLoading(true);
        try {
            const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
            const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
            const mfaUser = multiFactor(user);
            await mfaUser.enroll(multiFactorAssertion, 'Phone Number');
            setTwoFactorEnabled(true);
            setShowTwoFactorModal(false);
            setTwoFactorStep('phone');
            setPhoneNumber('');
            setVerificationCode('');
        } catch (error: unknown) {
            const err = error as { message?: string };
            setTwoFactorError(err.message || 'Invalid verification code');
        } finally {
            setTwoFactorLoading(false);
        }
    };

    /* ── nav items ── */
    const navItems: { id: SettingsSection; label: string; icon: string; adminOnly?: boolean }[] = [
        { id: 'profile', label: 'Personal Info', icon: 'person' },
        { id: 'company', label: 'Company Details', icon: 'business' },
        { id: 'notifications', label: 'Notifications', icon: 'notifications' },
        { id: 'security', label: 'Security', icon: 'shield' },
        ...(userProfile?.role === 'admin' ? [{ id: 'team' as SettingsSection, label: 'Team Members', icon: 'group', adminOnly: true }] : []),
    ];

    /* ── helpers ── */
    const userInitials = formData.displayName
        ? formData.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : formData.email?.charAt(0).toUpperCase() || 'U';

    /* ─────────────────────────────────────────────────────── RENDER ─── */
    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark h-full">
            {/* Modals */}
            {showInviteModal && (
                <InviteModal onClose={() => setShowInviteModal(false)} onSuccess={loadTeam} />
            )}
            <SuccessModal
                isOpen={successModal.isOpen}
                onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
                title={successModal.title}
                message={successModal.message}
            />

            {/* Page outer wrapper – same max-width pattern as other redesigned pages */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <DashboardHeader title="Settings" subtitle="Manage your account and preferences" />

                <div className="mt-6 flex gap-8 items-start">
                    {/* ── LEFT SIDEBAR ── */}
                    <aside className="w-64 shrink-0">
                        {/* Profile Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 mb-4">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary font-medium text-2xl mb-3">
                                    {userInitials}
                                </div>
                                <p className="font-medium text-slate-900 dark:text-white text-sm leading-tight">
                                    {formData.displayName || 'Your Name'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-full">
                                    {formData.email}
                                </p>
                                <span className={`mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${userProfile?.role === 'admin'
                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                    }`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                    {userProfile?.role || 'User'}
                                </span>
                            </div>
                        </div>

                        {/* Nav Items */}
                        <nav className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            {navItems.map((item, idx) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors text-left ${idx !== navItems.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''
                                        } ${activeSection === item.id
                                            ? 'bg-primary/5 text-primary border-l-4 border-l-primary pl-3'
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* ── MAIN CONTENT ── */}
                    <div className="flex-1 min-w-0 space-y-6">

                        {/* ── PERSONAL INFO ── */}
                        {activeSection === 'profile' && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
                                    <h2 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-xl">person</span>
                                        Personal Information
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Update your name and contact details</p>
                                </div>
                                <div className="p-6">
                                    {loading ? (
                                        <div className="space-y-4">
                                            {[1, 2, 3, 4].map(i => <div key={i} className="h-12 w-full bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />)}
                                        </div>
                                    ) : (
                                        <div className="space-y-5">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="displayName">Full Name</Label>
                                                    <Input id="displayName" type="text" name="displayName" value={formData.displayName} onChange={handleChange} placeholder="Your full name" />
                                                </div>
                                                <div>
                                                    <Label htmlFor="email">Email Address</Label>
                                                    <Input id="email" type="email" name="email" value={formData.email} disabled className="bg-slate-100 dark:bg-slate-900 text-slate-500 cursor-not-allowed" />
                                                    <p className="text-xs text-slate-400 mt-1">Email cannot be changed here</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="phone">Phone Number</Label>
                                                    <Input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
                                                </div>
                                                <div>
                                                    <Label htmlFor="location">Location</Label>
                                                    <Input id="location" type="text" name="location" value={formData.location} onChange={handleChange} placeholder="City, Country" />
                                                </div>
                                            </div>
                                            <div>
                                                <Label htmlFor="timezone">Timezone</Label>
                                                <Select id="timezone" name="timezone" value={formData.timezone} onChange={handleChange}>
                                                    <option value="UTC">UTC</option>
                                                    <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                                                    <option value="Europe/London">Europe/London (GMT)</option>
                                                    <option value="America/New_York">America/New_York (EST)</option>
                                                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                                                </Select>
                                            </div>
                                            <div className="flex justify-end pt-2">
                                                <button
                                                    onClick={handleSave}
                                                    disabled={saving || loading}
                                                    className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                                                >
                                                    {saving ? (
                                                        <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>Saving...</>
                                                    ) : (
                                                        <><span className="material-symbols-outlined text-sm">save</span>Save Changes</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── COMPANY DETAILS ── */}
                        {activeSection === 'company' && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
                                    <h2 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-xl">business</span>
                                        Company Details
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your organization details</p>
                                </div>
                                <div className="p-6 space-y-5">
                                    {loading ? (
                                        <div className="space-y-4">
                                            {[1, 2, 3].map(i => <div key={i} className="h-12 w-full bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />)}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="company">Company Name</Label>
                                                    <Input id="company" type="text" name="company" value={formData.company} onChange={handleChange} placeholder="Your company name" />
                                                </div>
                                                <div>
                                                    <Label htmlFor="companyLocation">Business Location</Label>
                                                    <Input id="companyLocation" type="text" name="location" value={formData.location} onChange={handleChange} placeholder="City, Country" />
                                                </div>
                                            </div>
                                            {/* Info card showing current profile role */}
                                            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 flex items-center gap-3">
                                                <span className="material-symbols-outlined text-primary">info</span>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Account type: <span className="capitalize font-medium">{userProfile?.role || 'User'}</span></p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Contact your administrator to update your account role.</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-end pt-2">
                                                <button
                                                    onClick={handleSave}
                                                    disabled={saving || loading}
                                                    className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                                                >
                                                    {saving ? (
                                                        <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>Saving...</>
                                                    ) : (
                                                        <><span className="material-symbols-outlined text-sm">save</span>Save Changes</>
                                                    )}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── NOTIFICATIONS ── */}
                        {activeSection === 'notifications' && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
                                    <h2 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-xl">notifications</span>
                                        Notification Preferences
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Choose how you'd like to be notified</p>
                                </div>
                                <div className="p-6 space-y-4">
                                    {/* Email */}
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl">mail</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white text-sm">Email Notifications</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Receive shipment updates via email</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                name="notifications.email"
                                                checked={formData.notifications.email}
                                                onChange={(e) => handleChange({ target: { name: 'notifications.email', value: e.target.checked } } as unknown as React.ChangeEvent<HTMLInputElement>)}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary" />
                                        </label>
                                    </div>

                                    {/* SMS */}
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-xl">sms</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white text-sm">SMS Notifications</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Receive critical alerts via SMS</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                name="notifications.sms"
                                                checked={formData.notifications.sms}
                                                onChange={(e) => handleChange({ target: { name: 'notifications.sms', value: e.target.checked } } as unknown as React.ChangeEvent<HTMLInputElement>)}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary" />
                                        </label>
                                    </div>

                                    {/* Push */}
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-primary text-xl">notifications_active</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white text-sm">Push Notifications</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Receive in-app push notifications</p>
                                                {pushStatus === 'granted' && (
                                                    <p className="text-xs text-green-600 dark:text-green-400 mt-0.5 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-xs">check_circle</span> Enabled
                                                    </p>
                                                )}
                                                {pushStatus === 'denied' && (
                                                    <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-xs">block</span> Blocked – enable in browser
                                                    </p>
                                                )}
                                                {pushStatus === 'unsupported' && (
                                                    <p className="text-xs text-amber-500 mt-0.5 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-xs">warning</span> Not supported in this browser
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            {pushStatus === 'default' && (
                                                <button
                                                    onClick={handleEnablePush}
                                                    disabled={enablingPush}
                                                    className="px-4 py-2 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                                >
                                                    {enablingPush ? (
                                                        <><span className="material-symbols-outlined animate-spin text-xs">progress_activity</span>Enabling...</>
                                                    ) : (
                                                        <><span className="material-symbols-outlined text-xs">add_alert</span>Enable</>
                                                    )}
                                                </button>
                                            )}
                                            {pushStatus === 'granted' && (
                                                <span className="material-symbols-outlined text-green-500 text-2xl">check_circle</span>
                                            )}
                                            {pushStatus === 'checking' && (
                                                <span className="material-symbols-outlined animate-spin text-slate-400">progress_activity</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2 text-sm"
                                        >
                                            {saving ? (
                                                <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>Saving...</>
                                            ) : (
                                                <><span className="material-symbols-outlined text-sm">save</span>Save Preferences</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── SECURITY ── */}
                        {activeSection === 'security' && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
                                    <h2 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-xl">shield</span>
                                        Security Settings
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your password and account security</p>
                                </div>
                                <div className="p-6 space-y-4">
                                    {/* Password row */}
                                    <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-slate-600 dark:text-slate-300 text-xl">lock</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white text-sm">Password</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Last changed: unknown</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowPasswordModal(true)}
                                            className="px-4 py-2 text-sm font-medium text-primary border border-primary/30 hover:bg-primary/5 rounded-lg transition-colors"
                                        >
                                            Change Password
                                        </button>
                                    </div>

                                    {/* 2FA row */}
                                    <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${twoFactorEnabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-200 dark:bg-slate-600'}`}>
                                                <span className={`material-symbols-outlined text-xl ${twoFactorEnabled ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-300'}`}>
                                                    {twoFactorEnabled ? 'verified_user' : 'security'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white text-sm">Two-Factor Authentication</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {twoFactorEnabled ? '2FA is active – phone verification enabled' : 'Add extra security to your account'}
                                                </p>
                                            </div>
                                        </div>
                                        {twoFactorEnabled ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                <span className="w-1.5 h-1.5 rounded-full bg-current" /> Active
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => setShowTwoFactorModal(true)}
                                                className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                            >
                                                Enable 2FA
                                            </button>
                                        )}
                                    </div>

                                    {/* Sessions info */}
                                    <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-slate-500 dark:text-slate-300 text-xl">devices</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white text-sm">Active Sessions</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Signed in on this device</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-600 px-3 py-1.5 rounded-full">1 device</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── TEAM MEMBERS (admin only) ── */}
                        {activeSection === 'team' && userProfile?.role === 'admin' && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary text-xl">group</span>
                                            Team Members
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your organization's users</p>
                                    </div>
                                    <Button onClick={() => setShowInviteModal(true)} leftIcon={<UserPlus className="w-4 h-4" />} size="sm">
                                        Add Member
                                    </Button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium text-xs border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="px-6 py-4">Member</th>
                                                <th className="px-6 py-4">Role</th>
                                                <th className="px-6 py-4">Department</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {teamLoading ? (
                                                [1, 2, 3].map(i => (
                                                    <tr key={i}>
                                                        <td colSpan={5} className="px-6 py-5">
                                                            <div className="h-6 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : teamMembers.length > 0 ? (
                                                teamMembers.map(member => (
                                                    <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                                                                    {member.displayName.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-slate-900 dark:text-white">{member.displayName}</p>
                                                                    <p className="text-xs text-slate-500">{member.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${member.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                                    : member.role === 'manager' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                                }`}>
                                                                {member.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{member.department}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${member.status === 'active'
                                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                                }`}>
                                                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                                {member.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="relative">
                                                                <button
                                                                    onClick={() => setActiveMenuId(activeMenuId === member.id ? null : member.id)}
                                                                    className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700"
                                                                >
                                                                    <span className="material-symbols-outlined">more_vert</span>
                                                                </button>
                                                                {activeMenuId === member.id && (
                                                                    <div className="absolute right-0 bottom-full mb-2 z-50 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1">
                                                                        <button onClick={() => { alert(`Edit role for ${member.displayName}`); setActiveMenuId(null); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                                                                            <span className="material-symbols-outlined text-lg">edit</span> Edit Role
                                                                        </button>
                                                                        <button onClick={() => { alert(`${member.status === 'active' ? 'Deactivate' : 'Activate'} ${member.displayName}`); setActiveMenuId(null); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                                                                            <span className="material-symbols-outlined text-lg">{member.status === 'active' ? 'person_off' : 'person'}</span>
                                                                            {member.status === 'active' ? 'Deactivate' : 'Activate'}
                                                                        </button>
                                                                        <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                                                                        <button onClick={() => { if (confirm(`Remove ${member.displayName}?`)) alert(`Removed ${member.displayName}`); setActiveMenuId(null); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                                                                            <span className="material-symbols-outlined text-lg">delete</span> Remove
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="w-36 h-36">
                                                                <RiveAnimation src="/icons/empty-state.riv" />
                                                            </div>
                                                            <p className="font-medium">No team members found</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── PASSWORD MODAL ── */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">lock</span>
                            Change Password
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Enter your current password to set a new one.</p>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input id="currentPassword" type="password" value={passwordForm.current} onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))} placeholder="Enter current password" />
                            </div>
                            <div>
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input id="newPassword" type="password" value={passwordForm.new} onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))} placeholder="Enter new password" />
                            </div>
                            <div>
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input id="confirmPassword" type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))} placeholder="Confirm new password" />
                            </div>
                            {passwordError && (
                                <p className="text-red-500 text-sm flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">error</span> {passwordError}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setShowPasswordModal(false); setPasswordForm({ current: '', new: '', confirm: '' }); setPasswordError(''); }}
                                className="flex-1 px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handlePasswordChange}
                                disabled={passwordLoading || !passwordForm.current || !passwordForm.new}
                                className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {passwordLoading ? (
                                    <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>Updating...</>
                                ) : 'Update Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 2FA MODAL ── */}
            {showTwoFactorModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">security</span>
                            Enable Two-Factor Authentication
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                            {twoFactorStep === 'phone' ? "We'll verify your identity via phone." : "Enter the 6-digit code sent to your phone."}
                        </p>

                        {twoFactorStep === 'phone' ? (
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="phoneNumber">Phone Number</Label>
                                    <Input
                                        id="phoneNumber"
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="+234 800 000 0000"
                                    />
                                </div>
                                <div id="recaptcha-container" />
                            </div>
                        ) : (
                            <div>
                                <Label htmlFor="verificationCode">Verification Code</Label>
                                <Input
                                    id="verificationCode"
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="text-center text-2xl tracking-widest"
                                    placeholder="000000"
                                    maxLength={6}
                                />
                            </div>
                        )}

                        {twoFactorError && (
                            <p className="text-red-500 text-sm flex items-center gap-1 mt-3">
                                <span className="material-symbols-outlined text-sm">error</span> {twoFactorError}
                            </p>
                        )}

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setShowTwoFactorModal(false); setTwoFactorStep('phone'); setPhoneNumber(''); setVerificationCode(''); setTwoFactorError(''); }}
                                className="flex-1 px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={twoFactorStep === 'phone' ? handleSendVerification : handleVerifyCode}
                                disabled={twoFactorLoading || (twoFactorStep === 'phone' ? !phoneNumber : verificationCode.length !== 6)}
                                className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {twoFactorLoading ? (
                                    <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>{twoFactorStep === 'phone' ? 'Sending...' : 'Verifying...'}</>
                                ) : (
                                    twoFactorStep === 'phone' ? 'Send Code' : 'Verify & Enable'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
