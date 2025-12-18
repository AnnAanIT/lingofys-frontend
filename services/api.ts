
import { 
  User, UserRole, Mentor, Booking, BookingStatus, Homework, 
  AvailabilitySlot, Conversation, Message, Notification, 
  Transaction, Payout, SystemLog, CreditHistoryEntry, 
  Subscription, SubscriptionPlan, MentorEarning, 
  SystemCreditLedgerEntry, Provider, Referral, 
  ProviderCommission, PricingCountry, PricingGroup, 
  SystemSettings, ProviderLevel, WeeklyRevenueResponse, MonthlyRevenueResponse, CACDashboardData
} from '../types';
import { 
  INITIAL_USERS, INITIAL_MENTORS, INITIAL_BOOKINGS, 
  INITIAL_HOMEWORK, 
  INITIAL_CONVERSATIONS, INITIAL_MESSAGES, INITIAL_PROVIDERS, 
  INITIAL_SYSTEM_CREDIT_LEDGER, 
  INITIAL_PAYOUTS, INITIAL_TRANSACTIONS, INITIAL_REFERRALS, 
  INITIAL_COMMISSIONS, INITIAL_LOGS, INITIAL_NOTIFICATIONS, 
  SUBSCRIPTION_PLANS, INITIAL_CREDIT_HISTORY,
  INITIAL_SETTINGS, INITIAL_PRICING_COUNTRIES, INITIAL_PRICING_GROUPS,
  INITIAL_PROVIDER_LEVELS
} from '../mockData';

import { creditPendingEngine } from '../lib/creditPendingEngine';
import { mentorPayoutEngine } from '../lib/mentorPayoutEngine';
import { providerCommissionEngine } from '../lib/providerCommissionEngine';
import { pricingRevenueEngine } from '../lib/pricingRevenueEngine';
import { getTimezoneByCountry } from '../lib/timeUtils';

const API_DELAY = 400;

class MockDB {
    get<T>(key: string, initial: T): T {
        const s = localStorage.getItem(key);
        if (!s) {
            this.set(key, initial);
            return initial;
        }
        return JSON.parse(s);
    }
    set(key: string, data: any) {
        localStorage.setItem(key, JSON.stringify(data));
    }
    reset() {
        localStorage.clear();
        window.location.reload();
    }
}

const db = new MockDB();

const apiCall = async <T>(fn: () => T | Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                const result = await fn();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }, API_DELAY);
    });
};

// --- INTERNAL NOTIFICATION HELPER ---
const triggerNotification = (notif: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const ns = db.get<Notification[]>('notifications', INITIAL_NOTIFICATIONS);
    ns.unshift({
        ...notif,
        id: `nt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date().toISOString(),
        read: false
    });
    db.set('notifications', ns);
};

export const api = {
  resetDatabase: () => db.reset(),

  // --- AUTH ---
  login: async (email: string, password?: string): Promise<User> => {
    return apiCall(() => {
        const users = db.get<User[]>('users', INITIAL_USERS);
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) throw new Error("Email không tồn tại.");
        if (password && user.password && user.password !== password) throw new Error("Mật khẩu không khớp.");
        return user;
    });
  },

  loginById: async (id: string): Promise<User> => {
    return apiCall(() => {
        const users = db.get<User[]>('users', INITIAL_USERS);
        const user = users.find(u => u.id === id);
        if (!user) throw new Error("User not found");
        return user;
    });
  },

  loginByRole: async (role: UserRole): Promise<User> => {
    return apiCall(() => {
        const users = db.get<User[]>('users', INITIAL_USERS);
        const user = users.find(u => u.role === role);
        if (!user) throw new Error("Role not found");
        return user;
    });
  },

  register: async (data: any): Promise<User> => {
    return apiCall(() => {
        const users = db.get<User[]>('users', INITIAL_USERS);
        if (users.some(u => u.email === data.email)) throw new Error("Email đã tồn tại.");

        const country = data.country || 'VN';
        const timezone = getTimezoneByCountry(country);

        const newUser: User = {
            id: `u_${Date.now()}`,
            name: data.name,
            email: data.email,
            password: data.password,
            role: data.role,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`,
            credits: 0,
            balance: 0,
            status: 'ACTIVE',
            joinedAt: new Date().toISOString(),
            country: country,
            timezone: timezone
        };
        users.push(newUser);
        db.set('users', users);

        if (data.role === UserRole.MENTOR) {
            const mentors = db.get<Mentor[]>('mentors', INITIAL_MENTORS);
            mentors.push({ ...newUser, bio: 'New mentor', specialties: [], hourlyRate: 10, rating: 5, reviewCount: 0, experienceYears: 0, availability: [] });
            db.set('mentors', mentors);
        }
        return newUser;
    });
  },

  // --- AVAILABILITY ---
  getAvailability: async (mentorId: string) => apiCall(() => {
      const mentors = db.get<Mentor[]>('mentors', INITIAL_MENTORS);
      return mentors.find(m => m.id === mentorId)?.availability || [];
  }),

  addAvailability: async (mentorId: string, slot: Omit<AvailabilitySlot, 'id' | 'mentorId'>) => apiCall(() => {
      const mentors = db.get<Mentor[]>('mentors', INITIAL_MENTORS);
      const mIdx = mentors.findIndex(m => m.id === mentorId);
      if (mIdx === -1) throw new Error("Mentor not found");
      
      const newSlot: AvailabilitySlot = {
          ...slot,
          id: `av_${Date.now()}`,
          mentorId
      };
      
      if (!mentors[mIdx].availability) mentors[mIdx].availability = [];
      mentors[mIdx].availability.push(newSlot);
      db.set('mentors', mentors);
      return newSlot;
  }),

  updateAvailability: async (mentorId: string, slotId: string, updates: Partial<AvailabilitySlot>) => apiCall(() => {
      const mentors = db.get<Mentor[]>('mentors', INITIAL_MENTORS);
      const mIdx = mentors.findIndex(m => m.id === mentorId);
      if (mIdx === -1) return;
      
      const sIdx = mentors[mIdx].availability.findIndex(s => s.id === slotId);
      if (sIdx !== -1) {
          mentors[mIdx].availability[sIdx] = { ...mentors[mIdx].availability[sIdx], ...updates };
          db.set('mentors', mentors);
      }
  }),

  deleteAvailability: async (mentorId: string, slotId: string) => apiCall(() => {
      const mentors = db.get<Mentor[]>('mentors', INITIAL_MENTORS);
      const mIdx = mentors.findIndex(m => m.id === mentorId);
      if (mIdx === -1) return;
      
      mentors[mIdx].availability = mentors[mIdx].availability.filter(s => s.id !== slotId);
      db.set('mentors', mentors);
  }),

  // --- WALLET & CREDITS ---
  buyCredits: async (userId: string, amount: number, method: string) => apiCall(() => {
    const users = db.get<User[]>('users', INITIAL_USERS);
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error("User not found");

    users[idx].credits += amount;
    db.set('users', users);

    const history = db.get<CreditHistoryEntry[]>('creditHistory', INITIAL_CREDIT_HISTORY);
    history.unshift({
        id: `ch_${Date.now()}`,
        userId,
        type: 'topup',
        amount,
        balanceAfter: users[idx].credits,
        note: `Nạp Credits qua ${method}`,
        timestamp: new Date().toISOString()
    });
    db.set('creditHistory', history);

    const txs = db.get<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
    txs.push({
        id: `tx_topup_${Date.now()}`,
        userId,
        amount: amount,
        type: 'TOPUP',
        description: `Credit Top-up via ${method}`,
        date: new Date().toISOString(),
        status: 'COMPLETED'
    });
    db.set('transactions', txs);

    triggerNotification({
        userId, role: UserRole.MENTEE, type: 'success', title: 'Nạp tiền thành công', 
        message: `Đã thêm ${amount} Credits vào ví của bạn.`, actionType: 'wallet'
    });
  }),

  getUserCreditHistory: async (userId: string) => apiCall(() => 
    db.get<CreditHistoryEntry[]>('creditHistory', INITIAL_CREDIT_HISTORY).filter(h => h.userId === userId)
  ),

  updateUserCredit: async (userId: string, type: 'add' | 'subtract' | 'set', amount: number, note: string) => apiCall(() => {
      const users = db.get<User[]>('users', INITIAL_USERS);
      const idx = users.findIndex(u => u.id === userId);
      if (idx === -1) throw new Error("User not found");

      if (type === 'add') users[idx].credits += amount;
      else if (type === 'subtract') users[idx].credits -= amount;
      else users[idx].credits = amount;

      db.set('users', users);

      const history = db.get<CreditHistoryEntry[]>('creditHistory', INITIAL_CREDIT_HISTORY);
      history.unshift({
          id: `ch_adj_${Date.now()}`,
          userId,
          type: 'admin_adjustment',
          amount: type === 'subtract' ? -amount : amount,
          balanceAfter: users[idx].credits,
          note: note,
          timestamp: new Date().toISOString()
      });
      db.set('creditHistory', history);
  }),

  // --- BOOKING ---
  createOneTimeBooking: async (menteeId: string, mentorId: string, startTime: string, duration: number, cost: number, useSubscription: boolean = false): Promise<Booking> => {
      return apiCall(async () => {
          const users = db.get<User[]>('users', INITIAL_USERS);
          const mentee = users.find(u => u.id === menteeId);
          if (!mentee) throw new Error("Mentee not found");
          if (!useSubscription && mentee.credits < cost) throw new Error("Số dư Credits không đủ.");

          const bookingId = `b_${Date.now()}`;
          if (!useSubscription) {
              creditPendingEngine.holdCreditOnBooking(bookingId, menteeId, cost);
          }

          const mentor = db.get<Mentor[]>('mentors', INITIAL_MENTORS).find(m => m.id === mentorId);
          const newBooking: Booking = { 
              id: bookingId, menteeId, mentorId, 
              mentorName: mentor?.name || 'Mentor', 
              menteeName: mentee.name, 
              startTime, endTime: new Date(new Date(startTime).getTime() + 60 * 60000).toISOString(), 
              status: BookingStatus.SCHEDULED, creditStatus: 'pending', 
              type: useSubscription ? 'subscription' : 'credit', 
              totalCost: cost, joinLink: 'https://meet.google.com/demo-call' 
          };

          const bookings = db.get<Booking[]>('bookings', INITIAL_BOOKINGS);
          bookings.push(newBooking);
          db.set('bookings', bookings);

          triggerNotification({
              userId: mentorId, role: UserRole.MENTOR, type: 'info', title: 'Lịch học mới!',
              message: `${mentee.name} đã đặt một buổi học vào ${new Date(startTime).toLocaleString()}`,
              actionType: 'booking', actionId: bookingId
          });

          return newBooking;
      });
  },

  getBookingById: async (id: string) => apiCall(() => db.get<Booking[]>('bookings', INITIAL_BOOKINGS).find(b => b.id === id)),

  updateBookingStatus: async (id: string, status: BookingStatus) => apiCall(() => {
      const bookings = db.get<Booking[]>('bookings', INITIAL_BOOKINGS);
      const idx = bookings.findIndex(b => b.id === id);
      if (idx === -1) return;
      
      const booking = bookings[idx];
      if (status === BookingStatus.COMPLETED && booking.status === BookingStatus.SCHEDULED) {
          creditPendingEngine.releaseCreditToMentor(id);
      } else if (status === BookingStatus.CANCELLED && booking.status === BookingStatus.SCHEDULED) {
          creditPendingEngine.refundCreditToMentee(id);
      }

      booking.status = status;
      db.set('bookings', bookings);
  }),

  cancelBooking: async (id: string) => api.updateBookingStatus(id, BookingStatus.CANCELLED),

  rescheduleBooking: async (id: string, newTime: string) => apiCall(() => {
      const bookings = db.get<Booking[]>('bookings', INITIAL_BOOKINGS);
      const idx = bookings.findIndex(b => b.id === id);
      if (idx === -1) throw new Error("Booking not found");
      bookings[idx].startTime = newTime;
      bookings[idx].endTime = new Date(new Date(newTime).getTime() + 60 * 60000).toISOString();
      bookings[idx].status = BookingStatus.RESCHEDULED;
      db.set('bookings', bookings);
  }),

  submitReview: async (id: string, rating: number, review: string) => apiCall(() => {
      const bookings = db.get<Booking[]>('bookings', INITIAL_BOOKINGS);
      const idx = bookings.findIndex(b => b.id === id);
      if (idx !== -1) {
          bookings[idx].rating = rating;
          bookings[idx].review = review;
          db.set('bookings', bookings);
      }
  }),

  reportDispute: async (id: string, reason: string, evidence: string) => apiCall(() => {
      const bookings = db.get<Booking[]>('bookings', INITIAL_BOOKINGS);
      const idx = bookings.findIndex(b => b.id === id);
      if (idx === -1) throw new Error("Booking not found");
      bookings[idx].status = BookingStatus.DISPUTED;
      bookings[idx].disputeReason = reason;
      bookings[idx].disputeEvidence = evidence;
      bookings[idx].disputeDate = new Date().toISOString();
      db.set('bookings', bookings);
  }),

  resolveDispute: async (id: string, outcome: 'REFUND_MENTEE' | 'DISMISS', note: string) => apiCall(() => {
      const bookings = db.get<Booking[]>('bookings', INITIAL_BOOKINGS);
      const idx = bookings.findIndex(b => b.id === id);
      if (idx === -1) throw new Error("Booking not found");
      
      if (outcome === 'REFUND_MENTEE') {
          creditPendingEngine.refundCreditToMentee(id);
          bookings[idx].status = BookingStatus.REFUNDED;
      } else {
          bookings[idx].status = BookingStatus.COMPLETED;
      }
      bookings[idx].resolutionNote = note;
      bookings[idx].resolvedAt = new Date().toISOString();
      db.set('bookings', bookings);
  }),

  // --- HOMEWORK ---
  getHomework: async (userId: string, role: UserRole) => apiCall(() => 
    db.get<Homework[]>('homework', INITIAL_HOMEWORK).filter(h => role === UserRole.MENTEE ? h.menteeId === userId : h.mentorId === userId)
  ),

  getAllHomework: async () => apiCall(() => db.get<Homework[]>('homework', INITIAL_HOMEWORK)),

  updateHomework: async (id: string, updates: Partial<Homework>) => apiCall(() => {
      const homeworks = db.get<Homework[]>('homework', INITIAL_HOMEWORK);
      const idx = homeworks.findIndex(h => h.id === id);
      if (idx !== -1) {
          homeworks[idx] = { ...homeworks[idx], ...updates };
          db.set('homework', homeworks);
      }
  }),

  // --- MENTOR EARNINGS ---
  getMentorBalanceDetails: async (id: string) => apiCall(() => mentorPayoutEngine.getMentorBalanceDetails(id)),

  // --- PAYOUTS ---
  getPayouts: async (userId: string) => apiCall(() => db.get<Payout[]>('payouts', INITIAL_PAYOUTS).filter(p => p.mentorId === userId)),
  getAllPayouts: async () => apiCall(() => db.get<Payout[]>('payouts', INITIAL_PAYOUTS)),
  getPayoutById: async (id: string) => apiCall(() => db.get<Payout[]>('payouts', INITIAL_PAYOUTS).find(p => p.id === id)),
  
  requestPayout: async (mentorId: string, amount: number, method: string) => apiCall(() => mentorPayoutEngine.requestPayout(mentorId, amount, method)),
  
  approvePayout: async (id: string, method: string, note: string) => apiCall(() => mentorPayoutEngine.approvePayout(id, 'u3', note)),
  
  rejectPayout: async (id: string, reason: string, note: string) => apiCall(() => mentorPayoutEngine.rejectPayout(id, 'u3', reason)),

  // --- TRANSACTIONS & PAYMENTS ---
  getAllTransactions: async () => apiCall(() => db.get<Transaction[]>('transactions', INITIAL_TRANSACTIONS)),
  getTransactionById: async (id: string) => apiCall(() => db.get<Transaction[]>('transactions', INITIAL_TRANSACTIONS).find(t => t.id === id)),
  
  createMockTransaction: async (data: any) => apiCall(() => {
      const txs = db.get<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
      const newTx = { ...data, id: `tx_${Date.now()}` };
      txs.push(newTx);
      db.set('transactions', txs);
      return newTx;
  }),

  completePayment: async (txId: string, evidence: string, note: string) => apiCall(() => {
      const txs = db.get<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
      const txIdx = txs.findIndex(t => t.id === txId);
      if (txIdx === -1) throw new Error("Transaction not found");
      
      txs[txIdx].status = 'success';
      txs[txIdx].evidenceFile = evidence;
      txs[txIdx].reason = note;
      db.set('transactions', txs);

      if (txs[txIdx].payoutId) {
          mentorPayoutEngine.markPayoutPaid(txs[txIdx].payoutId!, 'u3', evidence);
      }
  }),

  failPayment: async (txId: string, reason: string) => apiCall(() => {
      const txs = db.get<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
      const txIdx = txs.findIndex(t => t.id === txId);
      if (txIdx !== -1) {
          txs[txIdx].status = 'failed';
          txs[txIdx].reason = reason;
          db.set('transactions', txs);
      }
  }),

  // --- PROVIDERS ---
  getProviders: async () => apiCall(() => db.get<Provider[]>('providers', INITIAL_PROVIDERS)),
  getProviderProfile: async (id: string) => apiCall(() => db.get<Provider[]>('providers', INITIAL_PROVIDERS).find(p => p.id === id)),
  getReferrals: async (pid: string) => apiCall(() => db.get<Referral[]>('referrals', INITIAL_REFERRALS).filter(r => r.providerId === pid)),
  getProviderCommissions: async (pid: string) => apiCall(() => db.get<ProviderCommission[]>('providerCommissions', INITIAL_COMMISSIONS).filter(c => c.providerId === pid)),
  getProviderLevels: async () => apiCall(() => db.get<ProviderLevel[]>('providerLevels', INITIAL_PROVIDER_LEVELS)),
  
  updateProviderProfile: async (id: string, data: any) => api.updateUserProfile(id, data),
  
  updateProviderLevel: async (id: string, data: any) => apiCall(() => {
      const lvls = db.get<ProviderLevel[]>('providerLevels', INITIAL_PROVIDER_LEVELS);
      const idx = lvls.findIndex(l => l.id === id);
      if (idx !== -1) { lvls[idx] = { ...lvls[idx], ...data }; db.set('providerLevels', lvls); }
  }),
  addProviderLevel: async (data: any) => apiCall(() => {
      const lvls = db.get<ProviderLevel[]>('providerLevels', INITIAL_PROVIDER_LEVELS);
      lvls.push(data); db.set('providerLevels', lvls);
  }),
  deleteProviderLevel: async (id: string) => apiCall(() => {
      const lvls = db.get<ProviderLevel[]>('providerLevels', INITIAL_PROVIDER_LEVELS);
      db.set('providerLevels', lvls.filter(l => l.id !== id));
  }),

  // --- SUBSCRIPTIONS ---
  getSubscriptionPlans: async () => apiCall(() => db.get<SubscriptionPlan[]>('subscriptionPlans', SUBSCRIPTION_PLANS)),
  createSubscription: async (userId: string, planId: string, mentorId: string, slots: any[]) => apiCall(() => {
      const plans = db.get<SubscriptionPlan[]>('subscriptionPlans', SUBSCRIPTION_PLANS);
      const plan = plans.find(p => p.id === planId);
      if (!plan) throw new Error("Plan not found");
      
      const subs = db.get<Subscription[]>('subscriptions', []);
      const mentor = db.get<Mentor[]>('mentors', INITIAL_MENTORS).find(m => m.id === mentorId);

      const newSub: Subscription = {
          id: `sub_${Date.now()}`,
          planId,
          planName: plan.name,
          menteeId: userId,
          mentorId,
          mentorName: mentor?.name || 'Mentor',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + plan.durationWeeks * 7 * 86400000).toISOString(),
          totalSessions: plan.sessions,
          remainingSessions: plan.sessions,
          cancelQuota: plan.allowedCancel,
          rescheduleQuota: plan.allowedReschedule,
          status: 'ACTIVE',
          bookings: []
      };
      subs.push(newSub);
      db.set('subscriptions', subs);
      return newSub;
  }),

  resetSubscriptionQuota: async (id: string) => apiCall(() => {
      const subs = db.get<Subscription[]>('subscriptions', []);
      const sIdx = subs.findIndex(s => s.id === id);
      if (sIdx !== -1) {
          const plan = SUBSCRIPTION_PLANS.find(p => p.id === subs[sIdx].planId);
          if (plan) {
              subs[sIdx].cancelQuota = plan.allowedCancel;
              subs[sIdx].rescheduleQuota = plan.allowedReschedule;
              db.set('subscriptions', subs);
          }
      }
  }),

  forceRenewSubscription: async (id: string) => apiCall(() => {
      const subs = db.get<Subscription[]>('subscriptions', []);
      const sIdx = subs.findIndex(s => s.id === id);
      if (sIdx !== -1) {
          const s = subs[sIdx];
          const plan = SUBSCRIPTION_PLANS.find(p => p.id === s.planId);
          if (plan) {
              s.endDate = new Date(new Date(s.endDate).getTime() + plan.durationWeeks * 7 * 86400000).toISOString();
              s.remainingSessions = plan.sessions;
              s.cancelQuota = plan.allowedCancel;
              s.rescheduleQuota = plan.allowedReschedule;
              db.set('subscriptions', subs);
          }
      }
  }),

  changeSubscriptionPlan: async (id: string, planId: string) => apiCall(() => {
      const subs = db.get<Subscription[]>('subscriptions', []);
      const sIdx = subs.findIndex(s => s.id === id);
      if (sIdx !== -1) {
          const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
          if (!plan) throw new Error("Plan not found");
          subs[sIdx].planId = planId;
          subs[sIdx].planName = plan.name;
          db.set('subscriptions', subs);
      }
  }),

  updateSubscriptionPlan: async (id: string, data: any) => apiCall(() => {
      const plans = db.get<SubscriptionPlan[]>('subscriptionPlans', SUBSCRIPTION_PLANS);
      const idx = plans.findIndex(p => p.id === id);
      if (idx !== -1) { plans[idx] = { ...plans[idx], ...data }; db.set('subscriptionPlans', plans); }
  }),
  addSubscriptionPlan: async (data: any) => apiCall(() => {
      const plans = db.get<SubscriptionPlan[]>('subscriptionPlans', SUBSCRIPTION_PLANS);
      plans.push(data); db.set('subscriptionPlans', plans);
  }),
  deleteSubscriptionPlan: async (id: string) => apiCall(() => {
      const plans = db.get<SubscriptionPlan[]>('subscriptionPlans', SUBSCRIPTION_PLANS);
      db.set('subscriptionPlans', plans.filter(p => p.id !== id));
  }),

  getMentorSubscriptions: async (mid: string) => apiCall(() => db.get<Subscription[]>('subscriptions', []).filter(s => s.mentorId === mid)),

  getUserSubscriptions: async (uid: string) => apiCall(() => db.get<Subscription[]>('subscriptions', []).filter(s => s.menteeId === uid)),

  // --- USER MGMT & CONFIG ---
  getUserById: async (id: string) => apiCall(() => db.get<User[]>('users', INITIAL_USERS).find(u => u.id === id)),
  
  deleteUser: async (id: string) => apiCall(() => {
      const users = db.get<User[]>('users', INITIAL_USERS);
      db.set('users', users.filter(u => u.id !== id));
      
      const mentors = db.get<Mentor[]>('mentors', INITIAL_MENTORS);
      setStore('mentors', mentors.filter(m => m.id !== id));
      
      const providers = db.get<Provider[]>('providers', INITIAL_PROVIDERS);
      setStore('providers', providers.filter(p => p.id !== id));
  }),

  updateUserStatus: async (id: string, status: any) => apiCall(() => {
      const users = db.get<User[]>('users', INITIAL_USERS);
      const idx = users.findIndex(u => u.id === id);
      if (idx !== -1) { 
          users[idx].status = status; 
          db.set('users', users); 

          // Logic sửa lỗi: Đồng bộ Status sang bảng Mentors/Providers
          if (users[idx].role === UserRole.MENTOR) {
              const mentors = db.get<Mentor[]>('mentors', INITIAL_MENTORS);
              const mIdx = mentors.findIndex(m => m.id === id);
              if (mIdx !== -1) {
                  mentors[mIdx].status = status;
                  setStore('mentors', mentors);
              }
          }
          if (users[idx].role === UserRole.PROVIDER) {
              const providers = db.get<Provider[]>('providers', INITIAL_PROVIDERS);
              const pIdx = providers.findIndex(p => p.id === id);
              if (pIdx !== -1) {
                  providers[pIdx].status = status;
                  setStore('providers', providers);
              }
          }
      }
  }),

  updateUser: async (id: string, data: any) => apiCall(() => {
      const users = db.get<User[]>('users', INITIAL_USERS);
      const idx = users.findIndex(u => u.id === id);
      if (idx !== -1) { 
          // Nếu thay đổi quốc gia nhưng không truyền timezone, tự động đồng bộ timezone mới
          if (data.country && !data.timezone) {
              data.timezone = getTimezoneByCountry(data.country);
          }

          // Merge data into User table
          users[idx] = { ...users[idx], ...data }; 
          db.set('users', users); 

          const updatedUser = users[idx];

          // Logic sửa lỗi: Đồng bộ toàn bộ dữ liệu User sang bảng Mentors/Providers
          if (updatedUser.role === UserRole.MENTOR) {
              const mentors = db.get<Mentor[]>('mentors', INITIAL_MENTORS);
              const mIdx = mentors.findIndex(m => m.id === id);
              if (mIdx !== -1) {
                  mentors[mIdx] = { 
                      ...mentors[mIdx], 
                      ...updatedUser,
                      ...data 
                  };
                  setStore('mentors', mentors);
              }
          }

          if (updatedUser.role === UserRole.PROVIDER) {
              const providers = db.get<Provider[]>('providers', INITIAL_PROVIDERS);
              const pIdx = providers.findIndex(p => p.id === id);
              if (pIdx !== -1) {
                  providers[pIdx] = { 
                      ...providers[pIdx], 
                      ...updatedUser,
                      ...data
                  };
                  setStore('providers', providers);
              }
          }
      }
  }),

  updateUserProfile: async (id: string, data: any) => api.updateUser(id, data),
  updateUserConfig: async (id: string, data: any) => api.updateUser(id, data),

  createUser: async (data: any) => api.register(data),

  resetPassword: async (userId: string, pass: string) => apiCall(() => {
      const users = db.get<User[]>('users', INITIAL_USERS);
      const idx = users.findIndex(u => u.id === userId);
      if (idx !== -1) { users[idx].password = pass; db.set('users', users); }
  }),

  // --- ANALYTICS ---
  getSystemFinancialHealth: async () => apiCall(() => mentorPayoutEngine.getSystemFinancialHealth()),
  
  getWeeklyRevenue: async (): Promise<WeeklyRevenueResponse> => apiCall(() => {
      const txs = db.get<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
      const days = [];
      let totalTopup = 0, totalPayout = 0;
      for (let i = 6; i >= 0; i--) {
          const d = new Date(); d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const dTx = txs.filter(t => t.date.startsWith(dateStr));
          const topup = dTx.filter(t => t.type === 'TOPUP').reduce((a,b) => a + b.amount, 0);
          const payout = dTx.filter(t => (t.type === 'PAYOUT' || t.type === 'mentor_payout' || t.type === 'provider_payout') && (t.status === 'COMPLETED' || t.status === 'success')).reduce((a,b) => a + Math.abs(b.amount), 0);
          days.push({ date: dateStr, topupVolume: topup, payoutVolume: payout });
          totalTopup += topup; totalPayout += payout;
      }
      return { week: "Current Week", days, totalTopup, totalPayout, net: totalTopup - totalPayout };
  }),

  getMonthlyRevenue: async (year: number, month: number): Promise<MonthlyRevenueResponse> => apiCall(() => {
      const txs = db.get<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
      const days = [];
      let totalTopup = 0, totalPayout = 0;
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
          const dateStr = `${year}-${month.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
          const dTx = txs.filter(t => t.date.startsWith(dateStr));
          const topup = dTx.filter(t => t.type === 'TOPUP').reduce((a,b) => a + b.amount, 0);
          const payout = dTx.filter(t => (t.type === 'PAYOUT' || t.type === 'mentor_payout' || t.type === 'provider_payout') && (t.status === 'COMPLETED' || t.status === 'success')).reduce((a,b) => a + Math.abs(b.amount), 0);
          days.push({ date: dateStr, topupVolume: topup, payoutVolume: payout });
          totalTopup += topup; totalPayout += payout;
      }
      return { month: `${year}-${month}`, days, totalTopup, totalPayout, net: totalTopup - totalPayout };
  }),

  getAdminCreditStats: async () => apiCall(() => {
      const ledger = db.get<SystemCreditLedgerEntry[]>('systemCreditLedger', INITIAL_SYSTEM_CREDIT_LEDGER);
      return {
          summary: {
              holding: ledger.filter(l => l.status === 'holding').reduce((a,b) => a + b.amount, 0),
              released: ledger.filter(l => l.status === 'released').reduce((a,b) => a + b.amount, 0),
              refunded: ledger.filter(l => l.status === 'returned').reduce((a,b) => a + b.amount, 0),
              pendingBookings: ledger.filter(l => l.status === 'holding').length
          },
          records: ledger
      };
  }),

  getAdminCACStats: async () => apiCall(() => {
      const txs = db.get<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
      const comms = db.get<ProviderCommission[]>('providerCommissions', INITIAL_COMMISSIONS);
      const providers = db.get<Provider[]>('providers', INITIAL_PROVIDERS);
      const levels = db.get<ProviderLevel[]>('providerLevels', INITIAL_PROVIDER_LEVELS);
      const revenue = txs.filter(t => t.type === 'TOPUP').reduce((a,b) => a + b.amount, 0);
      const cac = comms.reduce((a,b) => a + b.commissionAmountUsd, 0);
      
      const byProvider = providers.map(p => {
          const pc = comms.filter(c => c.providerId === p.id);
          const rev = pc.reduce((a,b) => a + b.topupAmountUsd, 0);
          const cost = pc.reduce((a,b) => a + b.commissionAmountUsd, 0);
          return { providerId: p.id, providerName: p.name, levelId: p.levelId, revenueGenerated: rev, commissionCost: cost, cacRatio: rev > 0 ? cost / rev : 0 };
      });

      const byLevel = levels.map(l => {
          const lp = providers.filter(p => p.levelId === l.id);
          const lc = comms.filter(c => lp.some(p => p.id === c.providerId));
          const rev = lc.reduce((a,b) => a + b.topupAmountUsd, 0);
          const cost = lc.reduce((a,b) => a + b.commissionAmountUsd, 0);
          return { levelId: l.id, providerCount: lp.length, totalRevenue: rev, totalCAC: cost, cacRatio: rev > 0 ? cost / rev : 0 };
      });

      return { summary: { revenue, cac, cacRatio: revenue > 0 ? cac / revenue : 0, grossProfit: revenue - cac }, byProvider, byLevel, timeSeries: [] };
  }),

  // --- PRICING BATCH ---
  batchSavePricing: async (base: number, ratio: number, countries: any[], groups: any[]) => apiCall(() => {
      db.set('settings', { baseLessonCreditPrice: base, topupConversionRatio: ratio });
      setStore('pricingCountries', countries);
      setStore('pricingGroups', groups);
  }),

  updatePricingCountry: async (id: string, data: any) => apiCall(() => {
      const c = db.get<PricingCountry[]>('pricingCountries', INITIAL_PRICING_COUNTRIES);
      const idx = c.findIndex(x => x.id === id);
      if (idx !== -1) { c[idx] = data; setStore('pricingCountries', c); }
  }),
  addPricingCountry: async (data: any) => apiCall(() => {
      const c = db.get<PricingCountry[]>('pricingCountries', INITIAL_PRICING_COUNTRIES);
      c.push(data); setStore('pricingCountries', c);
  }),
  deletePricingCountry: async (id: string) => apiCall(() => {
      const c = db.get<PricingCountry[]>('pricingCountries', INITIAL_PRICING_COUNTRIES);
      setStore('pricingCountries', c.filter(x => x.id !== id));
  }),

  updatePricingGroup: async (id: string, data: any) => apiCall(() => {
      const g = db.get<PricingGroup[]>('pricingGroups', INITIAL_PRICING_GROUPS);
      const idx = g.findIndex(x => x.id === id);
      if (idx !== -1) { g[idx] = data; setStore('pricingGroups', g); }
  }),
  addPricingGroup: async (data: any) => apiCall(() => {
      const g = db.get<PricingGroup[]>('pricingGroups', INITIAL_PRICING_GROUPS);
      g.push(data); setStore('pricingGroups', g);
  }),
  deletePricingGroup: async (id: string) => apiCall(() => {
      const g = db.get<PricingGroup[]>('pricingGroups', INITIAL_PRICING_GROUPS);
      setStore('pricingGroups', g.filter(x => x.id !== id));
  }),

  // --- UTILS ---
  getUsers: async () => apiCall(() => db.get('users', INITIAL_USERS)),
  getMentors: async () => apiCall(() => db.get('mentors', INITIAL_MENTORS)),
  getMentorById: async (id: string) => apiCall(() => db.get<Mentor[]>('mentors', INITIAL_MENTORS).find(m => m.id === id)),
  
  getBookings: async (userId: string, role: UserRole) => apiCall(() => {
      const all = db.get<Booking[]>('bookings', INITIAL_BOOKINGS);
      return all.filter(b => role === UserRole.MENTEE ? b.menteeId === userId : b.mentorId === userId);
  }),
  getAllBookings: async () => apiCall(() => db.get<Booking[]>('bookings', INITIAL_BOOKINGS)),
  getSystemSettings: async () => apiCall(() => db.get('settings', INITIAL_SETTINGS)),
  getPricingGroups: async () => apiCall(() => db.get('pricingGroups', INITIAL_PRICING_GROUPS)),
  getPricingCountries: async () => apiCall(() => db.get('pricingCountries', INITIAL_PRICING_COUNTRIES)),
  getMentorLocalizedRate: async (mentorId: string, menteeCountry: string) => apiCall(() => pricingRevenueEngine.calculatePrice(mentorId, menteeCountry)),
  calculatePriceDetail: async (mid: string, cid: string) => apiCall(() => {
      const finalPrice = pricingRevenueEngine.calculatePrice(mid, cid);
      const sys = db.get<SystemSettings>('settings', INITIAL_SETTINGS);
      return { basePrice: sys.baseLessonCreditPrice, countryMultiplier: 1, groupMultiplier: 1, finalPrice };
  }),
  uploadFile: async (file: File) => apiCall(() => `mock_url_${file.name}`),
  
  // --- CHAT SYSTEM ---
  getConversations: async (userId: string, role: UserRole) => apiCall(() => {
      const msgs = db.get<Message[]>('messages', INITIAL_MESSAGES);
      const users = db.get<User[]>('users', INITIAL_USERS);
      const convs = db.get<Conversation[]>('conversations', INITIAL_CONVERSATIONS);
      
      if (role === UserRole.ADMIN) {
          // Lấy danh sách ID người dùng có tin nhắn (không bao gồm các Admin khác nếu có)
          const participantIds = Array.from(new Set([
              ...msgs.map(m => m.fromRole === UserRole.ADMIN ? m.toId : m.fromId),
              ...convs.map(c => c.participantId)
          ])).filter((id): id is string => id !== null && id !== 'admin');

          const dynamicConvs: Conversation[] = participantIds.map(uid => {
              const user = users.find(u => u.id === uid);
              const existingConv = convs.find(c => c.participantId === uid);
              const userMessages = msgs.filter(m => m.fromId === uid || m.toId === uid);
              const lastMsg = userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;
              
              return {
                  id: existingConv?.id || `conv_${uid}`,
                  participantId: uid,
                  participantName: user?.name || 'Unknown User',
                  participantAvatar: user?.avatar || '',
                  participantRole: user?.role || UserRole.MENTEE,
                  assignedAdminId: existingConv?.assignedAdminId || null,
                  status: (existingConv?.status as any) || 'OPEN',
                  lastMessageAt: lastMsg?.createdAt || existingConv?.lastMessageAt || new Date().toISOString(),
                  lastMessagePreview: lastMsg?.content || existingConv?.lastMessagePreview || 'No messages yet',
                  unreadCount: userMessages.filter(m => m.fromRole !== UserRole.ADMIN && !m.read).length
              };
          });

          return dynamicConvs;
      } else {
          // Mentee/Mentor/Provider see exactly one conversation with Admin
          const userMessages = msgs.filter(m => m.fromId === userId || m.toId === userId);
          const lastMsg = userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;
          
          return [{
              id: `conv_${userId}`,
              participantId: userId,
              participantName: "Admin Support",
              participantAvatar: "",
              participantRole: UserRole.ADMIN,
              assignedAdminId: null,
              status: 'OPEN',
              lastMessageAt: lastMsg?.createdAt || new Date().toISOString(),
              lastMessagePreview: lastMsg?.content || 'How can we help you?',
              unreadCount: userMessages.filter(m => m.fromRole === UserRole.ADMIN && !m.read).length
          } as Conversation];
      }
  }),

  getMessages: async (id: string) => apiCall(() => {
      const msgs = db.get<Message[]>('messages', INITIAL_MESSAGES);
      const convId = id.startsWith('conv_') ? id : `conv_${id}`;
      return msgs.filter(m => m.conversationId === convId);
  }),

  sendMessage: async (data: any) => apiCall(() => {
      const msgs = db.get<Message[]>('messages', INITIAL_MESSAGES);
      const convs = db.get<Conversation[]>('conversations', INITIAL_CONVERSATIONS);
      
      const newMsg: Message = { 
          ...data, 
          id: `msg_${Date.now()}`, 
          createdAt: new Date().toISOString(), 
          read: false 
      };
      msgs.push(newMsg);
      setStore('messages', msgs);

      // Auto-assign admin if they are the sender and it's unassigned
      if (data.fromRole === UserRole.ADMIN) {
          const cIdx = convs.findIndex(c => c.id === data.conversationId);
          if (cIdx !== -1) {
              if (!convs[cIdx].assignedAdminId) {
                  convs[cIdx].assignedAdminId = data.fromId;
              }
              convs[cIdx].lastMessageAt = newMsg.createdAt;
              convs[cIdx].lastMessagePreview = newMsg.content;
              setStore('conversations', convs);
          } else {
              // Create dynamic conv record if doesn't exist
              const uid = data.toId || data.conversationId.replace('conv_', '');
              const users = db.get<User[]>('users', INITIAL_USERS);
              const user = users.find(u => u.id === uid);
              convs.push({
                  id: data.conversationId,
                  participantId: uid,
                  participantName: user?.name || 'User',
                  participantAvatar: user?.avatar || '',
                  participantRole: user?.role || UserRole.MENTEE,
                  assignedAdminId: data.fromId,
                  status: 'OPEN',
                  lastMessageAt: newMsg.createdAt,
                  lastMessagePreview: newMsg.content,
                  unreadCount: 0
              });
              setStore('conversations', convs);
          }
      }

      return newMsg;
  }),

  assignConversation: async (id: string, adminId: string) => apiCall(() => {
      const convs = db.get<Conversation[]>('conversations', INITIAL_CONVERSATIONS);
      const idx = convs.findIndex(c => c.id === id);
      if (idx !== -1) { 
          convs[idx].assignedAdminId = adminId; 
          setStore('conversations', convs); 
      } else {
          const uid = id.replace('conv_', '');
          const users = db.get<User[]>('users', INITIAL_USERS);
          const user = users.find(u => u.id === uid);
          convs.push({
              id: id,
              participantId: uid,
              participantName: user?.name || 'User',
              participantAvatar: user?.avatar || '',
              participantRole: user?.role || UserRole.MENTEE,
              assignedAdminId: adminId,
              status: 'OPEN',
              lastMessageAt: new Date().toISOString(),
              lastMessagePreview: '',
              unreadCount: 0
          });
          setStore('conversations', convs);
      }
  }),

  markAsRead: async (convId: string, role: string) => apiCall(() => {
    const msgs = db.get<Message[]>('messages', INITIAL_MESSAGES);
    msgs.filter(m => m.conversationId === convId && (role === UserRole.ADMIN ? m.fromRole !== UserRole.ADMIN : m.fromRole === UserRole.ADMIN)).forEach(m => m.read = true);
    setStore('messages', msgs);
  }),

  getUnreadCount: async (userId: string, role: UserRole) => apiCall(() => {
      const msgs = db.get<Message[]>('messages', INITIAL_MESSAGES);
      if (role === UserRole.ADMIN) {
          return msgs.filter(m => m.fromRole !== UserRole.ADMIN && !m.read).length;
      } else {
          const convId = `conv_${userId}`;
          return msgs.filter(m => m.conversationId === convId && m.fromRole === UserRole.ADMIN && !m.read).length;
      }
  }),

  getActiveSubscription: async (userId: string) => apiCall(() => db.get<Subscription[]>('subscriptions', []).find(s => s.menteeId === userId && s.status === 'ACTIVE') || null),
  getNotifications: async (userId: string, role: string) => apiCall(() => db.get<Notification[]>('notifications', INITIAL_NOTIFICATIONS).filter(n => n.userId === userId)),
  getUnreadNotificationCount: async (userId: string, role: string) => apiCall(() => db.get<Notification[]>('notifications', INITIAL_NOTIFICATIONS).filter(n => n.userId === userId && !n.read).length),
  markNotificationRead: async (id: string) => apiCall(() => {
    const ns = db.get<Notification[]>('notifications', INITIAL_NOTIFICATIONS);
    const n = ns.find(x => x.id === id);
    if (n) n.read = true;
    setStore('notifications', ns);
  }),
  getLogs: async (filter: any) => apiCall(() => {
      let logs = db.get<SystemLog[]>('logs', INITIAL_LOGS);
      if (filter.src && filter.src !== 'ALL') logs = logs.filter(l => l.src === filter.src);
      if (filter.lvl && filter.lvl !== 'ALL') logs = logs.filter(l => l.lvl === filter.lvl);
      return logs;
  }),
  logAction: async (type: string, msg: string, src: string) => apiCall(() => {
      const logs = db.get<SystemLog[]>('logs', INITIAL_LOGS);
      logs.unshift({ ts: Date.now(), lvl: 'info', src: (src as any) || 'system', msg: `${type}: ${msg}` });
      setStore('logs', logs);
  })
};

function setStore(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
}
