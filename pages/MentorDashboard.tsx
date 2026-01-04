
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { api } from '../services/api';
import { Booking, UserRole, BookingStatus, AvailabilitySlot, MentorEarning, Conversation, Homework } from '../types';
import { WeeklyCalendar } from '../components/Calendar';
import { LessonModal, HomeworkCard } from '../components/MentorComponents';
import { AddAvailabilityModal } from '../components/AddAvailabilityModal';
import { EditAvailabilityModal } from '../components/EditAvailabilityModal';
import { MentorHomeworkModal } from '../components/Mentor/MentorHomeworkModal';
import { createAbsoluteDate, getTimezoneByCountry } from '../lib/timeUtils';
import { DollarSign, Clock, CheckCircle, TrendingUp, Wallet, RefreshCw, Calendar as CalendarIcon, MessageSquare, FileText, GraduationCap } from 'lucide-react';
import { ChatWindow } from '../components/Messages/ChatWindow';
import { translations } from '../lib/i18n';
import { useToast } from '../components/ui/Toast';

interface Props {
  tab: 'home' | 'calendar' | 'chat' | 'homework' | 'earnings';
}

export default function MentorDashboard({ tab }: Props) {
  const { user } = useApp();
  const navigate = useNavigate();
  const { success, error: showError, warning } = useToast();
  const t = translations['en'].mentor; // Mentor always uses English
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [balance, setBalance] = useState({ payable: 0, paid: 0, pending: 0 });
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatConvId, setChatConvId] = useState<string>('');  // ✅ FIX: Move state to top level

  // Modals for Bookings
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // Modals for Availability
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [initialSlotDate, setInitialSlotDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

  // Modal for Homework
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

  const fetchData = async () => {
    if(!user) return;
    setLoading(true);
    try {
        const promises: any[] = [
            api.getBookings(),
            api.getAvailability(user.id),
            api.getMentorBalanceDetails(user.id)
        ];

        // Only fetch homework when on homework tab
        if (tab === 'homework') {
            promises.push(api.getHomework());
        }

        const results = await Promise.all(promises);
        setBookings(results[0] || []);
        setAvailability(results[1] || []);
        setBalance(results[2] || { payable: 0, paid: 0, pending: 0 });

        if (tab === 'homework' && results[3]) {
            setHomeworks(results[3] || []);
        }
    } catch (err) {
        console.error(err);
        setBookings([]);
        setAvailability([]);
        setBalance({ payable: 0, paid: 0, pending: 0 });
        setHomeworks([]);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, tab]);

  // ✅ FIX: Load conversation ID at top level (no hooks inside renderChat)
  useEffect(() => {
    if (user?.id && tab === 'chat') {
      // Try to get existing conversations to find real ID
      api.getConversations(user.id)
        .then(convos => {
          const adminConv = convos.find(c => c.participantRole === UserRole.ADMIN);
          if (adminConv) {
            setChatConvId(adminConv.id);  // ✅ Use real UUID
          } else {
            setChatConvId(`conv_${user.id}`);  // Fallback to temp ID
          }
        })
        .catch(() => {
          setChatConvId(`conv_${user.id}`);  // Fallback on error
        });
    }
  }, [user?.id, tab]);

  const handleSaveNewSlot = async (slotData: Omit<AvailabilitySlot, 'id' | 'mentorId'>) => {
      if (!user) return;
      try {
          // Get current availability and add new slot
          const currentSlots = await api.getAvailability(user.id);
          const newSlot: AvailabilitySlot = {
            id: `temp-${Date.now()}`,
            mentorId: user.id,
            ...slotData
          };
          await api.addAvailability(user.id, [...currentSlots, newSlot]);
          await fetchData();
          setIsAddSlotOpen(false);
          success(t.slotRegistered, 'New availability slot has been added to your schedule');
      } catch (err: any) {
          showError(t.errorSavingSlot, err.message || String(err));
      }
  };

  const handleUpdateSlot = async (id: string, updates: Partial<AvailabilitySlot>) => {
      if (!user) return;
      try {
          // Get current availability and update the specific slot
          const currentSlots = await api.getAvailability(user.id);
          const updatedSlots = currentSlots.map(slot =>
            slot.id === id ? { ...slot, ...updates } : slot
          );
          await api.updateAvailability(user.id, updatedSlots);
          await fetchData();
          setSelectedSlot(null);
          success(t.slotUpdated, 'Availability slot has been updated successfully');
      } catch (err: any) {
          showError(t.errorUpdating, err.message || String(err));
      }
  };

  const handleDeleteSlot = async (id: string) => {
      if (!user) return;
      try {
          // Get current availability, find the slot, and use its properties for delete
          const currentSlots = await api.getAvailability(user.id);
          const slotToDelete = currentSlots.find(slot => slot.id === id);
          if (slotToDelete) {
            // Convert day name to dayOfWeek number
            const dayMap: {[key: string]: number} = {
              'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
            };
            const dayNum = dayMap[slotToDelete.day];
            await api.deleteAvailability(user.id, dayNum, slotToDelete.startTime);
          }
          await fetchData();
          setSelectedSlot(null);
          success(t.slotDeleted, 'Availability slot has been removed from your schedule');
      } catch (err: any) {
          showError(t.errorDeleting, err.message || String(err));
      }
  };

  const renderEarnings = () => (
      <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
          <h1 className="text-3xl font-black text-slate-900 uppercase">{t.earningsManagement}</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><DollarSign size={80} /></div>
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-2">{t.pending}</div>
                  <div className="text-4xl font-black text-slate-900">{balance.pending} Cr</div>
                  <div className="text-xs text-slate-400 mt-4">{t.fromUpcomingClasses}</div>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Wallet size={80} /></div>
                  <div className="text-[10px] font-black text-brand-600 uppercase mb-2">{t.payable}</div>
                  <div className="text-4xl font-black text-brand-600">{balance.payable} Cr</div>
                  <div className="text-xs text-slate-400 mt-4">{t.canRequestPayout}</div>
              </div>
              <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><CheckCircle size={80} /></div>
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-2">{t.paid}</div>
                  <div className="text-4xl font-black">{balance.paid} Cr</div>
                  <div className="text-xs text-slate-500 mt-4">{t.lifetimeEarnings}</div>
              </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 font-black text-slate-800 uppercase text-sm">{t.recentEarningsHistory}</div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase">
                          <tr>
                              <th className="px-6 py-4">{t.date}</th>
                              <th className="px-6 py-4">{t.student}</th>
                              <th className="px-6 py-4">{t.amount}</th>
                              <th className="px-6 py-4">{t.status}</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {bookings.filter(b => b.status === BookingStatus.COMPLETED).map(b => (
                              <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(b.startTime).toLocaleDateString()}</td>
                                  <td className="px-6 py-4 font-bold text-slate-900">{b.menteeName}</td>
                                  <td className="px-6 py-4 font-mono font-black">+{b.totalCost} Cr</td>
                                  <td className="px-6 py-4">
                                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-[10px] font-black uppercase">{t.credited}</span>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
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
        lastMessagePreview: 'How can we help you?',
        unreadCount: 0
    };

    return (
        <div className="max-w-5xl mx-auto h-[calc(100vh-160px)] animate-fade-in">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-3">
                <MessageSquare size={32} className="text-purple-600" /> {t.adminSupport}
            </h1>
            <ChatWindow
                currentUserId={user?.id || ''}
                currentUserRole={user?.role || UserRole.MENTOR}
                conversation={supportConversation}
            />
        </div>
    );
  };

  const mentorTz = user?.timezone || 'UTC';

  // Convert Booking and Availability data to Calendar format
  const bookingEvents = bookings.map(b => ({
      id: `booking-${b.id}`,
      title: b.menteeName,
      start: new Date(b.startTime),
      end: new Date(b.endTime),
      type: b.status === BookingStatus.SCHEDULED ? 'booked' : 'completed' as any
  }));

  // Create "Available" events from fixed slots (availability)
  const generateAvailabilityEvents = () => {
      const events: any[] = [];
      const today = new Date();

      for(let i=0; i<30; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: mentorTz });

          const slots = availability.filter(slot => slot.day === dayName);

          slots.forEach(slot => {
              const start = createAbsoluteDate(d, slot.startTime, mentorTz);
              const end = new Date(start.getTime() + slot.duration * 60000);

              const isBooked = bookings.some(b => {
                  if (!['SCHEDULED', 'COMPLETED'].includes(b.status)) return false;
                  const bTime = new Date(b.startTime).getTime();
                  return Math.abs(bTime - start.getTime()) < 1000;
              });

              if (!isBooked) {
                  events.push({
                      id: `avail-${slot.id}-${start.getTime()}`,
                      title: 'Available',
                      start,
                      end,
                      type: 'available',
                      isRecurring: slot.recurring,
                      slotId: slot.id
                  });
              }
          });
      }
      return events;
  };

  const allEvents = [...bookingEvents, ...generateAvailabilityEvents()];

  const handleEventClick = (eventId: string) => {
      if (eventId.startsWith('booking-')) {
          setSelectedBookingId(eventId.replace('booking-', ''));
      } else if (eventId.startsWith('avail-')) {
          const parts = eventId.split('-');
          const slotId = parts[1];
          const found = availability.find(s => s.id === slotId);
          if (found) setSelectedSlot(found);
      }
  };

  const handleSlotClick = (date: Date) => {
      setInitialSlotDate(date);
      setIsAddSlotOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
        {tab === 'home' && (
            <div className="space-y-8 animate-fade-in">
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">{t.welcome}, {user?.name}!</h2>
                        <p className="text-slate-500 mt-2 text-lg">{bookings.filter(b => b.status === BookingStatus.SCHEDULED).length} {t.upcomingLessons}.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-brand-50 p-6 rounded-3xl text-center border border-brand-100 min-w-[150px]">
                             <div className="text-3xl font-black text-brand-700">{user?.credits}</div>
                             <div className="text-[10px] font-black text-brand-600 uppercase mt-1">{t.availableCredits}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <button
                        onClick={() => navigate('/mentor/schedule')}
                        className="bg-slate-900 p-8 rounded-3xl text-white hover:bg-slate-800 transition-all flex items-center justify-between group"
                    >
                        <div className="text-left">
                            <CalendarIcon size={32} className="mb-4 text-brand-400" />
                            <h3 className="text-xl font-black uppercase">{t.manageSchedule}</h3>
                            <p className="text-slate-400 text-sm mt-1">{t.openMoreSlots}</p>
                        </div>
                        <TrendingUp className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 flex flex-col justify-center">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{t.mentorTip}</h3>
                        <p className="text-slate-700 italic font-medium">"{t.mentorTipDesc}"</p>
                    </div>
                </div>
            </div>
        )}

        {tab === 'calendar' && (
            <div className="h-[calc(100vh-160px)] animate-fade-in bg-white p-4 rounded-3xl border border-slate-200 flex flex-col relative">
                <div className="absolute top-8 right-10 z-30">
                    <button
                        onClick={fetchData}
                        className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 transition-all"
                        title={t.refreshCalendar}
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
                <div className="flex-1 min-h-0">
                    <WeeklyCalendar
                        events={allEvents}
                        viewMode="mentor"
                        timezone={mentorTz}
                        onEventClick={handleEventClick}
                        onSlotClick={handleSlotClick}
                    />
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-3xl flex items-center justify-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-100 border-l-2 border-blue-600"></div> {t.available}</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-100 border-l-2 border-blue-600"></div> {t.booked}</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-200 border-l-2 border-slate-400"></div> {t.completed}</div>
                </div>
            </div>
        )}

        {tab === 'chat' && renderChat()}

        {tab === 'homework' && (
            <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase">{t.assignedHomework}</h1>
                    <p className="text-slate-500 mt-2">{t.manageGradeHomework}</p>
                </div>

                {homeworks.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 md:p-16 text-center">
                        <div className="max-w-md mx-auto space-y-6">
                            <div className="w-24 h-24 mx-auto bg-purple-50 rounded-full flex items-center justify-center">
                                <GraduationCap size={48} className="text-purple-300" />
                            </div>

                            <div className="space-y-3">
                                <h2 className="text-2xl font-black text-slate-900">No Homework Assigned Yet</h2>
                                <p className="text-slate-500 text-base leading-relaxed">
                                    Create homework assignments for your students after completing lessons. <br/>
                                    Track submissions and provide valuable feedback!
                                </p>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-3">
                                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs">i</span>
                                    How to Create Homework
                                </h3>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li className="flex items-start gap-3">
                                        <span className="text-purple-600 font-bold mt-0.5">1.</span>
                                        <span>Complete a lesson with your student</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-purple-600 font-bold mt-0.5">2.</span>
                                        <span>Go to the lesson details page</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-purple-600 font-bold mt-0.5">3.</span>
                                        <span>Click "Create Homework" button</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-purple-600 font-bold mt-0.5">4.</span>
                                        <span>Enter assignment details and deadline</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-purple-600 font-bold mt-0.5">5.</span>
                                        <span>Student will submit work, then you can grade it here</span>
                                    </li>
                                </ul>
                            </div>

                            <button
                                onClick={() => navigate('/mentor/schedule')}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20"
                            >
                                <CalendarIcon size={18} />
                                View My Schedule
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-5">
                                <div className="text-xs font-black text-yellow-600 uppercase tracking-wider mb-1">Pending Submission</div>
                                <div className="text-3xl font-black text-yellow-700">
                                    {homeworks.filter(h => !h.submittedAt).length}
                                </div>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                                <div className="text-xs font-black text-blue-600 uppercase tracking-wider mb-1">To Grade</div>
                                <div className="text-3xl font-black text-blue-700">
                                    {homeworks.filter(h => h.submittedAt && !h.gradedAt).length}
                                </div>
                            </div>
                            <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
                                <div className="text-xs font-black text-green-600 uppercase tracking-wider mb-1">Graded</div>
                                <div className="text-3xl font-black text-green-700">
                                    {homeworks.filter(h => h.gradedAt).length}
                                </div>
                            </div>
                        </div>

                        {/* Homework List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {homeworks.map(h => (
                                <HomeworkCard
                                    key={h.id}
                                    homework={h}
                                    role="MENTOR"
                                    onClick={() => setSelectedHomework(h)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}

        {tab === 'earnings' && renderEarnings()}

        {/* --- MODALS --- */}

        {/* Modal to manage booked lessons */}
        {selectedBookingId && (
            <LessonModal
                isOpen={!!selectedBookingId}
                onClose={() => setSelectedBookingId(null)}
                booking={bookings.find(b => b.id === selectedBookingId)!}
                onAction={async (action, data) => {
                    if(!selectedBookingId) return;
                    
                    if (action === 'COMPLETE') {
                        await api.updateBookingStatus(selectedBookingId, BookingStatus.COMPLETED);
                    } else if (action === 'RESCHEDULE' && data?.newStart) {
                        // ❌ REMOVED: Mentor không thể reschedule
                        // Mentor phải cancel và để mentee book lại
                        warning('Reschedule Not Allowed', 'Mentors cannot reschedule bookings. Please cancel and let the mentee book a new time.');
                        return; // Don't proceed
                    } else if (action === 'NO_SHOW') {
                        await api.updateBookingStatus(selectedBookingId, BookingStatus.NO_SHOW);
                    } else if (action === 'CANCEL') {
                        try {
                            const result = await api.cancelBookingAsMentor(selectedBookingId);
                            // Show success message with stats
                            if (result.cancellationStats.wasLateCancellation) {
                                success('Booking Canceled', `You have ${result.cancellationStats.remaining} late cancellations remaining this month.`);
                            } else {
                                success('Booking Canceled', 'Free cancellation - no limit count.');
                            }
                        } catch (error: any) {
                            // Show error (could be limit reached)
                            showError('Cancellation Failed', error.message || 'Failed to cancel booking');
                            return; // Don't close modal or refresh on error
                        }
                    }
                    
                    await fetchData();
                    setSelectedBookingId(null);
                }}
            />
        )}

        {/* Modal to add availability */}
        <AddAvailabilityModal
            isOpen={isAddSlotOpen}
            onClose={() => { setIsAddSlotOpen(false); setInitialSlotDate(null); }}
            onSave={handleSaveNewSlot}
            initialDate={initialSlotDate}
            timezone={mentorTz}
        />

        {/* Modal to edit/delete availability */}
        {selectedSlot && (
            <EditAvailabilityModal
                isOpen={!!selectedSlot}
                onClose={() => setSelectedSlot(null)}
                slot={selectedSlot}
                onUpdate={handleUpdateSlot}
                onDelete={handleDeleteSlot}
            />
        )}

        {/* Modal to grade homework */}
        {selectedHomework && (
            <MentorHomeworkModal
                isOpen={!!selectedHomework}
                onClose={() => setSelectedHomework(null)}
                homework={selectedHomework}
                onRefresh={fetchData}
            />
        )}
    </div>
  );
}
