import { useMemo } from 'react';
import { passwordStrength } from '../../lib/password';

// Live strength meter. Never colour only: there is a visible text label, progressbar semantics
// (value + text for screen readers) and a list of what to improve.
export default function PasswordStrength({ id, password, email, name }) {
  const result = useMemo(() => passwordStrength(password, { email, name }), [password, email, name]);
  const empty = password.length === 0;
  const tone = result.score <= 1 ? 'bad' : result.score === 2 ? 'mid' : 'good';
  return (
    <div id={id} className="strength" data-tone={tone}>
      <div className="strength-bar" role="progressbar" aria-label="Password strength" aria-valuemin={0} aria-valuemax={4} aria-valuenow={result.score} aria-valuetext={empty ? 'Not entered' : result.label}>
        {[1, 2, 3, 4].map((step) => (
          <span key={step} className={step <= result.score && !empty ? 'strength-seg is-on' : 'strength-seg'} />
        ))}
      </div>
      <p className="strength-label" aria-live="polite">
        {empty ? 'Strength: enter a password' : `Strength: ${result.label}`}
      </p>
      {!empty && result.suggestions.length > 0 ? (
        <ul className="strength-tips">
          {result.suggestions.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
