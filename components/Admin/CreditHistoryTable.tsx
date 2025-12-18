
import React from 'react';
import { CreditHistoryEntry } from '../../types';

interface CreditHistoryTableProps {
    history: CreditHistoryEntry[];
}

export const CreditHistoryTable: React.FC<CreditHistoryTableProps> = ({ history }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-slate-800">History Log</div>
            <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 sticky top-0">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Note</th>
                            <th className="px-6 py-3 text-right">Amount</th>
                            <th className="px-6 py-3 text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {history.map(entry => (
                            <tr key={entry.id} className="hover:bg-slate-50">
                                <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{new Date(entry.timestamp).toLocaleString()}</td>
                                <td className="px-6 py-3">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${
                                        entry.type === 'admin_adjustment' ? 'bg-purple-100 text-purple-700' :
                                        entry.type === 'topup' ? 'bg-green-100 text-green-700' :
                                        entry.type === 'refund' ? 'bg-blue-100 text-blue-700' :
                                        'bg-slate-100 text-slate-700'
                                    }`}>
                                        {entry.type.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-slate-600 max-w-[200px] truncate" title={entry.note}>{entry.note || '-'}</td>
                                <td className={`px-6 py-3 text-right font-mono font-bold ${entry.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {entry.amount > 0 ? '+' : ''}{entry.amount}
                                </td>
                                <td className="px-6 py-3 text-right font-mono font-bold text-slate-900">{entry.balanceAfter}</td>
                            </tr>
                        ))}
                        {history.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No credit history found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
