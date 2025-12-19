/**
 * Helper Utilities
 *
 * Fixes:
 * - BUG #40: API_DELAY hardcoded (unnecessary fake delay)
 * - BUG #41: No error handling for localStorage full
 * - BUG #48: No request timeout handling
 * - BUG #49: Transaction ID collision possible
 * - BUG #53: setStore() doesn't handle circular references
 *
 * Usage:
 *   const id = helpers.generateUniqueId('tx');
 *   helpers.safeSetStore('key', data);
 *   await helpers.withTimeout(promise, 5000);
 */

// ✅ FIX BUG #49: Generate collision-resistant unique IDs
export const generateUniqueId = (prefix: string = 'id'): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extra = Math.random().toString(36).substring(2, 9);
    const counter = (globalThis as any).__idCounter || 0;
    (globalThis as any).__idCounter = counter + 1;

    return `${prefix}_${timestamp}_${random}${extra}_${counter}`;
};

// ✅ FIX BUG #41: Safe localStorage operations with error handling
export const safeGetStore = <T>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        if (!item) return defaultValue;
        return JSON.parse(item);
    } catch (error) {
        console.error(`Error reading from localStorage (key: ${key}):`, error);
        return defaultValue;
    }
};

// ✅ FIX BUG #53: Safe localStorage set with circular reference handling
export const safeSetStore = (key: string, value: any): boolean => {
    try {
        // Detect circular references
        const seen = new WeakSet();
        const json = JSON.stringify(value, (k, v) => {
            if (typeof v === 'object' && v !== null) {
                if (seen.has(v)) {
                    return '[Circular Reference]';
                }
                seen.add(v);
            }
            return v;
        });

        localStorage.setItem(key, json);
        return true;
    } catch (error: any) {
        // ✅ FIX BUG #41: Handle QuotaExceededError
        if (error.name === 'QuotaExceededError') {
            console.error('localStorage quota exceeded. Attempting cleanup...');

            // Try to clear old data
            try {
                const keysToRemove: string[] = [];

                // Remove old cache entries (if any)
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && k.startsWith('cache_')) {
                        keysToRemove.push(k);
                    }
                }

                keysToRemove.forEach(k => localStorage.removeItem(k));

                // Try again
                const json = JSON.stringify(value);
                localStorage.setItem(key, json);
                return true;
            } catch (retryError) {
                console.error('Failed to save to localStorage even after cleanup');
                alert('Storage is full. Please clear your browser data or contact support.');
                return false;
            }
        }

        console.error(`Error writing to localStorage (key: ${key}):`, error);
        return false;
    }
};

// ✅ FIX BUG #48: Promise timeout wrapper
export const withTimeout = <T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage: string = 'Operation timed out'
): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
        )
    ]);
};

// ✅ FIX BUG #40: Configurable API delay (can be disabled)
export const createApiCall = (delayMs: number = 0) => {
    return async <T>(fn: () => T | Promise<T>): Promise<T> => {
        if (delayMs > 0) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        try {
            return await fn();
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    };
};

// Format currency
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency
    }).format(amount);
};

// Format date
export const formatDate = (date: string | Date, includeTime: boolean = false): string => {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (includeTime) {
        return d.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;

    return formatDate(d);
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    waitMs: number
): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), waitMs);
    };
};

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limitMs: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limitMs);
        }
    };
};

// Deep clone object
export const deepClone = <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') return obj;

    try {
        return JSON.parse(JSON.stringify(obj));
    } catch (error) {
        console.error('Deep clone failed:', error);
        return obj;
    }
};

// Check if object is empty
export const isEmpty = (obj: any): boolean => {
    if (obj === null || obj === undefined) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
};

// Retry function with exponential backoff
export const retry = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
): Promise<T> => {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
            }
        }
    }

    throw lastError!;
};

// Chunk array into smaller arrays
export const chunk = <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

// Group array by key
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
    return array.reduce((groups, item) => {
        const groupKey = String(item[key]);
        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(item);
        return groups;
    }, {} as Record<string, T[]>);
};

// Sort array by multiple keys
export const sortBy = <T>(array: T[], ...keys: (keyof T)[]): T[] => {
    return [...array].sort((a, b) => {
        for (const key of keys) {
            if (a[key] < b[key]) return -1;
            if (a[key] > b[key]) return 1;
        }
        return 0;
    });
};

// Calculate percentage
export const calculatePercentage = (value: number, total: number): number => {
    if (total === 0) return 0;
    return Number(((value / total) * 100).toFixed(2));
};

// Truncate string
export const truncate = (str: string, length: number, suffix: string = '...'): string => {
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
};

// Sleep utility
export const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// Check if value is valid number
export const isValidNumber = (value: any): boolean => {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

// Clamp number between min and max
export const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
};

// Generate random number between min and max
export const randomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Check if date is today
export const isToday = (date: Date | string): boolean => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return d.toDateString() === today.toDateString();
};

// Get start of day
export const getStartOfDay = (date: Date = new Date()): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

// Get end of day
export const getEndOfDay = (date: Date = new Date()): Date => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
};

// Calculate days between dates
export const daysBetween = (date1: Date | string, date2: Date | string): number => {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Export all helpers as default object
export default {
    generateUniqueId,
    safeGetStore,
    safeSetStore,
    withTimeout,
    createApiCall,
    formatCurrency,
    formatDate,
    formatRelativeTime,
    debounce,
    throttle,
    deepClone,
    isEmpty,
    retry,
    chunk,
    groupBy,
    sortBy,
    calculatePercentage,
    truncate,
    sleep,
    isValidNumber,
    clamp,
    randomInt,
    isToday,
    getStartOfDay,
    getEndOfDay,
    daysBetween
};
