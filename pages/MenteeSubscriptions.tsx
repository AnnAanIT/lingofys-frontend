
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { SubscriptionPlan, Subscription } from '../types';
import { SubscriptionPlanCard } from '../components/SubscriptionComponents';
import { useApp } from '../App';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Zap, Shield, Calendar, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { translations } from '../lib/i18n';

const BenefitItem = ({ icon: Icon, title, desc }: any) => (
    <div className="flex items-start space-x-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="p-2 bg-brand-50 text-brand-600 rounded-lg shrink-0">
            <Icon size={24} />
        </div>
        <div>
            <h4 className="font-bold text-slate-900">{title}</h4>
            <p className="text-sm text-slate-500 mt-1">{desc}</p>
        </div>
    </div>
);

const FAQItem = ({ q, a }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-slate-100 last:border-0">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center py-4 text-left font-medium text-slate-800 hover:text-brand-600 transition-colors"
            >
                {q}
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {isOpen && <p className="pb-4 text-sm text-slate-500 leading-relaxed">{a}</p>}
        </div>
    );
};

export default function MenteeSubscriptions() {
    const { user, language } = useApp();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [activeSub, setActiveSub] = useState<Subscription | null>(null);
    const navigate = useNavigate();
    const t = translations[language].mentee;

    useEffect(() => {
        api.getSubscriptionPlans().then(setPlans);
        if (user) {
            api.getActiveSubscription(user.id).then(setActiveSub);
        }
    }, [user]);

    return (
        <div className="space-y-12 animate-fade-in pb-20">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-bold uppercase tracking-wider">
                    {t.premiumLearning}
                </div>
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{t.upgradeTitle}</h1>
                <p className="text-slate-500 text-lg leading-relaxed">{t.upgradeDesc}</p>
            </div>

            {/* Active Sub Banner */}
            {activeSub && (
                <div className="max-w-4xl mx-auto bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-1 shadow-xl">
                    <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-green-500/20 text-green-400 rounded-full">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{t.activePlan.replace('{plan}', activeSub.planName)}</h3>
                                <p className="text-slate-400 text-sm">{t.validUntil} {new Date(activeSub.endDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate('/mentee/subscriptions/active')}
                            className="px-6 py-2 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition-colors shadow-lg"
                        >
                            {t.manageSubscription}
                        </button>
                    </div>
                </div>
            )}

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {plans.map(plan => (
                    <SubscriptionPlanCard 
                        key={plan.id} 
                        plan={plan} 
                        isActive={activeSub?.planId === plan.id}
                    />
                ))}
            </div>

            {/* Why Subscribe? */}
            <div className="max-w-6xl mx-auto">
                <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">{t.whySubscribe}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <BenefitItem
                        icon={Zap}
                        title={t.benefitTitle1}
                        desc={t.benefitDesc1}
                    />
                    <BenefitItem
                        icon={Shield}
                        title={t.benefitTitle2}
                        desc={t.benefitDesc2}
                    />
                    <BenefitItem
                        icon={Calendar}
                        title={t.benefitTitle3}
                        desc={t.benefitDesc3}
                    />
                </div>
            </div>

            {/* FAQ */}
            <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <HelpCircle className="text-slate-400" /> {t.faqTitle}
                </h3>
                <div className="space-y-1">
                    <FAQItem
                        q={t.faq1Question}
                        a={t.faq1Answer}
                    />
                    <FAQItem
                        q={t.faq2Question}
                        a={t.faq2Answer}
                    />
                    <FAQItem
                        q={t.faq3Question}
                        a={t.faq3Answer}
                    />
                </div>
            </div>
        </div>
    );
}
