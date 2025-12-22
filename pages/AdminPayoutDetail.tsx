
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Payout, User } from '../types';
import { AdminLayout, StatusBadge } from '../components/AdminComponents';
import { PayoutApproveModal } from '../components/Admin/PayoutApproveModal';
import { PayoutRejectModal } from '../components/Admin/PayoutRejectModal';
import { ArrowLeft, CheckCircle, XCircle, FileText, ArrowRight, DollarSign, AlertCircle } from 'lucide-react';

export default function AdminPayoutDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [payout, setPayout] = useState<Payout | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

    useEffect(() => {
        loadData();
        // Get current user from App context if available
        const userData = localStorage.getItem('currentUser');
        if (userData) {
          setCurrentUser(JSON.parse(userData));
        }
    }, [id]);

    const loadData = async () => {
        if (!id) return;
        const p = await api.getPayoutById(id);
        if (p) {
            setPayout(p);
            const u = await api.getUserById(p.mentorId);
            setUser(u || null);
        }
        setLoading(false);
    };

    const handleApprove = async (data: { method: string; adminNote: string }) => {
        if (!payout) return;
        await api.approvePayout(currentUser, payout.id, data.adminNote);
        // Fix: Ensured logAction is called with exactly 3 arguments as per API definition
        await api.logAction('PAYOUT_APPROVED', `Admin approved payout #${payout.id}. Pending payment execution.`, 'u3');
        loadData();
    };

    const handleReject = async (data: { reason: string; adminNote: string }) => {
        if (!payout) return;
        await api.rejectPayout(currentUser, payout.id, data.reason);
        // Fix: Ensured logAction is called with exactly 3 arguments as per API definition
        await api.logAction('PAYOUT_REJECTED', `Admin rejected payout #${payout.id}. Reason: ${data.reason}`, 'u3');
        loadData();
    };

    if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;
    if (!payout) return <AdminLayout><div>Payout not found</div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex items-center space-x-4 mb-6">
                    <button onClick={() => navigate('/admin/payouts')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900">Payout #{payout.id}</h1>
                            <StatusBadge status={payout.status} />
                        </div>
                        <p className="text-slate-500 text-sm">Requested on {new Date(payout.requestedAt).toLocaleString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="md:col-span-2 space-y-6">
                        
                        {/* Status Cards */}
                        {payout.status === 'PAID' && (
                            <div className="bg-green-50 border border-green-100 rounded-xl p-6 flex items-start gap-4">
                                <CheckCircle className="text-green-600 mt-1" size={24} />
                                <div>
                                    <h3 className="font-bold text-green-900">Payment Completed</h3>
                                    <p className="text-green-700 text-sm mt-1">Processed on {payout.paidAt ? new Date(payout.paidAt).toLocaleString() : 'N/A'}</p>
                                    {payout.adminNote && <p className="text-green-800 text-sm mt-2 italic">"{payout.adminNote}"</p>}
                                </div>
                            </div>
                        )}

                        {payout.status === 'REJECTED' && (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-6 flex items-start gap-4">
                                <XCircle className="text-red-600 mt-1" size={24} />
                                <div>
                                    <h3 className="font-bold text-red-900">Request Rejected</h3>
                                    <p className="text-red-700 text-sm mt-1">Rejected on {payout.rejectedAt ? new Date(payout.rejectedAt).toLocaleString() : 'N/A'}</p>
                                    {payout.adminNote && <p className="text-red-800 text-sm mt-2 font-medium">Reason: {payout.adminNote}</p>}
                                </div>
                            </div>
                        )}

                        {payout.status === 'APPROVED_PENDING_PAYMENT' && (
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex items-start gap-4">
                                <DollarSign className="text-blue-600 mt-1" size={24} />
                                <div className="flex-1">
                                    <h3 className="font-bold text-blue-900">Approved - Payment Required</h3>
                                    <p className="text-blue-700 text-sm mt-1">A payment transaction has been created. Please proceed to execute the transfer.</p>
                                    
                                    <div className="mt-4 flex gap-3">
                                        <button 
                                            onClick={() => navigate(`/admin/payments/${payout.paymentTransactionId}`)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 flex items-center"
                                        >
                                            Execute Payment <ArrowRight size={16} className="ml-2" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {payout.status === 'PAYMENT_FAILED' && (
                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-6 flex items-start gap-4">
                                <AlertCircle className="text-orange-600 mt-1" size={24} />
                                <div>
                                    <h3 className="font-bold text-orange-900">Payment Failed</h3>
                                    <p className="text-orange-700 text-sm mt-1">The transaction attempt failed. Check details or try again.</p>
                                    {payout.adminNote && <p className="text-orange-800 text-sm mt-2 italic">"{payout.adminNote}"</p>}
                                    <button 
                                        onClick={() => navigate(`/admin/payments/${payout.paymentTransactionId}`)}
                                        className="mt-3 text-orange-800 font-bold text-sm underline hover:text-orange-900"
                                    >
                                        View Transaction
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Details Card */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 font-bold text-slate-800">Request Details</div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-500">Amount</span>
                                    <span className="font-bold text-xl text-slate-900">${payout.amount}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-500">Method</span>
                                    <span className="font-medium text-slate-900">{payout.method || 'Default'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-500">User Note</span>
                                    <span className="text-slate-700 text-right max-w-xs">{payout.note || '-'}</span>
                                </div>
                                {payout.evidenceFile && (
                                    <div className="py-2">
                                        <span className="text-slate-500 block mb-2">Evidence</span>
                                        <div className="flex items-center p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                                            <FileText size={16} className="mr-2 text-slate-400" />
                                            <span className="font-mono text-slate-700">{payout.evidenceFile}</span>
                                            <span className="ml-auto text-xs text-green-600 font-bold">UPLOADED</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Actions & User */}
                    <div className="space-y-6">
                        {/* Actions */}
                        {payout.status === 'PENDING' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                <h3 className="font-bold text-slate-900 mb-4">Actions</h3>
                                <div className="space-y-3">
                                    <button 
                                        onClick={() => setIsApproveModalOpen(true)}
                                        className="w-full flex items-center justify-center py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-colors"
                                    >
                                        <CheckCircle size={18} className="mr-2" /> Approve Request
                                    </button>
                                    <button 
                                        onClick={() => setIsRejectModalOpen(true)}
                                        className="w-full flex items-center justify-center py-3 bg-white border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors"
                                    >
                                        <XCircle size={18} className="mr-2" /> Reject
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* User Info */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <h3 className="font-bold text-slate-900 mb-4">Recipient</h3>
                            {user ? (
                                <div className="text-center">
                                    <img src={user.avatar} className="w-16 h-16 rounded-full mx-auto mb-3 bg-slate-100" />
                                    <div className="font-bold text-slate-900">{user.name}</div>
                                    <div className="text-xs text-slate-500 mb-2">{user.email}</div>
                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-bold uppercase">{user.role}</span>
                                    
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-sm">
                                        <span className="text-slate-500">Balance</span>
                                        <span className="font-bold text-slate-900">${user.balance}</span>
                                    </div>
                                    <button 
                                        onClick={() => navigate(`/admin/users/${user.id}`)}
                                        className="w-full mt-4 py-2 text-sm text-brand-600 font-medium border border-brand-200 rounded-lg hover:bg-brand-50"
                                    >
                                        View Profile
                                    </button>
                                </div>
                            ) : (
                                <div className="text-slate-400 text-center">User not found</div>
                            )}
                        </div>
                    </div>
                </div>

                <PayoutApproveModal 
                    isOpen={isApproveModalOpen}
                    onClose={() => setIsApproveModalOpen(false)}
                    payout={payout}
                    onConfirm={handleApprove}
                />

                <PayoutRejectModal 
                    isOpen={isRejectModalOpen}
                    onClose={() => setIsRejectModalOpen(false)}
                    payout={payout}
                    onConfirm={handleReject}
                />
            </div>
        </AdminLayout>
    );
}
