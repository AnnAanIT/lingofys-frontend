import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { CreditPackage, PaymentMethod, TopupLimits } from '../types';

export default function MenteeTopup() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [limits, setLimits] = useState<TopupLimits | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [transactionCode, setTransactionCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [packagesData, methodsData, limitsData] = await Promise.all([
        api.getLocalTopupPackages(),
        api.getLocalTopupPaymentMethods(),
        api.getMyTopupLimits()
      ]);
      setPackages(packagesData);
      setPaymentMethods(methodsData);
      setLimits(limitsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load topup data');
    }
  };

  const calculateFinalCredits = (pkg: CreditPackage) => {
    const bonus = pkg.creditAmount * (pkg.bonusPercent / 100);
    return Math.floor(pkg.creditAmount + bonus);
  };

  const handlePackageSelect = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setError(null);
    
    // Check limits
    if (limits && calculateFinalCredits(pkg) > limits.maxCreditsPerTransaction) {
      setError(`You can only topup maximum ${limits.maxCreditsPerTransaction} credits per transaction. Complete more bookings to unlock higher limits!`);
      return;
    }
    
    // Auto-select first payment method if only one
    if (paymentMethods.length === 1) {
      setSelectedPaymentMethod(paymentMethods[0]);
    }
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setShowPaymentModal(true);
  };

  const handleConfirmTopup = async () => {
    if (!selectedPackage || !selectedPaymentMethod || !transactionCode.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await api.createLocalTopup({
        packageId: selectedPackage.id,
        paymentMethodId: selectedPaymentMethod.id,
        transactionCode: transactionCode.trim()
      });

      setSuccess(true);
      setShowPaymentModal(false);
      setTransactionCode('');
      
      // Reload page after 2 seconds to show new balance
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create topup');
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (success) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Topup Successful!</h2>
          <p className="text-green-700 mb-4">
            Credits have been added to your wallet. Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Topup Credits</h1>
        <p className="text-gray-600">Select a package and payment method to topup your wallet</p>
        
        {limits && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <span>📊 Your Limits:</span>
              <span className="font-medium">{limits.maxCreditsPerTransaction} credits/topup</span>
              <span>•</span>
              <span className="font-medium">{limits.maxTopupsPerDay} topups/day</span>
              <span>•</span>
              <span className="font-medium">{limits.maxCreditsPerDay} credits/day</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {/* Package Selection */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">1. Select Package</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {packages.map(pkg => {
            const finalCredits = calculateFinalCredits(pkg);
            const isSelected = selectedPackage?.id === pkg.id;
            const isDisabled = limits && finalCredits > limits.maxCreditsPerTransaction;

            return (
              <button
                key={pkg.id}
                onClick={() => !isDisabled && handlePackageSelect(pkg)}
                disabled={isDisabled}
                className={`relative p-6 border-2 rounded-lg transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : isDisabled
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                {pkg.bonusPercent > 0 && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    +{pkg.bonusPercent}%
                  </div>
                )}
                
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {finalCredits}
                </div>
                <div className="text-sm text-gray-600 mb-1">credits</div>
                {pkg.bonusPercent > 0 && (
                  <div className="text-xs text-green-600 mb-2">
                    ({pkg.creditAmount} + {finalCredits - pkg.creditAmount} bonus)
                  </div>
                )}
                <div className="text-lg font-bold text-gray-900">
                  {formatPrice(pkg.priceVND)}
                </div>
                {isDisabled && (
                  <div className="text-xs text-red-600 mt-2">
                    Limit: {limits?.maxCreditsPerTransaction} credits
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Payment Method Selection */}
      {selectedPackage && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">2. Select Payment Method</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {paymentMethods.map(method => {
              const isSelected = selectedPaymentMethod?.id === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => handlePaymentMethodSelect(method)}
                  className={`p-4 border-2 rounded-lg transition-all text-left ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="font-bold mb-1">{method.displayName}</div>
                  <div className="text-sm text-gray-600">{method.type}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPackage && selectedPaymentMethod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold">Complete Payment</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Payment Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Package:</span>
                  <span className="font-bold">{calculateFinalCredits(selectedPackage)} credits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-xl text-blue-600">
                    {formatPrice(selectedPackage.priceVND)}
                  </span>
                </div>
              </div>

              {/* QR Code */}
              {selectedPaymentMethod.qrCodeUrl && (
                <div className="mb-6 text-center">
                  <img
                    src={selectedPaymentMethod.qrCodeUrl}
                    alt="QR Code"
                    className="max-w-xs mx-auto border rounded-lg"
                  />
                </div>
              )}

              {/* Bank Info */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-bold mb-2">{selectedPaymentMethod.displayName}</h4>
                {selectedPaymentMethod.bankName && (
                  <div className="text-sm mb-1">Bank: {selectedPaymentMethod.bankName}</div>
                )}
                {selectedPaymentMethod.accountNumber && (
                  <div className="text-sm mb-1">Account: {selectedPaymentMethod.accountNumber}</div>
                )}
                {selectedPaymentMethod.accountName && (
                  <div className="text-sm mb-1">Name: {selectedPaymentMethod.accountName}</div>
                )}
                {selectedPaymentMethod.instructions && (
                  <div className="text-sm text-gray-700 mt-3 whitespace-pre-line">
                    {selectedPaymentMethod.instructions}
                  </div>
                )}
              </div>

              {/* Transaction Code Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={transactionCode}
                  onChange={(e) => setTransactionCode(e.target.value)}
                  placeholder="Enter your bank transaction code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isProcessing}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter the transaction code from your bank/Momo confirmation
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmTopup}
                  disabled={isProcessing || !transactionCode.trim()}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  {isProcessing ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
