
import React from 'react';
import { MentorEarning } from '../../types';
import { EarningStatusBadge } from './EarningStatusBadge';

interface EarningTableProps {
    earnings: MentorEarning[];
}

export const EarningTable: React.FC<EarningTableProps> = ({ earnings }) => {
    if (earnings.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-400">
                No earnings records found.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Session ID</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {earnings.map((e) => (
                        <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-slate-500">
                                {new Date(e.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-600">
                                {e.bookingId}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <EarningStatusBadge status={e.status} />
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900">
                                ${e.amount.toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
