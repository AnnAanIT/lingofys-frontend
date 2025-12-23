
import React, { useState, useEffect } from 'react';
import { X, CreditCard, ShieldCheck, Loader2, Globe } from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../App';
import { translations } from '../lib/i18n';
import { CurrencyConfig } from '../types';
import { formatCurrency, calculateLocalPrice, getUserPreferredCurrency, saveUserPreferredCurrency } from '../utils/currencyUtils';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userId: string;
}

export const TopUpModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, userId }) => {
    const { language, user } = useApp();
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

                setCurrencies(settings.currencies || []);

                // Set user's preferred currency
                if (settings.currencies && settings.currencies.length > 0) {
                    const preferredCode = getUserPreferredCurrency(user?.country);
                    const preferred = settings.currencies.find(c => c.code === preferredCode && c.enabled);
                    setSelectedCurrency(preferred || settings.currencies.find(c => c.enabled) || settings.currencies[0]);
                }
            });
        }
    }, [isOpen, user?.country]);

    if (!isOpen) return null;

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
            await api.buyCredits(userId, usdAmount, selectedCurrency.paymentMethods[0] || "Stripe");
            onSuccess();
            onClose();
        } catch (e) {
            alert("Payment Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 md:p-4 animate-fade-in">
            <div className="bg-white rounded-t-3xl md:rounded-[2.5rem] shadow-2xl w-full md:max-w-md overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto">
                <div className="p-5 md:p-8 space-y-4 md:space-y-6">
                    <div className="flex justify-between items-start md:items-center gap-4">
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase">{t.title}</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"><X size={20} /></button>
                    </div>

                    {/* Currency Selector */}
                    <div className="bg-slate-50 p-3 md:p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Globe size={16} className="text-slate-500" />
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Currency</span>
                        </div>
                        <select
                            value={selectedCurrency.code}
                            onChange={(e) => handleCurrencyChange(e.target.value)}
                            className="w-full p-2 md:p-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-900 focus:border-brand-500 focus:outline-none text-sm md:text-base"
                        >
                            {currencies.filter(c => c.enabled).map(currency => (
                                <option key={currency.code} value={currency.code}>
                                    {currency.symbol} {currency.name} ({currency.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Credit Packages */}
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                        {creditPackages.map(credits => {
                            const price = calculateLocalPrice(credits, conversionRatio, selectedCurrency.exchangeRate);
                            const priceFormatted = formatCurrency(price, selectedCurrency);
                            return (
                                <button
                                    key={credits}
                                    onClick={() => setSelectedCredits(credits)}
                                    className={`p-3 md:p-4 rounded-2xl border-2 font-black transition-all text-sm md:text-base ${selectedCredits === credits ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                >
                                    <div className="text-lg md:text-xl">{credits}</div>
                                    <div className="text-[10px] md:text-[11px] font-medium opacity-70">Credits</div>
                                    <div className="text-[9px] md:text-[10px] font-bold opacity-50 mt-0.5">{priceFormatted}</div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-100">
                        <div className="space-y-2 mb-3 md:mb-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-bold text-sm md:text-base">You will receive:</span>
                                <span className="text-xl md:text-2xl font-black text-brand-600">{selectedCredits} Credits</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-bold text-sm md:text-base">{t.paymentTotal}:</span>
                                <span className="text-2xl md:text-3xl font-black text-slate-900">{formatCurrency(localPrice, selectedCurrency)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            <ShieldCheck size={14} className="text-green-500 flex-shrink-0" /> {t.securePayment}
                        </div>
                        <div className="mt-3 text-[10px] text-slate-400">
                            Payment via: {selectedCurrency.paymentMethods.join(', ')}
                        </div>
                    </div>

                    <button 
                        onClick={handlePay}
                        disabled={loading}
                        className="w-full py-3 md:py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs md:text-sm tracking-widest hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
                        {loading ? commonT.processing : t.payNow}
                    </button>
                </div>
            </div>
        </div>
    );
};
