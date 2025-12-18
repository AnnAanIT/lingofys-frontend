
import { Mentor } from '../types';
import { INITIAL_MENTORS } from '../mockData';

// --- HELPERS FOR MOCK ENV ---
const getMentor = (id: string): Mentor | undefined => {
    const mStr = localStorage.getItem('mentors');
    const mentors = mStr ? JSON.parse(mStr) : INITIAL_MENTORS;
    return mentors.find((m: Mentor) => m.id === id);
}

/**
 * Determines the earning percentage for a mentor.
 * In the new credit model, mentors receive 100% of the credits.
 */
export function getMentorEarningPercent(mentorId: string): number {
    return 100;
}

/**
 * Calculates the mentor's earning amount based on the price paid by the mentee.
 * Returns 100% of the amount.
 */
export function calculateMentorEarning(pricePaidByMentee: number, mentorId: string): { amount: number, percent: number } {
    // 100% earning model
    return { amount: pricePaidByMentee, percent: 100 };
}

/**
 * Calculates system revenue.
 * System Revenue is 0 in the credit consumption model (revenue generated at Top-up).
 */
export function calculateSystemRevenue(pricePaid: number, mentorEarning: number): number {
    return 0;
}

/**
 * Helper to generate the initial MentorEarning record structure.
 * Status starts as 'pending'.
 */
export function createMentorEarningRecordPayload(booking: any, amount: number) {
    return {
        id: `me_${Math.random().toString(36).substr(2, 9)}`,
        mentorId: booking.mentorId,
        bookingId: booking.id,
        amount: amount,
        status: 'pending' as const, // explicitly cast literal type
        createdAt: new Date().toISOString()
    };
}
