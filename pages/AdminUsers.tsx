
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { AdminLayout, StatusBadge, ConfirmDialog, AddUserModal, ResetPasswordModal } from '../components/AdminComponents';
import { User, UserRole, Mentor, Provider, PricingCountry } from '../types';
import { Search, Trash2, ShieldCheck, ShieldOff, Plus, Lock, Eye, RotateCcw } from 'lucide-react';
import { useApp } from '../App';
import { useToast } from '../components/ui/Toast';

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user: currentUser } = useApp(); // Lấy thông tin admin đang đăng nhập
  const { success, error: showError } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  
  // Filter States
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterCountry, setFilterCountry] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  
  // Data for filters
  const [countries, setCountries] = useState<PricingCountry[]>([]);
  
  // NEW: Mentor cancellation stats
  const [mentorCancelStats, setMentorCancelStats] = useState<Record<string, { cancellationCount: number; lastCancelAt: string | null }>>({});
  
  // NEW: Mentee cancellation stats
  const [menteeCancelStats, setMenteeCancelStats] = useState<Record<string, { cancellationCount: number; lastCancelAt: string | null }>>({});
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'BAN' | 'UNBAN' | 'DELETE' | 'RESET_PASSWORD' | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchAllData = async () => {
    try {
      const u = await api.getUsers();
      const m = await api.getMentors();
      const p = await api.getProviders();
      const c = await api.getPricingCountries();
      setUsers(u || []);
      setMentors(m || []);
      setProviders(p || []);
      setCountries(c || []);
      
      // NEW: Fetch mentor cancellation stats
      const mentorUsers = (u || []).filter(user => user.role === UserRole.MENTOR);
      const statsPromises = mentorUsers.map(async (user) => {
        try {
          // Get mentor profile which includes cancellationCount
          const mentorProfile = m.find(mentor => mentor.id === user.id);
          if (mentorProfile) {
            return {
              userId: user.id,
              cancellationCount: mentorProfile.cancellationCount || 0,
              lastCancelAt: mentorProfile.lastCancelAt || null
            };
          }
        } catch (error) {
          console.error(`Failed to fetch stats for mentor ${user.id}:`, error);
        }
        return null;
      });
      
      const statsResults = await Promise.all(statsPromises);
      const statsMap: Record<string, any> = {};
      statsResults.forEach(stat => {
        if (stat) {
          statsMap[stat.userId] = {
            cancellationCount: stat.cancellationCount,
            lastCancelAt: stat.lastCancelAt
          };
        }
      });
      setMentorCancelStats(statsMap);
      
      // NEW: Fetch mentee cancellation stats for all users
      const allUsersStats = (u || []).map(async (user) => {
        try {
          // Use user's direct fields
          return {
            userId: user.id,
            cancellationCount: user.menteeCancelCount || 0,
            lastCancelAt: user.lastMenteeCancelAt || null
          };
        } catch (error) {
          console.error(`Failed to fetch mentee stats for ${user.id}:`, error);
          return null;
        }
      });
      
      const menteeStatsResults = await Promise.all(allUsersStats);
      const menteeStatsMap: Record<string, any> = {};
      menteeStatsResults.forEach(stat => {
        if (stat) {
          menteeStatsMap[stat.userId] = {
            cancellationCount: stat.cancellationCount,
            lastCancelAt: stat.lastCancelAt
          };
        }
      });
      setMenteeCancelStats(menteeStatsMap);
      
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      setUsers([]);
      setMentors([]);
      setProviders([]);
      setCountries([]);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleAction = async () => {
    if (!selectedUser || !actionType) return;

    try {
        if (actionType === 'DELETE') {
            await api.deleteUser(selectedUser.id);
            success('User Deleted', `${selectedUser.name} has been deleted successfully`);
        } else if (actionType === 'BAN' || actionType === 'UNBAN') {
            const newStatus = actionType === 'BAN' ? 'BANNED' : 'ACTIVE';
            await api.updateUserStatus(selectedUser.id, newStatus);
            const action = actionType === 'BAN' ? 'banned' : 'unbanned';
            success(`User ${action.charAt(0).toUpperCase() + action.slice(1)}`, `${selectedUser.name} has been ${action} successfully`);
        }
        // Note: api.logAction endpoint doesn't exist - removed

        await fetchAllData();
        setSelectedUser(null);
        setActionType(null);
    } catch (err: any) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
        const action = actionType === 'DELETE' ? 'delete' : actionType === 'BAN' ? 'ban' : 'unban';
        showError(`Failed to ${action}`, errorMsg);
        console.error(`User ${action} error:`, err);
    }
  };

  const handleCreateUser = async (data: any) => {
      try {
          await api.createUser(data);
          // Note: api.logAction endpoint doesn't exist - removed
          await fetchAllData();
          success('User Created', 'New user has been created successfully');
      } catch (err: any) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
          showError('Creation Failed', errorMsg);
          console.error('User creation error:', err);
          // Re-throw the error so AddUserModal can display it
          throw err;
      }
  };

  const handleResetPassword = async (password: string) => {
      if(!selectedUser) return;
      try {
          await api.resetPassword(selectedUser.id, password);
          // Note: api.logAction endpoint doesn't exist - removed
          success('Password Reset', 'Password has been reset successfully');
      } catch (err: any) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
          showError('Reset Failed', errorMsg);
          console.error('Password reset error:', err);
      }
  };

  // NEW: Handle reset mentor cancellation count
  const handleResetCancellationCount = async (userId: string, userName: string) => {
      if (!confirm(`Reset cancellation counter for ${userName}?\n\nThis will allow them to cancel bookings again this month.`)) {
          return;
      }
      
      try {
          await api.resetMentorCancellationCount(userId);
          success('Counter Reset', 'Cancellation counter has been reset successfully');
          await fetchAllData(); // Refresh to show updated stats
      } catch (err: any) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
          showError('Reset Failed', errorMsg);
          console.error('Reset cancellation error:', err);
      }
  };

  // NEW: Handle reset mentee cancellation count
  const handleResetMenteeCancellationCount = async (userId: string, userName: string) => {
      if (!confirm(`Reset mentee cancellation counter for ${userName}?\n\nThis will restore their 3 monthly cancels.`)) {
          return;
      }
      
      try {
          await api.resetMenteeCancellationCount(userId);
          success('Counter Reset', 'Mentee cancellation counter has been reset successfully');
          await fetchAllData(); // Refresh to show updated stats
      } catch (err: any) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
          showError('Reset Failed', errorMsg);
          console.error('Reset mentee cancellation error:', err);
      }
  };

  const getFullUserDetails = (user: User) => {
      if (user.role === UserRole.MENTOR) {
          const m = mentors.find(x => x.id === user.id);
          return m ? { ...user, ...m } : user;
      }
      if (user.role === UserRole.PROVIDER) {
          const p = providers.find(x => x.id === user.id);
          return p ? { ...user, ...p } : user;
      }
      return user;
  };

  const filteredUsers = (users || []).filter(u => {
    const matchesRole = filterRole === 'ALL' || u.role === filterRole;
    const matchesSearch = (u.name || '').toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase());

    let matchesCountry = true;
    if (filterCountry !== 'ALL') {
        const cObj = (countries || []).find(c => c.id === filterCountry);
        if (cObj) {
            matchesCountry = u.country === cObj.id || u.country === cObj.name;
        } else {
            matchesCountry = u.country === filterCountry;
        }
    }

    return matchesRole && matchesSearch && matchesCountry;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search users..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            <select 
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none bg-white"
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value={UserRole.MENTEE}>Students</option>
              <option value={UserRole.MENTOR}>Teachers</option>
              <option value={UserRole.PROVIDER}>Providers</option>
              <option value={UserRole.ADMIN}>Admins</option>
            </select>

            <select
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none bg-white"
              value={filterCountry}
              onChange={e => setFilterCountry(e.target.value)}
            >
              <option value="ALL">All Countries</option>
              {(countries || []).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold flex items-center hover:bg-slate-800"
            >
                <Plus size={18} className="mr-2" /> Add User
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Mentor Cancel</th>
                <th className="px-6 py-4">Mentee Cancel</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">{filteredUsers.map(user => {
                  const fullUser = getFullUserDetails(user);
                  const isSelf = user.id === currentUser?.id;
                  const mentorStats = mentorCancelStats[user.id];
                  const menteeStats = menteeCancelStats[user.id];
                  
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                        <img src={user.avatar || '/default-avatar.png'} alt="" className="w-10 h-10 rounded-full bg-slate-200" />
                        <div>
                            <div className="font-bold text-slate-900">
                                {user.name || 'Unknown'} {isSelf && <span className="ml-1 text-[10px] bg-brand-100 text-brand-700 px-1 rounded">You</span>}
                            </div>
                            <div className="text-xs text-slate-500">{user.email || 'No email'}</div>
                        </div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                            user.role === 'MENTOR' ? 'bg-purple-100 text-purple-700' :
                            user.role === 'PROVIDER' ? 'bg-orange-100 text-orange-700' :
                            user.role === 'ADMIN' ? 'bg-slate-900 text-white' :
                            'bg-blue-100 text-blue-700'
                        }`}>{user.role === 'MENTOR' ? 'TEACHER' : user.role === 'MENTEE' ? 'STUDENT' : user.role}</span>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-slate-600 font-mono">{user.country || '-'}</div>
                        <div className="text-xs text-slate-400">{user.timezone || 'UTC'}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
                    <td className="px-6 py-4">
                        {user.role === UserRole.MENTOR && mentorStats ? (
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    mentorStats.cancellationCount >= 3 ? 'bg-red-100 text-red-700' :
                                    mentorStats.cancellationCount >= 2 ? 'bg-orange-100 text-orange-700' :
                                    mentorStats.cancellationCount >= 1 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                }`}>
                                    {mentorStats.cancellationCount}/3
                                </span>
                                {mentorStats.cancellationCount > 0 && (
                                    <button
                                        onClick={() => handleResetCancellationCount(user.id, user.name)}
                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Reset mentor cancellation counter"
                                    >
                                        <RotateCcw size={14} />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <span className="text-slate-400 text-xs">-</span>
                        )}
                    </td>
                    <td className="px-6 py-4">
                        {user.role === UserRole.MENTEE && menteeStats ? (
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    menteeStats.cancellationCount >= 3 ? 'bg-red-100 text-red-700' :
                                    menteeStats.cancellationCount >= 2 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                }`}>
                                    {menteeStats.cancellationCount}/3
                                </span>
                                {menteeStats.cancellationCount > 0 && (
                                    <button
                                        onClick={() => handleResetMenteeCancellationCount(user.id, user.name)}
                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Reset mentee cancellation counter"
                                    >
                                        <RotateCcw size={14} />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <span className="text-slate-400 text-xs">-</span>
                        )}
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                            {/* View Details - Navigate to detail page for all info and editing */}
                            <button 
                                onClick={() => navigate(`/admin/users/${user.id}`)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                                title="View & Edit Details"
                            >
                                <Eye size={18} />
                            </button>
                            
                            {/* Quick actions - only for non-self users */}
                            {!isSelf && (
                                <>
                                    <button 
                                        onClick={() => { setSelectedUser(user); setActionType('RESET_PASSWORD'); }} 
                                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" 
                                        title="Reset Password"
                                    >
                                        <Lock size={18} />
                                    </button>
                                    
                                    {user.status === 'BANNED' ? (
                                    <button onClick={() => { setSelectedUser(user); setActionType('UNBAN'); }} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Unban">
                                        <ShieldCheck size={18} />
                                    </button>
                                    ) : (
                                    <button onClick={() => { setSelectedUser(user); setActionType('BAN'); }} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Ban">
                                        <ShieldOff size={18} />
                                    </button>
                                    )}

                                    <button 
                                        onClick={() => { setSelectedUser(user); setActionType('DELETE'); }} 
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </>
                            )}
                        </div>
                    </td>
                    </tr>
                  );
              })}
              {filteredUsers.length === 0 && (
                  <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">No users found.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!selectedUser && actionType !== 'RESET_PASSWORD'}
        onClose={() => setSelectedUser(null)}
        onConfirm={handleAction}
        title={actionType === 'BAN' ? 'Ban User' : actionType === 'UNBAN' ? 'Unban User' : 'Delete User'}
        message={`Are you sure you want to ${actionType?.toLowerCase()} ${selectedUser?.name}? This action cannot be undone.`}
        type={actionType === 'UNBAN' ? 'info' : 'danger'}
      />

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleCreateUser}
      />

      <ResetPasswordModal
        isOpen={actionType === 'RESET_PASSWORD'}
        onClose={() => { setSelectedUser(null); setActionType(null); }}
        onConfirm={handleResetPassword}
        userName={selectedUser?.name || ''}
      />
    </AdminLayout>
  );
}
