
import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, RotateCw, Globe } from 'lucide-react';
import { convertTimezone, formatInTimezone, createAbsoluteDate } from '../lib/timeUtils';

interface CalendarProps {
  events: { 
    id: string; 
    title: string; 
    start: Date; 
    end: Date; 
    type: 'available' | 'booked' | 'completed' | 'no_show' | 'rescheduled'; 
    isRecurring?: boolean;
  }[];
  onSlotClick?: (date: Date) => void;
  onEventClick?: (id: string) => void;
  viewMode: 'mentor' | 'mentee';
  timezone: string;
}

export const WeeklyCalendar: React.FC<CalendarProps> = ({ events, onSlotClick, onEventClick, viewMode, timezone }) => {
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
  const hours = Array.from({ length: 16 }, (_, i) => i + 7); 

  const isToday = (dayDate: Date) => {
      return dayDate.getDate() === nowInTz.getDate() && 
             dayDate.getMonth() === nowInTz.getMonth() && 
             dayDate.getFullYear() === nowInTz.getFullYear();
  };

  const getNowLinePosition = () => {
      const currentHour = nowInTz.getHours();
      const currentMinutes = nowInTz.getMinutes();
      if (currentHour < 7 || currentHour >= 23) return null;
      return ((currentHour - 7) * 60) + currentMinutes;
  };

  const nowLinePos = getNowLinePosition();

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
              <div key={hour} className="grid grid-cols-8 border-b border-slate-50 min-h-[60px]">
                <div className="p-2 text-right text-[10px] font-black text-slate-400 border-r border-slate-100 bg-slate-50/20 sticky left-0 z-10 backdrop-blur-sm">{hour}:00</div>
                {days.map((day, dayIdx) => {
                  const event = events.find(e => {
                      // Chuyển thời gian bắt đầu của event (UTC) sang múi giờ đang hiển thị
                      const eStartInTz = convertTimezone(e.start, timezone);

                      const matches = eStartInTz.getDate() === day.getDate() &&
                             eStartInTz.getMonth() === day.getMonth() &&
                             eStartInTz.getFullYear() === day.getFullYear() &&
                             eStartInTz.getHours() === hour;

                      // DEBUG: Log matching attempts for hour 14
                      if (hour === 14 && dayIdx === 0 && events.length > 0) {
                        console.log(`🔍 [Match Check] Hour ${hour}, Day ${day.toDateString()}`);
                        console.log(`  Event start (UTC): ${e.start.toISOString()}`);
                        console.log(`  Event start (TZ):  ${eStartInTz.toString()}`);
                        console.log(`  Match result: ${matches}`);
                      }

                      return matches;
                  });

                  // Xác định xem slot này đã qua chưa
                  const slotDate = new Date(day);
                  slotDate.setHours(hour, 0, 0, 0);
                  const isPast = slotDate < nowInTz;
                  
                  return (
                    <div key={day.toISOString()} className={`relative border-r border-slate-50 transition-colors group ${isPast ? 'bg-slate-50/30' : ''}`}
                      onClick={() => {
                          if (event) {
                              if (viewMode === 'mentee') {
                                  if (event.type === 'available' && !isPast) onSlotClick?.(event.start);
                              } else if (viewMode === 'mentor') {
                                  onEventClick?.(event.id);
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
                      {event && (
                          <div className={`absolute inset-1 rounded-xl p-2 text-[10px] font-black shadow-sm transition-all 
                            ${isPast ? 'opacity-40 grayscale' : 'cursor-pointer hover:scale-[1.02] active:scale-95 shadow-md'} 
                            ${event.type === 'available' ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600' : 
                              event.type === 'booked' ? 'bg-green-100 text-green-700 border-l-4 border-green-600' :
                              event.type === 'completed' ? 'bg-slate-200 text-slate-600 border-l-4 border-slate-400' :
                              'bg-orange-100 text-orange-700 border-l-4 border-orange-600'}`}>
                               <div className="truncate flex items-center gap-1">
                                  {event.isRecurring && <RotateCw size={8} />}
                                  {event.title}
                               </div>
                               <div className="opacity-60 font-bold mt-0.5">{hour}:00</div>
                          </div>
                      )}
                      {!event && viewMode === 'mentor' && !isPast && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer bg-brand-50/20">
                               <Plus className="text-brand-300" size={16} />
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
