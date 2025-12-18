
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useApp } from '../App';
import { Payout } from '../types';
import { DollarSign, Clock, CheckCircle, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { EarningStatusBadge } from '../components/Mentor/EarningStatusBadge';

export default function MentorPayout() {
    const { user, refreshUser } = useApp();
    const [balanceDetails, setBalanceDetails] = useState({ payable: 0, paid: 0, pending: 0 });
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Request State
    const [requestAmount, setRequestAmount] = useState('');
    const [requestMethod, setRequestMethod] = useState('Bank Transfer');
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        if(user) loadData();
    }, [user]);

    const loadData = async () => {
        if(!user) return;
        setLoading(true);
        const [details, payoutHistory] = await Promise.all([
            api.getMentorBalanceDetails(user.id),
            api.getPayouts(user.id)
        ]);
        setBalanceDetails(details);
        setPayouts(payoutHistory.sort((a,b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
        setLoading(false);
    };

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!user) return;
        
        setIsRequesting(true);
        try {
            await api.requestPayout(user.id, Number(requestAmount), requestMethod);
            await refreshUser();
            await loadData();
            setRequestAmount('');
            alert("Payout request submitted successfully!");
        } catch(err: any) {
            alert(err);
        } finally {
            setIsRequesting(false);
        }
    };

    if(loading) return <div className="p-12 text-center text-slate-400">Loading payout data...</div>;

    const minPayout = 50;
    const canRequest = balanceDetails.payable >= minPayout;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900">Payout Center</h1>
                <button onClick={loadData} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <DollarSign size={100} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-green-100 mb-2 font-medium">
                            <DollarSign size={20} /> Available for Payout
                        </div>
                        <div className="text-4xl font-extrabold tracking-tight">${balanceDetails.payable.toFixed(2)}</div>
                        <p className="text-sm mt-2 text-green-100">Ready to withdraw</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-slate-500 mb-2 font-medium">
                            <Clock size={20} className="text-yellow-500" /> Pending Processing
                        </div>
                        <div className="text-3xl font-bold text-slate-900">${balanceDetails.pending.toFixed(2)}</div>
                    </div>
                    <div className="text-xs text-slate-400 mt-4">Includes requested & held funds</div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-slate-500 mb-2 font-medium">
                            <TrendingUp size={20} className="text-blue-500" /> Total Paid
                        </div>
                        <div className="text-3xl font-bold text-slate-900">${balanceDetails.paid.toFixed(2)}</div>
                    </div>
                    <div className="text-xs text-slate-400 mt-4">Lifetime earnings withdrawn</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Request Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Request Payout</h2>
                        
                        {!canRequest && (
                            <div className="bg-orange-50 border border-orange-100 text-orange-800 p-3 rounded-xl text-sm mb-4 flex items-start gap-2">
                                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                <span>Minimum withdrawal is ${minPayout}. Keep earning!</span>
                            </div>
                        )}

                        <form onSubmit={handleRequest} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Amount ($)</label>
                                <input 
                                    type="number" 
                                    min={minPayout}
                                    max={balanceDetails.payable}
                                    step="0.01"
                                    value={requestAmount}
                                    onChange={(e) => setRequestAmount(e.target.value)}
                                    disabled={!canRequest}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none disabled:bg-slate-50"
                                    placeholder="0.00"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Method</label>
                                <select 
                                    value={requestMethod}
                                    onChange={(e) => setRequestMethod(e.target.value)}
                                    disabled={!canRequest}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none disabled:bg-slate-50"
                                >
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="PayPal">PayPal</option>
                                    <option value="Wise">Wise</option>
                                </select>
                            </div>

                            <button 
                                type="submit"
                                disabled={!canRequest || !requestAmount || isRequesting}
                                className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-200"
                            >
                                {isRequesting ? 'Processing...' : 'Submit Request'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* History Table */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-900">Payout History</h2>
                        </div>
                        
                        {payouts.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">No payout requests yet.</div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Method</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {payouts.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-slate-600">
                                                {new Date(p.requestedAt).toLocaleDateString()}
                                                <div className="text-xs text-slate-400">{new Date(p.requestedAt).toLocaleTimeString()}</div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-800">{p.method}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                                    p.status === 'PAID' ? 'bg-green-100 text-green-800 border-green-200' :
                                                    p.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                                    p.status === 'APPROVED_PENDING_PAYMENT' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                    'bg-red-100 text-red-800 border-red-200'
                                                }`}>
                                                    {p.status === 'APPROVED_PENDING_PAYMENT' ? 'PROCESSING' : p.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900">${p.amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
