
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AdminLayout, ConfirmDialog } from '../components/AdminComponents';
import { DollarSign, CheckCircle, Clock, TrendingUp, Filter } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

interface Commission {
    id: string;
    providerId: string;
    menteeId: string;
    menteeName: string;
    topupAmountUsd: number;
    commissionAmountUsd: number;
    commissionCredits: number; // ✅ Commission in credits
    commissionRate: number;
    status: string;
    createdAt: string;
    paidAt?: string;
    provider?: {
        id: string;
        referralCode: string;
        user: {
            id: string;
            name: string;
            email: string;
        };
    };
}

export default function AdminProviderCommissions() {
    const { error: showError } = useToast();
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');
    const [loading, setLoading] = useState(true);
    const [payingCommission, setPayingCommission] = useState<Commission | null>(null);
    const [stats, setStats] = useState({
        totalPaid: 0,
        totalPending: 0,
        countPaid: 0,
        countPending: 0
    });

    useEffect(() => {
        loadData();
    }, [filterStatus]);

    const loadData = async () => {
        setLoading(true);
        try {
            const status = filterStatus === 'ALL' ? undefined : filterStatus;
            const data = await api.getAllProviderCommissions(status);
            setCommissions(data);
            calculateStats(data);
        } catch (err) {
            console.error('Error loading commissions:', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data: Commission[]) => {
        const paid = data.filter(c => c.status === 'PAID');
        const pending = data.filter(c => c.status === 'PENDING');

        setStats({
            totalPaid: paid.reduce((sum, c) => sum + Number(c.commissionCredits), 0),
            totalPending: pending.reduce((sum, c) => sum + Number(c.commissionCredits), 0),
            countPaid: paid.length,
            countPending: pending.length
        });
    };

    const handleMarkAsPaid = async () => {
        if (!payingCommission) return;

        try {
            await api.markCommissionPaid(payingCommission.id);
            await loadData();
            setPayingCommission(null);
        } catch (err: any) {
            showError('Payment Failed', err.message);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatRate = (rate: number) => {
        return (Number(rate) * 100).toFixed(2) + '%';
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <DollarSign className="text-green-600" /> Provider Commissions
                        </h1>
                        <p className="text-slate-500 mt-1">Manage affiliate commissions and payouts.</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Paid</div>
                                <div className="text-2xl font-black text-green-600 mt-2">
                                    ${stats.totalPaid.toFixed(2)}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">{stats.countPaid} commissions</div>
                            </div>
                            <CheckCircle className="text-green-600" size={32} />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pending</div>
                                <div className="text-2xl font-black text-orange-600 mt-2">
                                    ${stats.totalPending.toFixed(2)}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">{stats.countPending} commissions</div>
                            </div>
                            <Clock className="text-orange-600" size={32} />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Liability</div>
                                <div className="text-2xl font-black text-slate-900 mt-2">
                                    ${(stats.totalPaid + stats.totalPending).toFixed(2)}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">All time</div>
                            </div>
                            <TrendingUp className="text-slate-600" size={32} />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Commission</div>
                                <div className="text-2xl font-black text-slate-900 mt-2">
                                    {commissions.length > 0 ? (commissions.reduce((sum, c) => sum + Number(c.commissionCredits), 0) / commissions.length).toFixed(2) : '0.00'} Cr
                                </div>
                                <div className="text-xs text-slate-500 mt-1">Per transaction</div>
                            </div>
                            <DollarSign className="text-slate-600" size={32} />
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 flex gap-2">
                    <button
                        onClick={() => setFilterStatus('ALL')}
                        className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${
                            filterStatus === 'ALL'
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        All ({stats.countPaid + stats.countPending})
                    </button>
                    <button
                        onClick={() => setFilterStatus('PENDING')}
                        className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${
                            filterStatus === 'PENDING'
                                ? 'bg-orange-600 text-white'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <Clock className="inline mr-1" size={16} />
                        Pending ({stats.countPending})
                    </button>
                    <button
                        onClick={() => setFilterStatus('PAID')}
                        className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${
                            filterStatus === 'PAID'
                                ? 'bg-green-600 text-white'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <CheckCircle className="inline mr-1" size={16} />
                        Paid ({stats.countPaid})
                    </button>
                </div>

                {/* Commissions Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-slate-500">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
                            Loading commissions...
                        </div>
                    ) : commissions.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <DollarSign className="mx-auto mb-4 text-slate-300" size={48} />
                            <p className="font-bold">No commissions found</p>
                            <p className="text-sm mt-2">Commissions will appear here when mentees top up.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left">Provider</th>
                                    <th className="px-6 py-4 text-left">Mentee</th>
                                    <th className="px-6 py-4 text-right">Topup Amount</th>
                                    <th className="px-6 py-4 text-right">Rate</th>
                                    <th className="px-6 py-4 text-right">Commission</th>
                                    <th className="px-6 py-4 text-left">Date</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {commissions.map(commission => (
                                    <tr key={commission.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">
                                                {commission.provider?.user.name || 'Unknown'}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {commission.provider?.referralCode || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">
                                                {commission.menteeName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono">
                                            <span className="font-bold text-slate-900">
                                                ${Number(commission.topupAmountUsd).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">
                                                {formatRate(commission.commissionRate)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono">
                                            <span className="font-black text-green-600">
                                                {Number(commission.commissionCredits).toFixed(2)} Cr
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-xs">
                                            {formatDate(commission.createdAt)}
                                            {commission.paidAt && (
                                                <div className="text-green-600 mt-1">
                                                    Paid: {formatDate(commission.paidAt)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {commission.status === 'PAID' ? (
                                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                                                    <CheckCircle size={14} />
                                                    PAID
                                                </span>
                                            ) : (
                                                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                                                    <Clock size={14} />
                                                    PENDING
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {commission.status === 'PENDING' && (
                                                <button
                                                    onClick={() => setPayingCommission(commission)}
                                                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors"
                                                >
                                                    Mark as Paid
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Confirm Payment Dialog */}
                <ConfirmDialog
                    isOpen={!!payingCommission}
                    onClose={() => setPayingCommission(null)}
                    onConfirm={handleMarkAsPaid}
                    title="Mark Commission as Paid"
                    message={payingCommission ? 
                        `Mark ${Number(payingCommission.commissionCredits).toFixed(2)} Cr commission for ${payingCommission.menteeName} as paid?` 
                        : ''}
                />
            </div>
        </AdminLayout>
    );
}
