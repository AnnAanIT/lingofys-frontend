
import React, { useState, useEffect } from 'react';
import { X, Search, User as UserIcon, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';
import { User, UserRole } from '../../types';

interface NewChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectUser: (user: User) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onSelectUser }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            api.getUsers().then(data => {
                // Chỉ lấy những người không phải Admin khác (hoặc tùy nhu cầu, ở đây lấy tất cả non-admin)
                setUsers(data.filter(u => u.role !== UserRole.ADMIN));
                setLoading(false);
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh] animate-slide-up">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900">Start New Conversation</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                        <input 
                            type="text"
                            placeholder="Search by name or email..."
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {loading ? (
                        <div className="text-center py-10 text-slate-400 text-sm">Loading users...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-sm">No users found.</div>
                    ) : (
                        filteredUsers.map(u => (
                            <button 
                                key={u.id}
                                onClick={() => { onSelectUser(u); onClose(); }}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-brand-50 transition-colors text-left group"
                            >
                                <img src={u.avatar} alt="" className="w-10 h-10 rounded-full bg-slate-100 object-cover" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-900 truncate group-hover:text-brand-700">{u.name}</div>
                                    <div className="text-xs text-slate-500 truncate">{u.role} • {u.email}</div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 text-brand-500">
                                    <MessageSquare size={18} />
                                </div>
                            </button>
                        ))
                    )}
                </div>

                <div className="p-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
                        Proactive Support Mode
                    </p>
                </div>
            </div>
        </div>
    );
};
