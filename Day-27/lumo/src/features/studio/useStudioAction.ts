import { useCallback, useState } from 'react';
import { toAppError } from '../../lib/errors';
import { useToast } from '../toast/useToast';

/**
 * Run one studio change: mark it busy, toast the outcome, then refresh the page's data. Returns whether it worked.
 * `busy` holds a key for the running action, so only that button shows a spinner.
 */
export function useStudioAction(refresh: () => Promise<void>) {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const run = useCallback(
    async (key: string, action: () => Promise<unknown>, success?: string): Promise<boolean> => {
      setBusy(key);
      try {
        await action();
        if (success) toast.success(success);
        await refresh();
        return true;
      } catch (error) {
        toast.error(toAppError(error).message);
        return false;
      } finally {
        setBusy(null);
      }
    },
    [refresh, toast],
  );

  return { busy, run };
}
