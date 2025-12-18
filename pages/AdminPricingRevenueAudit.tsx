
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AdminLayout } from '../components/AdminComponents';
import { Booking } from '../types';
import { validateBookingRevenue } from '../lib/revenueValidator';
import { ShieldCheck, AlertOctagon, CheckCircle, RefreshCw } from 'lucide-react';

export default function AdminPricingRevenueAudit() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [issues, setIssues] = useState<Map<string, string>>(new Map());
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        const data = await api.getAllBookings();
        const newIssues = new Map<string, string>();
        
        data.forEach(b => {
            try {
                validateBookingRevenue(b);
            } catch (e: any) {
                newIssues.set(b.id, e.message);
            }
        });

        setBookings(data.sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
        setIssues(newIssues);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <AdminLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <ShieldCheck className="text-brand-600" /> Pricing & Revenue Audit
                        </h1>
                        <p className="text-slate-500 mt-1">Lightweight verification of recent bookings.</p>
                    </div>
                    <button onClick={loadData} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                        <RefreshCw size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={`p-6 rounded-xl border flex items-center justify-between ${issues.size === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div>
                            <div className="text-sm font-bold uppercase tracking-wider mb-1 opacity-70">Integrity Status</div>
                            <div className={`text-2xl font-extrabold ${issues.size === 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {issues.size === 0 ? 'HEALTHY' : `${issues.size} ISSUES FOUND`}
                            </div>
                        </div>
                        {issues.size === 0 ? <CheckCircle size={32} className="text-green-600" /> : <AlertOctagon size={32} className="text-red-600" />}
                    </div>
                    
                    <div className="p-6 rounded-xl border border-slate-200 bg-white">
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Bookings</div>
                        <div className="text-2xl font-extrabold text-slate-900">{bookings.length}</div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 font-bold text-slate-800">Financial Integrity Log</div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-6 py-3">Booking ID</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Total Cost</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {bookings.slice(0, 50).map(b => {
                                    const hasIssue = issues.has(b.id);
                                    return (
                                        <tr key={b.id} className={hasIssue ? 'bg-red-50' : 'hover:bg-slate-50'}>
                                            <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">#{b.id}</td>
                                            <td className="px-6 py-4 text-slate-500">{new Date(b.startTime).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 font-bold text-slate-900">${b.totalCost}</td>
                                            <td className="px-6 py-4">
                                                {hasIssue ? (
                                                    <div className="text-red-600 font-bold text-xs flex items-center" title={issues.get(b.id)}>
                                                        <AlertOctagon size={14} className="mr-1" /> FAIL
                                                    </div>
                                                ) : (
                                                    <div className="text-green-600 font-bold text-xs flex items-center">
                                                        <CheckCircle size={14} className="mr-1" /> OK
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
