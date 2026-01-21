
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AdminLayout, ConfirmDialog } from '../components/AdminComponents';
import { SubscriptionPlanModal } from '../components/Admin/SubscriptionPlanModal';
import { SubscriptionPlan } from '../types';
import { Award, Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export default function AdminSubscriptionPlans() {
    const { error: showError } = useToast();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
    const [deletingPlan, setDeletingPlan] = useState<SubscriptionPlan | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        const data = await api.getSubscriptionPlans();
        setPlans(data);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSave = async (plan: SubscriptionPlan) => {
        try {
            if (editingPlan) {
                await api.updateSubscriptionPlan(plan.id, plan);
                await api.logAction('PLAN_UPDATE', 'admin', `Updated plan ${plan.name}`);
            } else {
                await api.addSubscriptionPlan(plan);
                await api.logAction('PLAN_CREATE', 'admin', `Created plan ${plan.name}`);
            }
            setIsModalOpen(false);
            setEditingPlan(null);
            loadData();
        } catch (error: any) {
            showError('Operation Failed', error.message);
        }
    };

    const handleDelete = async () => {
        if (!deletingPlan) return;
        try {
            await api.deleteSubscriptionPlan(deletingPlan.id);
            await api.logAction('PLAN_DELETE', 'admin', `Deleted plan ${deletingPlan.name}`);
            setDeletingPlan(null);
            loadData();
        } catch (error: any) {
            showError('Delete Failed', error.message);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Award className="text-brand-600" /> Subscription Plans
                        </h1>
                        <p className="text-slate-500 mt-1">Configure packages available to Mentees.</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={loadData} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                        </button>
                        <button 
                            onClick={() => { setEditingPlan(null); setIsModalOpen(true); }}
                            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold flex items-center hover:bg-slate-800 shadow-sm"
                        >
                            <Plus size={18} className="mr-2" /> Add Plan
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map(plan => (
                        <div key={plan.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">{plan.name}</h3>
                                    <p className="text-xs text-slate-500 font-mono mt-1">{plan.id}</p>
                                </div>
                                <div className="text-2xl font-extrabold text-slate-900">
                                    {Number(plan.price).toFixed(2)} <span className="text-xs font-medium text-slate-500">Credits</span>
                                </div>
                            </div>
                            
                            <div className="p-6 space-y-4">
                                <p className="text-sm text-slate-600 min-h-[40px]">{plan.description}</p>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <div className="text-xs text-slate-400 uppercase font-bold">Sessions</div>
                                        <div className="font-bold text-slate-800">{plan.sessions}</div>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <div className="text-xs text-slate-400 uppercase font-bold">Duration</div>
                                        <div className="font-bold text-slate-800">{plan.durationWeeks} Weeks</div>
                                    </div>
                                    <div className="bg-red-50 p-2 rounded-lg border border-red-100">
                                        <div className="text-xs text-red-400 uppercase font-bold">Cancel Limit</div>
                                        <div className="font-bold text-red-700">{plan.allowedCancel}</div>
                                    </div>
                                    <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-100">
                                        <div className="text-xs text-yellow-500 uppercase font-bold">Reschedule</div>
                                        <div className="font-bold text-yellow-700">{plan.allowedReschedule}</div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <div className="text-xs text-slate-400 uppercase font-bold mb-2">Mentor Tiers</div>
                                    <div className="flex flex-wrap gap-1">
                                        {(!plan.allowedMentorTiers || plan.allowedMentorTiers.length === 0) ? (
                                            <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">All Tiers</span>
                                        ) : (
                                            plan.allowedMentorTiers.map(tier => (
                                                <span key={tier} className="px-2 py-1 bg-brand-50 text-brand-700 text-xs rounded-full capitalize">
                                                    {tier}
                                                </span>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => { setEditingPlan(plan); setIsModalOpen(true); }}
                                    className="p-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                    title="Edit"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button 
                                    onClick={() => setDeletingPlan(plan)}
                                    className="p-2 text-red-500 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {plans.length === 0 && (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        No subscription plans found. Add one to get started.
                    </div>
                )}

                <SubscriptionPlanModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)}
                    plan={editingPlan}
                    onSave={handleSave}
                />

                <ConfirmDialog 
                    isOpen={!!deletingPlan}
                    onClose={() => setDeletingPlan(null)}
                    onConfirm={handleDelete}
                    title="Delete Plan"
                    message={`Are you sure you want to delete the plan "${deletingPlan?.name}"?`}
                />
            </div>
        </AdminLayout>
    );
}
