/**
 * Notification Service V2
 *
 * Fixes:
 * - BUG #27: No notification when provider earns commission
 * - BUG #31: updateUserStatus() doesn't notify user when banned
 * - BUG #44: triggerNotification() doesn't check user preferences
 *
 * Usage:
 *   await notificationService.notifyProviderCommission(providerId, amount, menteeName);
 *   await notificationService.notifyUserStatusChange(userId, newStatus, reason);
 */

import {
    User,
    UserRole,
    Notification,
    Language
} from '../../types';
import {
    INITIAL_USERS,
    INITIAL_NOTIFICATIONS
} from '../../mockData';
import { generateUniqueId } from '../../utils/helpers';
import { translations } from '../../lib/i18n';

// --- HELPERS FOR LOCAL STORAGE SIMULATION ---
const getStore = <T>(key: string, initial: T): T => {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : initial;
};

const setStore = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// User notification preferences (stored separately)
interface NotificationPreferences {
    userId: string;
    email: boolean;
    push: boolean;
    sms: boolean;
    categories: {
        bookings: boolean;
        payments: boolean;
        system: boolean;
        promotions: boolean;
    };
}

export const notificationService = {
    /**
     * Get user's language preference for notifications
     * NOTE: Always return 'en' for notifications - all notifications are in English only
     */
    getUserLanguage: (userId: string): Language => {
        return 'en'; // Force English for all notifications
    },

    /**
     * ✅ FIX BUG #44: Check user preferences before sending notification
     */
    getUserPreferences: (userId: string): NotificationPreferences => {
        const prefs = getStore<NotificationPreferences[]>('notificationPreferences', []);
        const userPref = prefs.find(p => p.userId === userId);

        // Default preferences if not set
        return userPref || {
            userId,
            email: true,
            push: true,
            sms: false,
            categories: {
                bookings: true,
                payments: true,
                system: true,
                promotions: true
            }
        };
    },

    /**
     * Update user notification preferences
     */
    updatePreferences: async (userId: string, preferences: Partial<NotificationPreferences>): Promise<void> => {
        const prefs = getStore<NotificationPreferences[]>('notificationPreferences', []);
        const idx = prefs.findIndex(p => p.userId === userId);

        if (idx > -1) {
            prefs[idx] = { ...prefs[idx], ...preferences };
        } else {
            prefs.push({ ...notificationService.getUserPreferences(userId), ...preferences });
        }

        setStore('notificationPreferences', prefs);
    },

    /**
     * ✅ FIX BUG #44: Send notification with preference check
     */
    sendNotification: async (notif: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> => {
        const preferences = notificationService.getUserPreferences(notif.userId);

        // Determine category
        let category: keyof NotificationPreferences['categories'] = 'system';
        if (notif.actionType === 'booking') category = 'bookings';
        if (notif.actionType === 'wallet' || notif.actionType === 'payout') category = 'payments';

        // ✅ Check if user has this category enabled
        if (!preferences.categories[category]) {
            console.log(`Notification skipped for user ${notif.userId}: category ${category} disabled`);
            return null as any; // Don't send
        }

        // Create notification
        const notifications = getStore<Notification[]>('notifications', INITIAL_NOTIFICATIONS);
        const newNotif: Notification = {
            ...notif,
            id: generateUniqueId('nt'),
            createdAt: new Date().toISOString(),
            read: false
        };

        notifications.unshift(newNotif);
        setStore('notifications', notifications);

        return newNotif;
    },

    /**
     * ✅ FIX BUG #27: Notify provider when they earn commission
     */
    notifyProviderCommission: async (
        providerId: string,
        amount: number,
        menteeName: string,
        topupAmount: number
    ): Promise<void> => {
        const lang = notificationService.getUserLanguage(providerId);
        const t = translations[lang].notifications;

        await notificationService.sendNotification({
            userId: providerId,
            role: UserRole.PROVIDER,
            type: 'success',
            title: t.commissionEarned,
            message: t.commissionMessage(amount, menteeName, topupAmount),
            actionType: 'wallet'
        });
    },

    /**
     * ✅ FIX BUG #31: Notify user when status changes (especially when banned)
     */
    notifyUserStatusChange: async (
        userId: string,
        newStatus: 'ACTIVE' | 'BANNED' | 'PENDING_APPROVAL' | 'REJECTED',
        reason?: string
    ): Promise<void> => {
        const users = getStore<User[]>('users', INITIAL_USERS);
        const user = users.find(u => u.id === userId);
        if (!user) return;

        const lang = notificationService.getUserLanguage(userId);
        const t = translations[lang].notifications;

        let title = '';
        let message = '';
        let type: 'success' | 'error' | 'warning' | 'info' = 'info';

        switch (newStatus) {
            case 'ACTIVE':
                title = t.accountActivated;
                message = t.accountActivatedMessage;
                type = 'success';
                break;

            case 'BANNED':
                title = t.accountSuspended;
                message = t.accountSuspendedMessage(reason);
                type = 'error';
                break;

            case 'PENDING_APPROVAL':
                title = t.pendingApproval;
                message = t.pendingApprovalMessage;
                type = 'warning';
                break;

            case 'REJECTED':
                title = t.accountRejected;
                message = t.accountRejectedMessage(reason);
                type = 'error';
                break;
        }

        await notificationService.sendNotification({
            userId,
            role: user.role,
            type,
            title,
            message,
            actionType: 'profile'
        });
    },

    /**
     * Notify mentor of new booking
     */
    notifyNewBooking: async (
        mentorId: string,
        menteeName: string,
        startTime: string,
        bookingId: string
    ): Promise<void> => {
        const lang = notificationService.getUserLanguage(mentorId);
        const t = translations[lang].notifications;

        await notificationService.sendNotification({
            userId: mentorId,
            role: UserRole.MENTOR,
            type: 'info',
            title: t.newBooking,
            message: t.newBookingMessage(menteeName, startTime),
            actionType: 'booking',
            actionId: bookingId
        });
    },

    /**
     * Notify mentee when booking is confirmed/cancelled
     */
    notifyBookingStatusChange: async (
        menteeId: string,
        mentorName: string,
        status: string,
        bookingId: string
    ): Promise<void> => {
        const lang = notificationService.getUserLanguage(menteeId);
        const t = translations[lang].notifications;

        let title = '';
        let message = '';
        let type: 'success' | 'error' | 'warning' | 'info' = 'info';

        switch (status) {
            case 'COMPLETED':
                title = t.lessonCompleted;
                message = t.lessonCompletedMessage(mentorName);
                type = 'success';
                break;

            case 'CANCELLED':
                title = t.bookingCancelled;
                message = t.bookingCancelledMessage(mentorName);
                type = 'warning';
                break;

            case 'RESCHEDULED':
                title = t.bookingRescheduled;
                message = t.bookingRescheduledMessage(mentorName);
                type = 'info';
                break;
        }

        await notificationService.sendNotification({
            userId: menteeId,
            role: UserRole.MENTEE,
            type,
            title,
            message,
            actionType: 'booking',
            actionId: bookingId
        });
    },

    /**
     * Notify mentor when payout is processed
     */
    notifyPayoutStatusChange: async (
        mentorId: string,
        amount: number,
        status: 'APPROVED_PENDING_PAYMENT' | 'PAID' | 'REJECTED',
        payoutId: string,
        note?: string
    ): Promise<void> => {
        const lang = notificationService.getUserLanguage(mentorId);
        const t = translations[lang].notifications;

        let title = '';
        let message = '';
        let type: 'success' | 'error' | 'warning' | 'info' = 'info';

        switch (status) {
            case 'APPROVED_PENDING_PAYMENT':
                title = t.payoutApproved;
                message = t.payoutApprovedMessage(amount);
                type = 'success';
                break;

            case 'PAID':
                title = t.payoutCompleted;
                message = t.payoutCompletedMessage(amount);
                type = 'success';
                break;

            case 'REJECTED':
                title = t.payoutRejected;
                message = t.payoutRejectedMessage(note);
                type = 'error';
                break;
        }

        await notificationService.sendNotification({
            userId: mentorId,
            role: UserRole.MENTOR,
            type,
            title,
            message,
            actionType: 'payout',
            actionId: payoutId
        });
    },

    /**
     * Notify user of credit changes (top-up, refund, etc.)
     */
    notifyCreditChange: async (
        userId: string,
        role: UserRole,
        amount: number,
        type: 'topup' | 'refund' | 'earning' | 'admin_adjustment',
        note?: string
    ): Promise<void> => {
        const lang = notificationService.getUserLanguage(userId);
        const t = translations[lang].notifications;

        let title = '';
        let message = '';
        let notifType: 'success' | 'info' = 'info';

        switch (type) {
            case 'topup':
                title = t.creditsAdded;
                message = t.creditsAddedMessage(amount);
                notifType = 'success';
                break;

            case 'refund':
                title = t.refundReceived;
                message = t.refundReceivedMessage(amount, note);
                notifType = 'success';
                break;

            case 'earning':
                title = t.earningsReceived;
                message = t.earningsReceivedMessage(amount);
                notifType = 'success';
                break;

            case 'admin_adjustment':
                title = t.creditAdjustment;
                message = t.creditAdjustmentMessage(note);
                notifType = 'info';
                break;
        }

        await notificationService.sendNotification({
            userId,
            role,
            type: notifType,
            title,
            message,
            actionType: 'wallet'
        });
    },

    /**
     * Notify user of subscription expiry (7 days before)
     */
    notifySubscriptionExpiring: async (
        userId: string,
        planName: string,
        expiryDate: string,
        subscriptionId: string
    ): Promise<void> => {
        const lang = notificationService.getUserLanguage(userId);
        const t = translations[lang].notifications;

        await notificationService.sendNotification({
            userId,
            role: UserRole.MENTEE,
            type: 'warning',
            title: t.subscriptionExpiring,
            message: t.subscriptionExpiringMessage(planName, expiryDate),
            actionType: 'subscription',
            actionId: subscriptionId
        });
    },

    /**
     * Get notifications for user
     */
    getNotifications: async (userId: string, limit: number = 50): Promise<Notification[]> => {
        const notifications = getStore<Notification[]>('notifications', INITIAL_NOTIFICATIONS);
        return notifications
            .filter(n => n.userId === userId)
            .slice(0, limit);
    },

    /**
     * Mark notification as read
     */
    markAsRead: async (notificationId: string): Promise<void> => {
        const notifications = getStore<Notification[]>('notifications', INITIAL_NOTIFICATIONS);
        const idx = notifications.findIndex(n => n.id === notificationId);

        if (idx > -1) {
            notifications[idx].read = true;
            setStore('notifications', notifications);
        }
    },

    /**
     * Mark all notifications as read for user
     */
    markAllAsRead: async (userId: string): Promise<void> => {
        const notifications = getStore<Notification[]>('notifications', INITIAL_NOTIFICATIONS);
        notifications.forEach(n => {
            if (n.userId === userId) {
                n.read = true;
            }
        });
        setStore('notifications', notifications);
    },

    /**
     * Get unread count
     */
    getUnreadCount: async (userId: string): Promise<number> => {
        const notifications = getStore<Notification[]>('notifications', INITIAL_NOTIFICATIONS);
        return notifications.filter(n => n.userId === userId && !n.read).length;
    },

    /**
     * Delete notification
     */
    deleteNotification: async (notificationId: string): Promise<void> => {
        const notifications = getStore<Notification[]>('notifications', INITIAL_NOTIFICATIONS);
        const filtered = notifications.filter(n => n.id !== notificationId);
        setStore('notifications', filtered);
    }
};
