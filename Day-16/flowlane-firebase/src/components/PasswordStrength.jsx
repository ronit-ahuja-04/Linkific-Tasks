import { passwordStrength } from '../lib/password';
import { useLanguage } from '../context/LanguageContext';
import '../styles/account.css';

// lib/password.js returns English sentences; map them to translation keys
const SUGGESTION_KEYS = {
  'Use at least 8 characters.': 'account.suggest.length',
  'Make it 12 characters or longer.': 'account.suggest.longer',
  'Mix uppercase and lowercase letters.': 'account.suggest.case',
  'Add a number.': 'account.suggest.digit',
  'Add a symbol such as ! or -.': 'account.suggest.symbol',
  'This is a very common password. Pick something unique.': 'account.suggest.common',
  'Do not include your name or email.': 'account.suggest.personal',
  'Avoid repeated characters and sequences like 1234 or abcd.': 'account.suggest.pattern',
};

/**
 * Strength meter. Never colour only: the label is real text, the bar has role="meter", and the
 * wrapper is a polite live region so screen readers hear the level change while typing.
 */
export default function PasswordStrength({ password, email, name }) {
  const { t } = useLanguage();
  const { score, label, suggestions } = passwordStrength(password, { email, name });
  const hasText = Boolean(password);
  const levelText = t(`account.strength.${score}`);

  return (
    <div className="pw-strength" aria-live="polite" data-testid="password-strength">
      {hasText && (
        <>
          <div
            className="pw-meter"
            role="meter"
            aria-label={t('account.strength.meter')}
            aria-valuemin={0}
            aria-valuemax={4}
            aria-valuenow={score}
            aria-valuetext={levelText}
            data-score={score}
          >
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`pw-meter__seg${i < Math.max(score, 1) ? ' is-on' : ''}`} />
            ))}
          </div>
          <p className="pw-strength__label" data-level={label}>
            {t('account.strength.label', { label: levelText })}
          </p>
          {suggestions.length > 0 && (
            <ul className="pw-strength__tips">
              {suggestions.slice(0, 3).map((tip) => (
                <li key={tip}>{SUGGESTION_KEYS[tip] ? t(SUGGESTION_KEYS[tip]) : tip}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
