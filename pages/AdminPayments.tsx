
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AdminLayout, StatusBadge } from '../components/AdminComponents';
import { Transaction, User, UserRole } from '../types';
import { Filter, RefreshCw, Calendar, Paperclip } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export default function AdminPayments() {
  const { error: showError } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Filters
  const [filterType, setFilterType] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchTx = async () => {
    try {
      const txs = await api.getAllTransactions();
      const usrs = await api.getUsers();
      setTransactions(txs);
      setUsers(usrs);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      showError('Load Failed', 'Failed to load transactions. Please try again.');
    }
  };

  useEffect(() => {
    fetchTx();
  }, []);

  // Helper to determine precise type for filtering
  const getTransactionCategory = (t: Transaction): string => {
      if (t.type === 'TOPUP') return 'credit_topup';
      if (t.type === 'PAYOUT') {
          const user = users.find(u => u.id === t.userId);
          if (user?.role === UserRole.MENTOR) return 'mentor_payout';
          if (user?.role === UserRole.PROVIDER) return 'provider_payout';
          return 'payout_other';
      }
      return t.type;
  };

  const filteredTransactions = transactions.filter(t => {
      const category = getTransactionCategory(t);
      // Normalized filter logic - include all transaction types
      const matchesType = filterType === 'ALL' || category === filterType || t.type === filterType;
      
      let matchesDate = true;
      if (startDate) {
          matchesDate = matchesDate && new Date(t.date) >= new Date(startDate);
      }
      if (endDate) {
          // Add one day to include end date fully
          const end = new Date(endDate);
          end.setDate(end.getDate() + 1);
          matchesDate = matchesDate && new Date(t.date) < end;
      }

      return matchesType && matchesDate;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
            <button onClick={fetchTx} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                <RefreshCw size={20} />
            </button>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center">
            <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-500 mb-1">Payment Type</label>
                <div className="relative">
                    <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <select 
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none bg-white"
                    >
                        <option value="ALL">All Transactions</option>
                        <option value="credit_topup">Credit Top-Up</option>
                        <option value="mentor_payout">Mentor Payout</option>
                        <option value="provider_payout">Provider Payout</option>
                        <option value="REFUND">Refund</option>
                        <option value="SUBSCRIPTION">Subscription</option>
                        <option value="BOOKING_PAYMENT">Booking Payment</option>
                        <option value="COMMISSION">Commission</option>
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

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Evidence</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map(t => {
                  const displayType = getTransactionCategory(t).replace('_', ' ').toUpperCase();
                  let badgeColor = 'bg-slate-100 text-slate-600';
                  if (t.type === 'mentor_payout') badgeColor = 'bg-purple-100 text-purple-700';
                  if (t.type === 'provider_payout') badgeColor = 'bg-orange-100 text-orange-700';
                  if (t.type === 'refund_credit') badgeColor = 'bg-blue-100 text-blue-700';
                  if (t.type === 'credit_topup' || t.type === 'TOPUP') badgeColor = 'bg-green-100 text-green-700';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-500">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-mono text-xs">{t.userId}</td>
                      <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded font-bold ${badgeColor}`}>
                              {displayType}
                          </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{t.description}</td>
                      <td className="px-6 py-4">
                          {t.evidenceFile ? (
                              <div className="flex items-center text-xs text-blue-600 cursor-pointer hover:underline">
                                  <Paperclip size={14} className="mr-1"/> File
                              </div>
                          ) : '-'}
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                      <td className={`px-6 py-4 text-right font-bold ${t.amount > 0 ? 'text-slate-900' : 'text-slate-900'}`}>
                        ${t.amount}
                      </td>
                    </tr>
                  );
              })}
              {filteredTransactions.length === 0 && (
                  <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">No transactions found matching your filters.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
