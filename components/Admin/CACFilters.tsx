
import React from 'react';
import { Filter, Calendar } from 'lucide-react';

export const CACFilters: React.FC = () => {
    // Placeholder filters for visual completeness, logic can be wired up if detailed filtering API exists
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center opacity-70 cursor-not-allowed">
            <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-500 mb-1">Time Range</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <select className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none bg-slate-50" disabled>
                        <option>Last 30 Days</option>
                        <option>This Year</option>
                        <option>All Time</option>
                    </select>
                </div>
            </div>
            <div className="w-full md:w-48">
                <label className="block text-xs font-bold text-slate-500 mb-1">Provider</label>
                <div className="relative">
                    <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <select className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none bg-slate-50" disabled>
                        <option>All Providers</option>
                    </select>
                </div>
            </div>
        </div>
    );
};
