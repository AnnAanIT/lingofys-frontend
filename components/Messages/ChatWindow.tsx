
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { Message, UserRole, Conversation } from '../../types';
import { Send, Lock, User as UserIcon, ShieldCheck, CheckCheck, Loader2, Sparkles } from 'lucide-react';
import { BRAND } from '../../constants/brand';

interface ChatWindowProps {
    currentUserRole: UserRole;
    currentUserId: string;
    conversation: Conversation;
    onMessageSent?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
    currentUserRole, currentUserId, conversation, onMessageSent
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    const isAdmin = currentUserRole === UserRole.ADMIN;
    const recipientName = isAdmin ? conversation.participantName : "Admin Support";
    const recipientRole = isAdmin ? conversation.participantRole : UserRole.ADMIN;

    const canReply = !isAdmin || (conversation.assignedAdminId === currentUserId || conversation.assignedAdminId === null);

    const loadMessages = async () => {
        try {
            // Skip loading for temp conversations (will have messages after first send)
            if (conversation.id.startsWith('temp_')) {
                setMessages([]);
                setLoading(false);
                return;
            }
            
            const msgs = await api.getMessages(conversation.id);
            setMessages(msgs || []);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load messages:', error);
            setMessages([]);
            setLoading(false);
        }
    };

    const markRead = async () => {
        try {
            // Skip for temp conversations
            if (conversation.id.startsWith('temp_')) {
                return;
            }
            await api.markAsRead(conversation.id);
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    useEffect(() => {
        setLoading(true);
        loadMessages();
        markRead();
        const interval = setInterval(() => {
            loadMessages();
            markRead();
        }, 15000); // Reduced from 5s to 15s to prevent 429 errors
        return () => clearInterval(interval);
    }, [conversation.id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const content = input;
        setInput(''); 

        try {
            // Backend API expects receiverId and content (senderId comes from auth token)
            const receiverId = isAdmin ? conversation.participantId : 'admin';
            await api.sendMessage(receiverId, content);
            await loadMessages();
            if (onMessageSent) onMessageSent();
        } catch (error: any) {
            alert(error);
        }
    };

    const getParticipantColor = (role: string) => {
        switch(role) {
            case 'ADMIN': return 'bg-slate-900 text-white';
            case 'MENTOR': return 'bg-purple-100 text-purple-600';
            case 'PROVIDER': return 'bg-orange-100 text-orange-600';
            default: return 'bg-blue-100 text-blue-600';
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getParticipantColor(recipientRole)}`}>
                        {recipientRole === 'ADMIN' ? <ShieldCheck size={20} /> : <UserIcon size={20} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            {recipientName}
                            {recipientRole === 'ADMIN' && <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] rounded-full uppercase font-bold">Support</span>}
                        </h3>
                        <p className="text-xs text-slate-500">
                            {isAdmin && conversation.assignedAdminId 
                                ? (conversation.assignedAdminId === currentUserId ? "Assigned to you" : `Assigned to ${conversation.assignedAdminId}`)
                                : (recipientRole === 'ADMIN' ? 'Secure Support Line' : `${conversation.participantRole} • ID: ${conversation.participantId}`)
                            }
                        </p>
                    </div>
                </div>
                <div className="hidden md:flex items-center text-xs text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                    <Lock size={12} className="mr-1" /> Encrypted
                </div>
            </div>

            {/* Message Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 custom-scrollbar scroll-smooth">
                {loading && messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <Loader2 className="animate-spin mb-2" size={32} />
                        <span className="text-sm">Connecting...</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                            <Sparkles className="text-brand-400" size={32} />
                        </div>
                        <h4 className="font-bold text-slate-800">Start the conversation</h4>
                        <p className="text-xs text-slate-500 max-w-[200px] mt-2">Send a message to begin your secure session with {recipientName}.</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.fromId === currentUserId;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all animate-fade-in ${
                                    isMe 
                                        ? 'bg-brand-600 text-white rounded-tr-none' 
                                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                }`}>
                                    <p className="leading-relaxed">{msg.content}</p>
                                    <div className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-brand-100' : 'text-slate-400'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                                        {isMe && msg.read && <CheckCheck size={10} />}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                {!canReply ? (
                    <div className="bg-yellow-50 text-yellow-800 p-3 rounded-xl text-center text-xs font-bold border border-yellow-100">
                        This conversation is being handled by another administrator.
                    </div>
                ) : (
                    <form onSubmit={handleSend} className="flex gap-2">
                        <input 
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={recipientRole === 'ADMIN' ? "How can we help?" : "Reply to user..."}
                            className="flex-1 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 transition-all text-sm"
                        />
                        <button 
                            type="submit" 
                            disabled={!input.trim()}
                            className="p-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-brand-100 active:scale-95"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                )}
                <p className="text-[9px] text-center text-slate-400 mt-2 font-medium">
                    {recipientRole === 'ADMIN' ? BRAND.supportChannelName : 'Response time: Usually < 5 mins'}
                </p>
            </div>
        </div>
    );
};
