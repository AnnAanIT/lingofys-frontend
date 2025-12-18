
import React from 'react';
import { DollarSign, Clock, RotateCcw, CheckCircle } from 'lucide-react';

interface CreditSummaryCardsProps {
    summary: {
        holding: number;
        released: number;
        refunded: number;
        pendingBookings: number;
    };
}

export const CreditSummaryCards: React.FC<CreditSummaryCardsProps> = ({ summary }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-500">Total Holding</h3>
                    <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                        <Clock size={20} />
                    </div>
                </div>
                <div>
                    <div className="text-3xl font-extrabold text-slate-900">${summary.holding}</div>
                    <p className="text-xs text-slate-400 mt-1">{summary.pendingBookings} bookings pending completion</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-500">Released to Mentors</h3>
                    <div className="p-2 bg-green-50 rounded-lg text-green-600">
                        <CheckCircle size={20} />
                    </div>
                </div>
                <div>
                    <div className="text-3xl font-extrabold text-slate-900">${summary.released}</div>
                    <p className="text-xs text-slate-400 mt-1">Successfully completed lessons</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-500">Refunded to Mentees</h3>
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <RotateCcw size={20} />
                    </div>
                </div>
                <div>
                    <div className="text-3xl font-extrabold text-slate-900">${summary.refunded}</div>
                    <p className="text-xs text-slate-400 mt-1">Cancellations & No-Shows</p>
                </div>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-300">Total Volume</h3>
                    <div className="p-2 bg-slate-800 rounded-lg text-white">
                        <DollarSign size={20} />
                    </div>
                </div>
                <div>
                    <div className="text-3xl font-extrabold">${summary.holding + summary.released + summary.refunded}</div>
                    <p className="text-xs text-slate-400 mt-1">Gross credit movement</p>
                </div>
            </div>
        </div>
    );
};
