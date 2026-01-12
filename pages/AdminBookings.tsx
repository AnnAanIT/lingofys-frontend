
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AdminLayout, StatusBadge, ConfirmDialog } from '../components/AdminComponents';
import { Booking, BookingStatus } from '../types';
import { MoreHorizontal, FileText, Search, Filter, Calendar, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';
import { DisputeResolutionModal } from '../components/Admin/DisputeResolutionModal';
import { useApp } from '../App';
import { formatBookingDate, formatBookingTime } from '../utils/dateFormatters';

export default function AdminBookings() {
  const { user: currentUser } = useApp();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [action, setAction] = useState<'CANCEL' | null>(null);
  
  // Dispute Modal
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeBooking, setDisputeBooking] = useState<Booking | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchBookings = async () => {
    const data = await api.getAllBookings();
    setBookings(data);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleAction = async () => {
    if (!selectedBooking || !action || !currentUser) return;
    // Only CANCEL action is supported for direct status updates
    // REFUNDED status can only be achieved through dispute resolution
    await api.updateBookingStatus(selectedBooking.id, BookingStatus.CANCELLED);
    await api.logAction('BOOKING_UPDATE', currentUser.id, `Admin cancelled booking ${selectedBooking.id}`);
    fetchBookings();
    setSelectedBooking(null);
    setAction(null);
  };

  const handleResolveDispute = async (outcome: 'REFUND_MENTEE' | 'DISMISS', note: string) => {
      if (!disputeBooking || !currentUser) return;
      await api.resolveDispute(disputeBooking.id, outcome, note);
      await api.logAction('DISPUTE_RESOLVED', currentUser.id, `Admin resolved dispute for #${disputeBooking.id} as ${outcome}`);
      fetchBookings();
      setDisputeBooking(null);
  };

  const filteredBookings = bookings.filter(b => {
      const matchesSearch = 
        b.id.toLowerCase().includes(search.toLowerCase()) ||
        b.mentorName.toLowerCase().includes(search.toLowerCase()) ||
        b.menteeName.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = filterStatus === 'ALL' || b.status === filterStatus;

      let matchesDate = true;
      if (startDate) matchesDate = matchesDate && new Date(b.startTime) >= new Date(startDate);
      if (endDate) {
          const end = new Date(endDate);
          end.setDate(end.getDate() + 1); 
          matchesDate = matchesDate && new Date(b.startTime) < end;
      }
      return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-900">Booking Management</h1>
            <button onClick={fetchBookings} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                <RefreshCw size={20} />
            </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center">
            <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-500 mb-1">Search</label>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input type="text" placeholder="ID, Mentor, or Mentee..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
            </div>
            
            <div className="w-full md:w-48">
                <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg outline-none bg-white">
                    <option value="ALL">All Statuses</option>
                    <option value="DISPUTED">⚠️ Disputed</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="REFUNDED">Refunded</option>
                </select>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">From</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">To</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg outline-none" />
                </div>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Mentor</th>
                <th className="px-6 py-4">Mentee</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-center">Cost</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.map(b => (
                <tr key={b.id} className={b.status === 'DISPUTED' ? 'bg-orange-50/50 hover:bg-orange-50' : 'hover:bg-slate-50'}>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">#{b.id}</td>
                  <td className="px-6 py-4 font-medium">{b.mentorName}</td>
                  <td className="px-6 py-4">{b.menteeName}</td>
                  <td className="px-6 py-4">
                    <div className="text-slate-900">{formatBookingDate(b.startTime)}</div>
                    <div className="text-xs text-slate-500">{formatBookingTime(b.startTime)}</div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-900">
                      {b.totalCost}
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={b.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        {b.status === 'DISPUTED' && (
                            <button 
                                onClick={() => { setDisputeBooking(b); setIsDisputeModalOpen(true); }}
                                className="px-3 py-1 bg-orange-600 text-white rounded-lg text-xs font-bold flex items-center hover:bg-orange-700"
                            >
                                <ShieldAlert size={14} className="mr-1" /> Resolve
                            </button>
                        )}
                        
                        <button 
                            disabled={['COMPLETED','CANCELLED','REFUNDED','DISPUTED'].includes(b.status)}
                            onClick={() => { setSelectedBooking(b); setAction('CANCEL'); }} 
                            className="text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30 p-2 hover:bg-slate-100 rounded-lg"
                        >
                            Cancel
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onConfirm={handleAction}
        title="Update Booking"
        message={`Are you sure you want to cancel booking #${selectedBooking?.id}?`}
      />

      {disputeBooking && (
          <DisputeResolutionModal 
              isOpen={isDisputeModalOpen}
              onClose={() => { setIsDisputeModalOpen(false); setDisputeBooking(null); }}
              booking={disputeBooking}
              onResolve={handleResolveDispute}
          />
      )}
    </AdminLayout>
  );
}
