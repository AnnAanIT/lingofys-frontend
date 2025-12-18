
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
                <div className="p-8 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black text-slate-900 uppercase">{t.title}</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {options.map(opt => (
                            <button 
                                key={opt}
                                onClick={() => setAmount(opt)}
                                className={`p-4 rounded-2xl border-2 font-black transition-all ${amount === opt ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                            >
                                {opt} <span className="text-[10px] block">Credits</span>
                            </button>
                        ))}
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-slate-500 font-bold">{t.paymentTotal}:</span>
                            <span className="text-2xl font-black text-slate-900">${amount}.00</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <ShieldCheck size={14} className="text-green-500" /> {t.securePayment}
                        </div>
                    </div>

                    <button 
                        onClick={handlePay}
                        disabled={loading}
                        className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <CreditCard size={18} />}
                        {loading ? commonT.processing : t.payNow}
                    </button>
                </div>
            </div>
        </div>
    );
};
