/**
 * User Management Service V2
 *
 * Fixes:
 * - BUG #17: deleteUser() doesn't delete related data (orphan records)
 * - BUG #46: No soft delete (hard delete everywhere)
 *
 * Usage:
 *   await userManagementService.deleteUser(currentUser, userId); // Soft delete
 *   await userManagementService.permanentlyDeleteUser(currentUser, userId); // Hard delete
 */

import {
    User,
    UserRole,
    Mentor,
    Provider,
    Booking,
    Subscription,
    Transaction,
    Payout,
    MentorEarning,
    Referral,
    ProviderCommission
} from '../../types';
import {
    INITIAL_USERS,
    INITIAL_MENTORS,
    INITIAL_PROVIDERS,
    INITIAL_BOOKINGS,
    INITIAL_SUBSCRIPTIONS,
    INITIAL_TRANSACTIONS,
    INITIAL_PAYOUTS,
    INITIAL_MENTOR_EARNINGS,
    INITIAL_REFERRALS,
    INITIAL_COMMISSIONS
} from '../../mockData';
import { authGuard } from './authGuard';
import { lockManager } from '../../utils/lockManager';
import { notificationService } from './notificationService';

// --- HELPERS FOR LOCAL STORAGE SIMULATION ---
const getStore = <T>(key: string, initial: T): T => {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : initial;
};

const setStore = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const userManagementService = {
    /**
     * ✅ FIX BUG #46: Soft delete user (mark as deleted, keep data)
     */
    deleteUser: async (currentUser: User | null, userId: string): Promise<void> => {
        authGuard.requireAdmin(currentUser);
        authGuard.preventSelfDeletion(currentUser, userId);

        return lockManager.acquireLock(`user:${userId}`, async () => {
            const users = getStore<User[]>('users', INITIAL_USERS);
            const userIdx = users.findIndex(u => u.id === userId);

            if (userIdx === -1) throw new Error('User not found');

            const user = users[userIdx];

            // ✅ Soft delete: Mark user as deleted (add deletedAt field)
            (user as any).deletedAt = new Date().toISOString();
            user.status = 'BANNED'; // Effectively disable account
            user.email = `deleted_${user.id}@deleted.com`; // Prevent email conflicts

            setStore('users', users);

            // Also update in mentors/providers tables
            if (user.role === UserRole.MENTOR) {
                const mentors = getStore<Mentor[]>('mentors', INITIAL_MENTORS);
                const mentorIdx = mentors.findIndex(m => m.id === userId);
                if (mentorIdx > -1) {
                    (mentors[mentorIdx] as any).deletedAt = new Date().toISOString();
                    mentors[mentorIdx].status = 'BANNED';
                    setStore('mentors', mentors);
                }
            }

            if (user.role === UserRole.PROVIDER) {
                const providers = getStore<Provider[]>('providers', INITIAL_PROVIDERS);
                const providerIdx = providers.findIndex(p => p.id === userId);
                if (providerIdx > -1) {
                    (providers[providerIdx] as any).deletedAt = new Date().toISOString();
                    providers[providerIdx].status = 'BANNED';
                    setStore('providers', providers);
                }
            }

            // Notify user
            await notificationService.notifyUserStatusChange(userId, 'BANNED', 'Account deleted by admin');
        });
    },

    /**
     * ✅ FIX BUG #17: Permanently delete user AND all related data
     */
    permanentlyDeleteUser: async (currentUser: User | null, userId: string): Promise<{
        deletedRecords: {
            users: number;
            mentors: number;
            providers: number;
            bookings: number;
            subscriptions: number;
            transactions: number;
            payouts: number;
            earnings: number;
            referrals: number;
            commissions: number;
        };
    }> => {
        authGuard.requireAdmin(currentUser);
        authGuard.preventSelfDeletion(currentUser, userId);

        return lockManager.acquireLock(`user:${userId}`, async () => {
            const deletedRecords = {
                users: 0,
                mentors: 0,
                providers: 0,
                bookings: 0,
                subscriptions: 0,
                transactions: 0,
                payouts: 0,
                earnings: 0,
                referrals: 0,
                commissions: 0
            };

            // 1. Delete from users table
            const users = getStore<User[]>('users', INITIAL_USERS);
            const usersBefore = users.length;
            const filteredUsers = users.filter(u => u.id !== userId);
            deletedRecords.users = usersBefore - filteredUsers.length;
            setStore('users', filteredUsers);

            // 2. Delete from mentors table (if mentor)
            const mentors = getStore<Mentor[]>('mentors', INITIAL_MENTORS);
            const mentorsBefore = mentors.length;
            const filteredMentors = mentors.filter(m => m.id !== userId);
            deletedRecords.mentors = mentorsBefore - filteredMentors.length;
            setStore('mentors', filteredMentors);

            // 3. Delete from providers table (if provider)
            const providers = getStore<Provider[]>('providers', INITIAL_PROVIDERS);
            const providersBefore = providers.length;
            const filteredProviders = providers.filter(p => p.id !== userId);
            deletedRecords.providers = providersBefore - filteredProviders.length;
            setStore('providers', filteredProviders);

            // 4. ✅ Delete related bookings (as mentee OR mentor)
            const bookings = getStore<Booking[]>('bookings', INITIAL_BOOKINGS);
            const bookingsBefore = bookings.length;
            const filteredBookings = bookings.filter(b => b.menteeId !== userId && b.mentorId !== userId);
            deletedRecords.bookings = bookingsBefore - filteredBookings.length;
            setStore('bookings', filteredBookings);

            // 5. ✅ Delete subscriptions
            const subscriptions = getStore<Subscription[]>('subscriptions', INITIAL_SUBSCRIPTIONS);
            const subscriptionsBefore = subscriptions.length;
            const filteredSubscriptions = subscriptions.filter(s => s.menteeId !== userId && s.mentorId !== userId);
            deletedRecords.subscriptions = subscriptionsBefore - filteredSubscriptions.length;
            setStore('subscriptions', filteredSubscriptions);

            // 6. ✅ Delete transactions
            const transactions = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
            const transactionsBefore = transactions.length;
            const filteredTransactions = transactions.filter(t => t.userId !== userId);
            deletedRecords.transactions = transactionsBefore - filteredTransactions.length;
            setStore('transactions', filteredTransactions);

            // 7. ✅ Delete payouts (if mentor)
            const payouts = getStore<Payout[]>('payouts', INITIAL_PAYOUTS);
            const payoutsBefore = payouts.length;
            const filteredPayouts = payouts.filter(p => p.mentorId !== userId);
            deletedRecords.payouts = payoutsBefore - filteredPayouts.length;
            setStore('payouts', filteredPayouts);

            // 8. ✅ Delete mentor earnings
            const earnings = getStore<MentorEarning[]>('mentorEarnings', INITIAL_MENTOR_EARNINGS);
            const earningsBefore = earnings.length;
            const filteredEarnings = earnings.filter(e => e.mentorId !== userId);
            deletedRecords.earnings = earningsBefore - filteredEarnings.length;
            setStore('mentorEarnings', filteredEarnings);

            // 9. ✅ Delete referrals (if provider or mentee)
            const referrals = getStore<Referral[]>('referrals', INITIAL_REFERRALS);
            const referralsBefore = referrals.length;
            const filteredReferrals = referrals.filter(r => r.providerId !== userId && r.menteeId !== userId);
            deletedRecords.referrals = referralsBefore - filteredReferrals.length;
            setStore('referrals', filteredReferrals);

            // 10. ✅ Delete provider commissions
            const commissions = getStore<ProviderCommission[]>('providerCommissions', INITIAL_COMMISSIONS);
            const commissionsBefore = commissions.length;
            const filteredCommissions = commissions.filter(c => c.providerId !== userId && c.menteeId !== userId);
            deletedRecords.commissions = commissionsBefore - filteredCommissions.length;
            setStore('providerCommissions', filteredCommissions);

            return { deletedRecords };
        });
    },

    /**
     * Restore soft-deleted user
     */
    restoreUser: async (currentUser: User | null, userId: string): Promise<void> => {
        authGuard.requireAdmin(currentUser);

        const users = getStore<User[]>('users', INITIAL_USERS);
        const userIdx = users.findIndex(u => u.id === userId);

        if (userIdx === -1) throw new Error('User not found');

        const user = users[userIdx];

        // Check if user was soft-deleted
        if (!(user as any).deletedAt) {
            throw new Error('User is not deleted');
        }

        // Restore user
        delete (user as any).deletedAt;
        user.status = 'ACTIVE';

        // Restore original email (if pattern matches)
        if (user.email.startsWith('deleted_')) {
            // Cannot automatically restore email - admin must manually update
            console.warn('Email was anonymized. Admin must manually restore original email.');
        }

        setStore('users', users);

        // Also restore in mentors/providers
        if (user.role === UserRole.MENTOR) {
            const mentors = getStore<Mentor[]>('mentors', INITIAL_MENTORS);
            const mentorIdx = mentors.findIndex(m => m.id === userId);
            if (mentorIdx > -1) {
                delete (mentors[mentorIdx] as any).deletedAt;
                mentors[mentorIdx].status = 'ACTIVE';
                setStore('mentors', mentors);
            }
        }

        if (user.role === UserRole.PROVIDER) {
            const providers = getStore<Provider[]>('providers', INITIAL_PROVIDERS);
            const providerIdx = providers.findIndex(p => p.id === userId);
            if (providerIdx > -1) {
                delete (providers[providerIdx] as any).deletedAt;
                providers[providerIdx].status = 'ACTIVE';
                setStore('providers', providers);
            }
        }

        await notificationService.notifyUserStatusChange(userId, 'ACTIVE', 'Account restored by admin');
    },

    /**
     * Get all deleted users (soft-deleted)
     */
    getDeletedUsers: async (currentUser: User | null): Promise<User[]> => {
        authGuard.requireAdmin(currentUser);

        const users = getStore<User[]>('users', INITIAL_USERS);
        return users.filter(u => (u as any).deletedAt);
    },

    /**
     * Ban user (with reason)
     */
    banUser: async (currentUser: User | null, userId: string, reason: string): Promise<void> => {
        authGuard.requireAdmin(currentUser);
        authGuard.preventSelfDeletion(currentUser, userId);

        const users = getStore<User[]>('users', INITIAL_USERS);
        const userIdx = users.findIndex(u => u.id === userId);

        if (userIdx === -1) throw new Error('User not found');

        users[userIdx].status = 'BANNED';
        setStore('users', users);

        // Sync to mentors/providers
        if (users[userIdx].role === UserRole.MENTOR) {
            const mentors = getStore<Mentor[]>('mentors', INITIAL_MENTORS);
            const mentorIdx = mentors.findIndex(m => m.id === userId);
            if (mentorIdx > -1) {
                mentors[mentorIdx].status = 'BANNED';
                setStore('mentors', mentors);
            }
        }

        if (users[userIdx].role === UserRole.PROVIDER) {
            const providers = getStore<Provider[]>('providers', INITIAL_PROVIDERS);
            const providerIdx = providers.findIndex(p => p.id === userId);
            if (providerIdx > -1) {
                providers[providerIdx].status = 'BANNED';
                setStore('providers', providers);
            }
        }

        // ✅ FIX BUG #31: Notify user
        await notificationService.notifyUserStatusChange(userId, 'BANNED', reason);
    },

    /**
     * Unban user
     */
    unbanUser: async (currentUser: User | null, userId: string): Promise<void> => {
        authGuard.requireAdmin(currentUser);

        const users = getStore<User[]>('users', INITIAL_USERS);
        const userIdx = users.findIndex(u => u.id === userId);

        if (userIdx === -1) throw new Error('User not found');

        users[userIdx].status = 'ACTIVE';
        setStore('users', users);

        // Sync to mentors/providers
        if (users[userIdx].role === UserRole.MENTOR) {
            const mentors = getStore<Mentor[]>('mentors', INITIAL_MENTORS);
            const mentorIdx = mentors.findIndex(m => m.id === userId);
            if (mentorIdx > -1) {
                mentors[mentorIdx].status = 'ACTIVE';
                setStore('mentors', mentors);
            }
        }

        if (users[userIdx].role === UserRole.PROVIDER) {
            const providers = getStore<Provider[]>('providers', INITIAL_PROVIDERS);
            const providerIdx = providers.findIndex(p => p.id === userId);
            if (providerIdx > -1) {
                providers[providerIdx].status = 'ACTIVE';
                setStore('providers', providers);
            }
        }

        await notificationService.notifyUserStatusChange(userId, 'ACTIVE');
    },

    /**
     * Get user activity summary (for admin review)
     */
    getUserActivitySummary: async (currentUser: User | null, userId: string): Promise<{
        user: User;
        bookingsAsMentee: number;
        bookingsAsMentor: number;
        totalSpent: number;
        totalEarned: number;
        activeSubscriptions: number;
        payoutsRequested: number;
        lastActivityAt: string;
    }> => {
        authGuard.requireAdmin(currentUser);

        const users = getStore<User[]>('users', INITIAL_USERS);
        const user = users.find(u => u.id === userId);
        if (!user) throw new Error('User not found');

        const bookings = getStore<Booking[]>('bookings', INITIAL_BOOKINGS);
        const subscriptions = getStore<Subscription[]>('subscriptions', INITIAL_SUBSCRIPTIONS);
        const transactions = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
        const payouts = getStore<Payout[]>('payouts', INITIAL_PAYOUTS);

        const bookingsAsMentee = bookings.filter(b => b.menteeId === userId).length;
        const bookingsAsMentor = bookings.filter(b => b.mentorId === userId).length;

        const totalSpent = transactions
            .filter(t => t.userId === userId && t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const totalEarned = transactions
            .filter(t => t.userId === userId && t.amount > 0 && t.type !== 'TOPUP')
            .reduce((sum, t) => sum + t.amount, 0);

        const activeSubscriptions = subscriptions.filter(s => s.menteeId === userId && s.status === 'ACTIVE').length;
        const payoutsRequested = payouts.filter(p => p.mentorId === userId).length;

        // Find last activity
        const allDates = [
            user.joinedAt,
            ...transactions.filter(t => t.userId === userId).map(t => t.date),
            ...bookings.filter(b => b.menteeId === userId || b.mentorId === userId).map(b => b.startTime)
        ];
        const lastActivityAt = allDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

        return {
            user,
            bookingsAsMentee,
            bookingsAsMentor,
            totalSpent,
            totalEarned,
            activeSubscriptions,
            payoutsRequested,
            lastActivityAt
        };
    }
};
