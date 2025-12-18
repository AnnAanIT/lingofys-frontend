
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { api } from '../services/api';
import { Booking, UserRole, BookingStatus, AvailabilitySlot, MentorEarning, Conversation } from '../types';
import { WeeklyCalendar } from '../components/Calendar';
import { LessonModal } from '../components/MentorComponents';
import { AddAvailabilityModal } from '../components/AddAvailabilityModal';
import { EditAvailabilityModal } from '../components/EditAvailabilityModal';
import { createAbsoluteDate, getTimezoneByCountry } from '../lib/timeUtils';
import { DollarSign, Clock, CheckCircle, TrendingUp, Wallet, RefreshCw, Calendar as CalendarIcon, MessageSquare } from 'lucide-react';
import { ChatWindow } from '../components/Messages/ChatWindow';

interface Props {
  tab: 'home' | 'calendar' | 'chat' | 'homework' | 'earnings';
}

export default function MentorDashboard({ tab }: Props) {
  const { user } = useApp();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [balance, setBalance] = useState({ payable: 0, paid: 0, pending: 0 });
  const [loading, setLoading] = useState(false);

  // Modals for Bookings
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // Modals for Availability
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [initialSlotDate, setInitialSlotDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

  const fetchData = async () => {
    if(!user) return;
    setLoading(true);
    try {
        const [b, a, bal] = await Promise.all([
            api.getBookings(user.id, UserRole.MENTOR),
            api.getAvailability(user.id),
            api.getMentorBalanceDetails(user.id)
        ]);
        setBookings(b);
        setAvailability(a);
        setBalance(bal);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, tab]);

  const handleSaveNewSlot = async (slotData: Omit<AvailabilitySlot, 'id' | 'mentorId'>) => {
      if (!user) return;
      try {
          await api.addAvailability(user.id, slotData);
          await fetchData();
          setIsAddSlotOpen(false);
          alert("Lịch rảnh đã được đăng ký thành công!");
      } catch (err: any) {
          alert("Lỗi khi lưu lịch: " + (err.message || err));
      }
  };

  const handleUpdateSlot = async (id: string, updates: Partial<AvailabilitySlot>) => {
      if (!user) return;
      try {
          await api.updateAvailability(user.id, id, updates);
          await fetchData();
          setSelectedSlot(null);
          alert("Lịch rảnh đã được cập nhật.");
      } catch (err: any) {
          alert("Lỗi khi cập nhật: " + (err.message || err));
      }
  };

  const handleDeleteSlot = async (id: string) => {
      if (!user) return;
      try {
          await api.deleteAvailability(user.id, id);
          await fetchData();
          setSelectedSlot(null);
          alert("Đã xóa lịch rảnh này.");
      } catch (err: any) {
          alert("Lỗi khi xóa: " + (err.message || err));
      }
  };

  const renderEarnings = () => (
      <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
          <h1 className="text-3xl font-black text-slate-900 uppercase">Quản lý thu nhập</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><DollarSign size={80} /></div>
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Đang chờ (Pending)</div>
                  <div className="text-4xl font-black text-slate-900">{balance.pending} Cr</div>
                  <div className="text-xs text-slate-400 mt-4">Từ các lớp học sắp tới</div>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Wallet size={80} /></div>
                  <div className="text-[10px] font-black text-brand-600 uppercase mb-2">Khả dụng (Payable)</div>
                  <div className="text-4xl font-black text-brand-600">{balance.payable} Cr</div>
                  <div className="text-xs text-slate-400 mt-4">Có thể yêu cầu rút tiền</div>
              </div>
              <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><CheckCircle size={80} /></div>
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Đã thanh toán</div>
                  <div className="text-4xl font-black">${balance.paid}</div>
                  <div className="text-xs text-slate-500 mt-4">Tổng thu nhập trọn đời</div>
              </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 font-black text-slate-800 uppercase text-sm">Lịch sử thu nhập gần đây</div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase">
                          <tr>
                              <th className="px-6 py-4">Ngày</th>
                              <th className="px-6 py-4">Học viên</th>
                              <th className="px-6 py-4">Số tiền</th>
                              <th className="px-6 py-4">Trạng thái</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {bookings.filter(b => b.status === BookingStatus.COMPLETED).map(b => (
                              <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(b.startTime).toLocaleDateString()}</td>
                                  <td className="px-6 py-4 font-bold text-slate-900">{b.menteeName}</td>
                                  <td className="px-6 py-4 font-mono font-black">+{b.totalCost} Cr</td>
                                  <td className="px-6 py-4">
                                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-[10px] font-black uppercase">Đã cộng tiền</span>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
  );

  const renderChat = () => {
    const supportConversation: Conversation = {
        id: `conv_${user?.id}`,
        participantId: user?.id || '',
        participantName: "Admin Support",
        participantAvatar: "",
        participantRole: UserRole.ADMIN,
        assignedAdminId: null,
        status: 'OPEN',
        lastMessageAt: new Date().toISOString(),
        lastMessagePreview: 'How can we help you?',
        unreadCount: 0
    };

    return (
        <div className="max-w-5xl mx-auto h-[calc(100vh-160px)] animate-fade-in">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-3">
                <MessageSquare size={32} className="text-purple-600" /> Admin Support
            </h1>
            <ChatWindow 
                currentUserId={user?.id || ''}
                currentUserRole={user?.role || UserRole.MENTOR}
                conversation={supportConversation}
            />
        </div>
    );
  };

  const mentorTz = user?.timezone || 'UTC';

  // Chuyển đổi dữ liệu Booking và Availability thành định dạng cho Calendar
  const bookingEvents = bookings.map(b => ({
      id: `booking-${b.id}`,
      title: b.menteeName,
      start: new Date(b.startTime), 
      end: new Date(b.endTime),
      type: b.status === BookingStatus.SCHEDULED ? 'booked' : 'completed' as any
  }));

  // Tạo "Available" events từ các slot cố định (availability)
  const generateAvailabilityEvents = () => {
      const events: any[] = [];
      const today = new Date();
      
      for(let i=0; i<30; i++) { 
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: mentorTz });
          
          const slots = availability.filter(slot => slot.day === dayName);
          
          slots.forEach(slot => {
              const start = createAbsoluteDate(d, slot.startTime, mentorTz);
              const end = new Date(start.getTime() + slot.duration * 60000);
              
              const isBooked = bookings.some(b => {
                  if (!['SCHEDULED', 'COMPLETED'].includes(b.status)) return false;
                  const bTime = new Date(b.startTime).getTime();
                  return Math.abs(bTime - start.getTime()) < 1000;
              });

              if (!isBooked) {
                  events.push({
                      id: `avail-${slot.id}-${start.getTime()}`,
                      title: 'Available',
                      start,
                      end,
                      type: 'available',
                      isRecurring: slot.recurring,
                      slotId: slot.id 
                  });
              }
          });
      }
      return events;
  };

  const allEvents = [...bookingEvents, ...generateAvailabilityEvents()];

  const handleEventClick = (eventId: string) => {
      if (eventId.startsWith('booking-')) {
          setSelectedBookingId(eventId.replace('booking-', ''));
      } else if (eventId.startsWith('avail-')) {
          const parts = eventId.split('-');
          const slotId = parts[1];
          const found = availability.find(s => s.id === slotId);
          if (found) setSelectedSlot(found);
      }
  };

  const handleSlotClick = (date: Date) => {
      setInitialSlotDate(date);
      setIsAddSlotOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
        {tab === 'home' && (
            <div className="space-y-8 animate-fade-in">
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Chào Mentor, {user?.name}!</h2>
                        <p className="text-slate-500 mt-2 text-lg">Bạn có {bookings.filter(b => b.status === BookingStatus.SCHEDULED).length} buổi học sắp tới.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-brand-50 p-6 rounded-3xl text-center border border-brand-100 min-w-[150px]">
                             <div className="text-3xl font-black text-brand-700">{user?.credits}</div>
                             <div className="text-[10px] font-black text-brand-600 uppercase mt-1">Credits khả dụng</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <button 
                        onClick={() => navigate('/mentor/schedule')} 
                        className="bg-slate-900 p-8 rounded-3xl text-white hover:bg-slate-800 transition-all flex items-center justify-between group"
                    >
                        <div className="text-left">
                            <CalendarIcon size={32} className="mb-4 text-brand-400" />
                            <h3 className="text-xl font-black uppercase">Thiết lập lịch rảnh</h3>
                            <p className="text-slate-400 text-sm mt-1">Mở thêm giờ học để học viên có thể đặt.</p>
                        </div>
                        <TrendingUp className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 flex flex-col justify-center">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Mẹo dành cho Mentor</h3>
                        <p className="text-slate-700 italic font-medium">"Hãy mở lịch ít nhất 2 tuần trước để học viên dễ dàng sắp xếp thời gian biểu."</p>
                    </div>
                </div>
            </div>
        )}

        {tab === 'calendar' && (
            <div className="h-[calc(100vh-160px)] animate-fade-in bg-white p-4 rounded-3xl border border-slate-200 flex flex-col relative">
                <div className="absolute top-8 right-10 z-30">
                    <button 
                        onClick={fetchData} 
                        className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 transition-all"
                        title="Làm mới lịch"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
                <div className="flex-1 min-h-0">
                    <WeeklyCalendar 
                        events={allEvents}
                        viewMode="mentor"
                        timezone={mentorTz}
                        onEventClick={handleEventClick}
                        onSlotClick={handleSlotClick}
                    />
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-3xl flex items-center justify-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-100 border-l-2 border-blue-600"></div> Lịch trống</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-100 border-l-2 border-blue-600"></div> Lớp đã đặt</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-200 border-l-2 border-slate-400"></div> Đã xong</div>
                </div>
            </div>
        )}

        {tab === 'chat' && renderChat()}

        {tab === 'homework' && (
            <div className="max-w-5xl mx-auto space-y-6">
                <h1 className="text-3xl font-black text-slate-900 uppercase">Bài tập đã giao</h1>
                <p className="text-slate-500">Quản lý và chấm điểm các bài tập của học viên tại đây.</p>
            </div>
        )}

        {tab === 'earnings' && renderEarnings()}

        {/* --- MODALS --- */}
        
        {/* Modal quản lý lớp học (đã đặt) */}
        {selectedBookingId && (
            <LessonModal 
                isOpen={!!selectedBookingId}
                onClose={() => setSelectedBookingId(null)}
                booking={bookings.find(b => b.id === selectedBookingId)!}
                onAction={async (action) => {
                    if(!selectedBookingId) return;
                    if (action === 'COMPLETE') await api.updateBookingStatus(selectedBookingId, BookingStatus.COMPLETED);
                    await fetchData();
                    setSelectedBookingId(null);
                }}
            />
        )}

        {/* Modal thêm lịch rảnh */}
        <AddAvailabilityModal 
            isOpen={isAddSlotOpen}
            onClose={() => { setIsAddSlotOpen(false); setInitialSlotDate(null); }}
            onSave={handleSaveNewSlot}
            initialDate={initialSlotDate}
            timezone={mentorTz}
        />

        {/* Modal sửa/xóa lịch rảnh */}
        {selectedSlot && (
            <EditAvailabilityModal 
                isOpen={!!selectedSlot}
                onClose={() => setSelectedSlot(null)}
                slot={selectedSlot}
                onUpdate={handleUpdateSlot}
                onDelete={handleDeleteSlot}
            />
        )}
    </div>
  );
}
