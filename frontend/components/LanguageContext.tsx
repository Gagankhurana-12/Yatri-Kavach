import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define supported languages
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  hi: 'हिन्दी',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
};

// Language context type
interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (language: string) => Promise<void>;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

// Create context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Language provider component
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');

  // Load saved language on app start
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
      if (savedLanguage && Object.keys(SUPPORTED_LANGUAGES).includes(savedLanguage)) {
        setCurrentLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
    }
  };

  const setLanguage = async (language: string) => {
    try {
      await AsyncStorage.setItem('selectedLanguage', language);
      setCurrentLanguage(language);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook to use language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};