
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Book, Zap, CreditCard, Users, 
  Scale, Target, Calendar, RefreshCcw, DollarSign, 
  Activity, Info, LayoutDashboard, Search, Wallet, 
  Award, Settings, MessageSquare, ShieldCheck, 
  BarChart3, Component, ShieldAlert, FileText, TrendingUp,
  ChevronRight, PlayCircle, Layers, Fingerprint, Globe,
  Shield, CheckCircle, Database, Calculator, Workflow, Clock
} from 'lucide-react';

export default function Readme() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-brand-100 selection:text-brand-900 pb-20">
            {/* Header Section */}
            <div className="bg-white border-b border-slate-200 py-16">
                <div className="max-w-6xl mx-auto px-6">
                    <button onClick={() => navigate('/login')} className="flex items-center text-slate-400 hover:text-slate-900 font-bold text-sm mb-8 transition-all group">
                        <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Application
                    </button>
                    <div className="flex items-center gap-5 mb-6">
                        <div className="w-16 h-16 bg-brand-600 rounded-3xl flex items-center justify-center text-white shadow-2xl rotate-3">
                            <Book size={32} />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black tracking-tight text-slate-900">Platform Manifesto</h1>
                            <p className="text-xl text-slate-500 font-medium mt-2 text-balance max-w-2xl">The ultimate technical reference for logic engines, economic flows, and administrative protocols.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 pt-16 space-y-32">
                
                {/* 0. SETUP FLOW: THE ADMIN JOURNEY */}
                <section className="space-y-12">
                    <div className="flex items-center gap-3 text-brand-600 border-b border-brand-100 pb-4">
                        <Workflow size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-tight">01. Chronological Setup Flow</h2>
                    </div>

                    <div className="relative">
                        <div className="absolute left-8 top-0 bottom-0 w-1 bg-slate-100 hidden md:block"></div>
                        
                        <div className="space-y-12 relative">
                            {/* Step 1 */}
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-lg z-10 font-black italic">01</div>
                                <div className="flex-1 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                                    <h3 className="text-xl font-bold mb-2">Define Economic Baseline</h3>
                                    <p className="text-slate-500 text-sm mb-4">Go to <span className="font-bold text-slate-800">Admin > Pricing Config</span>. Set the <code>topupConversionRatio</code>. This determines how many Credits $1 USD buys. Setting it to <strong>0.8</strong> means $1 buys 0.8 Credits (effectively costing the user $1.25 per credit).</p>
                                    <div className="flex gap-2">
                                        <span className="px-2 py-1 bg-slate-100 text-[10px] font-black rounded uppercase text-slate-500">Config: SystemSettings</span>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-lg z-10 font-black italic">02</div>
                                <div className="flex-1 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                                    <h3 className="text-xl font-bold mb-2">Build Geographic Fairness Matrix</h3>
                                    <p className="text-slate-500 text-sm mb-4">Add <span className="font-bold text-slate-800">Country Multipliers</span>. Adjust rates for students in different regions. 
                                    (e.g., Vietnam: 0.9 for accessibility, Japan: 1.2 for higher purchasing power).</p>
                                    <div className="flex gap-2">
                                        <span className="px-2 py-1 bg-slate-100 text-[10px] font-black rounded uppercase text-slate-500">Config: PricingCountry</span>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-lg z-10 font-black italic">03</div>
                                <div className="flex-1 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                                    <h3 className="text-xl font-bold mb-2">Establish Expert Tiers</h3>
                                    <p className="text-slate-500 text-sm mb-4">Create <span className="font-bold text-slate-800">Mentor Groups</span> (Standard, Native, VIP). Each group has a multiplier applied to the base lesson price. This automates premium pricing for top experts.</p>
                                    <div className="flex gap-2">
                                        <span className="px-2 py-1 bg-slate-100 text-[10px] font-black rounded uppercase text-slate-500">Config: PricingGroup</span>
                                    </div>
                                </div>
                            </div>

                            {/* Step 4 */}
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-lg z-10 font-black italic">04</div>
                                <div className="flex-1 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                                    <h3 className="text-xl font-bold mb-2">Initialize Subscriptions</h3>
                                    <p className="text-slate-500 text-sm mb-4">Define <span className="font-bold text-slate-800">Subscription Plans</span>. Set session counts (e.g., 4 or 8) and strict rescheduling/cancellation quotas to ensure student commitment.</p>
                                    <div className="flex gap-2">
                                        <span className="px-2 py-1 bg-slate-100 text-[10px] font-black rounded uppercase text-slate-500">Config: SubscriptionPlan</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 1. THE MATHEMATICAL ENGINE */}
                <section className="space-y-8">
                    <div className="flex items-center gap-3 text-brand-600 border-b border-brand-100 pb-4">
                        <Calculator size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-tight">02. The Mathematical Core</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-12">
                        {/* Dynamic Rate Formula */}
                        <div className="p-10 bg-slate-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><Database size={200} /></div>
                            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                                <Zap className="text-brand-400" /> 1. Atomic Lesson Pricing Formula
                            </h3>
                            
                            <div className="bg-slate-800 p-8 rounded-3xl font-mono text-2xl border border-slate-700 text-center mb-10 shadow-inner">
                                <span className="text-slate-400 block text-xs mb-4 uppercase tracking-widest font-sans">Calculating Credit Cost for Mentee</span>
                                Rate = <span className="text-brand-400">BasePrice</span> × <span className="text-blue-400">CountryMult</span> × <span className="text-purple-400">TierMult</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-2">
                                    <div className="text-brand-400 font-black uppercase text-[10px] tracking-tighter">BasePrice</div>
                                    <p className="text-xs text-slate-400">The floor cost of a lesson (e.g., 10 Cr). Set globally by Admin.</p>
                                </div>
                                <div className="space-y-2 border-l border-slate-800 pl-8">
                                    <div className="text-blue-400 font-black uppercase text-[10px] tracking-tighter">CountryMult</div>
                                    <p className="text-xs text-slate-400">Adjusts for student's locale purchasing power (0.5 to 2.0).</p>
                                </div>
                                <div className="space-y-2 border-l border-slate-800 pl-8">
                                    <div className="text-purple-400 font-black uppercase text-[10px] tracking-tighter">TierMult</div>
                                    <p className="text-xs text-slate-400">Expertise premium (Native speakers get a multiplier boost).</p>
                                </div>
                            </div>
                        </div>

                        {/* Revenue Spread */}
                        <div className="p-10 bg-white rounded-[3rem] border border-slate-200 shadow-sm">
                            <h3 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-3">
                                <DollarSign className="text-brand-600" /> 2. Economic Spread (Profitability)
                            </h3>
                            <p className="text-slate-600 mb-8 leading-relaxed">
                                Revenue is realized at the point of <span className="font-bold text-slate-900">Inflow</span>. The system maintains a spread between the price a user pays for a credit and the value at which a mentor withdraws it.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">User Top-up (Revenue In)</h4>
                                        <div className="text-3xl font-mono font-black text-slate-900">$1.00 USD &rarr; 0.8 Credits</div>
                                        <div className="text-xs text-slate-500 mt-2 italic">* Real cost per credit: $1.25 USD</div>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">Mentor Payout (Cost Out)</h4>
                                        <div className="text-3xl font-mono font-black text-slate-900">1 Credit &rarr; $1.00 USD</div>
                                        <div className="text-xs text-slate-500 mt-2 italic">* Fixed 1:1 payout ratio</div>
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center bg-brand-50 p-8 rounded-[2rem] border border-brand-100">
                                    <div className="text-4xl font-black text-brand-600 mb-2">20% Margin</div>
                                    <p className="text-sm text-brand-900/70 font-medium">The system retains $0.25 on every credit flowing through the economy. This covers affiliate commissions and platform overhead.</p>
                                </div>
                            </div>
                        </div>

                        {/* Escrow State Machine */}
                        <div className="p-10 bg-white rounded-[3rem] border border-slate-200 shadow-sm">
                            <h3 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-3">
                                <Workflow className="text-brand-600" /> 3. The Escrow State Machine
                            </h3>
                            <div className="flex flex-col md:flex-row items-stretch gap-6">
                                <div className="flex-1 p-6 bg-yellow-50 rounded-2xl border border-yellow-100">
                                    {/* Fix: Added missing 'Clock' import above to fix 'Cannot find name Clock' error */}
                                    <div className="flex items-center gap-2 mb-2 font-black text-yellow-700 text-sm uppercase"><Clock size={16}/> Phase 1: Holding</div>
                                    <p className="text-xs text-yellow-800/70">Credits deducted from Mentee and moved to <code>system_holding</code>. Liability is established.</p>
                                </div>
                                <div className="flex items-center justify-center text-slate-300 hidden md:flex"><ChevronRight size={32}/></div>
                                <div className="flex-1 p-6 bg-green-50 rounded-2xl border border-green-100">
                                    <div className="flex items-center gap-2 mb-2 font-black text-green-700 text-sm uppercase"><CheckCircle size={16}/> Phase 2: Released</div>
                                    <p className="text-xs text-green-800/70">Upon lesson completion, credits move to Mentor wallet. Funds are now "Payable".</p>
                                </div>
                                <div className="flex items-center justify-center text-slate-300 hidden md:flex"><ChevronRight size={32}/></div>
                                <div className="flex-1 p-6 bg-red-50 rounded-2xl border border-red-100">
                                    <div className="flex items-center gap-2 mb-2 font-black text-red-700 text-sm uppercase"><RefreshCcw size={16}/> Option: Returned</div>
                                    <p className="text-xs text-red-800/70">If cancelled/refunded, credits return to Mentee. System liability cleared.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. ADMIN COMMANDS DEEP DIVE */}
                <section className="space-y-12">
                    <div className="flex items-center gap-3 text-brand-600 border-b border-brand-100 pb-4">
                        <ShieldCheck size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-tight">03. Administrator Capabilities</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Solvency Buffer */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                            <Scale className="absolute -right-6 -top-6 text-slate-100" size={120} />
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Financial Solvency Index</h3>
                            <p className="text-sm text-slate-500 leading-relaxed mb-6">Critical auditor screen that ensures the bank (System) has enough real USD to fulfill all potential credit-to-USD withdrawals.</p>
                            <div className="p-4 bg-slate-50 rounded-xl font-mono text-[10px] space-y-1">
                                <div className="flex justify-between"><span>Assets (Cash In)</span> <span className="text-green-600">+ $5,400.00</span></div>
                                <div className="flex justify-between"><span>Liabilities (Circulating Credits)</span> <span className="text-red-600">- $4,120.00</span></div>
                                <div className="border-t border-slate-200 mt-1 pt-1 flex justify-between font-bold"><span>Net Buffer</span> <span className="text-brand-600">$1,280.00</span></div>
                            </div>
                        </div>

                        {/* God-Mode Overrides */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">"God-Mode" User Control</h3>
                            <ul className="space-y-3 text-xs text-slate-600 font-medium">
                                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-brand-500 rounded-full"></div> <strong>Manual Ledger Adjustment:</strong> Correct user balances with audit note.</li>
                                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-brand-500 rounded-full"></div> <strong>Geographic Overrides:</strong> Change a user's billing region manually.</li>
                                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-brand-500 rounded-full"></div> <strong>Tier Re-assignment:</strong> Promote/Demote mentors across groups.</li>
                            </ul>
                        </div>

                        {/* Support ownership */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><MessageSquare className="text-brand-500"/> Support Orchestration</h3>
                            <p className="text-sm text-slate-500 mb-4">Admin inbox uses a <strong>Multi-Tenant Queue</strong>. Admins can "Claim Ownership" of a conversation to ensure consistent 1-to-1 support without duplicate replies.</p>
                            <span className="px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-[10px] font-black uppercase">Shared Workspace</span>
                        </div>

                        {/* Audit Trail */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><Activity className="text-red-500"/> Forensics & Logs</h3>
                            <p className="text-sm text-slate-500 mb-4">Every mutation in the pricing model or user status generates a <strong>Permanent Audit Trail</strong>. This includes IP-equivalent identifiers and specific logic delta logs.</p>
                            <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">Immutable Trace</span>
                        </div>
                    </div>
                </section>

                {/* Technical Footnote */}
                <section className="bg-brand-600 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-20"><Fingerprint size={160} /></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1 space-y-6">
                            <h3 className="text-3xl font-black uppercase tracking-tight flex items-center gap-4">
                                <Shield size={36} /> Logic Integrity Guard
                            </h3>
                            <p className="text-lg text-brand-50 font-medium">All financial logic is separated from the UI into pure functions within the <code>/lib</code> directory. This ensures that the platform's math can be ported to a distributed backend without any visual regression.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                                    <div className="font-black text-xs uppercase mb-1">State Mgmt</div>
                                    <div className="text-sm opacity-80 italic">LocalStorage DB</div>
                                </div>
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                                    <div className="font-black text-xs uppercase mb-1">Math Logic</div>
                                    <div className="text-sm opacity-80 italic">TypeScript Engines</div>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate('/login')}
                            className="px-12 py-6 bg-slate-900 text-white font-black uppercase text-sm tracking-widest rounded-3xl hover:bg-slate-800 transition-all shadow-2xl active:scale-95 hover:-translate-y-1"
                        >
                            Enter Application
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
