
import React from 'react';
import { Notification } from '../../types';
import { CheckCircle, XCircle, Info, Bell, AlertTriangle } from 'lucide-react';

interface NotificationItemProps {
    notification: Notification;
    onClick?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick }) => {
    const getIcon = () => {
        switch (notification.type) {
            case 'success': return <CheckCircle size={16} className="text-green-600" />;
            case 'error': return <XCircle size={16} className="text-red-600" />;
            case 'warning': return <AlertTriangle size={16} className="text-orange-500" />;
            default: return <Info size={16} className="text-blue-600" />;
        }
    };

    const getBg = () => {
        if (!notification.read) return 'bg-blue-50/50';
        return 'hover:bg-slate-50';
    };

    return (
        <div 
            onClick={onClick}
            className={`p-4 border-b border-slate-100 flex gap-3 cursor-pointer transition-colors ${getBg()}`}
        >
            <div className="mt-1 flex-shrink-0">
                {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-sm ${notification.read ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                        {notification.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                        {new Date(notification.createdAt).toLocaleDateString()}
                    </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{notification.message}</p>
            </div>
            {!notification.read && (
                <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
            )}
        </div>
    );
};
