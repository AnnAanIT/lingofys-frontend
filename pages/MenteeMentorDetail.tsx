
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useApp } from '../App';
import { Mentor, Subscription, UserRole, Booking } from '../types';
import { BookingModal } from '../components/FindMentor/BookingModal';
import { WeeklyCalendar } from '../components/Calendar';
import { createAbsoluteDate, getTimezoneByCountry } from '../lib/timeUtils';
import { ArrowLeft, Star, MapPin, BookOpen, Globe, ShieldCheck } from 'lucide-react';

export default function MenteeMentorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, refreshUser } = useApp();
  
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
            api.getBookings(id, UserRole.MENTOR)
        ]).then(([m, b]) => {
            setMentor(m || null);
            setMentorBookings(b);
            
            // Calculate localized rate for display
            if (m) {
                api.getMentorLocalizedRate(m.id, user?.country || 'US').then(setLocalizedRate);
            }
            setLoading(false);
        });
    }
  }, [id, user?.country]);

  useEffect(() => {
      if (user && id) {
          api.getUserSubscriptions(user.id).then(subs => {
              const sub = subs.find(s => s.mentorId === id && s.status === 'ACTIVE');
              setActiveSubscription(sub || null);
          });
      }
  }, [user, id]);

  const displayTz = user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const generateEvents = () => {
      const events: any[] = [];
      const today = new Date();
      
      if (!mentor) return [];

      // Múi giờ của Mentor để hiểu các slot "Mon 18:00"
      const mentorTz = mentor.timezone || getTimezoneByCountry(mentor.country || 'US');

      for(let i=0; i<21; i++) { 
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          // dayName dựa trên múi giờ mentor
          const dayInMentorTz = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: mentorTz });
          
          const slots = mentor.availability.filter(slot => slot.day === dayInMentorTz);
          
          slots.forEach(slot => {
              const start = createAbsoluteDate(d, slot.startTime, mentorTz);
              const end = new Date(start.getTime() + slot.duration * 60000);
              
              const isBooked = mentorBookings.some(b => {
                  if (!['SCHEDULED', 'COMPLETED'].includes(b.status)) return false;
                  const bTime = new Date(b.startTime).getTime();
                  return Math.abs(bTime - start.getTime()) < 1000;
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
          });
      }
      return events;
  };

  const handleSlotClick = async (date: Date) => {
      if (!user || !mentor) return;
      setSelectedDate(date);
      setPriceDetails(null);
      try {
          const details = await api.calculatePriceDetail(mentor.id, user.country || 'VN');
          setPriceDetails(details);
      } catch (e) {
          alert("Unable to calculate localized pricing.");
          setSelectedDate(null);
      }
  };

  const handleBookingConfirm = async (useSubscription: boolean) => {
    if (!selectedDate || !user || !priceDetails || !mentor) return;
    setIsProcessing(true);
    try {
        const newBooking = await api.createOneTimeBooking(
            user.id,
            mentor.id,
            selectedDate.toISOString(),
            60,
            priceDetails.finalPrice,
            useSubscription
        );
        await refreshUser();
        navigate(`/mentee/booking-success/${newBooking.id}`);
    } catch (error: any) {
        alert("Booking failed: " + error.message);
    } finally {
        setIsProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading profile...</div>;
  if (!mentor) return <div className="min-h-screen flex items-center justify-center text-slate-400">Mentor not found.</div>;

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
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Rate</span>
                    <div className="text-right">
                        <span className="text-3xl font-black text-white">
                            {localizedRate !== null ? localizedRate : '...'}
                        </span>
                        <span className="text-xs font-bold text-slate-400 ml-1">Credits/hr</span>
                    </div>
                </div>
                <button 
                    onClick={() => document.getElementById('calendar-view')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full py-4 bg-brand-500 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-brand-400 transition-all shadow-lg active:scale-95"
                >
                    Book Now
                </button>
            </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                    <BookOpen size={22} className="text-brand-500" /> About Me
                </h3>
                <p className="text-slate-600 leading-relaxed font-medium">{mentor.bio}</p>
            </div>

            <div id="calendar-view" className="h-[650px] flex flex-col scroll-mt-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <Globe size={20} className="text-brand-600" /> Mentor Schedule
                    </h3>
                    <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold border border-green-100 uppercase tracking-wide">
                        Times converted to your local zone ({displayTz})
                    </div>
                </div>
                <div className="flex-1 min-h-0">
                    <WeeklyCalendar 
                        events={generateEvents()} 
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
