/**
 * Centralized Date/Time Formatting Utilities
 * 
 * Provides consistent date and time formatting across all screens
 * to ensure UI consistency.
 */

/**
 * Format booking date (e.g., "Mon, Jan 15")
 * Used in booking cards, modals, and lists
 */
export const formatBookingDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

/**
 * Format booking time (e.g., "14:30" or "02:30 PM" based on format)
 * Default: 24-hour format, always 2 digits
 */
export const formatBookingTime = (date: Date | string, use12Hour: boolean = false): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: use12Hour // Can be 12-hour or 24-hour format
  });
};

/**
 * Format booking date and time (e.g., "Mon, Jan 15 14:30")
 */
export const formatBookingDateTime = (date: Date | string): string => {
  return `${formatBookingDate(date)} ${formatBookingTime(date)}`;
};

/**
 * Format date only (e.g., "Jan 15, 2025")
 * Used in feedback cards, homework due dates
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'short', 
    day: 'numeric' 
  });
};

/**
 * Format date with time (e.g., "Jan 15, 2025, 02:30 PM")
 * Used in feedback view modals, detailed views
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true // 12-hour format with AM/PM
  });
};

/**
 * Format short date (e.g., "Jan 15")
 * Used in compact views, calendar
 */
export const formatShortDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};

/**
 * Format month and day only (e.g., "Jan 15")
 * Used in date badges
 */
export const formatMonthDay = (date: Date | string): { month: string, day: number } => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }),
    day: d.getDate()
  };
};

/**
 * Format time range (e.g., "14:30 - 15:00")
 */
export const formatTimeRange = (startTime: Date | string, endTime: Date | string): string => {
  return `${formatBookingTime(startTime)} - ${formatBookingTime(endTime)}`;
};
