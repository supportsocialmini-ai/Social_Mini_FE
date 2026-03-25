import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './translations/en.json';
import viTranslation from './translations/vi.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: enTranslation,
      vi: viTranslation
    },
    fallbackLng: 'vi',
    detection: {
      order: ['localStorage', 'htmlTag', 'cookie', 'navigator', 'path', 'subdomain'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false
    },
    debug: false,
    ignoreLocizeNotifier: true
  });

export default i18n;
