
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { api } from '../services/api';
import { Booking, UserRole, Homework, CreditHistoryEntry, BookingStatus, Conversation } from '../types';
import { Clock, FileText, Wallet, Plus, CheckCircle, ChevronRight, Video, Calendar, ArrowUpRight, ArrowDownLeft, MessageSquare } from 'lucide-react';
import { translations } from '../lib/i18n';
import { HomeworkModal } from '../components/Mentee/HomeworkModal';
import { ChatWindow } from '../components/Messages/ChatWindow';
import { TopUpModal } from '../components/TopUpModal';
import { formatBookingTime, formatTimeRange, formatShortDate, formatDate } from '../utils/dateFormatters'; // ✅ FIX: Use centralized date formatters

interface Props {
  tab: 'home' | 'homework' | 'chat' | 'wallet';
}

export default function MenteeDashboard({ tab }: Props) {
  const { user, refreshUser, language } = useApp();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [creditHistory, setCreditHistory] = useState<CreditHistoryEntry[]>([]);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [chatConvId, setChatConvId] = useState<string>('');  // ✅ FIX: Move state to top level
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);

  const t = translations[language].mentee;
  const commonT = translations[language].common;

  // ✅ FIX BUG #2: Memoize fetchData to prevent infinite loop
  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [b, h, upcoming] = await Promise.all([
          api.getBookings(),
          api.getHomework(),
          api.getUpcomingBookings(5, false).catch(() => []) // Get 5 upcoming bookings (all, not just today), fallback to empty array on error
      ]);
      setBookings(b || []);
      setHomeworks(h || []);
      setUpcomingBookings(upcoming || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setBookings([]);
      setHomeworks([]);
      setUpcomingBookings([]);
    }

    if (tab === 'wallet') {
        const history = await api.getUserCreditHistory(user.id);
        setCreditHistory(history);
    }
  }, [user, tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ FIX: Load real conversation ID for chat
  useEffect(() => {
    if (user?.id && tab === 'chat') {
      api.getConversations(user.id)
        .then(convos => {
          const adminConv = convos.find(c => c.participantRole === UserRole.ADMIN);
          if (adminConv) {
            setChatConvId(adminConv.id);
          } else {
            setChatConvId(`conv_${user.id}`);  // Fallback to temp ID
          }
        })
        .catch(() => {
          setChatConvId(`conv_${user.id}`);  // Fallback on error
        });
    }
  }, [user?.id, tab]);

  const renderHome = () => {
      const upcoming = bookings
        .filter(b => b.status === BookingStatus.SCHEDULED && new Date(b.startTime) > new Date())
        .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      
      const nextBooking = upcoming.length > 0 ? upcoming[0] : null;

      return (
          <div className="space-y-6 md:space-y-8 animate-fade-in max-w-5xl mx-auto">
              {/* Header Banner */}
              <div className="bg-slate-900 rounded-2xl md:rounded-[2.5rem] p-6 md:p-12 text-white shadow-2xl relative overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8">
                      <div className="flex-1 space-y-3 md:space-y-4">
                          <h1 className="text-3xl md:text-4xl font-black leading-tight">{t.welcome}, {user?.name.split(' ')[0]}!</h1>
                          <p className="text-slate-400 text-base md:text-lg">{t.readyToLearn}</p>
                          
                          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 pt-3 md:pt-4">
                              <div className="bg-white/10 backdrop-blur-md px-5 md:px-6 py-3 rounded-2xl border border-white/10 w-full sm:w-auto">
                                  <div className="text-[10px] uppercase font-black text-slate-400 mb-1">{t.availableBalance}</div>
                                  <div className="font-black text-2xl md:text-3xl">{Number(user?.credits || 0).toFixed(2)} {t.creditsLabel}</div>
                              </div>
                              <button onClick={() => setIsTopUpOpen(true)} className="bg-brand-600 hover:bg-brand-500 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-brand-900/40 w-full sm:w-auto text-center">
                                + {t.topUp}
                              </button>
                          </div>
                      </div>
                      <div className="w-32 h-32 md:w-48 md:h-48 bg-brand-500/20 rounded-full blur-3xl absolute -right-10 -top-10"></div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                  <div className="lg:col-span-2 space-y-6">
                      <h3 className="font-black text-lg md:text-xl text-slate-800 uppercase tracking-tight flex items-center gap-2">
                          <Clock className="text-brand-600" size={24} /> {t.nextLesson}
                      </h3>

                      {nextBooking ? (
                          <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-6 md:gap-8 items-start sm:items-center transition-all hover:shadow-md">
                              <div className="flex-shrink-0">
                                  <div className="w-20 h-20 md:w-24 md:h-24 bg-brand-50 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center text-brand-700 border border-brand-100">
                                      <span className="text-[10px] font-black uppercase">{new Date(nextBooking.startTime).toLocaleString('default', { month: 'short' })}</span>
                                      <span className="text-3xl md:text-4xl font-black">{new Date(nextBooking.startTime).getDate()}</span>
                                  </div>
                              </div>
                              <div className="flex-1 w-full text-left">
                                  <h4 className="text-xl md:text-2xl font-black text-slate-900">{nextBooking.mentorName}</h4>
                                  <p className="text-slate-500 mb-4 md:mb-6 font-medium text-sm md:text-base">
                                      {formatTimeRange(nextBooking.startTime, nextBooking.endTime)}
                                  </p>
                                  <div className="flex gap-2 md:gap-3">
                                      <a href={nextBooking.joinLink} target="_blank" rel="noreferrer" className="px-5 md:px-6 py-3 md:py-3 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 flex-1 md:flex-none justify-center md:justify-start">
                                          <Video size={18} /> {commonT.enterClass}
                                      </a>
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <div className="bg-white rounded-2xl md:rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200 text-center border-dashed">
                              <Calendar size={48} className="mx-auto mb-4 text-slate-200" />
                              <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">{t.noBookingsTitle}</h3>
                              <p className="text-slate-500 mb-6 md:mb-8 text-sm md:text-base">{t.noBookingsDesc}</p>
                              <Link to="/mentee/find-mentor" className="inline-flex items-center px-6 md:px-8 py-3 md:py-3 bg-brand-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-brand-700 transition-all">
                                  {t.findMentorTitle} <ChevronRight size={18} className="ml-1" />
                              </Link>
                          </div>
                      )}

                      {/* Upcoming Bookings List */}
                      {(() => {
                          // Filter out the nextBooking to avoid duplicate display
                          const filteredUpcoming = nextBooking 
                              ? upcomingBookings.filter(b => b.id !== nextBooking.id)
                              : upcomingBookings;
                          
                          return filteredUpcoming.length > 0 && (
                              <div className="space-y-4 mt-6">
                                  <div className="flex items-center justify-between">
                                      <h3 className="font-black text-lg md:text-xl text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                          <Calendar className="text-brand-600" size={20} /> {t.upcomingBookings || 'Upcoming Bookings'}
                                      </h3>
                                      <Link 
                                          to="/mentee/bookings?tab=UPCOMING" 
                                          className="text-xs font-black uppercase text-brand-600 hover:underline"
                                      >
                                          {commonT.viewAll}
                                      </Link>
                                  </div>
                                  <div className="space-y-3">
                                      {filteredUpcoming.slice(0, 5).map(booking => {
                                      const bookingDate = new Date(booking.startTime);
                                      const isToday = bookingDate.toDateString() === new Date().toDateString();
                                      const isTomorrow = bookingDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
                                      
                                      let dateLabel = '';
                                      if (isToday) {
                                          dateLabel = commonT.today || 'Today';
                                      } else if (isTomorrow) {
                                          dateLabel = commonT.tomorrow || 'Tomorrow';
                                      } else {
                                          dateLabel = formatShortDate(booking.startTime);
                                      }

                                      return (
                                          <div 
                                              key={booking.id}
                                              className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer"
                                              onClick={() => navigate(`/mentee/bookings/${booking.id}`)}
                                          >
                                              <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center border border-brand-100">
                                                          {booking.mentorAvatar ? (
                                                              <img src={booking.mentorAvatar} alt={booking.mentorName} className="w-full h-full rounded-full object-cover" />
                                                          ) : (
                                                              <span className="text-brand-600 font-bold text-sm">{booking.mentorName.charAt(0)}</span>
                                                          )}
                                                      </div>
                                                      <div className="flex-1 min-w-0">
                                                          <div className="font-bold text-slate-900 truncate">{booking.mentorName}</div>
                                                          <div className="text-xs text-slate-500">
                                                              {dateLabel}, {formatBookingTime(booking.startTime)}
                                                          </div>
                                                      </div>
                                                  </div>
                                                  <ChevronRight className="flex-shrink-0 text-slate-400" size={18} />
                                              </div>
                                          </div>
                                      );
                                  })}
                                  </div>
                              </div>
                          );
                      })()}
                  </div>

                  <div className="space-y-6">
                      <h3 className="font-black text-lg md:text-xl text-slate-800 uppercase tracking-tight">{t.homeworkTitle}</h3>
                      <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 p-5 md:p-6 space-y-3 md:space-y-4">
                          {homeworks.filter(h => !h.submittedAt).length > 0 ? (
                              homeworks.filter(h => !h.submittedAt).slice(0, 3).map(h => (
                                  <div key={h.id} onClick={() => setSelectedHomework(h)} className="p-4 rounded-xl md:rounded-2xl bg-slate-50 hover:bg-brand-50 cursor-pointer border border-slate-100 transition-all">
                                      <div className="font-bold text-slate-900 text-sm truncate">{h.title}</div>
                                      <div className="text-[10px] font-black text-slate-400 uppercase mt-1">{t.validUntil}: {formatDate(h.dueDate || '')}</div>
                                  </div>
                              ))
                          ) : (
                              <div className="text-center py-6 md:py-8">
                                  {homeworks.length === 0 ? (
                                      <>
                                          <FileText className="text-slate-300 mx-auto mb-3" size={40} />
                                          <p className="text-slate-500 font-medium text-sm">No homework yet</p>
                                          <p className="text-slate-400 text-xs mt-1">Assignments will appear here</p>
                                      </>
                                  ) : (
                                      <>
                                          <CheckCircle className="text-green-500 mx-auto mb-2" size={32} />
                                          <p className="text-slate-800 font-bold text-sm">{t.allDone}</p>
                                      </>
                                  )}
                              </div>
                          )}
                          <Link to="/mentee/homework" className="block text-center text-xs font-black uppercase text-brand-600 hover:underline pt-2 md:pt-3">{commonT.viewAll}</Link>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const renderWallet = () => (
      <div className="space-y-6 md:space-y-8 animate-fade-in max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">{t.wallet}</h1>
          <div className="bg-slate-950 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-10">
                  <div className="flex-1">
                      <p className="text-slate-400 font-black uppercase tracking-widest text-[11px] mb-2">{t.availableBalance}</p>
                      <div className="text-4xl md:text-6xl font-black tracking-tighter mb-3 md:mb-4">{Number(user?.credits || 0).toFixed(2)} <span className="text-lg md:text-xl font-bold text-slate-600">{t.creditsLabel}</span></div>
                      <p className="text-slate-500 text-sm md:text-base">{t.creditsDescription}</p>
                  </div>
                  <button onClick={() => setIsTopUpOpen(true)} className="px-6 md:px-10 py-3 md:py-5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl transition-all flex items-center justify-center w-full md:w-auto">
                      <Plus size={20} className="mr-2" /> {t.topUp}
                  </button>
              </div>
          </div>

          <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 md:p-8 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-black text-base md:text-lg text-slate-800 uppercase tracking-tight">{t.transactionHistory}</h3>
              </div>
              <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
                  {creditHistory.length === 0 ? (
                      <div className="p-12 md:p-20 text-center text-slate-400 font-bold italic text-sm">{t.noTransactions}</div>
                  ) : (
                      creditHistory.map(h => (
                          <div key={h.id} className="p-4 md:p-6 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${h.amount > 0 ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                      {h.amount > 0 ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                                  </div>
                                  <div className="min-w-0">
                                      <div className="font-black text-slate-900 text-sm uppercase truncate">{h.type}</div>
                                      <div className="text-[10px] font-black text-slate-400 uppercase mt-1">{new Date(h.timestamp).toLocaleString()}</div>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className={`font-mono font-black text-lg ${h.amount > 0 ? 'text-green-600' : 'text-slate-900'}`}>
                                      {h.amount > 0 ? '+' : ''}{Number(h.amount).toFixed(2)}
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-400 text-right">{h.note}</div>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      </div>
  );

  const renderChat = () => {
    // ✅ FIX: Use state from top level (no hooks inside render function)
    const supportConversation: Conversation = {
        id: chatConvId || `conv_${user?.id}`,  // ✅ Use state from top level
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
                <MessageSquare size={32} className="text-brand-600" /> {t.liveSupport}
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
            <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
                <h1 className="text-3xl font-black text-slate-900 uppercase">{t.homeworkTitle}</h1>

                {homeworks.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 md:p-16 text-center">
                        <div className="max-w-md mx-auto space-y-6">
                            <div className="w-24 h-24 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
                                <FileText size={48} className="text-slate-300" />
                            </div>

                            <div className="space-y-3">
                                <h2 className="text-2xl font-black text-slate-900">No Homework Yet</h2>
                                <p className="text-slate-500 text-base leading-relaxed">
                                    Your teacher will assign homework after your lessons. <br/>
                                    Complete assignments to improve your English skills!
                                </p>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-3">
                                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-6 h-6 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs">i</span>
                                    How It Works
                                </h3>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li className="flex items-start gap-3">
                                        <span className="text-brand-600 font-bold mt-0.5">1.</span>
                                        <span>After each lesson, your teacher may assign homework</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-brand-600 font-bold mt-0.5">2.</span>
                                        <span>You'll see assignments here with due dates</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-brand-600 font-bold mt-0.5">3.</span>
                                        <span>Submit your work before the deadline</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-brand-600 font-bold mt-0.5">4.</span>
                                        <span>Get feedback and grades from your teacher</span>
                                    </li>
                                </ul>
                            </div>

                            <Link
                                to="/mentee/find-mentor"
                                className="inline-flex items-center gap-2 px-8 py-3 bg-brand-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
                            >
                                Book A Lesson <ChevronRight size={18} />
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {homeworks.map(h => {
                            const status = h.submittedAt ? (h.gradedAt ? 'REVIEWED' : 'SUBMITTED') : 'PENDING';
                            return (
                                <div key={h.id} onClick={() => setSelectedHomework(h)} className="bg-white p-6 rounded-3xl border border-slate-200 hover:shadow-xl transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                            {status}
                                        </span>
                                        <FileText className="text-slate-200" size={24} />
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-900 mb-2">{h.title}</h3>
                                    <p className="text-slate-500 text-sm line-clamp-2">{h.description}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        )}

        {selectedHomework && (
            <HomeworkModal
                isOpen={!!selectedHomework}
                onClose={() => setSelectedHomework(null)}
                homework={selectedHomework}
                onRefresh={fetchData}
            />
        )}

        <TopUpModal
            isOpen={isTopUpOpen}
            onClose={() => setIsTopUpOpen(false)}
            onSuccess={async () => { await refreshUser(); fetchData(); }}
            userId={user!.id}
        />
    </div>
  );
}
