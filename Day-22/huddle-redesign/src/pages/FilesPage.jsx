import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../context/ToastContext';
import UploadZone from '../components/files/UploadZone';
import FileRow from '../components/files/FileRow';
import BucketsPanel from '../components/files/BucketsPanel';
import {
  createPreviewUrls, createShareLink, deleteFile, describeError, downloadFile, isImage, listFiles, listMyNotes, uploadFile,
} from '../lib/files';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import UnderTheHood from '../components/ui/UnderTheHood';
import { FolderOpen } from 'lucide-react';
import '../styles/files.css';

export default function FilesPage() {
  const { client, user, profile } = useAuth();
  const toast = useToast();
  const userId = user?.id;
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState([]);
  const [previews, setPreviews] = useState({});
  const [state, setState] = useState('loading'); // loading | ready | error
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [noteId, setNoteId] = useState('');
  const [status, setStatus] = useState('');
  const headingRef = useRef(null);

  useEffect(() => { document.title = 'Files · Huddle'; }, []);

  // Load my files and my notes once. `active` stops a late answer from updating an unmounted page (StrictMode runs effects twice).
  useEffect(() => {
    if (!client || !userId) return undefined;
    let active = true;
    Promise.all([listFiles(client, userId), listMyNotes(client, userId)]).then(([f, n]) => {
      if (!active) return;
      if (f.error) { setLoadError(describeError(f.error)); setState('error'); return; }
      setFiles(f.data ?? []);
      setNotes(n.data ?? []);
      setState('ready');
    });
    return () => { active = false; };
  }, [client, userId]);

  // Image previews: ONE request for all signed URLs (createSignedUrls). Only new image paths are requested.
  const imagePaths = files.filter((f) => isImage(f.mime)).map((f) => f.path).join('|');
  useEffect(() => {
    if (!client || !imagePaths) return undefined;
    let active = true;
    createPreviewUrls(client, imagePaths.split('|')).then(({ data }) => { if (active) setPreviews(data); });
    return () => { active = false; };
  }, [client, imagePaths]);

  const upload = useCallback(async (picked) => {
    setBusy(true);
    let done = 0;
    for (const file of picked) {
      setStatus(`Uploading ${file.name}...`);
      const { data, error } = await uploadFile(client, userId, file, { noteId: noteId || null });
      if (error) toast.error(`${file.name}: ${describeError(error)}`);
      else { done += 1; setFiles((list) => [data, ...list]); }
    }
    setStatus(done ? `Uploaded ${done} file${done === 1 ? '' : 's'}.` : '');
    if (done) toast.success(`Uploaded ${done} file${done === 1 ? '' : 's'}`);
    setBusy(false);
  }, [client, userId, noteId, toast]);

  const actions = {
    async download(file) {
      const { data, error } = await downloadFile(client, file);
      if (error || !data) { toast.error(`Download failed: ${describeError(error)}`); return; }
      // A Blob lives in memory; an object URL lets a hidden <a download> save it, then we free it
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url; a.download = file.name;
      document.body.append(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    },
    async share(file, seconds) {
      const { data, error } = await createShareLink(client, file.path, seconds);
      if (error) { toast.error(`Could not create a link: ${describeError(error)}`); return null; }
      return data;
    },
    async copy(text) {
      try { await navigator.clipboard.writeText(text); return true; }
      catch { toast.error('Could not copy. Select the link and copy it by hand.'); return false; }
    },
    async remove(file) {
      setBusy(true);
      const { error } = await deleteFile(client, file);
      setBusy(false);
      if (error) { toast.error(`Could not delete: ${describeError(error)}`); return; }
      setFiles((list) => list.filter((f) => f.id !== file.id));
      setStatus(`Deleted ${file.name}.`);
      headingRef.current?.focus(); // the deleted row is gone, so move focus somewhere sensible
    },
  };

  return (
    <div className="files-page">
      <PageHeader title="Files" description="Private storage for your attachments, with links that expire." />

      <UploadZone onFiles={upload} busy={busy} notes={notes} noteId={noteId} onNoteChange={setNoteId} />
      <p className="sr-only" role="status">{status}</p>
      {status && <p className="files-status" aria-hidden="true">{status}</p>}

      <section className="card" aria-labelledby="files-list-title">
        <div className="card-header">
          <h2 id="files-list-title" className="card-title files-h2" tabIndex={-1} ref={headingRef}>My files</h2>
          {state === 'ready' && files.length > 0 ? <span className="files-count">{files.length} {files.length === 1 ? 'file' : 'files'}</span> : null}
        </div>
        {state === 'loading' && <p role="status" className="muted">Loading your files...</p>}
        {state === 'error' && <p className="alert alert-error" role="alert">Could not load files: {loadError}</p>}
        {state === 'ready' && files.length === 0 && (
          <EmptyState compact icon={<FolderOpen size={20} />} title="No files yet">
            Upload one above. Images get a preview, and any file can get a link that expires.
          </EmptyState>
        )}
        {state === 'ready' && files.length > 0 && (
          <ul className="files-list">
            {files.map((f) => <FileRow key={f.id} file={f} previewUrl={previews[f.path]} actions={actions} busy={busy} />)}
          </ul>
        )}
      </section>

      <UnderTheHood title="Under the hood: storage calls, and public vs private buckets">
        <ul>
          <li><code>storage.from(&apos;attachments&apos;).upload(path, file, &#123; upsert: false &#125;)</code>: send the bytes to a private bucket.</li>
          <li><code>from(&apos;files&apos;).insert(&#123;...&#125;)</code>: save the record (name, size, note). If this fails, the bytes are removed again.</li>
          <li><code>from(&apos;files&apos;).select(&apos;*, note:notes(title)&apos;)</code>: list my files with the note joined in.</li>
          <li><code>storage.download(path)</code>: read a private file as me. <code>createSignedUrl(path, seconds)</code>: a temporary link anyone can open.</li>
          <li><code>storage.remove([path])</code> then <code>from(&apos;files&apos;).delete().eq(&apos;id&apos;, id)</code>.</li>
        </ul>
        <BucketsPanel client={client} profile={profile} userId={userId} sampleFile={files[0]} />
      </UnderTheHood>
    </div>
  );
}
