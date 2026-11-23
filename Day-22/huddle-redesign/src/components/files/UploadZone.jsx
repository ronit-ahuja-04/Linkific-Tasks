import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { MAX_FILE_BYTES, formatBytes } from '../../lib/files';

/** Drag and drop area. The real <input type="file"> and the button are the keyboard / screen reader way in. */
export default function UploadZone({ onFiles, busy, notes, noteId, onNoteChange }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function pick(fileList) {
    const files = Array.from(fileList ?? []);
    if (files.length) onFiles(files);
  }

  return (
    <section className="card files-upload" aria-labelledby="files-upload-title">
      <h2 id="files-upload-title" className="card-title files-h2">Upload a file</h2>
      <div
        className={`files-drop${dragging ? ' is-dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (!busy) pick(e.dataTransfer.files); }}
        data-testid="drop-zone"
      >
        <Upload size={22} aria-hidden="true" />
        <p>Drop files here, or</p>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? 'Uploading...' : 'Choose files'}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          aria-label="Choose files to upload"
          tabIndex={-1}
          disabled={busy}
          onChange={(e) => { pick(e.target.files); e.target.value = ''; }}
        />
        <p className="field-hint">Up to {formatBytes(MAX_FILE_BYTES)} each. Stored in the private "attachments" bucket.</p>
      </div>
      <div className="field files-note-pick">
        <label htmlFor="files-note">Attach to a note (optional)</label>
        <select id="files-note" value={noteId} onChange={(e) => onNoteChange(e.target.value)} disabled={busy}>
          <option value="">No note</option>
          {notes.map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
        </select>
      </div>
    </section>
  );
}
