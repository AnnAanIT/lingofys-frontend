import React from 'react';
import {
  Navbar, Hero, HowItWorks, MentorShowcase,
  PricingPreview, AffiliateSection, Reviews, FAQ, Footer
} from '../components/landing/Sections';
import { FloatingContact } from '../components/FloatingContact';
import SEOHead from '../components/SEOHead';
import '../i18n/config'; // Initialize i18n

export default function LandingPage() {
  return (
    <>
      <SEOHead page="landing" />
      <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-brand-100 selection:text-brand-900">
        <Navbar />
        <main>
          <Hero />
          <HowItWorks />
          <MentorShowcase />
          <PricingPreview />
          <AffiliateSection />
          <Reviews />
          <FAQ />
        </main>
        <Footer />
        <FloatingContact />
      </div>
    </>
  );
}
