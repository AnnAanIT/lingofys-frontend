
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { SubscriptionPlan, Mentor } from '../types';
import { CalendarSlotPicker } from '../components/CalendarSlotPicker';
import { useApp } from '../App';
import { translations } from '../lib/i18n';
import { ArrowLeft, Check, User as UserIcon, Calendar, CreditCard, AlertCircle, Clock, ChevronRight, Sparkles } from 'lucide-react';

export default function MenteeSubscriptionDetail() {
    const { planId } = useParams();
    const navigate = useNavigate();
    const { user, refreshUser, language } = useApp();
    const t = translations[language].mentee.subscriptionDetail;
    const commonT = translations[language].common;
    
    const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
    const [step, setStep] = useState(1);
    const [mentors, setMentors] = useState<Mentor[]>([]);
    
    const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);
    const [selectedSlots, setSelectedSlots] = useState<{ day: string, time: string }[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (planId) {
            api.getSubscriptionPlans().then(plans => setPlan(plans.find(p => p.id === planId) || null));
        }
        api.getMentors().then(setMentors);
    }, [planId]);

    const calculateProjectedDates = (dayName: string) => {
        const dayMap: Record<string, number> = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
        const targetDay = dayMap[dayName];
        const dates: Date[] = [];
        const start = new Date();
        let current = new Date(start);
        current.setDate(start.getDate() + (targetDay + 7 - start.getDay()) % 7);
        for(let i=0; i<4; i++) {
            const d = new Date(current);
            d.setDate(current.getDate() + (i * 7));
            dates.push(d);
        }
        return dates;
    };

    if (!plan) return <div className="p-12 text-center text-slate-400">{commonT.loading}</div>;

    const selectedMentor = mentors.find(m => m.id === selectedMentorId);
    const weeklySlotsRequired = Math.ceil(plan.sessions / 4);

    const handleConfirm = async () => {
        if (!user || !selectedMentorId) return;
        setIsProcessing(true);
        try {
            await api.createSubscription(user.id, plan.id, selectedMentorId, selectedSlots);
            await refreshUser();
            navigate('/mentee/subscriptions/active');
        } catch (error: any) {
            alert("Failed to subscribe: " + error);
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-20">
             <button onClick={() => navigate('/mentee/subscriptions')} className="flex items-center text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors group">
                <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" /> {t.backToList}
            </button>

            <div className="max-w-2xl mx-auto flex justify-between items-center relative px-4">
                <div className="absolute top-5 left-10 right-10 h-0.5 bg-slate-100 -z-10">
                    <div className="h-full bg-brand-600 transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
                </div>
                {[
                    { s: 1, l: t.stepMentor },
                    { s: 2, l: t.stepSchedule },
                    { s: 3, l: t.stepConfirm }
                ].map(item => (
                    <div key={item.s} className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 ${
                            step >= item.s ? 'bg-brand-600 text-white shadow-lg shadow-brand-200' : 'bg-white border-2 border-slate-100 text-slate-300'
                        }`}>
                            {step > item.s ? <Check size={20} /> : item.s}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest mt-2 ${step >= item.s ? 'text-brand-600' : 'text-slate-400'}`}>
                            {item.l}
                        </span>
                    </div>
                ))}
            </div>

            {step === 1 && (
                <div className="space-y-8 animate-slide-up">
                    <div className="text-center">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t.mentorTitle}</h2>
                        <p className="text-slate-500 mt-2">{t.mentorSubtitle}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mentors.map(m => (
                            <div 
                                key={m.id} onClick={() => setSelectedMentorId(m.id)}
                                className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-4 ${
                                    selectedMentorId === m.id ? 'border-brand-600 bg-brand-50 shadow-xl scale-[1.02]' : 'border-slate-100 hover:border-slate-200 bg-white'
                                }`}
                            >
                                <div className="relative">
                                    <img src={m.avatar} className="w-20 h-20 rounded-2xl bg-slate-200 object-cover shadow-sm" />
                                    {selectedMentorId === m.id && (
                                        <div className="absolute -top-2 -right-2 bg-brand-600 text-white p-1 rounded-full border-4 border-brand-50">
                                            <Check size={14} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="font-black text-slate-900 text-lg">{m.name}</div>
                                    <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-1">{m.specialties.join(' • ')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center pt-6">
                        <button 
                            disabled={!selectedMentorId}
                            onClick={() => setStep(2)}
                            className="px-12 py-4 bg-slate-900 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl flex items-center gap-2 group"
                        >
                            {commonT.next}: {t.stepSchedule} <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && selectedMentor && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-slide-up">
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t.scheduleTitle}</h2>
                            <p className="text-slate-500 text-sm mt-1">{t.scheduleSubtitle}</p>
                        </div>
                        <CalendarSlotPicker availability={selectedMentor.availability} requiredSlots={weeklySlotsRequired} onSlotsChange={setSelectedSlots} />
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl sticky top-8">
                            <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                <Sparkles size={14} className="text-brand-400" /> {t.projectedSchedule}
                            </h3>
                            <div className="space-y-6">
                                {selectedSlots.length === 0 ? (
                                    <div className="py-10 text-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-600">
                                        <Clock size={32} className="mx-auto mb-2 opacity-20" />
                                        <p className="text-xs font-bold uppercase tracking-tight">{t.noSlots}</p>
                                    </div>
                                ) : (
                                    selectedSlots.map((slot, idx) => (
                                        <div key={idx} className="space-y-3">
                                            <div className="flex justify-between items-center bg-slate-800/50 px-3 py-2 rounded-xl border border-slate-700">
                                                <span className="text-xs font-black uppercase text-brand-400">{slot.day} - {slot.time}</span>
                                                <span className="text-[10px] font-bold text-slate-500">{t.recurring}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 pl-2 border-l border-brand-900">
                                                {calculateProjectedDates(slot.day).map((date, dIdx) => (
                                                    <div key={dIdx} className="text-[10px] font-bold text-slate-500 flex items-center gap-2">
                                                        <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                                                        {date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit' })}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <button 
                                disabled={selectedSlots.length !== weeklySlotsRequired}
                                onClick={() => setStep(3)}
                                className="w-full mt-10 py-4 bg-brand-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-brand-500 transition-all shadow-xl disabled:opacity-30 disabled:grayscale"
                            >
                                {t.nextStep}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step === 3 && selectedMentor && (
                <div className="max-w-2xl mx-auto animate-slide-up">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                        <div className="bg-slate-50 p-8 border-b border-slate-100 text-center">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{t.summaryTitle}</h2>
                            <p className="text-slate-500 text-sm font-medium mt-1">{t.summarySubtitle}</p>
                        </div>
                        <div className="p-10 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">{t.planLabel}</label>
                                        <div className="p-4 bg-brand-50 rounded-2xl border border-brand-100">
                                            <div className="font-black text-brand-900">{plan.name}</div>
                                            <div className="text-xs text-brand-700 font-bold mt-1">{plan.sessions} {t.sessionsSuffix}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">{t.mentorLabel}</label>
                                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                                            <img src={selectedMentor.avatar} className="w-12 h-12 rounded-xl object-cover" />
                                            <div>
                                                <div className="font-black text-slate-900 text-sm">{selectedMentor.name}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">{t.roadmapLabel}</label>
                                    <div className="space-y-3 max-h-[180px] overflow-y-auto custom-scrollbar pr-2">
                                        {selectedSlots.flatMap(s => 
                                            calculateProjectedDates(s.day).map(date => ({ date, time: s.time }))
                                        ).sort((a,b) => a.date.getTime() - b.date.getTime()).map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-slate-50 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div>
                                                    <span className="font-bold text-slate-700">
                                                        {item.date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                                                    </span>
                                                </div>
                                                <span className="font-black text-slate-400 uppercase tracking-tighter">{item.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-950 rounded-3xl p-8 text-white flex flex-col sm:flex-row justify-between items-center gap-6">
                                <div>
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t.totalPrice}</div>
                                    <div className="text-4xl font-black">{plan.price} <span className="text-lg font-bold text-slate-600">Credits</span></div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{t.walletBalance}: {user?.credits} Cr</div>
                                    <button onClick={handleConfirm} disabled={(user?.credits || 0) < plan.price || isProcessing}
                                        className="px-10 py-4 bg-brand-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-brand-500 shadow-xl disabled:opacity-30 disabled:grayscale"
                                    >
                                        {isProcessing ? commonT.processing : t.confirmAndStart}
                                    </button>
                                </div>
                            </div>

                            {(user?.credits || 0) < plan.price && (
                                <div className="bg-red-50 text-red-700 p-5 rounded-2xl flex items-start gap-4 border border-red-100">
                                    <AlertCircle className="shrink-0" size={24} />
                                    <div className="text-sm">
                                        <p className="font-black uppercase text-[10px] tracking-widest mb-1">{t.insufficientTitle}</p>
                                        <p className="font-medium">{t.insufficientDesc.replace('{needed}', (plan.price - (user?.credits || 0)).toString())}</p>
                                        <button onClick={() => navigate('/mentee/wallet')} className="mt-3 text-xs font-black underline uppercase tracking-widest">{t.topUpNow}</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
