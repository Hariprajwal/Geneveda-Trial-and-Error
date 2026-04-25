import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext({ lang: "en", setLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem("gv_lang") || "en");

  const setLang = (code) => {
    localStorage.setItem("gv_lang", code);
    setLangState(code);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

export default LanguageContext;
