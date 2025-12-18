
import { Payout, User, Transaction, SystemLog, SystemSettings, SystemCreditLedgerEntry } from '../types';
import { INITIAL_SETTINGS, INITIAL_USERS, INITIAL_PAYOUTS, INITIAL_TRANSACTIONS, INITIAL_SYSTEM_CREDIT_LEDGER } from '../mockData';

// --- HELPERS FOR LOCAL STORAGE SIMULATION ---
const getStore = <T>(key: string, initial: T): T => {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : initial;
};

const setStore = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const mentorPayoutEngine = {
    
    // 1. GET BALANCE DETAILS
    getMentorBalanceDetails: (mentorId: string): { payable: number; paid: number; pending: number } => {
        const users = getStore<User[]>('users', INITIAL_USERS);
        const payouts = getStore<Payout[]>('payouts', INITIAL_PAYOUTS);
        
        const mentor = users.find(u => u.id === mentorId);
        if (!mentor) throw new Error("Mentor not found");

        const mentorPayouts = payouts.filter(p => p.mentorId === mentorId);
        
        const paid = mentorPayouts
            .filter(p => p.status === 'PAID')
            .reduce((acc, p) => acc + p.amount, 0); 

        const pending = mentorPayouts
            .filter(p => p.status === 'PENDING' || p.status === 'APPROVED_PENDING_PAYMENT')
            .reduce((acc, p) => acc + p.amount, 0); 

        return {
            payable: mentor.credits, 
            paid,    
            pending  
        };
    },

    // 2. GET SYSTEM HEALTH (Audit Logic)
    getSystemFinancialHealth: () => {
        const users = getStore<User[]>('users', INITIAL_USERS);
        const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
        const payouts = getStore<Payout[]>('payouts', INITIAL_PAYOUTS);
        const ledger = getStore<SystemCreditLedgerEntry[]>('systemCreditLedger', INITIAL_SYSTEM_CREDIT_LEDGER);

        const cashIn = txs.filter(t => t.type === 'TOPUP').reduce((a, b) => a + b.amount, 0);
        const cashOut = txs.filter(t => (t.type === 'PAYOUT' || t.type === 'mentor_payout' || t.type === 'provider_payout') && (t.status === 'COMPLETED' || t.status === 'success')).reduce((a, b) => a + Math.abs(b.amount), 0);
        const realCash = cashIn - cashOut;

        // Liabilities calculation
        const walletCreditsLiability = users.reduce((a, b) => a + (b.credits || 0), 0);
        const pendingPayoutsLiability = payouts.filter(p => p.status === 'PENDING' || p.status === 'APPROVED_PENDING_PAYMENT').reduce((a, b) => a + b.amount, 0);
        const ledgerHoldingLiability = ledger.filter(l => l.status === 'holding').reduce((a, b) => a + b.amount, 0);
        
        const totalLiability = walletCreditsLiability + pendingPayoutsLiability + ledgerHoldingLiability;

        return {
            cashIn,
            cashOut,
            realCash,
            totalLiability: totalLiability,
            breakdown: {
                creditLiability: walletCreditsLiability,
                providerLiability: 0, 
                pendingPayouts: pendingPayoutsLiability,
                subscriptionLiability: ledgerHoldingLiability // Using held credits as active session liability
            },
            cashSurplus: realCash - totalLiability
        };
    },

    // 3. REQUEST PAYOUT
    requestPayout: (mentorId: string, creditsToWithdraw: number, method: string): Payout => {
        const settlementRatio = 1.0; 
        const minThreshold = 50; 

        if (creditsToWithdraw < minThreshold) {
            throw new Error(`Minimum withdrawal is ${minThreshold} credits`);
        }

        const users = getStore<User[]>('users', INITIAL_USERS);
        const mentorIdx = users.findIndex(u => u.id === mentorId);
        if (mentorIdx === -1) throw new Error("Mentor not found");
        
        const mentor = users[mentorIdx];
        if (mentor.credits < creditsToWithdraw) throw new Error("Insufficient balance.");

        mentor.credits -= creditsToWithdraw;
        const settlementAmount = Number((creditsToWithdraw * settlementRatio).toFixed(2));

        const payouts = getStore<Payout[]>('payouts', INITIAL_PAYOUTS);
        const newPayout: Payout = {
            id: `po_${Date.now()}`,
            mentorId,
            amount: settlementAmount,
            creditsDeducted: creditsToWithdraw,
            status: 'PENDING',
            method,
            requestedAt: new Date().toISOString(),
        };
        payouts.push(newPayout);

        const transactions = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
        transactions.push({
            id: `tx_req_${newPayout.id}`,
            userId: mentorId,
            amount: -creditsToWithdraw,
            type: 'PAYOUT',
            description: `Payout Request: ${creditsToWithdraw} Credits`,
            date: new Date().toISOString(),
            relatedEntityId: newPayout.id,
            status: 'PENDING'
        });

        setStore('users', users);
        setStore('payouts', payouts);
        setStore('transactions', transactions);

        return newPayout;
    },

    approvePayout: (payoutId: string, adminId: string, adminNote?: string): void => {
        const payouts = getStore<Payout[]>('payouts', INITIAL_PAYOUTS);
        const idx = payouts.findIndex(p => p.id === payoutId);
        if (idx !== -1) {
            payouts[idx].status = 'APPROVED_PENDING_PAYMENT';
            payouts[idx].adminNote = adminNote;
            setStore('payouts', payouts);
        }
    },

    rejectPayout: (payoutId: string, adminId: string, reason: string): void => {
        const payouts = getStore<Payout[]>('payouts', INITIAL_PAYOUTS);
        const idx = payouts.findIndex(p => p.id === payoutId);
        if (idx !== -1) {
            const payout = payouts[idx];
            const users = getStore<User[]>('users', INITIAL_USERS);
            const mentorIdx = users.findIndex(u => u.id === payout.mentorId);
            if (mentorIdx > -1) users[mentorIdx].credits += payout.creditsDeducted;
            
            payout.status = 'REJECTED';
            payout.adminNote = reason;
            setStore('users', users);
            setStore('payouts', payouts);
        }
    },

    markPayoutPaid: (payoutId: string, adminId: string, evidenceFile: string): void => {
        const payouts = getStore<Payout[]>('payouts', INITIAL_PAYOUTS);
        const idx = payouts.findIndex(p => p.id === payoutId);
        if (idx !== -1) {
            payouts[idx].status = 'PAID';
            payouts[idx].paidAt = new Date().toISOString();
            payouts[idx].evidenceFile = evidenceFile;
            setStore('payouts', payouts);
        }
    }
};
