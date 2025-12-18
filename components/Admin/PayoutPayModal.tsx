
import React, { useState } from 'react';
import { Payout } from '../../types';
import { X, DollarSign, CheckCircle } from 'lucide-react';
import { EvidenceUploader } from './EvidenceUploader';

interface PayoutPayModalProps {
    isOpen: boolean;
    onClose: () => void;
    payout: Payout;
    onConfirm: (data: { method: string; evidenceFile: string; adminNote: string }) => void;
}

export const PayoutPayModal: React.FC<PayoutPayModalProps> = ({ isOpen, onClose, payout, onConfirm }) => {
    const [method, setMethod] = useState(payout.method || 'Bank Transfer');
    const [evidenceFile, setEvidenceFile] = useState('');
    const [adminNote, setAdminNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!evidenceFile) {
            alert("Proof of payment is required.");
            return;
        }
        setIsSubmitting(true);
        await onConfirm({ method, evidenceFile, adminNote });
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
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                        <DollarSign size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Approve Payout</h3>
                    <p className="text-sm text-slate-500">Confirm transfer of funds to the user.</p>
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                        <select 
                            value={method} 
                            onChange={(e) => setMethod(e.target.value)} 
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        >
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="PayPal">PayPal</option>
                            <option value="Wise">Wise</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Proof of Payment <span className="text-red-500">*</span></label>
                        <EvidenceUploader onUpload={setEvidenceFile} required={!evidenceFile} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Admin Notes (Optional)</label>
                        <textarea 
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            rows={2}
                            placeholder="Transaction ID, reference numbers, etc."
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting || !evidenceFile}
                        className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 shadow-lg shadow-green-100 mt-2 flex items-center justify-center"
                    >
                        {isSubmitting ? 'Processing...' : (
                            <>
                                <CheckCircle size={18} className="mr-2" /> Confirm Payment
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
