"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "si" | "ta";
export const LANGUAGE_STORAGE_KEY = "unicare-language";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

type LanguageProviderProps = {
  children: ReactNode;
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === "en" || saved === "si" || saved === "ta") {
        setLanguageState(saved);
      }
    } catch {
      // Ignore storage access errors and keep default language.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;

    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Ignore storage access errors to avoid breaking UI interactions.
    }
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage: setLanguageState
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
