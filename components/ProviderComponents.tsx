
import React, { useState } from 'react';
import { Copy, Check, DollarSign, Users, TrendingUp, Download, Clock } from 'lucide-react';
import { Referral, Commission, Payout, Provider } from '../types';
import { BRAND } from '../constants/brand';

// --- REFERRAL CARD ---
export const ReferralCard: React.FC<{ provider: Provider }> = ({ provider }) => {
    const [copied, setCopied] = useState(false);
    const referralCode = provider.providerProfile?.referralCode || '';
    const link = BRAND.getReferralUrl(referralCode);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-2">Your Referral Code</h3>
            <p className="text-sm text-slate-500 mb-4">Share this code with mentees to earn commission on their top-ups.</p>
            
            <div className="flex flex-col md:flex-row gap-3 items-center">
                <div className="flex-1 bg-brand-50 border-2 border-brand-200 rounded-xl px-6 py-4 text-center">
                    <div className="text-3xl font-bold text-brand-700 font-mono tracking-wider">{referralCode || 'N/A'}</div>
                </div>
                <button 
                    onClick={handleCopy}
                    className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all ${
                        copied ? 'bg-green-100 text-green-700' : 'bg-brand-600 text-white hover:bg-brand-700'
                    }`}
                >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
            </div>
            
            <div className="mt-4 text-xs text-slate-500 text-center">
                Mentees can enter this code during signup or in their profile
            </div>
        </div>
    );
};

// --- COMMISSION SUMMARY ---
export const CommissionSummary: React.FC<{ 
    pending: number, 
    available: number, 
    lifetime: number 
}> = ({ pending, available, lifetime }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center space-x-2 opacity-80 mb-2">
                <DollarSign size={20} />
                <span className="font-medium">Available Payout</span>
            </div>
            <div className="text-4xl font-extrabold">${available}</div>
            <p className="text-sm opacity-70 mt-2">Minimum payout: $50</p>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
             <div className="flex items-center space-x-2 text-slate-500 mb-2">
                <Clock size={20} />
                <span className="font-medium">Pending</span>
            </div>
            <div className="text-4xl font-extrabold text-slate-900">${pending}</div>
            <p className="text-sm text-slate-400 mt-2">Clears in 7 days</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
             <div className="flex items-center space-x-2 text-slate-500 mb-2">
                <TrendingUp size={20} />
                <span className="font-medium">Lifetime Earnings</span>
            </div>
            <div className="text-4xl font-extrabold text-slate-900">${lifetime}</div>
            <p className="text-sm text-slate-400 mt-2">Total gross revenue</p>
        </div>
    </div>
);

// --- REFERRAL LIST ---
export const ReferralList: React.FC<{ referrals: Referral[] }> = ({ referrals }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 font-bold text-slate-800 flex justify-between items-center">
            <span>Referred Users</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{referrals.length} Total</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                    <tr>
                        <th className="px-6 py-3 text-left">Mentee</th>
                        <th className="px-6 py-3 text-left">Signup Date</th>
                        <th className="px-6 py-3 text-left">Country</th>
                        <th className="px-6 py-3 text-right">Total Spending</th>
                        <th className="px-6 py-3 text-right">Commission Earned</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {referrals.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900">{r.menteeName}</td>
                            <td className="px-6 py-4">{new Date(r.signupDate).toLocaleDateString()}</td>
                            <td className="px-6 py-4">{r.country}</td>
                            <td className="px-6 py-4 text-right">${r.totalSpending}</td>
                            <td className="px-6 py-4 text-right font-bold text-green-600">+${r.totalCommission}</td>
                        </tr>
                    ))}
                    {referrals.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                No referrals yet. Share your link to get started!
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

// --- COMMISSION HISTORY TABLE ---
export const CommissionHistoryTable: React.FC<{ commissions: Commission[] }> = ({ commissions }) => (
     <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 font-bold text-slate-800">Commission History</div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                    <tr>
                        <th className="px-6 py-3 text-left">Date</th>
                        <th className="px-6 py-3 text-left">Source</th>
                        <th className="px-6 py-3 text-left">Mentee</th>
                        <th className="px-6 py-3 text-center">Status</th>
                        <th className="px-6 py-3 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {commissions.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-slate-500">{new Date(c.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                                <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                                    c.source === 'SUBSCRIPTION' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                    {c.source.replace('_', ' ')}
                                </span>
                            </td>
                            <td className="px-6 py-4">{c.menteeName}</td>
                            <td className="px-6 py-4 text-center">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                    c.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {c.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900">${c.amount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
     </div>
);

// --- PAYOUT HISTORY TABLE ---
export const PayoutHistoryTable: React.FC<{ payouts: Payout[] }> = ({ payouts }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-100 font-bold text-slate-800">Payout Requests</div>
        <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
                <tr>
                    <th className="px-6 py-3 text-left">Requested</th>
                    <th className="px-6 py-3 text-left">Method</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {payouts.map(p => (
                    <tr key={p.id}>
                        <td className="px-6 py-4">{new Date(p.requestedAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">{p.method || 'Default'}</td>
                        <td className="px-6 py-4">
                             <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                p.status === 'PAID' ? 'bg-green-100 text-green-700' : 
                                p.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                                {p.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold">${p.amount}</td>
                    </tr>
                ))}
                {payouts.length === 0 && (
                    <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400">No payout history.</td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);
