
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AdminLayout } from '../components/AdminComponents';
import { CreditSummaryCards } from '../components/Admin/CreditSummaryCards';
import { CreditFilters } from '../components/Admin/CreditFilters';
import { CreditLedgerTable } from '../components/Admin/CreditLedgerTable';
import { SystemCreditLedgerEntry } from '../types';
import { RefreshCw, ShieldCheck } from 'lucide-react';

export default function AdminCreditDashboard() {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ holding: 0, released: 0, refunded: 0, pendingBookings: 0 });
    const [records, setRecords] = useState<SystemCreditLedgerEntry[]>([]);
    
    // Filter State
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const loadData = async () => {
        setLoading(true);
        const data = await api.getAdminCreditStats();
        setSummary(data.summary);
        setRecords(data.records);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // Filter Logic
    const filteredRecords = records.filter(r => {
        const matchesSearch = r.bookingId.toLowerCase().includes(search.toLowerCase()) || 
                              r.fromUserId.toLowerCase().includes(search.toLowerCase()) ||
                              r.toUserId.toLowerCase().includes(search.toLowerCase());
        
        const matchesStatus = status === 'ALL' || r.status === status;
        
        let matchesDate = true;
        if (startDate) {
            matchesDate = matchesDate && new Date(r.createdAt) >= new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1);
            matchesDate = matchesDate && new Date(r.createdAt) < end;
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    return (
        <AdminLayout>
            <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <ShieldCheck className="text-brand-600" /> Credit Audit Dashboard
                        </h1>
                        <p className="text-slate-500 mt-1">Real-time view of credit holding, releases, and refunds.</p>
                    </div>
                    <button 
                        onClick={loadData} 
                        disabled={loading}
                        className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-50"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                <CreditSummaryCards summary={summary} />

                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-800">Ledger Records</h2>
                    
                    <CreditFilters 
                        search={search} setSearch={setSearch}
                        status={status} setStatus={setStatus}
                        startDate={startDate} setStartDate={setStartDate}
                        endDate={endDate} setEndDate={setEndDate}
                    />

                    <CreditLedgerTable records={filteredRecords} />
                </div>
            </div>
        </AdminLayout>
    );
}
