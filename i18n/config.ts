/**
 * i18n Configuration - Lingofys
 * Multi-language support for English, Vietnamese, Japanese, Chinese
 * Following LESSONS_LEARNED: "Plan before implementing, grep before action"
 * 
 * Note: This requires installing dependencies:
 * npm install i18next react-i18next i18next-browser-languagedetector
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en.json';
import viTranslations from './locales/vi.json';
import jaTranslations from './locales/ja.json';
import zhTranslations from './locales/zh.json';

// Language resources
const resources = {
  en: {
    translation: enTranslations
  },
  vi: {
    translation: viTranslations
  },
  ja: {
    translation: jaTranslations
  },
  zh: {
    translation: zhTranslations
  }
};

// Initialize i18next
i18n
  .use(LanguageDetector) // Detect user language automatically
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Fallback language
    debug: false, // Set to true for development debugging
    
    interpolation: {
      escapeValue: false // React already escapes values
    },
    
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'lingofys_language'
    },
    
    // Return null for missing keys instead of key name
    returnNull: false,
    
    // Namespace configuration
    ns: ['translation'],
    defaultNS: 'translation'
  });

export default i18n;

// Helper function to get current language display name
export const getLanguageDisplayName = (code: string): string => {
  const names: Record<string, string> = {
    en: 'English',
    vi: 'Tiếng Việt',
    ja: '日本語',
    zh: '中文'
  };
  return names[code] || 'English';
};

// Helper function to get language flag emoji
export const getLanguageFlag = (code: string): string => {
  const flags: Record<string, string> = {
    en: '🇺🇸',
    vi: '🇻🇳',
    ja: '🇯🇵',
    zh: '🇨🇳'
  };
  return flags[code] || '🇺🇸';
};

// Available languages
export const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' }
] as const;
