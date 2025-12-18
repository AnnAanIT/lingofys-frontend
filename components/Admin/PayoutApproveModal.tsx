
import React, { useState } from 'react';
import { Payout } from '../../types';
import { X, CheckCircle, DollarSign } from 'lucide-react';

interface PayoutApproveModalProps {
    isOpen: boolean;
    onClose: () => void;
    payout: Payout;
    onConfirm: (data: { method: string; adminNote: string }) => void;
}

export const PayoutApproveModal: React.FC<PayoutApproveModalProps> = ({ isOpen, onClose, payout, onConfirm }) => {
    const [method, setMethod] = useState(payout.method || 'Bank Transfer');
    const [adminNote, setAdminNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await onConfirm({ method, adminNote });
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
                
                <div className="mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                        <DollarSign size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Approve Payout Request</h3>
                    <p className="text-sm text-slate-500">This will create a pending payment transaction for you to execute.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 flex justify-between items-center">
                    <div>
                        <div className="text-xs text-slate-500 uppercase font-bold">Amount</div>
                        <div className="text-2xl font-extrabold text-slate-900">${payout.amount}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-slate-500 uppercase font-bold">User ID</div>
                        <div className="font-mono text-slate-700">{payout.mentorId}</div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Intended Payment Method</label>
                        <select 
                            value={method} 
                            onChange={(e) => setMethod(e.target.value)} 
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="PayPal">PayPal</option>
                            <option value="Wise">Wise</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Internal Note (Optional)</label>
                        <textarea 
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            rows={2}
                            placeholder="Approval notes..."
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-100 mt-2 flex items-center justify-center"
                    >
                        {isSubmitting ? 'Processing...' : (
                            <>
                                <CheckCircle size={18} className="mr-2" /> Approve & Create Transaction
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
