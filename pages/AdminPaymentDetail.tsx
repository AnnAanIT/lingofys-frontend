
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useApp } from '../App';
import { Transaction, Payout } from '../types';
import { AdminLayout, StatusBadge } from '../components/AdminComponents';
import { EvidenceUploader } from '../components/Admin/EvidenceUploader';
import { ArrowLeft, DollarSign, CheckCircle, XCircle, AlertTriangle, Calendar, CreditCard } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export default function AdminPaymentDetail() {
    const { id } = useParams(); // Transaction ID
    const navigate = useNavigate();
    const { user } = useApp();
    const { warning } = useToast();
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [payout, setPayout] = useState<Payout | null>(null);
    const [loading, setLoading] = useState(true);

    // Form state
    const [evidenceFile, setEvidenceFile] = useState('');
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        if (!id) return;
        const t = await api.getTransactionById(id);
        if (t) {
            setTransaction(t);
            if (t.payoutId) {
                const p = await api.getPayoutById(t.payoutId);
                setPayout(p || null);
            }
        }
        setLoading(false);
    };

    const handleComplete = async () => {
        if (!payout) {
            warning('No Payout', 'No associated payout found.');
            return;
        }
        if (!evidenceFile) {
            warning('Missing Evidence', 'Proof of payment is required.');
            return;
        }
        setIsSubmitting(true);
        // Use markPayoutPaid endpoint instead of completePayment
        await api.markPayoutPaid(payout.id, evidenceFile);
        await api.logAction('PAYMENT_COMPLETE', user!.id, `Admin marked payout #${payout.id} as PAID`);

        // Redirect back to payout detail
        navigate(`/admin/payouts/${payout.id}`);
        setIsSubmitting(false);
    };

    const handleFail = async () => {
        if (!payout) {
            alert("No associated payout found.");
            return;
        }
        const reason = prompt("Enter failure reason:");
        if (reason) {
            setIsSubmitting(true);
            // Use rejectPayout endpoint instead of failPayment
            await api.rejectPayout(payout.id, user!.id, reason);
            // Fix: Ensured logAction is called with exactly 3 arguments as per API definition
            await api.logAction('PAYMENT_FAILED', user!.id, `Admin rejected payout #${payout.id}. Reason: ${reason}`);

            navigate(`/admin/payouts/${payout.id}`);
            setIsSubmitting(false);
        }
    };

    if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;
    if (!transaction) return <AdminLayout><div>Transaction not found</div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
                <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-900 transition-colors">
                    <ArrowLeft size={18} className="mr-2" /> Back
                </button>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Execute Payment</h1>
                        <p className="text-slate-500 mt-1">Transaction #{transaction.id}</p>
                    </div>
                    <StatusBadge status={transaction.status.toUpperCase()} />
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 bg-slate-50 border-b border-slate-100">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase">Amount</span>
                                <div className="text-3xl font-extrabold text-slate-900">${Math.abs(transaction.amount)}</div>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase">Recipient User ID</span>
                                <div className="text-lg font-mono text-slate-700">{transaction.userId}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6 space-y-4 text-sm">
                        <div className="flex justify-between border-b border-slate-50 py-2">
                            <span className="text-slate-500 flex items-center"><Calendar size={16} className="mr-2"/> Date Created</span>
                            <span className="font-medium text-slate-900">{new Date(transaction.date).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 py-2">
                            <span className="text-slate-500 flex items-center"><CreditCard size={16} className="mr-2"/> Method</span>
                            <span className="font-medium text-slate-900">{transaction.method || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 py-2">
                            <span className="text-slate-500">Related Payout ID</span>
                            <span className="font-mono text-brand-600 cursor-pointer hover:underline" onClick={() => navigate(`/admin/payouts/${payout?.id}`)}>{payout?.id || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {transaction.status === 'PENDING' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-900 mb-4">Complete Transaction</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Upload Payment Evidence <span className="text-red-500">*</span></label>
                                <EvidenceUploader onUpload={setEvidenceFile} required={true} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                                <textarea 
                                    className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                                    rows={2}
                                    placeholder="Transaction reference ID, etc."
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    onClick={handleComplete}
                                    disabled={!evidenceFile || isSubmitting}
                                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-100 disabled:opacity-50 flex items-center justify-center"
                                >
                                    <CheckCircle size={18} className="mr-2" /> Mark as Paid
                                </button>
                                <button 
                                    onClick={handleFail}
                                    disabled={isSubmitting}
                                    className="px-6 py-3 bg-white border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 flex items-center"
                                >
                                    <XCircle size={18} className="mr-2" /> Mark Failed
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {transaction.status === 'success' && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                        <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-green-900">Payment Successful</h3>
                        <p className="text-green-700">This transaction has been completed and verified.</p>
                        {transaction.evidenceFile && (
                            <div className="mt-4 inline-block px-4 py-2 bg-white rounded-lg border border-green-200 text-sm font-medium text-green-800">
                                Evidence: {transaction.evidenceFile}
                            </div>
                        )}
                    </div>
                )}

                {transaction.status === 'failed' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <AlertTriangle size={48} className="text-red-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-red-900">Payment Failed</h3>
                        <p className="text-red-700">Reason: {transaction.reason || 'Unknown error'}</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
