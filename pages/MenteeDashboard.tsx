
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../App';
import { api } from '../services/api';
import { Booking, UserRole, Homework, CreditHistoryEntry, BookingStatus, Conversation } from '../types';
import { Clock, FileText, Wallet, Plus, CheckCircle, ChevronRight, Video, Calendar, ArrowUpRight, ArrowDownLeft, MessageSquare } from 'lucide-react';
import { translations } from '../lib/i18n';
import { TopUpModal } from '../components/TopUpModal';
import { HomeworkModal } from '../components/Mentee/HomeworkModal';
import { ChatWindow } from '../components/Messages/ChatWindow';

interface Props {
  tab: 'home' | 'homework' | 'chat' | 'wallet';
}

export default function MenteeDashboard({ tab }: Props) {
  const { user, refreshUser, language } = useApp();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [creditHistory, setCreditHistory] = useState<CreditHistoryEntry[]>([]);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

  const t = translations[language].mentee;
  const commonT = translations[language].common;

  const fetchData = async () => {
    if (!user) return;
    const [b, h] = await Promise.all([
        api.getBookings(user.id, UserRole.MENTEE),
        api.getHomework(user.id, UserRole.MENTEE)
    ]);
    setBookings(b);
    setHomeworks(h);

    if (tab === 'wallet') {
        const history = await api.getUserCreditHistory(user.id);
        setCreditHistory(history);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, tab]);

  const renderHome = () => {
      const upcoming = bookings
        .filter(b => b.status === BookingStatus.SCHEDULED && new Date(b.startTime) > new Date())
        .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      
      const nextBooking = upcoming.length > 0 ? upcoming[0] : null;

      return (
          <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
              {/* Header Banner */}
              <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                      <div className="flex-1 space-y-4">
                          <h1 className="text-4xl font-black">{t.welcome}, {user?.name.split(' ')[0]}!</h1>
                          <p className="text-slate-400 text-lg">{t.readyToLearn}</p>
                          
                          <div className="flex flex-wrap items-center gap-4 pt-4">
                              <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                                  <div className="text-[10px] uppercase font-black text-slate-400">{t.availableBalance}</div>
                                  <div className="font-black text-2xl">{user?.credits.toFixed(0)} Credits</div>
                              </div>
                              <button onClick={() => setIsTopUpOpen(true)} className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-brand-900/40">
                                + {t.topUp}
                              </button>
                          </div>
                      </div>
                      <div className="w-32 h-32 md:w-48 md:h-48 bg-brand-500/20 rounded-full blur-3xl absolute -right-10 -top-10"></div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                      <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight flex items-center gap-2">
                          <Clock className="text-brand-600" size={24} /> {t.nextLesson}
                      </h3>

                      {nextBooking ? (
                          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-8 items-center transition-all hover:shadow-md">
                              <div className="flex-shrink-0">
                                  <div className="w-24 h-24 bg-brand-50 rounded-3xl flex flex-col items-center justify-center text-brand-700 border border-brand-100">
                                      <span className="text-xs font-black uppercase">{new Date(nextBooking.startTime).toLocaleString('default', { month: 'short' })}</span>
                                      <span className="text-4xl font-black">{new Date(nextBooking.startTime).getDate()}</span>
                                  </div>
                              </div>
                              <div className="flex-1 text-center sm:text-left">
                                  <h4 className="text-2xl font-black text-slate-900">{nextBooking.mentorName}</h4>
                                  <p className="text-slate-500 mb-6 font-medium">
                                      {new Date(nextBooking.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(nextBooking.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                  </p>
                                  <div className="flex gap-3 justify-center sm:justify-start">
                                      <a href={nextBooking.joinLink} target="_blank" rel="noreferrer" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800">
                                          <Video size={18} /> {commonT.enterClass}
                                      </a>
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-200 text-center border-dashed">
                              <Calendar size={48} className="mx-auto mb-4 text-slate-200" />
                              <h3 className="text-xl font-bold text-slate-900 mb-2">{t.noBookingsTitle}</h3>
                              <p className="text-slate-500 mb-8">{t.noBookingsDesc}</p>
                              <Link to="/mentee/find-mentor" className="inline-flex items-center px-8 py-3 bg-brand-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-brand-700 transition-all">
                                  {t.findMentorTitle} <ChevronRight size={18} className="ml-1" />
                              </Link>
                          </div>
                      )}
                  </div>

                  <div className="space-y-6">
                      <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight">{t.homeworkTitle}</h3>
                      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
                          {homeworks.filter(h => h.status === 'PENDING').length > 0 ? (
                              homeworks.filter(h => h.status === 'PENDING').slice(0, 3).map(h => (
                                  <div key={h.id} onClick={() => setSelectedHomework(h)} className="p-4 rounded-2xl bg-slate-50 hover:bg-brand-50 cursor-pointer border border-slate-100 transition-all">
                                      <div className="font-bold text-slate-900 text-sm truncate">{h.title}</div>
                                      <div className="text-[10px] font-black text-slate-400 uppercase mt-1">{t.validUntil}: {new Date(h.dueDate || '').toLocaleDateString()}</div>
                                  </div>
                              ))
                          ) : (
                              <div className="text-center py-6">
                                  <CheckCircle className="text-green-500 mx-auto mb-2" size={32} />
                                  <p className="text-slate-800 font-bold">{t.allDone}</p>
                              </div>
                          )}
                          <Link to="/mentee/homework" className="block text-center text-xs font-black uppercase text-brand-600 hover:underline">{commonT.viewAll}</Link>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const renderWallet = () => (
      <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{t.wallet}</h1>
          <div className="bg-slate-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                  <div>
                      <p className="text-slate-400 font-black uppercase tracking-widest text-[11px] mb-2">{t.availableBalance}</p>
                      <div className="text-6xl font-black tracking-tighter mb-4">{user?.credits.toFixed(0)} <span className="text-xl font-bold text-slate-600">Credits</span></div>
                      <p className="text-slate-500 font-bold italic">* Credits are used for 1:1 sessions.</p>
                  </div>
                  <button onClick={() => setIsTopUpOpen(true)} className="px-10 py-5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl transition-all flex items-center">
                      <Plus size={20} className="mr-2" /> {t.topUp}
                  </button>
              </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-black text-lg text-slate-800 uppercase tracking-tight">{t.transactionHistory}</h3>
              </div>
              <div className="divide-y divide-slate-50">
                  {creditHistory.length === 0 ? (
                      <div className="p-20 text-center text-slate-400 font-bold italic">No transactions yet.</div>
                  ) : (
                      creditHistory.map(h => (
                          <div key={h.id} className="p-6 hover:bg-slate-50/50 transition-colors flex items-center justify-between">
                              <div className="flex items-center gap-6">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${h.amount > 0 ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                      {h.amount > 0 ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                                  </div>
                                  <div>
                                      <div className="font-black text-slate-900 text-sm uppercase">{h.type}</div>
                                      <div className="text-[10px] font-black text-slate-400 uppercase mt-1">{new Date(h.timestamp).toLocaleString()}</div>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className={`font-mono font-black text-lg ${h.amount > 0 ? 'text-green-600' : 'text-slate-900'}`}>
                                      {h.amount > 0 ? '+' : ''}{h.amount.toFixed(0)}
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-400">{h.note}</div>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      </div>
  );

  const renderChat = () => {
    const supportConversation: Conversation = {
        id: `conv_${user?.id}`,
        participantId: user?.id || '',
        participantName: "Admin Support",
        participantAvatar: "",
        participantRole: UserRole.ADMIN,
        assignedAdminId: null,
        status: 'OPEN',
        lastMessageAt: new Date().toISOString(),
        lastMessagePreview: 'Hello, how can we help?',
        unreadCount: 0
    };

    return (
        <div className="max-w-5xl mx-auto h-[calc(100vh-160px)] animate-fade-in">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-3">
                <MessageSquare size={32} className="text-brand-600" /> Live Support
            </h1>
            <ChatWindow 
                currentUserId={user?.id || ''}
                currentUserRole={user?.role || UserRole.MENTEE}
                conversation={supportConversation}
            />
        </div>
    );
  };

  return (
    <div className="pb-16">
        {tab === 'home' && renderHome()}
        {tab === 'wallet' && renderWallet()}
        {tab === 'chat' && renderChat()}
        {tab === 'homework' && (
            <div className="max-w-5xl mx-auto space-y-6">
                <h1 className="text-3xl font-black text-slate-900 uppercase">{t.homeworkTitle}</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {homeworks.map(h => (
                        <div key={h.id} onClick={() => setSelectedHomework(h)} className="bg-white p-6 rounded-3xl border border-slate-200 hover:shadow-xl transition-all cursor-pointer">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${h.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                    {h.status}
                                </span>
                                <FileText className="text-slate-200" size={24} />
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 mb-2">{h.title}</h3>
                            <p className="text-slate-500 text-sm line-clamp-2">{h.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <TopUpModal 
            isOpen={isTopUpOpen} 
            onClose={() => setIsTopUpOpen(false)} 
            onSuccess={async () => { await refreshUser(); fetchData(); }} 
            userId={user!.id} 
        />
        {selectedHomework && (
            <HomeworkModal 
                isOpen={!!selectedHomework} 
                onClose={() => setSelectedHomework(null)} 
                homework={selectedHomework} 
                onRefresh={fetchData} 
            />
        )}
    </div>
  );
}
