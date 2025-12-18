
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AdminLayout, StatusBadge } from '../components/AdminComponents';
import { Payout } from '../types';
import { Search, Filter, Calendar, RefreshCw, Eye, CheckCircle, XCircle, DollarSign, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PayoutApproveModal } from '../components/Admin/PayoutApproveModal';
import { PayoutRejectModal } from '../components/Admin/PayoutRejectModal';
import { PayoutPayModal } from '../components/Admin/PayoutPayModal'; // Reuse or Create this

export default function AdminPayouts() {
  const navigate = useNavigate();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Action States
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false); // For marking as PAID

  const fetchPayouts = async () => {
    const data = await api.getAllPayouts();
    // Sort by requestedAt desc
    data.sort((a,b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    setPayouts(data);
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleApprove = async (data: { method: string; adminNote: string }) => {
      if (!selectedPayout) return;
      await api.approvePayout(selectedPayout.id, data.method, data.adminNote);
      fetchPayouts();
      setIsApproveModalOpen(false);
      setSelectedPayout(null);
  };

  const handleReject = async (data: { reason: string; adminNote: string }) => {
      if (!selectedPayout) return;
      await api.rejectPayout(selectedPayout.id, data.reason, data.adminNote);
      fetchPayouts();
      setIsRejectModalOpen(false);
      setSelectedPayout(null);
  };

  const handlePay = async (data: { method: string; evidenceFile: string; adminNote: string }) => {
      if (!selectedPayout) return;
      // This maps to `completePayment` which calls `mentorPayoutEngine.markPayoutPaid`
      // We need to fetch the transaction ID first if we were using the old flow, 
      // but here we are in Payouts management. 
      // api.completePayment requires TransactionID. 
      // Let's assume for this specific Admin Action on Payouts, we find the linked pending transaction or use a direct payout completion method if exposed.
      // Ideally, `api.completePayment` handles the logic. We need the transaction ID.
      // Since `approvePayout` creates a Payout with 'APPROVED_PENDING_PAYMENT', let's find the transaction.
      // OR, we update `api` to expose `markPayoutPaid` directly.
      // Since I updated `api.completePayment` to use the engine, let's try to find the transaction.
      const txs = await api.getAllTransactions();
      const tx = txs.find(t => t.relatedEntityId === selectedPayout.id && t.type === 'PAYOUT');
      
      if (tx) {
          await api.completePayment(tx.id, data.evidenceFile, data.adminNote);
      } else {
          // If no transaction found (e.g. legacy data), we might need a direct engine call exposed or handle error.
          // For now, assume engine created it on request/approval.
          alert("Error: Associated transaction not found.");
      }
      
      fetchPayouts();
      setIsPayModalOpen(false);
      setSelectedPayout(null);
  };

  const filteredPayouts = payouts.filter(p => {
      const matchesSearch = 
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        p.mentorId.toLowerCase().includes(search.toLowerCase()) ||
        (p.method && p.method.toLowerCase().includes(search.toLowerCase()));
      
      const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;

      let matchesDate = true;
      if (startDate) {
          matchesDate = matchesDate && new Date(p.requestedAt) >= new Date(startDate);
      }
      if (endDate) {
          const end = new Date(endDate);
          end.setDate(end.getDate() + 1);
          matchesDate = matchesDate && new Date(p.requestedAt) < end;
      }

      return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-900">Payout Management</h1>
            <button onClick={fetchPayouts} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                <RefreshCw size={20} />
            </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center">
            <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-500 mb-1">Search</label>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Payout ID, User ID, Method..." 
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
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none bg-white"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="PENDING">Pending Approval</option>
                        <option value="APPROVED_PENDING_PAYMENT">Processing (Approved)</option>
                        <option value="PAID">Paid</option>
                        <option value="REJECTED">Rejected</option>
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
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayouts.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">#{p.id}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{p.mentorId}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">${p.amount}</td>
                  <td className="px-6 py-4">{p.method || 'Default'}</td>
                  <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        {p.status === 'PENDING' && (
                            <>
                                <button 
                                    onClick={() => { setSelectedPayout(p); setIsApproveModalOpen(true); }}
                                    className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-bold text-xs flex items-center"
                                >
                                    <CheckCircle size={14} className="mr-1" /> Approve
                                </button>
                                <button 
                                    onClick={() => { setSelectedPayout(p); setIsRejectModalOpen(true); }}
                                    className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold text-xs flex items-center"
                                >
                                    <XCircle size={14} className="mr-1" /> Reject
                                </button>
                            </>
                        )}
                        {p.status === 'APPROVED_PENDING_PAYMENT' && (
                            <button 
                                onClick={() => { setSelectedPayout(p); setIsPayModalOpen(true); }}
                                className="px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg font-bold text-xs flex items-center"
                            >
                                <DollarSign size={14} className="mr-1" /> Pay Now
                            </button>
                        )}
                        <button 
                            onClick={() => navigate(`/admin/payouts/${p.id}`)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                            title="View Details"
                        >
                            <Eye size={18} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPayouts.length === 0 && (
                  <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No payouts found matching filters.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPayout && (
          <>
            <PayoutApproveModal 
                isOpen={isApproveModalOpen}
                onClose={() => setIsApproveModalOpen(false)}
                payout={selectedPayout}
                onConfirm={handleApprove}
            />
            <PayoutRejectModal 
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                payout={selectedPayout}
                onConfirm={handleReject}
            />
            <PayoutPayModal 
                isOpen={isPayModalOpen}
                onClose={() => setIsPayModalOpen(false)}
                payout={selectedPayout}
                onConfirm={handlePay}
            />
          </>
      )}
    </AdminLayout>
  );
}
