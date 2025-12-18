
import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar as CalendarIcon, RotateCw, Loader2 } from 'lucide-react';
import { AvailabilitySlot } from '../types';

interface AddAvailabilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (slot: Omit<AvailabilitySlot, 'id' | 'mentorId'>) => Promise<void>;
    initialDate: Date | null;
    timezone?: string;
}

export const AddAvailabilityModal: React.FC<AddAvailabilityModalProps> = ({ 
    isOpen, onClose, onSave, initialDate, timezone 
}) => {
    const [day, setDay] = useState('Mon');
    const [startTime, setStartTime] = useState('09:00');
    const [duration, setDuration] = useState(60);
    const [recurring, setRecurring] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (initialDate && isOpen) {
            const displayTz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: displayTz });
            const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: displayTz });

            setDay(dayFormatter.format(initialDate));
            setStartTime(timeFormatter.format(initialDate));
        }
    }, [initialDate, isOpen, timezone]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            // Normalize day to "Mon", "Tue" etc. (Sentence case, 3 letters)
            const cleanDay = day.replace(/[^a-zA-Z]/g, '');
            const normalizedDay = cleanDay.substring(0, 3).charAt(0).toUpperCase() + cleanDay.substring(1, 3).toLowerCase();

            await onSave({
                day: normalizedDay,
                startTime,
                duration,
                recurring
            });
            onClose();
        } catch (error) {
            console.error("Save failed:", error);
            // Error is handled/alerted by parent component
        } finally {
            setIsSaving(false);
        }
    };

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600" disabled={isSaving}>
                    <X size={20} />
                </button>
                
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <CalendarIcon className="text-brand-600" /> Add Availability
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Day of Week</label>
                        <div className="grid grid-cols-7 gap-1">
                            {days.map(d => {
                                const currentNormalized = day.replace(/[^a-zA-Z]/g, '').substring(0, 3).toLowerCase();
                                const dNormalized = d.toLowerCase();
                                return (
                                    <button
                                        key={d}
                                        type="button"
                                        disabled={isSaving}
                                        onClick={() => setDay(d)}
                                        className={`py-2 text-xs font-bold rounded-lg transition-colors ${
                                            currentNormalized === dNormalized ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {d}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                <input 
                                    type="time" 
                                    value={startTime} 
                                    disabled={isSaving}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none disabled:bg-slate-50"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                            <select 
                                value={duration} 
                                disabled={isSaving}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none disabled:bg-slate-50"
                            >
                                <option value={30}>30 Minutes</option>
                                <option value={60}>60 Minutes</option>
                            </select>
                        </div>
                    </div>

                    <div 
                        className={`flex items-center p-4 rounded-xl border cursor-pointer transition-colors ${isSaving ? 'bg-slate-100 border-slate-200 pointer-events-none' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`} 
                        onClick={() => !isSaving && setRecurring(!recurring)}
                    >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${recurring ? 'bg-brand-600 border-brand-600' : 'bg-white border-slate-300'}`}>
                            {recurring && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <div className="flex-1">
                            <div className="font-medium text-slate-900 flex items-center gap-2">
                                <RotateCw size={14} className="text-slate-500" /> Recurring Weekly
                            </div>
                            <div className="text-xs text-slate-500">Repeat this slot every week</div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button 
                        onClick={onClose} 
                        disabled={isSaving}
                        className="flex-1 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSaving}
                        className="flex-1 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-100 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSaving && <Loader2 size={18} className="animate-spin" />}
                        {isSaving ? 'Saving...' : 'Save Slot'}
                    </button>
                </div>
            </div>
        </div>
    );
};
