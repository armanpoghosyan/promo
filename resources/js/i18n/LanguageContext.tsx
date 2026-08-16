import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { translations, type Language } from './translations';

type LanguageContextValue = {
    language: Language;
    setLanguage: (language: Language) => void;
    tr: (text: string) => string;
};

const DEFAULT_LANGUAGE = 'hy';
const FALLBACK_LANGUAGE = 'en';
const STORAGE_KEY = 'language';

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

type Props = {
    children: ReactNode;
};

export function LanguageProvider({children}: Props) {
    const [language, setLanguageState,] = useState<Language>(() => {
        return (
            localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE
        );
    });

    const setLanguage = (nextLanguage: Language) => {
        setLanguageState(nextLanguage);
    };

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, language);
        document.documentElement.lang = language;
    }, [language]);

    const tr = (text: string): string => {
        const translation = translations[text as keyof typeof translations];

        if (!translation) {
            return text;
        }

        if (language === 'en') {
            return text;
        }

        return (translation[language as keyof typeof translation] ?? text);
    };

    return (
        <LanguageContext.Provider
            value={{language, setLanguage, tr}}
        >
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);

    if (!context) {
        throw new Error('useLanguage must be used inside LanguageProvider.');
    }

    return context;
}
