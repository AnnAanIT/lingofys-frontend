
import React from 'react';
import { ProviderCommission } from '../../types';

interface ProviderCommissionHistoryTableProps {
    commissions: ProviderCommission[];
}

export const ProviderCommissionHistoryTable: React.FC<ProviderCommissionHistoryTableProps> = ({ commissions }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-slate-800">Commission Ledger</div>
            <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 sticky top-0">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Mentee</th>
                            <th className="px-6 py-3 text-right">Top-up</th>
                            <th className="px-6 py-3 text-center">Rate</th>
                            <th className="px-6 py-3 text-right">Commission</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {commissions.map(c => (
                            <tr key={c.id} className="hover:bg-slate-50">
                                <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-3 font-medium text-slate-900">{c.menteeName}</td>
                                <td className="px-6 py-3 text-right text-slate-600">${c.topupAmountUsd.toFixed(2)}</td>
                                <td className="px-6 py-3 text-center text-slate-500">{c.commissionPercent}%</td>
                                <td className="px-6 py-3 text-right font-mono font-bold text-green-600">
                                    +${c.commissionAmountUsd.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                        {commissions.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No commissions found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
