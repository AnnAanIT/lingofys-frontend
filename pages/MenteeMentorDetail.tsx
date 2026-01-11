
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useApp } from '../App';
import { Mentor, Subscription, UserRole, Booking } from '../types';
import { BookingModal } from '../components/FindMentor/BookingModal';
import { WeeklyCalendar } from '../components/Calendar';
import { createAbsoluteDate, getTimezoneByCountry } from '../lib/timeUtils';
import { ArrowLeft, Star, MapPin, BookOpen, Globe, ShieldCheck, FileVideo } from 'lucide-react';
import { translations } from '../lib/i18n';
import { useToast } from '../components/ui/Toast';

export default function MenteeMentorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, refreshUser, language } = useApp();
  const { error: showError } = useToast();
  const t = translations[language].mentee;

  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [mentorBookings, setMentorBookings] = useState<Booking[]>([]); 
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'REVIEWS'>('OVERVIEW');
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [localizedRate, setLocalizedRate] = useState<number | null>(null);
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [priceDetails, setPriceDetails] = useState<{
      basePrice: number;
      countryMultiplier: number;
      groupMultiplier: number;
      finalPrice: number;
  } | null>(null);

  useEffect(() => {
    if (id) {
        Promise.all([
            api.getMentorById(id),
            api.getMentorUpcomingBookings(id)  // Fixed: Get MENTOR's bookings, not mentee's bookings
        ]).then(([m, b]) => {
            setMentor(m || null);
            setMentorBookings(b || []);  // ✅ FIX: Default to empty array if undefined

            // Calculate localized rate for display
            if (m) {
                api.getMentorLocalizedRate(m.id, user?.country || 'US')
                    .then(rate => {
                        // ✅ FIX: Ensure rate is a number, extract from object if needed
                        if (typeof rate === 'number') {
                            setLocalizedRate(rate);
                        } else if (rate && typeof rate === 'object' && 'finalPrice' in rate) {
                            setLocalizedRate((rate as any).finalPrice);
                        } else {
                            setLocalizedRate(null);
                        }
                    })
                    .catch(err => {
                        console.error('Failed to get localized rate:', err);
                        setLocalizedRate(null);
                    });
            }
            setLoading(false);
        }).catch(err => {
            // ✅ FIX: Handle API errors (401, 404, etc.)
            console.error('Failed to load mentor details:', err);
            setMentor(null);
            setMentorBookings([]);
            setLoading(false);
        });
    }
  }, [id, user?.country]);

  useEffect(() => {
      if (user && id) {
          api.getUserSubscriptions(user.id)
              .then(subs => {
                  const sub = subs.find(s => s.mentorId === id && s.status === 'ACTIVE');
                  setActiveSubscription(sub || null);
              })
              .catch(err => {
                  // ✅ FIX: Handle subscription fetch errors
                  console.error('Failed to load subscriptions:', err);
                  setActiveSubscription(null);
              });
      }
  }, [user, id]);

  // ✅ FIXED: Dynamic timezone based on logged-in user role
  // - Mentee sees times in THEIR timezone (easier to book)
  // - Mentor sees times in THEIR OWN timezone (when viewing their profile)
  const displayTz = user?.role === 'MENTEE'
      ? (user.timezone || getTimezoneByCountry(user.country || 'VN'))
      : (mentor?.timezone || getTimezoneByCountry(mentor?.country || 'US'));

  // Memoize generateEvents to avoid recalculating on every render
  const generateEvents = useMemo(() => {
      const events: any[] = [];
      const today = new Date();

      if (!mentor) return [];

      // ✅ FIX: Check if availability exists and is an array
      if (!mentor.availability || !Array.isArray(mentor.availability) || mentor.availability.length === 0) {
          // Silently return empty array (no need to log warning every render)
          return [];
      }

      // Múi giờ của Mentor để hiểu các slot "Mon 18:00"
      const mentorTz = mentor.timezone || getTimezoneByCountry(mentor.country || 'US');

      console.log('🔍 [Availability Debug] Generating events for mentor:', mentor.name);
      console.log('📍 Mentor timezone:', mentorTz);
      console.log('📅 Mentor availability slots:', mentor.availability);
      console.log('📚 Mentor bookings:', mentorBookings);

      // ✅ Generate slots from availability ranges using interval
      mentor.availability.forEach(slot => {
          for(let i=0; i<21; i++) {
              const d = new Date(today);
              d.setDate(today.getDate() + i);

              // Get the day name of this date in mentor's timezone
              const dayInMentorTz = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: mentorTz });

              // Only generate event if this day matches the slot's day
              if (dayInMentorTz !== slot.day) {
                  continue; // Skip to next day
              }

              // Calculate end time from slot
              let slotEndTime: string;
              if (slot.endTime) {
                  slotEndTime = slot.endTime;
                  if (slot.endTime === '24:00') {
                      // Handle 24:00 as end of day
                      slotEndTime = '23:59'; // Use 23:59 for calculation
                  }
              } else {
                  // Calculate from duration if endTime not provided
                  const [startHour, startMin] = slot.startTime.split(':').map(Number);
                  const totalMinutes = startHour * 60 + startMin + slot.duration;
                  const endHour = Math.floor(totalMinutes / 60) % 24;
                  const endMin = totalMinutes % 60;
                  slotEndTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
              }

              // Parse start and end times
              const [startHour, startMin] = slot.startTime.split(':').map(Number);
              const [endHour, endMin] = slotEndTime.split(':').map(Number);
              
              // Calculate total minutes in the slot
              let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
              if (totalMinutes < 0) {
                  // Slot spans midnight (e.g., 23:30-00:00)
                  totalMinutes = (24 * 60) - (startHour * 60 + startMin) + (endHour * 60 + endMin);
              }

              // Generate slots from the range using interval (default: 30 minutes)
              const slotInterval = slot.interval || 30; // Use interval from slot, default to 30
              // Fix: Use <= to include the last slot that fits within the range
              // Example: 8:00-9:00 (60 min) should generate: 8:00-8:30, 8:30-9:00
              for (let offset = 0; offset <= totalMinutes - slotInterval; offset += slotInterval) {
                  // Calculate slot start time
                  const slotStartMinutes = startHour * 60 + startMin + offset;
                  const slotStartHour = Math.floor(slotStartMinutes / 60) % 24;
                  const slotStartMin = slotStartMinutes % 60;
                  
                  // Format slot start time
                  const slotStartTimeStr = `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMin).padStart(2, '0')}`;
                  
                  // Generate absolute start time
                  const start = createAbsoluteDate(d, slotStartTimeStr, mentorTz);
                  const end = new Date(start.getTime() + slotInterval * 60000);

                  // Check if this slot is already booked
                  const isBooked = mentorBookings.some(b => {
                      if (!['SCHEDULED', 'COMPLETED'].includes(b.status)) return false;
                      const bTime = new Date(b.startTime).getTime();
                      // Check if booking overlaps with this slot (within 1 minute tolerance)
                      return Math.abs(bTime - start.getTime()) < 60000;
                  });

                  if (!isBooked) {
                      events.push({
                          id: `avail-${start.toISOString()}`,
                          title: 'Available',
                          start: start,
                          end: end,
                          type: 'available' as const
                      });
                  }
              }
          }
      });

      console.log(`✅ Total events generated: ${events.length}`);
      console.log('Events:', events);

      return events;
  }, [mentor?.availability, mentorBookings, mentorTz]);

  const handleSlotClick = async (date: Date) => {
      if (!user || !mentor) return;
      setSelectedDate(date);
      setPriceDetails(null);
      try {
          const details = await api.calculatePriceDetail(mentor.id, user.country || 'VN');
          setPriceDetails(details);
      } catch (e) {
          showError(t.pricingCalculationError, 'Failed to calculate pricing details');
          setSelectedDate(null);
      }
  };

  const handleBookingConfirm = async (useSubscription: boolean) => {
    if (!selectedDate || !user || !priceDetails || !mentor) return;
    setIsProcessing(true);
    try {
        console.log('🎫 [BOOKING DEBUG] Creating booking...');
        console.log('  useSubscription:', useSubscription);
        console.log('  mentee:', user.id, user.name);
        console.log('  mentor:', mentor.id, mentor.name);
        console.log('  startTime:', selectedDate.toISOString());

        const slotPrice = priceDetails.finalPrice;
        const duration = 30; // Always 30 minutes

        // Book 1 slot (30 minutes)
        console.log('  Creating 30-minute booking:');
        console.log('    Start:', selectedDate.toISOString(), '-', slotPrice, 'credits');

        // Check subscription sessions if using subscription
        if (useSubscription) {
            const activeSub = await api.getActiveSubscription(mentor.id);
            if (!activeSub || activeSub.remainingSessions < 1) {
                throw new Error('Not enough subscription sessions remaining. You need 1 session.');
            }
        }

        // Check credits if using credit payment
        if (!useSubscription && user.credits < slotPrice) {
            throw new Error(`Insufficient credits. You need ${slotPrice.toFixed(2)} credits.`);
        }

        const newBooking = await api.createOneTimeBooking({
            mentorId: mentor.id,
            startTime: selectedDate.toISOString(),
            duration: duration,
            cost: slotPrice,
            useSubscription: useSubscription
        });

        console.log('✅ Booking created:', newBooking);
        console.log('  bookingId:', newBooking.id);
        console.log('  type:', newBooking.type);
        console.log('  subscriptionId:', newBooking.subscriptionId);

        await refreshUser();
        navigate(`/mentee/booking-success/${newBooking.id}`);
    } catch (error: any) {
        console.error('❌ Booking failed:', error);
        showError('Booking Failed', error.message);
    } finally {
        setIsProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">{t.loadingProfile}</div>;
  if (!mentor) return <div className="min-h-screen flex items-center justify-center text-slate-400">{t.mentorNotFound}</div>;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-20">
      <div className="mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm">
            <ArrowLeft size={18} className="mr-2" /> Back
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="h-28 bg-gradient-to-br from-brand-600 to-brand-400"></div>
                <div className="px-6 pb-6 text-center -mt-14">
                    <div className="relative inline-block">
                        <div className="p-1 bg-white rounded-full shadow-lg">
                            <img src={mentor.avatar} alt={mentor.name} className="w-24 h-24 rounded-full object-cover bg-slate-50" />
                        </div>
                        <div className="absolute bottom-1 right-1 bg-blue-500 rounded-full p-1.5 border-2 border-white shadow-sm">
                            <ShieldCheck size={16} className="text-white" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 mt-4 tracking-tight">{mentor.name}</h1>
                    <div className="text-sm text-slate-500 font-medium flex items-center justify-center gap-1.5 mt-1">
                        <MapPin size={14} className="text-slate-400" /> {mentor.country}
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.yourRate}</span>
                    <div className="text-right">
                        <span className="text-3xl font-black text-white">
                            {localizedRate !== null && typeof localizedRate === 'number' ? Number(localizedRate).toFixed(2) : '...'}
                        </span>
                        <span className="text-xs font-bold text-slate-400 ml-1">{t.creditsPerHour}</span>
                    </div>
                </div>
                <button
                    onClick={() => document.getElementById('calendar-view')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full py-4 bg-brand-500 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-brand-400 transition-all shadow-lg active:scale-95"
                >
                    {t.bookNow}
                </button>
            </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
            {/* Video Introduction */}
            {mentor.videoIntro && (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                  <FileVideo size={22} className="text-brand-500" /> Introduction Video
                </h3>
                <div className="relative rounded-xl overflow-hidden bg-slate-100">
                  <video 
                    src={mentor.videoIntro} 
                    controls 
                    className="w-full"
                    style={{ maxHeight: '400px' }}
                    preload="metadata"
                  >
                    Your browser does not support video playback.
                  </video>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                    <BookOpen size={22} className="text-brand-500" /> {t.aboutMe}
                </h3>
                <p className="text-slate-600 leading-relaxed font-medium">{mentor.aboutMe || mentor.headline}</p>
            </div>

            <div id="calendar-view" className="h-[650px] flex flex-col scroll-mt-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <Globe size={20} className="text-brand-600" /> {t.mentorSchedule}
                    </h3>
                    <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold border border-green-100 uppercase tracking-wide">
                        {user?.role === 'MENTEE' ? `Your Time (${displayTz})` : `Mentor's Time (${displayTz})`}
                    </div>
                </div>
                <div className="flex-1 min-h-0">
                    <WeeklyCalendar 
                        events={generateEvents} 
                        viewMode="mentee"
                        onSlotClick={handleSlotClick}
                        timezone={displayTz}
                    />
                </div>
            </div>
        </div>
      </div>

      {user && selectedDate && (
          <BookingModal 
            isOpen={!!selectedDate}
            onClose={() => { setSelectedDate(null); setPriceDetails(null); }}
            onConfirm={handleBookingConfirm}
            mentor={mentor}
            user={user}
            date={selectedDate}
            priceDetails={priceDetails}
            isProcessing={isProcessing}
            activeSubscription={activeSubscription} 
          />
      )}
    </div>
  );
}
