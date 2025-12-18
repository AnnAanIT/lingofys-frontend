
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { User, UserRole, Language } from './types';
import { api } from './services/api';
import { translations } from './lib/i18n';
import { ToastProvider } from './components/ui/Toast';
import { NotificationBell } from './components/Notifications/NotificationBell';

// --- ICONS ---
import { 
  Users, Calendar, MessageSquare, CreditCard, 
  LayoutDashboard, LogOut, CheckCircle, XCircle, BookOpen, Search, DollarSign, Award, User as UserIcon, Globe
} from 'lucide-react';

// --- PAGES ---
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import Readme from './pages/Readme';
import PublicMentorBrowse from './pages/PublicMentorBrowse';
import MenteeDashboard from './pages/MenteeDashboard';
import MenteeFindMentor from './pages/MenteeFindMentor';
import MenteeMentorDetail from './pages/MenteeMentorDetail';
import MenteeBookings from './pages/MenteeBookings';
import MenteeBookingDetail from './pages/MenteeBookingDetail';
import BookingSuccess from './pages/BookingSuccess';
import MenteeSubscriptions from './pages/MenteeSubscriptions';
import MenteeSubscriptionDetail from './pages/MenteeSubscriptionDetail';
import MenteeActiveSubscription from './pages/MenteeActiveSubscription';
import MenteeProfile from './pages/MenteeProfile';

import MentorDashboard from './pages/MentorDashboard';
import MentorProfile from './pages/MentorProfile';
import MentorBioPage from './pages/MentorBioPage';
import MentorPayout from './pages/MentorPayout';

import ProviderDashboard from './pages/ProviderDashboard';
import ProviderProfile from './pages/ProviderProfile';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminMessages from './pages/AdminMessages';
import AdminUsers from './pages/AdminUsers';
import AdminUserDetail from './pages/AdminUserDetail'; 
import AdminBookings from './pages/AdminBookings';
import AdminPayments from './pages/AdminPayments';
import AdminPaymentDetail from './pages/AdminPaymentDetail';
import AdminRevenue from './pages/AdminRevenue'; 
import AdminPayouts from './pages/AdminPayouts';
import AdminPayoutDetail from './pages/AdminPayoutDetail'; 
import AdminLogs from './pages/AdminLogs';
import AdminHomework from './pages/AdminHomework';
import AdminProfile from './pages/AdminProfile';
import AdminPricing from './pages/AdminPricing';
import AdminPricingCountries from './pages/AdminPricingCountries';
import AdminPricingGroups from './pages/AdminPricingGroups';
import AdminPricingRevenueAudit from './pages/AdminPricingRevenueAudit';
import AdminCreditDashboard from './pages/AdminCreditDashboard';
import AdminProviderLevels from './pages/AdminProviderLevels';
import AdminSubscriptionPlans from './pages/AdminSubscriptionPlans';

// --- HELPERS ---
const getCookie = (name: string) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

const setCookie = (name: string, val: string) => {
  document.cookie = `${name}=${val}; path=/; max-age=31536000`; // 1 Year
}

// --- GLOBAL STATE ---
interface AppState {
  user: User | null;
  login: (userDataOrRole: User | UserRole) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  unreadCount: number;
}

const AppContext = createContext<AppState>({} as AppState);
export const useApp = () => useContext(AppContext);

// --- LAYOUT ---
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, language, setLanguage, unreadCount } = useApp();
  const location = useLocation();
  const t = translations[language];

  if (!user) return <>{children}</>;
  
  if (user.role === UserRole.ADMIN) return <>{children}</>;

  const getNavLinks = () => {
    switch (user.role) {
      case UserRole.MENTEE:
        return [
          { icon: LayoutDashboard, label: t.nav.dashboard, path: '/mentee' },
          { icon: Search, label: t.nav.findMentor, path: '/mentee/find-mentor' },
          { icon: Calendar, label: t.nav.bookings, path: '/mentee/bookings' },
          { icon: Award, label: t.nav.subscriptions, path: '/mentee/subscriptions' },
          { icon: BookOpen, label: t.nav.homework, path: '/mentee/homework' },
          { icon: MessageSquare, label: 'Support Chat', path: '/mentee/chat' },
          { icon: CreditCard, label: t.nav.wallet, path: '/mentee/wallet' },
          { icon: UserIcon, label: t.nav.profile, path: '/mentee/profile' },
        ];
      case UserRole.MENTOR:
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/mentor' },
          { icon: Calendar, label: 'Schedule', path: '/mentor/schedule' },
          { icon: BookOpen, label: 'Homework', path: '/mentor/homework' },
          { icon: MessageSquare, label: 'Admin Support', path: '/mentor/chat' },
          { icon: DollarSign, label: 'Earnings & Payout', path: '/mentor/payout' },
          { icon: UserIcon, label: 'Profile', path: '/mentor/profile' },
        ];
      case UserRole.PROVIDER:
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/provider' },
          { icon: UserIcon, label: 'Profile', path: '/provider/profile' },
        ];
      default: return [];
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0 z-10">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
            <span className="font-bold text-slate-800 text-lg">Mentorship.io</span>
          </div>
          <div className="md:hidden">
             <NotificationBell />
          </div>
        </div>
        
        <div className="p-4 space-y-1">
          {getNavLinks().map((link) => {
            const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + '/');
            const Icon = link.icon;
            const isChatLink = link.path.includes('chat');
            
            return (
              <Link 
                key={link.path} 
                to={link.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors relative ${
                  isActive 
                    ? 'bg-brand-50 text-brand-700 font-medium' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={20} />
                <span className="flex-1">{link.label}</span>
                {isChatLink && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-auto p-4 border-t border-slate-100 space-y-4">
          {user.role === UserRole.MENTEE && (
            <div className="px-4">
              <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Language</label>
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
                >
                  <option value="en">English</option>
                  <option value="vi">Tiếng Việt</option>
                  <option value="zh">中文</option>
                  <option value="ko">한국어</option>
                  <option value="ja">日本語</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl">
             <div className="flex items-center space-x-3 min-w-0">
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full bg-slate-200 object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.role}</p>
                </div>
             </div>
             <div className="hidden md:block">
                <NotificationBell />
             </div>
          </div>

          <button 
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
          >
            <LogOut size={16} />
            <span>{t.nav.signOut}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

// --- APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguageState] = useState<Language>('en');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const savedLang = getCookie('lang') as Language;
    if (savedLang && ['en', 'vi', 'zh', 'ko', 'ja'].includes(savedLang)) {
      setLanguageState(savedLang);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      try {
        const count = await api.getUnreadCount(user.id, user.role);
        setUnreadCount(count);
      } catch (e) {
        console.error("Failed to fetch unread count", e);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);

    return () => clearInterval(interval);
  }, [user]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setCookie('lang', lang);
  };

  const login = async (userDataOrRole: User | UserRole) => {
    setIsLoading(true);
    try {
        if (typeof userDataOrRole === 'string') {
            const u = await api.loginByRole(userDataOrRole as UserRole);
            setUser(u);
        } else {
            setUser(userDataOrRole as User);
        }
    } catch (e) {
        console.error("Login state error", e);
    } finally {
        setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setUnreadCount(0);
  };

  const refreshUser = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
        const u = await api.getUserById(user.id);
        if (u) setUser(u);
    } catch (e) {
        console.error("Refresh user error", e);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <ToastProvider>
        <AppContext.Provider value={{ user, login, logout, refreshUser, isLoading, language, setLanguage, unreadCount }}>
        <HashRouter>
            <Layout>
            <Routes>
                <Route path="/" element={
                !user ? <LandingPage /> : 
                user.role === UserRole.MENTEE ? <Navigate to="/mentee" /> :
                user.role === UserRole.MENTOR ? <Navigate to="/mentor" /> :
                user.role === UserRole.PROVIDER ? <Navigate to="/provider" /> :
                <Navigate to="/admin/dashboard" />
                } />
                
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                <Route path="/readme" element={<Readme />} />
                <Route path="/find-mentor" element={<PublicMentorBrowse />} />

                {/* MENTEE ROUTES */}
                <Route path="/mentee" element={user?.role === UserRole.MENTEE ? <MenteeDashboard tab="home" /> : <Navigate to="/" />} />
                <Route path="/mentee/profile" element={user?.role === UserRole.MENTEE ? <MenteeProfile /> : <Navigate to="/" />} />
                <Route path="/mentee/find-mentor" element={user?.role === UserRole.MENTEE ? <MenteeFindMentor /> : <Navigate to="/" />} />
                <Route path="/mentee/find-mentor/:id" element={user?.role === UserRole.MENTEE ? <MenteeMentorDetail /> : <Navigate to="/" />} />
                <Route path="/mentee/booking-success/:bookingId" element={user?.role === UserRole.MENTEE ? <BookingSuccess /> : <Navigate to="/" />} />
                <Route path="/mentee/bookings" element={user?.role === UserRole.MENTEE ? <MenteeBookings /> : <Navigate to="/" />} />
                <Route path="/mentee/bookings/:bookingId" element={user?.role === UserRole.MENTEE ? <MenteeBookingDetail /> : <Navigate to="/" />} />
                <Route path="/mentee/subscriptions" element={user?.role === UserRole.MENTEE ? <MenteeSubscriptions /> : <Navigate to="/" />} />
                <Route path="/mentee/subscriptions/active" element={user?.role === UserRole.MENTEE ? <MenteeActiveSubscription /> : <Navigate to="/" />} />
                <Route path="/mentee/subscriptions/:planId" element={user?.role === UserRole.MENTEE ? <MenteeSubscriptionDetail /> : <Navigate to="/" />} />
                <Route path="/mentee/schedule" element={<Navigate to="/mentee/bookings" replace />} />
                <Route path="/mentee/mentors" element={<Navigate to="/mentee/find-mentor" replace />} />
                <Route path="/mentee/homework" element={user?.role === UserRole.MENTEE ? <MenteeDashboard tab="homework" /> : <Navigate to="/" />} />
                <Route path="/mentee/chat" element={user?.role === UserRole.MENTEE ? <MenteeDashboard tab="chat" /> : <Navigate to="/" />} />
                <Route path="/mentee/wallet" element={user?.role === UserRole.MENTEE ? <MenteeDashboard tab="wallet" /> : <Navigate to="/" />} />

                {/* MENTOR ROUTES */}
                <Route path="/mentor" element={user?.role === UserRole.MENTOR ? <MentorDashboard tab="home" /> : <Navigate to="/" />} />
                <Route path="/mentor/profile" element={user?.role === UserRole.MENTOR ? <MentorProfile /> : <Navigate to="/" />} />
                <Route path="/mentor/profile/bio" element={user?.role === UserRole.MENTOR ? <MentorBioPage /> : <Navigate to="/" />} />
                <Route path="/mentor/schedule" element={user?.role === UserRole.MENTOR ? <MentorDashboard tab="calendar" /> : <Navigate to="/" />} />
                <Route path="/mentor/homework" element={user?.role === UserRole.MENTOR ? <MentorDashboard tab="homework" /> : <Navigate to="/" />} />
                <Route path="/mentor/chat" element={user?.role === UserRole.MENTOR ? <MentorDashboard tab="chat" /> : <Navigate to="/" />} />
                <Route path="/mentor/earnings" element={user?.role === UserRole.MENTOR ? <MentorDashboard tab="earnings" /> : <Navigate to="/" />} />
                <Route path="/mentor/payout" element={user?.role === UserRole.MENTOR ? <MentorPayout /> : <Navigate to="/" />} />

                {/* PROVIDER ROUTES */}
                <Route path="/provider" element={user?.role === UserRole.PROVIDER ? <ProviderDashboard tab="overview" /> : <Navigate to="/" />} />
                <Route path="/provider/profile" element={user?.role === UserRole.PROVIDER ? <ProviderProfile /> : <Navigate to="/" />} />
                <Route path="/provider/referrals" element={user?.role === UserRole.PROVIDER ? <ProviderDashboard tab="referrals" /> : <Navigate to="/" />} />
                <Route path="/provider/commissions" element={user?.role === UserRole.PROVIDER ? <ProviderDashboard tab="commissions" /> : <Navigate to="/" />} />
                <Route path="/provider/payouts" element={user?.role === UserRole.PROVIDER ? <ProviderDashboard tab="payouts" /> : <Navigate to="/" />} />

                {/* ADMIN ROUTES */}
                <Route path="/admin" element={user?.role === UserRole.ADMIN ? <Navigate to="/admin/dashboard" /> : <Navigate to="/" />} />
                <Route path="/admin/dashboard" element={user?.role === UserRole.ADMIN ? <AdminDashboard /> : <Navigate to="/" />} />
                <Route path="/admin/messages" element={user?.role === UserRole.ADMIN ? <AdminMessages /> : <Navigate to="/" />} />
                <Route path="/admin/profile" element={user?.role === UserRole.ADMIN ? <AdminProfile /> : <Navigate to="/" />} />
                <Route path="/admin/users" element={user?.role === UserRole.ADMIN ? <AdminUsers /> : <Navigate to="/" />} />
                <Route path="/admin/users/:userId" element={user?.role === UserRole.ADMIN ? <AdminUserDetail /> : <Navigate to="/" />} />
                <Route path="/admin/bookings" element={user?.role === UserRole.ADMIN ? <AdminBookings /> : <Navigate to="/" />} />
                <Route path="/admin/pricing" element={user?.role === UserRole.ADMIN ? <AdminPricing /> : <Navigate to="/" />} />
                <Route path="/admin/pricing/countries" element={user?.role === UserRole.ADMIN ? <AdminPricingCountries /> : <Navigate to="/" />} />
                <Route path="/admin/pricing/groups" element={user?.role === UserRole.ADMIN ? <AdminPricingGroups /> : <Navigate to="/" />} />
                <Route path="/admin/provider-levels" element={user?.role === UserRole.ADMIN ? <AdminProviderLevels /> : <Navigate to="/" />} />
                <Route path="/admin/pricing-revenue-audit" element={user?.role === UserRole.ADMIN ? <AdminPricingRevenueAudit /> : <Navigate to="/" />} />
                <Route path="/admin/plans" element={user?.role === UserRole.ADMIN ? <AdminSubscriptionPlans /> : <Navigate to="/" />} />
                <Route path="/admin/credit-dashboard" element={user?.role === UserRole.ADMIN ? <AdminCreditDashboard /> : <Navigate to="/" />} />
                <Route path="/admin/revenue" element={user?.role === UserRole.ADMIN ? <AdminRevenue /> : <Navigate to="/" />} /> 
                <Route path="/admin/payments" element={user?.role === UserRole.ADMIN ? <AdminPayments /> : <Navigate to="/" />} />
                <Route path="/admin/payments/:id" element={user?.role === UserRole.ADMIN ? <AdminPaymentDetail /> : <Navigate to="/" />} />
                <Route path="/admin/payouts" element={user?.role === UserRole.ADMIN ? <AdminPayouts /> : <Navigate to="/" />} />
                <Route path="/admin/payouts/:id" element={user?.role === UserRole.ADMIN ? <AdminPayoutDetail /> : <Navigate to="/" />} />
                <Route path="/admin/homework" element={user?.role === UserRole.ADMIN ? <AdminHomework /> : <Navigate to="/" />} /> 
                <Route path="/admin/logs" element={user?.role === UserRole.ADMIN ? <AdminLogs /> : <Navigate to="/" />} />
            </Routes>
            </Layout>
        </HashRouter>
        </AppContext.Provider>
    </ToastProvider>
  );
}
