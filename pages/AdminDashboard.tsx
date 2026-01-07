
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { StatCard, AdminLayout, StatusBadge } from '../components/AdminComponents';
import { Users, BookOpen, DollarSign, Activity, AlertCircle, ShieldCheck, Scale, ArrowRight } from 'lucide-react';
import { Booking, User, Payout, Transaction } from '../types';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { useToast } from '../components/ui/Toast';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useApp();
  const { warning } = useToast();
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
      try {
        const [users, bookings, payouts, health] = await Promise.all([
          api.getUsers(),
          api.getAllBookings(),
          api.getAllPayouts(),
          api.getSystemFinancialHealth()
      ]);

      setStats({
        users: users.length,
        mentors: users.filter(u => u.role === 'MENTOR').length,
        bookings: bookings.filter(b => b.status === 'COMPLETED').length,
        revenue: health.cashIn || 0  // Use cash in from financial health (includes local topups)
      });

      setRecentBookings(bookings.sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 5));
      setPendingPayouts(payouts.filter(p => p.status === 'PENDING').slice(0, 5));
      setFinancialHealth(health);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        warning('Load Failed', 'Failed to load dashboard. Some data may be missing.');
      }
    };
    loadData();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6 md:space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">System Overview</h1>
              <p className="text-slate-500 mt-1 text-sm md:text-base">Real-time platform health and operations monitoring.</p>
            </div>
            <div className="flex items-center gap-2 md:gap-3 bg-green-50 px-3 md:px-4 py-2 rounded-xl border border-green-100 text-green-700 text-xs md:text-sm font-bold">
                <ShieldCheck size={16} className="md:size-18" /> System Online
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <StatCard title="Total Users" value={stats.users} icon={Users} trend="+12% vs last month" />
          <StatCard title="Active Mentors" value={stats.mentors} icon={BookOpen} />
          <StatCard title="Total Volume (USD)" value={`$${stats.revenue.toLocaleString()}`} icon={DollarSign} trend="+8% vs last week" />
          <StatCard title="Completed Lessons" value={stats.bookings} icon={Activity} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Financial Solvency QuickLook */}
          <div className="lg:col-span-1 bg-slate-900 rounded-2xl shadow-xl p-5 md:p-6 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Scale size={100} className="md:size-[120px]" />
              </div>
              <div className="relative z-10">
                  <h3 className="font-bold text-slate-400 text-[10px] md:text-xs uppercase tracking-widest mb-4 md:mb-6">Solvency Index (Ledger)</h3>
                  
                  <div className="mb-4 md:mb-6">
                      <div className="text-3xl md:text-4xl font-black mb-1">
                          {financialHealth ? `+${Math.round(financialHealth.cashSurplus).toLocaleString()}` : '...'}
                      </div>
                      <p className="text-slate-500 text-[10px] md:text-xs font-medium">Available Cash Surplus (USD)</p>
                  </div>

                  <div className="space-y-2 md:space-y-3">
                      <div className="flex justify-between items-center text-[10px] md:text-xs gap-2">
                          <span className="text-slate-400">Net Assets (Cash)</span>
                          <span className="font-mono text-green-400 font-bold truncate">${financialHealth?.realCash.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] md:text-xs gap-2">
                          <span className="text-slate-400">Total Liabilities</span>
                          <span className="font-mono text-red-400 font-bold truncate">${financialHealth?.totalLiability.toLocaleString() || '0'}</span>
                      </div>
                      <div className="h-px bg-slate-800 my-2"></div>
                      <button 
                        onClick={() => navigate('/admin/financials/reports')}
                        className="w-full py-2 md:py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] md:text-xs font-bold transition-all flex items-center justify-center gap-2"
                      >
                          Full Financial Audit <ArrowRight size={12} className="md:size-[14px]" />
                      </button>
                  </div>
              </div>
          </div>

          {/* Pending Payouts Queue */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col md:flex-row md:justify-between md:items-center gap-3 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm md:text-base">
                <AlertCircle size={18} className="text-orange-500" /> Pending Payout Queue
              </h3>
              <button onClick={() => navigate('/admin/financials/payouts')} className="text-[10px] md:text-xs text-brand-600 font-bold hover:underline text-left md:text-right">Process All</button>
            </div>
            {pendingPayouts.length === 0 ? (
              <div className="p-8 md:p-12 text-center text-slate-400 flex flex-col items-center">
                  <ShieldCheck size={40} className="md:size-[48px] mb-2 md:mb-3 opacity-20" />
                  <p className="font-medium text-sm md:text-base">No pending requests at this time.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
                {pendingPayouts.map(p => (
                  <div key={p.id} className="p-4 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0">
                            {p.mentorId.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-sm">${p.amount}</div>
                          <div className="text-[10px] text-slate-500 uppercase font-black">{p.method} • {new Date(p.requestedAt).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate(`/admin/financials/payouts/${p.id}`)}
                        className="px-4 md:px-6 py-2 bg-slate-900 text-white text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200 w-full sm:w-auto text-center"
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
            <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm md:text-base">
                <Activity size={18} className="text-brand-600" /> Recent Activity Log
              </h3>
              <button onClick={() => navigate('/admin/bookings')} className="text-[10px] md:text-xs text-slate-500 font-bold hover:text-slate-900 text-left">All History</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] md:text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold text-[9px] md:text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-3 md:px-6 py-3 md:py-4">Mentor / Mentee</th>
                    <th className="px-3 md:px-6 py-3 md:py-4">Session Date</th>
                    <th className="px-3 md:px-6 py-3 md:py-4">Amount</th>
                    <th className="px-3 md:px-6 py-3 md:py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentBookings.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 md:px-6 py-3 md:py-4">
                          <div className="flex flex-col">
                              <span className="font-bold text-slate-900 truncate">{b.mentorName}</span>
                              <span className="text-[9px] md:text-xs text-slate-400">with {b.menteeName}</span>
                          </div>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-slate-600 font-medium whitespace-nowrap">
                          {new Date(b.startTime).toLocaleDateString()}
                          <span className="text-[8px] md:text-[10px] text-slate-400 block">{new Date(b.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 font-mono font-bold text-slate-700 whitespace-nowrap">{b.totalCost} Cr</td>
                      <td className="px-3 md:px-6 py-3 md:py-4"><StatusBadge status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
      </div>
    </AdminLayout>
  );
}
