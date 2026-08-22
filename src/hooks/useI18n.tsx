import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Locale, TranslationDictionary } from '../types/i18n';
import { getTranslation, DEFAULT_LOCALE } from '../i18n';
import { db } from '../db/dexie';

interface I18nContextType {
  locale: Locale;
  t: TranslationDictionary;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

const LOCALE_STORAGE_KEY = 'tagmesh_locale_preference';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale;
    if (saved === 'en' || saved === 'zh') return saved;
    const navLang = navigator.language?.toLowerCase();
    if (navLang?.startsWith('zh')) return 'zh';
    return DEFAULT_LOCALE;
  });

  const [t, setT] = useState<TranslationDictionary>(() => getTranslation(locale));

  useEffect(() => {
    setT(getTranslation(locale));
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    db.meta.put({ key: 'locale', value: locale }).catch(() => {});
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState(prev => (prev === 'zh' ? 'en' : 'zh'));
  }, []);

  return (
    <I18nContext.Provider value={{ locale, t, setLocale, toggleLocale }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
