/**
 * Authentication & Authorization Guards
 *
 * Fixes CRITICAL BUG #6: No permission checks on admin operations
 *
 * Usage:
 *   authGuard.requireAdmin(currentUser); // Throws if not admin
 *   authGuard.requireOwnership(currentUser, resourceOwnerId); // Throws if not owner/admin
 */

import { User, UserRole } from '../../types';

export class PermissionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PermissionError';
    }
}

export const authGuard = {
    /**
     * Ensures user is authenticated
     */
    requireAuth(user: User | null): void {
        if (!user) {
            throw new PermissionError('Authentication required. Please log in.');
        }
    },

    /**
     * Ensures user is an ADMIN
     */
    requireAdmin(user: User | null): void {
        this.requireAuth(user);
        if (!user || user.role !== UserRole.ADMIN) {
            throw new PermissionError('Admin access required. This operation is restricted to administrators.');
        }
    },

    /**
     * Ensures user is a MENTOR
     */
    requireMentor(user: User | null): void {
        this.requireAuth(user);
        if (!user || user.role !== UserRole.MENTOR) {
            throw new PermissionError('Mentor access required.');
        }
    },

    /**
     * Ensures user is a PROVIDER
     */
    requireProvider(user: User | null): void {
        this.requireAuth(user);
        if (!user || user.role !== UserRole.PROVIDER) {
            throw new PermissionError('Provider access required.');
        }
    },

    /**
     * Ensures user is either the resource owner OR an admin
     */
    requireOwnership(user: User | null, resourceOwnerId: string): void {
        this.requireAuth(user);
        if (!user || (user.id !== resourceOwnerId && user.role !== UserRole.ADMIN)) {
            throw new PermissionError('Access denied. You do not have permission to access this resource.');
        }
    },

    /**
     * Ensures user is MENTEE (for booking creation, etc.)
     */
    requireMentee(user: User | null): void {
        this.requireAuth(user);
        if (!user || user.role !== UserRole.MENTEE) {
            throw new PermissionError('Mentee access required.');
        }
    },

    /**
     * Ensures user has one of the allowed roles
     */
    requireAnyRole(user: User | null, allowedRoles: UserRole[]): void {
        this.requireAuth(user);
        if (!user || !allowedRoles.includes(user.role)) {
            throw new PermissionError(`Access denied. Required role: ${allowedRoles.join(' or ')}`);
        }
    },

    /**
     * Check if user is admin (returns boolean, doesn't throw)
     */
    isAdmin(user: User | null): boolean {
        return user?.role === UserRole.ADMIN;
    },

    /**
     * Check if user owns resource or is admin (returns boolean)
     */
    canAccess(user: User | null, resourceOwnerId: string): boolean {
        if (!user) return false;
        return user.id === resourceOwnerId || user.role === UserRole.ADMIN;
    },

    /**
     * Prevents users from deleting themselves (admin safety)
     */
    preventSelfDeletion(user: User | null, targetUserId: string): void {
        this.requireAuth(user);
        if (user.id === targetUserId) {
            throw new PermissionError('Cannot delete your own account. Please contact another administrator.');
        }
    },

    /**
     * Validates that mentor can manage their own availability
     */
    requireMentorOwnership(user: User | null, mentorId: string): void {
        this.requireAuth(user);
        if (!user || (user.role !== UserRole.MENTOR && user.role !== UserRole.ADMIN)) {
            throw new PermissionError('Only mentors can manage availability.');
        }
        if (user.role === UserRole.MENTOR && user.id !== mentorId) {
            throw new PermissionError('Cannot manage another mentor\'s availability.');
        }
    },

    /**
     * Validates booking access (mentee, mentor, or admin)
     */
    requireBookingAccess(user: User | null, booking: { menteeId: string; mentorId: string }): void {
        this.requireAuth(user);
        if (!user) {
            throw new PermissionError('Authentication required.');
        }
        const hasAccess =
            user.id === booking.menteeId ||
            user.id === booking.mentorId ||
            user.role === UserRole.ADMIN;

        if (!hasAccess) {
            throw new PermissionError('Access denied. You are not authorized to view this booking.');
        }
    },

    /**
     * Validates provider can only manage their own commissions
     */
    requireProviderOwnership(user: User | null, providerId: string): void {
        this.requireAuth(user);
        if (!user || (user.role !== UserRole.PROVIDER && user.role !== UserRole.ADMIN)) {
            throw new PermissionError('Only providers can view commission data.');
        }
        if (user.role === UserRole.PROVIDER && user.id !== providerId) {
            throw new PermissionError('Cannot view another provider\'s commissions.');
        }
    }
};
