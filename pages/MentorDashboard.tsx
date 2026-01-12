
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
import { createAbsoluteDate, getTimezoneByCountry, formatInTimezone, convertTimezone } from '../lib/timeUtils';
import { DollarSign, Clock, CheckCircle, TrendingUp, Wallet, RefreshCw, Calendar as CalendarIcon, MessageSquare, FileText, GraduationCap, ChevronRight } from 'lucide-react';
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
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);

  // ✅ Phase 2.1: Data caching with stale-while-revalidate pattern
  const [dataCache, setDataCache] = useState<{
    bookings: Booking[];
    availability: AvailabilitySlot[];
    balance: { payable: 0, paid: 0, pending: 0 };
    lastFetch: number;
  } | null>(null);
  
  const CACHE_STALE_TIME = 5 * 60 * 1000; // 5 minutes

  // Modals for Bookings
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // Modals for Availability
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [initialSlotDate, setInitialSlotDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

  // Modal for Homework
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

  const fetchData = async (forceRefresh: boolean = false) => {
    if(!user) return;
    
    // ✅ Phase 2.1: Use cache if available and not stale (unless force refresh)
    const useCache = !forceRefresh && dataCache && (Date.now() - dataCache.lastFetch < CACHE_STALE_TIME);
    
    if (useCache) {
      // Use cached data immediately (stale-while-revalidate pattern)
      setBookings(dataCache.bookings);
      setAvailability(dataCache.availability);
      setBalance(dataCache.balance);
      // Don't show loading state, but still fetch in background
      setLoading(false);
    } else {
      setLoading(true);
    }
    
    try {
        const promises: any[] = [
            api.getBookings(),
            api.getAvailability(user.id),
            api.getMentorBalanceDetails(user.id),
            api.getUpcomingBookings(10, true) // Get up to 10 today's bookings (to account for past bookings being filtered out)
        ];

        // Only fetch homework when on homework tab
        if (tab === 'homework') {
            promises.push(api.getHomework());
        }

        const results = await Promise.all(promises.map(p => p.catch(() => null)));
        const newBookings = results[0] || [];
        const newAvailability = results[1] || [];
        const newBalance = results[2] || { payable: 0, paid: 0, pending: 0 };
        const newTodayBookings = results[3] || []; // Fallback to empty array if error
        
        // Update state
        setBookings(newBookings);
        setAvailability(newAvailability);
        setBalance(newBalance);
        setTodayBookings(newTodayBookings);

        // ✅ Phase 2.1: Update cache
        setDataCache({
          bookings: newBookings,
          availability: newAvailability,
          balance: newBalance,
          lastFetch: Date.now()
        });
        
        // Note: todayBookings not cached (always fresh for today)

        if (tab === 'homework' && results.length > 4) {
            setHomeworks(results[4] || []);
        }
    } catch (err) {
        console.error(err);
        // Only clear state if we don't have cache to fall back to
        if (!dataCache) {
          setBookings([]);
          setAvailability([]);
          setBalance({ payable: 0, paid: 0, pending: 0 });
          setHomeworks([]);
        }
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    // ✅ Phase 2.1: Only fetch if cache is stale or missing
    if (!dataCache || (Date.now() - dataCache.lastFetch >= CACHE_STALE_TIME)) {
      fetchData();
    } else {
      // Use cached data immediately
      setBookings(dataCache.bookings);
      setAvailability(dataCache.availability);
      setBalance(dataCache.balance);
      // Revalidate in background
      fetchData();
    }
  }, [user, tab]);

  // Auto-refresh today's bookings every minute to hide past bookings
  useEffect(() => {
    if (tab === 'home' && user) {
      const interval = setInterval(() => {
        // Only refresh today's bookings, not all data (to avoid unnecessary API calls)
        api.getUpcomingBookings(10, true)
          .then(newTodayBookings => {
            setTodayBookings(newTodayBookings || []);
          })
          .catch(() => {
            // Silently fail, don't disrupt user experience
          });
      }, 60000); // Refresh every 1 minute

      return () => clearInterval(interval);
    }
  }, [tab, user]);

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
          await fetchData(true); // ✅ Phase 2.1: Force refresh after adding slot
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
          await fetchData(true); // ✅ Phase 2.1: Force refresh after updating slot
          setSelectedSlot(null);
          success(t.slotUpdated, 'Availability slot has been updated successfully');
      } catch (err: any) {
          showError(t.errorUpdating, err.message || String(err));
      }
  };

  // ✅ Delete specific 30-minute slot from calendar (with slotStartTime)
  const handleDeleteSlot = async (slotId: string, slotStartTime: Date) => {
      if (!user) return;
      try {
          // Get current availability, find the range slot
          const currentSlots = await api.getAvailability(user.id);
          const rangeSlot = currentSlots.find(slot => slot.id === slotId);
          
          // ✅ Fix: Check if slot exists before attempting to delete
          if (!rangeSlot) {
              showError(t.errorDeleting, 'Availability slot not found. It may have been deleted already.');
              return;
          }

          // Convert slotStartTime (Date) to time string in mentor's timezone
          // Format as HH:mm (24-hour format)
          const formatter = new Intl.DateTimeFormat('en-US', {
              timeZone: mentorTz,
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
          });
          const parts = formatter.formatToParts(slotStartTime);
          const hour = parts.find(p => p.type === 'hour')?.value || '00';
          const minute = parts.find(p => p.type === 'minute')?.value || '00';
          const slotStartTimeStr = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
          
          // Convert day name to dayOfWeek number
          const dayMap: {[key: string]: number} = {
              'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
          };
          const dayNum = dayMap[rangeSlot.day];
          
          // ✅ Fix: Validate day conversion
          if (dayNum === undefined) {
              showError(t.errorDeleting, `Invalid day: ${rangeSlot.day}`);
              return;
          }

          // ✅ Fix: Delete specific 30-minute slot, not entire range
          // Backend will update the range to exclude this specific slot
          const updatedAvailability = await api.deleteAvailabilitySlot(user.id, dayNum, rangeSlot.startTime, slotStartTimeStr);
          
          // ✅ Performance: Only update availability, don't refetch all data
          if (updatedAvailability && updatedAvailability.length > 0) {
              setAvailability(updatedAvailability);
              // Update cache
              if (dataCache) {
                  setDataCache({
                      ...dataCache,
                      availability: updatedAvailability,
                      lastFetch: Date.now()
                  });
              }
          } else {
              // Fallback: Refresh availability only if backend doesn't return updated data
              const newAvailability = await api.getAvailability(user.id);
              setAvailability(newAvailability);
              if (dataCache) {
                  setDataCache({
                      ...dataCache,
                      availability: newAvailability,
                      lastFetch: Date.now()
                  });
              }
          }
          
          setSelectedSlot(null);
          success(t.slotDeleted, 'Availability slot has been removed from your schedule');
      } catch (err: any) {
          showError(t.errorDeleting, err.message || String(err));
      }
  };

  // ✅ Delete entire range from EditAvailabilityModal (legacy behavior)
  const handleDeleteRange = async (slotId: string) => {
      if (!user) return;
      try {
          // Get current availability, find the slot, and use its properties for delete
          const currentSlots = await api.getAvailability(user.id);
          const slotToDelete = currentSlots.find(slot => slot.id === slotId);
          
          // ✅ Fix: Check if slot exists before attempting to delete
          if (!slotToDelete) {
              showError(t.errorDeleting, 'Availability slot not found. It may have been deleted already.');
              return;
          }

          // Convert day name to dayOfWeek number
          const dayMap: {[key: string]: number} = {
              'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
          };
          const dayNum = dayMap[slotToDelete.day];
          
          // ✅ Fix: Validate day conversion
          if (dayNum === undefined) {
              showError(t.errorDeleting, `Invalid day: ${slotToDelete.day}`);
              return;
          }

          // Delete entire range (legacy behavior for EditAvailabilityModal)
          await api.deleteAvailability(user.id, dayNum, slotToDelete.startTime);
          
          // ✅ Performance: Refresh availability only
          const newAvailability = await api.getAvailability(user.id);
          setAvailability(newAvailability);
          if (dataCache) {
              setDataCache({
                  ...dataCache,
                  availability: newAvailability,
                  lastFetch: Date.now()
              });
          }
          
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
  const bookingEvents = bookings.map(b => {
      // Map booking status to calendar event type
      let eventType: 'booked' | 'completed' | 'cancelled' | 'no_show' = 'booked';
      if (b.status === BookingStatus.COMPLETED) {
          eventType = 'completed';
      } else if (b.status === BookingStatus.CANCELLED) {
          eventType = 'cancelled';
      } else if (b.status === BookingStatus.NO_SHOW) {
          eventType = 'no_show';
      } else if (b.status === BookingStatus.SCHEDULED) {
          eventType = 'booked';
      }
      
      return {
          id: `booking-${b.id}`,
          title: b.menteeName,
          start: new Date(b.startTime),
          end: new Date(b.endTime),
          type: eventType
      };
  });

  // ✅ Phase 1.2: Memoize "Available" events generation
  const availabilityEvents = React.useMemo(() => {
      const events: any[] = [];
      const today = new Date();

      // ✅ Phase 2.2: Reduce generation scope from 30 days to 7 days (current week)
      for(let i=0; i<7; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: mentorTz });

          const slots = availability.filter(slot => slot.day === dayName);

          slots.forEach(slot => {
              // Handle 24:00 end time
              let slotEndTime = slot.endTime || (() => {
                  // Calculate from duration if endTime not available
                  const [startHour, startMin] = slot.startTime.split(':').map(Number);
                  const totalMinutes = startHour * 60 + startMin + slot.duration;
                  const endHour = Math.floor(totalMinutes / 60) % 24;
                  const endMin = totalMinutes % 60;
                  return `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
              })();
              
              // Calculate total minutes in the slot
              const [startHour, startMin] = slot.startTime.split(':').map(Number);
              let [endHour, endMin] = slotEndTime === '24:00' ? [24, 0] : slotEndTime.split(':').map(Number);
              
              let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
              if (totalMinutes < 0) {
                  totalMinutes = (24 * 60) - (startHour * 60 + startMin) + (endHour * 60 + endMin);
              }

              // Generate slots from the range using interval (default: 30 minutes)
              const slotInterval = slot.interval || 30; // Use interval from slot, default to 30
              // Fix: Use <= to include the last slot that fits within the range
              // Example: 8:00-9:00 (60 min) should generate: 8:00-8:30, 8:30-9:00
              for (let offset = 0; offset <= totalMinutes - slotInterval; offset += slotInterval) {
                  const slotStartMinutes = startHour * 60 + startMin + offset;
                  const slotStartHour = Math.floor(slotStartMinutes / 60) % 24;
                  const slotStartMin = slotStartMinutes % 60;
                  const slotStartTimeStr = `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMin).padStart(2, '0')}`;
                  
                  const start = createAbsoluteDate(d, slotStartTimeStr, mentorTz);
                  const end = new Date(start.getTime() + slotInterval * 60000);

                  const isBooked = bookings.some(b => {
                      if (!['SCHEDULED', 'COMPLETED'].includes(b.status)) return false;
                      const bTime = new Date(b.startTime).getTime();
                      return Math.abs(bTime - start.getTime()) < 60000;
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
              }
          });
      }
      return events;
  }, [availability, bookings, mentorTz]);

  const allEvents = [...bookingEvents, ...availabilityEvents];

  const handleEventClick = (eventId: string) => {
      console.log('📅 [CALENDAR] Event clicked:', eventId);
      if (eventId.startsWith('booking-')) {
          const bookingId = eventId.replace('booking-', '');
          console.log('📅 [CALENDAR] Booking ID extracted:', bookingId);
          console.log('📅 [CALENDAR] Available bookings:', bookings.map(b => b.id));
          const booking = bookings.find(b => b.id === bookingId);
          if (booking) {
              console.log('📅 [CALENDAR] Booking found:', booking);
              setSelectedBookingId(bookingId);
          } else {
              console.error('📅 [CALENDAR] Booking not found in array:', bookingId);
              // Try to fetch booking or show error
              showError('Booking Not Found', 'The selected booking could not be found. Please refresh the page.');
          }
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

                {/* Today's Lessons */}
                {(() => {
                    const now = new Date();
                    // Filter out past bookings (bookings that have already started)
                    const futureBookings = todayBookings.filter(booking => {
                        const bookingStart = new Date(booking.startTime);
                        return bookingStart > now; // Only show future bookings
                    });
                    
                    // Limit to 5 bookings for display
                    const displayBookings = futureBookings.slice(0, 5);
                    
                    if (displayBookings.length > 0) {
                        return (
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                        <Clock className="text-brand-600" size={24} /> {t.todaysLessons || "Today's Lessons"}
                                        {futureBookings.length > 5 && (
                                            <span className="text-sm font-normal text-slate-500">({futureBookings.length} total)</span>
                                        )}
                                    </h3>
                                    <button
                                        onClick={() => navigate('/mentor/schedule')}
                                        className="text-xs font-black uppercase text-brand-600 hover:underline"
                                    >
                                        {t.viewCalendar || 'View Calendar'}
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {displayBookings.map(booking => {
                                    const bookingTime = new Date(booking.startTime);
                                    return (
                                        <div 
                                            key={booking.id}
                                            className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
                                            onClick={() => setSelectedBookingId(booking.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center border border-brand-100">
                                                        {booking.menteeAvatar ? (
                                                            <img src={booking.menteeAvatar} alt={booking.menteeName} className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            <span className="text-brand-600 font-bold text-sm">{booking.menteeName.charAt(0)}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-slate-900 truncate">{booking.menteeName}</div>
                                                        <div className="text-xs text-slate-500">
                                                            {bookingTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(booking.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronRight className="flex-shrink-0 text-slate-400" size={18} />
                                            </div>
                                        </div>
                                    );
                                    })}
                                </div>
                                {futureBookings.length > 5 && (
                                    <div className="mt-4 text-center">
                                        <button
                                            onClick={() => navigate('/mentor/schedule')}
                                            className="text-xs font-black uppercase text-brand-600 hover:underline"
                                        >
                                            View all {futureBookings.length} lessons today →
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    }
                    
                    // Empty state: no future bookings today
                    return (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
                            <CalendarIcon size={48} className="mx-auto mb-4 text-slate-300" />
                            <h3 className="text-lg font-bold text-slate-900 mb-2">{t.noLessonsToday || "No lessons scheduled for today"}</h3>
                            <p className="text-slate-500 mb-6">{t.viewCalendarToSeeSchedule || "View your calendar to see your full schedule"}</p>
                            <button
                                onClick={() => navigate('/mentor/schedule')}
                                className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all"
                            >
                                {t.viewCalendar || 'View Calendar'}
                            </button>
                        </div>
                    );
                })()}

                {/* Stats Cards */}
                {(() => {
                    // Calculate completed bookings this week
                    const now = new Date();
                    const startOfWeek = new Date(now);
                    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
                    startOfWeek.setHours(0, 0, 0, 0);
                    
                    const completedThisWeek = bookings.filter(b => {
                        if (b.status !== BookingStatus.COMPLETED) return false;
                        const bookingDate = new Date(b.startTime);
                        return bookingDate >= startOfWeek;
                    }).length;

                    // Ensure balance values are numbers (fallback to 0 if undefined)
                    const pendingValue = typeof balance.pending === 'number' ? balance.pending : 0;
                    const payableValue = typeof balance.payable === 'number' ? balance.payable : 0;

                    return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Pending Earnings */}
                            <div className="bg-yellow-50 border border-yellow-100 rounded-3xl p-6 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-xs font-black text-yellow-600 uppercase tracking-wider">Pending Earnings</div>
                                    <Wallet className="text-yellow-600" size={20} />
                                </div>
                                <div className="text-3xl font-black text-yellow-700">{pendingValue.toFixed(0)} Cr</div>
                                <div className="text-xs text-yellow-600 mt-1">Awaiting release</div>
                            </div>

                            {/* Payable */}
                            <div className="bg-green-50 border border-green-100 rounded-3xl p-6 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-xs font-black text-green-600 uppercase tracking-wider">Payable</div>
                                    <CheckCircle className="text-green-600" size={20} />
                                </div>
                                <div className="text-3xl font-black text-green-700">{payableValue.toFixed(0)} Cr</div>
                                <div className="text-xs text-green-600 mt-1">Ready to withdraw</div>
                            </div>

                            {/* Completed This Week */}
                            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-xs font-black text-blue-600 uppercase tracking-wider">Completed</div>
                                    <Clock className="text-blue-600" size={20} />
                                </div>
                                <div className="text-3xl font-black text-blue-700">{completedThisWeek}</div>
                                <div className="text-xs text-blue-600 mt-1">Lessons this week</div>
                            </div>
                        </div>
                    );
                })()}
            </div>
        )}

        {tab === 'calendar' && (
            <div className="h-[calc(100vh-160px)] animate-fade-in bg-white p-4 rounded-3xl border border-slate-200 flex flex-col relative">
                <div className="absolute top-8 right-10 z-30">
                    <button
                        onClick={() => fetchData(true)} // ✅ Phase 2.1: Force refresh when user clicks
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
                        onEventDelete={handleDeleteSlot}
                    />
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-3xl flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400 flex-wrap">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-100 border-l-2 border-blue-600"></div> {t.available}</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-100 border-l-2 border-green-600"></div> {t.booked}</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-200 border-l-2 border-slate-400"></div> {t.completed}</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-100 border-l-2 border-red-600"></div> Cancelled</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-orange-100 border-l-2 border-orange-600"></div> No-Show</div>
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
        {selectedBookingId && (() => {
            const selectedBooking = bookings.find(b => b.id === selectedBookingId);
            if (!selectedBooking) {
                console.error('Booking not found:', selectedBookingId, 'Available bookings:', bookings.map(b => b.id));
                // Clear selectedBookingId if booking not found
                setTimeout(() => setSelectedBookingId(null), 0);
                return null;
            }
            return (
                <LessonModal
                    isOpen={!!selectedBookingId}
                    onClose={() => setSelectedBookingId(null)}
                    booking={selectedBooking}
                    onAction={async (action, data) => {
                        if(!selectedBookingId) return;
                        
                        try {
                            if (action === 'COMPLETE') {
                                await api.updateBookingStatus(selectedBookingId, BookingStatus.COMPLETED);
                                success('Lesson Completed', 'The lesson has been marked as completed.');
                            } else if (action === 'RESCHEDULE' && data?.newStart) {
                                // ❌ REMOVED: Mentor không thể reschedule
                                // Mentor phải cancel và để mentee book lại
                                warning('Reschedule Not Allowed', 'Mentors cannot reschedule bookings. Please cancel and let the mentee book a new time.');
                                return; // Don't proceed
                            } else if (action === 'NO_SHOW') {
                                await api.updateBookingStatus(selectedBookingId, BookingStatus.NO_SHOW);
                                success('No-Show Reported', 'The no-show has been reported. Admin will review.');
                            } else if (action === 'CANCEL') {
                                const reason = data?.reason; // Get reason from modal data
                                const result = await api.cancelBookingAsMentor(selectedBookingId, reason);
                                // Show success message with stats
                                if (result.cancellationStats.wasLateCancellation) {
                                    success('Booking Canceled', `You have ${result.cancellationStats.remaining} late cancellations remaining this month.`);
                                } else {
                                    success('Booking Canceled', 'Free cancellation - no limit count.');
                                }
                            }
                            
                            await fetchData(true); // ✅ Phase 2.1: Force refresh after action
                            setSelectedBookingId(null);
                        } catch (error: any) {
                            // Show error (could be limit reached, network error, etc.)
                            showError('Action Failed', error.message || 'Failed to perform action. Please try again.');
                            // Don't close modal or refresh on error - let user retry
                        }
                    }}
            />
            );
        })()}

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
                onDelete={handleDeleteRange}
            />
        )}

        {/* Modal to grade homework */}
        {selectedHomework && (
            <MentorHomeworkModal
                isOpen={!!selectedHomework}
                onClose={() => setSelectedHomework(null)}
                homework={selectedHomework}
                onRefresh={() => fetchData(true)} // ✅ Phase 2.1: Force refresh
            />
        )}
    </div>
  );
}
