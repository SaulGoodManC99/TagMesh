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
    try {
      if (typeof window !== 'undefined' && window.location?.search) {
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang')?.toLowerCase();
        if (langParam === 'en' || langParam === 'zh') return langParam as Locale;
      }
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale;
      if (saved === 'en' || saved === 'zh') return saved;
      const navLang = navigator.language?.toLowerCase();
      if (navLang?.startsWith('zh')) return 'zh';
    } catch {
      // ignore
    }
    return DEFAULT_LOCALE;
  });

  const [t, setT] = useState<TranslationDictionary>(() => getTranslation(locale));

  useEffect(() => {
    setT(getTranslation(locale));
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    db.meta.put({ key: 'locale', value: locale }).catch(() => {});

    // Dynamically update document lang, title and description for SEO
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
      
      const isZh = locale === 'zh';
      const pageTitle = isZh 
        ? 'TagMesh | 随心笔记 · 灵感备忘与多维标签管理' 
        : 'TagMesh | Flow Notes · Fleeting Thoughts & Multi-Dimensional Tag Mesh';
      const pageDesc = isZh
        ? 'TagMesh 是一款极简轻盈的随心笔记与灵感备忘工具。随手记录日常闪念、工作待办、会议纪要与读书随笔，通过 #标签 轻松分类，告别文件夹焦虑，支持本地优先安全存储与云端同步。'
        : 'TagMesh is a lightweight, local-first flow notes and fleeting thoughts manager. Capture daily tasks, reading insights, and sparks with #hashtags without folder fatigue.';

      document.title = pageTitle;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', pageDesc);
      }
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', pageTitle);
      }
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        ogDesc.setAttribute('content', pageDesc);
      }

      const ogBanner = isZh ? 'https://tagmesh.top/icons/og-banner-zh.png' : 'https://tagmesh.top/icons/og-banner-en.png';
      const ogImg = document.querySelector('meta[property="og:image"]');
      if (ogImg) {
        ogImg.setAttribute('content', ogBanner);
      }
      const ogImgSecure = document.querySelector('meta[property="og:image:secure_url"]');
      if (ogImgSecure) {
        ogImgSecure.setAttribute('content', ogBanner);
      }
      const twitterImg = document.querySelector('meta[name="twitter:image"]');
      if (twitterImg) {
        twitterImg.setAttribute('content', ogBanner);
      }
    }
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
