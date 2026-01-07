import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { PaymentMethod } from '../types';

export default function AdminPaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    type: 'BANK_TRANSFER' as 'BANK_TRANSFER' | 'MOMO' | 'ZALOPAY',
    qrCodeUrl: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    instructions: '',
    isActive: true
  });

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAdminPaymentMethods();
      setMethods(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      displayName: method.displayName,
      type: method.type as "MOMO" | "BANK_TRANSFER" | "ZALOPAY",
      qrCodeUrl: method.qrCodeUrl || '',
      bankName: method.bankName || '',
      accountNumber: method.accountNumber || '',
      accountName: method.accountName || '',
      instructions: method.instructions || '',
      isActive: method.isActive
    });
    setIsEditing(true);
  };

  const handleCreate = () => {
    setEditingMethod(null);
    setFormData({
      displayName: '',
      type: 'BANK_TRANSFER',
      qrCodeUrl: '',
      bankName: '',
      accountNumber: '',
      accountName: '',
      instructions: '',
      isActive: true
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      if (editingMethod) {
        await api.updatePaymentMethod(editingMethod.id, formData);
      } else {
        await api.createPaymentMethod(formData);
      }
      setIsEditing(false);
      await loadMethods();
    } catch (err: any) {
      alert(err.message || 'Failed to save payment method');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;

    try {
      await api.deletePaymentMethod(id);
      await loadMethods();
    } catch (err: any) {
      alert(err.message || 'Failed to delete payment method');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-gray-500">Loading payment methods...</div>
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Payment Methods</h1>
          <p className="text-gray-600">Manage topup payment methods</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Add Payment Method
        </button>
      </div>

      {/* Payment Methods List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {methods.map((method) => (
          <div key={method.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold mb-1">{method.displayName}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${method.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {method.isActive ? '✅ Active' : '⏸️ Inactive'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(method)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(method.id)}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Type:</span>{' '}
                <span className="font-medium">{method.type}</span>
              </div>
              {method.bankName && (
                <div>
                  <span className="text-gray-600">Bank:</span>{' '}
                  <span className="font-medium">{method.bankName}</span>
                </div>
              )}
              {method.accountNumber && (
                <div>
                  <span className="text-gray-600">Account:</span>{' '}
                  <span className="font-medium font-mono">{method.accountNumber}</span>
                </div>
              )}
              {method.accountName && (
                <div>
                  <span className="text-gray-600">Name:</span>{' '}
                  <span className="font-medium">{method.accountName}</span>
                </div>
              )}
              {method.qrCodeUrl && (
                <div>
                  <span className="text-gray-600">QR Code:</span>{' '}
                  <a href={method.qrCodeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View QR
                  </a>
                </div>
              )}
              {method.instructions && (
                <div>
                  <span className="text-gray-600">Instructions:</span>
                  <p className="text-gray-700 mt-1 whitespace-pre-line text-xs">{method.instructions}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Create Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold">
                  {editingMethod ? 'Edit Payment Method' : 'Create Payment Method'}
                </h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., VCB - Vietcombank"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="MOMO">Momo</option>
                    <option value="ZALOPAY">ZaloPay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">QR Code URL</label>
                  <input
                    type="url"
                    value={formData.qrCodeUrl}
                    onChange={(e) => setFormData({ ...formData, qrCodeUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Vietcombank"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="1234567890"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                  <input
                    type="text"
                    value={formData.accountName}
                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="NGUYEN VAN A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Payment instructions for users..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Active (visible to users)
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingMethod ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
