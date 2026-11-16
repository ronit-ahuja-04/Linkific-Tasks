import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import '../styles/account.css';

/**
 * A password input with a show/hide button. The button keeps one name ("Show password") and
 * announces its state with aria-pressed, which is the accessible toggle-button pattern.
 */
export default function PasswordField({ id, value, onChange, autoComplete, placeholder, required = true, name = 'password', ...rest }) {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();
  return (
    <div className="pw-field">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        {...rest}
      />
      <button
        type="button"
        className="pw-field__toggle"
        aria-pressed={visible}
        aria-label={t('account.password.show')}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}
