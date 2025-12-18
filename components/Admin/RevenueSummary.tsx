
import React from 'react';
import { DollarSign } from 'lucide-react';

interface RevenueSummaryProps {
    total: number;
    title: string;
}

export const RevenueSummary: React.FC<RevenueSummaryProps> = ({ total, title }) => {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-extrabold text-slate-900">
                    ${total.toLocaleString()}
                </h3>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 text-slate-600">
                <DollarSign size={24} />
            </div>
        </div>
    );
};
