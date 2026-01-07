
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, CreditCard, DollarSign,
  FileText, Activity, LogOut, Check, X, AlertCircle, Clock, PieChart,
  User as UserIcon, Tag, MessageSquare, ShieldCheck, Scale, Shield, Award,
  ChevronDown, ChevronRight, Layers, Settings, Briefcase, Menu, Bell, Trash2,
  TrendingUp, Package
} from 'lucide-react';
import { useApp } from '../App';
import { api } from '../services/api';
export { EditUserForm } from './Admin/EditUserForm';
export { AddUserModal } from './Admin/AddUserModal';
export { ResetPasswordModal } from './Admin/ResetPasswordModal';
export { AddPaymentModal } from './Admin/AddPaymentModal';

// --- SIDEBAR ---
type MenuItem = {
  id: string;
  label: string;
  icon: any;
  path?: string;
  children?: { label: string; path: string; icon?: any }[];
};

// Sidebar context for managing open/close state
export const AdminSidebarContext = React.createContext<{
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}>({ sidebarOpen: true, setSidebarOpen: () => {} });

export const useAdminSidebar = () => React.useContext(AdminSidebarContext);

export const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useApp();
  const { sidebarOpen } = useAdminSidebar();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);

  const menuStructure: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin/dashboard'
    },
    {
      id: 'operations',
      label: 'Operations',
      icon: Briefcase,
      children: [
        { label: 'User Management', path: '/admin/users', icon: Users },
        { label: 'Pending Approvals', path: '/admin/pending-approvals', icon: Clock },
        { label: 'Bookings', path: '/admin/bookings', icon: BookOpen },
        { label: 'Messages', path: '/admin/messages', icon: MessageSquare },
        { label: 'Homework', path: '/admin/homework', icon: FileText },
      ]
    },
    {
      id: 'finance',
      label: 'Financials',
      icon: DollarSign,
      children: [
        { label: 'Revenue Analytics', path: '/admin/revenue', icon: PieChart },
        { label: 'Credit Audit', path: '/admin/credit-dashboard', icon: Scale },
        { label: 'Topup Report', path: '/admin/topup-report', icon: TrendingUp },
        { label: 'Payment Methods', path: '/admin/payment-methods', icon: CreditCard },
        { label: 'Credit Packages', path: '/admin/credit-packages', icon: Package },
        { label: 'Transactions', path: '/admin/payments', icon: CreditCard },
        { label: 'Payout Requests', path: '/admin/payouts', icon: DollarSign },
        { label: 'Provider Commissions', path: '/admin/provider-commissions', icon: DollarSign },
      ]
    },
    {
      id: 'config',
      label: 'Configuration',
      icon: Settings,
      children: [
        { label: 'Pricing Config', path: '/admin/pricing', icon: Tag },
        { label: 'Subscription Plans', path: '/admin/plans', icon: Award },
        { label: 'Provider Levels', path: '/admin/provider-levels', icon: Shield },
      ]
    },
    {
      id: 'system',
      label: 'System',
      icon: Activity,
      children: [
        { label: 'System Logs', path: '/admin/logs', icon: Activity },
        { label: 'My Profile', path: '/admin/profile', icon: UserIcon },
      ]
    }
  ];

  // Auto-expand group based on active route
  useEffect(() => {
    const activeGroup = menuStructure.find(group =>
      group.children?.some(child => location.pathname.startsWith(child.path))
    );
    if (activeGroup && !expandedGroups.includes(activeGroup.id)) {
      setExpandedGroups(prev => [...prev, activeGroup.id]);
    }
  }, [location.pathname]);

  // Fetch pending approvals count
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const pending = await api.getPendingUsers();
        setPendingCount(pending.length);
      } catch (err) {
        console.error('Failed to fetch pending approvals:', err);
      }
    };
    fetchPendingCount();

    // Refresh count every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`${sidebarOpen ? 'w-64' : 'w-0 md:w-20'} bg-slate-900 text-slate-300 min-h-screen flex flex-col fixed left-0 top-0 z-50 shadow-xl border-r border-slate-800 transition-all duration-300 overflow-hidden md:overflow-visible`}>
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3 bg-slate-950 whitespace-nowrap">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-brand-900/20 flex-shrink-0">M</div>
        <span className={`font-bold text-white text-lg tracking-tight transition-all ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>Admin Portal</span>
      </div>
      
      <div className={`flex-1 ${sidebarOpen ? 'p-2' : 'p-1'} space-y-0.5 overflow-y-auto custom-scrollbar`}>
        {menuStructure.map((item) => {
          // Render Single Link
          if (!item.children) {
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path!)}
                title={!sidebarOpen ? item.label : ''}
                className={`w-full flex items-center ${sidebarOpen ? 'space-x-2.5 px-2.5' : 'justify-center'} py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          }

          // Render Group
          const isExpanded = expandedGroups.includes(item.id);
          const hasActiveChild = item.children.some(child => isActive(child.path));

          return (
            <div key={item.id} className={`space-y-0.5 ${sidebarOpen ? 'pt-1' : 'pt-0'}`}>
              <button
                onClick={() => toggleGroup(item.id)}
                title={!sidebarOpen ? item.label : ''}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-2.5' : 'justify-center'} py-2 rounded-lg text-sm font-medium transition-colors ${
                  hasActiveChild ? 'text-brand-400 bg-slate-800/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className={`flex items-center ${sidebarOpen ? 'space-x-2.5' : ''}`}>
                  <item.icon size={18} className="flex-shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </div>
                {sidebarOpen && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
              </button>

              {isExpanded && sidebarOpen && (
                <div className="pl-3 space-y-0.5 animate-slide-up">
                  <div className="border-l border-slate-700 pl-1.5 space-y-0.5">
                    {item.children.map(child => {
                      const childActive = isActive(child.path);
                      const isPendingApprovals = child.path === '/admin/pending-approvals';
                      return (
                        <button
                          key={child.path}
                          onClick={() => navigate(child.path)}
                          className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-md text-xs transition-all relative ${
                            childActive
                              ? 'bg-brand-900/30 text-brand-400 font-bold border-r-2 border-brand-500'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {child.icon && <child.icon size={14} className={childActive ? 'text-brand-500' : 'opacity-70'} />}
                          <span className="flex-1 text-left">{child.label}</span>
                          {isPendingApprovals && pendingCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                              {pendingCount}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-2 border-t border-slate-800 bg-slate-950">
        <button
          onClick={logout}
          title={!sidebarOpen ? 'Sign Out' : ''}
          className={`w-full flex ${sidebarOpen ? 'justify-center' : 'justify-center'} items-center space-x-2 px-3 py-2.5 bg-slate-800 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-red-600 hover:shadow-lg transition-all duration-300`}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {sidebarOpen && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

// --- LAYOUT ---
export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    timestamp: Date;
  }>>([]);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  // Add a notification
  const addNotification = (
    type: 'info' | 'warning' | 'error' | 'success',
    title: string,
    message: string
  ) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, title, message, timestamp: new Date() }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const notificationColors: Record<string, string> = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    success: 'bg-green-50 border-green-200 text-green-900',
  };

  const notificationIconColors: Record<string, string> = {
    info: 'bg-blue-100 text-blue-600',
    warning: 'bg-yellow-100 text-yellow-600',
    error: 'bg-red-100 text-red-600',
    success: 'bg-green-100 text-green-600',
  };

  return (
    <AdminSidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      <div className="min-h-screen bg-slate-50 flex">
        <AdminSidebar />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64 md:ml-64' : 'ml-0 md:ml-20'}`}>
          {/* Top Bar */}
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title={sidebarOpen ? 'Hide menu' : 'Show menu'}
            >
              <Menu size={24} className="text-slate-700" />
            </button>

            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotificationCenter(!showNotificationCenter)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative"
                >
                  <Bell size={20} className="text-slate-700" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotificationCenter && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="font-bold text-slate-900">Notifications</h3>
                      <button
                        onClick={() => setShowNotificationCenter(false)}
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-500">
                          <p className="text-sm">No notifications</p>
                        </div>
                      ) : (
                        <div className="space-y-2 p-3">
                          {notifications.map(notif => (
                            <div
                              key={notif.id}
                              className={`p-3 rounded-lg border ${notificationColors[notif.type]} flex items-start justify-between gap-3`}
                            >
                              <div className="flex items-start gap-3 flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notificationIconColors[notif.type]}`}>
                                  {notif.type === 'success' && <Check size={16} />}
                                  {notif.type === 'error' && <AlertCircle size={16} />}
                                  {notif.type === 'warning' && <AlertCircle size={16} />}
                                  {notif.type === 'info' && <AlertCircle size={16} />}
                                </div>
                                <div className="flex-1">
                                  <p className="font-bold text-sm">{notif.title}</p>
                                  <p className="text-xs mt-1 opacity-75">{notif.message}</p>
                                  <p className="text-xs mt-2 opacity-50">
                                    {notif.timestamp.toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => removeNotification(notif.id)}
                                className="p-1 hover:bg-black/10 rounded transition-colors flex-shrink-0"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </AdminSidebarContext.Provider>
  );
};

// --- STAT CARD ---
export const StatCard: React.FC<{ title: string; value: string | number; icon: any; trend?: string }> = ({ title, value, icon: Icon, trend }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      {trend && <p className="text-xs text-green-600 mt-2 font-medium">{trend}</p>}
    </div>
    <div className="p-3 bg-brand-50 rounded-lg text-brand-600">
      <Icon size={24} />
    </div>
  </div>
);

// --- STATUS BADGE ---
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-green-100 text-green-700',
    PAID: 'bg-green-100 text-green-700',
    APPROVED: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    SCHEDULED: 'bg-blue-100 text-blue-700',
    BANNED: 'bg-red-100 text-red-700',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-slate-100 text-slate-600',
    NO_SHOW: 'bg-orange-100 text-orange-700',
    success: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
    holding: 'bg-yellow-100 text-yellow-700',
    released: 'bg-green-100 text-green-700',
    returned: 'bg-blue-100 text-blue-700',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
};

// --- CONFIRM DIALOG ---
export const ConfirmDialog: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string;
  type?: 'danger' | 'info';
}> = ({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-slide-up">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
          {type === 'danger' ? <AlertCircle size={24} /> : <Check size={24} />}
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-500 mb-6 text-sm">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 py-2.5 text-white rounded-lg font-bold ${type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>Confirm</button>
        </div>
      </div>
    </div>
  );
};
