/**
 * Brand Constants - Lingofys
 * Centralized brand configuration to avoid hardcoding
 * Following LESSONS_LEARNED: "Centralize configuration, avoid hardcoding"
 */

export const BRAND = {
  name: 'Lingofys',
  tagline: 'Master Languages Through 1:1 Expert Mentorship',
  shortDescription: 'Learn English, Japanese, and Chinese with verified professional teachers',
  
  logo: {
    // SVG logo embedded as data URL for no external dependencies
    fullLogo: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 120'%3E%3Ctext x='20' y='80' font-family='Arial Black' font-size='64' font-weight='900' fill='%232563EB'%3ELingofys%3C/text%3E%3Ccircle cx='340' cy='60' r='35' fill='%2310B981' opacity='0.2'/%3E%3Ccircle cx='350' cy='50' r='15' fill='%23F59E0B'/%3E%3Ccircle cx='330' cy='55' r='10' fill='%23F59E0B' opacity='0.6'/%3E%3Ccircle cx='360' cy='65' r='8' fill='%23F59E0B' opacity='0.4'/%3E%3C/svg%3E`,
    icon: 'L', // First letter for favicon/icon
    iconBgColor: '#2563EB', // Blue from Lingofys brand
    iconTextColor: '#ffffff',
    alt: 'Lingofys - Global Language Learning Platform'
  },
  
  colors: {
    // Extracted from Lingofys brand identity
    primary: '#2563EB',   // Blue - main brand color
    secondary: '#F59E0B', // Orange - accent from logo
    accent: '#10B981',    // Green - success/growth
    gradient: {
      primary: 'from-blue-600 to-blue-500',
      secondary: 'from-orange-500 to-red-500',
      hero: 'from-blue-50 via-white to-orange-50'
    }
  },
  
  animations: {
    // CSS animation classes (defined in global styles)
    logoEntrance: 'animate-[pop-in_0.6s_ease-out]',
    buttonHover: 'hover:scale-105 active:scale-95 transition-transform duration-200',
    inputFocus: 'focus:scale-[1.02] transition-transform duration-200',
    fadeIn: 'animate-fade-in',
    slideUp: 'animate-slide-up',
    pulse: 'animate-pulse'
  },
  
  social: {
    facebook: 'https://facebook.com/lingofys',
    instagram: 'https://instagram.com/lingofys',
    twitter: 'https://twitter.com/lingofys',
    linkedin: 'https://linkedin.com/company/lingofys',
    youtube: 'https://youtube.com/@lingofys',
  },
  
  contact: {
    email: 'hello@lingofys.com',
    supportEmail: 'support@lingofys.com',
    phone: '+84-xxx-xxx-xxx',
    address: 'Ho Chi Minh City, Vietnam',
  },
  
  // Referral URL template
  getReferralUrl: (referralCode: string) => {
    return `https://lingofys.com/?ref=${referralCode}`;
  },
  
  // Support channel name
  supportChannelName: 'Lingofys Official Support Channel',
} as const;

// Brand display component helper
export const getBrandDisplay = () => ({
  name: BRAND.name,
  tagline: BRAND.tagline,
  copyright: `© ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.`,
});
