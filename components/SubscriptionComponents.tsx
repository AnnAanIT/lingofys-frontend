
import React from 'react';
import { SubscriptionPlan, Subscription } from '../types';
import { Check, Info, Calendar, RotateCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- PLAN CARD ---
interface PlanCardProps {
    plan: SubscriptionPlan;
    isActive?: boolean;
}

export const SubscriptionPlanCard: React.FC<PlanCardProps> = ({ plan, isActive }) => {
    const navigate = useNavigate();
    
    return (
        <div className={`border rounded-2xl p-6 flex flex-col transition-all ${isActive ? 'border-brand-500 ring-2 ring-brand-100 bg-brand-50' : 'border-slate-200 bg-white hover:border-brand-300 hover:shadow-lg'}`}>
            <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="text-slate-500 text-sm mt-1">{plan.description}</p>
            </div>
            
            <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-900">{Number(plan.price).toFixed(0)}</span>
                <span className="text-slate-500"> credits</span>
            </div>

            <div className="flex-1 space-y-3 mb-8">
                <div className="flex items-center text-sm text-slate-700">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <span><strong>{plan.sessions}</strong> lessons included</span>
                </div>
                <div className="flex items-center text-sm text-slate-700">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <span><strong>{plan.durationWeeks}-week</strong> plan</span>
                </div>
                <div className="flex items-center text-sm text-slate-700">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <span>{plan.allowedMentorTiers && plan.allowedMentorTiers.length > 0
                        ? <><strong>{plan.allowedMentorTiers.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' & ')}</strong> mentors</>
                        : <><strong>All</strong> mentor tiers</>
                    }</span>
                </div>
                <div className="flex items-center text-sm text-slate-500">
                    <Info size={16} className="text-slate-400 mr-2 flex-shrink-0" />
                    <span>{plan.allowedCancel} cancellation{plan.allowedCancel !== 1 ? 's' : ''} • {plan.allowedReschedule} reschedule{plan.allowedReschedule !== 1 ? 's' : ''}</span>
                </div>
            </div>

            {isActive ? (
                <button disabled className="w-full py-3 bg-brand-100 text-brand-700 font-bold rounded-xl cursor-default">
                    Current Plan
                </button>
            ) : (
                <button 
                    onClick={() => navigate(`/mentee/subscriptions/${plan.id}`)}
                    className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
                >
                    Choose Plan
                </button>
            )}
        </div>
    );
};

// --- QUOTA BADGE ---
export const QuotaBadge: React.FC<{ sub: Subscription }> = ({ sub }) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Subscription Limits</h4>
        <div className="flex gap-4">
            <div className="flex-1 p-2 bg-red-50 rounded-lg text-center border border-red-100">
                <div className="text-xl font-bold text-red-600">{sub.cancelQuota}</div>
                <div className="text-xs text-red-800 font-medium">Cancels Left</div>
            </div>
            <div className="flex-1 p-2 bg-yellow-50 rounded-lg text-center border border-yellow-100">
                <div className="text-xl font-bold text-yellow-600">{sub.rescheduleQuota}</div>
                <div className="text-xs text-yellow-800 font-medium">Reschedules Left</div>
            </div>
        </div>
        <div className="mt-3 text-xs text-slate-400 text-center">
            Resets on {new Date(sub.endDate).toLocaleDateString()}
        </div>
    </div>
);

// --- BOOKING BADGE ---
export const SubscriptionBadge: React.FC = () => (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
        <RotateCw size={10} className="mr-1" />
        Subscription
    </span>
);
