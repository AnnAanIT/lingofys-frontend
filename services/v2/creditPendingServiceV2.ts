import { 
    SystemCreditLedgerEntry, 
    User, 
    Booking, 
    Transaction,
    CreditHistoryEntry
} from '../../types';
import { 
    INITIAL_USERS, 
    INITIAL_BOOKINGS, 
    INITIAL_SYSTEM_CREDIT_LEDGER, 
    INITIAL_TRANSACTIONS, 
    INITIAL_CREDIT_HISTORY 
} from '../../mockData';

// --- HELPERS FOR LOCAL STORAGE SIMULATION ---
const getStore = <T>(key: string, initial: T): T => {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : initial;
};

const setStore = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const creditPendingServiceV2 = {
    
    // 1. HOLD CREDIT (On Booking)
    // Deducts from Mentee -> Moves to System Ledger (Status: Holding)
    holdCreditOnBooking: (bookingId: string, menteeId: string, cost: number): void => {
        const users = getStore<User[]>('users', INITIAL_USERS);
        const menteeIndex = users.findIndex(u => u.id === menteeId);
        
        if (menteeIndex === -1) throw new Error("Mentee not found");
        if (users[menteeIndex].credits < cost) throw new Error("Insufficient credits");

        // Atomic Operation: Deduct
        users[menteeIndex].credits -= cost;
        
        // Create Ledger Record (System Audit)
        const ledger = getStore<SystemCreditLedgerEntry[]>('systemCreditLedger', INITIAL_SYSTEM_CREDIT_LEDGER);
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
    },

    // 2. RELEASE CREDIT (On Lesson Completion)
    releaseCreditToMentor: (bookingId: string): void => {
        const bookings = getStore<Booking[]>('bookings', INITIAL_BOOKINGS);
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) throw new Error("Booking not found");

        // 1. Update Ledger
        const ledger = getStore<SystemCreditLedgerEntry[]>('systemCreditLedger', INITIAL_SYSTEM_CREDIT_LEDGER);
        const entryIdx = ledger.findIndex(e => e.bookingId === bookingId && e.status === 'holding');
        
        if (entryIdx === -1) return; // Already released or returned
        
        ledger[entryIdx].status = 'released';
        ledger[entryIdx].toUserId = booking.mentorId;
        ledger[entryIdx].updatedAt = new Date().toISOString();

        // 2. Credit Mentor
        const users = getStore<User[]>('users', INITIAL_USERS);
        const mentorIdx = users.findIndex(u => u.id === booking.mentorId);
        if (mentorIdx !== -1) {
            users[mentorIdx].credits += ledger[entryIdx].amount;
        }

        setStore('systemCreditLedger', ledger);
        setStore('users', users);

        // Log transaction for Admin Financials
        const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
        txs.push({
            id: `tx_${Date.now()}_${bookingId}`,
            userId: booking.mentorId,
            amount: ledger[entryIdx].amount,
            type: 'EARNING',
            description: `Earned from completed booking #${bookingId}`,
            date: new Date().toISOString(),
            relatedEntityId: bookingId,
            status: 'COMPLETED'
        });
        setStore('transactions', txs);

        // Log credit history for mentor
        const history = getStore<CreditHistoryEntry[]>('creditHistory', INITIAL_CREDIT_HISTORY);
        history.push({
            id: `ch_${Date.now()}_${bookingId}_earn`,
            userId: booking.mentorId,
            type: 'earning',
            amount: ledger[entryIdx].amount,
            balanceAfter: users[mentorIdx]?.credits || 0,
            note: `Booking #${bookingId.slice(-8)} (Completed)`,
            timestamp: new Date().toISOString()
        });
        setStore('creditHistory', history);
    },

    // 3. REFUND CREDIT (On Booking Cancellation)
    refundCreditToMentee: (bookingId: string): void => {
        const bookings = getStore<Booking[]>('bookings', INITIAL_BOOKINGS);
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) throw new Error("Booking not found");

        // 1. Find Ledger Entry
        const ledger = getStore<SystemCreditLedgerEntry[]>('systemCreditLedger', INITIAL_SYSTEM_CREDIT_LEDGER);
        // ✅ FIX BUG #1: Only refund if status is 'holding' - prevent refund after credits already released to mentor
        const entryIdx = ledger.findIndex(e => e.bookingId === bookingId && e.status === 'holding');

        if (entryIdx === -1) {
            // Check if already released - throw error to prevent double refund
            const releasedEntry = ledger.find(e => e.bookingId === bookingId && e.status === 'released');
            if (releasedEntry) {
                throw new Error("Cannot refund: Credits already released to mentor");
            }
            return; // Already refunded or no entry found
        }

        const creditAmount = ledger[entryIdx].amount;
        const menteeId = ledger[entryIdx].fromUserId;

        // 2. Mark as Returned
        ledger[entryIdx].status = 'returned';
        ledger[entryIdx].updatedAt = new Date().toISOString();

        // 3. Refund Mentee
        const users = getStore<User[]>('users', INITIAL_USERS);
        const menteeIdx = users.findIndex(u => u.id === menteeId);
        if (menteeIdx !== -1) {
            users[menteeIdx].credits += creditAmount;
        }

        setStore('systemCreditLedger', ledger);
        setStore('users', users);

        // Log transaction
        const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
        txs.push({
            id: `tx_${Date.now()}_${bookingId}_refund`,
            userId: menteeId,
            amount: creditAmount,
            type: 'REFUND',
            description: `Refund for cancelled booking #${bookingId}`,
            date: new Date().toISOString(),
            relatedEntityId: bookingId,
            status: 'COMPLETED'
        });
        setStore('transactions', txs);

        // Log credit history for mentee
        const history = getStore<CreditHistoryEntry[]>('creditHistory', INITIAL_CREDIT_HISTORY);
        history.push({
            id: `ch_${Date.now()}_${bookingId}_refund`,
            userId: menteeId,
            type: 'refund',
            amount: creditAmount,
            balanceAfter: users[menteeIdx]?.credits || 0,
            note: `Booking #${bookingId.slice(-8)} Refunded`,
            timestamp: new Date().toISOString()
        });
        setStore('creditHistory', history);
    },

    // 4. GET LEDGER STATUS
    getLedgerStatus: (bookingId: string): SystemCreditLedgerEntry | null => {
        const ledger = getStore<SystemCreditLedgerEntry[]>('systemCreditLedger', INITIAL_SYSTEM_CREDIT_LEDGER);
        return ledger.find(e => e.bookingId === bookingId) || null;
    },

    // 5. GET USER CREDIT HISTORY
    getUserCreditHistory: (userId: string): CreditHistoryEntry[] => {
        const history = getStore<CreditHistoryEntry[]>('creditHistory', INITIAL_CREDIT_HISTORY);
        return history.filter(h => h.userId === userId).sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    }
};
