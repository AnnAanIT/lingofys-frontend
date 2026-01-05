
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { UserRole } from '../types';
import { api } from '../services/api';
import { translations } from '../lib/i18n';
import { BRAND } from '../constants/brand';
import { 
  Users, GraduationCap, Building2, 
  Mail, Lock, User as UserIcon, ArrowRight, CheckCircle, 
  AlertCircle, Loader2, ChevronLeft, BookOpen, Globe
} from 'lucide-react';

type Mode = 'LOGIN' | 'REGISTER' | 'ROLE_SELECT';

interface PricingCountry {
  id: string;
  code: string;
  name: string;
  multiplier: number;
  currency: string;
  timezone: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { login: setAppStateUser, isLoading: appLoading } = useApp();
  const t = translations['en']; // Always use English for Login page
  const [mode, setMode] = useState<Mode>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // ✅ NEW: Country selection state
  const [countries, setCountries] = useState<PricingCountry[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.MENTEE as UserRole,
    country: '',  // ✅ NEW: Required field
    referralCode: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  // ✅ NEW: Fetch countries from API when entering registration mode
  useEffect(() => {
    if (mode === 'REGISTER' || mode === 'ROLE_SELECT') {
      loadCountries();
    }
  }, [mode]);

  const loadCountries = async () => {
    setLoadingCountries(true);
    try {
      const data = await api.getPricingCountries();
      setCountries(data);
    } catch (err) {
      console.error('Failed to load countries:', err);
      // Use fallback countries if API fails
      setCountries([
        { id: 'VN', code: 'VN', name: 'Vietnam', multiplier: 0.4, currency: 'VND', timezone: 'Asia/Ho_Chi_Minh' },
        { id: 'PH', code: 'PH', name: 'Philippines', multiplier: 0.35, currency: 'PHP', timezone: 'Asia/Manila' },
        { id: 'US', code: 'US', name: 'United States', multiplier: 1.0, currency: 'USD', timezone: 'America/New_York' },
      ]);
    } finally {
      setLoadingCountries(false);
    }
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
    
    // ✅ Validate country is selected
    if (!formData.country) {
      setError('Please select your country');
      setLoading(false);
      return;
    }
    
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



  if (appLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-brand-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-rose-50/20 to-sky-50/30 flex flex-col items-center justify-center p-4 md:p-8">
      {/* Logo Header */}
      <div className="mb-12 animate-[pop-in_0.6s_ease-out] text-center">
        <img 
          src={BRAND.logo.fullLogo} 
          alt={BRAND.logo.alt}
          className="h-24 md:h-32 w-auto mx-auto drop-shadow-lg hover:scale-105 transition-transform duration-300"
        />
        <p className="text-center text-base text-slate-500 mt-4 font-medium tracking-wide">{BRAND.tagline}</p>
      </div>

      <div className="max-w-md w-full">
        <div className="bg-white rounded-[2.5rem] shadow-lg shadow-slate-200/40 overflow-hidden border border-slate-100/50 animate-fade-in">
          <div className="flex border-b border-slate-50">
            <button 
              onClick={() => { setMode('LOGIN'); setError(null); }}
              className={`flex-1 py-6 font-bold uppercase text-xs tracking-wide transition-all ${mode === 'LOGIN' ? 'text-amber-600 border-b-2 border-amber-400 bg-gradient-to-b from-amber-50/40 to-white' : 'text-slate-400 hover:text-slate-600 bg-transparent'}`}
            >
              {t.auth.login}
            </button>
            <button 
              onClick={() => { setMode('REGISTER'); setError(null); }}
              className={`flex-1 py-6 font-bold uppercase text-xs tracking-wide transition-all ${mode === 'REGISTER' || mode === 'ROLE_SELECT' ? 'text-violet-500 border-b-2 border-violet-400 bg-gradient-to-b from-violet-50/40 to-white' : 'text-slate-400 hover:text-slate-600 bg-transparent'}`}
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
                    <label className="text-xs font-semibold tracking-wide text-slate-500 ml-1">{t.auth.emailLabel}</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-amber-500 transition-all duration-200" size={20} />
                        <input
                        type="email" name="email" required placeholder="name@company.com"
                        value={formData.email} onChange={handleChange}
                        autoComplete="email"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50/40 border border-slate-200/50 rounded-2xl focus:ring-2 focus:ring-amber-300/20 focus:border-amber-300 outline-none transition-all duration-200 font-normal text-slate-800"
                        />
                    </div>
                    </div>

                    <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-semibold tracking-wide text-slate-500">{t.auth.passwordLabel}</label>
                        <button type="button" className="text-xs font-semibold text-violet-500 hover:text-violet-600 hover:underline transition-colors">{t.auth.forgotPassword}</button>
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-amber-500 transition-all duration-200" size={20} />
                        <input
                        type="password" name="password" required placeholder="••••••••"
                        value={formData.password} onChange={handleChange}
                        autoComplete="current-password"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50/40 border border-slate-200/50 rounded-2xl focus:ring-2 focus:ring-amber-300/20 focus:border-amber-300 outline-none transition-all duration-200 font-normal text-slate-800"
                        />
                    </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-5 bg-gradient-to-r from-amber-400 to-rose-400 text-white rounded-2xl font-bold text-sm tracking-wide hover:from-amber-500 hover:to-rose-500 hover:shadow-lg transition-all duration-200 shadow-md flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed group">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : t.auth.enterSystem}
                    {!loading && <ArrowRight className="group-hover:translate-x-1 transition-transform duration-200" size={18} />}
                    </button>
                </form>

                <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold"><span className="bg-white px-2 text-slate-300">{t.auth.newTeammate}</span></div>
                </div>

                <button 
                    onClick={() => navigate('/readme')}
                    className="w-full py-4 bg-slate-50 border border-slate-200/50 text-slate-600 rounded-2xl font-semibold text-sm hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 flex items-center justify-center gap-2"
                >
                    <BookOpen size={16} /> {t.auth.readme}
                </button>
              </div>
            )}

            {mode === 'REGISTER' && (
              <div className="space-y-6 animate-slide-up">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-black text-slate-900 mb-2">{t.auth.chooseRole}</h3>
                  <p className="text-sm text-slate-500">Select your role to get started</p>
                </div>

                <div className="space-y-4">
                  {[
                    { id: UserRole.MENTEE, label: t.auth.menteeRole, icon: GraduationCap, color: 'bg-gradient-to-br from-sky-100/60 to-sky-50/40 text-sky-600', desc: 'Learn from experienced mentors' },
                    { id: UserRole.MENTOR, label: t.auth.mentorRole, icon: Users, color: 'bg-gradient-to-br from-violet-100/60 to-violet-50/40 text-violet-600', desc: 'Share your expertise' },
                    { id: UserRole.PROVIDER, label: t.auth.providerRole, icon: Building2, color: 'bg-gradient-to-br from-amber-100/60 to-amber-50/40 text-amber-600', desc: 'Refer users and earn commissions' },
                  ].map((role) => (
                    <button
                      key={role.id} onClick={() => { setFormData({ ...formData, role: role.id }); setMode('ROLE_SELECT'); }}
                      className="w-full p-5 rounded-2xl border border-slate-200/50 text-left flex items-center gap-4 transition-all duration-200 bg-white hover:border-violet-300/50 hover:bg-gradient-to-r hover:from-violet-50/30 hover:to-rose-50/30 hover:shadow-md"
                    >
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm ${role.color}`}><role.icon size={26} /></div>
                      <div className="flex-1">
                        <div className="font-bold text-slate-800 text-base">{role.label}</div>
                        <div className="text-sm text-slate-500 mt-1">{role.desc}</div>
                      </div>
                      <ArrowRight className="text-slate-400" size={20} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'ROLE_SELECT' && (
              <form onSubmit={handleRegister} className="space-y-5">
                <button onClick={() => { setMode('REGISTER'); setError(null); }} type="button" className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 mb-2">
                  <ChevronLeft size={16} /> {t.common.back}
                </button>

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
                      autoComplete="email"
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
                      autoComplete="new-password"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all font-medium text-slate-800"
                    />
                  </div>
                </div>

                {/* ✅ NEW: Country Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    COUNTRY <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <Globe className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                    {loadingCountries ? (
                      <div className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-2">
                        <Loader2 className="animate-spin" size={16} />
                        <span className="text-sm text-slate-400">Loading countries...</span>
                      </div>
                    ) : (
                      <select
                        name="country"
                        required
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all font-medium text-slate-800 appearance-none cursor-pointer"
                      >
                        <option value="">Select your country...</option>
                        {countries.map(country => (
                          <option key={country.code} value={country.code}>
                            {country.name} (×{country.multiplier})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 ml-1 mt-1">
                    We use fair pricing based on your region
                  </p>
                </div>

                {formData.role === UserRole.MENTEE && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Referral Code (Optional)</label>
                    <div className="relative group">
                      <Building2 className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                      <input
                        type="text" name="referralCode" placeholder="Enter provider referral code"
                        value={formData.referralCode} onChange={handleChange}
                        autoComplete="off"
                      className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:scale-[1.02] outline-none transition-all duration-200 font-medium text-slate-800"
                      />
                    </div>
                  </div>
                )}

                <button type="submit" disabled={loading} className="w-full py-5 bg-gradient-to-r from-violet-400 to-rose-400 text-white rounded-2xl font-bold text-sm tracking-wide hover:from-violet-500 hover:to-rose-500 hover:shadow-lg transition-all duration-200 shadow-md flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed group">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : t.auth.completeRegister}
                  {!loading && <ArrowRight className="group-hover:translate-x-1 transition-transform duration-200" size={18} />}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
