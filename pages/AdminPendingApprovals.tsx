
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AdminLayout } from '../components/AdminComponents';
import { User, UserRole } from '../types';
import { CheckCircle, XCircle, Clock, Mail, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { useApp } from '../App';

export default function AdminPendingApprovals() {
  const { user: currentUser } = useApp();
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPendingUsers = async () => {
    setLoading(true);
    const pending = await api.getPendingUsers();
    setPendingUsers(pending);
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = async (user: User) => {
    setIsProcessing(true);
    try {
      await api.approveUser(user.id);
      await api.logAction('USER_APPROVED', `Admin approved ${user.role} account for ${user.name} (${user.email})`, currentUser?.id || 'admin');
      await fetchPendingUsers();
      setSelectedUser(null);
      setActionType(null);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedUser || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);
    try {
      await api.rejectUser(selectedUser.id, rejectionReason);
      await api.logAction('USER_REJECTED', `Admin rejected ${selectedUser.role} account for ${selectedUser.name}. Reason: ${rejectionReason}`, currentUser?.id || 'admin');
      await fetchPendingUsers();
      setSelectedUser(null);
      setActionType(null);
      setRejectionReason('');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Pending Approvals</h1>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-bold text-blue-900 mb-1">Pending Account Approvals</h3>
            <p className="text-sm text-blue-700">
              Review and approve MENTOR/PROVIDER registrations. MENTEE accounts are auto-approved.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading pending approvals...</div>
        ) : pendingUsers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-20 text-center">
            <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
            <h3 className="text-xl font-bold text-slate-900 mb-2">All Clear!</h3>
            <p className="text-slate-500">No pending approvals at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pendingUsers.map(user => (
              <div key={user.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-2xl" />
                    <div>
                      <h3 className="font-black text-lg text-slate-900">{user.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          user.role === UserRole.MENTOR
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail size={16} className="text-slate-400" />
                    <span>{user.email}</span>
                  </div>
                  {user.country && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin size={16} className="text-slate-400" />
                      <span>{user.country}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar size={16} className="text-slate-400" />
                    <span>Applied: {new Date(user.appliedAt || user.joinedAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setSelectedUser(user); setActionType('APPROVE'); handleApprove(user); }}
                    disabled={isProcessing}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle size={18} /> Approve
                  </button>
                  <button
                    onClick={() => { setSelectedUser(user); setActionType('REJECT'); }}
                    disabled={isProcessing}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle size={18} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {actionType === 'REJECT' && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-slide-up">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Reject Application</h3>
            <p className="text-slate-500 mb-6">
              You are about to reject <strong>{selectedUser.name}</strong>'s {selectedUser.role} application.
            </p>

            <div className="mb-6">
              <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">
                Rejection Reason (will be sent to applicant)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Insufficient qualifications, incomplete information..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 resize-none"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setActionType(null); setSelectedUser(null); setRejectionReason(''); }}
                disabled={isProcessing}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing || !rejectionReason.trim()}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
