
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Booking, Subscription, BookingStatus, Homework, UserRole } from '../types';
import { CancelBookingModal, RescheduleModal } from '../components/BookingActionModals';
import { ArrowLeft, Calendar, Clock, Video, User, FileText, AlertTriangle, Star, CheckCircle, Quote, ChevronRight } from 'lucide-react';
import { useApp } from '../App';
import { SubscriptionBadge } from '../components/SubscriptionComponents';
import { ReviewModal } from '../components/ReviewModal';
import { HomeworkModal } from '../components/Mentee/HomeworkModal';
import { translations } from '../lib/i18n';
import { useToast } from '../components/ui/Toast';

export default function MenteeBookingDetail() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [homework, setHomework] = useState<Homework | null>(null); 
  const [cancelStats, setCancelStats] = useState<{ cancellationCount: number; remaining: number; canCancel: boolean } | null>(null);
  
  const { user, refreshUser, language } = useApp();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const t = translations[language].mentee;

  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isHomeworkOpen, setIsHomeworkOpen] = useState(false);
  const [isMentorNoShowConfirmOpen, setIsMentorNoShowConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (bookingId) {
        loadData();
    }
  }, [bookingId]);

  const loadData = async () => {
      const b = await api.getBookingById(bookingId!);
      setBooking(b || null);
      
      if (user && b) {
          if (b.type === 'SUBSCRIPTION' && b.subscriptionId) {
              // Fetch đúng gói subscription liên quan đến booking này
              const allSubs = await api.getUserSubscriptions(user.id);
              const sub = allSubs.find(s => s.id === b.subscriptionId);
              setSubscription(sub || null);
          }
          const allHomework = await api.getHomework();
          const related = allHomework.find(h => h.bookingId === b.id);
          setHomework(related || null);
          
          // NEW: Fetch cancel stats
          try {
              const stats = await api.getMenteeCancellationStats();
              setCancelStats(stats);
          } catch (error) {
              console.error('Failed to load cancel stats:', error);
          }
      }
  };

  const handleCancel = async (reason?: string) => {
      if (!booking) return;
      setIsProcessing(true);
      try {
          await api.cancelBooking(booking.id, reason);  // Pass reason to API
          // Cực kỳ quan trọng: Làm mới user state để cập nhật credits/quota
          await refreshUser();
          await loadData();
          
          // Show success with remaining cancels
          if (booking.type === 'CREDIT') {
              const newStats = await api.getMenteeCancellationStats();
              success(t.bookingCancelledSuccess, `Cancels remaining this month: ${newStats.remaining}/3`);
          } else {
              success(t.bookingCancelledSuccess, 'Your booking has been cancelled successfully');
          }
          
          setIsCancelOpen(false);
      } catch(err: any) {
          const errorMsg = err.message || err;
          showError('Cannot Cancel', errorMsg);
      } finally {
          setIsProcessing(false);
      }
  };

  const handleReschedule = async (newTime: string, reason?: string) => {
      if(!booking) return;
      setIsProcessing(true);
      try {
          // newTime is expected to be in ISO format or similar, split date and time
          const newTimeDate = new Date(newTime);
          const newDate = newTimeDate.toISOString().split('T')[0];
          const newStartTime = newTimeDate.toTimeString().split(' ')[0].substring(0, 5);
          await api.rescheduleBooking(booking.id, newDate, newStartTime, reason);  // Pass reason to API
          await refreshUser();
          await loadData();
          setIsRescheduleOpen(false);
          success(t.rescheduledSuccess, 'Your lesson has been rescheduled successfully');
      } catch (err: any) {
          showError('Reschedule Failed', err.message || String(err));
      } finally {
          setIsProcessing(false);
      }
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
      if(!booking) return;
      await api.submitReview(booking.id, rating, comment);
      await loadData();
  };

  const handleMentorNoShow = async () => {
      if(!booking) return;
      setIsProcessing(true);
      try {
          await api.markMentorNoShow(booking.id);
          await loadData();
          setIsMentorNoShowConfirmOpen(false);
          success('Report Submitted', 'Our team will review and resolve this within 24-48 hours.');
      } catch(err: any) {
          showError('Report Failed', err.message || String(err));
      } finally {
          setIsProcessing(false);
      }
  };

  if (!booking) return <div className="p-12 text-center text-slate-400">{t.loadingLessonDetails}</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
        <button onClick={() => navigate('/mentee/bookings')} className="flex items-center text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors group">
            <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" /> {t.backToBookings}
        </button>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-2">
                         <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">{t.lessonSummary}</h1>
                         {booking.type === 'SUBSCRIPTION' && <SubscriptionBadge />}
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">ID: #{booking.id.slice(-8)}</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-black border tracking-wider
                    ${booking.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                      booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700 border-red-200' :
                      booking.status === 'RESCHEDULED' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                      booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {booking.status}
                </div>
            </div>
            
            <div className="p-8 space-y-8">
                <div className="flex items-center space-x-6">
                    {booking.mentorAvatar ? (
                        <img src={booking.mentorAvatar} alt={booking.mentorName} className="w-20 h-20 rounded-3xl object-cover border border-slate-200 shadow-sm" />
                    ) : (
                        <div className="w-20 h-20 rounded-3xl bg-slate-200 border border-slate-200 shadow-sm flex items-center justify-center text-2xl font-bold text-slate-600">
                            {booking.mentorName?.charAt(0)?.toUpperCase() || 'M'}
                        </div>
                    )}
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{booking.mentorName}</h3>
                        <button onClick={() => navigate(`/mentee/find-mentor/${booking.mentorId}`)} className="text-brand-600 text-xs font-black mt-2 hover:underline uppercase tracking-widest">{t.viewProfile}</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl">
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">{t.lessonDate}</div>
                        <div className="font-bold text-slate-900">{new Date(booking.startTime).toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</div>
                    </div>
                     <div className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl">
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">{t.timeSlot}</div>
                        <div className="font-bold text-slate-900">{new Date(booking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(booking.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                </div>

                {subscription && booking.status === BookingStatus.SCHEDULED && (
                    <div className="bg-brand-50 border border-brand-100 p-5 rounded-2xl">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <div className="text-[10px] text-brand-600 font-black uppercase tracking-widest">Active Plan</div>
                                <div className="font-bold text-brand-900">{subscription.planName}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-brand-600 font-black uppercase tracking-widest">{t.sessionsLeft}</div>
                                <div className="font-black text-xl text-brand-700">{subscription.remainingSessions} / {subscription.totalSessions}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 pt-3 border-t border-brand-200">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-brand-600 font-bold uppercase">Cancels:</span>
                                <span className="text-sm font-black text-brand-800">{subscription.cancelQuota}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-brand-600 font-bold uppercase">Reschedules:</span>
                                <span className="text-sm font-black text-brand-800">{subscription.rescheduleQuota}</span>
                            </div>
                        </div>
                    </div>
                )}

                {homework && (
                    <div className="p-6 border border-slate-200 rounded-3xl bg-white shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="font-black text-slate-900 mb-4 flex items-center text-[11px] uppercase tracking-widest">
                            <FileText className="mr-2 text-brand-600" size={18} /> {t.assignmentLabel}
                        </h3>
                        <div className="flex items-center justify-between gap-4">
                            <div className="font-bold text-slate-800 line-clamp-1">{homework.title}</div>
                            <button onClick={() => setIsHomeworkOpen(true)} className="px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
                                {!homework.submittedAt ? t.openTask : t.result}
                            </button>
                        </div>
                    </div>
                )}

                {booking.status === BookingStatus.SCHEDULED && (
                    <div className="space-y-4">
                         <a href={booking.joinLink} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full py-5 bg-brand-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-brand-700 shadow-xl shadow-brand-500/20 transition-all active:scale-[0.98]">
                            <Video className="mr-3" size={20} /> {t.enterClassroom}
                        </a>

                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setIsRescheduleOpen(true)} className="py-4 text-slate-600 font-black uppercase tracking-widest text-[11px] border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">
                                {t.reschedule}
                            </button>
                            <button onClick={() => setIsCancelOpen(true)} className="py-4 text-red-600 font-black uppercase tracking-widest text-[11px] border border-red-100 bg-red-50 rounded-2xl hover:bg-red-100 transition-all">
                                {t.cancelLesson}
                            </button>
                        </div>

                        {new Date(booking.startTime) < new Date() && (
                            <button
                                onClick={() => setIsMentorNoShowConfirmOpen(true)}
                                className="w-full py-4 text-orange-600 font-black uppercase tracking-widest text-[11px] border border-orange-200 bg-orange-50 rounded-2xl hover:bg-orange-100 transition-all flex items-center justify-center gap-2"
                            >
                                <AlertTriangle size={16} />
                                Mentor didn't show up
                            </button>
                        )}
                    </div>
                )}

                {booking.status === BookingStatus.COMPLETED && !booking.rating && (
                    <button onClick={() => setIsReviewOpen(true)} className="w-full py-5 bg-yellow-400 text-yellow-950 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-yellow-500 transition-all shadow-xl shadow-yellow-500/10">
                        {t.leaveReview}
                    </button>
                )}
            </div>
        </div>

        <CancelBookingModal 
            isOpen={isCancelOpen} 
            onClose={() => setIsCancelOpen(false)} 
            onConfirm={handleCancel} 
            booking={booking} 
            quota={subscription?.cancelQuota}
            cancelStats={cancelStats}
            isProcessing={isProcessing} 
        />
        <RescheduleModal 
            isOpen={isRescheduleOpen} 
            onClose={() => setIsRescheduleOpen(false)} 
            onConfirm={handleReschedule} 
            booking={booking} 
            quota={subscription?.rescheduleQuota} 
            isProcessing={isProcessing} 
        />
        <ReviewModal 
            isOpen={isReviewOpen} 
            onClose={() => setIsReviewOpen(false)} 
            onSubmit={handleReviewSubmit} 
            mentorName={booking.mentorName} 
        />
        {homework && <HomeworkModal isOpen={isHomeworkOpen} onClose={() => setIsHomeworkOpen(false)} homework={homework} onRefresh={loadData} />}

        {/* Mentor No-Show Confirmation Dialog */}
        {isMentorNoShowConfirmOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 animate-scale-in">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-orange-100 rounded-xl">
                            <AlertTriangle className="text-orange-600" size={24} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900">Report Mentor No-Show</h3>
                    </div>

                    <p className="text-slate-600">
                        Are you sure the mentor did not attend this session? This will be reviewed by our admin team.
                    </p>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <p className="text-xs text-yellow-800 font-bold">
                            ⚠️ False reports may result in account suspension. Please only report if the mentor genuinely did not attend.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setIsMentorNoShowConfirmOpen(false)}
                            disabled={isProcessing}
                            className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleMentorNoShow}
                            disabled={isProcessing}
                            className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-all disabled:opacity-50"
                        >
                            {isProcessing ? 'Submitting...' : 'Confirm Report'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
