
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AdminLayout } from '../components/AdminComponents';
import { CACSummaryCards } from '../components/Admin/CACSummaryCards';
import { CACRevenueChart } from '../components/Admin/CACRevenueChart';
import { ProviderCACTable } from '../components/Admin/ProviderCACTable';
import { LevelCACTable } from '../components/Admin/LevelCACTable';
import { CACFilters } from '../components/Admin/CACFilters';
import { CACDashboardData } from '../types';
import { PieChart, RefreshCw, BarChart2 } from 'lucide-react';

export default function AdminCACDashboard() {
    const [data, setData] = useState<CACDashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        const stats = await api.getAdminCACStats();
        setData(stats);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading || !data) return <AdminLayout><div>Loading CAC Analytics...</div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                            <PieChart className="text-brand-600" /> CAC Analysis
                        </h1>
                        <p className="text-slate-500 mt-1">Marketing Efficiency & Provider Commission ROI.</p>
                    </div>
                    <button onClick={loadData} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                        <RefreshCw size={20} />
                    </button>
                </div>

                <CACSummaryCards summary={data.summary} />

                {/* <CACFilters /> */}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-900 mb-6 flex items-center">
                            <BarChart2 size={20} className="mr-2 text-slate-400" /> Revenue vs CAC (Time Series)
                        </h3>
                        <CACRevenueChart data={data.timeSeries} />
                    </div>
                    
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-900 mb-4">Level Performance</h3>
                            <div className="overflow-x-auto">
                                <LevelCACTable data={data.byLevel} />
                            </div>
                        </div>
                        
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                            <strong>Insight:</strong>
                            <p className="mt-1">
                                Gross Profit is calculated strictly as Top-up Revenue minus Provider Commissions. 
                                It does not include Mentor Payouts (Cost of Goods Sold).
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-900 mb-6">Provider Performance Breakdown</h3>
                    <ProviderCACTable data={data.byProvider} />
                </div>
            </div>
        </AdminLayout>
    );
}
