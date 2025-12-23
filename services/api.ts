
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

import { creditPendingServiceV2 } from './v2/creditPendingServiceV2';
import { mentorPayoutServiceV2 } from './v2/mentorPayoutServiceV2';
import { providerCommissionServiceV2 } from './v2/providerCommissionServiceV2';
import { pricingRevenueServiceV2 } from './v2/pricingRevenueServiceV2';
import { notificationService } from './v2/notificationService';
import { getTimezoneByCountry, validateTimezone } from '../lib/timeUtils';
import { security } from '../utils/security';

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
// ⚠️ DEPRECATED: Use notificationService instead for i18n support
const triggerNotification = (notif: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    console.warn('⚠️ triggerNotification is deprecated. Use notificationService for i18n support.');
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
    return apiCall(async () => {
        // ✅ FIX BUG #9: Add rate limiting
        try {
            security.checkLoginRateLimit(email);
        } catch (e: any) {
            throw new Error(e.message);
        }

        const users = db.get<User[]>('users', INITIAL_USERS);
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) throw new Error("Email không tồn tại.");

        // ✅ FIX BUG #9: Verify password hash instead of plaintext comparison
        if (password && user.password) {
            // Support both hashed and legacy plaintext passwords
            const isValid = user.password.startsWith('sha256:')
                ? await security.verifyPassword(password, user.password)
                : user.password === password; // Legacy plaintext fallback

            if (!isValid) {
                throw new Error("Mật khẩu không khớp.");
            }
        }

        // ✅ Check user status before allowing login
        if (user.status === 'PENDING_APPROVAL') {
            throw new Error("Tài khoản của bạn đang chờ admin phê duyệt. Vui lòng kiểm tra email để biết thêm chi tiết.");
        }
        if (user.status === 'REJECTED') {
            throw new Error(`Tài khoản của bạn đã bị từ chối. Lý do: ${user.rejectionReason || 'Không rõ'}. Bạn có thể đăng ký lại.`);
        }
        if (user.status === 'BANNED') {
            throw new Error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin.");
        }

        // ✅ Reset rate limit on successful login
        security.resetLoginRateLimit(email);

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
    return apiCall(async () => {
        const users = db.get<User[]>('users', INITIAL_USERS);

        // ✅ Allow re-registration if previous account was REJECTED
        const existingUser = users.find(u => u.email === data.email);
        if (existingUser && existingUser.status !== 'REJECTED') {
            throw new Error("Email đã tồn tại.");
        }

        const country = data.country || 'VN';
        const timezone = getTimezoneByCountry(country);

        // ✅ FIX BUG #9: Hash password before storing
        const hashedPassword = await security.hashPassword(data.password);

        // ✅ Set status based on role: MENTEE = ACTIVE, MENTOR/PROVIDER = PENDING_APPROVAL
        const status: 'ACTIVE' | 'PENDING_APPROVAL' =
            data.role === UserRole.MENTEE ? 'ACTIVE' : 'PENDING_APPROVAL';

        let newUser: User;

        // ✅ Re-apply logic: Update existing REJECTED user instead of creating new one
        if (existingUser && existingUser.status === 'REJECTED') {
            const userIdx = users.findIndex(u => u.email === data.email);
            users[userIdx] = {
                ...existingUser,
                name: data.name,
                password: hashedPassword,
                role: data.role,
                status: status,
                rejectionReason: undefined, // Clear old rejection reason
                appliedAt: status === 'PENDING_APPROVAL' ? new Date().toISOString() : undefined,
                country: country,
                timezone: timezone
            };
            newUser = users[userIdx];
            db.set('users', users);
        } else {
            // New registration
            newUser = {
                id: `u_${Date.now()}`,
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: data.role,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`,
                credits: 0,
                balance: 0,
                status: status,
                joinedAt: new Date().toISOString(),
                country: country,
                timezone: timezone,
                appliedAt: status === 'PENDING_APPROVAL' ? new Date().toISOString() : undefined
            };
            users.push(newUser);
            db.set('users', users);
        }

        // ✅ Send email notification to admin for MENTOR/PROVIDER registration
        if (data.role === UserRole.MENTOR || data.role === UserRole.PROVIDER) {
            console.log(`📧 [EMAIL NOTIFICATION] New ${data.role} application received`);
            console.log(`   To: admin@englishplatform.com`);
            console.log(`   Subject: New ${data.role} Registration - Pending Approval`);
            console.log(`   Body: ${data.name} (${data.email}) has registered as ${data.role}. Please review and approve.`);

            // Create admin notification
            triggerNotification({
                role: UserRole.ADMIN,
                userId: 'ALL',
                type: 'info',
                title: `New ${data.role} Application`,
                message: `${data.name} (${data.email}) has registered as ${data.role}. Pending approval.`,
                actionType: 'system',
                actionId: newUser.id
            });
        }

        if (data.role === UserRole.MENTOR) {
            const mentors = db.get<Mentor[]>('mentors', INITIAL_MENTORS);
            const existingMentorIdx = mentors.findIndex(m => m.id === newUser.id);

            if (existingMentorIdx !== -1) {
                // ✅ Update existing mentor (re-apply case)
                mentors[existingMentorIdx] = {
                    ...mentors[existingMentorIdx],
                    ...newUser,
                    // Preserve mentor-specific fields if they exist
                    bio: mentors[existingMentorIdx].bio || 'New mentor',
                    specialties: mentors[existingMentorIdx].specialties || [],
                    hourlyRate: mentors[existingMentorIdx].hourlyRate || 10,
                    rating: mentors[existingMentorIdx].rating || 5,
                    reviewCount: mentors[existingMentorIdx].reviewCount || 0,
                    experienceYears: mentors[existingMentorIdx].experienceYears || 0,
                    availability: mentors[existingMentorIdx].availability || []
                };
            } else {
                // ✅ Create new mentor entry
                mentors.push({
                    ...newUser,
                    bio: 'New mentor',
                    specialties: [],
                    hourlyRate: 10,
                    rating: 5,
                    reviewCount: 0,
                    experienceYears: 0,
                    availability: []
                });
            }
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
  buyCredits: async (userId: string, amount: number, method: string) => apiCall(async () => {
    const users = db.get<User[]>('users', INITIAL_USERS);
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error("User not found");

    // Get conversion ratio: $1 USD = X credits
    const settings = db.get<SystemSettings>('systemSettings', INITIAL_SETTINGS);
    const ratio = settings.topupConversionRatio || 0.8;
    const creditsToAdd = Number((amount * ratio).toFixed(2));

    users[idx].credits += creditsToAdd;
    db.set('users', users);

    const history = db.get<CreditHistoryEntry[]>('creditHistory', INITIAL_CREDIT_HISTORY);
    history.unshift({
        id: `ch_${Date.now()}`,
        userId,
        type: 'topup',
        amount: creditsToAdd,
        balanceAfter: users[idx].credits,
        note: `Nạp $${amount} USD = ${creditsToAdd} Credits qua ${method}`,
        timestamp: new Date().toISOString()
    });
    db.set('creditHistory', history);

    const txs = db.get<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
    txs.push({
        id: `tx_topup_${Date.now()}`,
        userId,
        amount: amount,
        type: 'TOPUP',
        description: `Credit Top-up: $${amount} USD = ${creditsToAdd} Credits via ${method}`,
        date: new Date().toISOString(),
        status: 'COMPLETED'
    });
    db.set('transactions', txs);

    // Use notificationService for i18n support
    await notificationService.notifyCreditChange(userId, UserRole.MENTEE, creditsToAdd, 'topup');
  }),

  // ✅ FIX BUG #19: Add authorization check - only user themselves or admins can view credit history
  getUserCreditHistory: async (userId: string, currentUserId?: string) => apiCall(() => {
      // Authorization: Only allow if requesting own history or is admin
      if (currentUserId && currentUserId !== userId) {
          const users = db.get<User[]>('users', INITIAL_USERS);
          const currentUser = users.find(u => u.id === currentUserId);
          if (!currentUser || currentUser.role !== UserRole.ADMIN) {
              throw new Error("Unauthorized: You can only view your own credit history");
          }
      }

      return db.get<CreditHistoryEntry[]>('creditHistory', INITIAL_CREDIT_HISTORY).filter(h => h.userId === userId);
  }),

  updateUserCredit: async (userId: string, type: 'add' | 'subtract' | 'set', amount: number, note: string) => apiCall(() => {
      const users = db.get<User[]>('users', INITIAL_USERS);
      const idx = users.findIndex(u => u.id === userId);
      if (idx === -1) throw new Error("User not found");

      // ✅ FIX BUG #6: Validate amount is not negative
      if (amount < 0) {
          throw new Error("Amount cannot be negative. Use appropriate operation type instead.");
      }

      // ✅ FIX BUG #6: Validate final balance won't be negative for subtract/set operations
      if (type === 'add') {
          users[idx].credits += amount;
      } else if (type === 'subtract') {
          if (users[idx].credits < amount) {
              throw new Error(`Cannot subtract ${amount} credits. User only has ${users[idx].credits} credits.`);
          }
          users[idx].credits -= amount;
      } else {
          // type === 'set'
          if (amount < 0) {
              throw new Error("Cannot set credits to negative value");
          }
          users[idx].credits = amount;
      }

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

          // ✅ FIX BUG #4: Check mentor availability before booking
          const mentors = db.get<Mentor[]>('mentors', INITIAL_MENTORS);
          const mentor = mentors.find(m => m.id === mentorId);
          if (!mentor) throw new Error("Mentor not found");

          // ✅ FIX BUG #26: Check mentor status is ACTIVE before allowing bookings
          if (mentor.status !== 'ACTIVE') {
              throw new Error(`Cannot book with this mentor. Mentor status: ${mentor.status}`);
          }

          const endTime = new Date(new Date(startTime).getTime() + 60 * 60000).toISOString();
          const bookingStart = new Date(startTime);
          const bookingEnd = new Date(endTime);

          // ✅ FIX BUG: Removed broken availability validation
          // UI already prevents bookings outside available slots via generateEvents()
          // The old logic was comparing Date objects incorrectly (slot.startTime is "14:00" string, not full date)
          // Keeping only double-booking check below which works correctly

          // Check for double booking
          const bookings = db.get<Booking[]>('bookings', INITIAL_BOOKINGS);
          const hasConflict = bookings.some(b =>
              b.mentorId === mentorId &&
              b.status === BookingStatus.SCHEDULED &&
              (
                  (bookingStart >= new Date(b.startTime) && bookingStart < new Date(b.endTime)) ||
                  (bookingEnd > new Date(b.startTime) && bookingEnd <= new Date(b.endTime)) ||
                  (bookingStart <= new Date(b.startTime) && bookingEnd >= new Date(b.endTime))
              )
          );

          if (hasConflict) {
              throw new Error("Mentor đã có booking khác tại thời điểm này. Vui lòng chọn thời gian khác.");
          }

          const bookingId = `b_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`; // ✅ Better unique ID

          // ✅ FIX BUG #5: Deduct subscription session quota if using subscription
          let subscriptionId: string | undefined = undefined; // ✅ FIX BUG #2: Track subscription ID
          if (useSubscription) {
              const subs = db.get<Subscription[]>('subscriptions', []);
              const activeSub = subs.find(s =>
                  s.menteeId === menteeId &&
                  s.mentorId === mentorId &&
                  s.status === 'ACTIVE' &&
                  s.remainingSessions > 0
              );

              if (!activeSub) {
                  throw new Error("Không tìm thấy subscription còn hạn. Vui lòng mua subscription hoặc dùng credits.");
              }

              // ✅ FIX BUG #2: Store subscription ID for tracking
              subscriptionId = activeSub.id;

              // Deduct session count
              activeSub.remainingSessions -= 1;
              if (!activeSub.bookings) activeSub.bookings = [];
              activeSub.bookings.push(bookingId);

              // Update subscription status if no sessions left
              if (activeSub.remainingSessions === 0) {
                  activeSub.status = 'EXPIRED';
              }

              db.set('subscriptions', subs);
          } else {
              // Hold credits for non-subscription booking
              await creditPendingServiceV2.holdCreditOnBooking(bookingId, menteeId, cost);
          }

          const newBooking: Booking = {
              id: bookingId, menteeId, mentorId,
              mentorName: mentor.name || 'Mentor',
              menteeName: mentee.name,
              startTime, endTime,
              status: BookingStatus.SCHEDULED,
              creditStatus: useSubscription ? 'released' : 'pending',
              type: useSubscription ? 'subscription' : 'credit',
              subscriptionId, // ✅ FIX BUG #2: Include subscription ID in booking
              totalCost: cost,
              joinLink: 'https://meet.google.com/demo-call'
          };

          bookings.push(newBooking);
          db.set('bookings', bookings);

          // Use notificationService for i18n support
          await notificationService.notifyNewBooking(mentorId, mentee.name, startTime, bookingId);

          return newBooking;
      });
  },

  // ✅ FIX BUG #19: Add authorization check - only booking participants or admins can view
  getBookingById: async (id: string, currentUserId?: string) => apiCall(() => {
      const booking = db.get<Booking[]>('bookings', INITIAL_BOOKINGS).find(b => b.id === id);

      // Authorization: Allow if user is mentee, mentor, or admin
      if (currentUserId && booking) {
          const users = db.get<User[]>('users', INITIAL_USERS);
          const currentUser = users.find(u => u.id === currentUserId);

          const isParticipant = booking.menteeId === currentUserId || booking.mentorId === currentUserId;
          const isAdmin = currentUser?.role === UserRole.ADMIN;

          if (!isParticipant && !isAdmin) {
              throw new Error("Unauthorized: You can only view your own bookings");
          }
      }

      return booking;
  }),

  updateBookingStatus: async (id: string, status: BookingStatus) => apiCall(async () => {
      const bookings = db.get<Booking[]>('bookings', INITIAL_BOOKINGS);
      const idx = bookings.findIndex(b => b.id === id);
      if (idx === -1) return;

      const booking = bookings[idx];
      const currentStatus = booking.status;

      // ✅ FIX BUG #3: Validate status transitions
      const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
          [BookingStatus.SCHEDULED]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.NO_SHOW, BookingStatus.RESCHEDULED, BookingStatus.DISPUTED],
          [BookingStatus.COMPLETED]: [BookingStatus.DISPUTED],
          [BookingStatus.CANCELLED]: [], // Final state
          [BookingStatus.NO_SHOW]: [BookingStatus.DISPUTED],
          [BookingStatus.RESCHEDULED]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.NO_SHOW, BookingStatus.DISPUTED],
          [BookingStatus.DISPUTED]: [BookingStatus.COMPLETED, BookingStatus.REFUNDED],
          [BookingStatus.REFUNDED]: [] // Final state
      };

      const allowedTransitions = ALLOWED_TRANSITIONS[currentStatus] || [];
      if (!allowedTransitions.includes(status)) {
          throw new Error(`Invalid status transition: ${currentStatus} → ${status}. Allowed: ${allowedTransitions.join(', ')}`);
      }

      // Handle credit operations based on new status
      if (status === BookingStatus.COMPLETED && booking.type === 'credit' && booking.creditStatus === 'pending') {
          await creditPendingServiceV2.releaseCreditToMentor(id);
          booking.creditStatus = 'released';
      } else if ((status === BookingStatus.CANCELLED || status === BookingStatus.NO_SHOW) && booking.type === 'credit' && booking.creditStatus === 'pending') {
          await creditPendingServiceV2.refundCreditToMentee(id);
          booking.creditStatus = 'refunded';
      } else if ((status === BookingStatus.CANCELLED || status === BookingStatus.NO_SHOW) && booking.type === 'subscription') {
          // ✅ FIX BUG #3: Restore subscription session with end date validation
          const subs = db.get<Subscription[]>('subscriptions', []);
          const sub = subs.find(s => s.bookings?.includes(id));
          if (sub) {
              // Restore session count
              sub.remainingSessions += 1;

              // ✅ FIX BUG #3: Only reactivate if subscription hasn't expired by end date
              const now = new Date();
              const endDate = new Date(sub.endDate);

              if (sub.status === 'EXPIRED' && sub.remainingSessions > 0 && endDate > now) {
                  sub.status = 'ACTIVE'; // Only reactivate if still within subscription period
              }
              // If endDate has passed, keep status as EXPIRED even if sessions > 0

              sub.bookings = sub.bookings?.filter(b => b !== id) || [];
              db.set('subscriptions', subs);
          }
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

  resolveDispute: async (id: string, outcome: 'REFUND_MENTEE' | 'DISMISS', note: string) => apiCall(async () => {
      const bookings = db.get<Booking[]>('bookings', INITIAL_BOOKINGS);
      const idx = bookings.findIndex(b => b.id === id);
      if (idx === -1) throw new Error("Booking not found");

      const booking = bookings[idx];

      // ✅ FIX BUG #6: Check credit status before refunding
      if (outcome === 'REFUND_MENTEE') {
          if (booking.creditStatus === 'released') {
              throw new Error('Không thể hoàn tiền - Credits đã được chuyển cho mentor. Vui lòng xử lý thủ công.');
          }
          if (booking.type === 'credit' && booking.creditStatus === 'pending') {
              await creditPendingServiceV2.refundCreditToMentee(id);
              booking.creditStatus = 'refunded';
          }
          booking.status = BookingStatus.REFUNDED;
      } else {
          // Dismiss dispute means lesson was completed - release credit to mentor
          if (booking.type === 'credit' && booking.creditStatus === 'pending') {
              await creditPendingServiceV2.releaseCreditToMentor(id);
              booking.creditStatus = 'released';
          }
          booking.status = BookingStatus.COMPLETED;
      }

      booking.resolutionNote = note;
      booking.resolvedAt = new Date().toISOString();
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
  getMentorBalanceDetails: async (id: string) => apiCall(() => mentorPayoutServiceV2.getMentorBalanceDetails(id)),

  // --- PAYOUTS ---
  getPayouts: async (userId: string) => apiCall(() => db.get<Payout[]>('payouts', INITIAL_PAYOUTS).filter(p => p.mentorId === userId)),
  getAllPayouts: async () => apiCall(() => db.get<Payout[]>('payouts', INITIAL_PAYOUTS)),
  getPayoutById: async (id: string) => apiCall(() => db.get<Payout[]>('payouts', INITIAL_PAYOUTS).find(p => p.id === id)),
  
  requestPayout: async (currentUser: User | null, mentorId: string, amount: number, method: string) => apiCall(() => mentorPayoutServiceV2.requestPayout(currentUser, mentorId, amount, method)),
  
  approvePayout: async (currentUser: User | null, id: string, note?: string) => apiCall(() => mentorPayoutServiceV2.approvePayout(currentUser, id, note)),
  
  rejectPayout: async (currentUser: User | null, id: string, reason: string) => apiCall(() => mentorPayoutServiceV2.rejectPayout(currentUser, id, reason)),

  getSystemFinancialHealth: async (currentUser: User | null) => apiCall(() => mentorPayoutServiceV2.getSystemFinancialHealth(currentUser)),

  // --- TRANSACTIONS & PAYMENTS ---
  getAllTransactions: async () => apiCall(() => db.get<Transaction[]>('transactions', INITIAL_TRANSACTIONS)),
  // ✅ FIX BUG #19: Add authorization check - only transaction owner or admins can view
  getTransactionById: async (id: string, currentUserId?: string) => apiCall(() => {
      const transaction = db.get<Transaction[]>('transactions', INITIAL_TRANSACTIONS).find(t => t.id === id);

      // Authorization: Only allow if user owns the transaction or is admin
      if (currentUserId && transaction) {
          const users = db.get<User[]>('users', INITIAL_USERS);
          const currentUser = users.find(u => u.id === currentUserId);

          const isOwner = transaction.userId === currentUserId;
          const isAdmin = currentUser?.role === UserRole.ADMIN;

          if (!isOwner && !isAdmin) {
              throw new Error("Unauthorized: You can only view your own transactions");
          }
      }

      return transaction;
  }),
  
  createMockTransaction: async (data: any) => apiCall(() => {
      const txs = db.get<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
      const newTx = { ...data, id: `tx_${Date.now()}` };
      txs.push(newTx);
      db.set('transactions', txs);
      return newTx;
  }),

  completePayment: async (txId: string, evidence: string, note: string) => apiCall(async () => {
      const txs = db.get<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
      const txIdx = txs.findIndex(t => t.id === txId);
      if (txIdx === -1) throw new Error("Transaction not found");

      // ✅ FIX BUG #14: Validate payout status before marking as paid
      if (txs[txIdx].payoutId) {
          const payouts = db.get<Payout[]>('payouts', INITIAL_PAYOUTS);
          const payout = payouts.find(p => p.id === txs[txIdx].payoutId);

          if (!payout) {
              throw new Error("Associated payout not found");
          }

          if (payout.status !== 'APPROVED_PENDING_PAYMENT') {
              throw new Error(`Cannot mark payout as paid. Current status: ${payout.status}. Payout must be APPROVED_PENDING_PAYMENT first.`);
          }

          await mentorPayoutServiceV2.markPayoutPaid(null, txs[txIdx].payoutId!, evidence);
      }

      txs[txIdx].status = 'success';
      txs[txIdx].evidenceFile = evidence;
      txs[txIdx].reason = note;
      db.set('transactions', txs);
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

  forceRenewSubscription: async (id: string) => apiCall(async () => {
      const subs = db.get<Subscription[]>('subscriptions', []);
      const sIdx = subs.findIndex(s => s.id === id);
      if (sIdx === -1) throw new Error("Subscription not found");

      const s = subs[sIdx];
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === s.planId);
      if (!plan) throw new Error("Plan not found");

      // ✅ FIX BUG #13: Check balance and charge credits before renewing
      const users = db.get<User[]>('users', INITIAL_USERS);
      const mentee = users.find(u => u.id === s.menteeId);
      if (!mentee) throw new Error("Mentee not found");

      const planPrice = plan.price; // Use full price for renewal

      if (mentee.credits < planPrice) {
          throw new Error(`Insufficient credits for renewal. Need ${planPrice.toFixed(0)} credits, have ${mentee.credits.toFixed(0)} credits.`);
      }

      // Deduct credits
      const menteeIdx = users.findIndex(u => u.id === s.menteeId);
      users[menteeIdx].credits -= planPrice;
      db.set('users', users);

      // Record transaction
      const txs = db.get<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
      txs.push({
          id: `tx_sub_renew_${Date.now()}`,
          userId: s.menteeId,
          type: 'SUBSCRIPTION_RENEWAL',
          amount: -planPrice,
          description: `Subscription renewal: ${plan.name}`,
          date: new Date().toISOString(),
          status: 'COMPLETED',
          method: 'Credits',
          relatedEntityId: id
      });
      db.set('transactions', txs);

      // Record credit history
      const history = db.get<CreditHistoryEntry[]>('creditHistory', INITIAL_CREDIT_HISTORY);
      history.unshift({
          id: `ch_sub_renew_${Date.now()}`,
          userId: s.menteeId,
          type: 'subscription_renewal',
          amount: -planPrice,
          balanceAfter: users[menteeIdx].credits,
          note: `Subscription renewal: ${plan.name}`,
          timestamp: new Date().toISOString()
      });
      db.set('creditHistory', history);

      // Renew subscription
      s.endDate = new Date(new Date(s.endDate).getTime() + plan.durationWeeks * 7 * 86400000).toISOString();
      s.remainingSessions = plan.sessions;
      s.cancelQuota = plan.allowedCancel;
      s.rescheduleQuota = plan.allowedReschedule;
      s.status = 'ACTIVE';
      db.set('subscriptions', subs);
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
      // ✅ FIX BUG #10: Cascade delete all related data
      const users = db.get<User[]>('users', INITIAL_USERS);
      db.set('users', users.filter(u => u.id !== id));

      // Delete from role-specific tables
      const mentors = db.get<Mentor[]>('mentors', INITIAL_MENTORS);
      setStore('mentors', mentors.filter(m => m.id !== id));

      const providers = db.get<Provider[]>('providers', INITIAL_PROVIDERS);
      setStore('providers', providers.filter(p => p.id !== id));

      // Delete bookings
      const bookings = db.get<Booking[]>('bookings', INITIAL_BOOKINGS);
      setStore('bookings', bookings.filter(b => b.menteeId !== id && b.mentorId !== id));

      // Delete homework
      const homework = db.get<Homework[]>('homework', INITIAL_HOMEWORK);
      setStore('homework', homework.filter(h => h.menteeId !== id && h.mentorId !== id));

      // Delete conversations and messages
      const convs = db.get<Conversation[]>('conversations', INITIAL_CONVERSATIONS);
      const deletedConvIds = convs.filter(c => c.participantId === id).map(c => c.id);
      setStore('conversations', convs.filter(c => c.participantId !== id));

      const messages = db.get<Message[]>('messages', INITIAL_MESSAGES);
      setStore('messages', messages.filter(m => !deletedConvIds.includes(m.conversationId) && m.fromId !== id));

      // Delete notifications
      const notifications = db.get<Notification[]>('notifications', INITIAL_NOTIFICATIONS);
      setStore('notifications', notifications.filter(n => n.userId !== id));

      // Delete credit history
      const creditHistory = db.get<CreditHistoryEntry[]>('creditHistory', INITIAL_CREDIT_HISTORY);
      setStore('creditHistory', creditHistory.filter(c => c.userId !== id));

      // Delete transactions
      const transactions = db.get<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
      setStore('transactions', transactions.filter(t => t.userId !== id));

      // Delete payouts (if mentor)
      const payouts = db.get<Payout[]>('payouts', INITIAL_PAYOUTS);
      setStore('payouts', payouts.filter(p => p.mentorId !== id));

      // Delete subscriptions
      const subscriptions = db.get<Subscription[]>('subscriptions', []);
      setStore('subscriptions', subscriptions.filter(s => s.menteeId !== id && s.mentorId !== id));

      // Delete referrals and commissions (if provider)
      const referrals = db.get<Referral[]>('referrals', INITIAL_REFERRALS);
      setStore('referrals', referrals.filter(r => r.providerId !== id));

      const commissions = db.get<ProviderCommission[]>('providerCommissions', INITIAL_COMMISSIONS);
      setStore('commissions', commissions.filter(c => c.providerId !== id));

      // Delete mentor earnings
      const earnings = db.get<MentorEarning[]>('mentorEarnings', []);
      setStore('mentorEarnings', earnings.filter(e => e.mentorId !== id));

      // Delete system credit ledger entries
      const ledger = db.get<SystemCreditLedgerEntry[]>('systemCreditLedger', INITIAL_SYSTEM_CREDIT_LEDGER);
      setStore('systemCreditLedger', ledger.filter(l => l.fromUserId !== id && l.toUserId !== id && l.toUserId !== 'system'));
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
          // ✅ FIX BUG #11: Validate and set timezone
          if (data.country && !data.timezone) {
              data.timezone = getTimezoneByCountry(data.country);
          } else if (data.timezone) {
              // Validate timezone if provided manually
              try {
                  data.timezone = validateTimezone(data.timezone, users[idx].country || 'US');
              } catch (error: any) {
                  throw new Error(error.message);
              }
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

  // ✅ FIX BUG #5: Add authorization check for password reset
  resetPassword: async (userId: string, pass: string, currentUserId?: string) => apiCall(async () => {
      // Authorization: Only allow if:
      // 1. User is resetting their own password, OR
      // 2. User is an admin (for admin password reset functionality)
      if (currentUserId && currentUserId !== userId) {
          const currentUsers = db.get<User[]>('users', INITIAL_USERS);
          const currentUser = currentUsers.find(u => u.id === currentUserId);
          if (!currentUser || currentUser.role !== UserRole.ADMIN) {
              throw new Error("Unauthorized: Only admins can reset other users' passwords");
          }
      }

      const users = db.get<User[]>('users', INITIAL_USERS);
      const idx = users.findIndex(u => u.id === userId);
      if (idx === -1) throw new Error("User not found");

      // Hash the new password before storing
      users[idx].password = await security.hashPassword(pass);
      db.set('users', users);
  }),

  // --- ANALYTICS ---
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
  batchSavePricing: async (
    base: number,
    ratio: number,
    countries: any[],
    groups: any[],
    creditPackages?: number[],
    currencies?: any[]
  ) => apiCall(() => {
      // ✅ FIX: GET existing settings first to preserve all fields
      const existingSettings = db.get<SystemSettings>('settings', INITIAL_SETTINGS);

      const settings: SystemSettings = {
        baseLessonCreditPrice: base,
        topupConversionRatio: ratio,
        creditPackages: creditPackages !== undefined ? creditPackages : existingSettings.creditPackages,
        currencies: currencies !== undefined ? currencies : existingSettings.currencies
      };

      db.set('settings', settings);
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

  // --- ADMIN APPROVAL APIs ---
  getPendingUsers: async () => apiCall(() => {
      const users = db.get<User[]>('users', INITIAL_USERS);
      return users.filter(u => u.status === 'PENDING_APPROVAL');
  }),

  approveUser: async (userId: string) => apiCall(async () => {
      const users = db.get<User[]>('users', INITIAL_USERS);
      const uIdx = users.findIndex(u => u.id === userId);
      if (uIdx === -1) throw new Error("User not found");

      users[uIdx].status = 'ACTIVE';
      db.set('users', users);

      // Use notificationService for i18n support
      await notificationService.notifyUserStatusChange(userId, 'ACTIVE');

      console.log(`📧 [EMAIL NOTIFICATION] Account Approved`);
      console.log(`   To: ${users[uIdx].email}`);
      console.log(`   Subject: Your ${users[uIdx].role} Account Has Been Approved`);
      console.log(`   Body: Congratulations! Your account has been approved. You can now log in.`);

      return users[uIdx];
  }),

  rejectUser: async (userId: string, reason: string) => apiCall(async () => {
      const users = db.get<User[]>('users', INITIAL_USERS);
      const uIdx = users.findIndex(u => u.id === userId);
      if (uIdx === -1) throw new Error("User not found");

      users[uIdx].status = 'REJECTED';
      users[uIdx].rejectionReason = reason;
      db.set('users', users);

      // Use notificationService for i18n support
      await notificationService.notifyUserStatusChange(userId, 'REJECTED', reason);

      console.log(`📧 [EMAIL NOTIFICATION] Account Rejected`);
      console.log(`   To: ${users[uIdx].email}`);
      console.log(`   Subject: Your ${users[uIdx].role} Application Has Been Rejected`);
      console.log(`   Body: Your application has been rejected. Reason: ${reason}. You may re-apply.`);

      return users[uIdx];
  }),

  getMentors: async () => apiCall(() => {
    // ✅ Only return ACTIVE mentors (filter out PENDING_APPROVAL, REJECTED, BANNED)
    const allMentors = db.get<Mentor[]>('mentors', INITIAL_MENTORS);
    return allMentors.filter(m => m.status === 'ACTIVE');
  }),
  getMentorById: async (id: string) => apiCall(() => {
    // ✅ Only return mentor if ACTIVE status
    const mentor = db.get<Mentor[]>('mentors', INITIAL_MENTORS).find(m => m.id === id);
    if (mentor && mentor.status !== 'ACTIVE') return undefined; // Hide non-active mentors
    return mentor;
  }),
  
  getBookings: async (userId: string, role: UserRole) => apiCall(() => {
      const all = db.get<Booking[]>('bookings', INITIAL_BOOKINGS);
      return all.filter(b => role === UserRole.MENTEE ? b.menteeId === userId : b.mentorId === userId);
  }),
  getAllBookings: async () => apiCall(() => db.get<Booking[]>('bookings', INITIAL_BOOKINGS)),
  getSystemSettings: async () => apiCall(() => db.get('settings', INITIAL_SETTINGS)),
  getPricingGroups: async () => apiCall(() => db.get('pricingGroups', INITIAL_PRICING_GROUPS)),
  getPricingCountries: async () => apiCall(() => db.get('pricingCountries', INITIAL_PRICING_COUNTRIES)),
  getMentorLocalizedRate: async (mentorId: string, menteeCountry: string) => apiCall(() => pricingRevenueServiceV2.calculatePrice(mentorId, menteeCountry)),
  calculatePriceDetail: async (mid: string, cid: string) => apiCall(() => {
      const finalPrice = pricingRevenueServiceV2.calculatePrice(mid, cid);
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
