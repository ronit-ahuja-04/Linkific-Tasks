import { Gloom, Wisp } from '../characters';
import { Button } from './Button';

/** Loading: Wisp waits with you. role=status so screen readers hear it once. */
export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-16 text-dusk">
      <div className="animate-pulse">
        <Wisp size={64} mood="think" decorative glow={false} />
      </div>
      <span className="font-bold">{label}</span>
    </div>
  );
}

/** Something failed: say what happened and offer the way out. */
export function ErrorPanel({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center gap-3 py-12 text-center"
    >
      <Gloom size={120} decorative />
      <h2 className="m-0 text-2xl font-semibold">{title}</h2>
      <p className="m-0 text-dusk">{message}</p>
      {onRetry && (
        <Button variant="violet" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
