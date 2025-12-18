
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { StatCard, AdminLayout, StatusBadge } from '../components/AdminComponents';
import { Users, BookOpen, DollarSign, Activity, AlertCircle, ShieldCheck, Scale, ArrowRight } from 'lucide-react';
import { Booking, User, Payout, Transaction } from '../types';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    mentors: 0,
    bookings: 0,
    revenue: 0
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState<Payout[]>([]);
  const [financialHealth, setFinancialHealth] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      const [users, bookings, payouts, txs, health] = await Promise.all([
          api.getUsers(),
          api.getAllBookings(),
          api.getAllPayouts(),
          api.getAllTransactions(),
          api.getSystemFinancialHealth()
      ]);

      setStats({
        users: users.length,
        mentors: users.filter(u => u.role === 'MENTOR').length,
        bookings: bookings.filter(b => b.status === 'COMPLETED').length,
        revenue: txs.filter(t => t.type === 'TOPUP').reduce((acc, t) => acc + t.amount, 0)
      });

      setRecentBookings(bookings.sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 5));
      setPendingPayouts(payouts.filter(p => p.status === 'PENDING').slice(0, 5));
      setFinancialHealth(health);
    };
    loadData();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">System Overview</h1>
              <p className="text-slate-500 mt-1">Real-time platform health and operations monitoring.</p>
            </div>
            <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-green-50 text-green-700 rounded-xl border border-green-100 flex items-center gap-2 text-sm font-bold">
                    <ShieldCheck size={18} /> System Online
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="Total Users" value={stats.users} icon={Users} trend="+12% vs last month" />
          <StatCard title="Active Mentors" value={stats.mentors} icon={BookOpen} />
          <StatCard title="Total Volume (USD)" value={`$${stats.revenue.toLocaleString()}`} icon={DollarSign} trend="+8% vs last week" />
          <StatCard title="Completed Lessons" value={stats.bookings} icon={Activity} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Financial Solvency QuickLook */}
          <div className="lg:col-span-1 bg-slate-900 rounded-2xl shadow-xl p-6 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Scale size={120} />
              </div>
              <div className="relative z-10">
                  <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest mb-6">Solvency Index (Ledger)</h3>
                  
                  <div className="mb-6">
                      <div className="text-4xl font-black mb-1">
                          {financialHealth ? `+${Math.round(financialHealth.cashSurplus).toLocaleString()}` : '...'}
                      </div>
                      <p className="text-slate-500 text-xs font-medium">Available Cash Surplus (USD)</p>
                  </div>

                  <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Net Assets (Cash)</span>
                          <span className="font-mono text-green-400 font-bold">${financialHealth?.realCash.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Total Liabilities</span>
                          <span className="font-mono text-red-400 font-bold">${financialHealth?.totalLiability.toLocaleString() || '0'}</span>
                      </div>
                      <div className="h-px bg-slate-800 my-2"></div>
                      <button 
                        onClick={() => navigate('/admin/revenue')}
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                      >
                          Full Financial Audit <ArrowRight size={14} />
                      </button>
                  </div>
              </div>
          </div>

          {/* Pending Payouts Queue */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle size={18} className="text-orange-500" /> Pending Payout Queue
              </h3>
              <button onClick={() => navigate('/admin/payouts')} className="text-xs text-brand-600 font-bold hover:underline">Process All</button>
            </div>
            {pendingPayouts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                  <ShieldCheck size={48} className="mb-3 opacity-20" />
                  <p className="font-medium">No pending requests at this time.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {pendingPayouts.map(p => (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold">
                            {p.mentorId.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">${p.amount}</div>
                          <div className="text-[10px] text-slate-500 uppercase font-black">{p.method} • {new Date(p.requestedAt).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate(`/admin/payouts/${p.id}`)}
                        className="px-6 py-2 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200"
                    >
                        Review
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Platform Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Activity size={18} className="text-brand-600" /> Recent Activity Log
              </h3>
              <button onClick={() => navigate('/admin/bookings')} className="text-xs text-slate-500 font-bold hover:text-slate-900">All History</button>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Mentor / Mentee</th>
                  <th className="px-6 py-4">Session Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentBookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{b.mentorName}</span>
                            <span className="text-xs text-slate-400">with {b.menteeName}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                        {new Date(b.startTime).toLocaleDateString()}
                        <span className="text-[10px] text-slate-400 block">{new Date(b.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">{b.totalCost} Cr</td>
                    <td className="px-6 py-4"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>
    </AdminLayout>
  );
}
