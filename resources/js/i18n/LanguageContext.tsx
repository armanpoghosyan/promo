import {
    createContext,
    type ReactNode,
    useContext,
    useEffect,
    useState,
} from 'react';

import {
    translations,
    type Language,
} from './translations';

type LanguageContextValue = {
    language: Language;

    setLanguage: (
        language: Language
    ) => void;

    tr: (
        text: string
    ) => string;
};

const DEFAULT_LANGUAGE: Language = 'hy';

const STORAGE_KEY =
    'language';

const supportedLanguages:
    Language[] = [
    'hy',
    'en',
];

const LanguageContext =
    createContext<
        LanguageContextValue | undefined
    >(undefined);

function getInitialLanguage(): Language {
    const storedLanguage =
        localStorage.getItem(
            STORAGE_KEY
        );

    if (
        storedLanguage &&
        supportedLanguages.includes(
            storedLanguage as Language
        )
    ) {
        return storedLanguage as Language;
    }

    return DEFAULT_LANGUAGE;
}

export function LanguageProvider({
                                     children,
                                 }: {
    children: ReactNode;
}) {
    const [
        language,
        setLanguage,
    ] = useState<Language>(
        getInitialLanguage
    );

    useEffect(() => {
        localStorage.setItem(
            STORAGE_KEY,
            language
        );

        document.documentElement.lang =
            language;
    }, [language]);

    const tr = (
        text: string
    ): string => {
        if (language === 'en') {
            return text;
        }

        const translation =
            translations[
                text as keyof typeof translations
                ];

        if (!translation) {
            return text;
        }

        return translation.hy ?? text;
    };

    return (
        <LanguageContext.Provider
            value={{
                language,
                setLanguage,
                tr,
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context =
        useContext(
            LanguageContext
        );

    if (!context) {
        throw new Error(
            'useLanguage must be used inside LanguageProvider.'
        );
    }

    return context;
}
