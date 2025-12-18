
import React from 'react';
import { ProviderPerformance } from '../../types';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface ProviderCACTableProps {
    data: ProviderPerformance[];
}

export const ProviderCACTable: React.FC<ProviderCACTableProps> = ({ data }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                        <th className="px-6 py-4">Provider</th>
                        <th className="px-6 py-4">Level</th>
                        <th className="px-6 py-4 text-right">Revenue Generated</th>
                        <th className="px-6 py-4 text-right">Commission Cost (CAC)</th>
                        <th className="px-6 py-4 text-right">CAC Ratio</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.map((p, idx) => (
                        <tr key={p.providerId} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-bold text-slate-900">
                                {p.providerName}
                                <div className="text-xs text-slate-400 font-mono font-normal">{p.providerId}</div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase">
                                    {p.levelId}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-slate-700">${p.revenueGenerated.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right font-medium text-red-600">-${p.commissionCost.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right">
                                <div className={`flex items-center justify-end font-bold ${p.cacRatio > 0.3 ? 'text-red-600' : 'text-green-600'}`}>
                                    {(p.cacRatio * 100).toFixed(1)}%
                                    {p.cacRatio > 0.3 ? <TrendingUp size={14} className="ml-1" /> : <TrendingDown size={14} className="ml-1" />}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No provider data found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
