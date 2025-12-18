
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { AdminLayout, StatusBadge, ConfirmDialog, EditUserForm, AddUserModal, ResetPasswordModal } from '../components/AdminComponents';
import { User, UserRole, Mentor, Provider, PricingCountry } from '../types';
import { Search, Edit2, Trash2, ShieldCheck, ShieldOff, Plus, Lock, Eye } from 'lucide-react';
import { useApp } from '../App';

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user: currentUser } = useApp(); // Lấy thông tin admin đang đăng nhập
  const [users, setUsers] = useState<User[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  
  // Filter States
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterCountry, setFilterCountry] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  
  // Data for filters
  const [countries, setCountries] = useState<PricingCountry[]>([]);
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'BAN' | 'UNBAN' | 'DELETE' | 'EDIT' | 'RESET_PASSWORD' | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchAllData = async () => {
    const u = await api.getUsers();
    const m = await api.getMentors();
    const p = await api.getProviders();
    const c = await api.getPricingCountries();
    setUsers(u);
    setMentors(m);
    setProviders(p);
    setCountries(c);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleAction = async () => {
    if (!selectedUser || !actionType) return;
    
    if (actionType === 'DELETE') {
        await api.deleteUser(selectedUser.id);
        await api.logAction('USER_DELETE', `Admin deleted user ${selectedUser.name} (${selectedUser.id})`, currentUser?.id || 'admin');
    } else if (actionType === 'BAN' || actionType === 'UNBAN') {
        const newStatus = actionType === 'BAN' ? 'BANNED' : 'ACTIVE';
        await api.updateUserStatus(selectedUser.id, newStatus);
        await api.logAction(`USER_${actionType}`, `Admin changed status of ${selectedUser.name} to ${newStatus}`, currentUser?.id || 'admin');
    }
    
    fetchAllData();
    setSelectedUser(null);
    setActionType(null);
  };

  const handleSaveEdit = async (id: string, data: any) => {
      await api.updateUser(id, data);
      await api.logAction('USER_UPDATE', `Admin updated profile for ${data.name}`, currentUser?.id || 'admin');
      fetchAllData();
  };

  const handleCreateUser = async (data: any) => {
      await api.createUser(data);
      await api.logAction('USER_CREATE', `Admin created new user ${data.name} (${data.role})`, currentUser?.id || 'admin');
      fetchAllData();
  };

  const handleResetPassword = async (password: string) => {
      if(!selectedUser) return;
      await api.resetPassword(selectedUser.id, password);
      await api.logAction('PASSWORD_RESET', `Admin reset password for ${selectedUser.name}`, currentUser?.id || 'admin');
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

  const filteredUsers = users.filter(u => {
    const matchesRole = filterRole === 'ALL' || u.role === filterRole;
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    
    let matchesCountry = true;
    if (filterCountry !== 'ALL') {
        const cObj = countries.find(c => c.id === filterCountry);
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
              <option value={UserRole.MENTEE}>Mentees</option>
              <option value={UserRole.MENTOR}>Mentors</option>
              <option value={UserRole.PROVIDER}>Providers</option>
              <option value={UserRole.ADMIN}>Admins</option>
            </select>

            <select 
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none bg-white"
              value={filterCountry}
              onChange={e => setFilterCountry(e.target.value)}
            >
              <option value="ALL">All Countries</option>
              {countries.map(c => (
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
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => {
                  const fullUser = getFullUserDetails(user);
                  const isSelf = user.id === currentUser?.id;
                  
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                        <img src={user.avatar} alt="" className="w-10 h-10 rounded-full bg-slate-200" />
                        <div>
                            <div className="font-bold text-slate-900">
                                {user.name} {isSelf && <span className="ml-1 text-[10px] bg-brand-100 text-brand-700 px-1 rounded">You</span>}
                            </div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                            user.role === 'MENTOR' ? 'bg-purple-100 text-purple-700' :
                            user.role === 'PROVIDER' ? 'bg-orange-100 text-orange-700' :
                            user.role === 'ADMIN' ? 'bg-slate-900 text-white' :
                            'bg-blue-100 text-blue-700'
                        }`}>{user.role}</span>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-slate-600">{user.phone || '-'}</div>
                        <div className="text-xs text-slate-400 font-mono">{user.country || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{new Date(user.joinedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                            {/* Cho phép xem chi tiết cho mọi role */}
                            <button 
                                onClick={() => navigate(`/admin/users/${user.id}`)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" 
                                title="Manage User Details"
                            >
                                <Eye size={18} />
                            </button>
                            
                            {/* Không cho tự xóa/khóa chính mình */}
                            {!isSelf && (
                                <>
                                    <button 
                                        onClick={() => { setSelectedUser(user); setActionType('RESET_PASSWORD'); }} 
                                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg" 
                                        title="Reset Password"
                                    >
                                        <Lock size={18} />
                                    </button>
                                    <button 
                                        onClick={() => { setSelectedUser(fullUser); setActionType('EDIT'); }} 
                                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg" 
                                        title="Edit"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    
                                    {user.status === 'BANNED' ? (
                                    <button onClick={() => { setSelectedUser(user); setActionType('UNBAN'); }} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Unban">
                                        <ShieldCheck size={18} />
                                    </button>
                                    ) : (
                                    <button onClick={() => { setSelectedUser(user); setActionType('BAN'); }} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg" title="Ban">
                                        <ShieldOff size={18} />
                                    </button>
                                    )}

                                    <button 
                                        onClick={() => { setSelectedUser(user); setActionType('DELETE'); }} 
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg" 
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
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No users found.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={!!selectedUser && actionType !== 'EDIT' && actionType !== 'RESET_PASSWORD'}
        onClose={() => setSelectedUser(null)}
        onConfirm={handleAction}
        title={actionType === 'BAN' ? 'Ban User' : actionType === 'UNBAN' ? 'Unban User' : 'Delete User'}
        message={`Are you sure you want to ${actionType?.toLowerCase()} ${selectedUser?.name}? This action cannot be undone.`}
        type={actionType === 'UNBAN' ? 'info' : 'danger'}
      />

      <EditUserForm 
        isOpen={actionType === 'EDIT'}
        onClose={() => { setSelectedUser(null); setActionType(null); }}
        user={selectedUser}
        onSave={handleSaveEdit}
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
