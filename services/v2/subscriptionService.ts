/**
 * Subscription Service V2
 *
 * Fixes:
 * - CRITICAL BUG #1: Subscription bookings don't deduct session quota
 * - CRITICAL BUG #2: Subscription creation doesn't charge credits
 *
 * Usage:
 *   await subscriptionService.createSubscription(currentUser, menteeId, planId, mentorId);
 *   await subscriptionService.useSubscriptionForBooking(menteeId, mentorId, bookingId);
 */

import {
    User,
    Subscription,
    SubscriptionPlan,
    Transaction,
    CreditHistoryEntry
} from '../../types';
import {
    INITIAL_USERS,
    INITIAL_SUBSCRIPTIONS,
    SUBSCRIPTION_PLANS,
    INITIAL_TRANSACTIONS,
    INITIAL_CREDIT_HISTORY
} from '../../mockData';
import { authGuard } from './authGuard';
import { lockManager } from '../../utils/lockManager';

// --- HELPERS FOR LOCAL STORAGE SIMULATION ---
const getStore = <T>(key: string, initial: T): T => {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : initial;
};

const setStore = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const subscriptionService = {
    /**
     * Create a new subscription (FIXED: Now charges credits)
     */
    createSubscription: async (
        currentUser: User | null,
        menteeId: string,
        planId: string,
        mentorId: string
    ): Promise<Subscription> => {
        // Permission check
        authGuard.requireOwnership(currentUser, menteeId);

        return lockManager.acquireLock(`credit:${menteeId}`, async () => {
            const users = getStore<User[]>('users', INITIAL_USERS);
            const plans = getStore<SubscriptionPlan[]>('subscriptionPlans', SUBSCRIPTION_PLANS);
            const subscriptions = getStore<Subscription[]>('subscriptions', INITIAL_SUBSCRIPTIONS);

            const menteeIdx = users.findIndex(u => u.id === menteeId);
            const plan = plans.find(p => p.id === planId);

            if (menteeIdx === -1) throw new Error('Mentee not found');
            if (!plan) throw new Error('Plan not found');

            // ✅ FIX BUG #2: Check balance BEFORE creating subscription
            if (users[menteeIdx].credits < plan.price) {
                throw new Error(
                    `Insufficient credits. Required: ${plan.price}, Available: ${users[menteeIdx].credits}`
                );
            }

            // ✅ FIX BUG #2: Deduct credits atomically
            const originalBalance = users[menteeIdx].credits;
            users[menteeIdx].credits -= plan.price;

            try {
                // Create subscription
                const newSub: Subscription = {
                    id: `sub_${Date.now()}`,
                    menteeId,
                    mentorId,
                    planId,
                    startDate: new Date().toISOString(),
                    endDate: new Date(Date.now() + plan.durationWeeks * 7 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'ACTIVE',
                    remainingSessions: plan.sessions,
                    cancelQuota: plan.allowedCancel,
                    rescheduleQuota: plan.allowedReschedule,
                    bookings: []
                };

                subscriptions.push(newSub);

                // Save all stores
                setStore('users', users);
                setStore('subscriptions', subscriptions);

                // ✅ Log transaction
                const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
                txs.push({
                    id: `tx_sub_${Date.now()}`,
                    userId: menteeId,
                    amount: -plan.price,
                    type: 'SUBSCRIPTION_PURCHASE',
                    description: `Subscription: ${plan.name} (${plan.sessions} sessions)`,
                    date: new Date().toISOString(),
                    relatedEntityId: newSub.id,
                    status: 'COMPLETED'
                });
                setStore('transactions', txs);

                // ✅ Log credit history
                const history = getStore<CreditHistoryEntry[]>('creditHistory', INITIAL_CREDIT_HISTORY);
                history.push({
                    id: `ch_sub_${Date.now()}`,
                    userId: menteeId,
                    type: 'subscription_purchase',
                    amount: -plan.price,
                    balanceAfter: users[menteeIdx].credits,
                    note: `Subscription: ${plan.name}`,
                    timestamp: new Date().toISOString()
                });
                setStore('creditHistory', history);

                return newSub;
            } catch (error) {
                // Rollback on error
                users[menteeIdx].credits = originalBalance;
                setStore('users', users);
                throw error;
            }
        });
    },

    /**
     * Use a subscription for a booking (FIXED: Now deducts session quota)
     */
    useSubscriptionForBooking: async (
        menteeId: string,
        mentorId: string,
        bookingId: string
    ): Promise<Subscription> => {
        return lockManager.acquireLock(`subscription:${menteeId}:${mentorId}`, async () => {
            const subscriptions = getStore<Subscription[]>('subscriptions', INITIAL_SUBSCRIPTIONS);

            // ✅ FIX BUG #1: Find active subscription with remaining sessions
            const subIdx = subscriptions.findIndex(
                s =>
                    s.menteeId === menteeId &&
                    s.mentorId === mentorId &&
                    s.status === 'ACTIVE' &&
                    s.remainingSessions > 0 &&
                    new Date(s.endDate) > new Date()
            );

            if (subIdx === -1) {
                throw new Error('No active subscription with remaining sessions found');
            }

            // ✅ FIX BUG #1: Check idempotency - booking already used?
            if (subscriptions[subIdx].bookings.includes(bookingId)) {
                console.warn(`Booking ${bookingId} already used for this subscription`);
                return subscriptions[subIdx];
            }

            // ✅ FIX BUG #1: Deduct session count
            subscriptions[subIdx].remainingSessions -= 1;
            subscriptions[subIdx].bookings.push(bookingId);

            // Mark as COMPLETED if no sessions left
            if (subscriptions[subIdx].remainingSessions === 0) {
                subscriptions[subIdx].status = 'COMPLETED';
            }

            setStore('subscriptions', subscriptions);

            return subscriptions[subIdx];
        });
    },

    /**
     * Restore a subscription session (on booking cancellation)
     */
    restoreSubscriptionSession: async (
        menteeId: string,
        mentorId: string,
        bookingId: string
    ): Promise<void> => {
        return lockManager.acquireLock(`subscription:${menteeId}:${mentorId}`, async () => {
            const subscriptions = getStore<Subscription[]>('subscriptions', INITIAL_SUBSCRIPTIONS);

            const subIdx = subscriptions.findIndex(
                s =>
                    s.menteeId === menteeId &&
                    s.mentorId === mentorId &&
                    s.bookings.includes(bookingId)
            );

            if (subIdx === -1) {
                console.warn(`No subscription found with booking ${bookingId}`);
                return;
            }

            // Remove booking from list
            subscriptions[subIdx].bookings = subscriptions[subIdx].bookings.filter(
                id => id !== bookingId
            );

            // Restore session count
            subscriptions[subIdx].remainingSessions += 1;

            // Reactivate if was COMPLETED
            if (subscriptions[subIdx].status === 'COMPLETED' && new Date(subscriptions[subIdx].endDate) > new Date()) {
                subscriptions[subIdx].status = 'ACTIVE';
            }

            setStore('subscriptions', subscriptions);
        });
    },

    /**
     * Get all subscriptions for a mentee
     */
    getMenteeSubscriptions: async (currentUser: User | null, menteeId: string): Promise<Subscription[]> => {
        authGuard.requireOwnership(currentUser, menteeId);

        const subscriptions = getStore<Subscription[]>('subscriptions', INITIAL_SUBSCRIPTIONS);
        return subscriptions.filter(s => s.menteeId === menteeId);
    },

    /**
     * Get active subscription for a specific mentee-mentor pair
     */
    getActiveSubscription: async (menteeId: string, mentorId: string): Promise<Subscription | null> => {
        const subscriptions = getStore<Subscription[]>('subscriptions', INITIAL_SUBSCRIPTIONS);

        const activeSub = subscriptions.find(
            s =>
                s.menteeId === menteeId &&
                s.mentorId === mentorId &&
                s.status === 'ACTIVE' &&
                s.remainingSessions > 0 &&
                new Date(s.endDate) > new Date()
        );

        return activeSub || null;
    },

    /**
     * Cancel a subscription (marks as CANCELLED, doesn't refund)
     */
    cancelSubscription: async (currentUser: User | null, subscriptionId: string): Promise<void> => {
        const subscriptions = getStore<Subscription[]>('subscriptions', INITIAL_SUBSCRIPTIONS);
        const subIdx = subscriptions.findIndex(s => s.id === subscriptionId);

        if (subIdx === -1) throw new Error('Subscription not found');

        // Permission check
        authGuard.requireOwnership(currentUser, subscriptions[subIdx].menteeId);

        if (subscriptions[subIdx].status !== 'ACTIVE') {
            throw new Error('Can only cancel ACTIVE subscriptions');
        }

        subscriptions[subIdx].status = 'CANCELLED';
        setStore('subscriptions', subscriptions);
    },

    /**
     * Expire subscriptions that have passed their end date
     */
    expireOldSubscriptions: async (): Promise<number> => {
        const subscriptions = getStore<Subscription[]>('subscriptions', INITIAL_SUBSCRIPTIONS);
        const now = new Date();
        let expiredCount = 0;

        subscriptions.forEach(sub => {
            if (sub.status === 'ACTIVE' && new Date(sub.endDate) <= now) {
                sub.status = 'EXPIRED';
                expiredCount++;
            }
        });

        if (expiredCount > 0) {
            setStore('subscriptions', subscriptions);
        }

        return expiredCount;
    }
};
