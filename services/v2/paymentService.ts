/**
 * Payment Service V2
 *
 * Fixes:
 * - CRITICAL BUG #7: Top-up doesn't apply 0.8 conversion ratio (20% revenue loss)
 *
 * Usage:
 *   await paymentService.buyCredits(currentUser, userId, usdAmount, 'Credit Card');
 */

import {
    User,
    Transaction,
    CreditHistoryEntry,
    SystemSettings
} from '../../types';
import {
    INITIAL_USERS,
    INITIAL_TRANSACTIONS,
    INITIAL_CREDIT_HISTORY,
    INITIAL_SETTINGS
} from '../../mockData';
import { authGuard } from './authGuard';
import { lockManager } from '../../utils/lockManager';
import { providerCommissionServiceV2 } from './providerCommissionServiceV2';

// --- HELPERS FOR LOCAL STORAGE SIMULATION ---
const getStore = <T>(key: string, initial: T): T => {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : initial;
};

const setStore = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const paymentService = {
    /**
     * Buy credits (Top-up) - FIXED: Now applies conversion ratio
     *
     * @param usdAmount - Amount in USD that user pays
     * @returns Transaction ID
     */
    buyCredits: async (
        currentUser: User | null,
        userId: string,
        usdAmount: number,
        paymentMethod: string
    ): Promise<string> => {
        // Permission check
        authGuard.requireOwnership(currentUser, userId);

        if (usdAmount <= 0) {
            throw new Error('Top-up amount must be positive');
        }

        return lockManager.acquireLock(`credit:${userId}`, async () => {
            const users = getStore<User[]>('users', INITIAL_USERS);
            const settings = getStore<SystemSettings>('systemSettings', INITIAL_SETTINGS);
            const userIdx = users.findIndex(u => u.id === userId);

            if (userIdx === -1) throw new Error('User not found');

            // ✅ FIX BUG #7: Apply conversion ratio
            const ratio = settings.topupConversionRatio || 0.8;
            const creditsToAdd = usdAmount * ratio;

            console.log(
                `[Payment] User pays $${usdAmount} USD → Receives ${creditsToAdd} credits (ratio: ${ratio})`
            );

            // Store original balance for rollback
            const originalBalance = users[userIdx].credits;

            try {
                // Add credits to user wallet
                users[userIdx].credits += creditsToAdd;

                // Create transaction ID
                const txId = `tx_topup_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

                // Save user
                setStore('users', users);

                // ✅ Log transaction (store USD amount for financial records)
                const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
                txs.push({
                    id: txId,
                    userId: userId,
                    amount: creditsToAdd, // Credits received (not USD)
                    type: 'TOPUP',
                    description: `Top-up: $${usdAmount} USD → ${creditsToAdd} credits (${paymentMethod})`,
                    date: new Date().toISOString(),
                    status: 'COMPLETED'
                });
                setStore('transactions', txs);

                // ✅ Log credit history
                const history = getStore<CreditHistoryEntry[]>('creditHistory', INITIAL_CREDIT_HISTORY);
                history.push({
                    id: `ch_topup_${Date.now()}`,
                    userId: userId,
                    type: 'topup',
                    amount: creditsToAdd,
                    balanceAfter: users[userIdx].credits,
                    note: `Top-up: $${usdAmount} USD via ${paymentMethod}`,
                    timestamp: new Date().toISOString()
                });
                setStore('creditHistory', history);

                // ✅ FIX: Pass USD amount (not credits) to commission engine
                const user = users[userIdx];
                const userName = user.name;

                // Check if user has a provider (referral)
                if (user.providerId) {
                    providerCommissionServiceV2.processTopupCommission(
                        userId,
                        usdAmount, // ✅ Pass USD, not credits
                        txId
                    );
                }

                return txId;
            } catch (error) {
                // Rollback on error
                users[userIdx].credits = originalBalance;
                setStore('users', users);
                throw error;
            }
        });
    },

    /**
     * Simulate payment gateway (for testing)
     */
    simulatePaymentGateway: async (
        amount: number,
        method: string
    ): Promise<{ success: boolean; transactionId: string }> => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simulate 95% success rate
        const success = Math.random() > 0.05;

        if (!success) {
            throw new Error('Payment gateway error: Transaction declined');
        }

        return {
            success: true,
            transactionId: `gateway_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
    },

    /**
     * Get pricing tiers (example for frontend)
     */
    getPricingTiers: (): { usd: number; credits: number; bonus?: number }[] => {
        const settings = getStore<SystemSettings>('systemSettings', INITIAL_SETTINGS);
        const ratio = settings.topupConversionRatio || 0.8;

        return [
            { usd: 10, credits: 10 * ratio },
            { usd: 50, credits: 50 * ratio, bonus: 2 },
            { usd: 100, credits: 100 * ratio, bonus: 5 },
            { usd: 200, credits: 200 * ratio, bonus: 15 },
            { usd: 500, credits: 500 * ratio, bonus: 50 }
        ];
    },

    /**
     * Get transaction history for a user
     */
    getTransactionHistory: async (
        currentUser: User | null,
        userId: string,
        limit?: number
    ): Promise<Transaction[]> => {
        authGuard.requireOwnership(currentUser, userId);

        const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
        const userTxs = txs
            .filter(tx => tx.userId === userId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return limit ? userTxs.slice(0, limit) : userTxs;
    },

    /**
     * Get credit history for a user (more detailed than transactions)
     */
    getCreditHistory: async (
        currentUser: User | null,
        userId: string,
        limit?: number
    ): Promise<CreditHistoryEntry[]> => {
        authGuard.requireOwnership(currentUser, userId);

        const history = getStore<CreditHistoryEntry[]>('creditHistory', INITIAL_CREDIT_HISTORY);
        const userHistory = history
            .filter(h => h.userId === userId)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return limit ? userHistory.slice(0, limit) : userHistory;
    },

    /**
     * Admin: Get all transactions (financial overview)
     */
    getAllTransactions: async (currentUser: User | null): Promise<Transaction[]> => {
        authGuard.requireAdmin(currentUser);

        const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
        return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    /**
     * Admin: Get revenue summary
     */
    getRevenueSummary: async (currentUser: User | null): Promise<{
        totalRevenue: number;
        totalTopups: number;
        totalRefunds: number;
        netRevenue: number;
    }> => {
        authGuard.requireAdmin(currentUser);

        const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
        const settings = getStore<SystemSettings>('systemSettings', INITIAL_SETTINGS);
        const ratio = settings.topupConversionRatio || 0.8;

        // Calculate revenue from top-ups (convert credits back to USD)
        const topups = txs.filter(tx => tx.type === 'TOPUP');
        const totalTopups = topups.reduce((sum, tx) => {
            // tx.amount is in credits, convert back to USD
            return sum + (tx.amount / ratio);
        }, 0);

        // Calculate refunds (credits converted to USD)
        const refunds = txs.filter(tx => tx.type === 'REFUND');
        const totalRefunds = refunds.reduce((sum, tx) => {
            return sum + (tx.amount / ratio);
        }, 0);

        return {
            totalRevenue: totalTopups,
            totalTopups: topups.length,
            totalRefunds: refunds.length,
            netRevenue: totalTopups - totalRefunds
        };
    }
};
