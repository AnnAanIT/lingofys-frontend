
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../services/api';

interface CreditAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    onSuccess: () => void;
    resourceName?: string; // e.g. "Credit" or "Balance"
}

export const CreditAdjustmentModal: React.FC<CreditAdjustmentModalProps> = ({ isOpen, onClose, userId, onSuccess, resourceName = "Credit" }) => {
    const [type, setType] = useState<'add' | 'subtract'>('add');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        try {
            // Convert amount based on adjustment type
            let finalAmount = Number(amount);
            if (type === 'subtract') {
                finalAmount = -finalAmount;
            }
            
            await api.updateUserCredit(userId, finalAmount, note);
            onSuccess();
            onClose();
            setAmount('');
            setNote('');
            setType('add');
            alert(`✅ ${resourceName} adjusted successfully!`);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            alert(`❌ Failed to update ${resourceName.toLowerCase()}: ${errorMsg}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-slide-up relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
                <h3 className="text-xl font-bold text-slate-900 mb-6">Adjust {resourceName}</h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Adjustment Type</label>
                        <select 
                            value={type} 
                            onChange={e => setType(e.target.value as any)} 
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                        >
                            <option value="add">Add {resourceName}</option>
                            <option value="subtract">Subtract {resourceName}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                        <input 
                            type="number" 
                            required 
                            min="0"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Reason / Note</label>
                        <textarea 
                            rows={3}
                            required
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="e.g. Bonus for performance..."
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isProcessing || !amount || !note}
                        className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50 mt-2"
                    >
                        {isProcessing ? 'Processing...' : 'Confirm Adjustment'}
                    </button>
                </form>
            </div>
        </div>
    );
};
