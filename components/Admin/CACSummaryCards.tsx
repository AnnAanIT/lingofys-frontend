
import React from 'react';
import { CACSummary } from '../../types';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface CACSummaryCardsProps {
    summary: CACSummary;
}

export const CACSummaryCards: React.FC<CACSummaryCardsProps> = ({ summary }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Total Top-up Revenue</p>
                        <h3 className="text-2xl font-extrabold text-slate-900 mt-1">${summary.revenue.toLocaleString()}</h3>
                    </div>
                    <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                        <TrendingUp size={20} />
                    </div>
                </div>
                <p className="text-xs text-slate-400">Total volume from mentees</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Total Marketing Cost (CAC)</p>
                        <h3 className="text-2xl font-extrabold text-slate-900 mt-1">${summary.cac.toLocaleString()}</h3>
                    </div>
                    <div className="p-2 bg-red-100 text-red-700 rounded-lg">
                        <TrendingDown size={20} />
                    </div>
                </div>
                <p className="text-xs text-slate-400">Provider commissions</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">CAC Ratio</p>
                        <h3 className="text-2xl font-extrabold text-brand-600 mt-1">{(summary.cacRatio * 100).toFixed(1)}%</h3>
                    </div>
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                        <Activity size={20} />
                    </div>
                </div>
                <p className="text-xs text-slate-400">Marketing efficiency</p>
            </div>

            <div className="bg-slate-900 p-6 rounded-xl shadow-lg text-white">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-slate-400 text-sm font-medium">Gross Profit (After CAC)</p>
                        <h3 className="text-2xl font-extrabold text-white mt-1">${summary.grossProfit.toLocaleString()}</h3>
                    </div>
                    <div className="p-2 bg-slate-800 text-white rounded-lg">
                        <DollarSign size={20} />
                    </div>
                </div>
                <p className="text-xs text-slate-500">Revenue - CAC</p>
            </div>
        </div>
    );
};
