import en from './en';
import es from './es';
import hi from './hi';

export const DEFAULT_LOCALE = 'en';

/** `label` is written in the language itself, so people can find theirs whatever is selected */
export const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'hi', label: 'हिन्दी' },
];

export const DICTIONARIES = { en, es, hi };

/** Replace {name} placeholders. A placeholder with no value is left as written. */
export function interpolate(text, vars) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}

/**
 * Look a key up in the chosen language, then in English, then give back the key itself so a
 * missing translation is visible instead of blank. (A unit test guarantees no key is missing.)
 */
export function translate(locale, key, vars) {
  const text = DICTIONARIES[locale]?.[key] ?? DICTIONARIES[DEFAULT_LOCALE][key] ?? key;
  return interpolate(text, vars);
}
