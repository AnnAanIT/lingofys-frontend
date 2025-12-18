
import { Provider, ProviderLevel, Referral, ProviderCommission, User, Transaction, SystemLog } from '../types';
import { INITIAL_PROVIDER_LEVELS, INITIAL_PROVIDERS, INITIAL_REFERRALS, INITIAL_USERS, INITIAL_TRANSACTIONS, INITIAL_LOGS } from '../mockData';

const getStore = <T>(key: string, initial: T): T => {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : initial;
};

const setStore = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const providerCommissionEngine = {
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
            const { percent, status } = providerCommissionEngine.getProviderRate(providerId);

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
                createdAt: new Date().toISOString()
            };

            commissions.push(newCommission);
            setStore('providerCommissions', commissions);

            // Cộng dồn vào balance của provider
            const users = getStore<User[]>('users', INITIAL_USERS);
            const userIdx = users.findIndex(u => u.id === providerId);
            if (userIdx !== -1) {
                users[userIdx].balance += commissionAmount;
                setStore('users', users);
            }

            providers[providerIdx].balance += commissionAmount; 
            setStore('providers', providers);

            const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
            txs.push({
                id: `tx_comm_${newCommission.id}`,
                userId: providerId,
                amount: commissionAmount,
                type: 'PROVIDER_COMMISSION',
                description: `Commission from ${mentee?.name} top-up ($${topupAmountUsd})`,
                date: new Date().toISOString(),
                relatedEntityId: newCommission.id,
                status: 'COMPLETED' 
            });
            setStore('transactions', txs);

            const logs = getStore<SystemLog[]>('logs', INITIAL_LOGS);
            logs.unshift({
                ts: Date.now(),
                lvl: 'info',
                src: 'payment',
                msg: `Provider ${providerId} earned $${commissionAmount} commission on topup ${topupTransactionId}`
            });
            setStore('logs', logs);
            
            referral.totalSpending += topupAmountUsd;
            referral.totalCommission += commissionAmount;
            setStore('referrals', referrals);

            return newCommission;
        } catch (e) {
            // Trường hợp Provider đã bị xóa khỏi bảng users hoặc bảng providers
            console.error("Commission engine error:", e);
            return null;
        }
    }
};
