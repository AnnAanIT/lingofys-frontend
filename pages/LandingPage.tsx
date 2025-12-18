import React, { useEffect } from 'react';
import { 
  Navbar, Hero, HowItWorks, MentorShowcase, 
  PricingPreview, AffiliateSection, Reviews, FAQ, Footer 
} from '../components/landing/Sections';

export default function LandingPage() {
  
  // Simulated Metadata / SEO
  useEffect(() => {
    document.title = "English Learning Platform | 1:1 Mentors | Learn English Online";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', "Learn English with professional mentors from Japan, Korea, China, and Vietnam. Flexible scheduling with credits or monthly subscriptions.");
    }
  }, []);

  return (
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
    </div>
  );
}
