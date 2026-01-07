
import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { api } from '../services/api';
import { Provider, Referral, Commission, Payout, ProviderCommission, UserRole, Conversation } from '../types';
import { ReferralCard, CommissionSummary, ReferralList, PayoutHistoryTable } from '../components/ProviderComponents';
import { DollarSign, Shield, MessageSquare } from 'lucide-react';
import { ChatWindow } from '../components/Messages/ChatWindow';
import { useToast } from '../components/ui/Toast';

interface Props {
  tab?: 'overview' | 'earnings' | 'payouts' | 'chat';
}

export default function ProviderDashboard({ tab = 'overview' }: Props) {
  const { user, refreshUser } = useApp();
  const { success, error: showError, warning } = useToast();
  
  const [provider, setProvider] = useState<Provider | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<ProviderCommission[]>([]); 
  const [payouts, setPayouts] = useState<Payout[]>([]);

  // Form states
  const [payoutAmount, setPayoutAmount] = useState('');
  
  // Currency Preview State
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  useEffect(() => {
    if (user) {
        loadData();
    }
    loadCurrencies();
  }, [user]);

  const loadData = async () => {
    if(!user) return;
    try {
      // ✅ PARALLEL API CALLS - All requests run simultaneously
      const [p, r, c, pay] = await Promise.all([
        api.getProviderProfile(user.id),
        api.getReferrals(user.id),
        api.getProviderCommissions(user.id),
        api.getPayouts(user.id)
      ]);

      if(p) {
          setProvider(p);
      }
      setReferrals(r || []);
      setCommissions((c || []).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setPayouts((pay || []).sort((a,b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
    } catch (err: any) {
      console.error('Failed to load provider data:', err);
      showError('Load Failed', 'Failed to load dashboard data. Please refresh the page.');
      setReferrals([]);
      setCommissions([]);
      setPayouts([]);
    }
  };

  const loadCurrencies = async () => {
    try {
        const settings = await api.getSystemSettings();
        const currenciesData = settings.currencies || [];
        let enabledCurrencies = Array.isArray(currenciesData) 
            ? currenciesData.filter((c: any) => c.enabled) 
            : [];
        
        if (enabledCurrencies.length === 0) {
            enabledCurrencies = [{ 
                code: 'USD', 
                name: 'US Dollar', 
                symbol: '$', 
                symbolPosition: 'before',
                exchangeRate: 1, 
                enabled: true,
                paymentMethods: []
            }];
        }
        
        setCurrencies(enabledCurrencies);
    } catch (error) {
        console.error('Failed to load currencies:', error);
        setCurrencies([{ 
            code: 'USD', 
            name: 'US Dollar', 
            symbol: '$',
            symbolPosition: 'before',
            exchangeRate: 1, 
            enabled: true,
            paymentMethods: []
        }]);
    }
  };

  const calculateEquivalent = (credits: number, currencyCode: string) => {
    const usdAmount = credits * 1;
    const currency = currencies.find(c => c.code === currencyCode);
    if (!currency) return { amount: usdAmount, symbol: '$', code: 'USD' };
    
    const equivalentAmount = usdAmount * (currency.exchangeRate || 1);
    return {
        amount: equivalentAmount,
        symbol: currency.symbol || '$',
        code: currency.code,
        name: currency.name
    };
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!user || !payoutAmount) return;
    
    // Validate payment info exists
    if (!user.paymentMethod || !user.paymentDetails) {
      warning('Payment Info Required', 'Please set up payment information in Profile first.');
      return;
    }
    
    try {
        // Use payment method from user profile
        await api.requestPayout(user.id, Number(payoutAmount), user.paymentMethod, '');
        await refreshUser();
        await loadData();
        setPayoutAmount('');
        success('Payout Requested', 'Your payout request has been submitted successfully');
    } catch(err: any) {
        showError('Request Failed', err.message || String(err));
    }
  };

  const pendingComm = (commissions || []).filter(c => c.status === 'PENDING').reduce((a,b) => a + b.commissionCredits, 0);
  const lifetimeComm = (commissions || []).reduce((a,b) => a + b.commissionCredits, 0);

  if (!provider) return <div className="p-8 text-center text-slate-500">Loading provider profile...</div>;

  // --- SUB-PAGES ---
  
  const Overview = () => (
      <div className="space-y-8 animate-fade-in">
          <div className="flex justify-between items-center">
              <div>
                  <h1 className="text-3xl font-bold text-slate-900">Affiliate Dashboard</h1>
                  <p className="text-slate-500 mt-1">Level: <strong className="text-brand-600 uppercase">{provider.providerProfile?.levelId || 'N/A'}</strong></p>
              </div>
          </div>

          <CommissionSummary pending={pendingComm} available={user?.credits || 0} lifetime={lifetimeComm} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                  <ReferralCard provider={provider} />
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <h3 className="font-bold text-slate-900 mb-4">Recent Referrals</h3>
                      <ReferralList referrals={referrals.slice(0, 5)} />
                  </div>
              </div>
              <div className="space-y-6">
                   <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <Shield size={18} className="text-brand-600"/> Partner Level
                      </h3>
                      <div className="text-center py-4 bg-brand-50 rounded-xl mb-4">
                          <div className="text-3xl font-extrabold text-brand-700 uppercase">{provider.providerProfile?.levelId || 'N/A'}</div>
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

  const EarningsPage = () => {
      return (
          <div className="space-y-8 animate-fade-in">
              <h2 className="text-2xl font-bold text-slate-900">Earnings & Referrals</h2>
              
              {/* Referrals Section */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-bold text-lg mb-4">My Referrals</h3>
                  <ReferralList referrals={referrals} />
              </div>

              {/* Commissions Section */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 font-bold text-slate-800">Commission History</div>
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
                                    <td className="px-6 py-4 text-right font-bold text-green-600">+{c.commissionCredits} Cr</td>
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
  };

  const PayoutsPage = () => {
      // Check if payment info is set up
      const hasPaymentInfo = user?.paymentMethod && user?.paymentDetails;
      
      // Mask payment details for display
      const maskPaymentDetails = (details: string) => {
          if (!details) return '';
          if (details.includes('@')) {
              // Email format
              const [local, domain] = details.split('@');
              return `${local.charAt(0)}***${local.charAt(local.length - 1)}@${domain}`;
          } else {
              // Bank account format
              return `***${details.slice(-4)}`;
          }
      };

      return (
          <div className="space-y-8 animate-fade-in">
              <h2 className="text-2xl font-bold text-slate-900">Payouts</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                      <h3 className="font-bold text-lg mb-4">Request New Payout</h3>
                      <div className="bg-green-50 border border-green-100 p-4 rounded-xl mb-6 flex justify-between items-center">
                          <span className="text-green-800 font-medium">Available Credits</span>
                          <span className="text-2xl font-bold text-green-700">{Number(user?.credits || 0).toFixed(2)} Cr</span>
                          <span className="text-xs text-green-600">= ${Number(user?.credits || 0).toFixed(2)} USD</span>
                      </div>
                      
                      {!hasPaymentInfo ? (
                          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                              <p className="text-yellow-800 font-medium mb-3">
                                  ⚠️ Payment Information Required
                              </p>
                              <p className="text-sm text-yellow-700 mb-4">
                                  Please set up your payment information in Profile before requesting a payout.
                              </p>
                          </div>
                      ) : (
                          <form onSubmit={handleRequestPayout} className="space-y-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Credits to Withdraw</label>
                                  <input 
                                      type="number" 
                                      max={user?.credits}
                                      min={50}
                                      value={payoutAmount}
                                      onChange={e => setPayoutAmount(e.target.value)}
                                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                      placeholder="Min 50 credits"
                                      required
                                  />
                                  {payoutAmount && Number(payoutAmount) >= 50 ? (
                                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                          <p className="text-xs font-bold text-green-900 mb-2">
                                              You will receive: ${Number(payoutAmount).toFixed(2)} USD
                                          </p>
                                          <div className="flex items-center gap-2 mb-2">
                                              <label className="text-xs text-slate-600">Equivalent to:</label>
                                              <select 
                                                  value={selectedCurrency}
                                                  onChange={(e) => setSelectedCurrency(e.target.value)}
                                                  className="text-xs px-2 py-1 border border-green-300 rounded bg-white focus:ring-1 focus:ring-green-500 outline-none"
                                              >
                                                  {currencies.map(curr => (
                                                      <option key={curr.code} value={curr.code}>
                                                          {curr.code} - {curr.name}
                                                      </option>
                                                  ))}
                                              </select>
                                          </div>
                                          {selectedCurrency !== 'USD' && (() => {
                                              const equiv = calculateEquivalent(Number(payoutAmount), selectedCurrency);
                                              return (
                                                  <p className="text-sm font-bold text-green-700">
                                                      ≈ {equiv.symbol}{equiv.amount.toLocaleString()} {equiv.code}
                                                  </p>
                                              );
                                          })()}
                                          <p className="text-xs text-slate-500 mt-2">
                                              ℹ️ Actual payout in USD. Your bank will convert to local currency.
                                          </p>
                                      </div>
                                  ) : (
                                      <p className="text-xs text-orange-600 mt-2 font-medium">
                                          Minimum withdrawal: 50 credits ($50.00 USD)
                                      </p>
                                  )}
                              </div>
                              
                              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                      <label className="block text-sm font-medium text-slate-700">Payment Method</label>
                                      <span className="text-xs text-slate-500">🔒 From Profile</span>
                                  </div>
                                  <input 
                                      type="text" 
                                      value={user?.paymentMethod || 'Bank'}
                                      disabled
                                      className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-600 cursor-not-allowed"
                                  />
                              </div>
                              
                              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                      <label className="block text-sm font-medium text-slate-700">Payment Details</label>
                                      <span className="text-xs text-slate-500">🔒 From Profile</span>
                                  </div>
                                  <input 
                                      type="text" 
                                      value={maskPaymentDetails(user?.paymentDetails || '')}
                                      disabled
                                      className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-600 cursor-not-allowed"
                                  />
                              </div>
                              
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                  💡 To update payment info, go to Profile in the sidebar
                              </p>
                              
                              <button 
                                  type="submit" 
                                  disabled={!payoutAmount || Number(payoutAmount) > (user?.credits || 0) || Number(payoutAmount) < 50}
                                  className="w-full py-3 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                              >
                                  Submit Request
                              </button>
                          </form>
                      )}
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                      <h3 className="font-bold text-lg mb-4">Important Notes</h3>
                      <div className="space-y-4 text-sm text-slate-600">
                          <p><strong>Processing Time:</strong> Payouts are typically processed within 3-5 business days</p>
                          <p><strong>Minimum Amount:</strong> 50 credits required for withdrawal</p>
                          <p><strong>Payment Details:</strong> Ensure your payment account is valid and active</p>
                          <p className="text-xs text-slate-400 mt-4">
                              {hasPaymentInfo 
                                  ? `Payouts will be sent to your ${user?.paymentMethod} account`
                                  : 'Set up payment information in Profile to receive payouts'}
                          </p>
                      </div>
                  </div>
              </div>

              <PayoutHistoryTable payouts={payouts} />
          </div>
      );
  };

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

  return (
    <div className="animate-fade-in">
        {tab === 'overview' && <Overview />}
        {tab === 'earnings' && <EarningsPage />}
        {tab === 'payouts' && <PayoutsPage />}
        {tab === 'chat' && <ChatPage />}
    </div>
  );
}
