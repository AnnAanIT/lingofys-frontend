import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { CreditPackage } from '../types';

export default function AdminCreditPackages() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    creditAmount: 0,
    priceVND: 0,
    bonusPercent: 0,
    isActive: true
  });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAdminCreditPackages();
      setPackages(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load credit packages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (pkg: CreditPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      creditAmount: pkg.creditAmount,
      priceVND: pkg.priceVND,
      bonusPercent: pkg.bonusPercent,
      isActive: pkg.isActive
    });
    setIsEditing(true);
  };

  const handleCreate = () => {
    setEditingPackage(null);
    setFormData({
      name: '',
      creditAmount: 0,
      priceVND: 0,
      bonusPercent: 0,
      isActive: true
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      if (editingPackage) {
        await api.updateCreditPackage(editingPackage.id, formData);
      } else {
        await api.createCreditPackage(formData);
      }
      setIsEditing(false);
      await loadPackages();
    } catch (err: any) {
      alert(err.message || 'Failed to save credit package');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this credit package?')) return;

    try {
      await api.deleteCreditPackage(id);
      await loadPackages();
    } catch (err: any) {
      alert(err.message || 'Failed to delete credit package');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const calculateFinalCredits = (creditAmount: number, bonusPercent: number) => {
    const bonus = creditAmount * (bonusPercent / 100);
    return Math.floor(creditAmount + bonus);
  };

  const calculatePricePerCredit = (priceVND: number, creditAmount: number, bonusPercent: number) => {
    const finalCredits = calculateFinalCredits(creditAmount, bonusPercent);
    return Math.floor(priceVND / finalCredits);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-gray-500">Loading credit packages...</div>
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
          <h1 className="text-3xl font-bold mb-2">Credit Packages</h1>
          <p className="text-gray-600">Manage topup credit packages</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Add Package
        </button>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {packages.map((pkg) => {
          const finalCredits = calculateFinalCredits(pkg.creditAmount, pkg.bonusPercent);
          const pricePerCredit = calculatePricePerCredit(pkg.priceVND, pkg.creditAmount, pkg.bonusPercent);

          return (
            <div key={pkg.id} className="bg-white rounded-lg shadow p-6 relative">
              {pkg.bonusPercent > 0 && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  +{pkg.bonusPercent}%
                </div>
              )}
              
              <div className={`mb-2 ${!pkg.isActive ? 'opacity-50' : ''}`}>
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {finalCredits}
                </div>
                <div className="text-sm text-gray-600 mb-2">credits</div>
                
                {pkg.bonusPercent > 0 && (
                  <div className="text-xs text-green-600 mb-2">
                    ({pkg.creditAmount} + {finalCredits - pkg.creditAmount} bonus)
                  </div>
                )}
                
                <div className="text-lg font-bold text-gray-900 mb-1">
                  {formatPrice(pkg.priceVND)}
                </div>
                
                <div className="text-xs text-gray-500">
                  ~{formatPrice(pricePerCredit)}/credit
                </div>
              </div>

              <div className="mb-3">
                <span className={`px-2 py-1 text-xs rounded-full ${pkg.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {pkg.isActive ? '✅ Active' : '⏸️ Inactive'}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(pkg)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(pkg.id)}
                  className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit/Create Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold">
                  {editingPackage ? 'Edit Package' : 'Create Package'}
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
                    Package Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Small, Medium, Large"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credit Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.creditAmount}
                      onChange={(e) => setFormData({ ...formData, creditAmount: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="10"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bonus % <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.bonusPercent}
                      onChange={(e) => setFormData({ ...formData, bonusPercent: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (VND) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.priceVND}
                    onChange={(e) => setFormData({ ...formData, priceVND: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="100000"
                    min="1000"
                    step="1000"
                  />
                </div>

                {/* Preview */}
                {formData.creditAmount > 0 && formData.priceVND > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-2">Preview:</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {calculateFinalCredits(formData.creditAmount, formData.bonusPercent)} credits
                    </div>
                    {formData.bonusPercent > 0 && (
                      <div className="text-xs text-green-600 mb-1">
                        ({formData.creditAmount} + {calculateFinalCredits(formData.creditAmount, formData.bonusPercent) - formData.creditAmount} bonus)
                      </div>
                    )}
                    <div className="text-lg font-bold text-gray-900">
                      {formatPrice(formData.priceVND)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatPrice(calculatePricePerCredit(formData.priceVND, formData.creditAmount, formData.bonusPercent))} per credit
                    </div>
                  </div>
                )}

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
                  disabled={!formData.name || formData.creditAmount <= 0 || formData.priceVND <= 0}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {editingPackage ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
