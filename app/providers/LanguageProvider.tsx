"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getTranslation,
  type Language,
} from "@/app/lib/i18n/translations";

const STORAGE_KEY = "ggh-language";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: ReturnType<typeof getTranslation>;
  languageReady: boolean;
};

const LanguageContext =
  createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] =
    useState<Language>("ka");
  const [languageReady, setLanguageReady] =
    useState(false);

  useEffect(() => {
    const saved =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (saved === "ka" || saved === "en") {
      setLanguageState(saved);
      document.documentElement.lang = saved;
    } else {
      document.documentElement.lang = "ka";
    }

    setLanguageReady(true);
  }, []);

  const setLanguage = useCallback(
    (nextLanguage: Language) => {
      setLanguageState(nextLanguage);
      window.localStorage.setItem(
        STORAGE_KEY,
        nextLanguage
      );
      document.documentElement.lang =
        nextLanguage;
    },
    []
  );

  const toggleLanguage = useCallback(() => {
    setLanguage(
      language === "ka" ? "en" : "ka"
    );
  }, [language, setLanguage]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t: getTranslation(language),
      languageReady,
    }),
    [
      language,
      setLanguage,
      toggleLanguage,
      languageReady,
    ]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider."
    );
  }

  return context;
}