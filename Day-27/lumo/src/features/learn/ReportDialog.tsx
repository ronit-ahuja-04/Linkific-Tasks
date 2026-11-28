import { useState, type FormEvent } from 'react';
import { Button, Dialog, TextAreaField } from '../../components/ui';
import { reportContent, type ReportCategory } from '../../lib/api/trust';
import { toAppError } from '../../lib/errors';
import { useToast } from '../toast/useToast';

const REASONS: { value: ReportCategory; label: string }[] = [
  { value: 'integrity', label: 'The answer or explanation is wrong' },
  { value: 'other', label: 'It’s confusing' },
  { value: 'wellbeing', label: 'Something here upset me' },
  { value: 'abuse', label: 'It’s inappropriate' },
  { value: 'off_topic', label: 'It doesn’t belong in this lesson' },
];

/** "Report a problem" on a question: goes to the admins' queue and the course's instructor. */
export function ReportDialog({
  questionId,
  onClose,
}: {
  questionId: string | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const [reason, setReason] = useState<ReportCategory>('integrity');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!questionId) return;
    setBusy(true);
    setError(null);
    try {
      await reportContent(questionId, reason, note.trim());
      toast.success('Thanks! A person will look at it. You helped light the isles.');
      setNote('');
      onClose();
    } catch (e) {
      setError(toAppError(e).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={questionId !== null}
      onClose={onClose}
      title="Report a problem"
      description="What’s wrong with this question?"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="sr-only">Reason</legend>
          {REASONS.map((r) => (
            <label
              key={r.value}
              className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 font-bold ${reason === r.value ? 'border-violet bg-violet-soft' : 'border-line-strong'}`}
            >
              <input
                type="radio"
                name="reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="h-5 w-5 accent-violet"
              />
              {r.label}
            </label>
          ))}
        </fieldset>
        <TextAreaField
          label="Anything else? (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={3}
          showCount
        />
        {reason === 'wellbeing' && (
          <p className="m-0 rounded-2xl bg-lagoon-soft px-4 py-3 text-sm font-bold text-lagoon-ink">
            Thank you for telling us. If you’re struggling right now, talking to someone you trust
            can really help.
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="m-0 rounded-2xl bg-ember-soft px-4 py-3 font-bold text-ember-ink"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="violet" loading={busy} loadingText="Sending…">
            Send report
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
