
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AdminLayout } from '../components/AdminComponents';
import { LogDownloadButton } from '../components/Admin/LogDownloadButton';
import { SystemLog } from '../types';
import { RefreshCw, Filter, Trash2, AlertTriangle, X } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export default function AdminLogs() {
  const { error: showError, success } = useToast();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filterSrc, setFilterSrc] = useState('ALL');
  const [filterLvl, setFilterLvl] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetConfirmToken, setResetConfirmToken] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const fetchLogs = async () => {
    try {
      // ✅ FIX: Backend now supports filters
      const data = await api.getSystemLogs({
        action: filterSrc !== 'ALL' ? filterSrc : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 100,
      });

      // Apply level filter on frontend (if needed)
      let filtered = data;
      if (filterLvl !== 'ALL') {
        // Map action to level if needed
        filtered = filtered.filter(log => {
          // You can customize this mapping based on your action types
          if (filterLvl === 'error') return log.action.includes('ERROR') || log.action.includes('FAILED');
          if (filterLvl === 'warn') return log.action.includes('WARNING') || log.action.includes('REJECTED');
          return true;
        });
      }

      setLogs(filtered);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterSrc, filterLvl, startDate, endDate]);

  const handleResetDB = async () => {
    if (resetConfirmToken !== 'CONFIRM_RESET_DATABASE') {
      showError('Invalid Token', 'Please type "CONFIRM_RESET_DATABASE" exactly to confirm.');
      return;
    }

    setIsResetting(true);
    try {
      await api.resetDatabase();
      success('Database Reset', 'Database has been reset successfully. All data has been deleted.');
      setIsResetConfirmOpen(false);
      setResetConfirmToken('');
      // Refresh page after 2 seconds to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Reset database error:', error);
      const errorMsg = error.message || 'Failed to reset database. This action is only available in development environment.';
      showError('Reset Failed', errorMsg);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">System Logs & Maintenance</h1>
                <p className="text-slate-500 mt-1">Audit trails and system database management.</p>
            </div>
            <div className="flex gap-2">
                {/* ✅ FIX: Only show reset button in development */}
                {import.meta.env.DEV && (
                  <button 
                      onClick={() => setIsResetConfirmOpen(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 font-medium transition-colors"
                      title="Development only - Reset entire database"
                  >
                      <Trash2 size={16} />
                      <span>Reset Database</span>
                  </button>
                )}
                <LogDownloadButton logs={logs} format="json" />
                <button onClick={fetchLogs} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                    <RefreshCw size={20} />
                </button>
            </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">Action</label>
                <select value={filterSrc} onChange={e => setFilterSrc(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg outline-none">
                    <option value="ALL">All Actions</option>
                    <option value="BOOKING_UPDATE">Booking Update</option>
                    <option value="DISPUTE_RESOLVED">Dispute Resolved</option>
                    <option value="PLAN_CREATE">Plan Create</option>
                    <option value="PLAN_UPDATE">Plan Update</option>
                    <option value="PLAN_DELETE">Plan Delete</option>
                    <option value="USER_CONFIG_UPDATE">User Config Update</option>
                    <option value="USER_APPROVED">User Approved</option>
                    <option value="USER_REJECTED">User Rejected</option>
                    <option value="PAYOUT_APPROVED">Payout Approved</option>
                    <option value="PAYOUT_REJECTED">Payout Rejected</option>
                    <option value="PAYMENT_COMPLETE">Payment Complete</option>
                    <option value="PAYMENT_FAILED">Payment Failed</option>
                </select>
            </div>
            <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">Level</label>
                <select value={filterLvl} onChange={e => setFilterLvl(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg outline-none">
                    <option value="ALL">All Levels</option>
                    <option value="info">Info</option>
                    <option value="warn">Warning</option>
                    <option value="error">Error</option>
                </select>
            </div>
            <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">From</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg outline-none" />
            </div>
            <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">To</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg outline-none" />
            </div>
        </div>

        <div className="bg-slate-900 rounded-xl shadow-lg overflow-hidden border border-slate-800 text-slate-300 font-mono text-sm">
            <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 font-bold text-slate-400 flex justify-between items-center">
                <span>Console Output</span>
                <span className="text-xs bg-slate-800 px-2 py-1 rounded">{logs.length} events found</span>
            </div>
            <div className="max-h-[600px] overflow-y-auto p-4 space-y-1">
                {logs.length === 0 ? <div className="text-slate-600 text-center py-8">No logs matching filter.</div> : 
                    logs.map((log) => (
                        <div key={log.id} className="flex gap-3 hover:bg-slate-800/50 p-2 rounded border-b border-slate-800">
                            <span className="text-slate-500 shrink-0 w-40 text-xs">
                                {new Date(log.createdAt).toLocaleString()}
                            </span>
                            <span className="text-blue-400 shrink-0 w-32 font-bold text-xs uppercase">
                                {log.action}
                            </span>
                            <span className="text-slate-400 shrink-0 w-32 text-xs">
                                {log.user?.name || log.userId}
                            </span>
                            {log.targetType && (
                                <span className="text-slate-500 shrink-0 w-24 text-xs border border-slate-700 rounded px-1 text-center">
                                    {log.targetType}
                                </span>
                            )}
                            <span className="text-slate-200 break-all flex-1 text-xs">
                                {log.details || 'No details'}
                            </span>
                        </div>
                    ))
                }
            </div>
        </div>
      </div>

      {/* Reset Database Confirmation Dialog */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-slide-up border-2 border-red-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">⚠️ Reset Entire Database?</h3>
                  <p className="text-sm text-slate-500">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsResetConfirmOpen(false);
                  setResetConfirmToken('');
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                disabled={isResetting}
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <p className="text-red-900 font-bold mb-3 text-sm">⚠️ DANGER: This will DELETE ALL DATA from the database!</p>
                <ul className="text-sm text-red-800 space-y-1.5 list-disc list-inside">
                  <li>All users, mentors, mentees, providers</li>
                  <li>All bookings and transactions</li>
                  <li>All subscriptions and payouts</li>
                  <li>All homework, feedback, and messages</li>
                  <li>All system logs and credit history</li>
                  <li>All availability slots and profiles</li>
                </ul>
                <p className="text-red-900 font-bold mt-3 text-sm">⚠️ This action CANNOT BE UNDONE!</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-900 text-sm font-bold mb-1">⚠️ Development Only</p>
                <p className="text-yellow-800 text-xs">This feature is only available in development environment. Production database is protected by backend.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Type <span className="font-mono bg-slate-100 px-2 py-1 rounded border border-slate-300">CONFIRM_RESET_DATABASE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={resetConfirmToken}
                  onChange={(e) => setResetConfirmToken(e.target.value)}
                  placeholder="CONFIRM_RESET_DATABASE"
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono text-sm"
                  disabled={isResetting}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && resetConfirmToken === 'CONFIRM_RESET_DATABASE' && !isResetting) {
                      handleResetDB();
                    }
                  }}
                />
                {resetConfirmToken && resetConfirmToken !== 'CONFIRM_RESET_DATABASE' && (
                  <p className="text-red-600 text-xs mt-1">❌ Token does not match</p>
                )}
                {resetConfirmToken === 'CONFIRM_RESET_DATABASE' && (
                  <p className="text-green-600 text-xs mt-1">✅ Token matches</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsResetConfirmOpen(false);
                  setResetConfirmToken('');
                }}
                disabled={isResetting}
                className="flex-1 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetDB}
                disabled={resetConfirmToken !== 'CONFIRM_RESET_DATABASE' || isResetting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isResetting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Reset Database
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
