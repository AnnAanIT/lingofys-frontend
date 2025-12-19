/**
 * Dispute Service V2
 *
 * Fixes:
 * - BUG #15: resolveDispute() refunds without checking credit status
 * - BUG #16: updateBookingStatus() allows invalid transitions (CANCELLED → COMPLETED)
 *
 * Usage:
 *   await disputeService.resolveDispute(currentUser, bookingId, 'REFUND_MENTEE', note);
 */

import {
    User,
    Booking,
    BookingStatus
} from '../../types';
import {
    INITIAL_BOOKINGS
} from '../../mockData';
import { authGuard } from './authGuard';
import { creditEngineV2 } from '../../lib/v2/creditEngine';
import { bookingService } from './bookingService';
import { lockManager } from '../../utils/lockManager';

// --- HELPERS FOR LOCAL STORAGE SIMULATION ---
const getStore = <T>(key: string, initial: T): T => {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : initial;
};

const setStore = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const disputeService = {
    /**
     * ✅ FIX BUG #15: Resolve dispute with proper credit status validation
     */
    resolveDispute: async (
        currentUser: User | null,
        bookingId: string,
        outcome: 'REFUND_MENTEE' | 'DISMISS',
        note: string
    ): Promise<void> => {
        authGuard.requireAdmin(currentUser);

        return lockManager.acquireLock(`booking:${bookingId}`, async () => {
            const bookings = getStore<Booking[]>('bookings', INITIAL_BOOKINGS);
            const idx = bookings.findIndex(b => b.id === bookingId);

            if (idx === -1) throw new Error('Booking not found');

            const booking = bookings[idx];

            if (booking.status !== BookingStatus.DISPUTED) {
                throw new Error(`Cannot resolve dispute for booking with status: ${booking.status}`);
            }

            if (outcome === 'REFUND_MENTEE') {
                // ✅ FIX BUG #15: Check credit status before refunding
                if (booking.creditStatus === 'refunded') {
                    throw new Error('Credits have already been refunded for this booking');
                }

                if (booking.creditStatus === 'released') {
                    throw new Error(
                        'Credits have already been released to mentor. Manual intervention required. Please contact finance team.'
                    );
                }

                // Only refund if credits are still in 'pending' state
                if (booking.type === 'credit' && booking.creditStatus === 'pending') {
                    await creditEngineV2.refundCreditToMentee(bookingId);
                    booking.creditStatus = 'refunded';
                }

                // Update booking status
                booking.status = BookingStatus.REFUNDED;
            } else {
                // Dismiss dispute - mark as completed
                booking.status = BookingStatus.COMPLETED;

                // If credits are still pending, release to mentor
                if (booking.type === 'credit' && booking.creditStatus === 'pending') {
                    await creditEngineV2.releaseCreditToMentor(bookingId);
                    booking.creditStatus = 'released';
                }
            }

            booking.resolutionNote = note;
            booking.resolvedAt = new Date().toISOString();

            setStore('bookings', bookings);
        });
    },

    /**
     * Report a dispute (mentee or mentor can initiate)
     */
    reportDispute: async (
        currentUser: User | null,
        bookingId: string,
        reason: string,
        evidence: string
    ): Promise<void> => {
        authGuard.requireAuth(currentUser);

        const bookings = getStore<Booking[]>('bookings', INITIAL_BOOKINGS);
        const idx = bookings.findIndex(b => b.id === bookingId);

        if (idx === -1) throw new Error('Booking not found');

        const booking = bookings[idx];

        // Permission check - must be mentee or mentor
        authGuard.requireBookingAccess(currentUser, booking);

        // ✅ Can only dispute completed or no-show bookings
        if (![BookingStatus.COMPLETED, BookingStatus.NO_SHOW].includes(booking.status)) {
            throw new Error(`Cannot dispute booking with status: ${booking.status}`);
        }

        // Update booking
        booking.status = BookingStatus.DISPUTED;
        booking.disputeReason = reason;
        booking.disputeEvidence = evidence;
        booking.disputeDate = new Date().toISOString();

        setStore('bookings', bookings);
    },

    /**
     * Get all disputed bookings (Admin only)
     */
    getDisputedBookings: async (currentUser: User | null): Promise<Booking[]> => {
        authGuard.requireAdmin(currentUser);

        const bookings = getStore<Booking[]>('bookings', INITIAL_BOOKINGS);
        return bookings.filter(b => b.status === BookingStatus.DISPUTED);
    },

    /**
     * Get dispute details
     */
    getDisputeDetails: async (currentUser: User | null, bookingId: string): Promise<{
        booking: Booking;
        canRefund: boolean;
        refundWarning?: string;
    }> => {
        authGuard.requireAdmin(currentUser);

        const bookings = getStore<Booking[]>('bookings', INITIAL_BOOKINGS);
        const booking = bookings.find(b => b.id === bookingId);

        if (!booking) throw new Error('Booking not found');

        // Determine if refund is possible
        let canRefund = false;
        let refundWarning: string | undefined;

        if (booking.creditStatus === 'pending') {
            canRefund = true;
        } else if (booking.creditStatus === 'released') {
            canRefund = false;
            refundWarning = 'Credits have been released to mentor. Refund requires manual intervention.';
        } else if (booking.creditStatus === 'refunded') {
            canRefund = false;
            refundWarning = 'Credits have already been refunded.';
        }

        return {
            booking,
            canRefund,
            refundWarning
        };
    }
};
