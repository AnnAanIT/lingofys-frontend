import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { TopupTransaction } from '../types';

export default function MenteeTopupHistory() {
  const [transactions, setTransactions] = useState<TopupTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const data = await api.getMyTopupHistory();
      setTransactions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load topup history');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
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

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-gray-500">Loading topup history...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Topup History</h1>
        <p className="text-gray-600">View all your credit topup transactions</p>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">💳</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Topups Yet</h3>
          <p className="text-gray-600 mb-6">You haven't made any topup transactions</p>
          <a
            href="/mentee/topup"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Topup Now
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction Code
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.package.name}
                      </div>
                      {transaction.package.bonusPercent > 0 && (
                        <div className="text-xs text-green-600">
                          +{transaction.package.bonusPercent}% bonus
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {transaction.paymentMethod.displayName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {transaction.paymentMethod.type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {transaction.transactionCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      {formatPrice(transaction.priceVND)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className={`font-bold ${transaction.flaggedAsFraud ? 'text-red-600 line-through' : 'text-green-600'}`}>
                        +{transaction.creditAmount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(transaction.status, transaction.flaggedAsFraud)}
                      {transaction.flaggedAsFraud && transaction.fraudReason && (
                        <div className="text-xs text-red-600 mt-1">
                          {transaction.fraudReason}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">
                Total Transactions: <span className="font-bold">{transactions.length}</span>
              </div>
              <div className="text-gray-600">
                Total Credits Added:{' '}
                <span className="font-bold text-green-600">
                  {transactions
                    .filter(t => !t.flaggedAsFraud && t.status === 'AUTO_APPROVED')
                    .reduce((sum, t) => sum + t.creditAmount, 0)}
                </span>
              </div>
              <div className="text-gray-600">
                Total Spent:{' '}
                <span className="font-bold">
                  {formatPrice(
                    transactions
                      .filter(t => !t.flaggedAsFraud && t.status === 'AUTO_APPROVED')
                      .reduce((sum, t) => sum + t.priceVND, 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
