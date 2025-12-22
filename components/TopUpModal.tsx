
import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../App';
import { translations } from '../lib/i18n';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userId: string;
}

export const TopUpModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, userId }) => {
    const { language } = useApp();
    const t = translations[language].mentee.walletModal;
    const commonT = translations[language].common;
    const [amount, setAmount] = useState(50);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handlePay = async () => {
        setLoading(true);
        try {
            await api.buyCredits(userId, amount, "Visa/Mastercard");
            onSuccess();
            onClose();
        } catch (e) {
            alert("Payment Error");
        } finally {
            setLoading(false);
        }
    };

    const options = [20, 50, 100, 200];

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 md:p-4 animate-fade-in">
            <div className="bg-white rounded-t-3xl md:rounded-[2.5rem] shadow-2xl w-full md:max-w-md overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto">
                <div className="p-5 md:p-8 space-y-4 md:space-y-6">
                    <div className="flex justify-between items-start md:items-center gap-4">
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase">{t.title}</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"><X size={20} /></button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                        {options.map(opt => (
                            <button 
                                key={opt}
                                onClick={() => setAmount(opt)}
                                className={`p-3 md:p-4 rounded-2xl border-2 font-black transition-all text-sm md:text-base ${amount === opt ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                            >
                                {opt} <span className="text-[10px] md:text-[11px] block">Credits</span>
                            </button>
                        ))}
                    </div>

                    <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-3 md:mb-4">
                            <span className="text-slate-500 font-bold text-sm md:text-base">{t.paymentTotal}:</span>
                            <span className="text-2xl md:text-3xl font-black text-slate-900">${amount}.00</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            <ShieldCheck size={14} className="text-green-500 flex-shrink-0" /> {t.securePayment}
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
