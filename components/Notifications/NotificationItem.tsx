
import React from 'react';
import { formatDate } from '../../utils/dateFormatters'; // ✅ FIX: Use centralized date formatter
import { Notification } from '../../types';
import { CheckCircle, XCircle, Info, Bell, AlertTriangle } from 'lucide-react';
import { useApp } from '../../App';
import { translations } from '../../lib/i18n';

interface NotificationItemProps {
    notification: Notification;
    onClick?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick }) => {
    const { user } = useApp();
    const lang = 'en'; // Force English for all notifications
    const t = translations[lang].notifications;

    const getIconConfig = () => {
        switch (notification.type) {
            case 'success':
                return {
                    icon: <CheckCircle size={18} />,
                    className: 'text-success-600 bg-success-50',
                    borderClass: 'border-l-success-500'
                };
            case 'error':
                return {
                    icon: <XCircle size={18} />,
                    className: 'text-danger-600 bg-danger-50',
                    borderClass: 'border-l-danger-500'
                };
            case 'warning':
                return {
                    icon: <AlertTriangle size={18} />,
                    className: 'text-warning-600 bg-warning-50',
                    borderClass: 'border-l-warning-500'
                };
            default:
                return {
                    icon: <Info size={18} />,
                    className: 'text-blue-600 bg-blue-50',
                    borderClass: 'border-l-blue-500'
                };
        }
    };

    const config = getIconConfig();

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return t.justNow;
        if (diffMins < 60) return t.minutesAgo(diffMins);
        if (diffHours < 24) return t.hoursAgo(diffHours);
        if (diffDays < 7) return t.daysAgo(diffDays);
        return date.toLocaleDateString('en-US'); // Always use English date format
    };

    return (
        <div
            onClick={onClick}
            className={`
                px-4 py-3 border-b border-slate-100 border-l-4 ${config.borderClass}
                flex gap-3 cursor-pointer transition-all duration-200 active:bg-slate-50
                ${notification.read
                    ? 'hover:bg-slate-50'
                    : 'bg-blue-50/30 hover:bg-blue-50/50'
                }
            `}
        >
            {/* Icon */}
            <div className={`
                mt-0.5 flex-shrink-0
                w-8 h-8 rounded-lg
                flex items-center justify-center flex-none
                ${config.className}
            `}>
                {config.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex justify-between items-start gap-2 mb-1">
                    <h4 className={`
                        text-sm leading-snug break-words
                        ${notification.read
                            ? 'font-medium text-slate-700'
                            : 'font-semibold text-slate-900'
                        }
                    `}>
                        {notification.title}
                    </h4>
                    {!notification.read && (
                        <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-brand-600 rounded-full animate-pulse flex-none mt-1.5"></div>
                        </div>
                    )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-1.5 break-words" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}>
                    {notification.message}
                </p>

                <span className="text-[10px] text-slate-400 font-medium block">
                    {formatDate(notification.createdAt)}
                </span>
            </div>
        </div>
    );
};
