import type { AppError } from '@/lib/errors';

/**
 * A form's error message. For an ended session (401) it adds a way back that keeps the work: signing in again in a
 * NEW TAB sets the session cookie for this tab too, so the form can then simply be sent again. Signing in in this
 * tab would navigate away and lose what was typed (inventory row C4, finding E-10).
 */
export interface FormProblem {
  message: string;
  kind?: AppError['kind'];
}

export const problemFrom = (error: AppError): FormProblem => ({ message: error.messageWithReference, kind: error.kind });

export default function FormMessage({ problem, className = 'form-error' }: { problem: FormProblem | null; className?: string }) {
  if (!problem) return null;
  return (
    <p className={className} role="alert">
      {problem.message}
      {problem.kind === 'unauthorized' && (
        <>
          {' '}
          <a href="/login?next=/journal" target="_blank" rel="noopener">Sign in again in a new tab</a>, then send it again here: what you
          wrote is still on this page.
        </>
      )}
    </p>
  );
}
