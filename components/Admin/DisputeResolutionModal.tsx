
import React, { useState } from 'react';
import { Booking } from '../../types';
import { X, CheckCircle, RotateCcw, ShieldAlert, MessageSquare } from 'lucide-react';

interface DisputeResolutionModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking;
    onResolve: (action: 'REFUND_MENTEE' | 'DISMISS', note: string) => void;
}

export const DisputeResolutionModal: React.FC<DisputeResolutionModalProps> = ({ isOpen, onClose, booking, onResolve }) => {
    const [action, setAction] = useState<'REFUND_MENTEE' | 'DISMISS' | null>(null);
    const [note, setNote] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!action) return;
        onResolve(action, note);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-slide-up relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
                
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <ShieldAlert className="text-orange-500" /> Resolve Dispute
                </h3>

                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6">
                    <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold text-orange-800 uppercase">Reason</span>
                        <span className="text-xs text-orange-600">{new Date(booking.disputeDate || '').toLocaleDateString()}</span>
                    </div>
                    <p className="font-medium text-slate-800">{booking.disputeReason}</p>
                    {booking.disputeEvidence && (
                        <div className="mt-2 text-sm text-slate-600 flex items-center">
                            <span className="font-bold mr-2">Evidence:</span> {booking.disputeEvidence}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">Select Resolution</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setAction('REFUND_MENTEE')}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                                action === 'REFUND_MENTEE' 
                                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <div className="flex items-center gap-2 text-blue-700 font-bold mb-1">
                                <RotateCcw size={18} /> Refund Mentee
                            </div>
                            <p className="text-xs text-slate-500">Return credits to mentee. Deduct from mentor if released.</p>
                        </button>

                        <button 
                            onClick={() => setAction('DISMISS')}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                                action === 'DISMISS' 
                                ? 'border-green-500 bg-green-50 ring-1 ring-green-500' 
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <div className="flex items-center gap-2 text-green-700 font-bold mb-1">
                                <CheckCircle size={18} /> Dismiss Dispute
                            </div>
                            <p className="text-xs text-slate-500">Close dispute. Maintain original transaction status.</p>
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Resolution Note</label>
                        <textarea 
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            rows={3}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                            placeholder="Explain the decision..."
                        />
                    </div>

                    <button 
                        onClick={handleSubmit}
                        disabled={!action}
                        className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 mt-4"
                    >
                        Confirm Resolution
                    </button>
                </div>
            </div>
        </div>
    );
};
