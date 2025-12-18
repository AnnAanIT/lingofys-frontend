
import React, { useState } from 'react';
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
    const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8 AM to 10 PM

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

    const isAvailable = (day: string, time: string) => {
        return availability.some(s => s.day === day && s.startTime.startsWith(time.split(':')[0]));
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
                    {hours.map(h => {
                        const timeLabel = `${h.toString().padStart(2, '0')}:00`;
                        return (
                            <div key={h} className="grid grid-cols-8 divide-x divide-slate-100 border-b border-slate-100 group">
                                <div className="p-3 text-[10px] font-black text-slate-400 text-right pr-4 bg-slate-50/30 group-hover:bg-slate-50 transition-colors">{timeLabel}</div>
                                {days.map(d => {
                                    const available = isAvailable(d, timeLabel);
                                    const isSelected = selected.some(s => s.day === d && s.time === timeLabel);
                                    
                                    return (
                                        <div key={d + h} className="h-12 p-1.5 relative transition-colors group-hover:bg-slate-50/20">
                                            {available && (
                                                <button
                                                    onClick={() => toggleSlot(d, timeLabel)}
                                                    disabled={!isSelected && selected.length >= requiredSlots}
                                                    className={`w-full h-full rounded-xl transition-all duration-200 flex items-center justify-center ${
                                                        isSelected 
                                                            ? 'bg-brand-600 shadow-lg shadow-brand-200 scale-105' 
                                                            : 'bg-green-100/60 hover:bg-green-200 cursor-pointer border border-green-200/50'
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
