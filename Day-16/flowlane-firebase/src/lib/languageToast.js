import { translate } from '../i18n';

/** "Language: Español", written in the language that was just chosen (the caller's `t` is still the old one) */
export const announceLanguage = (toast, option) =>
  toast.info(translate(option.code, 'ui.toast.languageChanged', { language: option.label }));
