import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en } from "./en";
import { my } from "./my";

export type Language = "en" | "my";
const STORAGE_KEY = "archer_language";
const resources = { en, my };

export function getStoredLanguage(): Language {
  return localStorage.getItem(STORAGE_KEY) === "my" ? "my" : "en";
}

type I18nValue = { language: Language; locale: string; setLanguage: (language: Language) => void; t: (key: string, values?: Record<string, string | number>) => string };
const I18nContext = createContext<I18nValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage);
  const setLanguage = (next: Language) => { localStorage.setItem(STORAGE_KEY, next); setLanguageState(next); };
  const value = useMemo<I18nValue>(() => ({
    language,
    locale: language === "my" ? "my-MM" : "en-US",
    setLanguage,
    t(key, values) {
      const template = resources[language][key] ?? resources.en[key] ?? key;
      return values ? template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(values[name] ?? "")) : template;
    }
  }), [language]);
  useEffect(() => { document.documentElement.lang = language === "my" ? "my" : "en"; }, [language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useTranslation must be used within LanguageProvider");
  return value;
}
