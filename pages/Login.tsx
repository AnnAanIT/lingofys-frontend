
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { UserRole } from '../types';
import { api } from '../services/api';
import { translations } from '../lib/i18n';
import { 
  Users, GraduationCap, Building2, ShieldCheck, 
  Mail, Lock, User as UserIcon, ArrowRight, CheckCircle, 
  AlertCircle, Loader2, ChevronLeft, ShieldAlert, RefreshCcw, BookOpen
} from 'lucide-react';

type Mode = 'LOGIN' | 'REGISTER' | 'ROLE_SELECT';

const QUICK_ACCOUNTS = [
  { id: 'admin_1', name: 'George Boss', role: UserRole.ADMIN, avatar: 'https://ui-avatars.com/api/?name=George+Boss&background=0D8ABC&color=fff' },
  { id: 'admin_2', name: 'Hannah Root', role: UserRole.ADMIN, avatar: 'https://ui-avatars.com/api/?name=Hannah+Root&background=6b46c1&color=fff' },
  { id: 'mentor_1', name: 'Charlie Davis', role: UserRole.MENTOR, avatar: 'https://ui-avatars.com/api/?name=Charlie+Davis&background=48bb78&color=fff' },
  { id: 'mentor_2', name: 'Diana Prince', role: UserRole.MENTOR, avatar: 'https://ui-avatars.com/api/?name=Diana+Prince&background=f6e05e&color=000' },
  { id: 'provider_1', name: 'Evan Wright', role: UserRole.PROVIDER, avatar: 'https://ui-avatars.com/api/?name=Evan+Wright&background=ed8936&color=fff' },
  { id: 'provider_2', name: 'Fiona Gale', role: UserRole.PROVIDER, avatar: 'https://ui-avatars.com/api/?name=Fiona+Gale&background=4299e1&color=fff' },
  { id: 'mentee_1', name: 'Alice Johnson', role: UserRole.MENTEE, avatar: 'https://ui-avatars.com/api/?name=Alice+Johnson&background=f687b3&color=fff' },
  { id: 'mentee_2', name: 'Bob Smith', role: UserRole.MENTEE, avatar: 'https://ui-avatars.com/api/?name=Bob+Smith&background=a0aec0&color=fff' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login: setAppStateUser, isLoading: appLoading } = useApp();
  const t = translations['en']; // Always use English for Login page
  const [mode, setMode] = useState<Mode>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.MENTEE as UserRole
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await api.login(formData.email, formData.password);
      await setAppStateUser(user);

      // ✅ FIX: Navigate to appropriate dashboard after successful login
      if (user.role === UserRole.MENTEE) {
        navigate('/mentee');
      } else if (user.role === UserRole.MENTOR) {
        navigate('/mentor');
      } else if (user.role === UserRole.PROVIDER) {
        navigate('/provider');
      } else if (user.role === UserRole.ADMIN) {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      // ✅ Display all error messages from api.login (including status checks)
      setError(err.message || t.auth.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.register(formData);

      // ✅ Different success messages based on role
      if (formData.role === UserRole.MENTOR || formData.role === UserRole.PROVIDER) {
        setSuccess(`Registration successful! Your ${formData.role} account is pending admin approval. You will receive an email notification once approved.`);
        setTimeout(() => {
          setMode('LOGIN');
          setSuccess(null);
        }, 4000); // Longer timeout for longer message
      } else {
        setSuccess(t.auth.registerSuccess);
        setTimeout(() => {
          setMode('LOGIN');
          setSuccess(null);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const quickLoginById = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const user = await api.loginById(userId);
      await setAppStateUser(user);

      // ✅ FIX: Navigate to appropriate dashboard after quick login
      if (user.role === UserRole.MENTEE) {
        navigate('/mentee');
      } else if (user.role === UserRole.MENTOR) {
        navigate('/mentor');
      } else if (user.role === UserRole.PROVIDER) {
        navigate('/provider');
      } else if (user.role === UserRole.ADMIN) {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError("Mock account not found.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm(t.auth.resetConfirm)) {
        api.resetDatabase();
    }
  };

  if (appLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-brand-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="flex items-center space-x-3 mb-10">
        <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-brand-500/20">M</div>
        <span className="font-black text-slate-900 text-3xl tracking-tight">Mentorship.io</span>
      </div>

      <div className="max-w-4xl w-full flex flex-col md:flex-row gap-8 items-stretch">
        <div className="flex-1 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100 animate-fade-in">
          <div className="flex border-b border-slate-50">
            <button 
              onClick={() => { setMode('LOGIN'); setError(null); }}
              className={`flex-1 py-6 font-black uppercase text-xs tracking-widest transition-all ${mode === 'LOGIN' ? 'text-brand-600 border-b-2 border-brand-600 bg-white' : 'text-slate-400 hover:text-slate-600 bg-slate-50/50'}`}
            >
              {t.auth.login}
            </button>
            <button 
              onClick={() => { setMode('REGISTER'); setError(null); }}
              className={`flex-1 py-6 font-black uppercase text-xs tracking-widest transition-all ${mode === 'REGISTER' || mode === 'ROLE_SELECT' ? 'text-brand-600 border-b-2 border-brand-600 bg-white' : 'text-slate-400 hover:text-slate-600 bg-slate-50/50'}`}
            >
              {t.auth.register}
            </button>
          </div>

          <div className="p-10">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl animate-slide-up">
                <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
                <button onClick={handleResetData} className="mt-3 text-xs font-black uppercase tracking-widest text-red-600 flex items-center gap-1 hover:underline">
                    <RefreshCcw size={12} /> {t.auth.resetData}
                </button>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-start gap-3 animate-slide-up">
                <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-green-700 font-medium">{success}</p>
              </div>
            )}

            {mode === 'LOGIN' && (
              <div className="space-y-5">
                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t.auth.emailLabel}</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                        <input 
                        type="email" name="email" required placeholder="name@company.com"
                        value={formData.email} onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all font-medium text-slate-800"
                        />
                    </div>
                    </div>

                    <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.auth.passwordLabel}</label>
                        <button type="button" className="text-[10px] font-black uppercase text-brand-600 hover:underline">{t.auth.forgotPassword}</button>
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                        <input 
                        type="password" name="password" required placeholder="••••••••"
                        value={formData.password} onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all font-medium text-slate-800"
                        />
                    </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 group">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : t.auth.enterSystem}
                    {!loading && <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />}
                    </button>
                </form>

                <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold"><span className="bg-white px-2 text-slate-300">{t.auth.newTeammate}</span></div>
                </div>

                <button 
                    onClick={() => navigate('/readme')}
                    className="w-full py-3 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl font-bold text-xs hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-2"
                >
                    <BookOpen size={16} /> {t.auth.readme}
                </button>
              </div>
            )}

            {mode === 'REGISTER' && (
              <form onSubmit={(e) => { e.preventDefault(); setMode('ROLE_SELECT'); }} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t.auth.fullNameLabel}</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                    <input 
                      type="text" name="name" required placeholder="John Doe"
                      value={formData.name} onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t.auth.emailLabel}</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                    <input 
                      type="email" name="email" required placeholder="name@email.com"
                      value={formData.email} onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t.auth.passwordLabel}</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                    <input 
                      type="password" name="password" required placeholder="••••••••"
                      value={formData.password} onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all font-medium text-slate-800"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-brand-500 transition-all shadow-xl flex items-center justify-center gap-2 group">
                  {t.common.next} <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                </button>
              </form>
            )}

            {mode === 'ROLE_SELECT' && (
              <div className="space-y-6 animate-slide-up">
                <button onClick={() => setMode('REGISTER')} className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 mb-2">
                  <ChevronLeft size={16} /> {t.common.back}
                </button>

                <div className="text-center mb-8">
                  <h3 className="text-xl font-black text-slate-900 mb-2">{t.auth.chooseRole}</h3>
                </div>

                <div className="space-y-3">
                  {[
                    { id: UserRole.MENTEE, label: t.auth.menteeRole, icon: GraduationCap, color: 'bg-blue-50 text-blue-600 border-blue-100' },
                    { id: UserRole.MENTOR, label: t.auth.mentorRole, icon: Users, color: 'bg-purple-50 text-purple-600 border-purple-100' },
                    { id: UserRole.PROVIDER, label: t.auth.providerRole, icon: Building2, color: 'bg-orange-50 text-orange-600 border-orange-100' },
                  ].map((role) => (
                    <button 
                      key={role.id} onClick={() => setFormData({ ...formData, role: role.id })}
                      className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all ${formData.role === role.id ? 'border-brand-600 bg-brand-50 shadow-lg' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role.color}`}><role.icon size={24} /></div>
                      <div className="flex-1"><div className="font-black text-slate-900">{role.label}</div></div>
                      {formData.role === role.id && <CheckCircle className="text-brand-600" size={24} />}
                    </button>
                  ))}
                </div>

                <button onClick={handleRegister} disabled={loading} className="w-full mt-6 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 group">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : t.auth.completeRegister}
                  {!loading && <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="md:w-80 bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl flex flex-col animate-fade-in overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldAlert size={120} /></div>
          <div className="relative z-10 mb-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">{t.auth.quickAccess}</h3>
            <h2 className="text-2xl font-black">{t.auth.quickAccessTitle}</h2>
          </div>

          <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2 space-y-6">
            <div>
              <div className="text-[10px] font-black uppercase text-slate-600 mb-3 tracking-widest border-b border-slate-800 pb-1">{t.auth.administrators}</div>
              <div className="grid grid-cols-1 gap-2">
                {QUICK_ACCOUNTS.filter(a => a.role === UserRole.ADMIN).map(acc => (
                  <button key={acc.id} onClick={() => quickLoginById(acc.id)} className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-all text-left border border-slate-800/50">
                    <img src={acc.avatar} className="w-8 h-8 rounded-lg" alt="" />
                    <div className="min-w-0">
                      <div className="text-xs font-black truncate">{acc.name}</div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{t.auth.adminLabel}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {/* Mentor, Provider, Mentee simplified... */}
            <div>
              <div className="text-[10px] font-black uppercase text-slate-600 mb-3 tracking-widest border-b border-slate-800 pb-1">{t.auth.otherRoles}</div>
              <div className="grid grid-cols-1 gap-2">
                {QUICK_ACCOUNTS.filter(a => a.role !== UserRole.ADMIN).slice(0, 3).map(acc => (
                  <button key={acc.id} onClick={() => quickLoginById(acc.id)} className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/20 hover:bg-slate-800 transition-all text-left border border-slate-800/30">
                    <img src={acc.avatar} className="w-8 h-8 rounded-lg" alt="" />
                    <div className="min-w-0">
                      <div className="text-xs font-black truncate">{acc.name}</div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{acc.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col gap-3">
            <button onClick={handleResetData} className="w-full py-2 border border-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all flex items-center justify-center gap-2">
                <RefreshCcw size={12} /> {t.auth.resetData}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
