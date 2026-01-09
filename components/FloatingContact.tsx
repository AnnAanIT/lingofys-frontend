import React, { useState } from 'react';
import { MessageCircle, X, Facebook } from 'lucide-react';

/**
 * Floating Contact Button - Shows Facebook and Zalo links
 * Positioned at bottom-right corner, visible on all pages
 */
export const FloatingContact: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button - Positioned above mobile nav on small screens */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 md:bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-tr from-brand-600 to-blue-500 hover:from-brand-700 hover:to-blue-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center group animate-pulse hover:animate-none
          /* Mobile: Position above bottom nav (70px height + 24px margin) */
          max-md:bottom-[94px]
          ring-4 ring-brand-100 hover:ring-brand-200"
        aria-label="Contact us"
      >
        {isOpen ? (
          <X size={26} className="transition-transform duration-200" />
        ) : (
          <MessageCircle size={26} className="group-hover:scale-110 transition-transform duration-200 drop-shadow-md" />
        )}
      </button>

      {/* Popup Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Popup Card - Positioned above button */}
          <div className="fixed bottom-24 md:bottom-24 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 w-72 animate-slide-up max-md:bottom-[168px]">
            <div className="p-4">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Contact Us</h3>
              <p className="text-sm text-slate-500 mb-4">Get in touch via social media</p>

              <div className="space-y-3">
                {/* Facebook Link */}
                <a
                  href="https://www.facebook.com/people/Lingofys/61585671925299/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Facebook size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 text-sm">Facebook</div>
                    <div className="text-xs text-slate-500 truncate">Message us on Facebook</div>
                  </div>
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>

                {/* Zalo Link */}
                <a
                  href="https://zalo.me/0988679780"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-xl transition-all group border border-blue-100"
                >
                  <div className="w-10 h-10 bg-[#0068FF] rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-white font-bold text-sm">Zalo</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 text-sm">Zalo</div>
                    <div className="text-xs text-slate-500 truncate">Chat with us on Zalo</div>
                  </div>
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
