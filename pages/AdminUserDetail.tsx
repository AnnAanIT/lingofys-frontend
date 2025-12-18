
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { AdminLayout, StatusBadge } from '../components/AdminComponents';
import { UserCreditCard } from '../components/Admin/UserCreditCard';
import { CreditHistoryTable } from '../components/Admin/CreditHistoryTable';
import { UserSubscriptionsList } from '../components/Admin/UserSubscriptionsList';
import { ProfileForm } from '../components/Profile/ProfileForm';
import { MentorBioEditor } from '../components/MentorBioEditor';
import { AvatarUploader } from '../components/Profile/AvatarUploader';
import { CreditAdjustmentModal } from '../components/Admin/CreditAdjustmentModal';
import { CountrySelector } from '../components/Admin/CountrySelector';
import { MentorGroupSelector } from '../components/Admin/MentorGroupSelector';
import { ProviderLevelSelector } from '../components/Admin/ProviderLevelSelector';
import { PricingPreview } from '../components/Admin/PricingPreview';
import { ProviderCommissionHistoryTable } from '../components/Admin/ProviderCommissionHistoryTable';
import { User, CreditHistoryEntry, Subscription, SubscriptionPlan, UserRole, Mentor, BookingStatus, PricingCountry, PricingGroup, ProviderCommission, Provider, Booking, SystemSettings } from '../types';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Edit3, DollarSign, Clock, Save, Settings, BookOpen, AlertCircle, Shield } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { getTimezoneByCountry } from '../lib/timeUtils';

export default function AdminUserDetail() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [creditHistory, setCreditHistory] = useState<CreditHistoryEntry[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    
    // Financial State
    const [pendingBalance, setPendingBalance] = useState(0);
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
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

    const loadData = async () => {
        if (!userId) return;
        const u = await api.getUserById(userId);
        if (!u) { setLoading(false); return; }

        const [h, p, b, cData, gData, sysData] = await Promise.all([
            api.getUserCreditHistory(userId),
            api.getSubscriptionPlans(),
            api.getBookings(userId, u.role === UserRole.MENTOR ? UserRole.MENTOR : UserRole.MENTEE),
            api.getPricingCountries(),
            api.getPricingGroups(),
            api.getSystemSettings()
        ]);

        setCreditHistory(h);
        setPlans(p);
        setBookings(b);
        setCountries(cData);
        setGroups(gData);
        setSettings(sysData);

        if (u.role === UserRole.MENTOR) {
            const m = await api.getMentorById(userId);
            setUser(m || u);
            setDraftGroup(m?.mentorGroupId || '');
            const pending = b.filter(bk => bk.status === BookingStatus.SCHEDULED).reduce((acc, bk) => acc + bk.totalCost, 0);
            setPendingBalance(pending);
            const subData = await api.getMentorSubscriptions(userId);
            setSubscriptions(subData);
        } else if (u.role === UserRole.PROVIDER) {
            const prov = await api.getProviderProfile(userId);
            setUser(prov || u);
            setDraftLevel((prov as Provider)?.levelId || '');
            const commissions = await api.getProviderCommissions(userId);
            setProviderCommissions(commissions);
            const pending = commissions.filter(c => c.status === 'PENDING').reduce((acc, c) => acc + c.commissionAmountUsd, 0);
            setPendingBalance(pending);
        } else {
            setUser(u);
            const s = await api.getUserSubscriptions(userId);
            setSubscriptions(s);
        }
        
        setDraftCountry(u.country || '');
        setIsConfigChanged(false);
        setLoading(false);
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
            // Automatically derive timezone from the new country selection
            const updates: any = { 
                country: draftCountry,
                timezone: getTimezoneByCountry(draftCountry)
            };
            
            if (user.role === UserRole.MENTOR) {
                updates.mentorGroupId = draftGroup;
                // Auto-calculate new hourly rate based on tier
                const groupObj = groups.find(g => g.id === draftGroup);
                if (groupObj && settings) {
                    updates.hourlyRate = Number((settings.baseLessonCreditPrice * groupObj.multiplier).toFixed(2));
                }
            }
            
            if (user.role === UserRole.PROVIDER) {
                updates.levelId = draftLevel;
            }

            // Sync update to all relevant tables
            await api.updateUserConfig(user.id, updates);
            await api.logAction('USER_CONFIG_UPDATE', `Admin updated configuration and synced timezone for ${user.name}`, 'admin');
            
            alert("Configuration saved! Timezone has been automatically updated to match the new country.");
            await loadData();
        } catch (e) {
            alert("Error: " + e);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !user) return <AdminLayout><div className="flex items-center justify-center h-64"><Clock className="animate-spin text-brand-600 mr-2"/> Loading...</div></AdminLayout>;
    if (!user) return <AdminLayout><div>User not found</div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate('/admin/users')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
                            <p className="text-slate-500 text-sm">Account ID: <span className="font-mono">{user.id}</span></p>
                        </div>
                    </div>
                    {isConfigChanged && (
                        <button 
                            onClick={handleSaveConfig}
                            className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-bold shadow-lg hover:bg-brand-700 animate-bounce"
                        >
                            <Save size={20} /> Save Configuration
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                        <div className="p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50 min-w-[200px]">
                            <AvatarUploader currentAvatar={user.avatar} onUpload={async (url) => { await api.updateUserConfig(user.id, {avatar: url}); loadData(); }} size="lg" />
                            <div className="mt-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    user.role === 'MENTOR' ? 'bg-purple-100 text-purple-700' :
                                    user.role === 'PROVIDER' ? 'bg-orange-100 text-orange-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>{user.role}</span>
                            </div>
                        </div>
                        <div className="p-6 flex-1 relative">
                            <button onClick={() => setIsEditingProfile(!isEditingProfile)} className={`absolute top-6 right-6 transition-colors ${isEditingProfile ? 'text-brand-600' : 'text-slate-400 hover:text-brand-600'}`}>
                                <Edit3 size={18} />
                            </button>
                            {!isEditingProfile ? (
                                <>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                                        <StatusBadge status={user.status} />
                                    </div>
                                    <p className="text-slate-500 mb-6 flex items-center text-sm"><Mail size={14} className="mr-1.5"/> {user.email}</p>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                        <div>
                                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</span>
                                            <div className="font-medium text-slate-700 flex items-center"><Phone size={14} className="mr-2 opacity-50"/> {user.phone || 'N/A'}</div>
                                        </div>
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
                                <ProfileForm user={user} onSave={() => { setIsEditingProfile(false); loadData(); }} />
                            )}
                        </div>
                    </div>

                    <div className="h-full">
                        {user.role === UserRole.MENTEE ? (
                            <UserCreditCard userId={user.id} credit={user.credits} onUpdate={loadData} />
                        ) : (
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col justify-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-5"><DollarSign size={100} /></div>
                                <div className="relative z-10">
                                    <h3 className="text-slate-500 font-medium text-xs mb-2 uppercase tracking-wide">Wallet Balance</h3>
                                    <div className="text-4xl font-extrabold text-slate-900 mb-6">${user.balance}</div>
                                    <div className="flex items-center justify-between text-sm mb-6 p-3 bg-slate-50 rounded-lg">
                                        <span className="text-slate-500">Pending {user.role === 'MENTOR' ? 'Earnings' : 'Commission'}</span>
                                        <span className="font-bold text-slate-700">${pendingBalance.toFixed(2)}</span>
                                    </div>
                                    <button onClick={() => setIsAdjustmentModalOpen(true)} className="w-full flex items-center justify-center px-4 py-2.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors">
                                        <DollarSign size={16} className="mr-2" /> Adjust Balance
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                                <CountrySelector value={draftCountry} onChange={onCountryDraft} label="Billing Country" />
                                {user.role === UserRole.MENTOR && <MentorGroupSelector value={draftGroup} onChange={onGroupDraft} />}
                                {user.role === UserRole.PROVIDER && <ProviderLevelSelector value={draftLevel} onChange={onLevelDraft} />}
                                
                                {isConfigChanged && (
                                    <div className="pt-4 border-t border-slate-100">
                                        <button onClick={handleSaveConfig} className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold shadow-lg hover:bg-brand-700">
                                            Save All Configuration Changes
                                        </button>
                                        <button onClick={() => { setDraftCountry(user.country || ''); setDraftGroup((user as Mentor).mentorGroupId || ''); setIsConfigChanged(false); }} className="w-full mt-2 py-2 text-slate-500 text-sm font-medium">Discard Changes</button>
                                    </div>
                                )}
                            </div>
                            <div className="bg-slate-50 rounded-xl">
                                {user.role !== UserRole.PROVIDER ? (
                                    <PricingPreview 
                                        basePrice={settings?.baseLessonCreditPrice || 10}
                                        countries={countries}
                                        groups={groups}
                                        selectedCountryId={draftCountry}
                                        selectedGroupId={draftGroup}
                                        topupRatio={settings?.topupConversionRatio || 1.0}
                                    />
                                ) : (
                                    <div className="p-12 text-center text-slate-400 bg-slate-100 rounded-2xl">
                                        <Shield size={32} className="mx-auto mb-2 opacity-50"/>
                                        <p className="text-sm">Pricing Simulation is not applicable for Providers.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-900">
                                {user.role === UserRole.PROVIDER ? 'Commission History' : 
                                 user.role === UserRole.MENTEE ? 'Subscription Plans' : 'Associated Subscriptions'}
                            </h3>
                            {user.role === UserRole.PROVIDER ? (
                                <ProviderCommissionHistoryTable commissions={providerCommissions} />
                            ) : (
                                <UserSubscriptionsList subscriptions={subscriptions} allPlans={plans} onUpdate={loadData} viewMode={user.role === UserRole.MENTOR ? 'mentor' : 'mentee'} />
                            )}
                        </div>

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
                                            <th className="px-6 py-3">{user.role === 'MENTEE' ? 'Mentor' : 'Student'}</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-right">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {bookings.map(b => (
                                            <tr key={b.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-3 text-slate-600">
                                                    {new Date(b.startTime).toLocaleDateString()}
                                                    <div className="text-xs text-slate-400">{new Date(b.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
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
                    </div>
                    
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-900">Credit History</h3>
                        <CreditHistoryTable history={creditHistory} />
                    </div>
                </div>

                <CreditAdjustmentModal isOpen={isAdjustmentModalOpen} onClose={() => setIsAdjustmentModalOpen(false)} userId={user.id} onSuccess={loadData} resourceName="Balance" />
            </div>
        </AdminLayout>
    );
}
