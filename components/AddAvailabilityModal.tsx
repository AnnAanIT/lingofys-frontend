
import React, { useState, useEffect } from 'react';
import { X, Clock, RotateCw, Loader2 } from 'lucide-react';
import { AvailabilitySlot } from '../types';

interface AddAvailabilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (slots: Omit<AvailabilitySlot, 'id' | 'mentorId'>[]) => Promise<void>;
    initialDate: Date | null;
    timezone?: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const AddAvailabilityModal: React.FC<AddAvailabilityModalProps> = ({
    isOpen, onClose, onSave, initialDate, timezone
}) => {
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('12:00');
    const [recurring, setRecurring] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (initialDate && isOpen) {
            const displayTz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

            const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: displayTz });
            const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: displayTz });

            const dayStr = dayFormatter.format(initialDate);
            const cleanDay = dayStr.replace(/[^a-zA-Z]/g, '').substring(0, 3);
            const normalized = cleanDay.charAt(0).toUpperCase() + cleanDay.substring(1).toLowerCase();

            setSelectedDays([normalized]);
            const time = timeFormatter.format(initialDate);
            setStartTime(time);
            // Default endTime = startTime + 3 hours
            const [h, m] = time.split(':').map(Number);
            const endH = Math.min(h + 3, 23);
            setEndTime(`${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        }
    }, [initialDate, isOpen, timezone]);

    if (!isOpen) return null;

    const toggleDay = (day: string) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleSubmit = async () => {
        if (selectedDays.length === 0) return;

        setIsSaving(true);
        try {
            const [startHour, startMin] = startTime.split(':').map(Number);
            const [endHour, endMin] = endTime.split(':').map(Number);
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            const duration = endMinutes >= startMinutes
                ? endMinutes - startMinutes
                : (24 * 60) - startMinutes + endMinutes;

            const slots = selectedDays.map(day => ({
                day,
                startTime,
                endTime,
                interval: 30,
                duration,
                recurring
            }));

            await onSave(slots);
            onClose();
        } catch (error) {
            console.error("Save failed:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const slotCount = selectedDays.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600" disabled={isSaving}>
                    <X size={20} />
                </button>

                <h3 className="text-xl font-bold text-slate-900 mb-6">Add Availability</h3>

                <div className="space-y-5">
                    {/* Day Multi-Select */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Days</label>
                        <div className="grid grid-cols-7 gap-1">
                            {DAYS.map(d => (
                                <button
                                    key={d}
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => toggleDay(d)}
                                    className={`py-2 text-xs font-bold rounded-lg transition-colors ${
                                        selectedDays.includes(d)
                                            ? 'bg-brand-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Start Time</label>
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
                            <label className="block text-xs text-slate-500 mb-1">End Time</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                <input
                                    type="time"
                                    value={endTime}
                                    disabled={isSaving}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none disabled:bg-slate-50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Recurring Toggle */}
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
                            <div className="text-xs text-slate-500">Repeat every week</div>
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
                        disabled={isSaving || slotCount === 0}
                        className="flex-1 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-100 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSaving && <Loader2 size={18} className="animate-spin" />}
                        {isSaving ? 'Saving...' : `Save ${slotCount} slot${slotCount !== 1 ? 's' : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
};
