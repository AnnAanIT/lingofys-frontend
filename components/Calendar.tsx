
import React, { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, RotateCw, Globe, Trash2 } from 'lucide-react';
import { convertTimezone, formatInTimezone, createAbsoluteDate } from '../lib/timeUtils';

interface CalendarProps {
  events: { 
    id: string; 
    title: string; 
    start: Date; 
    end: Date; 
    type: 'available' | 'booked' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'; 
    isRecurring?: boolean;
    slotId?: string; // ✅ For delete functionality
  }[];
  onSlotClick?: (date: Date) => void;
  onEventClick?: (id: string) => void;
  onEventDelete?: (slotId: string, slotStartTime: Date) => void; // ✅ New: Delete specific 30-minute slot (slotId = range ID, slotStartTime = event start time)
  viewMode: 'mentor' | 'mentee';
  timezone: string;
}

export const WeeklyCalendar: React.FC<CalendarProps> = ({ events, onSlotClick, onEventClick, onEventDelete, viewMode, timezone }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // "Bây giờ" tại múi giờ hiển thị
  const nowInTz = convertTimezone(now, timezone);

  const getDaysOfWeek = (date: Date) => {
    // Chuyển date gốc sang múi giờ chỉ định trước khi tính toán đầu tuần
    const dateInTz = convertTimezone(date, timezone);
    const start = new Date(dateInTz);
    const day = dateInTz.getDay(); 
    const diff = dateInTz.getDate() - day + (day === 0 ? -6 : 1); // Bắt đầu từ Thứ 2
    start.setDate(diff);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const days = getDaysOfWeek(currentDate);
  // Display hours from 6:00 to 23:00 (17 hours)
  const hours = Array.from({ length: 17 }, (_, i) => i + 6); 

  const isToday = (dayDate: Date) => {
      return dayDate.getDate() === nowInTz.getDate() && 
             dayDate.getMonth() === nowInTz.getMonth() && 
             dayDate.getFullYear() === nowInTz.getFullYear();
  };

  const getNowLinePosition = () => {
      const currentHour = nowInTz.getHours();
      const currentMinutes = nowInTz.getMinutes();
      if (currentHour < 6 || currentHour >= 23) return null;
      return ((currentHour - 6) * 60) + currentMinutes;
  };

  const nowLinePos = getNowLinePosition();

  // ✅ Phase 1.3: Pre-index events for O(1) lookup
  // ✅ Fixed: Index all events (can have multiple 30p slots per hour)
  const eventIndex = useMemo(() => {
    const index = new Map<string, typeof events[0][]>();
    events.forEach(event => {
      const eStartInTz = convertTimezone(event.start, timezone);
      const startHour = eStartInTz.getHours();
      const startMinutes = eStartInTz.getMinutes();
      // Include minutes in key to support multiple slots per hour (e.g., 8:00 and 8:30)
      const key = `${eStartInTz.getFullYear()}-${eStartInTz.getMonth()}-${eStartInTz.getDate()}-${startHour}-${startMinutes}`;
      if (!index.has(key)) {
        index.set(key, []);
      }
      index.get(key)!.push(event);
    });
    return index;
  }, [events, timezone]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white sticky top-0 z-30">
        <div>
            <h3 className="font-black text-slate-800 uppercase tracking-tight">
                {days[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="text-[10px] text-brand-600 font-black uppercase tracking-widest flex items-center gap-1 mt-1">
                <Globe size={10} /> Local Timezone: {timezone}
            </div>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => setCurrentDate(new Date())} className="text-[10px] font-black uppercase tracking-widest text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg transition-all">Today</button>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate()-7); setCurrentDate(d); }} className="p-1.5 hover:bg-white rounded-lg text-slate-500 transition-all shadow-none hover:shadow-sm"><ChevronLeft size={16} /></button>
            <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate()+7); setCurrentDate(d); }} className="p-1.5 hover:bg-white rounded-lg text-slate-500 transition-all shadow-none hover:shadow-sm"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <div className="min-w-[800px] relative">
          {/* Header */}
          <div className="grid grid-cols-8 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-20 backdrop-blur-md">
            <div className="p-3 text-center text-[10px] font-black text-slate-400 uppercase flex items-center justify-center border-r border-slate-100">TIME</div>
            {days.map(day => {
              const active = isToday(day);
              return (
                <div key={day.toISOString()} className={`p-3 text-center border-r border-slate-100 ${active ? 'bg-brand-50/30' : ''}`}>
                  <div className={`text-[10px] font-black uppercase mb-1 ${active ? 'text-brand-600' : 'text-slate-400'}`}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className={`text-lg font-black mx-auto w-9 h-9 flex items-center justify-center rounded-xl ${active ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-700'}`}>{day.getDate()}</div>
                </div>
              );
            })}
          </div>

          <div className="relative">
            {/* Red Line "Now" */}
            {nowLinePos !== null && days.some(d => isToday(d)) && (
                <div className="absolute z-10 w-full pointer-events-none flex" style={{ top: `${nowLinePos}px` }}>
                    <div className="w-[12.5%] h-px bg-transparent"></div>
                    {days.map((day, idx) => (
                        <div key={idx} className="w-[12.5%] relative">
                            {isToday(day) && (
                                <div className="absolute w-full flex items-center">
                                    <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shadow-sm"></div>
                                    <div className="flex-1 h-px bg-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {hours.map(hour => {
              // DEBUG: Log first iteration only
              if (hour === 7) {
                console.log(`🎨 [Calendar Render] Rendering hours for ${days.length} days`);
                console.log(`📅 Days:`, days.map(d => d.toDateString()));
                console.log(`🎯 Events to match:`, events.length);
                console.log(`🌍 Timezone:`, timezone);
              }

              return (
              <div key={hour} className="grid grid-cols-8 border-b border-slate-100 min-h-[60px] hover:bg-slate-50/30 transition-colors">
                <div className="p-2 text-right text-xs font-bold text-slate-500 border-r border-slate-200 bg-gradient-to-r from-slate-50 to-white sticky left-0 z-10 backdrop-blur-sm">{hour}:00</div>
                {days.map((day, dayIdx) => {
                  // ✅ Phase 1.3: O(1) lookup using pre-indexed events
                  // Check for events starting at :00 and :30 in this hour
                  const key00 = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}-${hour}-0`;
                  const key30 = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}-${hour}-30`;
                  const eventsInSlot = [
                    ...(eventIndex.get(key00) || []),
                    ...(eventIndex.get(key30) || [])
                  ];

                  // Xác định xem slot này đã qua chưa
                  const slotDate = new Date(day);
                  slotDate.setHours(hour, 0, 0, 0);
                  const isPast = slotDate < nowInTz;
                  
                  return (
                    <div key={day.toISOString()} className={`relative border-r border-slate-100 transition-all group ${isPast ? 'bg-slate-50/40' : 'hover:bg-slate-50/50'}`}
                      onClick={() => {
                          if (eventsInSlot.length > 0) {
                              const firstEvent = eventsInSlot[0];
                              if (viewMode === 'mentee') {
                                  if (firstEvent.type === 'available' && !isPast) onSlotClick?.(firstEvent.start);
                              } else if (viewMode === 'mentor') {
                                  onEventClick?.(firstEvent.id);
                              }
                          } else {
                              if (viewMode === 'mentor' && !isPast) {
                                  // Khi mentor click vào ô trống, chúng ta tạo Date UTC chuẩn dựa trên múi giờ hiển thị
                                  const absoluteStart = createAbsoluteDate(day, `${hour}:00`, timezone);
                                  onSlotClick?.(absoluteStart);
                              }
                          }
                      }}
                    >
                      {/* Render all events in this hour (can have multiple 30p slots: 8:00 and 8:30) */}
                      {eventsInSlot.map((event) => {
                        // ✅ Simplified: Calculate event height based on duration (simple & user-friendly)
                        const eStartInTz = convertTimezone(event.start, timezone);
                        const eventDuration = (event.end.getTime() - event.start.getTime()) / (1000 * 60); // minutes
                        
                        // Only show event in the hour it starts (simpler logic)
                        const startsInThisHour = eStartInTz.getHours() === hour;
                        if (!startsInThisHour) return null; // Don't render if event doesn't start in this hour
                        
                        // Simple height calculation: Always 30p = 30px (system only supports 30p slots)
                        const eventHeight = Math.max(28, Math.min((eventDuration / 60) * 60, 60)); // 28px min, 60px max (but should always be 30px)
                        
                        // Position from start time
                        const minutesOffset = eStartInTz.getMinutes();
                        const eventTop = (minutesOffset / 60) * 60; // pixels offset within hour row
                        
                        // Format time and duration display
                        const startMinutes = eStartInTz.getMinutes();
                        const timeDisplay = startMinutes === 0 
                          ? `${hour}:00` 
                          : `${hour}:${String(startMinutes).padStart(2, '0')}`;
                        
                        // Duration badge: Always 30m (system only supports 30p slots)
                        const durationBadge = '30m';
                        
                        // ✅ UI/UX Improvement: Compact display when many slots
                        // Make slots more compact when there are multiple in the same hour
                        const isCompact = eventsInSlot.length > 1;
                        const padding = isCompact ? 'p-1' : 'p-1.5';
                        const textSize = isCompact ? 'text-[9px]' : 'text-[10px]';

                        return (
                          <div 
                            key={event.id}
                            className={`absolute rounded-lg ${padding} ${textSize} font-semibold shadow-sm transition-all flex flex-col group/event
                              ${isPast ? 'opacity-50 grayscale' : 'cursor-pointer hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]'} 
                              ${event.type === 'available' ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-blue-500 hover:from-blue-100 hover:to-blue-200' : 
                                event.type === 'booked' ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-green-500 hover:from-green-100 hover:to-green-200' :
                                event.type === 'completed' ? 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-slate-400' :
                                event.type === 'cancelled' ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-red-500 hover:from-red-100 hover:to-red-200' :
                                event.type === 'no_show' ? 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-800 border-orange-500 hover:from-orange-100 hover:to-orange-200' :
                                'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border-yellow-500 hover:from-yellow-100 hover:to-yellow-200'}`}
                            style={{
                              top: `${eventTop + (isCompact ? 1 : 2)}px`, // Tighter spacing when compact
                              left: '3px',
                              right: '3px',
                              height: `${eventHeight - (isCompact ? 2 : 4)}px`, // Tighter height when compact
                              minHeight: isCompact ? '24px' : '26px', // Smaller min height when compact
                              borderLeftWidth: '3px',
                              borderLeftStyle: 'solid'
                            }}
                            onClick={(e) => {
                              // Prevent event click when clicking delete button
                              if ((e.target as HTMLElement).closest('.delete-btn')) {
                                e.stopPropagation();
                                return;
                              }
                              if (viewMode === 'mentor') {
                                onEventClick?.(event.id);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between gap-0.5">
                              <div className="truncate flex items-center gap-0.5 flex-1 min-w-0">
                                {event.isRecurring && <RotateCw size={isCompact ? 7 : 8} className="flex-shrink-0" />}
                                <span className="truncate">{event.title}</span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                {/* ✅ Delete button - only for available slots in mentor view */}
                                {viewMode === 'mentor' && event.type === 'available' && event.slotId && !isPast && onEventDelete && (
                                  <button
                                    className="delete-btn opacity-0 group-hover/event:opacity-100 transition-all p-1 hover:bg-red-100 rounded-md text-red-600 hover:text-red-700 hover:scale-110 active:scale-95 flex-shrink-0 shadow-sm hover:shadow"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm('Are you sure you want to delete this availability slot?')) {
                                        onEventDelete(event.slotId!, event.start);
                                      }
                                    }}
                                    title="Delete slot"
                                  >
                                    <Trash2 size={isCompact ? 10 : 12} strokeWidth={2} />
                                  </button>
                                )}
                                {!isCompact && <span className="text-[8px] font-bold opacity-70 flex-shrink-0">{durationBadge}</span>}
                              </div>
                            </div>
                            {!isCompact && <div className="opacity-60 font-bold mt-0.5 text-[8px]">{timeDisplay}</div>}
                          </div>
                        );
                      })}
                      {eventsInSlot.length === 0 && viewMode === 'mentor' && !isPast && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer bg-gradient-to-br from-brand-50/30 to-brand-100/20 transition-all rounded-lg">
                               <Plus className="text-brand-500 group-hover:text-brand-600 transition-colors" size={18} strokeWidth={2.5} />
                          </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
