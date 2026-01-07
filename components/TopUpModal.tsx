
import React, { useState, useEffect } from 'react';
import { X, CreditCard, ShieldCheck, Loader2, Globe } from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../App';
import { translations } from '../lib/i18n';
import { CurrencyConfig } from '../types';
import { formatCurrency, calculateLocalPrice, getUserPreferredCurrency, saveUserPreferredCurrency } from '../utils/currencyUtils';
import { useToast } from './ui/Toast';

// ✅ FIX VERCEL BUG: Default currencies fallback for SSR/SSG environments
const DEFAULT_CURRENCIES: CurrencyConfig[] = [
    {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        symbolPosition: 'before',
        exchangeRate: 1,
        enabled: true,
        paymentMethods: ['Stripe', 'PayPal']
    },
    {
        code: 'VND',
        name: 'Vietnamese Dong',
        symbol: '₫',
        symbolPosition: 'after',
        exchangeRate: 25000,
        enabled: true,
        paymentMethods: ['VNPay', 'MoMo']
    },
    {
        code: 'JPY',
        name: 'Japanese Yen',
        symbol: '¥',
        symbolPosition: 'before',
        exchangeRate: 150,
        enabled: true,
        paymentMethods: ['Stripe']
    }
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userId: string;
}

export const TopUpModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, userId }) => {
    const { language, user } = useApp();
    const { error: showError } = useToast();
    const t = translations[language].mentee.walletModal;
    const commonT = translations[language].common;
    const [selectedCredits, setSelectedCredits] = useState(40);
    const [loading, setLoading] = useState(false);
    const [conversionRatio, setConversionRatio] = useState(0.8);
    const [creditPackages, setCreditPackages] = useState<number[]>([40, 100, 200, 400]);
    const [currencies, setCurrencies] = useState<CurrencyConfig[]>([]);
    const [selectedCurrency, setSelectedCurrency] = useState<CurrencyConfig | null>(null);

    // Fetch system settings when modal opens
    useEffect(() => {
        if (isOpen) {
            api.getSystemSettings().then(settings => {
                setConversionRatio(settings.topupConversionRatio || 0.8);

                // ✅ FIX BUG: Ensure creditPackages is never empty
                const packages = settings.creditPackages || [40, 100, 200, 400];
                setCreditPackages(packages.length > 0 ? packages : [40, 100, 200, 400]);

                // ✅ FIX VERCEL BUG: Use DEFAULT_CURRENCIES fallback when settings.currencies is empty
                const availableCurrencies = (settings.currencies && settings.currencies.length > 0)
                    ? settings.currencies
                    : DEFAULT_CURRENCIES;

                setCurrencies(availableCurrencies);

                // Set user's preferred currency (always guaranteed to have at least one currency now)
                const preferredCode = getUserPreferredCurrency(user?.country);
                const preferred = availableCurrencies.find(c => c.code === preferredCode && c.enabled);
                setSelectedCurrency(
                    preferred ||
                    availableCurrencies.find(c => c.enabled) ||
                    availableCurrencies[0]
                );
            });
        }
    }, [isOpen, user?.country]);

    if (!isOpen) return null;

    // Calculate which package has best value (lowest price per credit)
    const getBestValuePackage = () => {
        if (creditPackages.length === 0) return null;
        let bestPackage = creditPackages[0];
        let bestPricePerCredit = (creditPackages[0] / conversionRatio) / creditPackages[0];
        
        creditPackages.forEach(pkg => {
            const pricePerCredit = (pkg / conversionRatio) / pkg;
            if (pricePerCredit < bestPricePerCredit) {
                bestPricePerCredit = pricePerCredit;
                bestPackage = pkg;
            }
        });
        
        // Best value is typically the largest package
        return creditPackages[creditPackages.length - 1];
    };

    const bestValuePackage = getBestValuePackage();

    // Show loading state while currency data is being fetched
    if (!selectedCurrency) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                <div className="bg-white p-8 rounded-2xl shadow-2xl">
                    <Loader2 className="animate-spin text-brand-600 mx-auto" size={40} />
                    <p className="text-slate-600 font-bold mt-4 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    const localPrice = calculateLocalPrice(selectedCredits, conversionRatio, selectedCurrency.exchangeRate);

    const handleCurrencyChange = (currencyCode: string) => {
        const currency = currencies.find(c => c.code === currencyCode);
        if (currency) {
            setSelectedCurrency(currency);
            saveUserPreferredCurrency(currencyCode);
        }
    };

    const handlePay = async () => {
        setLoading(true);
        try {
            const usdAmount = selectedCredits / conversionRatio;
            const paymentMethod = (selectedCurrency.paymentMethods && selectedCurrency.paymentMethods[0]) || "Stripe";
            await api.buyCredits(userId, usdAmount, paymentMethod);
            onSuccess();
            onClose();
        } catch (e: any) {
            showError('Payment Failed', e.message || 'An error occurred during payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 md:p-4 animate-fade-in">
            <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full md:max-w-md overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto">
                <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase">{t.title}</h2>
                        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"><X size={18} /></button>
                    </div>

                    {/* Currency Selector */}
                    <div className="bg-slate-50 p-2.5 md:p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <Globe size={14} className="text-slate-500" />
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Currency</span>
                        </div>
                        <select
                            value={selectedCurrency.code}
                            onChange={(e) => handleCurrencyChange(e.target.value)}
                            className="w-full p-2 bg-white border-2 border-slate-200 rounded-lg font-bold text-slate-900 focus:border-brand-500 focus:outline-none text-sm"
                        >
                            {currencies.filter(c => c.enabled).map(currency => (
                                <option key={currency.code} value={currency.code}>
                                    {currency.symbol} {currency.name} ({currency.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Credit Packages */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Select Package</span>
                            <span className="text-[9px] text-slate-400">Rate: 1 Cr = ${(1 / conversionRatio).toFixed(2)} USD</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {creditPackages.map(credits => {
                                const price = calculateLocalPrice(credits, conversionRatio, selectedCurrency.exchangeRate);
                                const priceFormatted = formatCurrency(price, selectedCurrency);
                                const isBestValue = credits === bestValuePackage;
                                const isSelected = selectedCredits === credits;
                                
                                return (
                                    <button
                                        key={credits}
                                        onClick={() => setSelectedCredits(credits)}
                                        className={`relative p-2.5 md:p-3 rounded-lg border-2 transition-all overflow-hidden group ${
                                            isSelected 
                                                ? 'border-brand-600 bg-brand-50 shadow-lg shadow-brand-100' 
                                                : 'border-slate-200 bg-white hover:border-brand-300 hover:shadow-md'
                                        }`}
                                    >
                                        {isBestValue && (
                                            <div className="absolute top-0 right-0 bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-bl-md uppercase tracking-wider">
                                                Best
                                            </div>
                                        )}
                                        <div className={`text-xl md:text-2xl font-black mb-0.5 ${
                                            isSelected ? 'text-brand-600' : 'text-slate-700 group-hover:text-brand-600'
                                        }`}>
                                            {credits}
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-500 mb-1">Credits</div>
                                        <div className={`text-xs font-black ${
                                            isSelected ? 'text-brand-700' : 'text-slate-600 group-hover:text-brand-600'
                                        }`}>
                                            {priceFormatted}
                                        </div>
                                        <div className="text-[8px] text-slate-400 mt-0.5">
                                            {(price / credits).toFixed(2)}/cr
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 md:p-4 rounded-xl border-2 border-slate-200">
                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Summary</div>
                        
                        <div className="space-y-2">
                            {/* Credits */}
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                <span className="text-xs font-bold text-slate-600">Credits</span>
                                <div className="text-right">
                                    <div className="text-xl md:text-2xl font-black text-brand-600">{selectedCredits}</div>
                                    <div className="text-[9px] text-slate-400">@ {conversionRatio} rate</div>
                                </div>
                            </div>
                            
                            {/* Total Payment */}
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-sm font-bold text-slate-700">Total</span>
                                <div className="text-xl md:text-2xl font-black text-slate-900">
                                    {formatCurrency(localPrice, selectedCurrency)}
                                </div>
                            </div>
                        </div>
                        
                        {/* Security & Payment Info */}
                        <div className="mt-2.5 pt-2.5 border-t border-slate-200 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-600">
                                <ShieldCheck size={14} className="flex-shrink-0" /> 
                                <span>{t.securePayment}</span>
                            </div>
                            <div className="text-[9px] text-slate-500">
                                Via: <span className="font-bold">{(selectedCurrency.paymentMethods || ['Stripe']).join(', ')}</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handlePay}
                        disabled={loading}
                        className="w-full py-3 md:py-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-xl font-black uppercase text-xs md:text-sm tracking-widest hover:from-brand-700 hover:to-brand-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
                        <span>{loading ? commonT.processing : t.payNow}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
