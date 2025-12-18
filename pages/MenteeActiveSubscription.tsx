
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useApp } from '../App';
import { Subscription } from '../types';
import { QuotaBadge } from '../components/SubscriptionComponents';
import { Link } from 'react-router-dom';
import { Calendar, User, Clock, ArrowRight } from 'lucide-react';

export default function MenteeActiveSubscription() {
    const { user } = useApp();
    const [sub, setSub] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if(user) {
            api.getActiveSubscription(user.id).then((s) => {
                setSub(s);
                setLoading(false);
            });
        }
    }, [user]);

    if (loading) return <div className="p-12 text-center text-slate-400">Loading subscription...</div>;

    if (!sub) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">No Active Subscription</h2>
            <p className="text-slate-500 mb-8">You are currently on the pay-as-you-go plan.</p>
            <Link to="/mentee/subscriptions" className="px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700">
                Browse Plans
            </Link>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
             <h1 className="text-3xl font-bold text-slate-900">Active Subscription</h1>

             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                 <div className="bg-slate-900 p-8 text-white flex justify-between items-start">
                     <div>
                         <div className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-1">Plan</div>
                         <h2 className="text-3xl font-extrabold mb-4">{sub.planName}</h2>
                         <div className="flex items-center space-x-4 text-sm opacity-80">
                             <span className="flex items-center"><User size={16} className="mr-2"/> Mentor: {sub.mentorName}</span>
                             <span className="flex items-center"><Calendar size={16} className="mr-2"/> Expires: {new Date(sub.endDate).toLocaleDateString()}</span>
                         </div>
                     </div>
                     <div className="px-4 py-2 bg-brand-500 rounded-lg font-bold text-sm">ACTIVE</div>
                 </div>

                 <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div>
                         <h3 className="font-bold text-slate-900 mb-4">Usage Stats</h3>
                         <div className="space-y-4">
                             <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                 <span className="text-slate-500">Total Sessions</span>
                                 <span className="font-bold text-slate-900">{sub.totalSessions}</span>
                             </div>
                             <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                 <span className="text-slate-500">Remaining</span>
                                 <span className="font-bold text-brand-600">{sub.remainingSessions}</span>
                             </div>
                             <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
                                 <div 
                                    className="h-full bg-brand-500" 
                                    style={{ width: `${((sub.totalSessions - sub.remainingSessions) / sub.totalSessions) * 100}%` }} 
                                />
                             </div>
                         </div>
                     </div>

                     <QuotaBadge sub={sub} />
                 </div>
                 
                 <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                     <Link to="/mentee/bookings" className="text-brand-600 font-bold text-sm flex items-center hover:underline">
                         View Schedule <ArrowRight size={16} className="ml-1" />
                     </Link>
                 </div>
             </div>
        </div>
    );
}
