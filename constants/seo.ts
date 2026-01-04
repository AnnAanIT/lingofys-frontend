/**
 * SEO Configuration - Lingofys
 * Centralized SEO settings for meta tags, structured data, and social media
 * Following LESSONS_LEARNED: "Centralize configuration, avoid hardcoding"
 */

import { BRAND } from './brand';

export const SEO_CONFIG = {
  // Default meta tags
  defaultTitle: 'Lingofys - Learn English, Japanese & Chinese Online',
  titleTemplate: '%s | Lingofys',
  defaultDescription: 
    'Master English, Japanese, or Chinese through 1:1 online lessons with verified professional teachers. ' +
    'Flexible scheduling, affordable pricing, personalized learning. Start your language journey today!',
  
  // Site information
  siteUrl: 'https://lingofys.com',
  defaultImage: '/assets/og-image.jpg', // 1200x630 for social media
  twitterHandle: '@lingofys',
  
  // Supported languages for hreflang
  languages: ['en', 'vi', 'ja', 'zh'],
  defaultLanguage: 'en',
  
  // Keywords for meta tags
  keywords: [
    'learn english online',
    'learn japanese online',
    'learn chinese online',
    '1:1 language lessons',
    'online language tutors',
    'english teacher online',
    'japanese teacher online',
    'chinese teacher online',
    'language learning platform',
  ],
  
  // Structured data - Organization
  organization: {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: BRAND.name,
    alternateName: 'Lingofys Language Learning',
    url: 'https://lingofys.com',
    logo: 'https://lingofys.com/assets/logo.svg',
    description: BRAND.shortDescription,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Ho Chi Minh City',
      addressCountry: 'VN',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: BRAND.contact.email,
      contactType: 'Customer Service',
      availableLanguage: ['English', 'Vietnamese', 'Japanese', 'Chinese'],
    },
    sameAs: [
      BRAND.social.facebook,
      BRAND.social.instagram,
      BRAND.social.twitter,
      BRAND.social.linkedin,
      BRAND.social.youtube,
    ],
  },
  
  // Structured data - WebSite
  website: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND.name,
    url: 'https://lingofys.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://lingofys.com/find-mentor?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    description: BRAND.shortDescription,
  },
} as const;

// Helper function to generate page-specific SEO
export const generatePageSEO = (page: string) => {
  const seoMap: Record<string, { title: string; description: string }> = {
    landing: {
      title: SEO_CONFIG.defaultTitle,
      description: SEO_CONFIG.defaultDescription,
    },
    'find-mentor': {
      title: 'Find Your Perfect Language Teacher',
      description: 'Browse verified English, Japanese, and Chinese teachers. Filter by specialty, availability, and price. Book your first lesson today!',
    },
    'become-mentor': {
      title: 'Become a Language Teacher - Teach Online',
      description: 'Join Lingofys as a language teacher. Earn money teaching English, Japanese, or Chinese online. Flexible hours, global students.',
    },
    pricing: {
      title: 'Pricing - Flexible Plans for Every Learner',
      description: 'Choose between pay-as-you-go credits or monthly subscriptions. Transparent pricing, no hidden fees. Start from $8/lesson.',
    },
    about: {
      title: 'About Us - Language Learning Made Personal',
      description: 'Learn about Lingofys mission to connect language learners with expert teachers worldwide. Quality education, personalized approach.',
    },
  };

  return seoMap[page] || { title: SEO_CONFIG.defaultTitle, description: SEO_CONFIG.defaultDescription };
};

// Helper to generate course structured data
export const generateCourseSchema = (language: 'English' | 'Japanese' | 'Chinese') => ({
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: `${language} Language Course - 1:1 Online Lessons`,
  description: `Learn ${language} online with professional native teachers. Personalized 1:1 lessons, flexible scheduling, affordable pricing.`,
  provider: {
    '@type': 'Organization',
    name: BRAND.name,
    sameAs: SEO_CONFIG.siteUrl,
  },
  educationalLevel: 'All Levels',
  teaches: `${language} Language`,
  courseMode: 'Online',
  hasCourseInstance: {
    '@type': 'CourseInstance',
    courseMode: 'Online',
    courseWorkload: 'PT1H', // 1 hour lessons
  },
});
