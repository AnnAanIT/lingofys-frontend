
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AdminLayout } from '../components/AdminComponents';
import { RevenueChart } from '../components/Admin/RevenueChart';
import { RevenueSummary } from '../components/Admin/RevenueSummary';
import { WeeklyRevenueResponse, MonthlyRevenueResponse } from '../types';
import { BarChart2, Calendar as CalendarIcon, TrendingUp, Scale, AlertTriangle, CheckCircle, Wallet, Users, Clock } from 'lucide-react';
import { useApp } from '../App';

export default function AdminRevenue() {
  const { user } = useApp();
  const [view, setView] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [weeklyData, setWeeklyData] = useState<WeeklyRevenueResponse | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenueResponse | null>(null);
  
  // Real Financial Audit Data
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
  
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, [view, month, year]);

  const loadData = async () => {
      const h = await api.getSystemFinancialHealth();
      setHealth(h);

      if (view === 'WEEKLY') {
          const data = await api.getWeeklyRevenue();
          setWeeklyData(data);
          setMonthlyData(null);
      } else {
          const data = await api.getMonthlyRevenue();
          setMonthlyData(data);
          setWeeklyData(null);
      }
  };

  const activeData = view === 'WEEKLY' ? weeklyData : monthlyData;
  const displayLabel = view === 'WEEKLY' && weeklyData 
      ? `Weekly Volume (${weeklyData.week})` 
      : monthlyData 
          ? `Monthly Volume (${monthlyData.month})` 
          : 'Volume';

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Financial Audit & Revenue</h1>
                <p className="text-slate-500 mt-1">Real-time Solvency Health and Cash Flow Analysis.</p>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setView('WEEKLY')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${view === 'WEEKLY' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Weekly
                </button>
                <button 
                    onClick={() => setView('MONTHLY')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${view === 'MONTHLY' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Monthly
                </button>
            </div>
        </div>

        {/* SYSTEM SOLVENCY CARD - AUDIT VIEW */}
        {health && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. REAL CASH (ASSETS) */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Net Cash Position</h3>
                            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Wallet size={20} /></div>
                        </div>
                        <div className="text-3xl font-extrabold text-slate-900 mb-2">${Number(health.realCash).toFixed(2)}</div>
                        <div className="text-xs text-slate-500 flex justify-between">
                            <span className="text-green-600">In: ${Number(health.cashIn).toFixed(2)}</span>
                            <span className="text-red-600">Out: ${Number(health.cashOut).toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
                        Actual bank balance from transactions.
                    </div>
                </div>

                {/* 2. LIABILITIES */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Liability</h3>
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Users size={20} /></div>
                        </div>
                        <div className="text-3xl font-extrabold text-slate-900 mb-2">${Number(health.totalLiability).toFixed(2)}</div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">User Credits</span>
                                <span className="font-bold">${Number(health.breakdown.creditLiability).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Subscription Obligation</span>
                                <span className="font-bold">${Number(health.breakdown.subscriptionLiability).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Pending Payouts</span>
                                <span className="font-bold">${Number(health.breakdown.pendingPayouts).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. SOLVENCY (NET) */}
                <div className={`rounded-xl border p-6 shadow-sm flex flex-col justify-between ${health.cashSurplus >= 0 ? 'bg-slate-900 text-white border-slate-800' : 'bg-red-50 text-red-900 border-red-200'}`}>
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-sm font-bold uppercase tracking-wider ${health.cashSurplus >= 0 ? 'text-slate-400' : 'text-red-700'}`}>Net Solvency</h3>
                            <div className={`p-2 rounded-lg ${health.cashSurplus >= 0 ? 'bg-slate-800 text-green-400' : 'bg-red-100 text-red-600'}`}>
                                <Scale size={20} />
                            </div>
                        </div>
                        <div className="text-3xl font-extrabold mb-2">
                            {health.cashSurplus >= 0 ? '+' : ''}${Number(health.cashSurplus).toFixed(2)}
                        </div>
                        <div className="flex items-center gap-2">
                            {health.cashSurplus >= 0 ? (
                                <span className="flex items-center text-green-400 text-sm font-bold"><CheckCircle size={16} className="mr-1"/> Solvent</span>
                            ) : (
                                <span className="flex items-center text-red-600 text-sm font-bold"><AlertTriangle size={16} className="mr-1"/> Under-collateralized</span>
                            )}
                        </div>
                    </div>
                    <div className={`mt-4 pt-4 border-t text-xs ${health.cashSurplus >= 0 ? 'border-slate-800 text-slate-500' : 'border-red-200 text-red-700'}`}>
                        Cash - Total Liabilities
                    </div>
                </div>
            </div>
        )}

        {view === 'MONTHLY' && (
            <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-200">
                <CalendarIcon size={18} className="text-slate-400" />
                <select value={month} onChange={e => setMonth(Number(e.target.value))} className="p-2 border border-slate-200 rounded-lg outline-none bg-white">
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>{new Date(0, m-1).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                </select>
                <select value={year} onChange={e => setYear(Number(e.target.value))} className="p-2 border border-slate-200 rounded-lg outline-none bg-white">
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>
        )}

        {activeData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-6 flex items-center">
                            {view === 'WEEKLY' ? <BarChart2 size={20} className="mr-2 text-brand-600" /> : <TrendingUp size={20} className="mr-2 text-brand-600" />} 
                            {displayLabel}
                        </h3>
                        <RevenueChart data={activeData?.days || []} type={view === 'WEEKLY' ? 'bar' : 'line'} />
                    </div>
                </div>
                <div className="space-y-6">
                    <RevenueSummary total={activeData?.totalTopup || 0} title="Total Top-up (In)" />
                    <RevenueSummary total={activeData?.totalPayout || 0} title="Total Payout (Out)" />
                    
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-500 mb-4">Internal Auditor Note</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Revenue is realized upon credit purchase. Expenses are realized upon payout. 
                            Ensure <strong>Net Solvency</strong> remains positive to guarantee all user withdrawals.
                        </p>
                    </div>
                </div>
            </div>
        )}
      </div>
    </AdminLayout>
  );
}
