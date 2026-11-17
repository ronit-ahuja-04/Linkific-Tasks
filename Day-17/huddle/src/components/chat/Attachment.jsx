import { useState } from 'react';
import { Paperclip } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { formatBytes, friendlyError, signedDownloadUrl } from '../../lib/chat';

/**
 * An attachment is never shown as a link to the file. The file is in a PRIVATE bucket, so we ask Storage for a
 * SIGNED URL (valid 60 seconds) at the moment of the click, and open it. Nothing permanent is ever on the page.
 */
export default function Attachment({ file }) {
  const { client } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const download = async () => {
    setBusy(true);
    setError('');
    const { data, error: failure } = await signedDownloadUrl(client, file, 60);
    setBusy(false);
    if (failure || !data?.signedUrl) {
      setError(friendlyError(failure, 'Could not create a download link.'));
      return;
    }
    // a temporary link element: clicking it downloads (the URL asks the server for Content-Disposition: attachment)
    const link = document.createElement('a');
    link.href = data.signedUrl;
    link.rel = 'noopener';
    link.click();
  };

  return (
    <span className="chat-attachment">
      <button type="button" className="btn btn-sm" onClick={download} disabled={busy}>
        <Paperclip size={14} aria-hidden="true" />
        {busy ? 'Preparing...' : `Download ${file.name}`}
      </button>
      <span className="muted chat-attachment-size">{formatBytes(file.size)}</span>
      {error ? <span role="alert" className="field-error">{error}</span> : null}
    </span>
  );
}
