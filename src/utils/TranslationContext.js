// src/utils/TranslationContext.js
import React, { createContext, useContext } from 'react';
import translations from '../constants/translations';

const TranslationContext = createContext();

export const useTranslation = () => useContext(TranslationContext);

export const TranslationProvider = ({ children }) => {
  // Lingua fissa italiana, nessun toggle necessario
  const language = 'it';
  
  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <TranslationContext.Provider value={{ t, language }}>
      {children}
    </TranslationContext.Provider>
  );
};
