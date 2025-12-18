
import React, { useState } from 'react';
import { X, AlertTriangle, Upload, FileText, CheckCircle } from 'lucide-react';
import { Booking } from '../../types';
import { api } from '../../services/api';

interface DisputeModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking;
    onSuccess: () => void;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({ isOpen, onClose, booking, onSuccess }) => {
    const [reason, setReason] = useState('');
    const [evidence, setEvidence] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason) return;
        
        setIsSubmitting(true);
        try {
            await api.reportDispute(booking.id, reason, evidence);
            onSuccess();
            onClose();
        } catch (e) {
            alert(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
                
                <div className="mb-6 text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Report Issue</h3>
                    <p className="text-sm text-slate-500">Booking #{booking.id.slice(-6)}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">What went wrong?</label>
                        <select 
                            value={reason} 
                            onChange={e => setReason(e.target.value)} 
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                            required
                        >
                            <option value="">Select a reason</option>
                            <option value="Mentor was late/absent">Mentor was late/absent</option>
                            <option value="Technical issues">Technical issues</option>
                            <option value="Poor lesson quality">Poor lesson quality</option>
                            <option value="Inappropriate behavior">Inappropriate behavior</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Evidence (Optional)</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={evidence} 
                                onChange={e => setEvidence(e.target.value)} 
                                placeholder="Screenshot filename..."
                                className="flex-1 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                            />
                            <button type="button" className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200">
                                <Upload size={20} className="text-slate-600" />
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Upload screenshots or provide details.</p>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting || !reason}
                        className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 mt-4 shadow-lg shadow-red-100"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                </form>
            </div>
        </div>
    );
};
