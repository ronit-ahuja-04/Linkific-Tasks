import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LOCALE, LOCALES, translate } from '../i18n';

/**
 * LANGUAGE CONTEXT: i18n (internationalisation) with a `t()` function.
 *
 *   const { t } = useLanguage();
 *   t('settings.title')                              // "Settings" / "Ajustes" / "सेटिंग्स"
 *   t('chat.typing.one', { name })                  // placeholders: "{name} is typing..."
 *
 * Changing the language re-renders every component that calls useLanguage(), which is exactly what
 * we want: all visible text must update. The value is memoized so nothing re-renders otherwise.
 */
const LanguageContext = createContext(null);

const STORAGE_KEY = 'flowlane-language';

function readInitialLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LOCALES.some((l) => l.code === saved)) return saved;
  } catch {
    /* storage blocked: fall through */
  }
  const browser = typeof navigator !== 'undefined' ? navigator.language?.slice(0, 2) : '';
  return LOCALES.some((l) => l.code === browser) ? browser : DEFAULT_LOCALE;
}

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(readInitialLocale);

  // Keep <html lang="..."> right for screen readers and browser translation
  useEffect(() => {
    document.documentElement.setAttribute('lang', locale);
  }, [locale]);

  const setLocale = useCallback((next) => {
    if (!LOCALES.some((l) => l.code === next)) return;
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage blocked: the choice just will not persist */
    }
  }, []);

  // `t` only changes when the language changes
  const t = useCallback((key, vars) => translate(locale, key, vars), [locale]);

  const value = useMemo(() => ({ locale, locales: LOCALES, setLocale, t }), [locale, setLocale, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === null) throw new Error('useLanguage must be used inside a <LanguageProvider>.');
  return context;
}
