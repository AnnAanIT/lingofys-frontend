
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, BookOpen, CreditCard, DollarSign, 
  FileText, Activity, LogOut, Check, X, AlertCircle, Clock, PieChart, 
  User as UserIcon, Tag, MessageSquare, ShieldCheck, Scale, Shield, Award,
  ChevronDown, ChevronRight, Layers, Settings, Briefcase
} from 'lucide-react';
import { useApp } from '../App';
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

export const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useApp();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

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
        { label: 'Transactions', path: '/admin/payments', icon: CreditCard },
        { label: 'Payout Requests', path: '/admin/payouts', icon: DollarSign },
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
    <div className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col fixed left-0 top-0 z-50 shadow-xl border-r border-slate-800">
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3 bg-slate-950">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-brand-900/20">M</div>
        <span className="font-bold text-white text-lg tracking-tight">Admin Portal</span>
      </div>
      
      <div className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
        {menuStructure.map((item) => {
          // Render Single Link
          if (!item.children) {
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path!)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  active 
                    ? 'bg-brand-600 text-white shadow-md' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          }

          // Render Group
          const isExpanded = expandedGroups.includes(item.id);
          const hasActiveChild = item.children.some(child => isActive(child.path));

          return (
            <div key={item.id} className="space-y-1 pt-2">
              <button
                onClick={() => toggleGroup(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  hasActiveChild ? 'text-brand-400 bg-slate-800/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </div>
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {isExpanded && (
                <div className="pl-4 space-y-1 animate-slide-up">
                  <div className="border-l border-slate-700 pl-2 space-y-1">
                    {item.children.map(child => {
                      const childActive = isActive(child.path);
                      return (
                        <button
                          key={child.path}
                          onClick={() => navigate(child.path)}
                          className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-all ${
                            childActive 
                              ? 'bg-brand-900/30 text-brand-400 font-bold border-r-2 border-brand-500' 
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {child.icon && <child.icon size={16} className={childActive ? 'text-brand-500' : 'opacity-70'} />}
                          <span>{child.label}</span>
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

      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-red-600 hover:shadow-lg transition-all duration-300"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

// --- LAYOUT ---
export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-8 overflow-auto">
        {children}
      </div>
    </div>
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
