
import React, { useState, useEffect } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { api } from '../../services/api';
import { Payout } from '../../types';

interface AddPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ isOpen, onClose, onSave }) => {
    const [type, setType] = useState('mentor_payout');
    const [formData, setFormData] = useState({
        targetId: '',
        amount: '',
        method: 'PayPal',
        reason: '',
        evidenceFile: '',
        note: '',
        payoutId: ''
    });
    
    // Payout Selection State
    const [pendingPayouts, setPendingPayouts] = useState<Payout[]>([]);

    useEffect(() => {
        if (isOpen) {
            api.getAllPayouts().then(data => {
                // Fetch pending payouts
                setPendingPayouts(data.filter(p => p.status === 'PENDING' || p.status === 'APPROVED_PENDING_PAYMENT'));
            });
        }
    }, [isOpen]);

    const handlePayoutSelect = async (payoutId: string) => {
        if (!payoutId) {
             setFormData(prev => ({ ...prev, payoutId: '', targetId: '', amount: '', note: '' }));
             return;
        }
        
        const payout = pendingPayouts.find(p => p.id === payoutId);
        if (payout) {
            // Fetch user to determine type
            const user = await api.getUserById(payout.mentorId);
            let newType = 'mentor_payout';
            if (user?.role === 'PROVIDER') newType = 'provider_payout';
            
            setType(newType);
            setFormData(prev => ({
                ...prev,
                targetId: payout.mentorId,
                amount: payout.amount.toString(),
                note: `Fulfillment for Payout #${payout.id} - ${payout.note || ''}`,
                payoutId: payout.id,
                method: payout.method || 'PayPal'
            }));
        }
    };

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, type, amount: Number(formData.amount) });
        onClose();
        setFormData({ targetId: '', amount: '', method: 'PayPal', reason: '', evidenceFile: '', note: '', payoutId: '' });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
                <h3 className="text-xl font-bold text-slate-900 mb-6">Add Transaction</h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Payout Link Selector */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <label className="block text-sm font-bold text-blue-800 mb-2 flex items-center">
                            <FileText size={16} className="mr-2"/> Link Pending Payout (Optional)
                        </label>
                        <select 
                            className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                            onChange={(e) => handlePayoutSelect(e.target.value)}
                            value={formData.payoutId}
                        >
                            <option value="">-- Select a Request --</option>
                            {pendingPayouts.map(p => (
                                <option key={p.id} value={p.id}>
                                    #{p.id} - ${p.amount} ({p.mentorId})
                                </option>
                            ))}
                        </select>
                        {formData.payoutId && <p className="text-xs text-blue-600 mt-2">Auto-filled details from request.</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Transaction Type</label>
                        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none">
                            <option value="mentor_payout">Pay Mentor</option>
                            <option value="provider_payout">Pay Provider</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {type === 'mentor_payout' ? 'Mentor ID' : 'Provider ID'}
                        </label>
                        <input 
                            type="text" 
                            name="targetId" 
                            required 
                            value={formData.targetId} 
                            onChange={handleChange} 
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" 
                            placeholder="e.g. u2" 
                            readOnly={!!formData.payoutId}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                        <input 
                            type="number" 
                            name="amount" 
                            required 
                            value={formData.amount} 
                            onChange={handleChange} 
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" 
                            readOnly={!!formData.payoutId}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Method</label>
                        <select name="method" value={formData.method} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none">
                            <option value="PayPal">PayPal</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Wise">Wise</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Evidence File (Required)</label>
                        <div className="flex gap-2">
                            <input type="text" name="evidenceFile" required value={formData.evidenceFile} onChange={handleChange} className="flex-1 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="receipt.pdf" />
                            <button type="button" className="p-2 bg-slate-100 rounded-lg text-slate-600"><Upload size={20}/></button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Note (Optional)</label>
                        <textarea name="note" rows={2} value={formData.note} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                    </div>

                    <button type="submit" className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-lg mt-2">
                        Create Transaction
                    </button>
                </form>
            </div>
        </div>
    );
};
