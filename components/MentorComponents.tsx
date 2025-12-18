
import React, { useState } from 'react';
import { Mentor, Booking, BookingStatus, Homework, Payout } from '../types';
import { Star, MapPin, ArrowRight, Clock, Video, CheckCircle, XCircle, Calendar, Upload, FileText, AlertCircle, DollarSign, Download } from 'lucide-react';

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
        
        <p className="text-slate-600 text-sm line-clamp-2 mb-4">{mentor.bio}</p>
        
        <div className="flex flex-wrap gap-2 justify-center mb-4">
            {mentor.specialties.slice(0, 3).map(s => (
                <span key={s} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md font-medium">{s}</span>
            ))}
        </div>
      </div>
      
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div>
            <span className="text-lg font-bold text-brand-600">{mentor.hourlyRate} Credits</span>
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
    onAction: (action: 'COMPLETE' | 'RESCHEDULE' | 'NO_SHOW', data?: any) => void;
}

export const LessonModal: React.FC<LessonModalProps> = ({ isOpen, onClose, booking, onAction }) => {
    const [view, setView] = useState<'DETAILS' | 'RESCHEDULE' | 'NO_SHOW'>('DETAILS');
    const [rescheduleTime, setRescheduleTime] = useState('');
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [evidence, setEvidence] = useState('');
    const [note, setNote] = useState('');

    if (!isOpen) return null;

    const renderDetails = () => (
        <div className="space-y-6">
            <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-xl">
                    {booking.menteeName.charAt(0)}
                </div>
                <div>
                    <h4 className="font-bold text-slate-900">{booking.menteeName}</h4>
                    <p className="text-sm text-slate-500">English Mentee • {booking.totalCost} Credits</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border border-slate-200 rounded-lg">
                    <span className="text-xs text-slate-400 uppercase font-bold">Date</span>
                    <div className="font-medium text-slate-800">{new Date(booking.startTime).toLocaleDateString()}</div>
                </div>
                <div className="p-3 border border-slate-200 rounded-lg">
                    <span className="text-xs text-slate-400 uppercase font-bold">Time</span>
                    <div className="font-medium text-slate-800">{new Date(booking.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
            </div>

            {booking.status === BookingStatus.SCHEDULED && (
                 <a 
                    href={booking.joinLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md shadow-blue-200"
                >
                    <Video className="mr-2" size={20} /> Join Meeting
                </a>
            )}

            {booking.status === BookingStatus.SCHEDULED && (
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                    <button 
                        onClick={() => onAction('COMPLETE')}
                        className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all"
                    >
                        <CheckCircle size={24} className="mb-1 text-green-500" />
                        <span className="text-xs font-bold">Complete</span>
                    </button>
                    <button 
                        onClick={() => setView('RESCHEDULE')}
                        className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:bg-yellow-50 hover:border-yellow-200 hover:text-yellow-700 transition-all"
                    >
                        <Calendar size={24} className="mb-1 text-yellow-500" />
                        <span className="text-xs font-bold">Reschedule</span>
                    </button>
                    <button 
                        onClick={() => setView('NO_SHOW')}
                        className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all"
                    >
                        <XCircle size={24} className="mb-1 text-red-500" />
                        <span className="text-xs font-bold">No-Show</span>
                    </button>
                </div>
            )}
        </div>
    );

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
         <div className="space-y-4">
            <h3 className="font-bold text-lg text-red-600">Report No-Show</h3>
            <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm">
                Please upload a screenshot of the meeting waiting room as evidence.
            </div>
            <div>
                <label className="block text-sm text-slate-500 mb-1">Evidence (Mock Upload)</label>
                <div className="flex gap-2">
                    <input type="text" placeholder="screenshot.png" className="flex-1 p-2 border border-slate-200 rounded-lg" value={evidence} onChange={e => setEvidence(e.target.value)} />
                    <button className="p-2 bg-slate-100 rounded-lg"><Upload size={20} /></button>
                </div>
            </div>
            <div>
                <label className="block text-sm text-slate-500 mb-1">Note</label>
                <textarea className="w-full p-2 border border-slate-200 rounded-lg" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Waited 15 mins..." />
            </div>
             <div className="flex gap-2 pt-4">
                <button onClick={() => setView('DETAILS')} className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded-lg">Back</button>
                <button 
                    onClick={() => onAction('NO_SHOW', { evidence, note })} 
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
                >
                    Submit Report
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">&times;</button>
                {view === 'DETAILS' && renderDetails()}
                {view === 'RESCHEDULE' && renderReschedule()}
                {view === 'NO_SHOW' && renderNoShow()}
            </div>
        </div>
    );
};

// --- HOMEWORK CARD ---
export const HomeworkCard: React.FC<{ homework: Homework, role: 'MENTOR' | 'MENTEE', onClick?: () => void }> = ({ homework, role, onClick }) => {
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
                 <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColor[homework.status]}`}>
                     {homework.status}
                 </span>
             </div>
             
             <p className="text-slate-600 text-sm mb-4 line-clamp-2">{homework.description}</p>
             
             {role === 'MENTOR' && homework.status === 'SUBMITTED' && (
                 <div className="flex items-center text-blue-600 text-sm font-medium">
                     <FileText size={16} className="mr-2" /> Review Submission
                 </div>
             )}
              {role === 'MENTEE' && homework.status === 'PENDING' && (
                 <div className="flex items-center text-slate-600 text-sm font-medium">
                     <Upload size={16} className="mr-2" /> Upload Work
                 </div>
             )}
              {homework.status === 'REVIEWED' && (
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

    const canAfford = userCredits >= mentor.hourlyRate;

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
                         <span className="font-bold text-brand-600">{mentor.hourlyRate} Credits</span>
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
