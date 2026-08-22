import { en } from './en';
import { zh } from './zh';
import { Locale, TranslationDictionary } from '../types/i18n';

export const translations: Record<Locale, TranslationDictionary> = {
  en,
  zh,
};

export const DEFAULT_LOCALE: Locale = 'zh';

export function getTranslation(locale: Locale): TranslationDictionary {
  return translations[locale] || translations[DEFAULT_LOCALE];
}
