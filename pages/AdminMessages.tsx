
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../App';
import { AdminLayout } from '../components/AdminComponents';
import { ConversationList } from '../components/Messages/ConversationList';
import { ChatWindow } from '../components/Messages/ChatWindow';
import { NewChatModal } from '../components/Admin/NewChatModal';
import { UserRole, Conversation, User } from '../types';
import { MessageSquare, UserPlus, Filter, Loader2, Inbox, PlusCircle, Users, GraduationCap, Building2 } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export default function AdminMessages() {
    const { user } = useApp();
    const { success, error: showError, warning } = useToast();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'UNASSIGNED' | 'MINE'>('ALL');
    const [roleFilter, setRoleFilter] = useState<'ALL' | 'MENTEE' | 'MENTOR' | 'PROVIDER'>('ALL');
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);

    const loadConversations = async () => {
        if (!user) return;
        try {
            const convos = await api.getConversations(user.id);
            // Sort by last message date
            setConversations(convos.sort((a,b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConversations();
        const interval = setInterval(loadConversations, 30000); // Reduced from 10s to 30s to prevent 429 errors
        return () => clearInterval(interval);
    }, [user]);

    const handleAssign = async (convId: string) => {
        if(!user) return;

        try {
            // Call API to assign conversation to current admin
            await api.assignConversation(convId);

            // Reload conversations to reflect the change
            await loadConversations();

            // Success message
            success('Assigned', 'Conversation has been assigned to you successfully');
        } catch (error: any) {
            // Handle errors
            const errorMessage = error.message || error.toString();

            if (errorMessage.includes('already assigned')) {
                warning('Already Assigned', 'This conversation was just taken by another admin.');
            } else if (errorMessage.includes('Only admins')) {
                showError('Permission Denied', 'Only admin users can assign conversations.');
            } else {
                showError('Assignment Failed', errorMessage);
            }

            // Reload conversations in case state changed
            await loadConversations();
        }
    };

    const handleStartNewChat = (targetUser: User) => {
        // SIMPLIFIED: Check if conversation already exists in loaded list
        const existing = conversations.find(c => c.participantId === targetUser.id);
        
        if (existing) {
            // Conversation already loaded, just select it
            setSelectedConvId(existing.id);
        } else {
            // No existing conversation - create temp one for UI
            // Backend will create real conversation on first message
            const tempConv: Conversation = {
                id: `temp_${targetUser.id}_${Date.now()}`, // Temporary ID for UI only
                participantId: targetUser.id,
                participantName: targetUser.name,
                participantAvatar: targetUser.avatar,
                participantRole: targetUser.role,
                assignedAdminId: user?.id || null,
                status: 'OPEN',
                lastMessageAt: new Date().toISOString(),
                lastMessagePreview: 'New conversation',
                unreadCount: 0
            };
            setConversations(prev => [tempConv, ...prev]);
            setSelectedConvId(tempConv.id);
        }
    };

    const filteredConversations = conversations.filter(c => {
        const matchesAssignment = 
            assignmentFilter === 'ALL' || 
            (assignmentFilter === 'UNASSIGNED' && !c.assignedAdminId) ||
            (assignmentFilter === 'MINE' && c.assignedAdminId === user?.id);
        
        const matchesRole = roleFilter === 'ALL' || c.participantRole === roleFilter;
        
        return matchesAssignment && matchesRole;
    });

    const selectedConvo = conversations.find(c => c.id === selectedConvId);

    return (
        <AdminLayout>
            <div className="h-[calc(100vh-100px)] bg-white rounded-2xl border border-slate-200 shadow-sm flex overflow-hidden">
                <div className="flex flex-col border-r border-slate-200 w-80 lg:w-96">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <Inbox size={18} className="text-brand-600" /> Support Inbox
                        </h2>
                        <button 
                            onClick={() => setIsNewChatOpen(true)}
                            className="p-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm shadow-brand-100"
                            title="New Message"
                        >
                            <PlusCircle size={18} />
                        </button>
                    </div>

                    {/* Filters: Assignment */}
                    <div className="flex items-center gap-1 p-2 bg-white border-b border-slate-200">
                        <button 
                            onClick={() => setAssignmentFilter('ALL')}
                            className={`flex-1 px-2 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${assignmentFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            All
                        </button>
                        <button 
                            onClick={() => setAssignmentFilter('MINE')}
                            className={`flex-1 px-2 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${assignmentFilter === 'MINE' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Mine
                        </button>
                        <button 
                            onClick={() => setAssignmentFilter('UNASSIGNED')}
                            className={`flex-1 px-2 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${assignmentFilter === 'UNASSIGNED' ? 'bg-orange-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Wait
                        </button>
                    </div>

                    {/* Filters: Roles */}
                    <div className="flex items-center gap-1 px-2 py-2 bg-slate-50 border-b border-slate-200">
                        <button onClick={() => setRoleFilter('ALL')} title="All Roles" className={`p-2 rounded-lg ${roleFilter === 'ALL' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}><Users size={14}/></button>
                        <button onClick={() => setRoleFilter('MENTEE')} title="Mentees" className={`p-2 rounded-lg ${roleFilter === 'MENTEE' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-400 hover:text-blue-500'}`}><GraduationCap size={14}/></button>
                        <button onClick={() => setRoleFilter('MENTOR')} title="Mentors" className={`p-2 rounded-lg ${roleFilter === 'MENTOR' ? 'bg-purple-100 text-purple-700 shadow-sm' : 'text-slate-400 hover:text-purple-500'}`}><Users size={14}/></button>
                        <button onClick={() => setRoleFilter('PROVIDER')} title="Providers" className={`p-2 rounded-lg ${roleFilter === 'PROVIDER' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-slate-400 hover:text-orange-500'}`}><Building2 size={14}/></button>
                    </div>
                    
                    <div className="flex-1 overflow-hidden">
                        <ConversationList 
                            conversations={filteredConversations} 
                            selectedId={selectedConvId} 
                            onSelect={setSelectedConvId} 
                            currentAdminId={user?.id || ''}
                        />
                    </div>
                </div>
                
                <div className="flex-1 bg-slate-50 flex flex-col relative">
                    {selectedConvId && selectedConvo ? (
                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                            {/* Admin Action Bar */}
                            {!selectedConvo.assignedAdminId ? (
                                <div className="bg-orange-50 border-b border-orange-100 p-3 flex justify-between items-center px-6 sticky top-0 z-10 shrink-0">
                                    <span className="text-xs text-orange-800 font-bold flex items-center">
                                        <MessageSquare size={14} className="mr-2" /> Unassigned Chat
                                    </span>
                                    <button 
                                        onClick={() => handleAssign(selectedConvo.id)}
                                        className="px-4 py-1.5 bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-orange-700 flex items-center transition-all"
                                    >
                                        <UserPlus size={14} className="mr-1" /> Take Ownership
                                    </button>
                                </div>
                            ) : selectedConvo.assignedAdminId !== user?.id && (
                                <div className="bg-slate-100 border-b border-slate-200 p-3 px-6 text-xs text-slate-500 flex items-center sticky top-0 z-10 shrink-0">
                                    <Filter size={14} className="mr-2" /> Handled by Admin: <strong className="ml-1 text-slate-700">{selectedConvo.assignedAdminId}</strong>
                                </div>
                            )}

                            <div className="flex-1 p-6 overflow-hidden">
                                <ChatWindow 
                                    currentUserRole={UserRole.ADMIN}
                                    currentUserId={user!.id}
                                    conversation={selectedConvo}
                                    onMessageSent={loadConversations}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                <Inbox size={40} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Inbox Clear</h3>
                            <p className="text-sm text-slate-500">Select a conversation or start a new one.</p>
                            <button 
                                onClick={() => setIsNewChatOpen(true)}
                                className="mt-4 px-6 py-2 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all flex items-center gap-2"
                            >
                                <PlusCircle size={18} /> New Message
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <NewChatModal 
                isOpen={isNewChatOpen}
                onClose={() => setIsNewChatOpen(false)}
                onSelectUser={handleStartNewChat}
            />
        </AdminLayout>
    );
}
