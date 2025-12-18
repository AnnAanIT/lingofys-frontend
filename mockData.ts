
import { User, UserRole, Mentor, Booking, BookingStatus, Homework, Payout, Transaction, Referral, Commission, Provider, SystemLog, Notification, SubscriptionPlan, Subscription, CreditHistoryEntry, PricingCountry, PricingGroup, Message, Conversation, SystemSettings, MentorEarning, SystemCreditLedgerEntry, ProviderLevel, ProviderCommission } from './types';

export const COUNTRY_TO_TIMEZONE: Record<string, string> = {
  "Vietnam": "Asia/Ho_Chi_Minh",
  "VN": "Asia/Ho_Chi_Minh",
  "Japan": "Asia/Tokyo",
  "JP": "Asia/Tokyo",
  "South Korea": "Asia/Seoul",
  "KR": "Asia/Seoul",
  "China": "Asia/Shanghai",
  "CN": "Asia/Shanghai",
  "USA": "America/New_York",
  "US": "America/New_York",
  "United States": "America/New_York",
  "United Kingdom": "Europe/London",
  "GB": "Europe/London",
  "UK": "Europe/London",
  "Singapore": "Asia/Singapore",
  "SG": "Asia/Singapore",
  "Thailand": "Asia/Bangkok",
  "TH": "Asia/Bangkok",
  "Australia": "Australia/Sydney",
  "AU": "Australia/Sydney",
  "France": "Europe/Paris",
  "FR": "Europe/Paris",
  "Germany": "Europe/Berlin",
  "DE": "Europe/Berlin",
  "Canada": "America/Toronto",
  "CA": "America/Toronto"
};

export const INITIAL_SETTINGS: SystemSettings = {
  baseLessonCreditPrice: 10,
  topupConversionRatio: 0.8,  
};

export const INITIAL_PRICING_COUNTRIES: PricingCountry[] = [
  { id: "VN", name: "Vietnam", multiplier: 0.9 },
  { id: "JP", name: "Japan", multiplier: 1.15 },
  { id: "KR", name: "South Korea", multiplier: 1.1 },
  { id: "CN", name: "China", multiplier: 1.05 },
  { id: "US", name: "United States", multiplier: 1.0 },
  { id: "GB", name: "United Kingdom", multiplier: 1.0 }
];

export const INITIAL_PRICING_GROUPS: PricingGroup[] = [
  { id: "basic", name: "Standard Mentor", multiplier: 1.0 },
  { id: "expert", name: "Expert Mentor", multiplier: 1.2 },
  { id: "native", name: "Native Speaker", multiplier: 1.4 },
  { id: "vip", name: "VIP Mentor", multiplier: 1.5 }
];

export const INITIAL_PROVIDER_LEVELS: ProviderLevel[] = [
  { id: "bronze", name: "Bronze Partner", commissionPercent: 5 },
  { id: "silver", name: "Silver Partner", commissionPercent: 8 },
  { id: "gold", name: "Gold Partner", commissionPercent: 12 }
];

const now = new Date();
const DEFAULT_PASSWORD = 'password123';

export const INITIAL_USERS: User[] = [
  // --- ADMINS ---
  {
    id: 'admin_1',
    name: 'George Boss',
    email: 'george@admin.io',
    password: DEFAULT_PASSWORD,
    role: UserRole.ADMIN,
    avatar: 'https://ui-avatars.com/api/?name=George+Boss&background=0D8ABC&color=fff',
    credits: 0,
    balance: 0,
    status: 'ACTIVE',
    joinedAt: new Date(now.getTime() - 86400000 * 365).toISOString(),
    country: 'US',
    timezone: 'America/New_York'
  },
  {
    id: 'admin_2',
    name: 'Hannah Root',
    email: 'hannah@admin.io',
    password: DEFAULT_PASSWORD,
    role: UserRole.ADMIN,
    avatar: 'https://ui-avatars.com/api/?name=Hannah+Root&background=6b46c1&color=fff',
    credits: 0,
    balance: 0,
    status: 'ACTIVE',
    joinedAt: new Date(now.getTime() - 86400000 * 300).toISOString(),
    country: 'GB',
    timezone: 'Europe/London'
  },
  // --- MENTORS ---
  {
    id: 'mentor_1',
    name: 'Charlie Davis',
    email: 'charlie@mentor.io',
    password: DEFAULT_PASSWORD,
    role: UserRole.MENTOR,
    avatar: 'https://ui-avatars.com/api/?name=Charlie+Davis&background=48bb78&color=fff',
    credits: 0,
    balance: 0,
    status: 'ACTIVE',
    joinedAt: new Date(now.getTime() - 86400000 * 180).toISOString(),
    country: 'US',
    timezone: 'America/New_York',
    mentorGroupId: 'expert'
  },
  {
    id: 'mentor_2',
    name: 'Diana Prince',
    email: 'diana@mentor.io',
    password: DEFAULT_PASSWORD,
    role: UserRole.MENTOR,
    avatar: 'https://ui-avatars.com/api/?name=Diana+Prince&background=f6e05e&color=000',
    credits: 0,
    balance: 0,
    status: 'ACTIVE',
    joinedAt: new Date(now.getTime() - 86400000 * 120).toISOString(),
    country: 'GB',
    timezone: 'Europe/London',
    mentorGroupId: 'vip'
  },
  // --- PROVIDERS ---
  {
    id: 'provider_1',
    name: 'Evan Wright',
    email: 'evan@provider.io',
    password: DEFAULT_PASSWORD,
    role: UserRole.PROVIDER,
    avatar: 'https://ui-avatars.com/api/?name=Evan+Wright&background=ed8936&color=fff',
    credits: 0,
    balance: 150.50,
    status: 'ACTIVE',
    joinedAt: new Date(now.getTime() - 86400000 * 200).toISOString(),
    country: 'US',
    timezone: 'America/New_York'
  },
  {
    id: 'provider_2',
    name: 'Fiona Gale',
    email: 'fiona@provider.io',
    password: DEFAULT_PASSWORD,
    role: UserRole.PROVIDER,
    avatar: 'https://ui-avatars.com/api/?name=Fiona+Gale&background=4299e1&color=fff',
    credits: 0,
    balance: 85.00,
    status: 'ACTIVE',
    joinedAt: new Date(now.getTime() - 86400000 * 150).toISOString(),
    country: 'VN',
    timezone: 'Asia/Ho_Chi_Minh'
  },
  // --- MENTEES ---
  {
    id: 'mentee_1',
    name: 'Alice Johnson',
    email: 'alice@mentee.io',
    password: DEFAULT_PASSWORD,
    role: UserRole.MENTEE,
    avatar: 'https://ui-avatars.com/api/?name=Alice+Johnson&background=f687b3&color=fff',
    credits: 120,
    balance: 0,
    status: 'ACTIVE',
    joinedAt: new Date(now.getTime() - 86400000 * 30).toISOString(),
    country: 'VN',
    timezone: 'Asia/Ho_Chi_Minh'
  },
  {
    id: 'mentee_2',
    name: 'Bob Smith',
    email: 'bob@mentee.io',
    password: DEFAULT_PASSWORD,
    role: UserRole.MENTEE,
    avatar: 'https://ui-avatars.com/api/?name=Bob+Smith&background=a0aec0&color=fff',
    credits: 50,
    balance: 0,
    status: 'ACTIVE',
    joinedAt: new Date(now.getTime() - 86400000 * 45).toISOString(),
    country: 'JP',
    timezone: 'Asia/Tokyo'
  }
];

export const INITIAL_MENTORS: Mentor[] = [
  {
    ...INITIAL_USERS.find(u => u.id === 'mentor_1')!,
    bio: 'I specialize in IELTS preparation and academic writing. 10+ years of teaching experience.',
    specialties: ['IELTS', 'Academic Writing', 'Grammar'],
    hourlyRate: 15,
    rating: 4.8,
    reviewCount: 45,
    experienceYears: 10,
    availability: [
      { id: 'av_m1_1', mentorId: 'mentor_1', day: 'Mon', startTime: '09:00', duration: 60, recurring: true },
      { id: 'av_m1_2', mentorId: 'mentor_1', day: 'Wed', startTime: '14:00', duration: 60, recurring: true }
    ]
  },
  {
    ...INITIAL_USERS.find(u => u.id === 'mentor_2')!,
    bio: 'Business English expert focusing on corporate communication and presentation skills.',
    specialties: ['Business English', 'Public Speaking', 'Presentations'],
    hourlyRate: 25,
    rating: 5.0,
    reviewCount: 32,
    experienceYears: 12,
    availability: [
      { id: 'av_m2_1', mentorId: 'mentor_2', day: 'Tue', startTime: '10:00', duration: 60, recurring: true },
      { id: 'av_m2_2', mentorId: 'mentor_2', day: 'Thu', startTime: '18:00', duration: 60, recurring: true }
    ]
  }
];

export const INITIAL_PROVIDERS: Provider[] = [
  {
    ...INITIAL_USERS.find(u => u.id === 'provider_1')!,
    refCode: 'EVAN123',
    payoutMethod: 'PayPal',
    payoutDetails: 'evan@paypal.com',
    levelId: 'gold'
  },
  {
    ...INITIAL_USERS.find(u => u.id === 'provider_2')!,
    refCode: 'FIONA88',
    payoutMethod: 'Bank Transfer',
    payoutDetails: 'Bank: VCB, Acc: 123456789',
    levelId: 'silver'
  }
];

export const INITIAL_REFERRALS: Referral[] = [
  {
    id: 'ref_1',
    providerId: 'provider_1',
    menteeId: 'mentee_1',
    menteeName: 'Alice Johnson',
    signupDate: new Date(now.getTime() - 86400000 * 30).toISOString(),
    country: 'VN',
    totalSpending: 200,
    totalCommission: 24 // 12% for Gold Evan
  },
  {
    id: 'ref_2',
    providerId: 'provider_2',
    menteeId: 'mentee_2',
    menteeName: 'Bob Smith',
    signupDate: new Date(now.getTime() - 86400000 * 45).toISOString(),
    country: 'JP',
    totalSpending: 100,
    totalCommission: 8 // 8% for Silver Fiona
  }
];

export const INITIAL_BOOKINGS: Booking[] = [];
export const INITIAL_PAYOUTS: Payout[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_COMMISSIONS: ProviderCommission[] = [];
export const INITIAL_SYSTEM_CREDIT_LEDGER: SystemCreditLedgerEntry[] = [];
export const INITIAL_MENTOR_EARNINGS: MentorEarning[] = [];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    { 
        id: "sp1", 
        name: "Starter", 
        price: 40, 
        sessions: 4, 
        description: "1 lesson per week. Build your habit.",
        allowedCancel: 1, 
        allowedReschedule: 1,
        durationWeeks: 4
    },
    { 
        id: "sp2", 
        name: "Intensive", 
        price: 75, 
        sessions: 8, 
        description: "2 lessons per week. Faster progress.",
        allowedCancel: 2, 
        allowedReschedule: 2,
        durationWeeks: 4
    }
];

export const INITIAL_CREDIT_HISTORY: CreditHistoryEntry[] = [];
export const INITIAL_HOMEWORK: Homework[] = [];
export const INITIAL_CONVERSATIONS: Conversation[] = [];
export const INITIAL_MESSAGES: Message[] = [];
export const INITIAL_LOGS: SystemLog[] = [];
export const INITIAL_NOTIFICATIONS: Notification[] = [];
