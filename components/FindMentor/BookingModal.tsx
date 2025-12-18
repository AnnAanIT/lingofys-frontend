
import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, CreditCard, AlertCircle, CheckCircle, Award, Globe } from 'lucide-react';
import { Mentor, User, Subscription } from '../../types';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (useSubscription: boolean) => void;
    mentor: Mentor;
    user: User;
    date: Date;
    priceDetails: {
        basePrice: number;
        countryMultiplier: number;
        groupMultiplier: number;
        finalPrice: number;
    } | null;
    isProcessing: boolean;
    activeSubscription?: Subscription | null;
}

export const BookingModal: React.FC<BookingModalProps> = ({ 
    isOpen, onClose, onConfirm, mentor, user, date, priceDetails, isProcessing, activeSubscription 
}) => {
    const [selectedMethod, setSelectedMethod] = useState<'SUBSCRIPTION' | 'CREDIT'>('CREDIT');

    useEffect(() => {
        if (isOpen && activeSubscription && activeSubscription.remainingSessions > 0) {
            setSelectedMethod('SUBSCRIPTION');
        } else {
            setSelectedMethod('CREDIT');
        }
    }, [isOpen, activeSubscription]);

    if (!isOpen) return null;

    if (!priceDetails) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl p-8 flex flex-col items-center shadow-2xl max-w-sm w-full">
                    <div className="animate-spin w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full mb-6"></div>
                    <span className="text-slate-900 font-black text-xl tracking-tight">Calculating price...</span>
                    <p className="text-slate-500 text-sm text-center mt-2 font-medium">Finalizing localized rates for your region.</p>
                    <button onClick={onClose} className="mt-8 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Cancel</button>
                </div>
            </div>
        );
    }

    const hasValidSubscription = activeSubscription && activeSubscription.remainingSessions > 0;
    const remainingCredit = user.credits - priceDetails.finalPrice;
    const canAffordCredit = remainingCredit >= 0;

    const canBook = selectedMethod === 'SUBSCRIPTION' ? hasValidSubscription : canAffordCredit;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
                <div className="bg-slate-50 px-8 py-5 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-black text-slate-900 tracking-tight uppercase text-sm">Confirm Booking</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                    <div className="flex items-start gap-5">
                        <div className="relative flex-shrink-0">
                            <img src={mentor.avatar} alt={mentor.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm" />
                            <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white shadow-sm"></div>
                        </div>
                        <div>
                            <h4 className="font-black text-slate-900 text-lg tracking-tight">{mentor.name}</h4>
                            <div className="space-y-1 mt-1.5">
                                <div className="flex items-center text-sm text-slate-600 font-bold">
                                    <Calendar size={14} className="mr-2 text-brand-500" />
                                    {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </div>
                                <div className="flex items-center text-sm text-slate-900 font-black">
                                    <Clock size={14} className="mr-2 text-brand-500" />
                                    {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (60 min)
                                </div>
                                <div className="flex items-center text-[10px] text-brand-600 font-bold uppercase tracking-widest pt-1">
                                    <Globe size={10} className="mr-1.5" /> Displayed in {user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Method</label>
                        
                        {activeSubscription && (
                            <div 
                                onClick={() => hasValidSubscription && setSelectedMethod('SUBSCRIPTION')}
                                className={`border-2 rounded-2xl p-5 cursor-pointer transition-all relative group ${
                                    selectedMethod === 'SUBSCRIPTION' 
                                    ? 'border-brand-600 bg-brand-50 shadow-lg ring-1 ring-brand-600' 
                                    : hasValidSubscription ? 'border-slate-100 bg-white hover:border-brand-300' : 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                                }`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-2 font-black text-brand-900 tracking-tight">
                                        <Award size={20} className="text-brand-600" />
                                        {activeSubscription.planName} Plan
                                    </div>
                                    {selectedMethod === 'SUBSCRIPTION' && <CheckCircle size={22} className="text-brand-600" />}
                                </div>
                                <p className="text-xs text-brand-700 ml-7 font-bold">
                                    Use 1 Session ({activeSubscription.remainingSessions} remaining)
                                </p>
                            </div>
                        )}

                        <div 
                            onClick={() => setSelectedMethod('CREDIT')}
                            className={`border-2 rounded-2xl p-5 cursor-pointer transition-all relative group ${
                                selectedMethod === 'CREDIT' 
                                ? 'border-brand-600 bg-brand-50 shadow-lg ring-1 ring-brand-600' 
                                : 'border-slate-100 bg-white hover:border-brand-300'
                            }`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-2 font-black text-slate-900 tracking-tight">
                                    <CreditCard size={20} className="text-brand-600" />
                                    Wallet Credits
                                </div>
                                {selectedMethod === 'CREDIT' && <CheckCircle size={22} className="text-brand-600" />}
                            </div>
                            <div className="ml-7 space-y-1 mt-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-bold">Price</span>
                                    <span className="font-black text-slate-900">{priceDetails.finalPrice.toFixed(0)} Credits</span>
                                </div>
                                {selectedMethod === 'CREDIT' && (
                                    <>
                                        <div className="flex justify-between text-xs pt-2 border-t border-brand-200/50 mt-2">
                                            <span className="text-slate-400 font-bold">Your Balance</span>
                                            <span className="font-bold text-slate-700">{user.credits.toFixed(0)}</span>
                                        </div>
                                        {!canAffordCredit && (
                                            <div className="flex items-center text-[10px] font-black text-red-600 mt-2 uppercase tracking-widest gap-1">
                                                <AlertCircle size={10} /> Insufficient Balance
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 pt-0 flex gap-4 mt-auto">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => onConfirm(selectedMethod === 'SUBSCRIPTION')}
                        disabled={!canBook || isProcessing}
                        className={`flex-[2] py-4 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
                            canBook 
                                ? 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/20' 
                                : 'bg-slate-200 cursor-not-allowed shadow-none'
                        }`}
                    >
                        {isProcessing ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            'Confirm Booking'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
