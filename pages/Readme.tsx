
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, Book, Zap, Users, 
  Target, Calendar, MessageSquare, ShieldCheck, 
  ChevronRight, Globe,
  CheckCircle, Clock, Heart, Star, Video, CreditCard, Award, Languages
} from 'lucide-react';

export default function Readme() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const currentLanguage = i18n.language;

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-rose-50/20 to-sky-50/30 text-slate-900 selection:bg-brand-100 selection:text-brand-900 pb-20">
            {/* Header Section */}
            <div className="bg-white/70 backdrop-blur-sm border-b border-slate-200/50 py-16">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="flex items-center justify-between mb-8">
                        <button onClick={() => navigate('/login')} className="flex items-center text-slate-400 hover:text-slate-900 font-semibold text-sm transition-all group">
                            <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" /> {t('readme.backToLogin')}
                        </button>
                        
                        {/* Language Selector */}
                        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 p-1 shadow-sm">
                            <Languages size={16} className="text-slate-400 ml-2" />
                            <button 
                                onClick={() => changeLanguage('vi')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentLanguage === 'vi' ? 'bg-gradient-to-r from-amber-400 to-rose-400 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Tiếng Việt
                            </button>
                            <button 
                                onClick={() => changeLanguage('en')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentLanguage === 'en' ? 'bg-gradient-to-r from-amber-400 to-rose-400 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                English
                            </button>
                            <button 
                                onClick={() => changeLanguage('ja')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentLanguage === 'ja' ? 'bg-gradient-to-r from-amber-400 to-rose-400 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                日本語
                            </button>
                            <button 
                                onClick={() => changeLanguage('zh')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentLanguage === 'zh' ? 'bg-gradient-to-r from-amber-400 to-rose-400 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                中文
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-5 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-rose-400 rounded-3xl flex items-center justify-center text-white shadow-lg">
                            <Book size={32} />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black tracking-tight text-slate-900">{t('readme.title')}</h1>
                            <p className="text-xl text-slate-500 font-medium mt-2 text-balance max-w-2xl">{t('readme.subtitle')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 pt-16 space-y-20">
                
                {/* Intro Section */}
                <section className="space-y-6">
                    <div className="text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">{t('readme.intro.title')}</h2>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            {t('readme.intro.description')}
                        </p>
                    </div>
                </section>

                {/* How It Works */}
                <section className="space-y-12">
                    <div className="flex items-center gap-3 text-slate-900 border-b border-slate-200 pb-4">
                        <Target size={28} />
                        <h2 className="text-3xl font-bold">{t('readme.howItWorks.title')}</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-rose-400 text-white rounded-2xl flex items-center justify-center font-black text-2xl">1</div>
                            <h3 className="text-xl font-bold text-slate-900">{t('readme.howItWorks.step1.title')}</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {t('readme.howItWorks.step1.description')}
                            </p>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-gradient-to-br from-violet-400 to-rose-400 text-white rounded-2xl flex items-center justify-center font-black text-2xl">2</div>
                            <h3 className="text-xl font-bold text-slate-900">{t('readme.howItWorks.step2.title')}</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {t('readme.howItWorks.step2.description')}
                            </p>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-gradient-to-br from-sky-400 to-blue-400 text-white rounded-2xl flex items-center justify-center font-black text-2xl">3</div>
                            <h3 className="text-xl font-bold text-slate-900">{t('readme.howItWorks.step3.title')}</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {t('readme.howItWorks.step3.description')}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Features for Students */}
                <section className="space-y-12">
                    <div className="flex items-center gap-3 text-slate-900 border-b border-slate-200 pb-4">
                        <Users size={28} />
                        <h2 className="text-3xl font-bold">{t('readme.forStudents.title')}</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200">
                            <div className="shrink-0 w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                <Globe className="text-amber-600" size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-2">{t('readme.forStudents.globalTeachers.title')}</h3>
                                <p className="text-sm text-slate-600">{t('readme.forStudents.globalTeachers.description')}</p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200">
                            <div className="shrink-0 w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                                <Calendar className="text-rose-600" size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-2">{t('readme.forStudents.flexibleSchedule.title')}</h3>
                                <p className="text-sm text-slate-600">{t('readme.forStudents.flexibleSchedule.description')}</p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200">
                            <div className="shrink-0 w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                                <CreditCard className="text-violet-600" size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-2">{t('readme.forStudents.transparentPayment.title')}</h3>
                                <p className="text-sm text-slate-600">{t('readme.forStudents.transparentPayment.description')}</p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200">
                            <div className="shrink-0 w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                                <Video className="text-sky-600" size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-2">{t('readme.forStudents.oneOnOne.title')}</h3>
                                <p className="text-sm text-slate-600">{t('readme.forStudents.oneOnOne.description')}</p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200">
                            <div className="shrink-0 w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                <ShieldCheck className="text-green-600" size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-2">{t('readme.forStudents.protection.title')}</h3>
                                <p className="text-sm text-slate-600">{t('readme.forStudents.protection.description')}</p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200">
                            <div className="shrink-0 w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                <Star className="text-orange-600" size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-2">{t('readme.forStudents.reviews.title')}</h3>
                                <p className="text-sm text-slate-600">{t('readme.forStudents.reviews.description')}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features for Mentors */}
                <section className="space-y-12">
                    <div className="flex items-center gap-3 text-slate-900 border-b border-slate-200 pb-4">
                        <Award size={28} />
                        <h2 className="text-3xl font-bold">{t('readme.forTeachers.title')}</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200">
                            <div className="shrink-0 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Clock className="text-blue-600" size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-2">{t('readme.forTeachers.scheduleManagement.title')}</h3>
                                <p className="text-sm text-slate-600">{t('readme.forTeachers.scheduleManagement.description')}</p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200">
                            <div className="shrink-0 w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                <CreditCard className="text-purple-600" size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-2">{t('readme.forTeachers.transparentIncome.title')}</h3>
                                <p className="text-sm text-slate-600">{t('readme.forTeachers.transparentIncome.description')}</p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200">
                            <div className="shrink-0 w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                                <Users className="text-pink-600" size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-2">{t('readme.forTeachers.globalReach.title')}</h3>
                                <p className="text-sm text-slate-600">{t('readme.forTeachers.globalReach.description')}</p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200">
                            <div className="shrink-0 w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                                <MessageSquare className="text-teal-600" size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-2">{t('readme.forTeachers.support.title')}</h3>
                                <p className="text-sm text-slate-600">{t('readme.forTeachers.support.description')}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How Payment Works */}
                <section className="space-y-8">
                    <div className="flex items-center gap-3 text-slate-900 border-b border-slate-200 pb-4">
                        <CreditCard size={28} />
                        <h2 className="text-3xl font-bold">{t('readme.payment.title')}</h2>
                    </div>
                    
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-10 text-white shadow-xl">
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <Zap className="text-amber-400" /> {t('readme.payment.systemTitle')}
                        </h3>
                        <p className="text-slate-300 mb-8 text-lg leading-relaxed">
                            {t('readme.payment.systemDescription')}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                                <div className="text-amber-400 font-bold text-xs uppercase mb-3 tracking-widest">{t('readme.payment.step1.label')}</div>
                                <h4 className="font-bold mb-2">{t('readme.payment.step1.title')}</h4>
                                <p className="text-sm text-slate-400">{t('readme.payment.step1.description')}</p>
                            </div>
                            
                            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                                <div className="text-amber-400 font-bold text-xs uppercase mb-3 tracking-widest">{t('readme.payment.step2.label')}</div>
                                <h4 className="font-bold mb-2">{t('readme.payment.step2.title')}</h4>
                                <p className="text-sm text-slate-400">{t('readme.payment.step2.description')}</p>
                            </div>
                            
                            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                                <div className="text-amber-400 font-bold text-xs uppercase mb-3 tracking-widest">{t('readme.payment.step3.label')}</div>
                                <h4 className="font-bold mb-2">{t('readme.payment.step3.title')}</h4>
                                <p className="text-sm text-slate-400">{t('readme.payment.step3.description')}</p>
                            </div>
                        </div>

                        <div className="mt-8 p-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                            <div className="flex gap-3">
                                <ShieldCheck className="text-amber-400 shrink-0" size={24} />
                                <div>
                                    <h4 className="font-bold text-amber-400 mb-2">{t('readme.payment.protection.title')}</h4>
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        {t('readme.payment.protection.description')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Getting Started CTA */}
                <section className="space-y-8">
                    <div className="bg-gradient-to-br from-amber-50 to-rose-50 rounded-3xl p-12 text-center border border-amber-200">
                        <Heart className="w-16 h-16 text-rose-500 mx-auto mb-6" />
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">{t('readme.cta.title')}</h2>
                        <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
                            {t('readme.cta.description')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button 
                                onClick={() => navigate('/login')}
                                className="px-10 py-4 bg-gradient-to-r from-amber-400 to-rose-400 text-white font-bold rounded-2xl hover:shadow-lg transition-all active:scale-95 hover:-translate-y-0.5"
                            >
                                {t('readme.cta.studentButton')}
                            </button>
                            <button 
                                onClick={() => navigate('/login')}
                                className="px-10 py-4 bg-gradient-to-r from-violet-400 to-rose-400 text-white font-bold rounded-2xl hover:shadow-lg transition-all active:scale-95 hover:-translate-y-0.5"
                            >
                                {t('readme.cta.teacherButton')}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Support Section */}
                <section className="space-y-8 pb-10">
                    <div className="flex items-center gap-3 text-slate-900 border-b border-slate-200 pb-4">
                        <MessageSquare size={28} />
                        <h2 className="text-3xl font-bold">{t('readme.support.title')}</h2>
                    </div>
                    
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200">
                        <p className="text-slate-600 mb-4">
                            {t('readme.support.description')}
                        </p>
                        <div className="flex flex-col gap-3 text-sm">
                            <div className="flex items-center gap-3">
                                <CheckCircle size={16} className="text-green-600" />
                                <span className="text-slate-700"><strong>{t('readme.support.email')}</strong> {t('readme.support.emailValue')}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle size={16} className="text-green-600" />
                                <span className="text-slate-700"><strong>{t('readme.support.hours')}</strong> {t('readme.support.hoursValue')}</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
