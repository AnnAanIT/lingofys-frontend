
import React from 'react';
import { SystemCreditLedgerEntry } from '../../types';
import { StatusBadge } from '../AdminComponents';
import { ArrowRight } from 'lucide-react';

interface CreditLedgerTableProps {
    records: SystemCreditLedgerEntry[];
}

export const CreditLedgerTable: React.FC<CreditLedgerTableProps> = ({ records }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Booking ID</th>
                        <th className="px-6 py-4">Flow (From → To)</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {records.map(record => (
                        <tr key={record.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                {new Date(record.createdAt).toLocaleDateString()} <br/>
                                <span className="text-xs text-slate-400">{new Date(record.createdAt).toLocaleTimeString()}</span>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">
                                {record.bookingId}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono text-xs">{record.fromUserId}</span>
                                    <ArrowRight size={14} className="text-slate-400" />
                                    <span className={`px-2 py-1 rounded font-mono text-xs font-bold ${
                                        record.toUserId === 'system' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {record.toUserId}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <StatusBadge status={record.status} />
                            </td>
                            <td className={`px-6 py-4 text-right font-bold font-mono ${record.amount < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                                {record.amount.toFixed(2)}
                            </td>
                        </tr>
                    ))}
                    {records.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                No ledger records found matching your filters.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
