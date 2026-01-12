
import React, { useState, useEffect } from 'react';
import { Mentor, Booking, BookingStatus, Homework, Payout } from '../types';
import { Star, MapPin, ArrowRight, Clock, Video, CheckCircle, XCircle, Calendar, Upload, FileText, AlertCircle, AlertTriangle, DollarSign, Download } from 'lucide-react';

// --- MENTOR CARD ---
export const MentorCard: React.FC<{ mentor: Mentor; onSelect: () => void }> = ({ mentor, onSelect }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all flex flex-col h-full group">
      <div className="p-6 flex flex-col items-center text-center flex-1">
        <div className="relative mb-4">
          <img 
            src={mentor.avatar} 
            alt={mentor.name} 
            className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 group-hover:border-brand-100 transition-colors" 
          />
          <div className="absolute -bottom-2 -right-2 bg-white px-2 py-1 rounded-full shadow-sm border border-slate-100 flex items-center text-xs font-bold text-slate-700">
            <Star size={12} className="text-yellow-400 mr-1 fill-current" />
            {mentor.rating}
          </div>
        </div>
        
        <h3 className="font-bold text-lg text-slate-900 mb-1">{mentor.name}</h3>
        <p className="text-sm text-slate-500 mb-3 flex items-center justify-center">
            <MapPin size={12} className="mr-1" /> {mentor.country}
        </p>
        
        <p className="text-slate-600 text-sm line-clamp-2 mb-4">{mentor.headline}</p>
        
        <div className="flex flex-wrap gap-2 justify-center mb-4">
            {mentor.specialties.slice(0, 3).map(s => (
                <span key={s} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md font-medium">{s}</span>
            ))}
        </div>
      </div>
      
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div>
            {/* Rate calculation moved to backend API - use getMentorLocalizedRate() */}
            <span className="text-lg font-bold text-brand-600">--</span>
            <span className="text-xs text-slate-500"> / hour</span>
        </div>
        <button 
            onClick={onSelect}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-brand-600 hover:text-white hover:border-brand-600 transition-colors flex items-center"
        >
            View Profile <ArrowRight size={14} className="ml-1" />
        </button>
      </div>
    </div>
  );
};

// --- LESSON ACTION MODAL (COMPLETE / RESCHEDULE / NO-SHOW) ---
interface LessonModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking;
    onAction: (action: 'COMPLETE' | 'RESCHEDULE' | 'NO_SHOW' | 'CANCEL', data?: any) => Promise<void> | void;
}

export const LessonModal: React.FC<LessonModalProps> = ({ isOpen, onClose, booking, onAction }) => {
    const [view, setView] = useState<'DETAILS' | 'NO_SHOW' | 'CANCEL'>('DETAILS');
    const [rescheduleTime, setRescheduleTime] = useState('');
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [evidence, setEvidence] = useState('');
    const [note, setNote] = useState('');
    const [cancelReason, setCancelReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Reset view and processing state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setView('DETAILS');
            setIsProcessing(false);
            setCancelReason('');
            setEvidence('');
            setNote('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Safety check: ensure booking has required fields
    if (!booking || !booking.menteeName || !booking.startTime) {
        console.error('Invalid booking data:', booking);
        return (
            <div className="p-6 text-center">
                <p className="text-red-600 font-bold">Error: Invalid booking data</p>
                <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-200 rounded-lg">Close</button>
            </div>
        );
    }

    const renderDetails = () => {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);
        const statusColors = {
            [BookingStatus.SCHEDULED]: 'bg-blue-100 text-blue-700 border-blue-200',
            [BookingStatus.COMPLETED]: 'bg-green-100 text-green-700 border-green-200',
            [BookingStatus.CANCELLED]: 'bg-slate-100 text-slate-700 border-slate-200',
            [BookingStatus.NO_SHOW]: 'bg-red-100 text-red-700 border-red-200',
        };

        const menteeName = booking.menteeName || 'Unknown';
        const menteeInitial = menteeName.charAt(0).toUpperCase();

        return (
        <div className="space-y-6">
            {/* Header with mentee info */}
            <div className="flex items-center space-x-4 p-5 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center text-white font-black text-xl shadow-md">
                    {menteeInitial}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-black text-slate-900 text-lg tracking-tight">{menteeName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-slate-600 font-semibold">{booking.totalCost} Credits</span>
                        <span className="text-slate-400">•</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${statusColors[booking.status] || statusColors[BookingStatus.SCHEDULED]}`}>
                            {booking.status}
                        </span>
                    </div>
                </div>
            </div>

            {/* Booking details grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 border-2 border-slate-200 rounded-xl bg-white hover:border-brand-300 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-xs text-slate-500 uppercase font-bold tracking-wide">Date</span>
                    </div>
                    <div className="font-bold text-slate-900 text-base">{bookingStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                </div>
                <div className="p-4 border-2 border-slate-200 rounded-xl bg-white hover:border-brand-300 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-xs text-slate-500 uppercase font-bold tracking-wide">Time</span>
                    </div>
                    <div className="font-bold text-slate-900 text-base">
                        {bookingStart.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {bookingEnd.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </div>
                </div>
            </div>

            {/* Join Meeting Button */}
            {booking.status === BookingStatus.SCHEDULED && booking.joinLink && (
                 <a 
                    href={booking.joinLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-200/50 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Video className="mr-2" size={20} /> Join Meeting
                </a>
            )}

            {/* Action Buttons */}
            {booking.status === BookingStatus.SCHEDULED && (
                <div className="pt-4 border-t-2 border-slate-100">
                    <div className="grid grid-cols-3 gap-3">
                        <button 
                            onClick={async () => {
                                setIsProcessing(true);
                                try {
                                    await onAction('COMPLETE');
                                } catch (error) {
                                    setIsProcessing(false);
                                }
                            }}
                            disabled={isProcessing}
                            className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-slate-200 bg-white hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            <CheckCircle size={22} className="mb-2 text-green-500 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold">Complete</span>
                        </button>
                        <button 
                            onClick={() => setView('CANCEL')}
                            disabled={isProcessing}
                            className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-slate-200 bg-white hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            <XCircle size={22} className="mb-2 text-orange-500 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold">Cancel</span>
                        </button>
                        <button 
                            onClick={() => setView('NO_SHOW')}
                            disabled={isProcessing}
                            className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-slate-200 bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            <AlertTriangle size={22} className="mb-2 text-red-500 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold">No-Show</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
        );
    };

    const renderReschedule = () => (
        <div className="space-y-4">
            <h3 className="font-bold text-lg">Reschedule Lesson</h3>
            <div>
                <label className="block text-sm text-slate-500 mb-1">New Date</label>
                <input type="date" className="w-full p-2 border border-slate-200 rounded-lg" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} />
            </div>
            <div>
                <label className="block text-sm text-slate-500 mb-1">New Time</label>
                <input type="time" className="w-full p-2 border border-slate-200 rounded-lg" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-4">
                <button onClick={() => setView('DETAILS')} className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded-lg">Back</button>
                <button 
                    onClick={() => {
                        const newStart = new Date(`${rescheduleDate}T${rescheduleTime}`);
                        if(!isNaN(newStart.getTime())) onAction('RESCHEDULE', { newStart });
                    }} 
                    className="flex-1 py-2 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600"
                >
                    Confirm Change
                </button>
            </div>
        </div>
    );

    const renderNoShow = () => (
         <div className="space-y-5">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle size={20} className="text-red-600" />
                </div>
                <h3 className="font-black text-xl text-slate-900 tracking-tight">Report No-Show</h3>
            </div>
            
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 text-red-900 p-4 rounded-xl">
                <div className="flex items-start gap-2">
                    <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">
                        Please upload a screenshot of the meeting waiting room as evidence.
                    </p>
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Evidence (Mock Upload)</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="screenshot.png" 
                        className="flex-1 p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all" 
                        value={evidence} 
                        onChange={e => setEvidence(e.target.value)}
                        disabled={isProcessing}
                    />
                    <button 
                        className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isProcessing}
                    >
                        <Upload size={20} />
                    </button>
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Note</label>
                <textarea 
                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all resize-none" 
                    rows={3} 
                    value={note} 
                    onChange={e => setNote(e.target.value)} 
                    placeholder="Waited 15 mins..."
                    disabled={isProcessing}
                />
            </div>
            
             <div className="flex gap-3 pt-2">
                <button 
                    onClick={() => setView('DETAILS')} 
                    disabled={isProcessing}
                    className="flex-1 py-3 text-slate-600 hover:bg-slate-50 rounded-xl border-2 border-slate-200 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Back
                </button>
                <button 
                    onClick={async () => {
                        setIsProcessing(true);
                        try {
                            await onAction('NO_SHOW', { evidence, note });
                        } catch (error) {
                            setIsProcessing(false);
                        }
                    }}
                    disabled={isProcessing}
                    className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-black hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-200/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Submitting...
                        </span>
                    ) : (
                        'Submit Report'
                    )}
                </button>
            </div>
        </div>
    );

    const renderCancel = () => {
        // Calculate hours until booking
        const now = new Date();
        const bookingStart = new Date(booking.startTime);
        const hoursUntil = (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60);
        const isLateCancellation = hoursUntil < 6;
        const hoursUntilDisplay = hoursUntil > 0 ? hoursUntil.toFixed(1) : '0';

        return (
            <div className="space-y-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <XCircle size={20} className="text-orange-600" />
                    </div>
                    <h3 className="font-black text-xl text-slate-900 tracking-tight">Cancel Booking</h3>
                </div>
                
                {/* Warning based on 6h rule */}
                {isLateCancellation ? (
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300 p-5 rounded-xl space-y-3 shadow-sm">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-orange-600 flex-shrink-0 mt-0.5" size={24} />
                            <div className="flex-1">
                                <p className="font-black text-orange-900 text-base">⚠️ Late Cancellation</p>
                                <p className="text-sm text-orange-800 mt-1.5 font-medium">
                                    This booking starts in <span className="font-black">{hoursUntilDisplay} hours</span>. 
                                    Canceling now will count toward your monthly limit.
                                </p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border-2 border-orange-200">
                            <p className="font-bold text-slate-900 text-sm mb-2">📋 Cancellation Policy</p>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li className="flex items-start">
                                    <span className="text-orange-600 mr-2">•</span>
                                    <span>You have <strong>3 late cancellations</strong> per month</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-600 mr-2">•</span>
                                    <span>Cancellations <strong>{'>'}6 hours</strong> before booking are <strong>FREE</strong></span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-red-600 mr-2">•</span>
                                    <span>After 3 late cancels, contact admin for assistance</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 p-5 rounded-xl shadow-sm">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                            <div className="flex-1">
                                <p className="font-black text-green-900 text-base">✅ Free Cancellation</p>
                                <p className="text-sm text-green-800 mt-1.5 font-medium">
                                    This booking starts in <span className="font-black">{hoursUntilDisplay} hours</span>. 
                                    Canceling now won't count toward your monthly limit.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Booking details summary */}
                <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Booking Summary</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <span className="text-xs text-slate-500 font-medium block mb-1">Student</span>
                            <span className="font-bold text-slate-900">{booking.menteeName || 'Unknown'}</span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 font-medium block mb-1">Date</span>
                            <span className="font-bold text-slate-900">{bookingStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 font-medium block mb-1">Time</span>
                            <span className="font-bold text-slate-900">{bookingStart.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 font-medium block mb-1">Credits</span>
                            <span className="font-bold text-green-600">{booking.totalCost} <span className="text-xs text-slate-500 font-normal">(refunded)</span></span>
                        </div>
                    </div>
                </div>

                {/* Cancellation reason (optional) */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Reason for cancellation <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <textarea 
                        className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all resize-none" 
                        rows={3} 
                        value={cancelReason} 
                        onChange={e => setCancelReason(e.target.value)} 
                        placeholder="e.g. Emergency, illness, schedule conflict..."
                    />
                </div>

                 <div className="flex gap-3 pt-2">
                    <button 
                        onClick={() => setView('DETAILS')} 
                        disabled={isProcessing}
                        className="flex-1 py-3 text-slate-600 hover:bg-slate-50 rounded-xl border-2 border-slate-200 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Back
                    </button>
                    <button 
                        onClick={async () => {
                            setIsProcessing(true);
                            try {
                                await onAction('CANCEL', { reason: cancelReason });
                            } catch (error) {
                                setIsProcessing(false);
                            }
                        }}
                        disabled={isProcessing}
                        className={`flex-1 py-3 text-white rounded-xl font-black shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                            isLateCancellation 
                                ? 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 shadow-orange-200/50' 
                                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-200/50'
                        }`}
                    >
                        {isProcessing ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Processing...
                            </span>
                        ) : (
                            isLateCancellation ? '⚠️ Confirm Late Cancel' : '✅ Confirm Cancel'
                        )}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-slide-up relative border border-slate-100">
                <button 
                    onClick={onClose} 
                    disabled={isProcessing}
                    className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <XCircle size={20} />
                </button>
                {view === 'DETAILS' && renderDetails()}
                {/* RESCHEDULE view removed - Mentor cannot reschedule */}
                {view === 'NO_SHOW' && renderNoShow()}
                {view === 'CANCEL' && renderCancel()}
            </div>
        </div>
    );
};

// --- HOMEWORK CARD ---
export const HomeworkCard: React.FC<{ homework: Homework, role: 'MENTOR' | 'MENTEE', onClick?: () => void }> = ({ homework, role, onClick }) => {
    // Compute status from date fields
    const status = homework.submittedAt ? (homework.gradedAt ? 'REVIEWED' : 'SUBMITTED') : 'PENDING';

    const statusColor = {
        'PENDING': 'bg-yellow-100 text-yellow-700',
        'SUBMITTED': 'bg-blue-100 text-blue-700',
        'REVIEWED': 'bg-green-100 text-green-700'
    };

    return (
        <div onClick={onClick} className={`bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all cursor-pointer relative`}>
             <div className="flex justify-between items-start mb-3">
                 <div>
                     <h4 className="font-bold text-slate-900">{homework.title}</h4>
                     <p className="text-sm text-slate-500">Due: {new Date(homework.dueDate || '').toLocaleDateString()}</p>
                 </div>
                 <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColor[status]}`}>
                     {status}
                 </span>
             </div>

             <p className="text-slate-600 text-sm mb-4 line-clamp-2">{homework.description}</p>

             {role === 'MENTOR' && status === 'SUBMITTED' && (
                 <div className="flex items-center text-blue-600 text-sm font-medium">
                     <FileText size={16} className="mr-2" /> Review Submission
                 </div>
             )}
              {role === 'MENTEE' && status === 'PENDING' && (
                 <div className="flex items-center text-slate-600 text-sm font-medium">
                     <Upload size={16} className="mr-2" /> Upload Work
                 </div>
             )}
              {status === 'REVIEWED' && (
                 <div className="flex items-center text-green-600 text-sm font-medium">
                     <CheckCircle size={16} className="mr-2" /> See Feedback {homework.grade && `(${homework.grade})`}
                 </div>
             )}
        </div>
    );
};

// --- EARNINGS CARD ---
export const EarningsCard: React.FC<{ balance: number, pending: number }> = ({ balance, pending }) => (
    <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center space-x-2 opacity-80 mb-2">
                <DollarSign size={20} />
                <span className="font-medium">Available</span>
            </div>
            <div className="text-4xl font-extrabold">${balance}</div>
            <p className="text-sm opacity-70 mt-2">Ready for payout</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
             <div className="flex items-center space-x-2 text-slate-500 mb-2">
                <Clock size={20} />
                <span className="font-medium">Pending</span>
            </div>
            <div className="text-4xl font-extrabold text-slate-900">${pending}</div>
            <p className="text-sm text-slate-400 mt-2">From scheduled lessons</p>
        </div>
    </div>
);

// --- SLOT MODAL ---
interface SlotModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    mentor: Mentor;
    date: Date;
    isProcessing: boolean;
    userCredits: number;
}

export const SlotModal: React.FC<SlotModalProps> = ({ isOpen, onClose, onConfirm, mentor, date, isProcessing, userCredits }) => {
    if (!isOpen) return null;

    // Rate calculated dynamically - check via getMentorLocalizedRate() API
    const canAfford = true; // Disabled: userCredits >= mentor.hourlyRate;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">&times;</button>
                
                <h3 className="text-xl font-bold text-slate-900 mb-1">Confirm Booking</h3>
                <p className="text-slate-500 text-sm mb-6">Review the details below.</p>

                <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100 space-y-3">
                    <div className="flex justify-between">
                        <span className="text-slate-500 text-sm">Mentor</span>
                        <span className="font-bold text-slate-900">{mentor.name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500 text-sm">Date</span>
                        <span className="font-bold text-slate-900">{date.toLocaleDateString()}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-slate-500 text-sm">Time</span>
                        <span className="font-bold text-slate-900">{date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-3 flex justify-between">
                         <span className="text-slate-500 text-sm">Cost</span>
                         {/* Rate calculated dynamically via backend */}
                         <span className="font-bold text-brand-600">--</span>
                    </div>
                </div>

                {!canAfford && (
                     <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4 flex items-center">
                        <AlertCircle size={16} className="mr-2" />
                        Insufficient credits (Balance: {userCredits})
                     </div>
                )}

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-xl">Cancel</button>
                    <button 
                        onClick={onConfirm} 
                        disabled={!canAfford || isProcessing}
                        className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Booking...' : 'Confirm Booking'}
                    </button>
                </div>
            </div>
        </div>
    );
};
