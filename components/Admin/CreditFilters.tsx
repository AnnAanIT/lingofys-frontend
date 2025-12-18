
import React from 'react';
import { Search, Filter, Calendar } from 'lucide-react';

interface CreditFiltersProps {
    search: string;
    setSearch: (val: string) => void;
    status: string;
    setStatus: (val: string) => void;
    startDate: string;
    setStartDate: (val: string) => void;
    endDate: string;
    setEndDate: (val: string) => void;
}

export const CreditFilters: React.FC<CreditFiltersProps> = ({
    search, setSearch, status, setStatus, startDate, setStartDate, endDate, setEndDate
}) => {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center">
            <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-500 mb-1">Search</label>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Booking ID, User ID..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                </div>
            </div>
            <div className="w-full md:w-48">
                <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                <div className="relative">
                    <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <select 
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none bg-white"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="holding">Holding (Pending)</option>
                        <option value="released">Released</option>
                        <option value="returned">Returned</option>
                    </select>
                </div>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">From</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-full"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">To</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
