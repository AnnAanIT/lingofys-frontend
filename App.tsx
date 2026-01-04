
import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { User, UserRole, Language } from './types';
import { api } from './services/api';
import { translations } from './lib/i18n';
import { ToastProvider } from './components/ui/Toast';
import { NotificationBell } from './components/Notifications/NotificationBell';
import { ScrollToTop } from './components/ScrollToTop';
import { BRAND } from './constants/brand';

// ✅ Dev Tools - Only in development
if (import.meta.env.DEV) {
  import('./lib/devTools');
}

// --- ICONS ---
import {
  Users, Calendar, MessageSquare, CreditCard,
  LayoutDashboard, LogOut, CheckCircle, XCircle, BookOpen, Search, DollarSign, Award, User as UserIcon, Globe,
  Menu, X, ChevronRight, Star, Wallet
} from 'lucide-react';

// --- PAGES ---
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import Readme from './pages/Readme';
import PublicMentorBrowse from './pages/PublicMentorBrowse';
import PublicMentorProfile from './pages/PublicMentorProfile';
import { UITest } from './pages/UITest';
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
import MenteeFeedback from './pages/MenteeFeedback';

import MentorDashboard from './pages/MentorDashboard';
import MentorProfile from './pages/MentorProfile';
import MentorBioPage from './pages/MentorBioPage';
import MentorPayout from './pages/MentorPayout';
import MentorFeedback from './pages/MentorFeedback';

import ProviderDashboard from './pages/ProviderDashboard';
import ProviderProfile from './pages/ProviderProfile';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminMessages from './pages/AdminMessages';
import AdminUsers from './pages/AdminUsers';
import AdminUserDetail from './pages/AdminUserDetail';
import AdminPendingApprovals from './pages/AdminPendingApprovals';
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
import AdminProviderCommissions from './pages/AdminProviderCommissions';
import AdminSubscriptionPlans from './pages/AdminSubscriptionPlans';
import AdminFeedback from './pages/AdminFeedback';

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
  // Only use language preference for Mentee, force English for others
  const t = user?.role === UserRole.MENTEE ? translations[language] : translations['en'];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ✅ FIX PERF-1: Memoize navigation links - MUST be before early returns to follow Rules of Hooks
  const navLinks = useMemo(() => {
    if (!user) return [];

    // Get correct translation based on role
    const translations_t = user.role === UserRole.MENTEE ? translations[language] : translations['en'];

    switch (user.role) {
      case UserRole.MENTEE:
        return [
          { icon: LayoutDashboard, label: translations_t.nav.dashboard, path: '/mentee' },
          { icon: Search, label: translations_t.nav.findMentor, path: '/mentee/find-mentor' },
          { icon: Calendar, label: translations_t.nav.bookings, path: '/mentee/bookings' },
          { icon: Award, label: translations_t.nav.subscriptions, path: '/mentee/subscriptions' },
          { icon: BookOpen, label: translations_t.nav.homework, path: '/mentee/homework' },
          { icon: Star, label: 'Feedback', path: '/mentee/feedback' },
          { icon: MessageSquare, label: translations_t.nav.messages, path: '/mentee/chat' },
          { icon: CreditCard, label: translations_t.nav.wallet, path: '/mentee/wallet' },
          { icon: UserIcon, label: translations_t.nav.profile, path: '/mentee/profile' },
        ];
      case UserRole.MENTOR:
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/mentor' },
          { icon: Calendar, label: 'Schedule', path: '/mentor/schedule' },
          { icon: BookOpen, label: 'Homework', path: '/mentor/homework' },
          { icon: Star, label: 'Feedback', path: '/mentor/feedback' },
          { icon: MessageSquare, label: 'Admin Support', path: '/mentor/chat' },
          { icon: DollarSign, label: 'Earnings & Payout', path: '/mentor/payout' },
          { icon: UserIcon, label: 'Profile', path: '/mentor/profile' },
        ];
      case UserRole.PROVIDER:
        return [
          { icon: LayoutDashboard, label: 'Overview', path: '/provider' },
          { icon: DollarSign, label: 'Earnings', path: '/provider/earnings' },
          { icon: Wallet, label: 'Payouts', path: '/provider/payouts' },
          { icon: MessageSquare, label: 'Admin Support', path: '/provider/chat' },
          { icon: UserIcon, label: 'Profile', path: '/provider/profile' },
        ];
      case UserRole.ADMIN:
      default:
        return [];
    }
  }, [user, user?.role, language]);

  const primaryNavLinks = useMemo(() => navLinks.slice(0, 4), [navLinks]);
  const secondaryNavLinks = useMemo(() => navLinks.slice(4), [navLinks]);

  // Early returns AFTER all hooks
  if (!user) return <>{children}</>;

  if (user.role === UserRole.ADMIN) return <>{children}</>;

  const getNavLinks = () => navLinks;
  const getPrimaryNavLinks = () => primaryNavLinks;
  const getSecondaryNavLinks = () => secondaryNavLinks;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar - Hidden on mobile, shown on desktop */}
      <aside className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:bottom-0 w-64 bg-white border-r border-slate-200 z-40">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">{BRAND.logo.icon}</div>
            <span className="font-bold text-slate-800 text-base">{BRAND.name}</span>
          </div>
        </div>

        <div className="p-2.5 space-y-0.5">
          {getNavLinks().map((link) => {
            const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + '/');
            const Icon = link.icon;
            const isChatLink = link.path.includes('chat');

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-colors relative ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={18} />
                <span className="flex-1 text-sm">{link.label}</span>
                {isChatLink && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="p-2.5 border-t border-slate-100 space-y-2">
          {user.role === UserRole.MENTEE && (
            <div className="px-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Language</label>
              <div className="relative">
                <Globe size={14} className="absolute left-2.5 top-2 text-slate-400" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
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

          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl">
             <div className="flex items-center space-x-2 min-w-0 flex-1">
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full bg-slate-200 object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-900 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user.role === 'MENTOR' ? 'TEACHER' : user.role === 'MENTEE' ? 'STUDENT' : user.role}</p>
                </div>
             </div>
             <div className="flex-shrink-0">
                <NotificationBell />
             </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
          >
            <LogOut size={14} />
            <span>{t.nav.signOut}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar - Show on mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 p-4 z-30 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">{BRAND.logo.icon}</div>
          <span className="font-bold text-slate-800 text-base">{BRAND.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Out Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 mt-16">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          
          {/* Menu Drawer */}
          <div className="fixed top-16 left-0 right-0 bottom-20 bg-white overflow-y-auto shadow-2xl animate-slide-down">
            <div className="p-4 space-y-2">
              {/* Primary Navigation */}
              {getPrimaryNavLinks().map((link) => {
                const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + '/');
                const Icon = link.icon;
                const isChatLink = link.path.includes('chat');
                
                return (
                  <Link 
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-4 px-4 py-3 rounded-lg transition-colors relative group ${
                      isActive 
                        ? 'bg-brand-50 text-brand-700 font-semibold' 
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={22} />
                    <span className="flex-1 text-sm font-medium">{link.label}</span>
                    {isChatLink && unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                        {unreadCount}
                      </span>
                    )}
                    {isActive && <ChevronRight size={18} className="text-brand-600" />}
                  </Link>
                );
              })}

              {/* Secondary Navigation */}
              {getSecondaryNavLinks().length > 0 && (
                <>
                  <div className="h-px bg-slate-200 my-2"></div>
                  {getSecondaryNavLinks().map((link) => {
                    const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + '/');
                    const Icon = link.icon;
                    
                    return (
                      <Link 
                        key={link.path}
                        to={link.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-4 px-4 py-3 rounded-lg transition-colors ${
                          isActive 
                            ? 'bg-brand-50 text-brand-700 font-semibold' 
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Icon size={22} />
                        <span className="flex-1 text-sm font-medium">{link.label}</span>
                        {isActive && <ChevronRight size={18} className="text-brand-600" />}
                      </Link>
                    );
                  })}
                </>
              )}

              {/* Divider */}
              <div className="h-px bg-slate-200 my-3"></div>

              {/* Language Selector (Mentee Only) */}
              {user.role === UserRole.MENTEE && (
                <div className="px-4 py-3">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Language</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-3 top-3 text-slate-400" />
                    <select 
                      value={language}
                      onChange={(e) => {
                        setLanguage(e.target.value as Language);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
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

              {/* User Profile Card */}
              <div className="mx-2 p-3 bg-gradient-to-r from-brand-50 to-slate-50 rounded-xl border border-brand-100">
                <div className="flex items-center space-x-3">
                  <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.role === 'MENTOR' ? 'TEACHER' : user.role === 'MENTEE' ? 'STUDENT' : user.role}</p>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button 
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 mx-2 px-4 py-3 border border-red-200 bg-red-50 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
              >
                <LogOut size={18} />
                <span>{t.nav.signOut}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto mt-24 md:mt-0 md:ml-64 pb-20 md:pb-0 md:p-8 p-5">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - Primary Items Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-1 py-2 z-30 shadow-lg shadow-slate-900/5">
        <div className="flex justify-around gap-0.5">
          {getPrimaryNavLinks().map((link) => {
            const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + '/');
            const Icon = link.icon;
            const isChatLink = link.path.includes('chat');
            
            return (
              <Link 
                key={link.path}
                to={link.path}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-[10px] font-semibold transition-all flex-1 relative
                  ${isActive 
                    ? 'text-brand-600 bg-brand-50' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }
                `}
              >
                <div className="relative">
                  <Icon size={22} />
                  {isChatLink && unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="truncate text-center leading-tight">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

// --- APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguageState] = useState<Language>('en');
  const [unreadCount, setUnreadCount] = useState(0);

  // Restore language preference
  useEffect(() => {
    const savedLang = getCookie('lang') as Language;
    if (savedLang && ['en', 'vi', 'zh', 'ko', 'ja'].includes(savedLang)) {
      setLanguageState(savedLang);
    }
  }, []);

  // Restore user session on app load
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');

      if (!token) {
        return; // No token, user not logged in
      }

      if (savedUser) {
        try {
          // Try to use cached user data first
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);

          // Then refresh in background
          const freshUser = await api.getUserById(parsedUser.id);
          if (freshUser) {
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          }
        } catch (error) {
          console.error('Failed to restore session:', error);
          // Clear invalid data
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      } else {
        // No cached user, token might be valid - try to get user from backend
        // This requires a /api/auth/me endpoint or similar
        console.log('Token exists but no cached user data');
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      try {
        const count = await api.getUnreadCount(user.id);
        setUnreadCount(count);
      } catch (e) {
        console.error("Failed to fetch unread count", e);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // Reduced from 10s to 30s to prevent 429 errors

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
            // Cache user data for session restore
            localStorage.setItem('user', JSON.stringify(u));
        } else {
            setUser(userDataOrRole as User);
            // Cache user data for session restore
            localStorage.setItem('user', JSON.stringify(userDataOrRole));
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
    // Clear all auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  const refreshUser = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
        const u = await api.getUserById(user.id);
        if (u) {
            setUser(u);
            // Update cached user data
            localStorage.setItem('user', JSON.stringify(u));
        }
    } catch (e) {
        console.error("Refresh user error", e);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <HelmetProvider>
    <ToastProvider>
        <AppContext.Provider value={{ user, login, logout, refreshUser, isLoading, language, setLanguage, unreadCount }}>
        <HashRouter>
            <ScrollToTop />
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
                <Route path="/mentors/:id" element={<PublicMentorProfile />} />
                <Route path="/ui-test" element={<UITest />} />

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
                <Route path="/mentee/feedback" element={user?.role === UserRole.MENTEE ? <MenteeFeedback /> : <Navigate to="/" />} />

                {/* MENTOR ROUTES */}
                <Route path="/mentor" element={user?.role === UserRole.MENTOR ? <MentorDashboard tab="home" /> : <Navigate to="/" />} />
                <Route path="/mentor/profile" element={user?.role === UserRole.MENTOR ? <MentorProfile /> : <Navigate to="/" />} />
                <Route path="/mentor/profile/bio" element={user?.role === UserRole.MENTOR ? <MentorBioPage /> : <Navigate to="/" />} />
                <Route path="/mentor/schedule" element={user?.role === UserRole.MENTOR ? <MentorDashboard tab="calendar" /> : <Navigate to="/" />} />
                <Route path="/mentor/homework" element={user?.role === UserRole.MENTOR ? <MentorDashboard tab="homework" /> : <Navigate to="/" />} />
                <Route path="/mentor/chat" element={user?.role === UserRole.MENTOR ? <MentorDashboard tab="chat" /> : <Navigate to="/" />} />
                <Route path="/mentor/earnings" element={user?.role === UserRole.MENTOR ? <MentorDashboard tab="earnings" /> : <Navigate to="/" />} />
                <Route path="/mentor/payout" element={user?.role === UserRole.MENTOR ? <MentorPayout /> : <Navigate to="/" />} />
                <Route path="/mentor/feedback" element={user?.role === UserRole.MENTOR ? <MentorFeedback /> : <Navigate to="/" />} />

                {/* PROVIDER ROUTES */}
                <Route path="/provider" element={user?.role === UserRole.PROVIDER ? <ProviderDashboard tab="overview" /> : <Navigate to="/" />} />
                <Route path="/provider/profile" element={user?.role === UserRole.PROVIDER ? <ProviderProfile /> : <Navigate to="/" />} />
                <Route path="/provider/earnings" element={user?.role === UserRole.PROVIDER ? <ProviderDashboard tab="earnings" /> : <Navigate to="/" />} />
                <Route path="/provider/payouts" element={user?.role === UserRole.PROVIDER ? <ProviderDashboard tab="payouts" /> : <Navigate to="/" />} />
                <Route path="/provider/chat" element={user?.role === UserRole.PROVIDER ? <ProviderDashboard tab="chat" /> : <Navigate to="/" />} />

                {/* ADMIN ROUTES */}
                <Route path="/admin" element={user?.role === UserRole.ADMIN ? <Navigate to="/admin/dashboard" /> : <Navigate to="/" />} />
                <Route path="/admin/dashboard" element={user?.role === UserRole.ADMIN ? <AdminDashboard /> : <Navigate to="/" />} />
                <Route path="/admin/messages" element={user?.role === UserRole.ADMIN ? <AdminMessages /> : <Navigate to="/" />} />
                <Route path="/admin/profile" element={user?.role === UserRole.ADMIN ? <AdminProfile /> : <Navigate to="/" />} />
                <Route path="/admin/users" element={user?.role === UserRole.ADMIN ? <AdminUsers /> : <Navigate to="/" />} />
                <Route path="/admin/users/:userId" element={user?.role === UserRole.ADMIN ? <AdminUserDetail /> : <Navigate to="/" />} />
                <Route path="/admin/pending-approvals" element={user?.role === UserRole.ADMIN ? <AdminPendingApprovals /> : <Navigate to="/" />} />
                <Route path="/admin/bookings" element={user?.role === UserRole.ADMIN ? <AdminBookings /> : <Navigate to="/" />} />
                <Route path="/admin/pricing" element={user?.role === UserRole.ADMIN ? <AdminPricing /> : <Navigate to="/" />} />
                <Route path="/admin/pricing/countries" element={user?.role === UserRole.ADMIN ? <AdminPricingCountries /> : <Navigate to="/" />} />
                <Route path="/admin/pricing/groups" element={user?.role === UserRole.ADMIN ? <AdminPricingGroups /> : <Navigate to="/" />} />
                <Route path="/admin/provider-levels" element={user?.role === UserRole.ADMIN ? <AdminProviderLevels /> : <Navigate to="/" />} />
                <Route path="/admin/provider-commissions" element={user?.role === UserRole.ADMIN ? <AdminProviderCommissions /> : <Navigate to="/" />} />
                <Route path="/admin/pricing-revenue-audit" element={user?.role === UserRole.ADMIN ? <AdminPricingRevenueAudit /> : <Navigate to="/" />} />
                <Route path="/admin/plans" element={user?.role === UserRole.ADMIN ? <AdminSubscriptionPlans /> : <Navigate to="/" />} />
                <Route path="/admin/credit-dashboard" element={user?.role === UserRole.ADMIN ? <AdminCreditDashboard /> : <Navigate to="/" />} />
                <Route path="/admin/revenue" element={user?.role === UserRole.ADMIN ? <AdminRevenue /> : <Navigate to="/" />} /> 
                <Route path="/admin/payments" element={user?.role === UserRole.ADMIN ? <AdminPayments /> : <Navigate to="/" />} />
                <Route path="/admin/payments/:id" element={user?.role === UserRole.ADMIN ? <AdminPaymentDetail /> : <Navigate to="/" />} />
                <Route path="/admin/payouts" element={user?.role === UserRole.ADMIN ? <AdminPayouts /> : <Navigate to="/" />} />
                <Route path="/admin/payouts/:id" element={user?.role === UserRole.ADMIN ? <AdminPayoutDetail /> : <Navigate to="/" />} />
                <Route path="/admin/homework" element={user?.role === UserRole.ADMIN ? <AdminHomework /> : <Navigate to="/" />} />
                <Route path="/admin/feedback" element={user?.role === UserRole.ADMIN ? <AdminFeedback /> : <Navigate to="/" />} />
                <Route path="/admin/logs" element={user?.role === UserRole.ADMIN ? <AdminLogs /> : <Navigate to="/" />} />
            </Routes>
            </Layout>
        </HashRouter>
        </AppContext.Provider>
    </ToastProvider>
    </HelmetProvider>
  );
}
