
import React, { useState, useMemo } from 'react';
import { AvailabilitySlot } from '../types';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useApp } from '../App';
import { translations } from '../lib/i18n';

interface CalendarSlotPickerProps {
    availability: AvailabilitySlot[];
    requiredSlots: number;
    onSlotsChange: (slots: { day: string, time: string }[]) => void;
}

export const CalendarSlotPicker: React.FC<CalendarSlotPickerProps> = ({ availability, requiredSlots, onSlotsChange }) => {
    const { language } = useApp();
    const t = translations[language].mentee.calendar;
    const [selected, setSelected] = useState<{ day: string, time: string }[]>([]);

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // ✅ FIX: Generate 30-minute slots (08:00, 08:30, 09:00, 09:30, ...)
    const timeSlots: string[] = [];
    for (let h = 8; h < 23; h++) {
        timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
        timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
    }

    const getNextDate = (dayName: string) => {
        const dayMap: Record<string, number> = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
        const targetDay = dayMap[dayName];
        const now = new Date();
        const result = new Date();
        result.setDate(now.getDate() + (targetDay + 7 - now.getDay()) % 7);
        return result.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit' });
    };

    const toggleSlot = (day: string, time: string) => {
        const exists = selected.find(s => s.day === day && s.time === time);
        let newSelection = [];
        if (exists) {
            newSelection = selected.filter(s => s !== exists);
        } else {
            if (selected.length >= requiredSlots) return; 
            newSelection = [...selected, { day, time }];
        }
        setSelected(newSelection);
        onSlotsChange(newSelection);
    };

    // ✅ FIX: Generate available slots from availability ranges (like WeeklyCalendar)
    // This matches the logic in MenteeMentorDetail.tsx and MentorDashboard.tsx
    const availableSlots = useMemo(() => {
        const slots = new Set<string>(); // Use Set to avoid duplicates
        const today = new Date();
        
        // Generate slots for current week (7 days)
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            
            // Find matching availability slots for this day
            availability.forEach(slot => {
                if (slot.day !== dayName) return;
                
                // Calculate end time
                let slotEndTime: string;
                if (slot.endTime) {
                    slotEndTime = slot.endTime === '24:00' ? '23:59' : slot.endTime;
                } else if (slot.duration) {
                    const [startHour, startMin] = slot.startTime.split(':').map(Number);
                    const totalMinutes = startHour * 60 + startMin + slot.duration;
                    const endHour = Math.floor(totalMinutes / 60) % 24;
                    const endMin = totalMinutes % 60;
                    slotEndTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
                } else {
                    return; // Skip if no endTime or duration
                }
                
                // Parse times
                const [startHour, startMin] = slot.startTime.split(':').map(Number);
                const [endHour, endMin] = slotEndTime.split(':').map(Number);
                
                // Calculate total minutes
                let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
                if (totalMinutes < 0) {
                    totalMinutes = (24 * 60) - (startHour * 60 + startMin) + (endHour * 60 + endMin);
                }
                
                // Generate 30-minute slots from range
                const slotInterval = slot.interval || 30;
                for (let offset = 0; offset <= totalMinutes - slotInterval; offset += slotInterval) {
                    const slotStartMinutes = startHour * 60 + startMin + offset;
                    const slotStartHour = Math.floor(slotStartMinutes / 60) % 24;
                    const slotStartMin = slotStartMinutes % 60;
                    const slotStartTimeStr = `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMin).padStart(2, '0')}`;
                    
                    // Store as "day-time" key
                    slots.add(`${dayName}-${slotStartTimeStr}`);
                }
            });
        }
        
        return slots;
    }, [availability]);

    // ✅ FIX: Check if slot is available (from generated slots)
    const isAvailable = (day: string, time: string) => {
        return availableSlots.has(`${day}-${time}`);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <CalendarIcon size={18} className="text-brand-600" />
                    <span className="font-black text-slate-800 uppercase text-xs tracking-widest">
                        {t.title.replace('{count}', requiredSlots.toString())}
                    </span>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-brand-100 text-brand-700 rounded-full">
                    {t.selectedCount.replace('{current}', selected.length.toString()).replace('{max}', requiredSlots.toString())}
                </span>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
                <div className="min-w-[700px] grid grid-cols-8 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50">
                    <div className="p-3"></div>
                    {days.map(d => (
                        <div key={d} className="p-3 text-center">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{d}</div>
                            <div className="text-xs font-bold text-slate-700">{getNextDate(d)}</div>
                        </div>
                    ))}
                </div>
                
                <div className="min-w-[700px] max-h-[450px] overflow-y-auto custom-scrollbar">
                    {timeSlots.map((timeLabel, idx) => {
                        // ✅ FIX: Group by hour for better visual organization
                        const hour = parseInt(timeLabel.split(':')[0]);
                        const minutes = timeLabel.split(':')[1];
                        const isHourStart = minutes === '00';
                        
                        return (
                            <div key={timeLabel} className={`grid grid-cols-8 divide-x divide-slate-100 border-b border-slate-100 group ${isHourStart ? 'border-t-2 border-slate-200' : ''}`}>
                                <div className={`p-2 text-[10px] font-black text-slate-400 text-right pr-4 bg-slate-50/30 group-hover:bg-slate-50 transition-colors ${isHourStart ? 'font-bold' : 'text-slate-300'}`}>
                                    {isHourStart ? `${hour}:00` : timeLabel}
                                </div>
                                {days.map(d => {
                                    const available = isAvailable(d, timeLabel);
                                    const isSelected = selected.some(s => s.day === d && s.time === timeLabel);
                                    
                                    return (
                                        <div key={d + timeLabel} className={`h-8 p-1 relative transition-colors group-hover:bg-slate-50/20 ${isHourStart ? 'border-t border-slate-200' : ''}`}>
                                            {available && (
                                                <button
                                                    onClick={() => toggleSlot(d, timeLabel)}
                                                    disabled={!isSelected && selected.length >= requiredSlots}
                                                    className={`w-full h-full rounded-lg transition-all duration-200 flex items-center justify-center ${
                                                        isSelected 
                                                            ? 'bg-brand-600 shadow-lg shadow-brand-200 scale-105' 
                                                            : 'bg-blue-100/60 hover:bg-blue-200 cursor-pointer border border-blue-200/50' // ✅ FIX: Match WeeklyCalendar color (light blue)
                                                    } ${(!isSelected && selected.length >= requiredSlots) ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
                                                >
                                                    {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 font-medium text-center italic">
                {t.note}
            </div>
        </div>
    );
};
