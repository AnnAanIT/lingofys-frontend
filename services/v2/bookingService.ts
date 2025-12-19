/**
 * Booking Service V2
 *
 * Fixes:
 * - CRITICAL BUG #10: Invalid status transitions (can refund after release)
 * - Integrates with creditEngineV2 and subscriptionService
 *
 * Usage:
 *   await bookingService.createBooking(currentUser, bookingData);
 *   await bookingService.updateBookingStatus(currentUser, bookingId, 'COMPLETED');
 */

import {
    User,
    Booking,
    BookingStatus,
    UserRole
} from '../../types';
import {
    INITIAL_BOOKINGS
} from '../../mockData';
import { authGuard } from './authGuard';
import { creditEngineV2 } from '../../lib/v2/creditEngine';
import { subscriptionService } from './subscriptionService';
import { lockManager } from '../../utils/lockManager';

// --- HELPERS FOR LOCAL STORAGE SIMULATION ---
const getStore = <T>(key: string, initial: T): T => {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : initial;
};

const setStore = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// ✅ FIX BUG #10: Define allowed status transitions
const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
    [BookingStatus.SCHEDULED]: [
        BookingStatus.COMPLETED,
        BookingStatus.CANCELLED,
        BookingStatus.NO_SHOW,
        BookingStatus.RESCHEDULED,
        BookingStatus.DISPUTED
    ],
    [BookingStatus.COMPLETED]: [BookingStatus.DISPUTED],
    [BookingStatus.CANCELLED]: [], // Final state
    [BookingStatus.NO_SHOW]: [BookingStatus.DISPUTED],
    [BookingStatus.RESCHEDULED]: [
        BookingStatus.COMPLETED,
        BookingStatus.CANCELLED,
        BookingStatus.NO_SHOW,
        BookingStatus.DISPUTED
    ],
    [BookingStatus.DISPUTED]: [BookingStatus.COMPLETED, BookingStatus.REFUNDED],
    [BookingStatus.REFUNDED]: [] // Final state
};

export const bookingService = {
    /**
     * Create a new booking
     */
    createBooking: async (
        currentUser: User | null,
        bookingData: {
            menteeId: string;
            mentorId: string;
            mentorName: string;
            menteeName: string;
            startTime: string;
            endTime: string;
            totalCost: number;
            type: 'credit' | 'subscription';
            subscriptionId?: string;
            notes?: string;
        }
    ): Promise<Booking> => {
        // Permission check - must be mentee or admin
        authGuard.requireAnyRole(currentUser, [UserRole.MENTEE, UserRole.ADMIN]);

        if (currentUser?.role === UserRole.MENTEE && currentUser.id !== bookingData.menteeId) {
            throw new Error('Cannot create booking for another mentee');
        }

        const bookingId = `bk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

        // Create booking object
        const newBooking: Booking = {
            id: bookingId,
            ...bookingData,
            status: BookingStatus.SCHEDULED,
            creditStatus: 'pending'
        };

        // Handle credit/subscription logic
        if (bookingData.type === 'subscription') {
            if (!bookingData.subscriptionId) {
                throw new Error('Subscription ID required for subscription bookings');
            }

            // ✅ Use fixed subscription service
            await subscriptionService.useSubscriptionForBooking(
                bookingData.menteeId,
                bookingData.mentorId,
                bookingId
            );

            // Subscription bookings don't hold credits
            newBooking.creditStatus = 'released';
        } else {
            // ✅ Use fixed credit engine to hold credits
            await creditEngineV2.holdCreditOnBooking(
                bookingId,
                bookingData.menteeId,
                bookingData.totalCost
            );
        }

        // Save booking
        const bookings = getStore<Booking[]>('bookings', INITIAL_BOOKINGS);
        bookings.push(newBooking);
        setStore('bookings', bookings);

        return newBooking;
    },

    /**
     * Update booking status (FIXED: Now validates transitions)
     */
    updateBookingStatus: async (
        currentUser: User | null,
        bookingId: string,
        newStatus: BookingStatus,
        additionalData?: {
            rating?: number;
            review?: string;
            disputeReason?: string;
            disputeEvidence?: string;
            resolutionNote?: string;
        }
    ): Promise<Booking> => {
        authGuard.requireAuth(currentUser);

        return lockManager.acquireLock(`booking:${bookingId}`, async () => {
            const bookings = getStore<Booking[]>('bookings', INITIAL_BOOKINGS);
            const bookingIdx = bookings.findIndex(b => b.id === bookingId);

            if (bookingIdx === -1) throw new Error('Booking not found');

            const booking = bookings[bookingIdx];
            const currentStatus = booking.status;

            // Permission check
            authGuard.requireBookingAccess(currentUser, booking);

            // ✅ FIX BUG #10: Validate status transition
            const allowedTransitions = ALLOWED_TRANSITIONS[currentStatus];
            if (!allowedTransitions.includes(newStatus)) {
                throw new Error(
                    `Invalid status transition: ${currentStatus} → ${newStatus}. Allowed: ${allowedTransitions.join(', ')}`
                );
            }

            // Update status
            booking.status = newStatus;

            // Handle status-specific logic
            switch (newStatus) {
                case BookingStatus.COMPLETED:
                    // Release credits to mentor (only for credit bookings)
                    if (booking.type === 'credit' && booking.creditStatus === 'pending') {
                        await creditEngineV2.releaseCreditToMentor(bookingId);
                        booking.creditStatus = 'released';
                    }

                    // Add rating/review if provided
                    if (additionalData?.rating) booking.rating = additionalData.rating;
                    if (additionalData?.review) booking.review = additionalData.review;
                    break;

                case BookingStatus.CANCELLED:
                case BookingStatus.NO_SHOW:
                    // Refund credits to mentee (only for credit bookings)
                    if (booking.type === 'credit' && booking.creditStatus === 'pending') {
                        await creditEngineV2.refundCreditToMentee(bookingId);
                        booking.creditStatus = 'refunded';
                    }

                    // Restore subscription session (only for subscription bookings)
                    if (booking.type === 'subscription') {
                        await subscriptionService.restoreSubscriptionSession(
                            booking.menteeId,
                            booking.mentorId,
                            bookingId
                        );
                    }
                    break;

                case BookingStatus.DISPUTED:
                    booking.disputeReason = additionalData?.disputeReason;
                    booking.disputeEvidence = additionalData?.disputeEvidence;
                    booking.disputeDate = new Date().toISOString();
                    break;

                case BookingStatus.REFUNDED:
                    // Admin resolved dispute in favor of mentee
                    if (booking.type === 'credit' && booking.creditStatus === 'released') {
                        // Credits already released to mentor - would need manual adjustment
                        console.error('[Booking] Cannot auto-refund - credits already released. Manual admin intervention required.');
                        throw new Error('Cannot refund - credits already released to mentor. Please contact administrator.');
                    }

                    booking.resolutionNote = additionalData?.resolutionNote;
                    booking.resolvedAt = new Date().toISOString();
                    break;
            }

            // Save updated booking
            setStore('bookings', bookings);

            return booking;
        });
    },

    /**
     * Get booking by ID
     */
    getBookingById: async (currentUser: User | null, bookingId: string): Promise<Booking> => {
        authGuard.requireAuth(currentUser);

        const bookings = getStore<Booking[]>('bookings', INITIAL_BOOKINGS);
        const booking = bookings.find(b => b.id === bookingId);

        if (!booking) throw new Error('Booking not found');

        // Permission check
        authGuard.requireBookingAccess(currentUser, booking);

        return booking;
    },

    /**
     * Get bookings for a mentee
     */
    getMenteeBookings: async (currentUser: User | null, menteeId: string): Promise<Booking[]> => {
        authGuard.requireOwnership(currentUser, menteeId);

        const bookings = getStore<Booking[]>('bookings', INITIAL_BOOKINGS);
        return bookings
            .filter(b => b.menteeId === menteeId)
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    },

    /**
     * Get bookings for a mentor
     */
    getMentorBookings: async (currentUser: User | null, mentorId: string): Promise<Booking[]> => {
        authGuard.requireOwnership(currentUser, mentorId);

        const bookings = getStore<Booking[]>('bookings', INITIAL_BOOKINGS);
        return bookings
            .filter(b => b.mentorId === mentorId)
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    },

    /**
     * Get all bookings (Admin only)
     */
    getAllBookings: async (currentUser: User | null): Promise<Booking[]> => {
        authGuard.requireAdmin(currentUser);

        const bookings = getStore<Booking[]>('bookings', INITIAL_BOOKINGS);
        return bookings.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    },

    /**
     * Reschedule a booking
     */
    rescheduleBooking: async (
        currentUser: User | null,
        bookingId: string,
        newStartTime: string,
        newEndTime: string
    ): Promise<Booking> => {
        authGuard.requireAuth(currentUser);

        const bookings = getStore<Booking[]>('bookings', INITIAL_BOOKINGS);
        const bookingIdx = bookings.findIndex(b => b.id === bookingId);

        if (bookingIdx === -1) throw new Error('Booking not found');

        const booking = bookings[bookingIdx];

        // Permission check
        authGuard.requireBookingAccess(currentUser, booking);

        // Only SCHEDULED or RESCHEDULED bookings can be rescheduled
        if (![BookingStatus.SCHEDULED, BookingStatus.RESCHEDULED].includes(booking.status)) {
            throw new Error(`Cannot reschedule booking with status: ${booking.status}`);
        }

        // Update times
        booking.startTime = newStartTime;
        booking.endTime = newEndTime;
        booking.status = BookingStatus.RESCHEDULED;

        setStore('bookings', bookings);

        return booking;
    },

    /**
     * Validate status transition (helper)
     */
    canTransitionTo: (currentStatus: BookingStatus, newStatus: BookingStatus): boolean => {
        return ALLOWED_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
    },

    /**
     * Get allowed transitions for a status (helper)
     */
    getAllowedTransitions: (currentStatus: BookingStatus): BookingStatus[] => {
        return ALLOWED_TRANSITIONS[currentStatus] || [];
    }
};
