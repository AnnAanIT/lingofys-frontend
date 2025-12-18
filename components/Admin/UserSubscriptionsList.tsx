
import React from 'react';
import { Subscription, SubscriptionPlan } from '../../types';
import { RefreshCw, RotateCcw, Edit } from 'lucide-react';
import { api } from '../../services/api';

interface UserSubscriptionsListProps {
    subscriptions: Subscription[];
    allPlans: SubscriptionPlan[];
    onUpdate: () => void;
    viewMode?: 'mentee' | 'mentor'; // Default 'mentee' (viewing a Mentee's subs)
}

export const UserSubscriptionsList: React.FC<UserSubscriptionsListProps> = ({ subscriptions, allPlans, onUpdate, viewMode = 'mentee' }) => {
    
    const handleResetQuota = async (id: string) => {
        if(confirm("Reset cancel/reschedule quotas to plan defaults?")) {
            await api.resetSubscriptionQuota(id);
            onUpdate();
        }
    };

    const handleForceRenew = async (id: string) => {
        if(confirm("Force renew this subscription? It will extend the end date by one cycle and reset quotas.")) {
            await api.forceRenewSubscription(id);
            onUpdate();
        }
    };

    const handleChangePlan = async (id: string) => {
        const planId = prompt("Enter new Plan ID (e.g., sp1, sp2, sp3):");
        if(planId) {
            try {
                await api.changeSubscriptionPlan(id, planId);
                onUpdate();
            } catch(e) {
                alert("Failed: " + e);
            }
        }
    };

    if (subscriptions.length === 0) return (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
            No active subscriptions found.
        </div>
    );

    return (
        <div className="space-y-6">
            {subscriptions.map(sub => (
                <div key={sub.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-slate-900">{sub.planName}</h4>
                            <p className="text-xs text-slate-500 font-mono">ID: {sub.id}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${sub.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                            {sub.status}
                        </span>
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            {viewMode === 'mentee' ? (
                                <>
                                    <div className="text-xs text-slate-400 uppercase font-bold mb-1">Mentor</div>
                                    <div className="font-medium text-slate-900">{sub.mentorName}</div>
                                    <div className="text-xs text-slate-500 font-mono">{sub.mentorId}</div>
                                </>
                            ) : (
                                <>
                                    <div className="text-xs text-slate-400 uppercase font-bold mb-1">Student</div>
                                    <div className="font-medium text-slate-900">{sub.menteeName || 'Unknown'}</div>
                                    <div className="text-xs text-slate-500 font-mono">{sub.menteeId}</div>
                                </>
                            )}
                        </div>
                        <div>
                            <div className="text-xs text-slate-400 uppercase font-bold mb-1">Cycle</div>
                            <div className="text-sm text-slate-900">{new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-400 uppercase font-bold mb-1">Sessions</div>
                            <div className="font-medium text-slate-900">{sub.remainingSessions} / {sub.totalSessions} remaining</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-400 uppercase font-bold mb-1">Quotas</div>
                            <div className="text-sm">
                                <span className="text-red-600 font-bold">{sub.cancelQuota}</span> Cancels<br/>
                                <span className="text-yellow-600 font-bold">{sub.rescheduleQuota}</span> Reschedules
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end gap-3">
                        <button 
                            onClick={() => handleResetQuota(sub.id)}
                            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center px-3 py-2 bg-white border border-slate-200 rounded-lg"
                        >
                            <RotateCcw size={14} className="mr-2" /> Reset Quota
                        </button>
                        <button 
                            onClick={() => handleChangePlan(sub.id)}
                            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center px-3 py-2 bg-white border border-slate-200 rounded-lg"
                        >
                            <Edit size={14} className="mr-2" /> Change Plan
                        </button>
                        <button 
                            onClick={() => handleForceRenew(sub.id)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg"
                        >
                            <RefreshCw size={14} className="mr-2" /> Force Renew
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
