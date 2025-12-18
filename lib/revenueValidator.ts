
import { Booking } from '../types';

export function validateBookingRevenue(booking: Booking): void {
    const { totalCost } = booking;

    // Check: Total Cost must be non-negative
    if ((totalCost || 0) < 0) {
        throw new Error(`Negative Total Cost for booking ${booking.id}`);
    }
    
    // In the pure credit model, we don't store split breakdown on the booking object itself anymore.
    // The validation here is simplified to basic data integrity.
}
