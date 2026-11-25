import { useCallback, useEffect, useRef, useState } from 'react';
import { List, useDynamicRowHeight } from 'react-window';
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

/** Day 24: the preview is the 160 px thumbnail when there is one (a few KB), not the original photo (often MBs) */
const previewPath = (f) => f.thumb_path ?? f.path;

export default function FilesPage() {
  const { client, user, profile } = useAuth();
  const toast = useToast();
  const userId = user?.id;
  const [files, setFiles] = useState([]);
  const [total, setTotal] = useState(0); // all my files; `files` holds the pages loaded so far
  const loadingMore = useRef(false);
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
      setTotal(f.count ?? (f.data ?? []).length);
      setNotes(n.data ?? []);
      setState('ready');
    });
    return () => { active = false; };
  }, [client, userId]);

  // Image previews: ONE request for all signed URLs (createSignedUrls). Only new image paths are requested.
  // Day 24: the 160 px thumbnail when there is one (a few KB), not the original photo (often MBs).
  const imagePaths = files.filter((f) => isImage(f.mime)).map(previewPath).join('|');
  useEffect(() => {
    if (!client || !imagePaths) return undefined;
    let active = true;
    createPreviewUrls(client, imagePaths.split('|')).then(({ data }) => { if (active) setPreviews(data); });
    return () => { active = false; };
  }, [client, imagePaths]);

  // INFINITE SCROLL inside a VIRTUALISED list (Day 24). react-window renders only the rows near the screen (a few dozen
  // DOM rows, whether there are 100 files or 10,000). When the rows it renders come within 10 of the end of what is
  // loaded, the next page of 100 is fetched. Row heights are measured (useDynamicRowHeight), because a row grows
  // when its share link is open, and on phones.
  const rowHeight = useDynamicRowHeight({ defaultRowHeight: 96 });
  const loadMore = useCallback(async (from) => {
    if (loadingMore.current) return;
    loadingMore.current = true;
    const { data, error } = await listFiles(client, userId, { from });
    loadingMore.current = false;
    if (error) { toast.error(`Could not load more files: ${describeError(error)}`); return; }
    setFiles((list) => {
      const known = new Set(list.map((f) => f.id));
      return [...list, ...(data ?? []).filter((f) => !known.has(f.id))];
    });
  }, [client, userId, toast]);
  const onRowsRendered = (_visible, all) => {
    if (all.stopIndex >= files.length - 10 && files.length < total) loadMore(files.length);
  };
  // rowKey must be stable (react-window's docs: "always useCallback"), and keyed by id: a row's own state (an open
  // share link, a delete confirmation) stays with its file when an upload shifts everything down one place.
  const rowKey = useCallback((index, data) => data.files[index].id, []);

  const upload = useCallback(async (picked) => {
    setBusy(true);
    let done = 0;
    for (const file of picked) {
      setStatus(`Uploading ${file.name}...`);
      const { data, error } = await uploadFile(client, userId, file, { noteId: noteId || null });
      if (error) toast.error(`${file.name}: ${describeError(error)}`);
      else { done += 1; setFiles((list) => [data, ...list]); setTotal((t) => t + 1); }
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
      setTotal((t) => Math.max(0, t - 1));
      setStatus(`Deleted ${file.name}.`);
      headingRef.current?.focus(); // the deleted row is gone, so move focus somewhere sensible
    },
  };


  // a plain object, not useMemo: `actions` is new on every render anyway, and react-window compares these values itself
  const rowProps = { files, previews, previewPath, actions, busy, total };

  return (
    <div className="files-page">
      <PageHeader title="Files" description="Private storage for your attachments, with links that expire." />

      <UploadZone onFiles={upload} busy={busy} notes={notes} noteId={noteId} onNoteChange={setNoteId} />
      <p className="sr-only" role="status">{status}</p>
      {status && <p className="files-status" aria-hidden="true">{status}</p>}

      <section className="card" aria-labelledby="files-list-title">
        <div className="card-header">
          <h2 id="files-list-title" className="card-title files-h2" tabIndex={-1} ref={headingRef}>My files</h2>
          {state === 'ready' && total > 0 ? <span className="files-count">{total} {total === 1 ? 'file' : 'files'}</span> : null}
        </div>
        {state === 'loading' && <p role="status" className="muted">Loading your files...</p>}
        {state === 'error' && <p className="alert alert-error" role="alert">Could not load files: {loadError}</p>}
        {state === 'ready' && files.length === 0 && (
          <EmptyState compact icon={<FolderOpen size={20} />} title="No files yet">
            Upload one above. Images get a preview, and any file can get a link that expires.
          </EmptyState>
        )}
        {state === 'ready' && files.length > 0 && (
          <List className="files-list" scrollElement="window" rowComponent={FileListRow} rowCount={files.length} rowHeight={rowHeight} rowKey={rowKey}
            rowProps={rowProps} overscanCount={4} onRowsRendered={onRowsRendered} />
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

/** One row of the virtualised list: react-window passes the index, the position (style) and the row's ARIA attributes */
function FileListRow({ index, style, ariaAttributes, files, previews, previewPath, actions, busy, total }) {
  const file = files[index];
  // react-window counts the rows it was given (the pages loaded so far); a screen reader should hear the real total
  const aria = { ...ariaAttributes, 'aria-setsize': total };
  return <FileRow file={file} previewUrl={previews[previewPath(file)]} actions={actions} busy={busy} style={style} ariaAttributes={aria} />;
}
