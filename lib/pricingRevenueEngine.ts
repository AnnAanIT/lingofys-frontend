
import { SystemSettings, PricingCountry, PricingGroup, Mentor } from '../types';
import { INITIAL_SETTINGS, INITIAL_PRICING_COUNTRIES, INITIAL_PRICING_GROUPS, INITIAL_MENTORS } from '../mockData';

// Helper to get fresh data from "DB" (LocalStorage)
const getStore = (key: string, initial: any) => {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : initial;
};

// Simplified result: Just the money.
export interface FinancialResult {
    price: number;
    mentorEarning: number;
    systemRevenue: number;
}

export const pricingRevenueEngine = {
    /**
     * CORE CALCULATION LOGIC
     * Price = Admin Base Price * Country Multiplier * Mentor Group Multiplier
     */
    calculatePrice: (mentorId: string, menteeCountryId: string): number => {
        const sys = getStore('settings', INITIAL_SETTINGS) as SystemSettings;
        const countries = getStore('pricingCountries', INITIAL_PRICING_COUNTRIES) as PricingCountry[];
        const groups = getStore('pricingGroups', INITIAL_PRICING_GROUPS) as PricingGroup[];
        const mentors = getStore('mentors', INITIAL_MENTORS) as Mentor[];
        
        const mentor = mentors.find(m => m.id === mentorId);
        if (!mentor) return sys.baseLessonCreditPrice; // Fallback to base

        // 1. Get Base Price from Admin Settings
        const base = sys.baseLessonCreditPrice || 10;
        
        // 2. Get Mentee Country Multiplier
        const country = countries.find(c => c.id === menteeCountryId || c.name === menteeCountryId);
        const countryMult = country ? country.multiplier : 1.0;
        
        // 3. Get Mentor Group Multiplier
        const groupId = mentor.mentorGroupId || 'basic';
        const group = groups.find(g => g.id === groupId);
        const groupMult = group ? group.multiplier : 1.0;

        // Final Price in Credits
        return Number((base * countryMult * groupMult).toFixed(2));
    },

    // 2. Calculate Revenue Split
    // In credit model, mentor gets 100% of the credits.
    calculateSplit: (totalPrice: number, mentorId: string): { mentorEarning: number, systemRevenue: number } => {
        return {
            mentorEarning: totalPrice,
            systemRevenue: 0
        };
    },

    // 3. Complete Financial Calculation (Lightweight)
    calculateBookingFinancials: (mentorId: string, menteeCountryId: string): FinancialResult => {
        const price = pricingRevenueEngine.calculatePrice(mentorId, menteeCountryId);
        const { mentorEarning, systemRevenue } = pricingRevenueEngine.calculateSplit(price, mentorId);

        return {
            price,
            mentorEarning,
            systemRevenue
        };
    }
};
