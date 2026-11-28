import { Film, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Button, ConfirmDialog, cardClasses } from '../../components/ui';
import { toAppError } from '../../lib/errors';
import {
  ACCEPTED,
  checkFile,
  lessonFilePath,
  removeFile,
  signedUrl,
  uploadWithProgress,
} from '../../lib/api/storage';
import { updateLesson } from '../../lib/api/studio';
import { useToast } from '../toast/useToast';

/** Read a video's length in the browser before uploading, so the lesson's duration fills itself in. */
function videoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    const done = (value: number | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    video.onloadedmetadata = () =>
      done(Number.isFinite(video.duration) ? Math.round(video.duration) : null);
    video.onerror = () => done(null);
    video.src = url;
  });
}

type Phase =
  { name: 'idle' } | { name: 'uploading'; fileName: string; fraction: number } | { name: 'saving' };

/**
 * The lesson's video: preview, upload (drag and drop or pick), replace and remove. Files go to the private
 * course-media bucket under <course>/lessons/<lesson>/; previews use short-lived signed links.
 */
export function VideoPanel({
  courseId,
  lessonId,
  videoPath,
  onChanged,
}: {
  courseId: string;
  lessonId: string;
  videoPath: string | null;
  onChanged: () => Promise<void>;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [phase, setPhase] = useState<Phase>({ name: 'idle' });
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ path: string; url: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    if (!videoPath) return;
    let current = true;
    signedUrl('course-media', videoPath).then(
      (url) => current && setPreview({ path: videoPath, url }),
      () => current && setPreview(null),
    );
    return () => {
      current = false;
    };
  }, [videoPath]);

  // Leaving the page mid-upload cancels it.
  useEffect(() => () => abortRef.current?.abort(), []);

  async function upload(file: File) {
    const problem = checkFile(file, 'video');
    setError(problem);
    if (problem) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase({ name: 'uploading', fileName: file.name, fraction: 0 });
    try {
      const [duration, path] = await Promise.all([
        videoDuration(file),
        uploadWithProgress(
          'course-media',
          lessonFilePath(courseId, lessonId, file),
          file,
          (fraction) => setPhase({ name: 'uploading', fileName: file.name, fraction }),
          controller.signal,
        ),
      ]);
      setPhase({ name: 'saving' });
      const update: Parameters<typeof updateLesson>[1] = { video_path: path };
      if (duration !== null && duration >= 10 && duration <= 1800)
        update.duration_seconds = duration;
      try {
        await updateLesson(lessonId, update);
      } catch (saveError) {
        await removeFile('course-media', path); // don't leave an orphan behind
        throw saveError;
      }
      if (videoPath) await removeFile('course-media', videoPath);
      toast.success(
        duration !== null && duration > 180
          ? 'Video uploaded. Tip: bites under 2 minutes keep learners coming back.'
          : 'Video uploaded.',
      );
      await onChanged();
    } catch (e) {
      const appError = toAppError(e);
      if (appError.code === 'aborted') toast.info('Upload cancelled.');
      else setError(appError.message);
    } finally {
      abortRef.current = null;
      setPhase({ name: 'idle' });
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void upload(file);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && phase.name === 'idle') void upload(file);
  }

  const busy = phase.name !== 'idle';
  const percent = phase.name === 'uploading' ? Math.round(phase.fraction * 100) : 100;

  return (
    <section aria-labelledby="video-heading" className={cardClasses('flex flex-col gap-4 p-5')}>
      <h2 id="video-heading" className="m-0 flex items-center gap-2 text-xl font-semibold">
        <Film aria-hidden="true" className="h-5 w-5 text-violet-ink" /> Video
      </h2>

      {videoPath && preview?.path === videoPath && (
        <video
          key={preview.url}
          src={preview.url}
          controls
          preload="metadata"
          className="aspect-video w-full rounded-2xl bg-night"
        >
          <track kind="captions" />
        </video>
      )}

      {busy ? (
        <div className="flex flex-col gap-2" aria-live="polite">
          <div className="flex items-center justify-between gap-2 text-sm font-bold">
            <span className="truncate">
              {phase.name === 'uploading' ? `Uploading ${phase.fileName}` : 'Saving…'}
            </span>
            <span>{percent}%</span>
          </div>
          <div
            role="progressbar"
            aria-label="Upload progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="h-3 overflow-hidden rounded-full bg-mist"
          >
            <div
              className="h-full rounded-full bg-violet transition-[width]"
              style={{ width: `${percent}%` }}
            />
          </div>
          {phase.name === 'uploading' && (
            <div>
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<X aria-hidden="true" className="h-4 w-4" />}
                onClick={() => abortRef.current?.abort()}
              >
                Cancel upload
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center ${dragging ? 'border-violet bg-violet-soft' : 'border-line-strong bg-paper'}`}
        >
          <Upload aria-hidden="true" className="h-8 w-8 text-violet-ink" />
          <p className="m-0 text-sm text-dusk">
            Drop a video here, or pick one. {ACCEPTED.video.label}, up to 50 MB.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="violet" size="sm" onClick={() => inputRef.current?.click()}>
              {videoPath ? 'Replace video' : 'Choose a video'}
            </Button>
            {videoPath && (
              <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(true)}>
                Remove
              </Button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.video.types.join(',')}
            onChange={onPick}
            className="sr-only"
            tabIndex={-1}
            aria-label="Video file"
          />
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="m-0 rounded-2xl bg-ember-soft px-4 py-3 font-bold text-ember-ink"
        >
          {error}
        </p>
      )}

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title="Remove this video?"
        message="Learners will see this lesson without a video until you upload a new one."
        confirmLabel="Remove video"
        busy={phase.name === 'saving'}
        onConfirm={async () => {
          if (!videoPath) return;
          setPhase({ name: 'saving' });
          try {
            await updateLesson(lessonId, { video_path: null });
            await removeFile('course-media', videoPath);
            setConfirmRemove(false);
            toast.success('Video removed.');
            await onChanged();
          } catch (e) {
            toast.error(toAppError(e).message);
          } finally {
            setPhase({ name: 'idle' });
          }
        }}
      />
    </section>
  );
}
