import { useLanguage } from "@/contexts/LanguageContext";
import viTranslations from "@/locales/vi.json";
import enTranslations from "@/locales/en.json";

const translations = {
  vi: viTranslations,
  en: enTranslations,
};

export const useTranslation = () => {
  const { language } = useLanguage();

  const t = (key, params = {}) => {
    const keys = key.split(".");
    let value = translations[language];

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        // Fallback to Vietnamese if key not found
        value = translations.vi;
        for (const k2 of keys) {
          value = value?.[k2];
        }
        break;
      }
    }

    if (typeof value !== "string") {
      return key; // Return key if translation not found
    }

    // Replace params in translation
    return Object.keys(params).reduce((str, param) => {
      return str.replace(`{{${param}}}`, params[param]);
    }, value);
  };

  return { t, language };
};

