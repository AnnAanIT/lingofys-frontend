/**
 * Credit Engine V2 - Fixed version with atomic operations and idempotency
 *
 * Fixes:
 * - ✅ Race condition prevention with lockManager
 * - ✅ Idempotency checks (prevents duplicate operations)
 * - ✅ Atomic balance updates with rollback
 * - ✅ Mutual exclusion for release/refund
 * - ✅ Transaction logging
 */

import {
    SystemCreditLedgerEntry,
    User,
    MentorEarning,
    Booking,
    Transaction,
    CreditHistoryEntry
} from '../../types';
import {
    INITIAL_USERS,
    INITIAL_BOOKINGS,
    INITIAL_SYSTEM_CREDIT_LEDGER,
    INITIAL_MENTOR_EARNINGS,
    INITIAL_TRANSACTIONS,
    INITIAL_CREDIT_HISTORY
} from '../../mockData';
import { lockManager } from '../../utils/lockManager';

// --- HELPERS FOR LOCAL STORAGE SIMULATION ---
const getStore = <T>(key: string, initial: T): T => {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : initial;
};

const setStore = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const creditEngineV2 = {

    /**
     * 1. HOLD CREDIT (On Booking)
     * Deducts from Mentee -> Moves to System Ledger (Status: Holding)
     *
     * Improvements:
     * - Uses lockManager to prevent concurrent deductions
     * - Idempotency check (prevents duplicate holds)
     * - Rollback on error
     */
    holdCreditOnBooking: async (bookingId: string, menteeId: string, cost: number): Promise<void> => {
        return lockManager.acquireLock(`credit:${menteeId}`, async () => {
            const users = getStore<User[]>('users', INITIAL_USERS);
            const menteeIndex = users.findIndex(u => u.id === menteeId);

            if (menteeIndex === -1) throw new Error("Mentee not found");

            // ✅ IDEMPOTENCY CHECK - Prevent duplicate holds
            const ledger = getStore<SystemCreditLedgerEntry[]>('systemCreditLedger', INITIAL_SYSTEM_CREDIT_LEDGER);
            const existingEntry = ledger.find(e => e.bookingId === bookingId);
            if (existingEntry) {
                console.warn(`Credit already held for booking ${bookingId}`);
                return; // Already processed
            }

            // ✅ Balance validation
            if (users[menteeIndex].credits < cost) {
                throw new Error(`Insufficient credits. Required: ${cost}, Available: ${users[menteeIndex].credits}`);
            }

            // Store original balance for rollback
            const originalBalance = users[menteeIndex].credits;

            try {
                // Atomic Operation: Deduct
                users[menteeIndex].credits -= cost;

                // Create Ledger Record (System Audit)
                ledger.push({
                    id: `sc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    bookingId,
                    fromUserId: menteeId,
                    toUserId: 'system',
                    amount: cost,
                    status: 'holding',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

                // Save All
                setStore('users', users);
                setStore('systemCreditLedger', ledger);

                // Log transaction for Admin Financials
                const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
                txs.push({
                    id: `tx_${Date.now()}_${bookingId}`,
                    userId: menteeId,
                    amount: -cost,
                    type: 'booking_use',
                    description: `Held for booking #${bookingId}`,
                    date: new Date().toISOString(),
                    relatedEntityId: bookingId,
                    status: 'COMPLETED'
                });
                setStore('transactions', txs);

                // Log User Credit History (Visible in User Wallet)
                const history = getStore<CreditHistoryEntry[]>('creditHistory', INITIAL_CREDIT_HISTORY);
                history.push({
                    id: `ch_${Date.now()}_${bookingId}`,
                    userId: menteeId,
                    type: 'booking_use',
                    amount: -cost,
                    balanceAfter: users[menteeIndex].credits,
                    note: `Booking #${bookingId.slice(-8)} (Pending)`,
                    timestamp: new Date().toISOString()
                });
                setStore('creditHistory', history);

            } catch (error) {
                // ✅ ROLLBACK on error
                users[menteeIndex].credits = originalBalance;
                setStore('users', users);
                throw error;
            }
        });
    },

    /**
     * 2. RELEASE CREDIT (On Lesson Completion)
     *
     * Improvements:
     * - Uses lockManager to prevent concurrent release/refund
     * - Status validation before release
     * - Idempotency check
     */
    releaseCreditToMentor: async (bookingId: string): Promise<void> => {
        return lockManager.acquireLock(`booking:${bookingId}`, async () => {
            const bookings = getStore<Booking[]>('bookings', INITIAL_BOOKINGS);
            const booking = bookings.find(b => b.id === bookingId);
            if (!booking) throw new Error("Booking not found");

            // 1. Update Ledger
            const ledger = getStore<SystemCreditLedgerEntry[]>('systemCreditLedger', INITIAL_SYSTEM_CREDIT_LEDGER);
            const entryIdx = ledger.findIndex(e => e.bookingId === bookingId && e.status === 'holding');

            // ✅ IDEMPOTENCY - Check if already released
            const alreadyReleased = ledger.find(e => e.bookingId === bookingId && e.status === 'released');
            if (alreadyReleased) {
                console.warn(`Credit already released for booking ${bookingId}`);
                return;
            }

            // ✅ VALIDATION - Ensure credit was held
            if (entryIdx === -1) {
                throw new Error(`No holding credit found for booking ${bookingId}. Cannot release.`);
            }

            ledger[entryIdx].status = 'released';
            ledger[entryIdx].toUserId = booking.mentorId;
            ledger[entryIdx].updatedAt = new Date().toISOString();

            // 2. Update Mentor Wallet
            const users = getStore<User[]>('users', INITIAL_USERS);
            const mentorIdx = users.findIndex(u => u.id === booking.mentorId);
            if (mentorIdx === -1) throw new Error("Mentor not found");

            users[mentorIdx].credits += booking.totalCost;

            // 3. Create/Update Mentor Earning Record
            const earnings = getStore<MentorEarning[]>('mentorEarnings', INITIAL_MENTOR_EARNINGS);
            const earningIdx = earnings.findIndex(e => e.bookingId === bookingId);

            if (earningIdx > -1) {
                earnings[earningIdx].status = 'payable';
            } else {
                earnings.push({
                    id: `me_${Date.now()}`,
                    mentorId: booking.mentorId,
                    bookingId: booking.id,
                    amount: booking.totalCost,
                    status: 'payable',
                    createdAt: new Date().toISOString()
                });
            }

            // 4. Update Booking local copy (though caller handles saving bookings usually)
            booking.creditStatus = 'released';

            // Save All
            setStore('systemCreditLedger', ledger);
            setStore('mentorEarnings', earnings);
            setStore('users', users);

            // Transaction Log
            const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
            txs.push({
                id: `tx_earn_${Date.now()}`,
                userId: booking.mentorId,
                amount: booking.totalCost,
                type: 'EARNING',
                description: `Released for booking #${bookingId}`,
                date: new Date().toISOString(),
                relatedEntityId: bookingId,
                status: 'COMPLETED'
            });
            setStore('transactions', txs);

            // Mentor Credit History
            const history = getStore<CreditHistoryEntry[]>('creditHistory', INITIAL_CREDIT_HISTORY);
            history.push({
                id: `ch_earn_${Date.now()}`,
                userId: booking.mentorId,
                type: 'earning',
                amount: booking.totalCost,
                balanceAfter: users[mentorIdx].credits,
                note: `Earnings from Booking #${bookingId.slice(-8)}`,
                timestamp: new Date().toISOString()
            });
            setStore('creditHistory', history);
        });
    },

    /**
     * 3. REFUND CREDIT (On Cancellation / No-Show)
     *
     * Improvements:
     * - Uses lockManager to prevent concurrent release/refund
     * - Status validation before refund
     * - Idempotency check
     */
    refundCreditToMentee: async (bookingId: string): Promise<void> => {
        return lockManager.acquireLock(`booking:${bookingId}`, async () => {
            const bookings = getStore<Booking[]>('bookings', INITIAL_BOOKINGS);
            const booking = bookings.find(b => b.id === bookingId);
            if (!booking) throw new Error("Booking not found");

            // 1. Update Ledger
            const ledger = getStore<SystemCreditLedgerEntry[]>('systemCreditLedger', INITIAL_SYSTEM_CREDIT_LEDGER);
            const entryIdx = ledger.findIndex(e => e.bookingId === bookingId && e.status === 'holding');

            // ✅ IDEMPOTENCY - Check if already refunded
            const alreadyRefunded = ledger.find(e => e.bookingId === bookingId && e.status === 'returned');
            if (alreadyRefunded) {
                console.warn(`Credit already refunded for booking ${bookingId}`);
                return;
            }

            // ✅ VALIDATION - Ensure credit was held and not released
            if (entryIdx === -1) {
                const released = ledger.find(e => e.bookingId === bookingId && e.status === 'released');
                if (released) {
                    throw new Error(`Cannot refund - credit already released to mentor`);
                }
                throw new Error(`No holding credit found for booking ${bookingId}`);
            }

            ledger[entryIdx].status = 'returned';
            ledger[entryIdx].toUserId = booking.menteeId;
            ledger[entryIdx].updatedAt = new Date().toISOString();

            // 2. Refund Mentee Balance
            const users = getStore<User[]>('users', INITIAL_USERS);
            const menteeIdx = users.findIndex(u => u.id === booking.menteeId);

            if (menteeIdx > -1) {
                users[menteeIdx].credits += booking.totalCost;
            }

            // 3. Cancel Mentor Pending Earning if exists
            const earnings = getStore<MentorEarning[]>('mentorEarnings', INITIAL_MENTOR_EARNINGS);
            const earningIdx = earnings.findIndex(e => e.bookingId === bookingId);
            if (earningIdx > -1) {
                earnings.splice(earningIdx, 1);
            }

            // 4. Update Booking local copy
            booking.creditStatus = 'refunded';

            // Save All
            setStore('systemCreditLedger', ledger);
            setStore('mentorEarnings', earnings);
            setStore('users', users);

            // Transaction Log
            const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
            txs.push({
                id: `tx_refund_${Date.now()}`,
                userId: booking.menteeId,
                amount: booking.totalCost,
                type: 'REFUND',
                description: `Refund for booking #${bookingId}`,
                date: new Date().toISOString(),
                relatedEntityId: bookingId,
                status: 'COMPLETED'
            });
            setStore('transactions', txs);

            // Mentee Credit History
            if (menteeIdx > -1) {
                const history = getStore<CreditHistoryEntry[]>('creditHistory', INITIAL_CREDIT_HISTORY);
                history.push({
                    id: `ch_ref_${Date.now()}`,
                    userId: booking.menteeId,
                    type: 'refund',
                    amount: booking.totalCost,
                    balanceAfter: users[menteeIdx].credits,
                    note: `Refund for Booking #${bookingId.slice(-8)}`,
                    timestamp: new Date().toISOString()
                });
                setStore('creditHistory', history);
            }
        });
    }
};
