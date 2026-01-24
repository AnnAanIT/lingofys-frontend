
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { AdminLayout, StatusBadge } from '../components/AdminComponents';
import { UserCreditCard } from '../components/Admin/UserCreditCard';
import { CreditHistoryTable } from '../components/Admin/CreditHistoryTable';
import { UserSubscriptionsList } from '../components/Admin/UserSubscriptionsList';
import { ProfileForm } from '../components/Profile/ProfileForm';
import { MentorBioEditor } from '../components/MentorBioEditor';
import { AvatarUploader } from '../components/Profile/AvatarUploader';
import { CountrySelector } from '../components/Admin/CountrySelector';
import { MentorGroupSelector } from '../components/Admin/MentorGroupSelector';
import { ProviderLevelSelector } from '../components/Admin/ProviderLevelSelector';
import { PricingPreview } from '../components/Admin/PricingPreview';
import { ProviderCommissionHistoryTable } from '../components/Admin/ProviderCommissionHistoryTable';
import { User, CreditHistoryEntry, Subscription, SubscriptionPlan, UserRole, Mentor, BookingStatus, PricingCountry, PricingGroup, ProviderCommission, Provider, Booking, SystemSettings } from '../types';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Edit3, DollarSign, Clock, Save, Settings, BookOpen, AlertCircle, Shield } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { getTimezoneByCountry } from '../lib/timeUtils';
import { useToast } from '../components/ui/Toast';
import { formatBookingDate, formatBookingTime } from '../utils/dateFormatters';

export default function AdminUserDetail() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { success, error: showError } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [creditHistory, setCreditHistory] = useState<CreditHistoryEntry[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    
    // Financial State
    const [pendingBalance, setPendingBalance] = useState(0);
    const [providerCommissions, setProviderCommissions] = useState<ProviderCommission[]>([]);

    // Configuration Draft State (Explicit Save requirement)
    const [draftCountry, setDraftCountry] = useState<string>('');
    const [draftGroup, setDraftGroup] = useState<string>('');
    const [draftLevel, setDraftLevel] = useState<string>('');
    const [isConfigChanged, setIsConfigChanged] = useState(false);

    // Context Data
    const [countries, setCountries] = useState<PricingCountry[]>([]);
    const [groups, setGroups] = useState<PricingGroup[]>([]);
    const [settings, setSettings] = useState<SystemSettings | null>(null);

    // BUG FIX #4: Admin action state
    const [showBanModal, setShowBanModal] = useState(false);
    const [banReason, setBanReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const loadData = async () => {
        if (!userId) return;
        
        try {
            // Always fetch fresh user data
            const u = await api.getUserById(userId);
            if (!u) { setLoading(false); return; }
            console.log('🔍 DEBUG loadData - User data received:', { userId, credits: u.credits, role: u.role, country: u.country, user: u });

            const [h, p, cData, gData, sysData] = await Promise.all([
            api.getUserCreditHistory(userId),
            api.getSubscriptionPlans(),
            api.getPricingCountries(),
            api.getPricingGroups(),
            api.getSystemSettings()
        ]);
        
        // BUG FIX #1: Load user's booking history
        let b: any[] = [];
        try {
            const bookingData = await api.getAdminUserBookings(userId);
            b = bookingData.bookings || [];
        } catch (e) {
            console.error('Error loading bookings:', e);
            b = [];
        }

        setCreditHistory(h);
        setPlans(p);
        setBookings(b);
        setCountries(cData);
        setGroups(gData);
        setSettings(sysData);

        // getUserById now returns flattened mentor data for MENTOR role
        setUser(u);
        
        // Load subscriptions for all roles via admin endpoint
        try {
            const subs = await api.getAdminUserSubscriptions(userId);
            setSubscriptions(subs);
        } catch (subErr) {
            console.error('Failed to load user subscriptions:', subErr);
            setSubscriptions([]);
        }

        if (u.role === UserRole.MENTOR) {
            setDraftGroup((u as any).mentorGroupId || '');
            const pending = b.filter(bk => bk.status === BookingStatus.SCHEDULED).reduce((acc, bk) => acc + bk.totalCost, 0);
            setPendingBalance(pending);
        } else if (u.role === UserRole.PROVIDER) {
            const prov = await api.getProviderProfile(userId);
            // Merge provider-specific fields if found
            if (prov) {
                const mergedProvider = {
                    ...u,
                    providerProfile: prov.providerProfile,
                    levelId: prov.providerProfile?.levelId,
                };
                setUser(mergedProvider);
                setDraftLevel(prov.providerProfile?.levelId || '');
            }
            const commissions = await api.getProviderCommissions(userId);
            setProviderCommissions(commissions);
            const pending = commissions.filter(c => c.status === 'PENDING').reduce((acc, c) => acc + c.commissionCredits, 0);
            setPendingBalance(pending);
        }
        // MENTEE role has no additional loading needed
        
        setDraftCountry(u.country || '');
        setIsConfigChanged(false);
        } catch (err: any) {
            console.error('Failed to load user detail:', err);
            showError('Load Failed', err.message || 'Failed to load user data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [userId]);

    // UI Draft Handlers
    const onCountryDraft = (val: string) => { setDraftCountry(val); setIsConfigChanged(true); };
    const onGroupDraft = (val: string) => { setDraftGroup(val); setIsConfigChanged(true); };
    const onLevelDraft = (val: string) => { setDraftLevel(val); setIsConfigChanged(true); };

    const handleSaveConfig = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const updates: any = {};

            // Only update country and timezone for MENTEE (used in pricing calculation)
            if (user.role === UserRole.MENTEE) {
                updates.country = draftCountry;
                updates.timezone = getTimezoneByCountry(draftCountry);
            }

            if (user.role === UserRole.MENTOR) {
                updates.mentorGroupId = draftGroup;
                // Rate calculated dynamically via pricing.service.ts
                // Admin sets tier (mentorGroupId), system calculates final price
            }

            if (user.role === UserRole.PROVIDER) {
                updates.levelId = draftLevel;
            }

            // Sync update to all relevant tables
            // Backend expects { config: {...} } structure
            await api.updateUserConfig(user.id, { config: updates });
            await api.logAction('USER_CONFIG_UPDATE', 'admin', `Admin updated configuration for ${user.name}`);

            // Reload data to reflect changes (loadData already handles provider profile reload)
            await loadData();
            
            setIsConfigChanged(false);
            success('Configuration Saved', 'User configuration has been updated successfully');
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            showError('Save Failed', errorMsg);
            console.error('Config save error:', e);
        } finally {
            setLoading(false);
        }
    };

    // BUG FIX #4: Ban/unban handlers
    const handleBanUser = async () => {
        if (!user) return;
        setIsProcessing(true);
        try {
            await api.banUser(user.id, banReason || 'Admin ban');
            success('User Banned', `${user.name} has been banned successfully`);
            setBanReason('');
            setShowBanModal(false);
            await loadData();
        } catch (e: any) {
            showError('Ban Failed', e.message || String(e));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUnbanUser = async () => {
        if (!user) return;
        setIsProcessing(true);
        try {
            await api.unbanUser(user.id);
            success('User Unbanned', `${user.name} has been unbanned successfully`);
            await loadData();
        } catch (e: any) {
            showError('Unban Failed', e.message || String(e));
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading && !user) return <AdminLayout><div className="flex items-center justify-center h-64"><Clock className="animate-spin text-brand-600 mr-2"/> Loading...</div></AdminLayout>;
    if (!user) return <AdminLayout><div>User not found</div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
                {/* Header Section with improved spacing */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => navigate('/admin/users')} 
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                            title="Back to User List"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
                            <p className="text-slate-500 text-sm">Account ID: <span className="font-mono">{user.id}</span></p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Quick Actions */}
                        {user.status === 'BANNED' ? (
                            <button 
                                onClick={handleUnbanUser}
                                disabled={isProcessing}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                                <Shield size={16} /> Unban User
                            </button>
                        ) : (
                            <button 
                                onClick={() => setShowBanModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg font-semibold hover:bg-orange-100 transition-colors"
                            >
                                <AlertCircle size={16} /> Ban User
                            </button>
                        )}
                        {isConfigChanged && (
                            <button 
                                onClick={handleSaveConfig}
                                className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-bold shadow-lg hover:bg-brand-700 animate-bounce"
                            >
                                <Save size={20} /> Save Configuration
                            </button>
                        )}
                    </div>
                </div>

                {/* BUG FIX #4: Ban modal */}
                {showBanModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <AlertCircle size={20} className="text-red-600" /> Ban User
                            </h2>
                            <p className="text-slate-600 mb-4">Are you sure you want to ban {user.name}? This will prevent them from accessing their account.</p>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Reason (optional)</label>
                                <textarea
                                    value={banReason}
                                    onChange={(e) => setBanReason(e.target.value)}
                                    placeholder="e.g., Violation of terms of service..."
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowBanModal(false)}
                                    disabled={isProcessing}
                                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBanUser}
                                    disabled={isProcessing}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
                                >
                                    {isProcessing ? 'Banning...' : 'Ban'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile Section with improved layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col md:flex-row">
                        <div className="p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50 min-w-[200px]">
                            <AvatarUploader currentAvatar={user.avatar} onUpload={async (url) => { await api.updateUser(user.id, {avatar: url}); loadData(); }} size="lg" />
                            <div className="mt-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    user.role === 'MENTOR' ? 'bg-purple-100 text-purple-700' :
                                    user.role === 'PROVIDER' ? 'bg-orange-100 text-orange-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>{user.role === 'MENTOR' ? 'TEACHER' : user.role === 'MENTEE' ? 'STUDENT' : user.role}</span>
                            </div>
                        </div>
                        <div className="p-6 flex-1 relative">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    Basic Information
                                    {isEditingProfile && <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-full normal-case">Editing</span>}
                                </h3>
                                <button 
                                    onClick={() => setIsEditingProfile(!isEditingProfile)} 
                                    className={`transition-all p-2 rounded-lg ${isEditingProfile ? 'bg-brand-100 text-brand-600 hover:bg-brand-200' : 'text-slate-400 hover:text-brand-600 hover:bg-slate-100'}`}
                                    title={isEditingProfile ? "Cancel editing" : "Edit profile"}
                                >
                                    <Edit3 size={18} />
                                </button>
                            </div>
                            {!isEditingProfile ? (
                                <>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                                        <StatusBadge status={user.status} />
                                    </div>
                                    <p className="text-slate-500 mb-6 flex items-center text-sm"><Mail size={14} className="mr-1.5"/> {user.email}</p>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                        <div>
                                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Location</span>
                                            <div className="font-medium text-slate-700 flex items-center"><MapPin size={14} className="mr-2 opacity-50"/> {user.country || 'Unknown'}</div>
                                        </div>
                                        <div>
                                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Joined</span>
                                            <div className="font-medium text-slate-700 flex items-center"><Calendar size={14} className="mr-2 opacity-50"/> {new Date(user.joinedAt).toLocaleDateString()}</div>
                                        </div>
                                        <div>
                                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Timezone</span>
                                            <div className="font-medium text-slate-700 flex items-center"><Clock size={14} className="mr-2 opacity-50"/> {user.timezone || 'UTC'}</div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <ProfileForm 
                                    user={user} 
                                    onSave={() => { setIsEditingProfile(false); loadData(); }}
                                    updateMethod={async (data) => { await api.updateUser(user.id, data); }}
                                />
                            )}
                        </div>
                    </div>

                    <div className="h-full">
                        {/* Show UserCreditCard with Adjust button for all roles */}
                        <UserCreditCard userId={user.id} credit={user.credits} onUpdate={loadData} />
                    </div>
                </div>

                {/* Mentor Profile Section - Only for MENTOR role */}
                {user.role === UserRole.MENTOR && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                        <div className="p-6">
                            <MentorBioEditor 
                                mentor={user as Mentor} 
                                onSave={loadData}
                                mode="view"
                                showBackButton={false}
                            />
                        </div>
                    </div>
                )}

                {/* Configuration Section with improved styling */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 flex items-center"><Settings size={18} className="mr-2 text-slate-400" /> Configuration & Pricing</h3>
                        {isConfigChanged && (
                            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded flex items-center gap-1">
                                <AlertCircle size={12} /> Unsaved changes
                            </span>
                        )}
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                            <div className="space-y-6">
                                {/* Billing Country only for MENTEE (used in pricing calculation) */}
                                {user.role === UserRole.MENTEE && (
                                    <CountrySelector value={draftCountry} onChange={onCountryDraft} label="Billing Country" />
                                )}

                                {/* Mentor Tier Selection */}
                                {user.role === UserRole.MENTOR && <MentorGroupSelector value={draftGroup} onChange={onGroupDraft} />}

                                {/* Provider Level Selection */}
                                {user.role === UserRole.PROVIDER && <ProviderLevelSelector value={draftLevel} onChange={onLevelDraft} />}

                                {/* Configuration changes are handled via Edit User modal in AdminUsers page */}
                            </div>
                            <div className="bg-slate-50 rounded-xl">
                                {user.role === UserRole.MENTEE && (
                                    <PricingPreview
                                        basePrice={settings?.baseLessonCreditPrice || 10}
                                        countries={countries}
                                        groups={groups}
                                        selectedCountryId={draftCountry}
                                        selectedGroupId={draftGroup}
                                        topupRatio={settings?.topupConversionRatio || 1.0}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Financial & Subscription Section */}
                        <div className="space-y-4">
                            <div className="bg-gradient-to-r from-slate-50 to-white p-4 rounded-lg border border-slate-100">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <DollarSign size={20} className="text-brand-600" />
                                    {user.role === UserRole.PROVIDER ? 'Commission History' :
                                     user.role === UserRole.MENTEE ? 'Subscription Plans' : 'Student Subscriptions'}
                                </h3>
                            </div>
                            {user.role === UserRole.PROVIDER ? (
                                <ProviderCommissionHistoryTable commissions={providerCommissions} />
                            ) : (
                                <UserSubscriptionsList subscriptions={subscriptions} allPlans={plans} onUpdate={loadData} viewMode={user.role === UserRole.MENTOR ? 'mentor' : 'mentee'} />
                            )}
                        </div>

                        {/* Booking History Section - Hide for PROVIDER */}
                        {user.role !== UserRole.PROVIDER && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2"><BookOpen size={18} className="text-brand-600"/> Booking History</h3>
                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{bookings.length} Total</span>
                                </div>
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0">
                                        <tr>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">{user.role === 'MENTEE' ? 'Teacher' : 'Student'}</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-right">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {bookings.map(b => (
                                            <tr key={b.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-3 text-slate-600">
                                                    {formatBookingDate(b.startTime)}
                                                    <div className="text-xs text-slate-400">{formatBookingTime(b.startTime)}</div>
                                                    {/* Show cancellation reason if cancelled */}
                                                    {b.status === BookingStatus.CANCELLED && b.cancellationReason && (
                                                        <div className="text-xs text-orange-600 mt-1 italic" title={b.cancellationReason}>
                                                            ℹ️ Cancel: {b.cancellationReason.length > 30 ? b.cancellationReason.substring(0, 30) + '...' : b.cancellationReason}
                                                        </div>
                                                    )}
                                                    {/* Show reschedule reason if rescheduled */}
                                                    {b.status === BookingStatus.RESCHEDULED && b.rescheduleReason && (
                                                        <div className="text-xs text-blue-600 mt-1 italic" title={b.rescheduleReason}>
                                                            ℹ️ Reschedule: {b.rescheduleReason.length > 30 ? b.rescheduleReason.substring(0, 30) + '...' : b.rescheduleReason}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 font-medium text-slate-900">{user.role === 'MENTEE' ? b.mentorName : b.menteeName}</td>
                                                <td className="px-6 py-3"><StatusBadge status={b.status} /></td>
                                                <td className="px-6 py-3 text-right font-bold text-slate-700">{b.totalCost}</td>
                                            </tr>
                                        ))}
                                        {bookings.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No bookings found.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        )}
                    </div>
                    
                    {/* Credit History Section */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <DollarSign size={20} className="text-green-600" />
                            Credit History
                        </h3>
                        <CreditHistoryTable history={creditHistory} />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
