/**
 * Validation Service
 *
 * Fixes:
 * - BUG #22: No validation for negative credit amounts
 * - BUG #23: createOneTimeBooking() doesn't check mentor availability
 * - BUG #24: rescheduleBooking() doesn't check new time availability
 * - BUG #25: Register doesn't validate email format
 * - BUG #35: No validation for availability slot overlap
 * - BUG #37: Timezone not enforced
 *
 * Usage:
 *   validationService.validateCreditAmount(amount);
 *   await validationService.validateBookingTime(mentorId, startTime, duration);
 */

import {
    User,
    Booking,
    AvailabilitySlot,
    Mentor
} from '../../types';
import {
    INITIAL_USERS,
    INITIAL_BOOKINGS,
    INITIAL_MENTORS
} from '../../mockData';
import { validateEmail } from '../../utils/security';

// --- HELPERS FOR LOCAL STORAGE SIMULATION ---
const getStore = <T>(key: string, initial: T): T => {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : initial;
};

export const validationService = {
    /**
     * ✅ FIX BUG #22: Validate credit amount (must be positive)
     */
    validateCreditAmount: (amount: number, operation: string): void => {
        if (!Number.isFinite(amount)) {
            throw new Error(`Invalid amount: ${amount}`);
        }

        if (amount < 0) {
            throw new Error(`Amount cannot be negative for ${operation}`);
        }

        if (amount === 0) {
            throw new Error(`Amount must be greater than 0 for ${operation}`);
        }

        if (amount > 1000000) {
            throw new Error(`Amount exceeds maximum limit (1,000,000 credits)`);
        }

        // Check for decimal precision (max 2 decimal places)
        if (amount.toFixed(2) !== amount.toString() && amount.toString().split('.')[1]?.length > 2) {
            throw new Error(`Amount cannot have more than 2 decimal places`);
        }
    },

    /**
     * ✅ FIX BUG #25: Validate email format
     */
    validateEmailFormat: (email: string): void => {
        if (!email || email.trim().length === 0) {
            throw new Error('Email is required');
        }

        if (!validateEmail(email)) {
            throw new Error('Invalid email format');
        }

        if (email.length > 255) {
            throw new Error('Email is too long (max 255 characters)');
        }
    },

    /**
     * ✅ FIX BUG #23: Check if mentor is available at given time
     */
    validateBookingTime: async (
        mentorId: string,
        startTime: string,
        duration: number,
        excludeBookingId?: string
    ): Promise<void> => {
        const mentors = getStore<Mentor[]>('mentors', INITIAL_MENTORS);
        const bookings = getStore<Booking[]>('bookings', INITIAL_BOOKINGS);

        const mentor = mentors.find(m => m.id === mentorId);
        if (!mentor) throw new Error('Mentor not found');

        const start = new Date(startTime);
        const end = new Date(start.getTime() + duration * 60 * 1000);

        // Validate time is in the future
        if (start < new Date()) {
            throw new Error('Booking time must be in the future');
        }

        // Validate duration
        if (duration < 30 || duration > 180) {
            throw new Error('Booking duration must be between 30 and 180 minutes');
        }

        // ✅ Check for conflicting bookings
        const conflictingBooking = bookings.find(b => {
            if (b.mentorId !== mentorId) return false;
            if (excludeBookingId && b.id === excludeBookingId) return false;
            if (b.status === 'CANCELLED' || b.status === 'REFUNDED') return false;

            const bStart = new Date(b.startTime);
            const bEnd = new Date(b.endTime);

            // Check for overlap
            return (start < bEnd && end > bStart);
        });

        if (conflictingBooking) {
            throw new Error(
                `Mentor is not available at this time. Conflicting booking: ${new Date(conflictingBooking.startTime).toLocaleString()}`
            );
        }

        // ✅ Check mentor availability slots (if defined)
        if (mentor.availability && mentor.availability.length > 0) {
            const dayOfWeek = start.toLocaleDateString('en-US', { weekday: 'long' });
            const timeString = start.toTimeString().substring(0, 5); // HH:MM

            const hasMatchingSlot = mentor.availability.some(slot => {
                if (slot.day !== dayOfWeek) return false;

                const slotStart = slot.startTime;
                const slotEndTime = new Date(`2000-01-01T${slotStart}`);
                slotEndTime.setMinutes(slotEndTime.getMinutes() + slot.duration);
                const slotEnd = slotEndTime.toTimeString().substring(0, 5);

                return timeString >= slotStart && timeString < slotEnd;
            });

            if (!hasMatchingSlot) {
                throw new Error(
                    `Mentor is not available on ${dayOfWeek} at ${timeString}. Please check their availability schedule.`
                );
            }
        }
    },

    /**
     * ✅ FIX BUG #35: Validate availability slot doesn't overlap with existing slots
     */
    validateAvailabilitySlot: (
        mentorId: string,
        day: string,
        startTime: string,
        duration: number,
        excludeSlotId?: string
    ): void => {
        const mentors = getStore<Mentor[]>('mentors', INITIAL_MENTORS);
        const mentor = mentors.find(m => m.id === mentorId);

        if (!mentor || !mentor.availability) return;

        const newStart = new Date(`2000-01-01T${startTime}`);
        const newEnd = new Date(newStart.getTime() + duration * 60 * 1000);

        const overlapping = mentor.availability.find(slot => {
            if (slot.day !== day) return false;
            if (excludeSlotId && slot.id === excludeSlotId) return false;

            const existingStart = new Date(`2000-01-01T${slot.startTime}`);
            const existingEnd = new Date(existingStart.getTime() + slot.duration * 60 * 1000);

            // Check for overlap
            return (newStart < existingEnd && newEnd > existingStart);
        });

        if (overlapping) {
            throw new Error(
                `Availability slot overlaps with existing slot: ${day} ${overlapping.startTime} (${overlapping.duration} min)`
            );
        }
    },

    /**
     * ✅ FIX BUG #37: Validate and normalize timezone
     */
    validateTimezone: (timezone: string): string => {
        try {
            // Test if timezone is valid by creating a date formatter
            Intl.DateTimeFormat(undefined, { timeZone: timezone });
            return timezone;
        } catch (e) {
            throw new Error(`Invalid timezone: ${timezone}`);
        }
    },

    /**
     * Validate user registration data
     */
    validateRegistration: (data: {
        name: string;
        email: string;
        password: string;
        role: string;
        country?: string;
        timezone?: string;
    }): void => {
        // Name validation
        if (!data.name || data.name.trim().length === 0) {
            throw new Error('Name is required');
        }
        if (data.name.length < 2 || data.name.length > 100) {
            throw new Error('Name must be between 2 and 100 characters');
        }

        // Email validation
        validationService.validateEmailFormat(data.email);

        // Password validation
        if (!data.password || data.password.length === 0) {
            throw new Error('Password is required');
        }
        if (data.password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        // Role validation
        const validRoles = ['MENTEE', 'MENTOR', 'PROVIDER', 'ADMIN'];
        if (!validRoles.includes(data.role)) {
            throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
        }

        // Timezone validation (if provided)
        if (data.timezone) {
            validationService.validateTimezone(data.timezone);
        }
    },

    /**
     * Validate booking creation data
     */
    validateBookingCreation: (data: {
        menteeId: string;
        mentorId: string;
        startTime: string;
        duration: number;
        cost: number;
    }): void => {
        if (!data.menteeId || !data.mentorId) {
            throw new Error('Mentee ID and Mentor ID are required');
        }

        if (data.menteeId === data.mentorId) {
            throw new Error('Cannot book a lesson with yourself');
        }

        validationService.validateCreditAmount(data.cost, 'booking');

        if (!data.startTime) {
            throw new Error('Start time is required');
        }

        const startDate = new Date(data.startTime);
        if (isNaN(startDate.getTime())) {
            throw new Error('Invalid start time format');
        }
    },

    /**
     * Validate payout request
     */
    validatePayoutRequest: (amount: number, method: string, minThreshold: number = 50): void => {
        validationService.validateCreditAmount(amount, 'payout');

        if (amount < minThreshold) {
            throw new Error(`Minimum payout amount is ${minThreshold} credits`);
        }

        const validMethods = ['PayPal', 'Bank Transfer', 'Wise', 'Stripe'];
        if (!validMethods.includes(method)) {
            throw new Error(`Invalid payout method. Must be one of: ${validMethods.join(', ')}`);
        }
    },

    /**
     * Validate phone number format
     */
    validatePhoneNumber: (phone: string): boolean => {
        // Simple international phone validation
        const regex = /^\+?[1-9]\d{1,14}$/;
        return regex.test(phone.replace(/[\s-()]/g, ''));
    },

    /**
     * Validate URL format
     */
    validateUrl: (url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Validate rating (1-5)
     */
    validateRating: (rating: number): void => {
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            throw new Error('Rating must be an integer between 1 and 5');
        }
    },

    /**
     * Validate subscription plan purchase
     */
    validateSubscriptionPurchase: (
        menteeId: string,
        mentorId: string,
        planId: string
    ): void => {
        if (!menteeId || !mentorId || !planId) {
            throw new Error('Mentee ID, Mentor ID, and Plan ID are required');
        }

        if (menteeId === mentorId) {
            throw new Error('Cannot purchase subscription for yourself as a mentor');
        }
    },

    /**
     * Validate date range
     */
    validateDateRange: (startDate: string, endDate: string): void => {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('Invalid date format');
        }

        if (end <= start) {
            throw new Error('End date must be after start date');
        }
    }
};
