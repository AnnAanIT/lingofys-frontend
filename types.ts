

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

export type CreditStatus = 'pending' | 'released' | 'refunded';
export type LedgerStatus = 'holding' | 'released' | 'returned';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  credits: number; // Pure Credit Unit
  balance: number; // USD (Legacy Provider / Payout Staging)
  status: 'ACTIVE' | 'BANNED' | 'PENDING_APPROVAL' | 'REJECTED';
  joinedAt: string;
  phone?: string;
  country?: string;
  timezone?: string; 
  password?: string; 
  mentorGroupId?: string; 
}

export interface ProviderLevel {
  id: string;
  name: string; // e.g., Bronze, Silver, Gold
  commissionPercent: number; // e.g., 5, 8, 12
}

export interface Provider extends User {
  refCode: string;
  payoutMethod: 'PayPal' | 'Bank Transfer' | 'Wise';
  payoutDetails: string;
  levelId: string; // Links to ProviderLevel
}

export interface ProviderCommission {
  id: string;
  providerId: string;
  topupId: string; // Transaction ID of the topup
  menteeId: string;
  menteeName: string;
  topupAmountUsd: number;
  commissionPercent: number;
  commissionAmountUsd: number;
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
  bio: string; 
  bioLong?: string; 
  teachingStyle?: string; 
  videoIntro?: string; 
  specialties: string[];
  hourlyRate: number; // In Credits
  availability: AvailabilitySlot[]; 
  rating: number;
  reviewCount: number;
  experienceYears: number;
  certificates?: string[];
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
  type: 'credit' | 'subscription';
  subscriptionId?: string; 
  notes?: string;
  evidenceImage?: string; 
  homeworkId?: string;
  totalCost: number; // Strict Credit Cost
  joinLink?: string;
  rating?: number; // New: Star rating (1-5)
  review?: string; // New: Text review
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
  planName: string;
  menteeId: string;
  menteeName?: string; 
  mentorId: string;
  mentorName: string;
  startDate: string;
  endDate: string;
  totalSessions: number;
  remainingSessions: number;
  cancelQuota: number;
  rescheduleQuota: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  bookings: string[]; 
}

export interface Homework {
  id: string;
  bookingId: string;
  mentorId: string;
  menteeId: string;
  title: string;
  description: string;
  attachment?: string; 
  studentSubmission?: string; 
  studentNote?: string;
  mentorFeedback?: string;
  feedbackAttachment?: string;
  grade?: string;
  status: 'PENDING' | 'SUBMITTED' | 'REVIEWED';
  dueDate?: string;
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
  type: 'EARNING' | 'PAYOUT' | 'REFUND' | 'TOPUP' | 'SUBSCRIPTION' | 'mentor_payout' | 'provider_payout' | 'refund_credit' | 'credit_topup' | 'ADMIN_ADJUSTMENT' | 'booking_use' | 'PROVIDER_COMMISSION';
  description: string;
  date: string;
  relatedEntityId?: string; 
  status: 'COMPLETED' | 'FAILED' | 'PENDING' | 'success' | 'failed' | 'pending';
  payoutId?: string; 
  evidenceFile?: string;
  method?: string;
  reason?: string; 
}

export interface CreditHistoryEntry {
  id: string;
  userId: string;
  type: 'admin_adjustment' | 'booking_use' | 'refund' | 'topup' | 'subscription_purchase' | 'earning' | 'payout';
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
  country: string;
  totalSpending: number;
  totalCommission: number;
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
  actionType: 'booking' | 'payment' | 'payout' | 'system' | 'subscription' | 'commissions' | 'homework' | 'wallet';
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
  name: string;
  multiplier: number; 
}

export interface PricingGroup {
  id: string; 
  name: string;
  multiplier: number; 
}

export interface SystemSettings {
  baseLessonCreditPrice: number;
  topupConversionRatio: number; // $1 USD = X Credits. (e.g. 0.8 means $1 buys 0.8 credits => 1 Credit costs $1.25)
  // Payout is strictly 1 Credit = $1 USD (100% Face Value)
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