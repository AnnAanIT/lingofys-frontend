
import React, { useState } from 'react';
import { Payout } from '../../types';
import { X, AlertTriangle } from 'lucide-react';

interface PayoutRejectModalProps {
    isOpen: boolean;
    onClose: () => void;
    payout: Payout;
    onConfirm: (data: { reason: string; adminNote: string }) => void;
}

export const PayoutRejectModal: React.FC<PayoutRejectModalProps> = ({ isOpen, onClose, payout, onConfirm }) => {
    const [reason, setReason] = useState('');
    const [adminNote, setAdminNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason) return;
        
        setIsSubmitting(true);
        await onConfirm({ reason, adminNote });
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
                
                <div className="mb-6 text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Reject Payout</h3>
                    <p className="text-sm text-slate-500">Funds will be returned to the user's balance.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 text-center">
                    <div className="text-xs text-slate-500 uppercase font-bold">Request Amount</div>
                    <div className="text-2xl font-extrabold text-slate-900">${payout.amount}</div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Rejection Reason <span className="text-red-500">*</span></label>
                        <textarea 
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            required
                            placeholder="Explain why this request is being rejected..."
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Internal Admin Note (Optional)</label>
                        <input 
                            type="text"
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            placeholder="Internal reference..."
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting || !reason}
                        className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 mt-4"
                    >
                        {isSubmitting ? 'Processing...' : 'Confirm Rejection'}
                    </button>
                </form>
            </div>
        </div>
    );
};
