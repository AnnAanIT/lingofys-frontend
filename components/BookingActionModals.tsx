
import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Calendar, Clock, Loader2, Globe } from 'lucide-react';
import { Booking, AvailabilitySlot, BookingStatus } from '../types';
import { api } from '../services/api';
import { createAbsoluteDate, getTimezoneByCountry, convertTimezone } from '../lib/timeUtils';

// --- CANCEL MODAL ---
interface CancelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    booking: Booking;
    quota?: number;
    cancelStats?: { cancellationCount: number; remaining: number; canCancel: boolean } | null;
    isProcessing: boolean;
}

export const CancelBookingModal: React.FC<CancelModalProps> = ({ isOpen, onClose, onConfirm, booking, quota, cancelStats, isProcessing }) => {
    if (!isOpen) return null;
    
    const isSub = booking.type === 'SUBSCRIPTION';
    const startTime = new Date(booking.startTime);
    const now = new Date();
    const millisUntil = startTime.getTime() - now.getTime();
    const hoursUntil = millisUntil / (1000 * 60 * 60);
    const minutesUntil = Math.floor(millisUntil / (1000 * 60));
    const canCancel2h = hoursUntil >= 2;
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-slide-up relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
                <div className={`w-12 h-12 ${canCancel2h ? 'bg-orange-100' : 'bg-red-100'} rounded-full flex items-center justify-center mb-4 mx-auto ${canCancel2h ? 'text-orange-600' : 'text-red-600'}`}>
                    <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Cancel Lesson?</h3>
                
                <div className="text-sm text-slate-500 space-y-2 mb-6">
                    {/* 2-HOUR RULE WARNING */}
                    {!canCancel2h && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                            <p className="text-red-700 font-semibold">❌ Cannot Cancel</p>
                            <p className="text-red-600 text-xs mt-1">
                                Need 2 hours notice. Lesson starts in {Math.floor(hoursUntil)}h {minutesUntil % 60}m
                            </p>
                        </div>
                    )}
                    
                    {canCancel2h && (
                        <>
                            {/* TIME WARNING */}
                            <div className={`${hoursUntil < 6 ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-green-50 border-green-200 text-green-700'} border rounded-lg p-3 text-center`}>
                                <p className="font-semibold">⏰ {Math.floor(hoursUntil)}h {minutesUntil % 60}m until lesson</p>
                                {hoursUntil < 6 && <p className="text-xs mt-1">Last-minute cancellation</p>}
                            </div>
                            
                            {/* QUOTA INFO */}
                            {isSub && quota !== undefined && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                    <p className="text-blue-700 font-semibold">📊 Package Cancels: {quota} left</p>
                                    <p className="text-blue-600 text-xs mt-1">You'll receive 1 session back</p>
                                </div>
                            )}
                            
                            {!isSub && cancelStats && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                    <p className="text-blue-700 font-semibold">📊 Monthly Cancels: {cancelStats.remaining}/3 left</p>
                                    <p className="text-blue-600 text-xs mt-1">You'll receive 100% credits back</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
                
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50">
                        Keep
                    </button>
                    <button 
                        onClick={onConfirm} 
                        disabled={isProcessing || !canCancel2h} 
                        className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Processing...' : 'Confirm Cancel'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- RESCHEDULE MODAL ---
interface RescheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (newTime: string) => Promise<void>;
    booking: Booking;
    quota?: number;
    isProcessing: boolean;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({ isOpen, onClose, onConfirm, booking, quota, isProcessing }) => {
    const [availableSlots, setAvailableSlots] = useState<{ id: string, start: Date }[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    useEffect(() => {
        if (isOpen) {
            const loadAvailability = async () => {
                setLoading(true);
                try {
                    const [mentor, mentorBookings] = await Promise.all([
                        api.getMentorById(booking.mentorId),
                        api.getBookings()
                    ]);
                    
                    if (!mentor) throw new Error("Mentor data unavailable");

                    const mentorTz = mentor.timezone || getTimezoneByCountry(mentor.country || 'US');
                    const slots: { id: string, start: Date }[] = [];
                    const today = new Date();

                    // Check next 14 days
                    for (let i = 0; i < 14; i++) {
                        const d = new Date(today);
                        d.setDate(today.getDate() + i);
                        const dayInMentorTz = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: mentorTz });
                        
                        const daySlots = mentor.availability.filter(s => s.day === dayInMentorTz);
                        daySlots.forEach(slot => {
                            const start = createAbsoluteDate(d, slot.startTime, mentorTz);
                            if (start < today) return;

                            const isBooked = mentorBookings.some(b => 
                                ['SCHEDULED', 'COMPLETED'].includes(b.status) &&
                                Math.abs(new Date(b.startTime).getTime() - start.getTime()) < 1000
                            );

                            if (!isBooked) {
                                slots.push({ id: `${start.getTime()}`, start });
                            }
                        });
                    }
                    setAvailableSlots(slots.sort((a,b) => a.start.getTime() - b.start.getTime()));
                } catch (e: any) {
                    setError(e.message);
                } finally {
                    setLoading(false);
                }
            };
            loadAvailability();
        }
    }, [isOpen, booking.mentorId]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (!selectedSlot) return;
        const slot = availableSlots.find(s => s.id === selectedSlot);
        if (slot) {
            await onConfirm(slot.start.toISOString());
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up relative flex flex-col max-h-[85vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Reschedule Lesson</h3>
                <p className="text-sm text-slate-500 mb-4">Choose a new time with <strong>{booking.mentorName}</strong>.</p>
                
                {booking.type === 'SUBSCRIPTION' && (
                    <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-xs font-bold mb-4 flex justify-between">
                        <span>Reschedules remaining:</span>
                        <span>{quota}</span>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 mb-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <Loader2 className="animate-spin mb-2" />
                            <span className="text-sm">Finding available slots...</span>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-500 text-sm">{error}</div>
                    ) : availableSlots.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">No available slots found for the next 14 days.</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {availableSlots.map(slot => (
                                <button
                                    key={slot.id}
                                    onClick={() => setSelectedSlot(slot.id)}
                                    className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                                        selectedSlot === slot.id 
                                        ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm' 
                                        : 'border-slate-100 hover:border-brand-200 bg-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                                            <Calendar size={16} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-sm">
                                                {slot.start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                                <Clock size={12} /> {slot.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                    {selectedSlot === slot.id && <div className="w-5 h-5 bg-brand-600 rounded-full flex items-center justify-center"><X size={12} className="text-white rotate-45" /></div>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-100 pt-4">
                    <button 
                        onClick={handleConfirm}
                        disabled={!selectedSlot || isProcessing || (booking.type === 'SUBSCRIPTION' && quota === 0)}
                        className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isProcessing ? 'Processing...' : 'Confirm Reschedule'}
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-2 flex items-center justify-center gap-1">
                        <Globe size={10} /> Times shown in your timezone: {userTz}
                    </p>
                </div>
            </div>
        </div>
    );
};
