"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "si" | "ta";

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
    const saved = window.localStorage.getItem("unicare-language");
    if (saved === "en" || saved === "si" || saved === "ta") {
      setLanguageState(saved);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("unicare-language", language);
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
