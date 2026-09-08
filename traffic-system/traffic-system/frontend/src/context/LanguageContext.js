import React, { createContext, useContext, useState } from "react";
import { translations } from "../translations/translations";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem("app_language") || "English";
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem("app_language", lang);
  };

  const t = (key) => {
    const langCode = language === "Sinhala" ? "si" : "en";
    const dict = translations[langCode] || translations.en;
    if (dict && dict[key] !== undefined) {
      return dict[key];
    }
    // Fallback to English dict if missing in target lang
    if (translations.en && translations.en[key] !== undefined) {
      return translations.en[key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export default LanguageContext;
