import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import translationEN from './locales/en/translation.json';
import translationPT from './locales/pt/translation.json';

const resources = {
  en: {
    translation: translationEN,
    configuracoes: (translationEN as { configuracoes: Record<string, string> })
      .configuracoes,
  },
  pt: {
    translation: translationPT,
    configuracoes: (translationPT as { configuracoes: Record<string, string> })
      .configuracoes,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
