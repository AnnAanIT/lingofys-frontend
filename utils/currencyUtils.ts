/**
 * Currency Utilities
 *
 * Handles currency formatting, country-to-currency mapping, and price calculations
 * for the multi-currency top-up system.
 */

import { CurrencyConfig } from '../types';

/**
 * Format amount with currency symbol and proper locale
 */
export const formatCurrency = (amount: number, currencyConfig: CurrencyConfig): string => {
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  if (currencyConfig.symbolPosition === 'before') {
    return `${currencyConfig.symbol}${formattedAmount}`;
  } else {
    return `${formattedAmount}${currencyConfig.symbol}`;
  }
};

/**
 * Map country code to default currency code
 * Returns 'USD' if country not found
 */
export const getCurrencyCodeByCountry = (country?: string): string => {
  if (!country) return 'USD';

  const countryToCurrency: Record<string, string> = {
    'VN': 'VND',
    'Vietnam': 'VND',
    'JP': 'JPY',
    'Japan': 'JPY',
    'US': 'USD',
    'USA': 'USD',
    'United States': 'USD',
    'GB': 'USD',
    'UK': 'USD',
    'United Kingdom': 'USD',
    'KR': 'USD',
    'South Korea': 'USD',
    'CN': 'USD',
    'China': 'USD'
  };

  return countryToCurrency[country] || 'USD';
};

/**
 * Calculate local price from credits
 * Formula: (credits / conversionRatio) * exchangeRate
 *
 * Example: 40 credits, ratio 0.8, VND exchange rate 25000
 * => (40 / 0.8) * 25000 = 50 * 25000 = 1,250,000 VND
 */
export const calculateLocalPrice = (
  credits: number,
  conversionRatio: number,
  exchangeRate: number
): number => {
  // ✅ FIX BUG: Validate inputs to prevent division by zero and invalid calculations
  if (conversionRatio <= 0) {
    console.error('Invalid conversionRatio:', conversionRatio);
    return 0; // Return 0 instead of Infinity to prevent UI breaking
  }
  if (exchangeRate <= 0) {
    console.error('Invalid exchangeRate:', exchangeRate);
    return 0;
  }

  const usdPrice = credits / conversionRatio;
  return Math.round(usdPrice * exchangeRate);
};

/**
 * Get user's preferred currency from localStorage
 * Falls back to country-based detection if not set
 */
export const getUserPreferredCurrency = (userCountry?: string): string => {
  // ✅ FIX BUG: Add error handling for localStorage access
  try {
    const saved = localStorage.getItem('preferredCurrency');
    if (saved) return saved;
  } catch (e) {
    console.error('Failed to read currency preference from localStorage:', e);
    // Fall through to country-based detection
  }

  return getCurrencyCodeByCountry(userCountry);
};

/**
 * Save user's preferred currency to localStorage
 */
export const saveUserPreferredCurrency = (currencyCode: string): void => {
  // ✅ FIX BUG: Add error handling for localStorage quota exceeded
  try {
    localStorage.setItem('preferredCurrency', currencyCode);
  } catch (e) {
    console.error('Failed to save currency preference to localStorage:', e);
    // Continue execution - this is not critical for app functionality
  }
};
