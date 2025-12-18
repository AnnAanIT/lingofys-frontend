
import React from 'react';
import { LevelPerformance } from '../../types';

interface LevelCACTableProps {
    data: LevelPerformance[];
}

export const LevelCACTable: React.FC<LevelCACTableProps> = ({ data }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                        <th className="px-6 py-4">Provider Level</th>
                        <th className="px-6 py-4 text-center">Active Providers</th>
                        <th className="px-6 py-4 text-right">Total Revenue</th>
                        <th className="px-6 py-4 text-right">Total CAC</th>
                        <th className="px-6 py-4 text-right">Avg CAC Ratio</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.map((l) => (
                        <tr key={l.levelId} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                    l.levelId === 'gold' ? 'bg-yellow-100 text-yellow-700' : 
                                    l.levelId === 'silver' ? 'bg-slate-200 text-slate-700' : 
                                    'bg-orange-100 text-orange-700'
                                }`}>
                                    {l.levelId}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-center text-slate-600">{l.providerCount}</td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900">${l.totalRevenue.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right font-medium text-red-600">-${l.totalCAC.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right font-bold text-slate-800">{(l.cacRatio * 100).toFixed(1)}%</td>
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No level data found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
