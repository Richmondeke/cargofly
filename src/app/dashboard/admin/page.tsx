'use client';

import React, { useEffect, useState } from 'react';
import { getTeamMembers, getRecentActivities, formatActivityTime, TeamMember, Activity, getDashboardStats, inviteTeamMember } from '@/lib/dashboard-service';
import { useAuth } from '@/contexts/AuthContext';
import RiveAnimation from '@/components/ui/RiveAnimation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
    UserPlus,
    MoreVertical,
    Edit,
    UserMinus,
    Trash2,
    Truck,
    Activity as ActivityIcon,
    CheckCircle,
    CreditCard,
    ShieldOff,
    UserCheck,
    Box,
    Clock,
    RefreshCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 tracking-tight">Email Address</label>
                            <Input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="colleague@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 tracking-tight">Role</label>
                            <Select
                                value={role}
                                onChange={(e) => setRole(e.target.value as any)}
                            >
                                <option value="staff">Staff</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 tracking-tight">Department</label>
                            <Select
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                            >
                                <option value="Operations">Operations</option>
                                <option value="Finance">Finance</option>
                                <option value="Logistics">Logistics</option>
                                <option value="IT">IT</option>
                                <option value="Customer Support">Customer Support</option>
                            </Select>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button
                                variant="ghost"
                                className="flex-1"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                loading={loading}
                                className="flex-1"
                            >
                                Send Invite
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function AdminPage() {
    const { userProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [stats, setStats] = useState({ totalShipments: 0, inTransit: 0, delivered: 0, totalRevenue: 0 });
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [teamData, activityData, statsData] = await Promise.all([
                getTeamMembers(),
                getRecentActivities(undefined, 'admin', 10),
                getDashboardStats(),
            ]);
            setTeamMembers(teamData);
            setActivities(activityData);
            setStats(statsData);
        } catch (error) {
            console.error('Error loading admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const isAdmin = userProfile?.role === 'admin';

    if (!isAdmin) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-background-dark">
                <div className="text-center">
                    <span className="material-symbols-outlined text-6xl text-slate-400 dark:text-slate-600 mb-4">lock</span>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Restricted</h2>
                    <p className="text-slate-500">You need admin privileges to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-8 h-full bg-slate-50 dark:bg-background-dark">
            {showInviteModal && (
                <InviteModal
                    onClose={() => setShowInviteModal(false)}
                    onSuccess={() => {
                        loadData(); // Reload list
                    }}
                />
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="text-left">
                    <h1 className="text-2xl sm:text-[32px] font-bold text-[#1e293b] dark:text-white leading-tight">Operations</h1>
                    <p className="text-[14px] text-[#64748b] dark:text-slate-400 mt-1">System administration and team management</p>
                </div>
                <Button
                    onClick={() => setShowInviteModal(true)}
                    leftIcon={<UserPlus className="w-4 h-4" />}
                >
                    Add Team Member
                </Button>
            </div>

            {/* System Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Shipments */}
                <Card variant="default">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                <Truck className="w-4 h-4 text-amber-500" />
                            </div>
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Shipments</span>
                        </div>
                        {loading ? (
                            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        ) : (
                            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.totalShipments.toLocaleString()}</p>
                        )}
                    </CardContent>
                </Card>

                {/* In Transit */}
                <Card variant="default">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-sky-50 dark:bg-sky-900/20 rounded-lg">
                                <ActivityIcon className="w-4 h-4 text-sky-500" />
                            </div>
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">In Transit</span>
                        </div>
                        {loading ? (
                            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        ) : (
                            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.inTransit.toLocaleString()}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Delivered */}
                <Card variant="default">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                            </div>
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Delivered</span>
                        </div>
                        {loading ? (
                            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        ) : (
                            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.delivered.toLocaleString()}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Total Revenue */}
                <Card variant="premium">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <CreditCard className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-bold text-white/70 uppercase tracking-wider">Total Revenue</span>
                        </div>
                        {loading ? (
                            <div className="h-8 w-16 bg-white/10 rounded animate-pulse"></div>
                        ) : (
                            <p className="text-3xl font-black text-white tracking-tighter">
                                ${(stats.totalRevenue / 1000).toFixed(1)}k
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Team Members */}
                <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Team Members</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider font-semibold text-xs">
                                <tr>
                                    <th className="px-6 py-4">Member</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Department</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {loading ? (
                                    [1, 2, 3].map((i) => (
                                        <tr key={i}>
                                            <td colSpan={5} className="px-6 py-5">
                                                <div className="h-6 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : teamMembers.length > 0 ? (
                                    teamMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        {member.displayName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900 dark:text-white">{member.displayName}</p>
                                                        <p className="text-xs text-slate-500">{member.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${member.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                    : member.role === 'manager'
                                                        ? 'bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400'
                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                    }`}>
                                                    {member.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{member.department}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${member.status === 'active'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                    }`}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                    {member.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right relative">
                                                <button
                                                    onClick={() => setActiveMenuId(activeMenuId === member.id ? null : member.id)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700"
                                                >
                                                    <span className="material-symbols-outlined">more_vert</span>
                                                </button>
                                                {activeMenuId === member.id && (
                                                    <div className="absolute right-0 bottom-full mb-2 z-50 w-44 bg-white dark:bg-navy-800 rounded-xl shadow-xl border border-slate-200 dark:border-navy-700 py-1 animate-in fade-in zoom-in-95 duration-150">
                                                        <button
                                                            onClick={() => {
                                                                alert(`Edit role for ${member.displayName}`);
                                                                setActiveMenuId(null);
                                                            }}
                                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-700"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">edit</span>
                                                            Edit Role
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                alert(`${member.status === 'active' ? 'Deactivate' : 'Activate'} ${member.displayName}`);
                                                                setActiveMenuId(null);
                                                            }}
                                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-700"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">{member.status === 'active' ? 'person_off' : 'person'}</span>
                                                            {member.status === 'active' ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                        <div className="border-t border-slate-200 dark:border-navy-700 my-1" />
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(`Remove ${member.displayName} from the team?`)) {
                                                                    alert(`Removed ${member.displayName}`);
                                                                }
                                                                setActiveMenuId(null);
                                                            }}
                                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">delete</span>
                                                            Remove
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-48 h-48">
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

                {/* Activity Log */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Activity Log</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {loading ? (
                            [1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                            ))
                        ) : activities.length > 0 ? (
                            activities.map((activity) => (
                                <div key={activity.id} className="flex gap-3 items-start p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-sm text-slate-500">
                                            {activity.entityType === 'shipment' ? 'local_shipping' : activity.entityType === 'booking' ? 'add_box' : 'info'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-900 dark:text-white">{activity.action}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-slate-500">{activity.userName}</span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-xs text-slate-400">{formatActivityTime(activity.timestamp)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 gap-3 text-slate-500">
                                <div className="w-32 h-32">
                                    <RiveAnimation src="/icons/empty-state.riv" />
                                </div>
                                <p>No activity yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
