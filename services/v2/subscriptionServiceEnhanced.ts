/**
 * Enhanced Subscription Service
 *
 * Extends subscriptionService.ts with fixes for:
 * - BUG #20: forceRenewSubscription() doesn't charge credits
 * - BUG #21: changeSubscriptionPlan() doesn't refund/charge difference
 * - BUG #30: No auto-expiration mechanism
 *
 * Usage:
 *   await subscriptionServiceEnhanced.renewSubscription(currentUser, subscriptionId);
 *   await subscriptionServiceEnhanced.changePlan(currentUser, subscriptionId, newPlanId);
 *   await subscriptionServiceEnhanced.expireOldSubscriptions();
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
import { generateUniqueId } from '../../utils/helpers';

// --- HELPERS FOR LOCAL STORAGE SIMULATION ---
const getStore = <T>(key: string, initial: T): T => {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : initial;
};

const setStore = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const subscriptionServiceEnhanced = {
    /**
     * ✅ FIX BUG #20: Renew subscription (NOW charges credits)
     */
    renewSubscription: async (
        currentUser: User | null,
        subscriptionId: string
    ): Promise<Subscription> => {
        return lockManager.acquireLock(`subscription:${subscriptionId}`, async () => {
            const subscriptions = getStore<Subscription[]>('subscriptions', INITIAL_SUBSCRIPTIONS);
            const plans = getStore<SubscriptionPlan[]>('subscriptionPlans', SUBSCRIPTION_PLANS);
            const users = getStore<User[]>('users', INITIAL_USERS);

            const subIdx = subscriptions.findIndex(s => s.id === subscriptionId);
            if (subIdx === -1) throw new Error('Subscription not found');

            const subscription = subscriptions[subIdx];

            // Permission check
            authGuard.requireOwnership(currentUser, subscription.menteeId);

            // Find the plan
            const plan = plans.find(p => p.id === subscription.planId);
            if (!plan) throw new Error('Subscription plan not found');

            // Find mentee
            const menteeIdx = users.findIndex(u => u.id === subscription.menteeId);
            if (menteeIdx === -1) throw new Error('Mentee not found');

            // ✅ FIX BUG #20: Check balance and charge credits
            if (users[menteeIdx].credits < plan.price) {
                throw new Error(
                    `Insufficient credits to renew. Required: ${plan.price}, Available: ${users[menteeIdx].credits}`
                );
            }

            const originalBalance = users[menteeIdx].credits;

            try {
                // Deduct credits
                users[menteeIdx].credits -= plan.price;

                // Extend subscription
                const currentEndDate = new Date(subscription.endDate);
                const newEndDate = new Date(currentEndDate.getTime() + plan.durationWeeks * 7 * 24 * 60 * 60 * 1000);

                subscription.endDate = newEndDate.toISOString();
                subscription.remainingSessions += plan.sessions;
                subscription.cancelQuota = plan.allowedCancel;
                subscription.rescheduleQuota = plan.allowedReschedule;
                subscription.status = 'ACTIVE';

                // Save all
                setStore('users', users);
                setStore('subscriptions', subscriptions);

                // Log transaction
                const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
                const txId = generateUniqueId('tx_renew');
                txs.push({
                    id: txId,
                    userId: subscription.menteeId,
                    amount: -plan.price,
                    type: 'SUBSCRIPTION_RENEWAL',
                    description: `Renewed subscription: ${plan.name}`,
                    date: new Date().toISOString(),
                    relatedEntityId: subscriptionId,
                    status: 'COMPLETED'
                });
                setStore('transactions', txs);

                // Log credit history
                const history = getStore<CreditHistoryEntry[]>('creditHistory', INITIAL_CREDIT_HISTORY);
                history.push({
                    id: generateUniqueId('ch_renew'),
                    userId: subscription.menteeId,
                    type: 'subscription_renewal',
                    amount: -plan.price,
                    balanceAfter: users[menteeIdx].credits,
                    note: `Renewed: ${plan.name}`,
                    timestamp: new Date().toISOString()
                });
                setStore('creditHistory', history);

                return subscription;
            } catch (error) {
                // Rollback
                users[menteeIdx].credits = originalBalance;
                setStore('users', users);
                throw error;
            }
        });
    },

    /**
     * ✅ FIX BUG #21: Change subscription plan (NOW handles price difference)
     */
    changePlan: async (
        currentUser: User | null,
        subscriptionId: string,
        newPlanId: string
    ): Promise<Subscription> => {
        return lockManager.acquireLock(`subscription:${subscriptionId}`, async () => {
            const subscriptions = getStore<Subscription[]>('subscriptions', INITIAL_SUBSCRIPTIONS);
            const plans = getStore<SubscriptionPlan[]>('subscriptionPlans', SUBSCRIPTION_PLANS);
            const users = getStore<User[]>('users', INITIAL_USERS);

            const subIdx = subscriptions.findIndex(s => s.id === subscriptionId);
            if (subIdx === -1) throw new Error('Subscription not found');

            const subscription = subscriptions[subIdx];

            // Permission check
            authGuard.requireOwnership(currentUser, subscription.menteeId);

            // Find plans
            const oldPlan = plans.find(p => p.id === subscription.planId);
            const newPlan = plans.find(p => p.id === newPlanId);

            if (!oldPlan || !newPlan) throw new Error('Plan not found');

            // ✅ FIX BUG #21: Calculate price difference (prorated)
            const now = new Date();
            const endDate = new Date(subscription.endDate);
            const totalDuration = new Date(subscription.startDate).getTime();
            const remainingDuration = endDate.getTime() - now.getTime();
            const usageRatio = 1 - (remainingDuration / (endDate.getTime() - totalDuration));

            // Prorated refund for unused portion of old plan
            const unusedOldPlanValue = oldPlan.price * (1 - usageRatio);

            // Full price of new plan
            const newPlanPrice = newPlan.price;

            // Net amount to charge/refund
            const priceDifference = newPlanPrice - unusedOldPlanValue;

            const menteeIdx = users.findIndex(u => u.id === subscription.menteeId);
            if (menteeIdx === -1) throw new Error('Mentee not found');

            const originalBalance = users[menteeIdx].credits;

            // ✅ If upgrading (positive difference), check balance
            if (priceDifference > 0) {
                if (users[menteeIdx].credits < priceDifference) {
                    throw new Error(
                        `Insufficient credits to upgrade. Required: ${priceDifference.toFixed(2)}, Available: ${users[menteeIdx].credits}`
                    );
                }
            }

            try {
                // Apply credit adjustment
                users[menteeIdx].credits -= priceDifference;

                // Update subscription
                subscription.planId = newPlanId;
                subscription.planName = newPlan.name;

                // Adjust sessions proportionally
                const sessionRatio = newPlan.sessions / oldPlan.sessions;
                subscription.remainingSessions = Math.max(
                    1,
                    Math.floor(subscription.remainingSessions * sessionRatio)
                );

                subscription.cancelQuota = newPlan.allowedCancel;
                subscription.rescheduleQuota = newPlan.allowedReschedule;

                // Save all
                setStore('users', users);
                setStore('subscriptions', subscriptions);

                // Log transaction
                const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
                const txId = generateUniqueId('tx_change_plan');
                txs.push({
                    id: txId,
                    userId: subscription.menteeId,
                    amount: -priceDifference,
                    type: priceDifference > 0 ? 'SUBSCRIPTION_UPGRADE' : 'SUBSCRIPTION_DOWNGRADE',
                    description: `Changed plan: ${oldPlan.name} → ${newPlan.name} (${priceDifference > 0 ? 'Charge' : 'Refund'}: ${Math.abs(priceDifference).toFixed(2)} credits)`,
                    date: new Date().toISOString(),
                    relatedEntityId: subscriptionId,
                    status: 'COMPLETED'
                });
                setStore('transactions', txs);

                // Log credit history
                const history = getStore<CreditHistoryEntry[]>('creditHistory', INITIAL_CREDIT_HISTORY);
                history.push({
                    id: generateUniqueId('ch_change_plan'),
                    userId: subscription.menteeId,
                    type: priceDifference > 0 ? 'subscription_upgrade' : 'subscription_downgrade',
                    amount: -priceDifference,
                    balanceAfter: users[menteeIdx].credits,
                    note: `Plan change: ${oldPlan.name} → ${newPlan.name}`,
                    timestamp: new Date().toISOString()
                });
                setStore('creditHistory', history);

                return subscription;
            } catch (error) {
                // Rollback
                users[menteeIdx].credits = originalBalance;
                setStore('users', users);
                throw error;
            }
        });
    },

    /**
     * ✅ FIX BUG #30: Auto-expire old subscriptions
     * Should be called periodically (e.g., daily cron job)
     */
    expireOldSubscriptions: async (): Promise<{ expired: number; subscriptions: Subscription[] }> => {
        const subscriptions = getStore<Subscription[]>('subscriptions', INITIAL_SUBSCRIPTIONS);
        const now = new Date();
        const expiredSubs: Subscription[] = [];

        subscriptions.forEach(sub => {
            if (sub.status === 'ACTIVE' && new Date(sub.endDate) <= now) {
                sub.status = 'EXPIRED';
                expiredSubs.push(sub);
            }
        });

        if (expiredSubs.length > 0) {
            setStore('subscriptions', subscriptions);
        }

        return {
            expired: expiredSubs.length,
            subscriptions: expiredSubs
        };
    },

    /**
     * Cancel subscription (with partial refund if applicable)
     */
    cancelSubscription: async (
        currentUser: User | null,
        subscriptionId: string,
        reason?: string
    ): Promise<void> => {
        return lockManager.acquireLock(`subscription:${subscriptionId}`, async () => {
            const subscriptions = getStore<Subscription[]>('subscriptions', INITIAL_SUBSCRIPTIONS);
            const plans = getStore<SubscriptionPlan[]>('subscriptionPlans', SUBSCRIPTION_PLANS);
            const users = getStore<User[]>('users', INITIAL_USERS);

            const subIdx = subscriptions.findIndex(s => s.id === subscriptionId);
            if (subIdx === -1) throw new Error('Subscription not found');

            const subscription = subscriptions[subIdx];

            // Permission check
            authGuard.requireOwnership(currentUser, subscription.menteeId);

            if (subscription.status !== 'ACTIVE') {
                throw new Error(`Cannot cancel subscription with status: ${subscription.status}`);
            }

            // Calculate refund (prorated for unused time)
            const plan = plans.find(p => p.id === subscription.planId);
            if (!plan) throw new Error('Plan not found');

            const now = new Date();
            const endDate = new Date(subscription.endDate);
            const startDate = new Date(subscription.startDate);
            const totalDuration = endDate.getTime() - startDate.getTime();
            const remainingDuration = Math.max(0, endDate.getTime() - now.getTime());
            const refundRatio = remainingDuration / totalDuration;

            const refundAmount = Math.floor(plan.price * refundRatio);

            // Apply refund
            const menteeIdx = users.findIndex(u => u.id === subscription.menteeId);
            if (menteeIdx > -1 && refundAmount > 0) {
                users[menteeIdx].credits += refundAmount;
                setStore('users', users);

                // Log refund
                const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
                txs.push({
                    id: generateUniqueId('tx_cancel_sub'),
                    userId: subscription.menteeId,
                    amount: refundAmount,
                    type: 'SUBSCRIPTION_REFUND',
                    description: `Subscription cancelled: ${plan.name} (Prorated refund: ${refundAmount} credits)`,
                    date: new Date().toISOString(),
                    relatedEntityId: subscriptionId,
                    status: 'COMPLETED'
                });
                setStore('transactions', txs);

                // Log credit history
                const history = getStore<CreditHistoryEntry[]>('creditHistory', INITIAL_CREDIT_HISTORY);
                history.push({
                    id: generateUniqueId('ch_cancel_sub'),
                    userId: subscription.menteeId,
                    type: 'subscription_refund',
                    amount: refundAmount,
                    balanceAfter: users[menteeIdx].credits,
                    note: `Subscription cancelled: ${plan.name}${reason ? ` (${reason})` : ''}`,
                    timestamp: new Date().toISOString()
                });
                setStore('creditHistory', history);
            }

            // Update subscription
            subscription.status = 'CANCELLED';
            setStore('subscriptions', subscriptions);
        });
    },

    /**
     * Get subscription details with calculated metrics
     */
    getSubscriptionDetails: async (
        currentUser: User | null,
        subscriptionId: string
    ): Promise<{
        subscription: Subscription;
        plan: SubscriptionPlan;
        usage: {
            sessionsUsed: number;
            sessionsRemaining: number;
            usagePercentage: number;
            daysRemaining: number;
            daysTotal: number;
        };
    }> => {
        const subscriptions = getStore<Subscription[]>('subscriptions', INITIAL_SUBSCRIPTIONS);
        const plans = getStore<SubscriptionPlan[]>('subscriptionPlans', SUBSCRIPTION_PLANS);

        const subscription = subscriptions.find(s => s.id === subscriptionId);
        if (!subscription) throw new Error('Subscription not found');

        // Permission check
        authGuard.requireOwnership(currentUser, subscription.menteeId);

        const plan = plans.find(p => p.id === subscription.planId);
        if (!plan) throw new Error('Plan not found');

        // Calculate usage metrics
        const sessionsUsed = plan.sessions - subscription.remainingSessions;
        const usagePercentage = (sessionsUsed / plan.sessions) * 100;

        const now = new Date();
        const endDate = new Date(subscription.endDate);
        const startDate = new Date(subscription.startDate);
        const daysTotal = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

        return {
            subscription,
            plan,
            usage: {
                sessionsUsed,
                sessionsRemaining: subscription.remainingSessions,
                usagePercentage: Number(usagePercentage.toFixed(2)),
                daysRemaining,
                daysTotal
            }
        };
    }
};
