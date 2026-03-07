'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserSettings, updateUserSettings } from '@/lib/dashboard-service';
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

export default function SettingsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pushStatus, setPushStatus] = useState<'checking' | 'unsupported' | 'denied' | 'granted' | 'default'>('checking');
    const [enablingPush, setEnablingPush] = useState(false);

    // Success Modal State
    const [successModal, setSuccessModal] = useState({
        isOpen: false,
        title: '',
        message: ''
    });

    // Security modals state
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
        notifications: {
            email: true,
            sms: false,
            push: true,
        },
    });

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

    // Check push notification status
    useEffect(() => {
        async function checkPushStatus() {
            const supported = await isPushSupported();
            if (!supported) {
                setPushStatus('unsupported');
                return;
            }
            const permission = getNotificationPermission();
            if (permission === 'unsupported') {
                setPushStatus('unsupported');
            } else {
                setPushStatus(permission);
            }
        }
        checkPushStatus();
    }, []);

    // Listen for foreground messages
    useEffect(() => {
        if (pushStatus !== 'granted') return;

        const unsubscribe = onForegroundMessage((payload) => {
            showNotificationToast(payload.title, payload.body, () => {
                if (payload.data?.shipmentId) {
                    window.location.href = `/dashboard/shipments/${payload.data.shipmentId}`;
                }
            });
        });

        return unsubscribe;
    }, [pushStatus]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('notifications.')) {
            const key = name.split('.')[1] as keyof typeof formData.notifications;
            setFormData(prev => ({
                ...prev,
                notifications: {
                    ...prev.notifications,
                    [key]: (e.target as HTMLInputElement).checked,
                },
            }));
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
            setSuccessModal({
                isOpen: true,
                title: 'Settings Saved',
                message: 'Your profile settings have been successfully updated.'
            });
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
                setFormData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, push: true }
                }));
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

    // Handle password change
    const handlePasswordChange = async () => {
        if (!user || !user.email) return;

        setPasswordError('');

        // Validate passwords
        if (passwordForm.new.length < 6) {
            setPasswordError('New password must be at least 6 characters');
            return;
        }
        if (passwordForm.new !== passwordForm.confirm) {
            setPasswordError('Passwords do not match');
            return;
        }

        setPasswordLoading(true);
        try {
            // Re-authenticate user first
            const credential = EmailAuthProvider.credential(user.email, passwordForm.current);
            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, passwordForm.new);

            // Success
            setShowPasswordModal(false);
            setPasswordForm({ current: '', new: '', confirm: '' });
            setSuccessModal({
                isOpen: true,
                title: 'Password Updated',
                message: 'Your password has been changed successfully. Please login again next session.'
            });
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

    // Handle 2FA phone verification
    const handleSendVerification = async () => {
        if (!user) return;

        setTwoFactorError('');
        setTwoFactorLoading(true);

        try {
            // Format phone number
            let formattedPhone = phoneNumber;
            if (!phoneNumber.startsWith('+')) {
                formattedPhone = '+234' + phoneNumber.replace(/^0/, '');
            }

            // Create recaptcha verifier
            const recaptchaContainer = document.getElementById('recaptcha-container');
            if (!recaptchaContainer) throw new Error('Recaptcha container not found');

            const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainer, {
                size: 'invisible',
            });

            // Get multi-factor session
            const mfaUser = multiFactor(user);
            const session = await mfaUser.getSession();

            // Send verification code
            const phoneProvider = new PhoneAuthProvider(auth);
            const verId = await phoneProvider.verifyPhoneNumber(
                { phoneNumber: formattedPhone, session },
                recaptchaVerifier
            );

            setVerificationId(verId);
            setTwoFactorStep('verify');
        } catch (error: unknown) {
            const err = error as { code?: string; message?: string };
            console.error('2FA error:', err);
            if (err.code === 'auth/requires-recent-login') {
                setTwoFactorError('Please log out and log back in to enable 2FA');
            } else {
                setTwoFactorError(err.message || 'Failed to send verification code');
            }
        } finally {
            setTwoFactorLoading(false);
        }
    };

    // Handle 2FA code verification
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

    return (
        <div className="flex-1 overflow-y-auto p-8 h-full bg-slate-50 dark:bg-background-dark">
            <SuccessModal
                isOpen={successModal.isOpen}
                onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
                title={successModal.title}
                message={successModal.message}
            />

            {/* Header */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your account and preferences</p>
            </div>

            <div className="max-w-3xl space-y-8">
                {/* Profile Section */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">person</span>
                        Profile Information
                    </h3>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-12 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="displayName">Full Name</Label>
                                    <Input
                                        id="displayName"
                                        type="text"
                                        name="displayName"
                                        value={formData.displayName}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        disabled
                                        className="bg-slate-100 dark:bg-slate-900 text-slate-500 cursor-not-allowed border-slate-200 dark:border-slate-700"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="company">Company</Label>
                                    <Input
                                        id="company"
                                        type="text"
                                        name="company"
                                        value={formData.company}
                                        onChange={handleChange}
                                        placeholder="Your company name"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="City, State, Country"
                                />
                            </div>
                            <div>
                                <Label htmlFor="timezone">Timezone</Label>
                                <Select
                                    id="timezone"
                                    name="timezone"
                                    value={formData.timezone}
                                    onChange={handleChange}
                                >
                                    <option value="UTC">UTC</option>
                                    <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                                    <option value="Europe/London">Europe/London (GMT)</option>
                                    <option value="America/New_York">America/New_York (EST)</option>
                                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                                </Select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Notifications Section */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">notifications</span>
                        Notification Preferences
                    </h3>

                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">Email Notifications</p>
                                <p className="text-sm text-slate-500">Receive shipment updates via email</p>
                            </div>
                            <Checkbox
                                name="notifications.email"
                                checked={formData.notifications.email}
                                onChange={(e) => handleChange({ target: { name: 'notifications.email', value: e.target.checked } } as unknown as React.ChangeEvent<HTMLInputElement>)}
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">SMS Notifications</p>
                                <p className="text-sm text-slate-500">Receive critical alerts via SMS</p>
                            </div>
                            <Checkbox
                                name="notifications.sms"
                                checked={formData.notifications.sms}
                                onChange={(e) => handleChange({ target: { name: 'notifications.sms', value: e.target.checked } } as unknown as React.ChangeEvent<HTMLInputElement>)}
                            />
                        </label>

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">Push Notifications</p>
                                <p className="text-sm text-slate-500">Receive in-app push notifications</p>
                                {pushStatus === 'granted' && (
                                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">check_circle</span>
                                        Push notifications enabled
                                    </p>
                                )}
                                {pushStatus === 'denied' && (
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">block</span>
                                        Permission denied - enable in browser settings
                                    </p>
                                )}
                                {pushStatus === 'unsupported' && (
                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">warning</span>
                                        Not supported in this browser
                                    </p>
                                )}
                            </div>
                            {pushStatus === 'default' && (
                                <button
                                    onClick={handleEnablePush}
                                    disabled={enablingPush}
                                    className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {enablingPush ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                            Enabling...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-sm">notifications_active</span>
                                            Enable
                                        </>
                                    )}
                                </button>
                            )}
                            {pushStatus === 'granted' && (
                                <span className="material-symbols-outlined text-green-500 text-2xl">notifications_active</span>
                            )}
                            {pushStatus === 'checking' && (
                                <span className="material-symbols-outlined animate-spin text-slate-400">progress_activity</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Security Section */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">shield</span>
                        Security
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">Password</p>
                                <p className="text-sm text-slate-500">Update your account password</p>
                            </div>
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            >
                                Change Password
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">Two-Factor Authentication</p>
                                <p className="text-sm text-slate-500">
                                    {twoFactorEnabled ? 'Phone verification enabled' : 'Add an extra layer of security'}
                                </p>
                                {twoFactorEnabled && (
                                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">verified_user</span>
                                        2FA is active
                                    </p>
                                )}
                            </div>
                            {twoFactorEnabled ? (
                                <span className="material-symbols-outlined text-green-500 text-2xl">verified_user</span>
                            ) : (
                                <button
                                    onClick={() => setShowTwoFactorModal(true)}
                                    className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    Enable 2FA
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Password Change Modal */}
                {showPasswordModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-surface-dark rounded-2xl max-w-md w-full p-6 shadow-2xl">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">lock</span>
                                Change Password
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="currentPassword">
                                        Current Password
                                    </Label>
                                    <Input
                                        id="currentPassword"
                                        type="password"
                                        value={passwordForm.current}
                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                                        placeholder="Enter current password"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="newPassword">
                                        New Password
                                    </Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={passwordForm.new}
                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                                        placeholder="Enter new password"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="confirmPassword">
                                        Confirm New Password
                                    </Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={passwordForm.confirm}
                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                                        placeholder="Confirm new password"
                                    />
                                </div>

                                {passwordError && (
                                    <p className="text-red-500 text-sm flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">error</span>
                                        {passwordError}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setPasswordForm({ current: '', new: '', confirm: '' });
                                        setPasswordError('');
                                    }}
                                    className="flex-1 px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePasswordChange}
                                    disabled={passwordLoading || !passwordForm.current || !passwordForm.new}
                                    className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {passwordLoading ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                            Updating...
                                        </>
                                    ) : (
                                        'Update Password'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Two-Factor Authentication Modal */}
                {showTwoFactorModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-surface-dark rounded-2xl max-w-md w-full p-6 shadow-2xl">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">security</span>
                                Enable Two-Factor Authentication
                            </h3>

                            {twoFactorStep === 'phone' ? (
                                <div className="space-y-4">
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                                        We&apos;ll send a verification code to your phone number.
                                    </p>
                                    <div>
                                        <Label htmlFor="phoneNumber">
                                            Phone Number
                                        </Label>
                                        <Input
                                            id="phoneNumber"
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="+234 800 000 0000"
                                        />
                                    </div>
                                    <div id="recaptcha-container"></div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                                        Enter the 6-digit code sent to your phone.
                                    </p>
                                    <div>
                                        <Label htmlFor="verificationCode">
                                            Verification Code
                                        </Label>
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
                                </div>
                            )}

                            {twoFactorError && (
                                <p className="text-red-500 text-sm flex items-center gap-1 mt-4">
                                    <span className="material-symbols-outlined text-sm">error</span>
                                    {twoFactorError}
                                </p>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowTwoFactorModal(false);
                                        setTwoFactorStep('phone');
                                        setPhoneNumber('');
                                        setVerificationCode('');
                                        setTwoFactorError('');
                                    }}
                                    className="flex-1 px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={twoFactorStep === 'phone' ? handleSendVerification : handleVerifyCode}
                                    disabled={twoFactorLoading || (twoFactorStep === 'phone' ? !phoneNumber : verificationCode.length !== 6)}
                                    className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {twoFactorLoading ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                            {twoFactorStep === 'phone' ? 'Sending...' : 'Verifying...'}
                                        </>
                                    ) : (
                                        twoFactorStep === 'phone' ? 'Send Code' : 'Verify & Enable'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Save Button */}
                <div className="flex items-center justify-end gap-4">
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
