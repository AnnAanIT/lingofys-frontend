
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { TopupTransaction, TopupDailyReport } from '../types';
import { AdminSidebar } from '../components/AdminComponents';


export default function AdminTopupReport() {
  const [report, setReport] = useState<TopupDailyReport | null>(null);
  const [transactions, setTransactions] = useState<TopupTransaction[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    flaggedAsFraud: '',
    startDate: '',
    endDate: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [vndToUsdRate, setVndToUsdRate] = useState<number>(0.00004); // Default fallback

  useEffect(() => {
    loadData();
  }, [filters]);

  // Load system settings to get vndToUsdRate
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await api.getSystemSettings();
        if (settings.vndToUsdRate) {
          setVndToUsdRate(Number(settings.vndToUsdRate));
        }
      } catch (err) {
        console.error('Failed to load system settings for exchange rate:', err);
        // Keep using default fallback rate
      }
    };
    loadSettings();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Convert filters to API parameters
      const apiParams: any = {};
      if (filters.status) apiParams.status = filters.status;
      if (filters.flaggedAsFraud === 'true') apiParams.flaggedOnly = true;
      if (filters.flaggedAsFraud === 'false') apiParams.flaggedOnly = false;
      // Note: Date filters not yet implemented in backend

      const [reportData, transactionsData] = await Promise.all([
        api.getAdminTopupDailyReport(),
        api.getAdminTopupTransactions(apiParams)
      ]);
      setReport(reportData);
      setTransactions(transactionsData.transactions || transactionsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load topup data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkFraud = async (transactionId: string) => {
    const note = prompt('Enter fraud note (reason):');
    if (!note) return;

    try {
      setActionInProgress(transactionId);
      await api.markTopupAsFraud(transactionId, note);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to mark as fraud');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleUnflag = async (transactionId: string) => {
    if (!confirm('Are you sure you want to unflag this transaction?')) return;

    try {
      setActionInProgress(transactionId);
      await api.unflagTopup(transactionId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to unflag transaction');
    } finally {
      setActionInProgress(null);
    }
  };

  const formatPrice = (priceVND: number, priceUSD?: number | null) => {
    // Use priceUSD from database if available, otherwise fallback to VND conversion
    const usdAmount = priceUSD != null ? Number(priceUSD) : (priceVND * vndToUsdRate);

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(usdAmount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadge = (status: string, flaggedAsFraud?: boolean) => {
    if (flaggedAsFraud) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">🚫 Fraud</span>;
    }

    switch (status) {
      case 'AUTO_APPROVED':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">✅ Approved</span>;
      case 'REVERSED':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">🔄 Reversed</span>;
      case 'FLAGGED':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">⚠️ Flagged</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">{status}</span>;
    }
  };


  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8">
        {isLoading ? (
          <div className="max-w-7xl mx-auto p-6">
            <div className="text-center py-12">
              <div className="text-gray-500">Loading topup report...</div>
            </div>
          </div>
        ) : error ? (
          <div className="max-w-7xl mx-auto p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          </div>
        ) : (
          <>
            <div className="max-w-7xl mx-auto p-6">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Topup Report & Management</h1>
                <p className="text-gray-600">View daily summary and manage topup transactions</p>
              </div>
              {/* Daily Report - Exclude Fraud transactions from totals */}
              {report && (() => {
                // Calculate totals excluding fraud transactions
                const validTransactions = transactions.filter(t => !t.flaggedAsFraud);
                const validTotalAmount = validTransactions.reduce((sum, t) => sum + Number(t.priceUSD || 0), 0);
                const validTotalAmountVND = validTransactions.reduce((sum, t) => sum + Number(t.priceVND || 0), 0);
                const validTotalCredits = validTransactions.reduce((sum, t) => sum + Number(t.creditAmount || 0), 0);
                // Use priceUSD if available, otherwise fallback to VND conversion
                const displayTotalAmount = validTotalAmount > 0 ? validTotalAmount : (validTotalAmountVND * vndToUsdRate);

                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-600 mb-1">Today's Topups</div>
                      <div className="text-3xl font-bold text-blue-600">{report.totalTransactions}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-600 mb-1">Total Amount (excl. Fraud)</div>
                      <div className="text-2xl font-bold text-green-600">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(displayTotalAmount)}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-600 mb-1">Credits Added (excl. Fraud)</div>
                      <div className="text-3xl font-bold text-purple-600">{validTotalCredits}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-600 mb-1">Fraud Detected</div>
                      <div className="text-3xl font-bold text-red-600">{report.flaggedCount}</div>
                    </div>
                  </div>
                );
              })()}
              {/* Filters */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-bold mb-4">Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All</option>
                      <option value="AUTO_APPROVED">Approved</option>
                      <option value="REVERSED">Reversed</option>
                      <option value="FLAGGED">Flagged</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fraud Status</label>
                    <select
                      value={filters.flaggedAsFraud}
                      onChange={(e) => setFilters({ ...filters, flaggedAsFraud: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All</option>
                      <option value="true">Fraud Only</option>
                      <option value="false">Valid Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              {/* Transactions Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction Code</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credits</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(transaction.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{transaction.user.name}</div>
                            <div className="text-xs text-gray-500">{transaction.user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{transaction.package.name}</div>
                            {transaction.package.bonusPercent > 0 && (
                              <div className="text-xs text-green-600">+{transaction.package.bonusPercent}% bonus</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{transaction.paymentMethod.displayName}</div>
                            <div className="text-xs text-gray-500">{transaction.paymentMethod.type}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {transaction.transactionCode}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                            {formatPrice(transaction.priceVND, transaction.priceUSD)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <span className={`font-bold ${transaction.flaggedAsFraud ? 'text-red-600 line-through' : 'text-green-600'}`}>
                              +{transaction.creditAmount}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {getStatusBadge(transaction.status, transaction.flaggedAsFraud)}
                            {transaction.flaggedAsFraud && transaction.fraudReason && (
                              <div className="text-xs text-red-600 mt-1">{transaction.fraudReason}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {!transaction.flaggedAsFraud && transaction.status === 'AUTO_APPROVED' && (
                              <button
                                onClick={() => handleMarkFraud(transaction.id)}
                                disabled={actionInProgress === transaction.id}
                                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:bg-gray-300"
                              >
                                Mark Fraud
                              </button>
                            )}
                            {transaction.flaggedAsFraud && (
                              <button
                                onClick={() => handleUnflag(transaction.id)}
                                disabled={actionInProgress === transaction.id}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:bg-gray-300"
                              >
                                Unflag
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
