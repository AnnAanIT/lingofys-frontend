/**
 * Language Selector Component - Lingofys
 * Dropdown for switching between languages (EN, VI, JA, ZH)
 * Following LESSONS_LEARNED: "Component-first approach, reusable design"
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';
import { AVAILABLE_LANGUAGES } from '../i18n/config';

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = AVAILABLE_LANGUAGES.find(lang => lang.code === i18n.language) || AVAILABLE_LANGUAGES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:border-brand-300 hover:bg-slate-50 transition-all text-sm font-medium text-slate-700"
        aria-label="Select Language"
      >
        <Globe size={16} className="text-slate-500" />
        <span className="hidden sm:inline">{currentLanguage.flag} {currentLanguage.name}</span>
        <span className="inline sm:hidden">{currentLanguage.flag}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
          {AVAILABLE_LANGUAGES.map((language) => {
            const isActive = language.code === i18n.language;
            return (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  isActive 
                    ? 'bg-brand-50 text-brand-700 font-medium' 
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-xl">{language.flag}</span>
                <span className="flex-1">{language.name}</span>
                {isActive && (
                  <svg className="w-4 h-4 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
