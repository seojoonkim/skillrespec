// ═══════════════════════════════════════════════════════════
// Language Context - React Context for i18n
// ═══════════════════════════════════════════════════════════

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Language, Translations } from './translations';
import { translations } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = 'skillrespec-lang';

function detectBrowserLanguage(): Language {
  const browserLang = navigator.language.split('-')[0];
  if (browserLang === 'ko' || browserLang === 'ja' || browserLang === 'zh') {
    return browserLang as Language;
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ['ko', 'en', 'ja', 'zh'].includes(stored)) {
      return stored as Language;
    }
    return detectBrowserLanguage();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
