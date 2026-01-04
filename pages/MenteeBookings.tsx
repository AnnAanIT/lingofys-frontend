
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useApp } from '../App';
import { Booking, UserRole } from '../types';
import { Calendar, Clock, MoreHorizontal, Star, MessageSquare, CheckCircle, AlertTriangle } from 'lucide-react';
import { SubscriptionBadge } from '../components/SubscriptionComponents';
import { ReviewModal } from '../components/ReviewModal';
import { DisputeModal } from '../components/Mentee/DisputeModal'; // Import Dispute Modal
import { translations } from '../lib/i18n';
import { useToast } from '../components/ui/Toast';

type Tab = 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

export default function MenteeBookings() {
  const { user, language } = useApp();
  const { success } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('UPCOMING');
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [disputeBooking, setDisputeBooking] = useState<Booking | null>(null); // State for dispute
  const navigate = useNavigate();
  const t = translations[language].mentee;

  const fetchData = async () => {
      if (user) {
          console.log('📋 [BOOKINGS PAGE] Fetching bookings for user:', user.id, user.name);
          try {
              const data = await api.getBookings();
              console.log('  Total bookings fetched:', data?.length || 0);
              if (data && Array.isArray(data)) {
                  console.log('  Bookings:', data.map(b => ({
                      id: b.id.slice(-6),
                      type: b.type,
                      status: b.status,
                      mentor: b.mentorName,
                      subscriptionId: b.subscriptionId
                  })));
                  setBookings(data);
              } else {
                  console.error('  Invalid bookings data:', data);
                  setBookings([]);
              }
          } catch (error) {
              console.error('  Error fetching bookings:', error);
              setBookings([]);
          }
      }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleReviewSubmit = async (rating: number, comment: string) => {
      if(reviewBooking) {
          await api.submitReview(reviewBooking.id, rating, comment);
          await fetchData();
          setReviewBooking(null);
      }
  };

  const handleDisputeSuccess = async () => {
      await fetchData();
      setDisputeBooking(null);
      success('Report Submitted', t.reportSubmitted);
  };

  const filteredBookings = bookings.filter(b => {
      if (activeTab === 'UPCOMING') return ['SCHEDULED', 'RESCHEDULED', 'MENTOR_NO_SHOW'].includes(b.status);
      if (activeTab === 'COMPLETED') return ['COMPLETED', 'DISPUTED', 'REFUNDED'].includes(b.status); // Show Disputed here
      if (activeTab === 'CANCELLED') return ['CANCELLED', 'NO_SHOW'].includes(b.status);
      return true;
  }).sort((a,b) => {
      const timeA = new Date(a.startTime).getTime();
      const timeB = new Date(b.startTime).getTime();
      return activeTab === 'UPCOMING' ? timeA - timeB : timeB - timeA;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'SCHEDULED': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
        case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
        case 'RESCHEDULED': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case 'DISPUTED': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'REFUNDED': return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'MENTOR_NO_SHOW': return 'bg-orange-100 text-orange-800 border-orange-200';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-3xl font-bold text-slate-900">{t.myBookings}</h1>
            <div className="flex gap-2">
                <button 
                    onClick={() => navigate('/mentee/subscriptions')}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                    {t.buySubscription}
                </button>
                <button 
                    onClick={() => navigate('/mentee/find-mentor')}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-sm"
                >
                    {t.bookNewLesson}
                </button>
            </div>
       </div>

       <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
           {(['UPCOMING', 'COMPLETED', 'CANCELLED'] as Tab[]).map(tab => (
               <button
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                       activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                   }`}
               >
                   {tab === 'UPCOMING' ? t.tabUpcoming : tab === 'COMPLETED' ? t.tabHistory : t.tabCancelled}
               </button>
           ))}
       </div>

       <div className="space-y-4">
           {filteredBookings.length === 0 ? (
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
                   <Calendar size={48} className="mx-auto mb-4 text-slate-300" />
                   <h3 className="text-lg font-medium text-slate-900">{t.noBookingsTitle}</h3>
                   <p className="mb-6 opacity-70">{t.bookingsEmptyDesc}</p>
                   {activeTab === 'UPCOMING' && (
                        <button onClick={() => navigate('/mentee/find-mentor')} className="text-brand-600 font-bold hover:underline">{t.findMentorTitle}</button>
                   )}
               </div>
           ) : (
               filteredBookings.map(booking => (
                   <div 
                     key={booking.id} 
                     className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                    >
                       <div className="flex items-center gap-4">
                           <div className="flex flex-col items-center justify-center w-16 h-16 bg-slate-50 border border-slate-100 rounded-xl text-slate-900">
                               <span className="text-xs font-bold uppercase text-slate-400">{new Date(booking.startTime).toLocaleDateString(undefined, {month:'short'})}</span>
                               <span className="text-2xl font-extrabold">{new Date(booking.startTime).getDate()}</span>
                           </div>
                           
                           <div>
                               <div className="flex items-center gap-2 mb-1">
                                   <h3 className="font-bold text-lg text-slate-900">{booking.mentorName}</h3>
                                   {booking.type === 'SUBSCRIPTION' && <SubscriptionBadge />}
                               </div>
                               <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                                    <span className="flex items-center"><Clock size={14} className="mr-1.5"/> {new Date(booking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(booking.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    <span className="flex items-center px-2 py-0.5 bg-slate-50 rounded text-xs font-mono">ID: #{booking.id.slice(-6)}</span>
                               </div>
                           </div>
                       </div>
                       
                       <div className="flex items-center gap-4 w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                            <div className="flex-1 md:flex-none">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-block ${getStatusColor(booking.status)}`}>
                                    {booking.status}
                                </span>
                            </div>

                            {activeTab === 'UPCOMING' && (
                                <button
                                    onClick={() => navigate(`/mentee/bookings/${booking.id}`)}
                                    className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 whitespace-nowrap"
                                >
                                    {t.joinDetails}
                                </button>
                            )}

                            {activeTab === 'COMPLETED' && booking.status === 'COMPLETED' && (
                                <div className="flex gap-2">
                                    {booking.rating ? (
                                        <div className="flex items-center text-yellow-500 bg-yellow-50 px-3 py-1.5 rounded-lg">
                                            <Star size={16} className="fill-current mr-1" />
                                            <span className="font-bold text-sm">{booking.rating}</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setReviewBooking(booking); }}
                                            className="flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:border-yellow-400 hover:text-yellow-600 rounded-lg text-sm font-bold transition-colors whitespace-nowrap"
                                        >
                                            <Star size={16} className="mr-2" /> {t.rate}
                                        </button>
                                    )}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setDisputeBooking(booking); }}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Report Issue"
                                    >
                                        <AlertTriangle size={20} />
                                    </button>
                                </div>
                            )}

                            {booking.status === 'DISPUTED' && (
                                <div className="text-xs text-orange-600 font-bold bg-orange-50 px-3 py-1 rounded-lg">
                                    {t.underReview}
                                </div>
                            )}

                            <button 
                                onClick={() => navigate(`/mentee/bookings/${booking.id}`)}
                                className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <MoreHorizontal size={20} />
                            </button>
                       </div>
                   </div>
               ))
           )}
       </div>

       {reviewBooking && (
           <ReviewModal 
               isOpen={!!reviewBooking}
               onClose={() => setReviewBooking(null)}
               onSubmit={handleReviewSubmit}
               mentorName={reviewBooking.mentorName}
           />
       )}

       {disputeBooking && (
           <DisputeModal 
               isOpen={!!disputeBooking}
               onClose={() => setDisputeBooking(null)}
               booking={disputeBooking}
               onSuccess={handleDisputeSuccess}
           />
       )}
    </div>
  );
}
