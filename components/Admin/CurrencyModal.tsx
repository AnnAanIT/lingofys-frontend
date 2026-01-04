
import React, { useState, useEffect } from 'react';
import { X, Coins } from 'lucide-react';
import { CurrencyConfig } from '../../types';

interface CurrencyModalProps {
    isOpen: boolean;
    onClose: () => void;
    currency: CurrencyConfig | null;
    onSave: (data: CurrencyConfig) => void;
}

export const CurrencyModal: React.FC<CurrencyModalProps> = ({ isOpen, onClose, currency, onSave }) => {
    const [code, setCode] = useState('');
    const [exchangeRate, setExchangeRate] = useState(1);

    useEffect(() => {
        if (currency) {
            setCode(currency.code);
            setExchangeRate(currency.exchangeRate);
        } else {
            setCode('');
            setExchangeRate(1);
        }
    }, [currency, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!code || code.length < 2) {
            alert('Please enter a valid currency code (min 2 characters)');
            return;
        }
        if (exchangeRate < 0.01) {
            alert('Exchange rate must be at least 0.01');
            return;
        }

        const data: CurrencyConfig = {
            code,
            name: code,
            symbol: '$',
            symbolPosition: 'before',
            exchangeRate,
            enabled: true,
            paymentMethods: ['Stripe']
        };
        onSave(data);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-slide-up relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>

                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Coins size={20} className="text-green-600" />
                    {currency ? 'Edit Currency' : 'Add Currency'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Currency Code</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g., VND, USD, EUR"
                            value={code}
                            onChange={e => setCode(e.target.value.toUpperCase())}
                            disabled={!!currency}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Exchange Rate to USD</label>
                        <input
                            type="number"
                            required
                            step="0.01"
                            min="0.01"
                            value={exchangeRate}
                            onFocus={(e) => e.target.select()}
                            onChange={e => setExchangeRate(Number(e.target.value))}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">1 USD = ? {code || 'Currency'} (e.g., VND = 25000, EUR = 0.92)</p>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg mt-2"
                    >
                        Save
                    </button>
                </form>
            </div>
        </div>
    );
};
