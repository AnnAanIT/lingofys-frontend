
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AdminLayout } from '../components/AdminComponents';
import { MonthlyRevenueResponse } from '../types';
import { Calendar as CalendarIcon, Scale, AlertTriangle, CheckCircle, Wallet, Users, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';

// Generate last 12 months options
const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        options.push({
            month: date.getMonth() + 1,
            year: date.getFullYear(),
            label: date.toLocaleString('default', { month: 'long', year: 'numeric' })
        });
    }
    return options;
};

export default function AdminRevenue() {
    const monthOptions = generateMonthOptions();
    const [selectedPeriod, setSelectedPeriod] = useState(0); // Index into monthOptions
    const [revenueData, setRevenueData] = useState<MonthlyRevenueResponse | null>(null);
    const [loading, setLoading] = useState(false);

    // Real Financial Audit Data (All-time)
    const [health, setHealth] = useState<{
        cashIn: number,
        cashOut: number,
        realCash: number,
        totalLiability: number,
        breakdown: {
            creditLiability: number,
            pendingPayouts: number,
            subscriptionLiability: number
        },
        cashSurplus: number
    } | null>(null);

    useEffect(() => {
        loadData();
    }, [selectedPeriod]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [h, revenue] = await Promise.all([
                api.getSystemFinancialHealth(),
                api.getMonthlyRevenue(monthOptions[selectedPeriod].month, monthOptions[selectedPeriod].year)
            ]);
            setHealth(h);
            setRevenueData(revenue);
        } catch (err) {
            console.error('Failed to load financial data:', err);
        } finally {
            setLoading(false);
        }
    };

    const currentPeriod = monthOptions[selectedPeriod];

    return (
        <AdminLayout>
            <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Financial Overview</h1>
                        <p className="text-slate-500 mt-1">System solvency and monthly revenue summary.</p>
                    </div>

                    {/* Month Selector */}
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200">
                        <CalendarIcon size={18} className="text-slate-400" />
                        <select
                            value={selectedPeriod}
                            onChange={e => setSelectedPeriod(Number(e.target.value))}
                            className="bg-transparent outline-none text-sm font-medium text-slate-700 cursor-pointer"
                        >
                            {monthOptions.map((opt, idx) => (
                                <option key={idx} value={idx}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* SYSTEM SOLVENCY CARDS - All-time data */}
                {health && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* 1. NET CASH */}
                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Cash Position</h3>
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Wallet size={18} /></div>
                            </div>
                            <div className="text-2xl font-extrabold text-slate-900 mb-1">${Number(health.realCash).toFixed(2)}</div>
                            <div className="text-xs text-slate-500 flex gap-4">
                                <span className="text-green-600">In: ${Number(health.cashIn).toFixed(2)}</span>
                                <span className="text-red-600">Out: ${Number(health.cashOut).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* 2. LIABILITIES */}
                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Liability</h3>
                                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Users size={18} /></div>
                            </div>
                            <div className="text-2xl font-extrabold text-slate-900 mb-1">${Number(health.totalLiability).toFixed(2)}</div>
                            <div className="text-xs text-slate-500 space-y-0.5">
                                <div className="flex justify-between">
                                    <span>Credits</span>
                                    <span className="font-medium">${Number(health.breakdown.creditLiability).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Subscriptions</span>
                                    <span className="font-medium">${Number(health.breakdown.subscriptionLiability).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Pending Payouts</span>
                                    <span className="font-medium">${Number(health.breakdown.pendingPayouts).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. SOLVENCY */}
                        <div className={`rounded-xl border p-5 shadow-sm ${health.cashSurplus >= 0 ? 'bg-slate-900 text-white border-slate-800' : 'bg-red-50 text-red-900 border-red-200'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className={`text-xs font-bold uppercase tracking-wider ${health.cashSurplus >= 0 ? 'text-slate-400' : 'text-red-700'}`}>Net Solvency</h3>
                                <div className={`p-2 rounded-lg ${health.cashSurplus >= 0 ? 'bg-slate-800 text-green-400' : 'bg-red-100 text-red-600'}`}>
                                    <Scale size={18} />
                                </div>
                            </div>
                            <div className="text-2xl font-extrabold mb-1">
                                {health.cashSurplus >= 0 ? '+' : ''}${Number(health.cashSurplus).toFixed(2)}
                            </div>
                            <div className="flex items-center gap-2">
                                {health.cashSurplus >= 0 ? (
                                    <span className="flex items-center text-green-400 text-xs font-bold"><CheckCircle size={14} className="mr-1" /> Solvent</span>
                                ) : (
                                    <span className="flex items-center text-red-600 text-xs font-bold"><AlertTriangle size={14} className="mr-1" /> Under-collateralized</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* MONTHLY SUMMARY */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <CalendarIcon size={16} className="text-brand-600" />
                        {currentPeriod.label} Summary
                    </h3>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : revenueData ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Top-up In */}
                            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-green-700 uppercase">Top-up (In)</span>
                                    <TrendingUp size={16} className="text-green-600" />
                                </div>
                                <div className="text-xl font-bold text-green-800 mt-1">
                                    ${Number(revenueData.totalTopup).toFixed(2)}
                                </div>
                            </div>

                            {/* Payout Out */}
                            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-red-700 uppercase">Payout (Out)</span>
                                    <TrendingDown size={16} className="text-red-600" />
                                </div>
                                <div className="text-xl font-bold text-red-800 mt-1">
                                    ${Number(revenueData.totalPayout).toFixed(2)}
                                </div>
                            </div>

                            {/* Net */}
                            <div className="bg-slate-100 rounded-lg p-4 border border-slate-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-600 uppercase">Net Flow</span>
                                    <ArrowRightLeft size={16} className="text-slate-500" />
                                </div>
                                <div className={`text-xl font-bold mt-1 ${revenueData.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                    {revenueData.net >= 0 ? '+' : ''}${Number(revenueData.net).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            No data available for this period.
                        </div>
                    )}
                </div>

                {/* Info Note */}
                <div className="text-xs text-slate-400 text-center">
                    Solvency cards show all-time totals. Monthly summary shows selected period only.
                </div>
            </div>
        </AdminLayout>
    );
}
