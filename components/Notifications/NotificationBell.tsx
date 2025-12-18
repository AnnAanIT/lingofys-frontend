
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
        const count = await api.getUnreadNotificationCount(user.id, user.role);
        setUnreadCount(count);
    };

    const fetchNotifications = async () => {
        if (!user) return;
        setLoading(true);
        const data = await api.getNotifications(user.id, user.role);
        // Sort by date desc
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(data);
        setLoading(false);
    };

    useEffect(() => {
        if (user) {
            fetchCounts();
            const interval = setInterval(fetchCounts, 10000); // Poll every 10s
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
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-fade-in origin-top-right">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                                {unreadCount} New
                            </span>
                        )}
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="p-8 text-center text-slate-400 text-xs">Loading updates...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-xs">
                                <Bell className="mx-auto mb-2 opacity-50" size={24} />
                                No notifications yet.
                            </div>
                        ) : (
                            notifications.map(n => (
                                <NotificationItem 
                                    key={n.id} 
                                    notification={n} 
                                    onClick={() => handleItemClick(n)}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
