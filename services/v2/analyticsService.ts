/**
 * Analytics Service V2
 *
 * Fixes:
 * - BUG #28: getWeeklyRevenue() uses credits instead of USD
 * - BUG #29: getSystemFinancialHealth() doesn't convert credits → USD
 *
 * Usage:
 *   const weeklyRevenue = await analyticsService.getWeeklyRevenue(currentUser);
 *   const monthlyRevenue = await analyticsService.getMonthlyRevenue(currentUser, 2025, 1);
 */

import {
    User,
    Transaction,
    Payout,
    ProviderCommission,
    SystemSettings,
    SystemCreditLedgerEntry,
    WeeklyRevenueResponse,
    MonthlyRevenueResponse
} from '../../types';
import {
    INITIAL_USERS,
    INITIAL_TRANSACTIONS,
    INITIAL_PAYOUTS,
    INITIAL_COMMISSIONS,
    INITIAL_SETTINGS,
    INITIAL_SYSTEM_CREDIT_LEDGER
} from '../../mockData';
import { authGuard } from './authGuard';

// --- HELPERS FOR LOCAL STORAGE SIMULATION ---
const getStore = <T>(key: string, initial: T): T => {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : initial;
};

export const analyticsService = {
    /**
     * ✅ FIX BUG #28: Get weekly revenue (NOW calculates in USD, not credits)
     */
    getWeeklyRevenue: async (currentUser: User | null): Promise<WeeklyRevenueResponse> => {
        authGuard.requireAdmin(currentUser);

        const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
        const settings = getStore<SystemSettings>('systemSettings', INITIAL_SETTINGS);
        const ratio = settings.topupConversionRatio || 0.8;

        const days = [];
        let totalTopup = 0;
        let totalPayout = 0;

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            const dTx = txs.filter(t => t.date.startsWith(dateStr));

            // ✅ FIX BUG #28: Convert credits to USD for top-ups
            const topupCredits = dTx
                .filter(t => t.type === 'TOPUP')
                .reduce((sum, t) => sum + t.amount, 0);
            const topupUsd = topupCredits / ratio; // Convert credits → USD

            // Payouts are already in USD (settlement amount)
            const payoutUsd = dTx
                .filter(t =>
                    (t.type === 'PAYOUT' || t.type === 'mentor_payout' || t.type === 'provider_payout') &&
                    (t.status === 'COMPLETED' || t.status === 'success')
                )
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);

            days.push({
                date: dateStr,
                topupVolume: Number(topupUsd.toFixed(2)),
                payoutVolume: Number(payoutUsd.toFixed(2))
            });

            totalTopup += topupUsd;
            totalPayout += payoutUsd;
        }

        return {
            week: 'Current Week',
            days,
            totalTopup: Number(totalTopup.toFixed(2)),
            totalPayout: Number(totalPayout.toFixed(2)),
            net: Number((totalTopup - totalPayout).toFixed(2))
        };
    },

    /**
     * ✅ FIX BUG #28: Get monthly revenue (NOW calculates in USD)
     */
    getMonthlyRevenue: async (
        currentUser: User | null,
        year: number,
        month: number
    ): Promise<MonthlyRevenueResponse> => {
        authGuard.requireAdmin(currentUser);

        const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
        const settings = getStore<SystemSettings>('systemSettings', INITIAL_SETTINGS);
        const ratio = settings.topupConversionRatio || 0.8;

        const days = [];
        let totalTopup = 0;
        let totalPayout = 0;

        const daysInMonth = new Date(year, month, 0).getDate();

        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
            const dTx = txs.filter(t => t.date.startsWith(dateStr));

            // ✅ Convert credits to USD for top-ups
            const topupCredits = dTx
                .filter(t => t.type === 'TOPUP')
                .reduce((sum, t) => sum + t.amount, 0);
            const topupUsd = topupCredits / ratio;

            const payoutUsd = dTx
                .filter(t =>
                    (t.type === 'PAYOUT' || t.type === 'mentor_payout' || t.type === 'provider_payout') &&
                    (t.status === 'COMPLETED' || t.status === 'success')
                )
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);

            days.push({
                date: dateStr,
                topupVolume: Number(topupUsd.toFixed(2)),
                payoutVolume: Number(payoutUsd.toFixed(2))
            });

            totalTopup += topupUsd;
            totalPayout += payoutUsd;
        }

        return {
            month: `${year}-${month}`,
            days,
            totalTopup: Number(totalTopup.toFixed(2)),
            totalPayout: Number(totalPayout.toFixed(2)),
            net: Number((totalTopup - totalPayout).toFixed(2))
        };
    },

    /**
     * Get admin credit statistics
     */
    getAdminCreditStats: async (currentUser: User | null) => {
        authGuard.requireAdmin(currentUser);

        const ledger = getStore<SystemCreditLedgerEntry[]>('systemCreditLedger', INITIAL_SYSTEM_CREDIT_LEDGER);
        const settings = getStore<SystemSettings>('systemSettings', INITIAL_SETTINGS);
        const ratio = settings.topupConversionRatio || 0.8;

        const holdingCredits = ledger.filter(l => l.status === 'holding').reduce((sum, l) => sum + l.amount, 0);
        const releasedCredits = ledger.filter(l => l.status === 'released').reduce((sum, l) => sum + l.amount, 0);
        const refundedCredits = ledger.filter(l => l.status === 'returned').reduce((sum, l) => sum + l.amount, 0);

        return {
            summary: {
                holding: holdingCredits,
                holdingUsd: Number((holdingCredits / ratio).toFixed(2)),
                released: releasedCredits,
                releasedUsd: Number((releasedCredits / ratio).toFixed(2)),
                refunded: refundedCredits,
                refundedUsd: Number((refundedCredits / ratio).toFixed(2)),
                pendingBookings: ledger.filter(l => l.status === 'holding').length
            },
            records: ledger
        };
    },

    /**
     * Get CAC (Customer Acquisition Cost) statistics
     */
    getAdminCACStats: async (currentUser: User | null) => {
        authGuard.requireAdmin(currentUser);

        const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
        const comms = getStore<ProviderCommission[]>('providerCommissions', INITIAL_COMMISSIONS);
        const settings = getStore<SystemSettings>('systemSettings', INITIAL_SETTINGS);
        const ratio = settings.topupConversionRatio || 0.8;

        // ✅ Calculate revenue in USD
        const revenueCredits = txs.filter(t => t.type === 'TOPUP').reduce((sum, t) => sum + t.amount, 0);
        const revenue = revenueCredits / ratio;

        // CAC (commissions) are already in USD
        const cac = comms.reduce((sum, c) => sum + c.commissionAmountUsd, 0);

        return {
            summary: {
                revenue: Number(revenue.toFixed(2)),
                cac: Number(cac.toFixed(2)),
                cacRatio: revenue > 0 ? Number((cac / revenue).toFixed(4)) : 0,
                grossProfit: Number((revenue - cac).toFixed(2))
            }
        };
    },

    /**
     * Get user growth statistics
     */
    getUserGrowthStats: async (currentUser: User | null) => {
        authGuard.requireAdmin(currentUser);

        const users = getStore<User[]>('users', INITIAL_USERS);

        // Group users by join date
        const usersByDate: Record<string, number> = {};

        users.forEach(user => {
            const date = new Date(user.joinedAt).toISOString().split('T')[0];
            usersByDate[date] = (usersByDate[date] || 0) + 1;
        });

        // Get last 30 days
        const last30Days = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            last30Days.push({
                date: dateStr,
                newUsers: usersByDate[dateStr] || 0
            });
        }

        return {
            totalUsers: users.length,
            usersByRole: {
                MENTEE: users.filter(u => u.role === 'MENTEE').length,
                MENTOR: users.filter(u => u.role === 'MENTOR').length,
                PROVIDER: users.filter(u => u.role === 'PROVIDER').length,
                ADMIN: users.filter(u => u.role === 'ADMIN').length
            },
            usersByStatus: {
                ACTIVE: users.filter(u => u.status === 'ACTIVE').length,
                BANNED: users.filter(u => u.status === 'BANNED').length,
                PENDING_APPROVAL: users.filter(u => u.status === 'PENDING_APPROVAL').length,
                REJECTED: users.filter(u => u.status === 'REJECTED').length
            },
            growthLast30Days: last30Days
        };
    },

    /**
     * Get booking statistics
     */
    getBookingStats: async (currentUser: User | null) => {
        authGuard.requireAdmin(currentUser);

        const bookings = getStore('bookings', []);

        const bookingsByStatus: Record<string, number> = {};
        bookings.forEach((b: any) => {
            bookingsByStatus[b.status] = (bookingsByStatus[b.status] || 0) + 1;
        });

        return {
            total: bookings.length,
            byStatus: bookingsByStatus,
            byType: {
                credit: bookings.filter((b: any) => b.type === 'credit').length,
                subscription: bookings.filter((b: any) => b.type === 'subscription').length
            }
        };
    },

    /**
     * Get platform health score
     */
    getPlatformHealthScore: async (currentUser: User | null): Promise<{
        score: number;
        metrics: {
            cashSurplus: { value: number; healthy: boolean };
            revenueGrowth: { value: number; healthy: boolean };
            activeUsers: { value: number; healthy: boolean };
            completionRate: { value: number; healthy: boolean };
        };
    }> => {
        authGuard.requireAdmin(currentUser);

        // Get financial health
        const users = getStore<User[]>('users', INITIAL_USERS);
        const txs = getStore<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
        const bookings = getStore('bookings', []);
        const settings = getStore<SystemSettings>('systemSettings', INITIAL_SETTINGS);
        const ratio = settings.topupConversionRatio || 0.8;

        // Calculate cash surplus
        const revenueCredits = txs.filter(t => t.type === 'TOPUP').reduce((sum, t) => sum + t.amount, 0);
        const revenue = revenueCredits / ratio;
        const liabilities = users.reduce((sum, u) => sum + u.credits, 0) / ratio;
        const cashSurplus = revenue - liabilities;

        // Calculate active users (logged in last 30 days - simplified)
        const activeUsers = users.filter(u => u.status === 'ACTIVE').length;
        const totalUsers = users.length;
        const activeRatio = totalUsers > 0 ? activeUsers / totalUsers : 0;

        // Calculate booking completion rate
        const completedBookings = bookings.filter((b: any) => b.status === 'COMPLETED').length;
        const totalBookings = bookings.length;
        const completionRate = totalBookings > 0 ? completedBookings / totalBookings : 0;

        // Calculate metrics
        const metrics = {
            cashSurplus: {
                value: Number(cashSurplus.toFixed(2)),
                healthy: cashSurplus > 0
            },
            revenueGrowth: {
                value: Number((revenue / 100).toFixed(2)), // Simplified
                healthy: revenue > 1000
            },
            activeUsers: {
                value: Number((activeRatio * 100).toFixed(2)),
                healthy: activeRatio > 0.5
            },
            completionRate: {
                value: Number((completionRate * 100).toFixed(2)),
                healthy: completionRate > 0.8
            }
        };

        // Calculate overall score (0-100)
        let score = 0;
        if (metrics.cashSurplus.healthy) score += 30;
        if (metrics.revenueGrowth.healthy) score += 25;
        if (metrics.activeUsers.healthy) score += 25;
        if (metrics.completionRate.healthy) score += 20;

        return {
            score,
            metrics
        };
    }
};
