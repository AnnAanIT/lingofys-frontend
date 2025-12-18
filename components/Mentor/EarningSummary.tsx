
import React from 'react';
import { DollarSign, Clock, CheckCircle } from 'lucide-react';

interface EarningSummaryProps {
    pending: number;
    payable: number;
    paid: number; // This remains in USD as it's lifetime payout
}

export const EarningSummary: React.FC<EarningSummaryProps> = ({ pending, payable, paid }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-slate-500 text-sm font-medium mb-1">Payable Credits</p>
                    <h3 className="text-3xl font-extrabold text-green-600">{payable.toFixed(2)}</h3>
                    <p className="text-xs text-slate-400 mt-1">Available for payout</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <DollarSign size={24} />
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-slate-500 text-sm font-medium mb-1">Pending Credits</p>
                    <h3 className="text-3xl font-extrabold text-slate-900">{pending.toFixed(2)}</h3>
                    <p className="text-xs text-slate-400 mt-1">Held until session completion</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
                    <Clock size={24} />
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-slate-500 text-sm font-medium mb-1">Total Paid (USD)</p>
                    <h3 className="text-3xl font-extrabold text-slate-900">${paid.toFixed(2)}</h3>
                    <p className="text-xs text-slate-400 mt-1">Lifetime earnings withdrawn</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <CheckCircle size={24} />
                </div>
            </div>
        </div>
    );
};
