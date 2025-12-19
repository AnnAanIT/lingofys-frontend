/**
 * Mentor Payout Service V2
 *
 * Fixes:
 * - BUG #11: getMentorBalanceDetails() returns total credits instead of payable balance
 * - BUG #12: requestPayout() doesn't validate existing pending payouts
 * - BUG #19: Settlement ratio = 1.0 (no platform profit)
 *
 * Usage:
 *   const balance = await mentorPayoutServiceV2.getMentorBalanceDetails(mentorId);
 *   await mentorPayoutServiceV2.requestPayout(currentUser, mentorId, amount, 'PayPal');
 */

import {
    User,
    Payout,
    Transaction,
    MentorEarning,
    SystemCreditLedgerEntry,
    SystemSettings
} from '../../types';
import {
    INITIAL_USERS,
    INITIAL_PAYOUTS,
    INITIAL_TRANSACTIONS,
    INITIAL_MENTOR_EARNINGS,
    INITIAL_SYSTEM_CREDIT_LEDGER,
    INITIAL_SETTINGS
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

export const mentorPayoutServiceV2 = {
    /**
     * Get mentor balance details (FIXED: Returns actual payable balance)
     */
    getMentorBalanceDetails: async (mentorId: string): Promise<{
        total: number;
        payable: number;
        locked: number;
        paid: number;
        pending: number;
    }> => {
        const users = getStore<User[]>('users', INITIAL_USERS);
        const payouts = getStore<Payout[]>('payouts', INITIAL_PAYOUTS);
        const earnings = getStore<MentorEarning[]>('mentorEarnings', INITIAL_MENTOR_EARNINGS);
        const ledger = getStore<SystemCreditLedgerEntry[]>('systemCreditLedger', INITIAL_SYSTEM_CREDIT_LEDGER);

        const mentor = users.find(u => u.id === mentorId);
        if (!mentor) throw new Error('Mentor not found');

        // Total credits in wallet
        const total = mentor.credits;

        // ✅ FIX BUG #11: Calculate locked credits (pending bookings)
        const lockedInPendingBookings = ledger
            .filter(l => l.toUserId === mentorId && l.status === 'holding')
            .reduce((sum, l) => sum + l.amount, 0);

        // Credits in pending/approved payouts
        const pendingPayouts = payouts
            .filter(p => p.mentorId === mentorId && (p.status === 'PENDING' || p.status === 'APPROVED_PENDING_PAYMENT'))
            .reduce((sum, p) => sum + (p.creditsDeducted || p.amount), 0);

        // Paid out credits (historical)
        const paid = payouts
            .filter(p => p.mentorId === mentorId && p.status === 'PAID')
            .reduce((sum, p) => sum + (p.creditsDeducted || p.amount), 0);

        // ✅ FIX BUG #11: Payable = total - locked
        const payable = Math.max(0, total - lockedInPendingBookings);

        return {
            total,
            payable, // ✅ This is what can be withdrawn
            locked: lockedInPendingBookings,
            paid,
            pending: pendingPayouts
        };
    },

    /**
     * Request payout (FIXED: Validates pending payouts and uses proper settlement ratio)
     */
    requestPayout: async (
        currentUser: User | null,
        mentorId: string,
        creditsToWithdraw: number,
        method: string
    ): Promise<Payout> => {
        // Permission check
        authGuard.requireOwnership(currentUser, mentorId);

        // ✅ FIX BUG #19: Platform takes 10% fee (settlement ratio = 0.9)
        const settings = getStore<SystemSettings>('systemSettings', INITIAL_SETTINGS);
        const settlementRatio = 0.9; // Platform keeps 10%
        const minThreshold = 50;

        if (creditsToWithdraw < minThreshold) {
            throw new Error(`Minimum withdrawal is ${minThreshold} credits`);
        }

        return lockManager.acquireLock(`payout:${mentorId}`, async () => {
            // Get current balance details
            const balance = await mentorPayoutServiceV2.getMentorBalanceDetails(mentorId);

            // ✅ FIX BUG #11: Check payable balance (not total)
            if (balance.payable < creditsToWithdraw) {
                throw new Error(
                    `Insufficient payable balance. Available: ${balance.payable} credits (${balance.locked} locked in pending bookings)`
                );
            }

            // ✅ FIX BUG #12: Check for existing pending payouts
            const payouts = getStore<Payout[]>('payouts', INITIAL_PAYOUTS);
            const existingPending = payouts.find(
                p => p.mentorId === mentorId && (p.status === 'PENDING' || p.status === 'APPROVED_PENDING_PAYMENT')
            );

            if (existingPending) {
                throw new Error(
                    `You already have a pending payout request (${existingPending.creditsDeducted} credits). Please wait for it to be processed.`
                );
            }

            // Deduct credits from mentor wallet
            const users = getStore<User[]>('users', INITIAL_USERS);
            const mentorIdx = users.findIndex(u => u.id === mentorId);
            if (mentorIdx === -1) throw new Error('Mentor not found');

            const originalBalance = users[mentorIdx].credits;
            users[mentorIdx].credits -= creditsToWithdraw;

            // ✅ FIX BUG #19: Calculate settlement amount with platform fee
            const settlementAmount = Number((creditsToWithdraw * settlementRatio).toFixed(2));
            const platformFee = Number((creditsToWithdraw * (1 - settlementRatio)).toFixed(2));

            try {
                // Create payout record
                const newPayout: Payout = {
                    id: `po_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    mentorId,
                    amount: settlementAmount, // USD amount mentor receives
                    creditsDeducted: creditsToWithdraw,
                    status: 'PENDING',
                    method,
                    requestedAt: new Date().toISOString()
                };
                payouts.push(newPayout);

                // Save all
                setStore('users', users);
                setStore('payouts', payouts);

                // Create transaction record
                const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
                txs.push({
                    id: `tx_payout_${newPayout.id}`,
                    userId: mentorId,
                    amount: -creditsToWithdraw,
                    type: 'PAYOUT',
                    description: `Payout Request: ${creditsToWithdraw} credits → $${settlementAmount} USD (${method})`,
                    date: new Date().toISOString(),
                    relatedEntityId: newPayout.id,
                    status: 'PENDING'
                });
                setStore('transactions', txs);

                // Log platform fee
                txs.push({
                    id: `tx_fee_${newPayout.id}`,
                    userId: 'system',
                    amount: platformFee,
                    type: 'PLATFORM_FEE',
                    description: `Platform fee (10%) from payout ${newPayout.id}`,
                    date: new Date().toISOString(),
                    relatedEntityId: newPayout.id,
                    status: 'COMPLETED'
                });
                setStore('transactions', txs);

                return newPayout;
            } catch (error) {
                // Rollback on error
                users[mentorIdx].credits = originalBalance;
                setStore('users', users);
                throw error;
            }
        });
    },

    /**
     * Approve payout (Admin only)
     */
    approvePayout: async (
        currentUser: User | null,
        payoutId: string,
        adminNote?: string
    ): Promise<void> => {
        authGuard.requireAdmin(currentUser);

        const payouts = getStore<Payout[]>('payouts', INITIAL_PAYOUTS);
        const idx = payouts.findIndex(p => p.id === payoutId);

        if (idx === -1) throw new Error('Payout not found');
        if (payouts[idx].status !== 'PENDING') {
            throw new Error(`Cannot approve payout with status: ${payouts[idx].status}`);
        }

        payouts[idx].status = 'APPROVED_PENDING_PAYMENT';
        payouts[idx].adminNote = adminNote;
        payouts[idx].approvedAt = new Date().toISOString();

        setStore('payouts', payouts);

        // Update transaction status
        const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
        const txIdx = txs.findIndex(t => t.relatedEntityId === payoutId && t.type === 'PAYOUT');
        if (txIdx !== -1) {
            txs[txIdx].status = 'APPROVED';
            setStore('transactions', txs);
        }
    },

    /**
     * Reject payout (Admin only) - Refunds credits to mentor
     */
    rejectPayout: async (
        currentUser: User | null,
        payoutId: string,
        reason: string
    ): Promise<void> => {
        authGuard.requireAdmin(currentUser);

        return lockManager.acquireLock(`payout:${payoutId}`, async () => {
            const payouts = getStore<Payout[]>('payouts', INITIAL_PAYOUTS);
            const idx = payouts.findIndex(p => p.id === payoutId);

            if (idx === -1) throw new Error('Payout not found');

            const payout = payouts[idx];

            if (payout.status === 'PAID') {
                throw new Error('Cannot reject a payout that has already been paid');
            }

            // Refund credits to mentor
            const users = getStore<User[]>('users', INITIAL_USERS);
            const mentorIdx = users.findIndex(u => u.id === payout.mentorId);

            if (mentorIdx > -1) {
                users[mentorIdx].credits += payout.creditsDeducted;
                setStore('users', users);
            }

            // Update payout status
            payout.status = 'REJECTED';
            payout.adminNote = reason;
            payout.rejectedAt = new Date().toISOString();
            setStore('payouts', payouts);

            // Update transaction
            const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
            const txIdx = txs.findIndex(t => t.relatedEntityId === payoutId && t.type === 'PAYOUT');
            if (txIdx !== -1) {
                txs[txIdx].status = 'REJECTED';
                txs[txIdx].description += ` (Rejected: ${reason})`;
                setStore('transactions', txs);
            }
        });
    },

    /**
     * Mark payout as paid (Admin only)
     */
    markPayoutPaid: async (
        currentUser: User | null,
        payoutId: string,
        evidenceFile: string
    ): Promise<void> => {
        authGuard.requireAdmin(currentUser);

        const payouts = getStore<Payout[]>('payouts', INITIAL_PAYOUTS);
        const idx = payouts.findIndex(p => p.id === payoutId);

        if (idx === -1) throw new Error('Payout not found');
        if (payouts[idx].status !== 'APPROVED_PENDING_PAYMENT') {
            throw new Error(`Cannot mark as paid. Current status: ${payouts[idx].status}`);
        }

        payouts[idx].status = 'PAID';
        payouts[idx].paidAt = new Date().toISOString();
        payouts[idx].evidenceFile = evidenceFile;

        setStore('payouts', payouts);

        // Update transaction
        const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
        const txIdx = txs.findIndex(t => t.relatedEntityId === payoutId && t.type === 'PAYOUT');
        if (txIdx !== -1) {
            txs[txIdx].status = 'COMPLETED';
            setStore('transactions', txs);
        }
    },

    /**
     * Get system financial health
     */
    getSystemFinancialHealth: async (currentUser: User | null) => {
        authGuard.requireAdmin(currentUser);

        const users = getStore<User[]>('users', INITIAL_USERS);
        const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
        const payouts = getStore<Payout[]>('payouts', INITIAL_PAYOUTS);
        const ledger = getStore<SystemCreditLedgerEntry[]>('systemCreditLedger', INITIAL_SYSTEM_CREDIT_LEDGER);
        const settings = getStore<SystemSettings>('systemSettings', INITIAL_SETTINGS);

        const ratio = settings.topupConversionRatio || 0.8;

        // Calculate cash in (USD from top-ups)
        const cashIn = txs
            .filter(t => t.type === 'TOPUP')
            .reduce((sum, t) => sum + (t.amount / ratio), 0); // Convert credits back to USD

        // Calculate cash out (USD paid to mentors/providers)
        const cashOut = txs
            .filter(t =>
                (t.type === 'PAYOUT' || t.type === 'mentor_payout' || t.type === 'provider_payout') &&
                (t.status === 'COMPLETED' || t.status === 'success')
            )
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const realCash = cashIn - cashOut;

        // ✅ Calculate liabilities in USD
        const walletCreditsLiability = users.reduce((sum, u) => sum + (u.credits || 0), 0) / ratio;
        const pendingPayoutsLiability = payouts
            .filter(p => p.status === 'PENDING' || p.status === 'APPROVED_PENDING_PAYMENT')
            .reduce((sum, p) => sum + p.amount, 0);
        const ledgerHoldingLiability = ledger.filter(l => l.status === 'holding').reduce((sum, l) => sum + l.amount, 0) / ratio;

        const totalLiability = walletCreditsLiability + pendingPayoutsLiability + ledgerHoldingLiability;

        return {
            cashIn,
            cashOut,
            realCash,
            totalLiability,
            breakdown: {
                creditLiability: walletCreditsLiability,
                pendingPayouts: pendingPayoutsLiability,
                subscriptionLiability: ledgerHoldingLiability
            },
            cashSurplus: realCash - totalLiability
        };
    }
};
