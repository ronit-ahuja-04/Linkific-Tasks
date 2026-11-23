import { useEffect, useRef, useState } from 'react';
import { Plus, Radio } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../context/ToastContext';
import NoteCard from '../components/notes/NoteCard';
import NoteFilters from '../components/notes/NoteFilters';
import NoteForm from '../components/notes/NoteForm';
import SearchResults from '../components/notes/SearchResults';
import {
  DEFAULT_FILTERS, PAGE_SIZE, createNote, deleteNote, flattenTags, getNote, listNotes, listTags, mapNoteError,
  searchNotes, setNoteTags, subscribeToNotes, updateNote,
} from '../lib/notes';
import '../styles/notes.css';

export default function NotesPage() {
  const { client, user } = useAuth();
  const toast = useToast();
  const userId = user?.id;

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState({ key: '', data: [], count: 0, error: null });
  const [tags, setTags] = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | a note
  const [confirmId, setConfirmId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [announce, setAnnounce] = useState('');
  const [live, setLive] = useState('connecting');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState({ term: '', data: [], error: null });
  const headingRef = useRef(null);
  const newButtonRef = useRef(null);

  useEffect(() => { document.title = 'Notes · Huddle'; }, []);

  // The list. `key` identifies the request; while the stored result has another key we are loading (and keep showing the old rows).
  const key = `${reloadKey}|${page}|${JSON.stringify(filters)}`;
  useEffect(() => {
    let active = true;
    listNotes(client, { userId, filters, page }).then((next) => { if (active) setResult({ key, ...next }); });
    return () => { active = false; };
  }, [client, userId, filters, page, key]);

  useEffect(() => {
    let active = true;
    listTags(client).then(({ data }) => { if (active) setTags(data ?? []); });
    return () => { active = false; };
  }, [client, reloadKey]);

  // Full-text search through rpc('search_notes')
  useEffect(() => {
    if (!searchTerm) return undefined;
    let active = true;
    searchNotes(client, searchTerm).then((next) => { if (active) setSearchResult({ term: searchTerm, ...next }); });
    return () => { active = false; };
  }, [client, searchTerm, reloadKey]);

  // Realtime: a change to any note I may read (mine in another tab, a teammate's team note) refreshes the list
  useEffect(() => {
    const stop = subscribeToNotes(client, {
      onChange: (payload) => {
        setReloadKey((k) => k + 1);
        setAnnounce(`A note was ${payload.eventType === 'INSERT' ? 'added' : payload.eventType === 'DELETE' ? 'deleted' : 'updated'} live.`);
      },
      onStatus: (status) => setLive(status === 'SUBSCRIBED' ? 'live' : status === 'CLOSED' ? 'offline' : status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' ? 'error' : 'connecting'),
    });
    return stop;
  }, [client]);

  const loading = result.key !== key;
  const totalPages = Math.max(1, Math.ceil(result.count / PAGE_SIZE));
  const firstShown = result.count === 0 ? 0 : page * PAGE_SIZE + 1;
  const lastShown = page * PAGE_SIZE + result.data.length;

  const closeForm = (message) => {
    setEditing(null);
    setReloadKey((k) => k + 1);
    if (message) setAnnounce(message);
    // focus goes back to the heading of the list so a keyboard user does not land at the top of the page
    setTimeout(() => headingRef.current?.focus(), 0);
  };

  const saveNote = async (values) => {
    const isEdit = editing && editing !== 'new';
    const saved = isEdit ? await updateNote(client, editing.id, values) : await createNote(client, userId, values);
    if (saved.error) return mapNoteError(saved.error);
    const tagged = await setNoteTags(client, userId, saved.data.id, values.tags, isEdit ? flattenTags(editing) : []);
    if (tagged.error) {
      closeForm();
      toast.error(`Saved, but the tags failed: ${mapNoteError(tagged.error)}`);
      return '';
    }
    toast.success(isEdit ? 'Note updated' : 'Note created');
    closeForm(isEdit ? 'Note updated.' : 'Note created.');
    return '';
  };

  const removeNote = async (note) => {
    setBusy(true);
    const { error } = await deleteNote(client, note.id);
    setBusy(false);
    setConfirmId(null);
    if (error) { toast.error(mapNoteError(error)); return; }
    toast.success('Note deleted');
    if (result.data.length === 1 && page > 0) setPage(page - 1);
    setReloadKey((k) => k + 1);
    setAnnounce('Note deleted.');
    headingRef.current?.focus();
  };

  const editFromSearch = async (id) => {
    const { data, error } = await getNote(client, id);
    if (error || !data) { toast.error(mapNoteError(error) || 'That note is no longer available.'); return; }
    setEditing(data);
  };

  const applyFilters = (next) => { setFilters(next); setPage(0); };
  const submitSearch = (event) => { event.preventDefault(); setSearchTerm(searchInput.trim()); };
  const searching = Boolean(searchTerm);
  const searchLoading = searching && searchResult.term !== searchTerm;

  return (
    <div className="notes-page">
      <div className="notes-title-row">
        <div>
          <h1 className="page-title">Notes</h1>
          <p className="page-sub">Yours and your team's. Row Level Security decides which ones you can see.</p>
        </div>
        <span className={`notes-live notes-live-${live}`} role="status">
          <Radio size={14} aria-hidden="true" /> {live === 'live' ? 'Live' : live === 'connecting' ? 'Connecting...' : 'Offline'}
        </span>
      </div>

      <details className="notes-how card">
        <summary>How this page works (the supabase-js calls)</summary>
        <ul>
          <li><code>from('notes').select('*, owner:profiles(...), note_tags(tags(...))', {'{ count: \'exact\' }'})</code>: one request, three tables joined by PostgREST.</li>
          <li><code>.eq() .gt() .lt() .gte() .ilike()</code> become <code>WHERE</code> conditions; <code>.order()</code> becomes <code>ORDER BY</code>; <code>.range(0, 5)</code> becomes <code>LIMIT 6 OFFSET 0</code>.</li>
          <li><code>insert([...]).select().single()</code>, <code>update(...).eq('id', id)</code>, <code>delete().eq('id', id)</code>: RLS only lets you change your own notes.</li>
          <li><code>rpc('search_notes', {'{ q }'})</code>: full-text search in a database function; matches come back wrapped in [[ ]] and are shown with {'<mark>'}.</li>
          <li><code>channel().on('postgres_changes', ...)</code>: Realtime pushes row changes (only rows RLS lets you read) so the list refreshes by itself.</li>
        </ul>
      </details>

      <form className="notes-search" role="search" onSubmit={submitSearch}>
        <div className="field notes-search-field">
          <label htmlFor="notes-search-input">Full-text search</label>
          <input id="notes-search-input" type="search" className="input" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder='Try: meeting -budget, or "launch plan"' />
        </div>
        <button type="submit" className="btn btn-primary">Search</button>
        {searching && <button type="button" className="btn" onClick={() => { setSearchInput(''); setSearchTerm(''); }}>Clear search</button>}
      </form>

      <div className="notes-toolbar">
        <button type="button" ref={newButtonRef} className="btn btn-primary" onClick={() => setEditing('new')} disabled={editing === 'new'}>
          <Plus size={16} aria-hidden="true" /> New note
        </button>
      </div>

      {editing && (
        <NoteForm key={editing === 'new' ? 'new' : editing.id} note={editing === 'new' ? null : editing} onSave={saveNote} onCancel={() => { setEditing(null); newButtonRef.current?.focus(); }} />
      )}

      {searching ? (
        <section aria-labelledby="notes-heading">
          <h2 id="notes-heading" tabIndex={-1} ref={headingRef} className="notes-heading">Search results for "{searchTerm}"</h2>
          <div aria-live="polite" className="notes-status">
            {searchLoading ? 'Searching...' : searchResult.error ? '' : `${searchResult.data.length} result${searchResult.data.length === 1 ? '' : 's'}`}
          </div>
          {searchResult.term === searchTerm && searchResult.error && <p className="alert alert-error" role="alert">{mapNoteError(searchResult.error)}</p>}
          {!searchLoading && !searchResult.error && searchResult.data.length === 0 && <p className="muted notes-empty">Nothing matches. Search looks at titles and bodies, with stemming ("plans" finds "plan").</p>}
          {!searchLoading && <SearchResults results={searchResult.data} userId={userId} onEdit={editFromSearch} />}
        </section>
      ) : (
        <>
          <NoteFilters key={JSON.stringify(filters)} filters={filters} tags={tags} onApply={applyFilters} />
          <section aria-labelledby="notes-heading" aria-busy={loading}>
            <h2 id="notes-heading" tabIndex={-1} ref={headingRef} className="notes-heading">All notes</h2>
            <div aria-live="polite" className="notes-status">
              {loading && result.key === '' ? 'Loading notes...' : result.error ? '' : result.count === 0 ? '' : `Showing ${firstShown} to ${lastShown} of ${result.count} notes`}
            </div>
            {result.error && <p className="alert alert-error" role="alert">{mapNoteError(result.error)}</p>}
            {!loading && !result.error && result.count === 0 && (
              <p className="muted notes-empty">No notes match. Create one, or relax the filters.</p>
            )}
            <ul className={`notes-grid${loading ? ' notes-loading' : ''}`}>
              {result.data.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isMine={note.owner_id === userId}
                  confirmingDelete={confirmId === note.id}
                  busy={busy}
                  onEdit={setEditing}
                  onAskDelete={(n) => setConfirmId(n.id)}
                  onCancelDelete={() => setConfirmId(null)}
                  onDelete={removeNote}
                />
              ))}
            </ul>
            {result.count > PAGE_SIZE && (
              <nav className="notes-pager" aria-label="Pagination">
                <button type="button" className="btn" disabled={page === 0 || loading} onClick={() => setPage(page - 1)}>Previous</button>
                <span>Page {page + 1} of {totalPages}</span>
                <button type="button" className="btn" disabled={page + 1 >= totalPages || loading} onClick={() => setPage(page + 1)}>Next</button>
              </nav>
            )}
          </section>
        </>
      )}
      <p className="sr-only" role="status" aria-live="polite">{announce}</p>
    </div>
  );
}
