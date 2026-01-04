
import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { api } from '../../services/api';
import { useApp } from '../../App';
import { Notification, UserRole } from '../../types';
import { NotificationItem } from './NotificationItem';
import { useNavigate } from 'react-router-dom';

export const NotificationBell: React.FC = () => {
    const { user } = useApp();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchCounts = async () => {
        if (!user) return;
        const count = await api.getUnreadNotificationCount(user.id);
        setUnreadCount(count);
    };

    const fetchNotifications = async () => {
        if (!user) return;
        setLoading(true);
        const data = await api.getNotifications(user.id);
        // Sort by date desc
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(data);
        setLoading(false);
    };

    useEffect(() => {
        if (user) {
            fetchCounts();
            const interval = setInterval(fetchCounts, 30000); // Reduced from 10s to 30s to prevent 429 errors
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleItemClick = async (n: Notification) => {
        if (!n.read) {
            await api.markNotificationRead(n.id);
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
        }
        setIsOpen(false);

        // Navigation Logic
        if (n.actionType === 'booking') {
            if (user?.role === UserRole.MENTEE) {
                navigate(`/mentee/bookings/${n.actionId}`);
            } else if (user?.role === UserRole.MENTOR) {
                // Ideally detail page, but calendar/schedule works for now
                navigate('/mentor/schedule'); 
            } else if (user?.role === UserRole.ADMIN) {
                navigate('/admin/bookings');
            }
        } else if (n.actionType === 'payment' || n.actionType === 'payout' || n.actionType === 'commissions') {
            if (user?.role === UserRole.MENTOR) navigate('/mentor/payout');
            if (user?.role === UserRole.PROVIDER) navigate('/provider/payouts');
            if (user?.role === UserRole.ADMIN) navigate('/admin/payouts');
        } else if (n.actionType === 'homework') {
            if (user?.role === UserRole.MENTEE) navigate('/mentee/homework');
            if (user?.role === UserRole.MENTOR) navigate('/mentor/homework');
        } else if (n.actionType === 'subscription') {
            if (user?.role === UserRole.MENTEE) navigate('/mentee/subscriptions/active');
        } else if (n.actionType === 'wallet') {
            if (user?.role === UserRole.MENTEE) navigate('/mentee/wallet');
        }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200 group"
                aria-label="Notifications"
            >
                <Bell size={22} className="transition-transform group-hover:scale-110" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-danger-500 text-white text-[10px] font-bold rounded-full border-2 border-white shadow-sm animate-bounce-subtle">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel - Responsive & Mobile Friendly */}
            {isOpen && (
                <>
                    {/* Mobile Overlay */}
                    <div
                        className="fixed inset-0 bg-black/20 z-[100] md:hidden"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown Container */}
                    <div className="fixed bottom-0 left-0 right-0 md:absolute md:top-full md:right-0 md:mt-2
                        w-full md:w-96 min-h-[400px] max-h-[80vh] md:max-h-[600px]
                        bg-white rounded-t-3xl md:rounded-2xl shadow-2xl border border-slate-200
                        overflow-hidden z-[200] animate-scale-in origin-bottom md:origin-top-right
                        flex flex-col">
                        
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Bell size={18} className="text-slate-700" />
                                    <h3 className="font-semibold text-slate-900 text-base">Notifications</h3>
                                </div>
                                {unreadCount > 0 && (
                                    <span className="text-xs bg-brand-100 text-brand-700 px-3 py-1 rounded-full font-semibold">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Notification List - Scrollable */}
                        <div className="flex-1 overflow-y-auto min-h-0">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin mb-3"></div>
                                <p className="text-sm text-slate-500">Loading notifications...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                                    <Bell className="text-slate-400" size={28} />
                                </div>
                                <h4 className="font-semibold text-slate-700 mb-1">No notifications</h4>
                                <p className="text-sm text-slate-500">You're all caught up!</p>
                            </div>
                        ) : (
                            <>
                                {notifications.map(n => (
                                    <NotificationItem
                                        key={n.id}
                                        notification={n}
                                        onClick={() => handleItemClick(n)}
                                    />
                                ))}
                            </>
                        )}
                    </div>

                    {/* Footer - Sticky */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 text-center flex-shrink-0">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
                            >
                                View all notifications
                            </button>
                        </div>
                    )}
                    </div>
                </>
            )}
        </div>
    );
};
