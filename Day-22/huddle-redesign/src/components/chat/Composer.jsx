import { useEffect, useRef, useState } from 'react';
import { Paperclip, Send, X } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { MAX_ATTACHMENT_BYTES, MAX_BODY, formatBytes, insertMention, mentionQuery, searchUsernames } from '../../lib/chat';

/** The message box: Enter sends (Shift+Enter = new line), "@" + letters suggests usernames, a file can be attached */
export default function Composer({ onSend, onTyping, textareaRef }) {
  const { client } = useAuth();
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [active, setActive] = useState(0);
  const fileInput = useRef(null);
  const latest = useRef(0);

  // Mention autocomplete: runs when the text or the caret changes. Stale answers are ignored.
  const updateSuggestions = async (value, caret) => {
    const found = mentionQuery(value, caret);
    const ticket = ++latest.current;
    if (!found || !found.query) {
      setSuggestions([]);
      return;
    }
    const { data } = await searchUsernames(client, found.query);
    if (ticket === latest.current) {
      setSuggestions(data ?? []);
      setActive(0);
    }
  };

  useEffect(() => () => { latest.current += 1; }, []);

  const change = (event) => {
    setText(event.target.value);
    onTyping?.();
    updateSuggestions(event.target.value, event.target.selectionStart ?? event.target.value.length);
  };

  const pick = (username) => {
    const el = textareaRef?.current;
    const caret = el?.selectionStart ?? text.length;
    const next = insertMention(text, caret, username);
    setText(next.text);
    setSuggestions([]);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(next.caret, next.caret);
    });
  };

  const chooseFile = (event) => {
    const chosen = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (chosen && chosen.size > MAX_ATTACHMENT_BYTES) {
      setFile(null);
      setFileError(`"${chosen.name}" is ${formatBytes(chosen.size)}. The limit is 10 MB.`);
      return;
    }
    setFileError('');
    setFile(chosen);
  };

  const submit = async (event) => {
    event?.preventDefault();
    if (sending || (!text.trim() && !file)) return;
    setSending(true);
    setError('');
    const failure = await onSend({ body: text.trim() || `Shared ${file.name}`, file });
    setSending(false);
    if (failure) {
      setError(failure);
      return;
    }
    setText('');
    setFile(null);
    setSuggestions([]);
    textareaRef?.current?.focus();
  };

  const keyDown = (event) => {
    if (suggestions.length) {
      if (event.key === 'ArrowDown') { event.preventDefault(); setActive((i) => (i + 1) % suggestions.length); return; }
      if (event.key === 'ArrowUp') { event.preventDefault(); setActive((i) => (i - 1 + suggestions.length) % suggestions.length); return; }
      if (event.key === 'Enter' || event.key === 'Tab') { event.preventDefault(); pick(suggestions[active].username); return; }
      if (event.key === 'Escape') { setSuggestions([]); return; }
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form className="chat-composer" onSubmit={submit}>
      {error ? <p role="alert" className="alert alert-error">{error}</p> : null}
      {fileError ? <p role="alert" className="field-error">{fileError}</p> : null}
      {file ? (
        <p className="chat-file-chip">
          <Paperclip size={14} aria-hidden="true" /> {file.name} <span className="muted">({formatBytes(file.size)})</span>
          <button type="button" className="icon-btn chat-icon" aria-label={`Remove ${file.name}`} onClick={() => setFile(null)} disabled={sending}><X size={14} aria-hidden="true" /></button>
        </p>
      ) : null}
      <div className="chat-compose-row">
        <div className="chat-compose-field">
          <label className="sr-only" htmlFor="chat-input">Message</label>
          <textarea
            id="chat-input" ref={textareaRef} rows={2} maxLength={MAX_BODY} value={text} onChange={change} onKeyDown={keyDown}
            placeholder="Write a message. Enter to send, Shift+Enter for a new line, @ to mention"
            role="combobox" aria-expanded={suggestions.length > 0} aria-controls="chat-mentions" aria-autocomplete="list"
            aria-activedescendant={suggestions.length ? `mention-${active}` : undefined}
          />
          {suggestions.length ? (
            <ul id="chat-mentions" role="listbox" aria-label="People to mention" className="chat-mentions">
              {suggestions.map((s, i) => (
                <li key={s.id} id={`mention-${i}`} role="option" aria-selected={i === active} className={i === active ? 'is-active' : ''}
                  onMouseDown={(e) => { e.preventDefault(); pick(s.username); }}>
                  @{s.username} {s.full_name ? <span className="muted">{s.full_name}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <input ref={fileInput} type="file" className="sr-only" tabIndex={-1} aria-label="Attach a file" onChange={chooseFile} />
        <button type="button" className="icon-btn" aria-label="Attach a file" onClick={() => fileInput.current?.click()} disabled={sending}><Paperclip size={18} aria-hidden="true" /></button>
        <button type="submit" className="btn btn-primary" disabled={sending || (!text.trim() && !file)}><Send size={16} aria-hidden="true" /> {sending ? 'Sending...' : 'Send'}</button>
      </div>
    </form>
  );
}
