import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowRight, CheckCircle2, Globe, Calendar, Video, 
  Users, Star, CreditCard, Award, ShieldCheck, UserCheck 
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, CardFooter, AccordionItem } from './LandingComponents';
import { BRAND } from '../../constants/brand';
import LanguageSelector from '../LanguageSelector';
import { api } from '../../services/api';
import type { Mentor, SubscriptionPlan, SystemSettings } from '../../types';
import { calculateLocalPrice, formatCurrency } from '../../utils/currencyUtils';

// --- NAVBAR ---
export const Navbar = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-2">
             <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold">{BRAND.logo.icon}</div>
             <span className="font-bold text-slate-900 text-xl tracking-tight">{BRAND.name}</span>
          </div>
          <div className="hidden md:flex space-x-8">
            <button onClick={() => scrollToSection('how-it-works')} className="text-slate-600 hover:text-brand-600 text-sm font-medium transition-colors">{t('nav.howItWorks')}</button>
            <button onClick={() => scrollToSection('mentors')} className="text-slate-600 hover:text-brand-600 text-sm font-medium transition-colors">{t('nav.mentors')}</button>
            <button onClick={() => scrollToSection('pricing')} className="text-slate-600 hover:text-brand-600 text-sm font-medium transition-colors">{t('nav.pricing')}</button>
          </div>
          <div className="flex items-center space-x-4">
            {/* Social Icons */}
            <div className="hidden md:flex items-center gap-2">
              <a
                href="https://www.facebook.com/people/Lingofys/61585671925299/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-blue-600 text-slate-600 hover:text-white transition-colors group"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="https://zalo.me/0988679780"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-blue-50 transition-colors group"
                aria-label="Zalo"
              >
                <div className="w-6 h-6 bg-[#0068FF] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white font-bold text-[10px]">Zalo</span>
                </div>
              </a>
            </div>
            <LanguageSelector />
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>{t('nav.login')}</Button>
            <Button size="sm" onClick={() => navigate('/login')}>{t('nav.getStarted')}</Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

// --- HERO SECTION ---
export const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentLangIndex, setCurrentLangIndex] = useState(0);
  const languages = [t('languages.english'), t('languages.japanese'), t('languages.chinese')];
  
  // Language rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLangIndex((prev) => (prev + 1) % languages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [languages.length]);

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-100/50 via-slate-50 to-slate-50"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-in space-y-8 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {t('hero.title', { language: '' })} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-sky-500 inline-block animate-pulse">
              {languages[currentLangIndex]}
            </span>{' '}
            {t('hero.titleHighlight')}
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t('hero.description')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="w-full sm:w-auto text-lg h-14" onClick={() => navigate('/find-mentor')}>
              {t('hero.ctaPrimary')} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg h-14" onClick={() => navigate('/login')}>
              {t('hero.ctaSecondary')}
            </Button>
          </div>
          <div className="pt-8 flex items-center justify-center space-x-8 text-slate-400">
             <div className="flex items-center space-x-2"><Globe className="h-5 w-5" /> <span>{t('hero.badges.globalNetwork')}</span></div>
             <div className="flex items-center space-x-2"><ShieldCheck className="h-5 w-5" /> <span>{t('hero.badges.verifiedTeachers')}</span></div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- HOW IT WORKS ---
export const HowItWorks = () => {
  const { t } = useTranslation();
  const steps = [
    { icon: Users, titleKey: 'howItWorks.step1.title', descKey: 'howItWorks.step1.description' },
    { icon: Calendar, titleKey: 'howItWorks.step2.title', descKey: 'howItWorks.step2.description' },
    { icon: Video, titleKey: 'howItWorks.step3.title', descKey: 'howItWorks.step3.description' }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900">{t('howItWorks.title')}</h2>
          <p className="text-slate-600 mt-4 text-lg">{t('howItWorks.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <Card key={idx} className="border-none shadow-lg bg-slate-50/50 hover:-translate-y-1 transition-transform duration-300">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <step.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{t(step.titleKey)}</h3>
                <p className="text-slate-600 leading-relaxed">{t(step.descKey)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- MENTOR SHOWCASE ---
export const MentorShowcase = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Lazy load: Only fetch when section is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Disconnect observer after first intersection (only fetch once)
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1, // Trigger when 10% of section is visible
        rootMargin: '50px' // Start loading 50px before section comes into view
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Fetch mentors only when section becomes visible
  useEffect(() => {
    if (!isVisible) return;

    const fetchMentors = async () => {
      try {
        const allMentors = await api.getMentors();
        // Sort by rating DESC and take top 4
        const topMentors = allMentors
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 4);
        setMentors(topMentors);
      } catch (error) {
        console.error('Failed to fetch mentors:', error);
        // Fallback to empty array, component will show "no mentors" or we can add fallback data
      } finally {
        setLoading(false);
      }
    };
    fetchMentors();
  }, [isVisible]);

  return (
    <section ref={sectionRef} id="mentors" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">{t('mentorShowcase.title')}</h2>
            <p className="text-slate-600 mt-2 text-lg">{t('mentorShowcase.subtitle')}</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/find-mentor')}>{t('mentorShowcase.viewAll')}</Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            // Loading skeleton
            [...Array(4)].map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="aspect-square bg-slate-200"></div>
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-6 bg-slate-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))
          ) : mentors.length > 0 ? (
            mentors.map((m) => (
              <Card key={m.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
                <div className="aspect-square bg-slate-200 relative overflow-hidden">
                  <img 
                    src={m.avatar || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23e2e8f0" width="300" height="300"/%3E%3Ctext fill="%2394a3b8" font-family="Arial" font-size="120" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E%3F%3C/text%3E%3C/svg%3E'} 
                    alt={m.name} 
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg text-slate-900">{m.name}</h3>
                  <p className="text-sm text-slate-500 mb-2">{m.country || 'International'}</p>
                  {m.headline && (
                    <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed">{m.headline}</p>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold">{m.rating.toFixed(1)}</span>
                    <span className="text-xs text-slate-500">({m.reviewCount})</span>
                  </div>
                  <div className="inline-block bg-brand-50 text-brand-700 text-xs px-2 py-1 rounded-full font-medium">
                    {m.specialties[0] || 'English Teacher'}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-4 text-center text-slate-500 py-8">
              {t('mentorShowcase.noMentors') || 'No mentors available at the moment.'}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// --- PRICING PREVIEW ---
export const PricingPreview = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plans, sysSettings] = await Promise.all([
          api.getSubscriptionPlans(),
          api.getSystemSettings()
        ]);
        setSubscriptionPlans(plans);
        setSettings(sysSettings);
      } catch (error) {
        console.error('Failed to fetch pricing data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Get first subscription plan for display (or use hardcoded fallback)
  const mainPlan = subscriptionPlans[0];

  // Currency display: show local price for non-USD locales
  const localeCurrencyMap: Record<string, string> = { vi: 'VND', ja: 'JPY' };
  const targetCode = localeCurrencyMap[i18n.language];
  const currencyConfig = targetCode && settings?.currencies
    ? settings.currencies.find(c => c.code === targetCode && c.enabled)
    : null;
  const conversionRatio = settings?.topupConversionRatio || 0.8;

  const formatLocalPrice = (credits: number): string | null => {
    if (!currencyConfig) return null;
    const localPrice = calculateLocalPrice(credits, conversionRatio, currencyConfig.exchangeRate);
    return formatCurrency(localPrice, currencyConfig);
  };

  return (
  <section id="pricing" className="py-24 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16 max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-900">{t('pricing.title')}</h2>
        <p className="text-slate-600 mt-4 text-lg">{t('pricing.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Credits */}
        <Card className="border-slate-200 shadow-sm hover:border-brand-300 transition-colors relative overflow-hidden">
          <CardHeader>
            <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center mb-4">
              <CreditCard className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">{t('pricing.payAsYouGo.title')}</CardTitle>
            <p className="text-slate-500">{t('pricing.payAsYouGo.subtitle')}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-4xl font-extrabold text-slate-900">
                {formatLocalPrice(settings?.baseLessonCreditPrice || 4) || t('pricing.payAsYouGo.price')} <span className="text-lg font-normal text-slate-500">{t('pricing.payAsYouGo.unit')}</span>
              </div>
              {currencyConfig && <p className="text-sm text-slate-400 mt-1">~ {settings?.baseLessonCreditPrice || 4} credits</p>}
            </div>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-center"><CheckCircle2 className="h-5 w-5 text-green-500 mr-2" /> {t('pricing.payAsYouGo.features.noExpiration')}</li>
              <li className="flex items-center"><CheckCircle2 className="h-5 w-5 text-green-500 mr-2" /> {t('pricing.payAsYouGo.features.anyMentor')}</li>
              <li className="flex items-center"><CheckCircle2 className="h-5 w-5 text-green-500 mr-2" /> {t('pricing.payAsYouGo.features.cancellation')}</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-slate-900 hover:bg-slate-800" onClick={() => navigate('/login')}>{t('pricing.payAsYouGo.cta')}</Button>
          </CardFooter>
        </Card>

        {/* Subscription */}
        {loading ? (
          <Card className="border-brand-200 shadow-md ring-1 ring-brand-100 relative animate-pulse">
            <CardHeader>
              <div className="w-12 h-12 bg-slate-200 rounded-lg mb-4"></div>
              <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-full"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-10 bg-slate-200 rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ) : mainPlan ? (
          <Card className="border-brand-200 shadow-md ring-1 ring-brand-100 relative">
            <div className="absolute top-0 right-0 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">{t('pricing.subscription.badge')}</div>
            <CardHeader>
              <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center mb-4">
                <Award className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl">{mainPlan.name}</CardTitle>
              <p className="text-slate-500">{mainPlan.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-4xl font-extrabold text-slate-900">
                  {formatLocalPrice(Number(mainPlan.price)) || `${Number(mainPlan.price).toFixed(2)}`} <span className="text-lg font-normal text-slate-500">{currencyConfig ? t('pricing.payAsYouGo.unit') : 'credits'}</span>
                </div>
                {currencyConfig && <p className="text-sm text-slate-400 mt-1">~ {Number(mainPlan.price).toFixed(0)} credits</p>}
              </div>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-center"><CheckCircle2 className="h-5 w-5 text-green-500 mr-2" /> {mainPlan.sessions} lessons included</li>
                <li className="flex items-center"><CheckCircle2 className="h-5 w-5 text-green-500 mr-2" /> Valid for {mainPlan.durationWeeks} weeks</li>
                <li className="flex items-center"><CheckCircle2 className="h-5 w-5 text-green-500 mr-2" /> {mainPlan.allowedCancel} free cancellations</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => navigate('/login')}>{t('pricing.subscription.cta')}</Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="border-brand-200 shadow-md ring-1 ring-brand-100 relative">
            <div className="absolute top-0 right-0 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">{t('pricing.subscription.badge')}</div>
            <CardHeader>
              <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center mb-4">
                <Award className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl">{t('pricing.subscription.title')}</CardTitle>
              <p className="text-slate-500">{t('pricing.subscription.subtitle')}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-lg font-medium text-slate-600">
                Contact us for subscription plan details
              </div>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-center"><CheckCircle2 className="h-5 w-5 text-green-500 mr-2" /> Multiple lessons at discounted rates</li>
                <li className="flex items-center"><CheckCircle2 className="h-5 w-5 text-green-500 mr-2" /> Flexible scheduling options</li>
                <li className="flex items-center"><CheckCircle2 className="h-5 w-5 text-green-500 mr-2" /> Priority support included</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => navigate('/login')}>{t('pricing.subscription.cta')}</Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  </section>
  );
};

// --- AFFILIATE ---
export const AffiliateSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
  <section className="py-20 bg-slate-900 text-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 className="text-3xl font-bold mb-6">{t('affiliate.title')}</h2>
      <p className="text-slate-300 max-w-2xl mx-auto text-lg mb-8">
        {t('affiliate.description')}
      </p>
      <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl transition-all" onClick={() => navigate('/login')}>
        {t('affiliate.cta')}
      </Button>
    </div>
  </section>
  );
};

// --- REVIEWS ---
export const Reviews = () => {
  const { t } = useTranslation();
  
  const testimonials = [
    {
      quote: "Học tiếng Nhật với Lingofys thay đổi cuộc đời tôi! Sensei rất tận tâm, mỗi buổi học đều vui và hiệu quả. Giờ tôi tự tin giao tiếp với khách hàng Nhật!",
      name: "Nguyễn Minh Anh",
      title: "Business Development • Hanoi",
      flag: "🇻🇳"
    },
    {
      quote: "I was afraid to speak English for years. My teacher on Lingofys was so patient and encouraging. Now I can confidently present at work and passed IELTS 7.5!",
      name: "Trần Hoàng Long",
      title: "Software Engineer • Ho Chi Minh City",
      flag: "🇻🇳"
    },
    {
      quote: "英語の勉強はずっと苦手でしたが、Lingofysの先生のおかげで楽しくなりました！毎週のレッスンが待ち遠しいです。TOEICも800点超えました！",
      name: "田中 美咲 (Tanaka Misaki)",
      title: "Marketing Manager • Tokyo",
      flag: "🇯🇵"
    }
  ];

  return (
  <section className="py-24 bg-slate-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">{t('reviews.title')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((review, i) => (
          <Card key={i} className="bg-white border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex text-yellow-400 mb-4">
              {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-current" />)}
            </div>
            <p className="text-slate-600 mb-6 italic leading-relaxed">"{review.quote}"</p>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                {review.flag}
              </div>
              <div>
                <div className="font-bold text-slate-900">{review.name}</div>
                <div className="text-xs text-slate-500">{review.title}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  </section>
  );
};

// --- FAQ ---
export const FAQ = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const items = [
    { q: t('faq.items.credits.question'), a: t('faq.items.credits.answer') },
    { q: t('faq.items.cancellation.question'), a: t('faq.items.cancellation.answer') },
    { q: t('faq.items.subscription.question'), a: t('faq.items.subscription.answer') },
    { q: t('faq.items.becomeMentor.question'), a: t('faq.items.becomeMentor.answer') },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">{t('faq.title')}</h2>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <AccordionItem 
              key={idx} 
              title={item.q} 
              isOpen={openIndex === idx} 
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            >
              {item.a}
            </AccordionItem>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- FOOTER ---
export const Footer = () => {
  const { t } = useTranslation();
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
  <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center space-x-2 text-white mb-4">
             <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center font-bold">{BRAND.logo.icon}</div>
             <span className="font-bold text-lg">{BRAND.name}</span>
          </div>
          <p className="text-sm">{t('footer.description')}</p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4">{t('footer.platform.title')}</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/find-mentor" className="hover:text-white transition-colors">{t('footer.platform.browse')}</Link></li>
            <li><button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors text-left">{t('footer.platform.pricing')}</button></li>
            <li><Link to="/login" className="hover:text-white transition-colors">{t('footer.platform.login')}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4">{t('footer.company.title')}</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">{t('footer.company.about')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footer.company.careers')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footer.company.contact')}</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4">{t('footer.legal.title')}</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">{t('footer.legal.terms')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footer.legal.privacy')}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-900 pt-8">
        {/* Copyright */}
        <div className="text-center text-sm">
          &copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.
        </div>
      </div>
    </div>
  </footer>
  );
};
