import { useState } from 'react';
import { avatarUrl } from '../../lib/avatars';
import { plainObjectUrl, probeUrl } from '../../lib/files';

/**
 * PUBLIC vs PRIVATE buckets, with a live test. Both tests call fetch() WITHOUT an Authorization header, which is
 * exactly what a stranger who only has the URL can do.
 */
export default function BucketsPanel({ client, profile, userId, sampleFile }) {
  const [publicResult, setPublicResult] = useState(null);
  const [privateResult, setPrivateResult] = useState(null);
  const [busy, setBusy] = useState(null);

  const publicUrl = avatarUrl(client, profile?.avatar_path);
  // For the private demo any path works; a real one makes the point best ("the file exists and still no")
  const privatePath = sampleFile?.path ?? `${userId}/example.txt`;
  const privateUrl = plainObjectUrl(client, privatePath);

  async function run(kind, url) {
    setBusy(kind);
    const result = await probeUrl(url);
    (kind === 'public' ? setPublicResult : setPrivateResult)(result);
    setBusy(null);
  }

  return (
    <section className="card files-buckets" aria-labelledby="files-buckets-title">
      <h2 id="files-buckets-title" className="files-h2">Public bucket vs private bucket</h2>
      <div className="files-bucket-grid">
        <div>
          <h3>avatars <span className="badge">public</span></h3>
          <p>Anyone who has the URL can open the picture, no sign-in. Fine for profile photos. The URL never changes and is built locally with <code>getPublicUrl(path)</code> (no request is sent).</p>
        </div>
        <div>
          <h3>attachments <span className="badge">private</span></h3>
          <p>Nothing is readable without a policy or a signature. You (signed in) can read your own files with <code>download()</code>. To let someone else in, make a <strong>signed URL</strong>: a normal link with a signature in it that stops working after the time you choose.</p>
        </div>
      </div>

      <div className="files-demo">
        <div className="files-demo-item">
          <h3>Demo 1: a public URL opens for anyone</h3>
          {publicUrl ? (
            <>
              <code className="files-url">{publicUrl}</code>
              <button type="button" className="btn btn-sm" disabled={busy !== null} onClick={() => run('public', publicUrl)}>Open my avatar without signing in</button>
            </>
          ) : (
            <p className="muted">Set a profile picture on the Profile page, then come back to open it without signing in.</p>
          )}
          <div aria-live="polite">
            {publicResult && (
              <p className={publicResult.ok ? 'files-result files-result-ok' : 'files-result files-result-bad'} data-testid="public-result">
                {publicResult.ok ? `Opened (HTTP ${publicResult.status}): public means no signature needed.` : `Failed${publicResult.status ? ` (HTTP ${publicResult.status})` : ''}.`}
              </p>
            )}
          </div>
        </div>
        <div className="files-demo-item">
          <h3>Demo 2: the private object's plain URL is refused</h3>
          <code className="files-url">{privateUrl}</code>
          <button type="button" className="btn btn-sm" disabled={busy !== null} onClick={() => run('private', privateUrl)}>Try to open it without a signature</button>
          <div aria-live="polite">
            {privateResult && (
              <p className={privateResult.ok ? 'files-result files-result-bad' : 'files-result files-result-ok'} data-testid="private-result">
                {privateResult.ok
                  ? `Opened (HTTP ${privateResult.status}): that should not happen for a private bucket.`
                  : `Refused${privateResult.status ? ` (HTTP ${privateResult.status})` : ''}: a private bucket has no public URL. Use a signed URL instead.`}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
