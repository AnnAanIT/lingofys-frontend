import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, CheckCircle2, Globe, Calendar, Video, 
  Users, Star, CreditCard, Award, ShieldCheck, UserCheck 
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, CardFooter, AccordionItem } from './LandingComponents';

// --- NAVBAR ---
export const Navbar = () => {
  const navigate = useNavigate();
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-2">
             <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
             <span className="font-bold text-slate-900 text-xl tracking-tight">Mentorship.io</span>
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#how-it-works" className="text-slate-600 hover:text-brand-600 text-sm font-medium transition-colors">How it Works</a>
            <a href="#mentors" className="text-slate-600 hover:text-brand-600 text-sm font-medium transition-colors">Mentors</a>
            <a href="#pricing" className="text-slate-600 hover:text-brand-600 text-sm font-medium transition-colors">Pricing</a>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Log In</Button>
            <Button size="sm" onClick={() => navigate('/login')}>Get Started</Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

// --- HERO SECTION ---
export const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-100/50 via-slate-50 to-slate-50"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-in space-y-8 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Learn English 1:1 with <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-sky-500">
              Professional Mentors
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Connect instantly with English mentors from Japan, Korea, China, and Vietnam. 
            Flexible learning with Credits or Subscription Plans.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="w-full sm:w-auto text-lg h-14" onClick={() => navigate('/login')}>
              Start Learning <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg h-14" onClick={() => navigate('/login')}>
              Become a Mentor
            </Button>
          </div>
          <div className="pt-8 flex items-center justify-center space-x-8 text-slate-400">
             <div className="flex items-center space-x-2"><Globe className="h-5 w-5" /> <span>Global Network</span></div>
             <div className="flex items-center space-x-2"><ShieldCheck className="h-5 w-5" /> <span>Verified Tutors</span></div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- HOW IT WORKS ---
export const HowItWorks = () => (
  <section id="how-it-works" className="py-24 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-slate-900">How it Works</h2>
        <p className="text-slate-600 mt-4 text-lg">Master a new language in three simple steps.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Users, title: "1. Choose Mentor", desc: "Browse profiles, watch intro videos, and filter by specialty." },
          { icon: Calendar, title: "2. Book Schedule", desc: "Select a time slot that fits your busy lifestyle perfectly." },
          { icon: Video, title: "3. Start Learning", desc: "Connect via high-quality video calls and interactive tools." }
        ].map((step, idx) => (
          <Card key={idx} className="border-none shadow-lg bg-slate-50/50 hover:-translate-y-1 transition-transform duration-300">
            <CardContent className="pt-8 text-center">
              <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <step.icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
              <p className="text-slate-600 leading-relaxed">{step.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

// --- MENTOR SHOWCASE ---
export const MentorShowcase = () => {
  const mentors = [
    { name: "Sarah J.", country: "USA", role: "Business English", img: "https://picsum.photos/id/64/100/100" },
    { name: "Kenji T.", country: "Japan", role: "IELTS Prep", img: "https://picsum.photos/id/65/100/100" },
    { name: "Minh A.", country: "Vietnam", role: "Daily Conversation", img: "https://picsum.photos/id/68/100/100" },
    { name: "Elena R.", country: "Spain", role: "Grammar Expert", img: "https://picsum.photos/id/66/100/100" },
  ];

  return (
    <section id="mentors" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Meet our Top Mentors</h2>
            <p className="text-slate-600 mt-2 text-lg">Learn from the best educators around the world.</p>
          </div>
          <Button variant="outline">View All Mentors</Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mentors.map((m, i) => (
            <Card key={i} className="overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
              <div className="aspect-square bg-slate-200 relative overflow-hidden">
                <img src={m.img} alt={m.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg text-slate-900">{m.name}</h3>
                <p className="text-sm text-slate-500 mb-2">{m.country}</p>
                <div className="inline-block bg-brand-50 text-brand-700 text-xs px-2 py-1 rounded-full font-medium">
                  {m.role}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- PRICING PREVIEW ---
export const PricingPreview = () => (
  <section id="pricing" className="py-24 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16 max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-900">Simple, Transparent Pricing</h2>
        <p className="text-slate-600 mt-4 text-lg">Choose the plan that fits your learning style. No hidden fees.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Credits */}
        <Card className="border-slate-200 shadow-sm hover:border-brand-300 transition-colors relative overflow-hidden">
          <CardHeader>
            <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center mb-4">
              <CreditCard className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">Pay As You Go</CardTitle>
            <p className="text-slate-500">Maximum flexibility for busy learners.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-extrabold text-slate-900">$10 <span className="text-lg font-normal text-slate-500">/ credit</span></div>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-center"><CheckCircle2 className="h-5 w-5 text-green-500 mr-2" /> No expiration date</li>
              <li className="flex items-center"><CheckCircle2 className="h-5 w-5 text-green-500 mr-2" /> Book any mentor</li>
              <li className="flex items-center"><CheckCircle2 className="h-5 w-5 text-green-500 mr-2" /> 24h cancellation policy</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-slate-900 hover:bg-slate-800">Buy Credits</Button>
          </CardFooter>
        </Card>

        {/* Subscription */}
        <Card className="border-brand-200 shadow-md ring-1 ring-brand-100 relative">
          <div className="absolute top-0 right-0 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
          <CardHeader>
            <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center mb-4">
              <Award className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">Monthly Subscription</CardTitle>
            <p className="text-slate-500">Consistency for faster results.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-extrabold text-slate-900">$8 <span className="text-lg font-normal text-slate-500">/ lesson</span></div>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-center"><CheckCircle2 className="h-5 w-5 text-green-500 mr-2" /> Save 20% vs credits</li>
              <li className="flex items-center"><CheckCircle2 className="h-5 w-5 text-green-500 mr-2" /> Fixed weekly slots</li>
              <li className="flex items-center"><CheckCircle2 className="h-5 w-5 text-green-500 mr-2" /> Priority support</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full">View Plans</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  </section>
);

// --- AFFILIATE ---
export const AffiliateSection = () => (
  <section className="py-20 bg-slate-900 text-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 className="text-3xl font-bold mb-6">Become a Partner</h2>
      <p className="text-slate-300 max-w-2xl mx-auto text-lg mb-8">
        Join our Affiliate Program and earn 10% lifetime commission for every student you refer. 
        Help us spread knowledge while earning passive income.
      </p>
      <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
        Become a Provider
      </Button>
    </div>
  </section>
);

// --- REVIEWS ---
export const Reviews = () => (
  <section className="py-24 bg-slate-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">What our students say</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white border-slate-100 shadow-sm p-6">
            <div className="flex text-yellow-400 mb-4">
              {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-current" />)}
            </div>
            <p className="text-slate-600 mb-6 italic">"The mentors here are incredibly patient. I went from afraid to speak to having daily conversations in just 3 months!"</p>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
              <div>
                <div className="font-bold text-slate-900">Student Name</div>
                <div className="text-xs text-slate-400">Software Engineer</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

// --- FAQ ---
export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const items = [
    { q: "How do credits work?", a: "Credits are a flexible currency. 1 Credit = 1 Hour lesson (usually). You buy them in bundles and spend them whenever you want to book a class. They never expire." },
    { q: "Can I cancel a lesson?", a: "Yes! If you cancel more than 6 hours before the lesson starts, you get a full refund of your credits. Late cancellations are non-refundable to respect the mentor's time." },
    { q: "How do subscription plans work?", a: "Subscriptions give you a set number of lessons per month at a discounted rate. You choose a fixed weekly slot (e.g., every Monday at 8 PM) to build a consistent habit." },
    { q: "How do I become a mentor?", a: "Sign up as a Mentor, fill out your profile, and upload a short introduction video. Our team will review your application within 48 hours." },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Frequently Asked Questions</h2>
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
export const Footer = () => (
  <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center space-x-2 text-white mb-4">
             <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center font-bold">M</div>
             <span className="font-bold text-lg">Mentorship.io</span>
          </div>
          <p className="text-sm">Empowering language learners across Asia through connection and technology.</p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4">Platform</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Browse Mentors</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Log In</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-900 pt-8 text-center text-sm">
        &copy; {new Date().getFullYear()} Mentorship.io. All rights reserved.
      </div>
    </div>
  </footer>
);
