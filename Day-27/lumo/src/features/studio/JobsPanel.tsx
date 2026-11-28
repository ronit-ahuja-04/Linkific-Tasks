import { Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppSelector } from '../../app/hooks';
import { Wisp } from '../../components/characters';
import { Button } from '../../components/ui';
import { toAppError } from '../../lib/errors';
import { cancelJob, listJobs, queueJob, watchJobs } from '../../lib/api/studio';
import type { GenerationJob, JobStatus } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { useToast } from '../toast/useToast';

const ACTIVE: JobStatus[] = ['queued', 'running', 'waiting_quota'];

const STATUS_TEXT: Record<JobStatus, string> = {
  queued: 'Waiting in line',
  running: 'Working',
  waiting_quota: "Out of today's free AI quota: it resumes tomorrow",
  succeeded: 'Done',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

const STALL_MS = 8000;

/**
 * Wisp's workshop: ask for a drafted unit and watch it being made. The job row is written by a worker (a fake
 * one until the Gemini pipeline lands in M4); this panel only queues, cancels and listens over Realtime.
 */
export function JobsPanel({ courseId, onDrafted }: { courseId: string; onDrafted: () => void }) {
  const profile = useAppSelector((s) => s.auth.profile);
  const toast = useToast();
  const initial = useAsync(() => listJobs(courseId), [courseId]);
  const [updates, setUpdates] = useState<Record<string, GenerationJob>>({});
  const [queueing, setQueueing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const callbacks = useRef({ onDrafted, toast });
  useEffect(() => {
    callbacks.current = { onDrafted, toast };
  });

  // Live updates. A finished job refreshes the path so the new unit appears without a reload.
  useEffect(() => {
    const seen = new Map<string, JobStatus>();
    return watchJobs(courseId, (job) => {
      const before = seen.get(job.id);
      seen.set(job.id, job.status);
      setUpdates((u) => ({ ...u, [job.id]: job }));
      if (before !== job.status && job.status === 'succeeded') {
        callbacks.current.toast.success('Wisp drafted a new unit. Review it before you publish.');
        callbacks.current.onDrafted();
      }
      if (before !== job.status && job.status === 'failed') {
        callbacks.current.toast.error(job.error ?? 'Wisp couldn’t finish the draft.');
      }
    });
  }, [courseId]);

  const jobs = useMemo(() => {
    const base = initial.status === 'ready' ? initial.data : [];
    const byId = new Map(base.map((j) => [j.id, j]));
    for (const job of Object.values(updates)) {
      if (job.course_id === courseId) byId.set(job.id, { ...byId.get(job.id), ...job });
    }
    return [...byId.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [initial, updates, courseId]);

  const active = jobs.find((j) => ACTIVE.includes(j.status));
  const lastDone = jobs.find((j) => !ACTIVE.includes(j.status));

  // While a job sits in the queue, tick a clock so we can tell when nobody is picking it up.
  useEffect(() => {
    if (active?.status !== 'queued') return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active?.status]);
  const stalled =
    active?.status === 'queued' && now - new Date(active.updated_at).getTime() > STALL_MS;

  async function ask() {
    setQueueing(true);
    try {
      const job = await queueJob(courseId, profile?.id ?? '', 'outline');
      setUpdates((u) => ({ ...u, [job.id]: job }));
      setNow(Date.now());
    } catch (error) {
      toast.error(toAppError(error).message);
    } finally {
      setQueueing(false);
    }
  }

  async function cancel(job: GenerationJob) {
    setCancelling(true);
    try {
      await cancelJob(job.id);
      setUpdates((u) => ({
        ...u,
        [job.id]: { ...job, status: 'cancelled', message: 'Cancelled' },
      }));
      toast.info('Cancelled. Nothing was added to your course.');
    } catch (error) {
      toast.error(toAppError(error).message);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <section
      aria-labelledby="workshop-heading"
      className="flex flex-col gap-4 rounded-[var(--radius-card)] border-2 border-night-line bg-night p-5 text-white"
    >
      <div className="flex items-center gap-3">
        <Wisp size={56} mood={active ? 'think' : 'happy'} decorative />
        <div className="flex flex-col">
          <h2 id="workshop-heading" className="m-0 text-xl font-semibold">
            Wisp's workshop
          </h2>
          <p className="m-0 text-sm text-moon">
            No content yet? Wisp drafts a unit with lessons and quiz questions for you to review.
          </p>
        </div>
      </div>

      {active ? (
        <div className="flex flex-col gap-2" aria-live="polite">
          <div className="flex items-center justify-between gap-2 text-sm font-bold">
            <span>{active.message || STATUS_TEXT[active.status]}</span>
            <span className="text-moon">{active.progress}%</span>
          </div>
          <div
            role="progressbar"
            aria-label="Draft progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={active.progress}
            className="h-3 overflow-hidden rounded-full bg-night-3"
          >
            <div
              className="h-full rounded-full bg-glow transition-[width] duration-500"
              style={{ width: `${Math.max(active.progress, 3)}%` }}
            />
          </div>
          {stalled && (
            <p className="m-0 rounded-xl bg-night-2 px-3 py-2 text-sm text-moon">
              Nobody has picked this up yet.
              {import.meta.env.DEV ? (
                <>
                  {' '}
                  Start the local worker with <code className="text-glow">npm run worker</code>.
                </>
              ) : (
                ' It will start as soon as the generator is free.'
              )}
            </p>
          )}
          <div>
            <Button
              size="sm"
              variant="dark"
              loading={cancelling}
              onClick={() => void cancel(active)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="glow"
            loading={queueing}
            loadingText="Asking Wisp…"
            leftIcon={<Sparkles aria-hidden="true" className="h-5 w-5" />}
            onClick={() => void ask()}
          >
            Ask Wisp to draft a unit
          </Button>
          {lastDone && (
            <span className="text-sm text-moon">
              Last draft: {STATUS_TEXT[lastDone.status].toLowerCase()}
              {lastDone.status === 'failed' && lastDone.error ? ` (${lastDone.error})` : ''}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
