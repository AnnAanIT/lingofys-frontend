import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { PaymentMethod, CurrencyConfig } from '../types';
import { X, Check } from 'lucide-react';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export function TopUpModal({ isOpen, onClose, onSuccess }: TopUpModalProps) {
  const [packages, setPackages] = useState<number[]>([]);
  const [conversionRatio, setConversionRatio] = useState(0.8);
  const [currencies, setCurrencies] = useState<CurrencyConfig[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyConfig | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedCredits, setSelectedCredits] = useState<number>(40);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [transactionCode, setTransactionCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      // Fetch system settings for credit packages, conversion ratio, and currencies
      api.getSystemSettings().then(settings => {
        setConversionRatio(settings.topupConversionRatio || 0.8);
        const pkgs = settings.creditPackages || [40, 100, 200, 400];
        setPackages(pkgs);
        if (pkgs.length > 0) setSelectedCredits(pkgs[0]);

        // Set currencies and default to VND
        const curs = settings.currencies || [];
        setCurrencies(curs);
        const defaultCurrency = curs.find(c => c.code === 'VND') || curs[0] || null;
        setSelectedCurrency(defaultCurrency);
      }).catch(err => {
        console.error('Failed to fetch system settings:', err);
      });

      // Fetch payment methods from API
      api.getLocalTopupPaymentMethods().then(methods => {
        setPaymentMethods(methods);
      }).catch(err => {
        console.error('Failed to fetch payment methods:', err);
        setError('Failed to load payment methods');
      });
    }
  }, [isOpen]);

  const calculatePrice = (credits: number) => {
    if (!selectedCurrency) return 0;
    const priceUSD = credits / conversionRatio;
    const priceInCurrency = priceUSD * selectedCurrency.exchangeRate;
    return priceInCurrency;
  };

  const formatPrice = (price: number) => {
    if (!selectedCurrency) return '';

    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);

    if (selectedCurrency.symbolPosition === 'before') {
      return `${selectedCurrency.symbol}${formatted}`;
    } else {
      return `${formatted}${selectedCurrency.symbol}`;
    }
  };

  const handleConfirmTopup = async () => {
    if (!selectedCredits || !selectedPaymentMethod || !transactionCode.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await api.createLocalTopup({
        creditAmount: selectedCredits,
        paymentMethodId: selectedPaymentMethod.id,
        transactionCode: transactionCode.trim()
      });

      // Reset form
      setTransactionCode('');
      setSelectedPaymentMethod(null);

      // Call success callback
      onSuccess();

      // Close modal
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create topup');
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedPaymentMethod(null);
    setTransactionCode('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Topup Credits</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Single scrollable view */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Currency Selector */}
          {currencies.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={selectedCurrency?.code || ''}
                onChange={(e) => {
                  const currency = currencies.find(c => c.code === e.target.value);
                  setSelectedCurrency(currency || null);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                {currencies.filter(c => c.enabled).map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Section 1: Select Credit Package */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">1. Select Credit Package</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {packages.map(credits => {
                const price = calculatePrice(credits);
                const isSelected = selectedCredits === credits;

                return (
                  <button
                    key={credits}
                    onClick={() => setSelectedCredits(credits)}
                    className={`relative p-4 border-2 rounded-lg transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    <div className="text-center">
                      <div className={`text-2xl font-bold mb-1 ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                        {credits}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">credits</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatPrice(price)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Select Payment Method */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">2. Select Payment Method</h4>
            {paymentMethods.length === 0 ? (
              <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                <p className="text-yellow-800 text-sm">No payment methods available. Please contact admin.</p>
              </div>
            ) : (
              <select
                value={selectedPaymentMethod?.id || ''}
                onChange={(e) => {
                  const method = paymentMethods.find(m => m.id === e.target.value);
                  setSelectedPaymentMethod(method || null);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="">Choose payment method...</option>
                {paymentMethods.map(method => (
                  <option key={method.id} value={method.id}>
                    {method.displayName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Section 3: Payment Details & Transaction Code */}
          {selectedPaymentMethod && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">3. Complete Payment</h4>

              {/* Payment Summary */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Credits</span>
                  <span className="font-semibold text-gray-900">{selectedCredits} credits</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                  <span className="text-sm font-semibold text-gray-900">Total Amount</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatPrice(calculatePrice(selectedCredits))}
                  </span>
                </div>
              </div>

              {/* QR Code */}
              {selectedPaymentMethod.qrCodeUrl && (
                <div className="mb-4 p-4 border border-gray-200 rounded-lg text-center bg-white">
                  <img
                    src={selectedPaymentMethod.qrCodeUrl}
                    alt="QR Code"
                    className="max-w-xs mx-auto rounded"
                  />
                </div>
              )}

              {/* Bank Info */}
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-semibold text-gray-900 mb-3">{selectedPaymentMethod.displayName}</h5>
                <div className="space-y-2 text-sm">
                  {selectedPaymentMethod.bankName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bank</span>
                      <span className="font-medium text-gray-900">{selectedPaymentMethod.bankName}</span>
                    </div>
                  )}
                  {selectedPaymentMethod.accountNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account</span>
                      <span className="font-mono font-medium text-gray-900">{selectedPaymentMethod.accountNumber}</span>
                    </div>
                  )}
                  {selectedPaymentMethod.accountName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name</span>
                      <span className="font-medium text-gray-900">{selectedPaymentMethod.accountName}</span>
                    </div>
                  )}
                </div>
                {selectedPaymentMethod.instructions && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-sm text-gray-700 whitespace-pre-line">{selectedPaymentMethod.instructions}</p>
                  </div>
                )}
              </div>

              {/* Transaction Code Input */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Transaction Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={transactionCode}
                  onChange={(e) => setTransactionCode(e.target.value)}
                  placeholder="Enter transaction code from your payment"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  disabled={isProcessing}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the transaction code from your {selectedPaymentMethod.displayName} payment
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <button
            onClick={handleConfirmTopup}
            disabled={isProcessing || !selectedPaymentMethod || !transactionCode.trim()}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}
