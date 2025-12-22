
import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { api } from '../services/api';
import { Provider, Referral, Commission, Payout, ProviderCommission, UserRole, Conversation } from '../types';
import { ReferralCard, CommissionSummary, ReferralList, PayoutHistoryTable } from '../components/ProviderComponents';
import { User, Users, DollarSign, Download, Settings, Copy, Shield, MessageSquare } from 'lucide-react';
import { ChatWindow } from '../components/Messages/ChatWindow';

interface Props {
  tab?: 'overview' | 'referrals' | 'commissions' | 'payouts' | 'profile' | 'chat';
}

export default function ProviderDashboard({ tab = 'overview' }: Props) {
  const { user, refreshUser } = useApp();
  const [activeTab, setActiveTab] = useState(tab);
  
  const [provider, setProvider] = useState<Provider | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<ProviderCommission[]>([]); 
  const [payouts, setPayouts] = useState<Payout[]>([]);

  // Form states
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('PayPal');
  const [profileForm, setProfileForm] = useState({ name: '', email: '', payoutDetails: '' });

  useEffect(() => {
    if (user) {
        loadData();
    }
  }, [user]);

  const loadData = async () => {
    if(!user) return;
    const p = await api.getProviderProfile(user.id);
    const r = await api.getReferrals(user.id);
    const c = await api.getProviderCommissions(user.id); 
    const pay = await api.getPayouts(user.id);

    if(p) {
        setProvider(p);
        setProfileForm({ name: p.name, email: p.email, payoutDetails: p.payoutDetails });
    }
    setReferrals(r);
    setCommissions(c.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setPayouts(pay.sort((a,b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!user || !payoutAmount) return;
    try {
        await api.requestPayout(user, user.id, Number(payoutAmount), payoutMethod);
        await refreshUser();
        await loadData();
        setPayoutAmount('');
        alert("Payout requested successfully!");
    } catch(err) {
        alert("Error: " + err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!user) return;
    await api.updateProviderProfile(user.id, profileForm);
    await refreshUser();
    alert("Profile updated!");
  };

  const pendingComm = commissions.filter(c => c.status === 'PENDING').reduce((a,b) => a + b.commissionAmountUsd, 0);
  const lifetimeComm = commissions.reduce((a,b) => a + b.commissionAmountUsd, 0);

  if (!provider) return <div className="p-8 text-center text-slate-500">Loading provider profile...</div>;

  // --- SUB-PAGES ---
  
  const Overview = () => (
      <div className="space-y-8 animate-fade-in">
          <div className="flex justify-between items-center">
              <div>
                  <h1 className="text-3xl font-bold text-slate-900">Affiliate Dashboard</h1>
                  <p className="text-slate-500 mt-1">Level: <strong className="text-brand-600 uppercase">{provider.levelId}</strong></p>
              </div>
              <button onClick={() => setActiveTab('payouts')} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800">
                  Request Payout
              </button>
          </div>

          <CommissionSummary pending={pendingComm} available={user?.balance || 0} lifetime={lifetimeComm} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                  <ReferralCard provider={provider} />
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-slate-900">Recent Referrals</h3>
                          <button onClick={() => setActiveTab('referrals')} className="text-brand-600 text-sm font-medium hover:underline">View All</button>
                      </div>
                      <ReferralList referrals={referrals.slice(0, 5)} />
                  </div>
              </div>
              <div className="space-y-6">
                   <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <Shield size={18} className="text-brand-600"/> Partner Level
                      </h3>
                      <div className="text-center py-4 bg-brand-50 rounded-xl mb-4">
                          <div className="text-3xl font-extrabold text-brand-700 uppercase">{provider.levelId}</div>
                          <p className="text-brand-600 text-sm">Status</p>
                      </div>
                      <div className="text-xs text-slate-500 text-center">
                          Higher levels earn higher commission percentages. Contact support to upgrade.
                      </div>
                   </div>
              </div>
          </div>
      </div>
  );

  const ReferralsPage = () => (
      <div className="space-y-6 animate-fade-in">
          <h2 className="text-2xl font-bold text-slate-900">My Referrals</h2>
          <ReferralList referrals={referrals} />
      </div>
  );

  const CommissionsPage = () => (
      <div className="space-y-6 animate-fade-in">
          <h2 className="text-2xl font-bold text-slate-900">Commission History</h2>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 font-bold text-slate-800">Ledger (USD)</div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="px-6 py-3 text-left">Date</th>
                            <th className="px-6 py-3 text-left">Mentee</th>
                            <th className="px-6 py-3 text-left">Top-up Amount</th>
                            <th className="px-6 py-3 text-left">Rate</th>
                            <th className="px-6 py-3 text-right">Commission</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {commissions.map(c => (
                            <tr key={c.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-bold text-slate-700">{c.menteeName}</td>
                                <td className="px-6 py-4 text-slate-600">${c.topupAmountUsd}</td>
                                <td className="px-6 py-4 text-slate-500">{c.commissionPercent}%</td>
                                <td className="px-6 py-4 text-right font-bold text-green-600">+${c.commissionAmountUsd}</td>
                            </tr>
                        ))}
                        {commissions.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                    No commissions yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
         </div>
      </div>
  );

  const PayoutsPage = () => (
      <div className="space-y-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-slate-900">Payouts</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-lg mb-4">Request New Payout</h3>
                  <div className="bg-green-50 border border-green-100 p-4 rounded-xl mb-6 flex justify-between items-center">
                      <span className="text-green-800 font-medium">Available Balance</span>
                      <span className="text-2xl font-bold text-green-700">${user?.balance.toFixed(2)}</span>
                  </div>
                  
                  <form onSubmit={handleRequestPayout} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label>
                          <input 
                              type="number" 
                              max={user?.balance}
                              min={50}
                              value={payoutAmount}
                              onChange={e => setPayoutAmount(e.target.value)}
                              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                              placeholder="Min $50"
                              required
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Payout Method</label>
                          <select 
                              value={payoutMethod}
                              onChange={e => setPayoutMethod(e.target.value)}
                              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                          >
                              <option value="PayPal">PayPal</option>
                              <option value="Bank Transfer">Bank Transfer</option>
                              <option value="Wise">Wise</option>
                          </select>
                      </div>
                      <button 
                          type="submit" 
                          disabled={!payoutAmount || Number(payoutAmount) > (user?.balance || 0)}
                          className="w-full py-3 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                          Submit Request
                      </button>
                  </form>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-lg mb-4">Payout Settings</h3>
                  <div className="space-y-4 text-sm text-slate-600">
                      <p><strong>Current Method:</strong> {provider.payoutMethod}</p>
                      <p><strong>Details:</strong> {provider.payoutDetails}</p>
                      <button onClick={() => setActiveTab('profile')} className="text-brand-600 font-medium hover:underline">Edit Payout Settings</button>
                  </div>
              </div>
          </div>

          <PayoutHistoryTable payouts={payouts} />
      </div>
  );

  const ProfilePage = () => (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
          <h2 className="text-2xl font-bold text-slate-900">Provider Profile</h2>
          
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="flex items-center space-x-4 mb-6">
                      <img src={provider.avatar} alt="Profile" className="w-20 h-20 rounded-full bg-slate-200" />
                      <button type="button" className="text-sm text-brand-600 font-medium border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-50">Change Avatar</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                          <input 
                              type="text" 
                              value={profileForm.name}
                              onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                              className="w-full p-2 border border-slate-300 rounded-lg"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                          <input 
                              type="email" 
                              value={profileForm.email}
                              onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                              className="w-full p-2 border border-slate-300 rounded-lg"
                          />
                      </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                      <h3 className="font-bold text-slate-900 mb-4">Payout Information</h3>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Payment Details (PayPal Email or Bank IBAN)</label>
                          <input 
                              type="text" 
                              value={profileForm.payoutDetails}
                              onChange={e => setProfileForm({...profileForm, payoutDetails: e.target.value})}
                              className="w-full p-2 border border-slate-300 rounded-lg"
                          />
                      </div>
                  </div>

                  <button type="submit" className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800">
                      Save Changes
                  </button>
              </form>
          </div>
      </div>
  );

  const ChatPage = () => {
    const supportConversation: Conversation = {
        id: `conv_${user?.id}`,
        participantId: user?.id || '',
        participantName: "Admin Support",
        participantAvatar: "",
        participantRole: UserRole.ADMIN,
        assignedAdminId: null,
        status: 'OPEN',
        lastMessageAt: new Date().toISOString(),
        lastMessagePreview: 'How can we help you?',
        unreadCount: 0
    };

    return (
        <div className="h-[calc(100vh-160px)] animate-fade-in">
            <ChatWindow 
                currentUserId={user?.id || ''}
                currentUserRole={user?.role || UserRole.PROVIDER}
                conversation={supportConversation}
            />
        </div>
    );
  };

  // --- TAB NAVIGATION ---
  const tabs = [
      { id: 'overview', label: 'Overview', icon: Settings },
      { id: 'referrals', label: 'Referrals', icon: Users },
      { id: 'commissions', label: 'Commissions', icon: DollarSign },
      { id: 'payouts', label: 'Payouts', icon: Download },
      { id: 'chat', label: 'Admin Support', icon: MessageSquare },
      { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 space-y-1">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id as any)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                            activeTab === t.id ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <t.icon size={18} />
                        <span>{t.label}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
            {activeTab === 'overview' && <Overview />}
            {activeTab === 'referrals' && <ReferralsPage />}
            {activeTab === 'commissions' && <CommissionsPage />}
            {activeTab === 'payouts' && <PayoutsPage />}
            {activeTab === 'profile' && <ProfilePage />}
            {activeTab === 'chat' && <ChatPage />}
        </div>
    </div>
  );
}
