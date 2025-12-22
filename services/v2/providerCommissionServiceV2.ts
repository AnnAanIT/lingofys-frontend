import { Provider, ProviderLevel, Referral, ProviderCommission, User, Transaction, SystemLog } from '../../types';
import { INITIAL_PROVIDER_LEVELS, INITIAL_PROVIDERS, INITIAL_REFERRALS, INITIAL_USERS, INITIAL_TRANSACTIONS, INITIAL_LOGS } from '../../mockData';

const getStore = <T>(key: string, initial: T): T => {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : initial;
};

const setStore = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const providerCommissionServiceV2 = {
    // 1. RESOLVE PROVIDER LEVEL & RATE
    getProviderRate: (providerId: string): { levelId: string, name: string, percent: number, status: string } => {
        const users = getStore<User[]>('users', INITIAL_USERS);
        const providers = getStore<Provider[]>('providers', INITIAL_PROVIDERS);
        const levels = getStore<ProviderLevel[]>('providerLevels', INITIAL_PROVIDER_LEVELS);
        
        const providerUser = users.find(u => u.id === providerId);
        const providerData = providers.find(p => p.id === providerId);
        
        if (!providerUser || !providerData) throw new Error("Provider not found or deleted");

        const level = levels.find(l => l.id === providerData.levelId);
        const defaultLevel = levels[0]; 
        
        const rate = level ? level.commissionPercent : defaultLevel.commissionPercent;
        const levelName = level ? level.name : defaultLevel.name;
        const levelId = level ? level.id : defaultLevel.id;

        return { levelId, name: levelName, percent: rate, status: providerUser.status };
    },

    // 2. PROCESS TOP-UP COMMISSION
    processTopupCommission: (menteeId: string, topupAmountUsd: number, topupTransactionId: string): ProviderCommission | null => {
        const referrals = getStore<Referral[]>('referrals', INITIAL_REFERRALS);
        const referral = referrals.find(r => r.menteeId === menteeId);

        if (!referral) return null; 

        const providerId = referral.providerId;
        
        try {
            const { percent, status } = providerCommissionServiceV2.getProviderRate(providerId);

            // LOGIC QUAN TRỌNG: Nếu Provider không ACTIVE (ví dụ BANNED), không tính hoa hồng
            if (status !== 'ACTIVE') {
                const logs = getStore<SystemLog[]>('logs', INITIAL_LOGS);
                logs.unshift({
                    ts: Date.now(),
                    lvl: 'warn',
                    src: 'payment',
                    msg: `Commission skipped for Mentee ${menteeId}: Provider ${providerId} is currently ${status}`
                });
                setStore('logs', logs);
                return null;
            }

            const commissionAmount = Number((topupAmountUsd * (percent / 100)).toFixed(2));
            const commissions = getStore<ProviderCommission[]>('providerCommissions', []);
            
            if (commissions.some(c => c.topupId === topupTransactionId)) {
                return null;
            }

            const providers = getStore<Provider[]>('providers', INITIAL_PROVIDERS);
            const providerIdx = providers.findIndex(p => p.id === providerId);
            if (providerIdx === -1) return null;

            const mentee = getStore<User[]>('users', INITIAL_USERS).find(u => u.id === menteeId);

            const newCommission: ProviderCommission = {
                id: `pc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                providerId,
                topupId: topupTransactionId,
                menteeId,
                menteeName: mentee ? mentee.name : 'Unknown',
                topupAmountUsd,
                commissionPercent: percent,
                commissionAmountUsd: commissionAmount,
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                paidAt: null
            };

            commissions.push(newCommission);
            setStore('providerCommissions', commissions);

            // Log transaction
            const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
            txs.push({
                id: `tx_${Date.now()}_commission_${providerId}`,
                userId: providerId,
                amount: commissionAmount,
                type: 'PROVIDER_COMMISSION',
                description: `Commission from mentee top-up ($${topupAmountUsd})`,
                date: new Date().toISOString(),
                relatedEntityId: topupTransactionId,
                status: 'PENDING'
            });
            setStore('transactions', txs);

            return newCommission;
        } catch (err) {
            const logs = getStore<SystemLog[]>('logs', INITIAL_LOGS);
            logs.unshift({
                ts: Date.now(),
                lvl: 'error',
                src: 'system',
                msg: `Failed to process commission: ${err}`
            });
            setStore('logs', logs);
            return null;
        }
    },

    // 3. GET PENDING COMMISSIONS FOR PAYOUT
    getPendingCommissions: (providerId: string): ProviderCommission[] => {
        const commissions = getStore<ProviderCommission[]>('providerCommissions', []);
        return commissions.filter(c => c.providerId === providerId && c.status === 'PENDING');
    },

    // 4. MARK COMMISSIONS AS PAID
    markCommissionsPaid: (providerId: string, payoutId: string): void => {
        const commissions = getStore<ProviderCommission[]>('providerCommissions', []);
        const now = new Date().toISOString();
        
        commissions.forEach(c => {
            if (c.providerId === providerId && c.status === 'PENDING') {
                c.status = 'PAID';
                c.paidAt = now;
            }
        });
        
        setStore('providerCommissions', commissions);
    },

    // 5. GET TOTAL PENDING COMMISSION FOR PROVIDER
    getTotalPendingCommission: (providerId: string): number => {
        const pending = providerCommissionServiceV2.getPendingCommissions(providerId);
        return Number(pending.reduce((sum, c) => sum + c.commissionAmountUsd, 0).toFixed(2));
    }
};
