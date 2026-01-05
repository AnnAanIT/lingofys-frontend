

export enum UserRole {
  MENTEE = 'MENTEE',
  MENTOR = 'MENTOR',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN'
}

export type Language = 'en' | 'zh' | 'ko' | 'ja' | 'vi';

export enum BookingStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED',
  DISPUTED = 'DISPUTED',
  REFUNDED = 'REFUNDED'
}

export type CreditStatus = 'PENDING' | 'RELEASED' | 'REFUNDED';  // Fixed: Backend returns uppercase
export type LedgerStatus = 'HOLDING' | 'RELEASED' | 'RETURNED';  // Fixed: Backend returns uppercase

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  credits: number; // Pure Credit Unit
  status: 'ACTIVE' | 'BANNED' | 'PENDING_APPROVAL' | 'REJECTED';
  isSystemAdmin?: boolean; // Protected system admin flag
  joinedAt: string;
  country?: string;
  timezone?: string;
  password?: string;
  providerId?: string; // ID của provider giới thiệu
  rejectionReason?: string; // Admin's reason for rejection or ban
  appliedAt?: string; // When MENTOR/PROVIDER first applied
  paymentMethod?: string; // Paypay, Bank, Wise, Momo
  paymentDetails?: string; // Paypay email, Bank account, Momo number, etc.
  menteeCancelCount?: number; // Number of times mentee cancelled bookings
  lastMenteeCancelAt?: Date; // Last time mentee cancelled a booking
}

export interface ProviderLevel {
  id: string;
  name: string; // e.g., Bronze, Silver, Gold
  commissionRate: number; // e.g., 5, 8, 12 (actually stored as Decimal in DB)
  commissionPercent: number; // Same as commissionRate (alias for frontend display)
}

export interface Provider extends User {
  providerProfile?: {
    id: string;
    userId: string;
    levelId: string | null;
    referralCode: string;
    commissionRate: number;
    totalEarnings: number;
    bio: string | null;
    website: string | null;
    payoutDetails?: string; // Payout method details (bank account, PayPal, etc.)
  };
}

export interface ProviderCommission {
  id: string;
  providerId: string;
  topupId: string; // Transaction ID of the topup
  menteeId: string;
  menteeName: string;
  topupAmountUsd: number;
  commissionPercent: number;
  commissionAmountUsd: number; // Legacy field (still sent by backend)
  commissionCredits: number; // ✅ New: Commission in credits (5% of credits from topup)
  status: 'PENDING' | 'PAID';
  createdAt: string;
  paidAt?: string;
}

export interface AvailabilitySlot {
  id: string;
  mentorId: string;
  day: string; 
  startTime: string; 
  duration: number; 
  recurring: boolean;
}

export interface Mentor extends User {
  headline: string;              // Short tagline (replaces "bio" in API layer)
  bio?: string;                  // Legacy field alias for headline
  aboutMe?: string;              // Full story (replaces "bioLong" in API layer)
  videoIntro?: string; 
  specialties: string[];
  teachingLanguages: string[];   // NEW: Languages this mentor teaches (e.g., ["English", "Chinese"])
  mentorGroupId: string;         // Tier: basic, expert, native, vip (affects rate multiplier)
  mentorGroup?: any;             // Populated mentorGroup object from backend
  availability: AvailabilitySlot[]; 
  rating: number;
  reviewCount: number;
  experienceYears: number;
  certificates?: string[];
  cancellationCount?: number;    // Number of times mentor cancelled bookings
  lastCancelAt?: Date;           // Last time mentor cancelled a booking
}

export interface Booking {
  id: string;
  menteeId: string;
  mentorId: string;
  mentorName: string;
  menteeName: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  creditStatus: CreditStatus;
  type: 'CREDIT' | 'SUBSCRIPTION';  // Fixed: Backend returns uppercase
  subscriptionId?: string; 
  notes?: string;
  evidenceImage?: string; 
  homeworkId?: string;
  totalCost: number; // Strict Credit Cost
  joinLink?: string;
  rating?: number; // New: Star rating (1-5)
  review?: string; // New: Text review
  // Cancellation Fields
  cancelledBy?: string;
  cancelledAt?: string;
  cancellationReason?: string;  // Reason for cancellation (mentor or mentee)
  rescheduleReason?: string;    // Reason for rescheduling (mentee) // Optional reason when mentor cancels
  // Dispute Fields
  disputeReason?: string;
  disputeEvidence?: string;
  disputeDate?: string;
  resolutionNote?: string;
  resolvedAt?: string;
}

export interface MentorEarning {
  id: string;
  mentorId: string;
  bookingId: string;
  amount: number; // In Credits
  status: 'pending' | 'payable' | 'paid';
  createdAt: string;
  paidAt?: string;
}

export interface SystemCreditLedgerEntry {
  id: string;
  bookingId: string;
  fromUserId: string; 
  toUserId: string;   
  amount: number; // Credits
  status: LedgerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number; // Credits
  sessions: number;
  description: string;
  allowedCancel: number;
  allowedReschedule: number;
  durationWeeks: number;
}

export interface Subscription {
  id: string;
  planId: string;
  planName?: string;
  menteeId: string;
  menteeName?: string;
  mentorId: string;
  mentorName?: string;
  startDate: string;
  endDate: string;
  totalSessions?: number;
  remainingSessions: number;
  cancelQuota: number;
  rescheduleQuota: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';  // Fixed: Backend doesn't have 'COMPLETED' status
  bookings: string[];
}

export interface Homework {
  id: string;
  bookingId: string;
  title: string;
  description: string;
  dueDate: string;
  submittedAt?: string;
  submissionUrl?: string;
  submissionNote?: string;
  grade?: number; // 0-100
  feedback?: string;
  gradedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Nested booking data (from backend include)
  booking?: {
    id: string;
    menteeId: string;
    mentorId: string;
    mentee?: {
      id: string;
      name: string;
      avatar?: string;
    };
    mentor?: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
}

export interface Message {
  id: string;
  conversationId: string; 
  fromRole: UserRole;
  fromId: string;
  toRole: UserRole;
  toId: string | null; 
  content: string;
  createdAt: string;
  read: boolean;
  attachment?: string;
}

export interface Conversation {
  id: string;
  participantRole: UserRole; 
  participantId: string;
  participantName: string;
  participantAvatar: string;
  assignedAdminId: string | null; 
  status: 'OPEN' | 'CLOSED';
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number; 
}

export interface Payout {
  id: string;
  mentorId: string;
  amount: number; // Settlement Amount (USD)
  creditsDeducted: number; // Credits removed from circulation (0 for Providers)
  status: 'PENDING' | 'APPROVED_PENDING_PAYMENT' | 'PAID' | 'REJECTED' | 'PAYMENT_FAILED';
  requestedAt: string;
  approvedAt?: string;
  paidAt?: string;
  rejectedAt?: string;
  method?: string;
  note?: string;
  adminNote?: string;
  evidenceFile?: string;
  paymentTransactionId?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number; // Money (USD) or Credit Amount depending on type context
  type: 'EARNING' | 'PAYOUT' | 'REFUND' | 'TOPUP' | 'SUBSCRIPTION' | 'SUBSCRIPTION_PURCHASE' | 'SUBSCRIPTION_RENEWAL' | 'SUBSCRIPTION_UPGRADE' | 'SUBSCRIPTION_DOWNGRADE' | 'SUBSCRIPTION_REFUND' | 'PLATFORM_FEE' | 'mentor_payout' | 'provider_payout' | 'refund_credit' | 'credit_topup' | 'ADMIN_ADJUSTMENT' | 'booking_use' | 'PROVIDER_COMMISSION';
  description: string;
  date: string;
  relatedEntityId?: string;
  status: 'COMPLETED' | 'FAILED' | 'PENDING' | 'success' | 'failed' | 'pending' | 'APPROVED' | 'REJECTED';
  payoutId?: string;
  evidenceFile?: string;
  method?: string;
  reason?: string;
}

export interface CreditHistoryEntry {
  id: string;
  userId: string;
  type: 'admin_adjustment' | 'booking_use' | 'refund' | 'topup' | 'subscription_purchase' | 'earning' | 'payout' | 'subscription_renewal' | 'subscription_upgrade' | 'subscription_downgrade' | 'subscription_refund';
  amount: number;
  balanceAfter: number;
  note?: string;
  timestamp: string;
  adminId?: string;
}

export interface Referral {
  id: string;
  providerId: string;
  menteeId: string;
  menteeName: string;
  signupDate: string;
  country?: string; // Mentee's country
  totalSpending: number; // Total amount spent by this mentee
  totalCommission: number; // Total commission earned from this mentee
}

export interface Commission {
  id: string;
  providerId: string;
  amount: number;
  source: 'CREDIT_PURCHASE' | 'SUBSCRIPTION';
  menteeId: string;
  menteeName: string;
  date: string;
  status: 'PENDING' | 'AVAILABLE';
}

export interface SystemLog {
  ts: number;        
  lvl: 'info' | 'warn' | 'error';
  src: 'booking' | 'payment' | 'user' | 'system';
  msg: string;
}

export interface Notification {
  id: string;
  role: UserRole | 'ALL';
  userId: string; // Specific user ID or 'ALL' if broadcast
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  actionType?: 'booking' | 'payment' | 'payout' | 'system' | 'subscription' | 'commissions' | 'homework' | 'wallet' | 'profile';
  actionId?: string;
  read: boolean;
  createdAt: string;
}

// Analytics Types
export interface RevenueDataPoint {
  date: string;
  topupVolume: number; // USD In
  payoutVolume: number; // USD Out
}

export interface WeeklyRevenueResponse {
  week: string;
  days: RevenueDataPoint[];
  totalTopup: number;
  totalPayout: number;
  net: number;
}

export interface MonthlyRevenueResponse {
  month: string;
  days: RevenueDataPoint[];
  totalTopup: number;
  totalPayout: number;
  net: number;
}

export interface PricingCountry {
  id: string; 
  code: string;  // ✅ Added
  name: string;
  multiplier: number;
  currency: string;  // ✅ Added
  timezone: string;  // ✅ Added
}

export interface PricingGroup {
  id: string; 
  name: string;
  multiplier: number; 
}

// --- CURRENCY & TOP-UP TYPES ---
export interface CurrencyConfig {
  code: string; // 'USD', 'VND', 'JPY'
  name: string; // 'US Dollar', 'Vietnamese Dong', 'Japanese Yen'
  symbol: string; // '$', '₫', '¥'
  symbolPosition: 'before' | 'after'; // Display $ before or after amount
  exchangeRate: number; // Rate to USD (e.g., VND: 25000, JPY: 150, USD: 1)
  enabled: boolean; // Can users select this currency?
  paymentMethods: string[]; // Available payment gateways for this currency
}

export interface SystemSettings {
  baseLessonCreditPrice: number;
  topupConversionRatio: number; // $1 USD = X Credits. (e.g. 0.8 means $1 buys 0.8 credits => 1 Credit costs $1.25)
  // Payout is strictly 1 Credit = $1 USD (100% Face Value)
  creditPackages?: number[]; // Admin-configurable credit packages (e.g., [40, 100, 200, 400])
  currencies?: CurrencyConfig[]; // Multi-currency configuration for top-up display
}

// --- CAC DASHBOARD TYPES ---
export interface CACSummary {
  revenue: number; // Total USD from top-ups
  cac: number; // Total Provider Commission
  cacRatio: number; // cac / revenue
  grossProfit: number; // revenue - cac
}

export interface ProviderPerformance {
  providerId: string;
  providerName: string;
  levelId: string;
  revenueGenerated: number;
  commissionCost: number;
  cacRatio: number;
}

export interface LevelPerformance {
  levelId: string;
  providerCount: number;
  totalRevenue: number;
  totalCAC: number;
  cacRatio: number;
}

export interface CACTimeSeriesPoint {
  date: string;
  revenue: number;
  cac: number;
}

export interface CACDashboardData {
  summary: CACSummary;
  byProvider: ProviderPerformance[];
  byLevel: LevelPerformance[];
  timeSeries: CACTimeSeriesPoint[];
}