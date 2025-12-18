
import React from 'react';
import { Conversation } from '../../types';
import { User, Search, Clock } from 'lucide-react';

interface ConversationListProps {
    conversations: Conversation[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    currentAdminId: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({ conversations, selectedId, onSelect, currentAdminId }) => {
    
    const getRoleBadgeStyle = (role: string) => {
        switch(role) {
            case 'MENTOR': return 'bg-purple-100 text-purple-700';
            case 'PROVIDER': return 'bg-orange-100 text-orange-700';
            default: return 'bg-blue-100 text-blue-700';
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border-r border-slate-200 w-96 flex-shrink-0">
            <div className="p-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800 mb-4">Shared Inbox</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search user..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {conversations.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">No conversations yet.</div>
                ) : (
                    conversations.map(c => {
                        const isAssignedToMe = c.assignedAdminId === currentAdminId;
                        const isUnassigned = !c.assignedAdminId;
                        
                        return (
                            <div 
                                key={c.id}
                                onClick={() => onSelect(c.id)}
                                className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors relative ${selectedId === c.id ? 'bg-brand-50 border-l-4 border-l-brand-600' : 'border-l-4 border-l-transparent'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="font-bold text-slate-900 text-sm truncate max-w-[120px]">{c.participantName}</div>
                                    <span className="text-[10px] text-slate-400 flex items-center">
                                        <Clock size={10} className="mr-1"/>
                                        {new Date(c.lastMessageAt).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                    </span>
                                </div>
                                
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${getRoleBadgeStyle(c.participantRole)}`}>
                                        {c.participantRole}
                                    </span>
                                    {c.unreadCount > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full min-w-[18px] text-center">
                                            {c.unreadCount}
                                        </span>
                                    )}
                                </div>

                                <div className="flex justify-between items-end">
                                    <p className="text-xs text-slate-500 truncate max-w-[150px]">{c.lastMessagePreview}</p>
                                    <div className="text-[10px]">
                                        {isAssignedToMe ? (
                                            <span className="text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">You</span>
                                        ) : isUnassigned ? (
                                            <span className="text-slate-400 italic">Unassigned</span>
                                        ) : (
                                            <span className="text-slate-400">Locked</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
