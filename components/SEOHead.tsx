/**
 * SEOHead Component - Dynamic SEO with i18n
 * Implements Phase 3: Multi-language SEO with react-helmet-async
 * 
 * Features:
 * - Dynamic meta tags based on language
 * - Hreflang tags for multi-language support
 * - Open Graph tags for social media
 * - Twitter Card tags
 * - Structured data (JSON-LD)
 * - Canonical URL
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { SEO_CONFIG } from '../constants/seo';
import { BRAND } from '../constants/brand';

interface SEOHeadProps {
  /** Page type (landing, find-mentor, etc.) */
  page?: string;
  /** Override default title */
  title?: string;
  /** Override default description */
  description?: string;
  /** Override default image */
  image?: string;
  /** Additional keywords */
  keywords?: string[];
  /** Structured data JSON-LD */
  structuredData?: Record<string, any>;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  page = 'landing',
  title,
  description,
  image = SEO_CONFIG.defaultImage,
  keywords = [],
  structuredData,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  // Get page-specific SEO from translations
  const pageTitle = title || t(`seo.${page}.title`, SEO_CONFIG.defaultTitle);
  const pageDescription = description || t(`seo.${page}.description`, SEO_CONFIG.defaultDescription);
  
  // Combine default keywords with page-specific and additional keywords
  const allKeywords = [
    ...SEO_CONFIG.keywords,
    ...keywords,
    t('seo.keywords.english', 'learn english online'),
    t('seo.keywords.japanese', 'learn japanese online'),
    t('seo.keywords.chinese', 'learn chinese online'),
  ].join(', ');

  // Generate hreflang tags for all supported languages
  const hreflangTags = SEO_CONFIG.languages.map((lang) => ({
    rel: 'alternate' as const,
    hrefLang: lang,
    href: `${SEO_CONFIG.siteUrl}/${lang}`,
  }));

  // Add x-default for unmatched languages
  hreflangTags.push({
    rel: 'alternate' as const,
    hrefLang: 'x-default' as any,
    href: SEO_CONFIG.siteUrl,
  });

  // Canonical URL with current language
  const canonicalUrl = currentLang === 'en' 
    ? SEO_CONFIG.siteUrl 
    : `${SEO_CONFIG.siteUrl}/${currentLang}`;

  // Open Graph image with fallback
  const ogImage = image.startsWith('http') 
    ? image 
    : `${SEO_CONFIG.siteUrl}${image}`;

  // Structured data with current language
  const defaultStructuredData = page === 'landing' 
    ? [SEO_CONFIG.organization, SEO_CONFIG.website]
    : [SEO_CONFIG.organization];

  const jsonLd = structuredData 
    ? [...defaultStructuredData, structuredData]
    : defaultStructuredData;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <html lang={currentLang} />
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={allKeywords} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Hreflang Tags for Multi-language Support */}
      {hreflangTags.map((tag) => (
        <link 
          key={tag.hrefLang}
          rel={tag.rel}
          hrefLang={tag.hrefLang}
          href={tag.href}
        />
      ))}

      {/* Open Graph Tags for Social Media */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={BRAND.name} />
      <meta property="og:locale" content={currentLang === 'en' ? 'en_US' : currentLang === 'vi' ? 'vi_VN' : currentLang === 'ja' ? 'ja_JP' : 'zh_CN'} />
      
      {/* Alternate locales */}
      {SEO_CONFIG.languages
        .filter(lang => lang !== currentLang)
        .map((lang) => (
          <meta 
            key={`og:locale:${lang}`}
            property="og:locale:alternate" 
            content={lang === 'en' ? 'en_US' : lang === 'vi' ? 'vi_VN' : lang === 'ja' ? 'ja_JP' : 'zh_CN'} 
          />
        ))
      }

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={SEO_CONFIG.twitterHandle} />
      <meta name="twitter:creator" content={SEO_CONFIG.twitterHandle} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="author" content={BRAND.name} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content={currentLang} />

      {/* Structured Data (JSON-LD) */}
      {jsonLd.map((data, index) => (
        <script 
          key={`jsonld-${index}`}
          type="application/ld+json"
        >
          {JSON.stringify(data)}
        </script>
      ))}

      {/* Favicon - Using default favicon.ico, not BRAND.logo object */}
      <link rel="icon" href="/favicon.ico" />
    </Helmet>
  );
};

export default SEOHead;
