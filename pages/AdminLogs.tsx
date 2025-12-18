
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AdminLayout, ConfirmDialog } from '../components/AdminComponents';
import { LogDownloadButton } from '../components/Admin/LogDownloadButton';
import { SystemLog } from '../types';
import { RefreshCw, Filter, Trash2 } from 'lucide-react';

export default function AdminLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filterSrc, setFilterSrc] = useState('ALL');
  const [filterLvl, setFilterLvl] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const fetchLogs = async () => {
    const filter: any = {};
    if (filterSrc !== 'ALL') filter.src = filterSrc;
    if (filterLvl !== 'ALL') filter.lvl = filterLvl;
    if (startDate) filter.from = startDate;
    if (endDate) filter.to = endDate;

    const data = await api.getLogs(filter);
    setLogs(data);
  };

  useEffect(() => {
    fetchLogs();
  }, [filterSrc, filterLvl, startDate, endDate]);

  const handleResetDB = () => {
      api.resetDatabase();
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
                <button 
                    onClick={() => setIsResetConfirmOpen(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 font-medium transition-colors"
                >
                    <Trash2 size={16} />
                    <span>Reset Database</span>
                </button>
                <LogDownloadButton logs={logs} format="json" />
                <button onClick={fetchLogs} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                    <RefreshCw size={20} />
                </button>
            </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">Source</label>
                <select value={filterSrc} onChange={e => setFilterSrc(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg outline-none">
                    <option value="ALL">All Sources</option>
                    <option value="system">System</option>
                    <option value="user">User</option>
                    <option value="payment">Payment</option>
                    <option value="booking">Booking</option>
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
                    logs.map((log, idx) => (
                        <div key={idx} className="flex gap-3 hover:bg-slate-800/50 p-1 rounded">
                            <span className="text-slate-500 shrink-0 w-36">{new Date(log.ts).toLocaleString()}</span>
                            <span className={`font-bold shrink-0 w-16 uppercase ${log.lvl === 'error' ? 'text-red-500' : log.lvl === 'warn' ? 'text-yellow-500' : 'text-blue-400'}`}>
                                [{log.lvl}]
                            </span>
                            <span className="text-slate-400 shrink-0 w-24 uppercase text-xs border border-slate-700 rounded px-1 text-center h-fit mt-0.5">
                                {log.src}
                            </span>
                            <span className="text-slate-200 break-all">{log.msg}</span>
                        </div>
                    ))
                }
            </div>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetDB}
        title="Reset Entire System Database?"
        message="This will wipe ALL LocalStorage data and restore the initial mock state. All custom bookings, users, and transactions will be deleted. This action cannot be undone."
      />
    </AdminLayout>
  );
}
