import { useEffect, useState } from 'react';
import { Download, Link2, Trash2, FileText, Copy } from 'lucide-react';
import { EXPIRY_OPTIONS, formatBytes, formatCountdown, isImage } from '../../lib/files';
import RelativeTime from '../ui/RelativeTime';

/** One file: preview, facts, and the actions. `actions` are async functions from the page. */
export default function FileRow({ file, previewUrl, actions, busy }) {
  const [seconds, setSeconds] = useState(3600);
  const [share, setShare] = useState(null); // { url, left, total }
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const left = share?.left ?? 0;

  // The countdown: one tick per second, the link is "expired" at 0. The interval is removed in the cleanup.
  const sharing = share !== null && left > 0;
  useEffect(() => {
    if (!sharing) return undefined;
    const id = setInterval(() => setShare((s) => (s ? { ...s, left: Math.max(0, s.left - 1) } : s)), 1000);
    return () => clearInterval(id);
  }, [sharing]);

  async function makeLink() {
    const result = await actions.share(file, seconds);
    if (result) { setShare({ url: result.url, left: result.seconds, total: result.seconds }); setCopied(false); }
  }
  async function copy() {
    if (await actions.copy(share.url)) setCopied(true);
  }

  const expired = share && left === 0;
  return (
    <li className="files-row" data-testid="file-row">
      <div className="files-thumb">
        {isImage(file.mime) && previewUrl ? <img src={previewUrl} alt={`Preview of ${file.name}`} /> : <FileText size={24} aria-hidden="true" />}
      </div>
      <div className="files-info">
        <p className="files-name">{file.name}</p>
        <p className="files-meta">
          {formatBytes(file.size)} · {file.mime || 'unknown type'} · <RelativeTime date={file.created_at} />
          {file.note?.title && <> · <span className="badge">Note: {file.note.title}</span></>}
        </p>

        <div className="files-actions">
          <button type="button" className="btn btn-sm btn-ghost" disabled={busy} onClick={() => actions.download(file)}>
            <Download size={14} aria-hidden="true" /> Download
          </button>
          <label className="sr-only" htmlFor={`exp-${file.id}`}>Link expires after, for {file.name}</label>
          <select id={`exp-${file.id}`} className="files-expiry input-sm" value={seconds} onChange={(e) => setSeconds(Number(e.target.value))}>
            {EXPIRY_OPTIONS.map((o) => <option key={o.seconds} value={o.seconds}>Expires in {o.label}</option>)}
          </select>
          <button type="button" className="btn btn-sm" disabled={busy} onClick={makeLink}>
            <Link2 size={14} aria-hidden="true" /> Share link
          </button>
          {confirming ? (
            <>
              <button type="button" className="btn btn-sm btn-danger" disabled={busy} onClick={() => actions.remove(file)}>Confirm delete</button>
              <button type="button" className="btn btn-sm" onClick={() => setConfirming(false)}>Cancel</button>
            </>
          ) : (
            <button type="button" className="btn btn-sm btn-ghost files-delete" disabled={busy} onClick={() => setConfirming(true)} aria-label={`Delete ${file.name}`}>
              <Trash2 size={14} aria-hidden="true" /> Delete
            </button>
          )}
        </div>

        {share && (
          <div className="files-share" role="group" aria-label={`Share link for ${file.name}`}>
            <input className="input files-share-url" readOnly value={share.url} aria-label="Signed URL" onFocus={(e) => e.target.select()} />
            <button type="button" className="btn btn-sm" onClick={copy} disabled={expired}><Copy size={14} aria-hidden="true" /> Copy</button>
            <p className={`files-countdown${expired ? ' is-expired' : ''}`} data-testid="countdown">
              {expired ? 'Expired: this link no longer works.' : `Expires in ${formatCountdown(left)}`}
            </p>
            <p className="sr-only" aria-live="polite">{copied ? 'Link copied to the clipboard' : ''}</p>
            {copied && <p className="files-copied" aria-hidden="true">Copied to the clipboard</p>}
          </div>
        )}
      </div>
    </li>
  );
}
