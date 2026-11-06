import { Check, Globe } from 'lucide-react';
import { Dropdown } from './Dropdown';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { announceLanguage } from '../lib/languageToast';

/** Header language switcher: a Dropdown (compound component) driven by the LanguageContext */
export default function LanguageMenu() {
  const { t, locale, locales, setLocale } = useLanguage();
  const toast = useToast();

  const choose = (option) => {
    if (option.code === locale) return;
    setLocale(option.code);
    announceLanguage(toast, option);
  };

  return (
    <Dropdown className="language-menu">
      <Dropdown.Trigger className="icon-btn language-trigger" aria-label={t('ui.language.button')} title={t('ui.language.button')}>
        <Globe size={18} aria-hidden="true" />
        <span className="language-code" aria-hidden="true">{locale.toUpperCase()}</span>
      </Dropdown.Trigger>
      <Dropdown.Menu aria-label={t('ui.language.menu')}>
        {locales.map((option) => (
          <Dropdown.Item key={option.code} checked={locale === option.code} onSelect={() => choose(option)} lang={option.code}>
            <span>{option.label}</span>
            {locale === option.code && <Check size={15} aria-hidden="true" />}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
