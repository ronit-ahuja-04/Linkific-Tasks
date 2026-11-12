import { useMemo, useState } from 'react';
import get from 'lodash/get';
import sortBy from 'lodash/sortBy';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { COUNTRIES, DEPARTMENTS, SKILLS, fullName } from '../data/generateUsers';
import {
  changedPaths, coerce, createDraft, getField, hasField, isDirty, labelFor, publicPayload, resetField, setField, toggleSkill, validate,
} from '../lib/form';
import '../styles/profile.css';

const PICKER_SIZE = 200;
const LANGUAGES = ['en', 'es', 'hi', 'de', 'fr'];

const show = (value) => (typeof value === 'string' ? `"${value}"` : JSON.stringify(value));

/** One generic input: it only knows a PATH, reads with getField and reports changes by path */
function Field({ draft, path, type = 'text', options, errors, touched, onChange, onTouch, step }) {
  const id = `f-${path}`;
  const value = getField(draft, path, type === 'checkbox' ? false : '');
  const error = touched[path] ? errors[path] : undefined;
  const errorId = `${id}-error`;
  const common = { id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': error ? errorId : undefined, onBlur: () => onTouch(path) };
  if (type === 'checkbox') {
    return (
      <label className="check" htmlFor={id}>
        <input type="checkbox" id={id} checked={Boolean(value)} onChange={(e) => onChange(path, e.target.checked)} />
        {labelFor(path)}
      </label>
    );
  }
  return (
    <div className="field">
      <label htmlFor={id}>{labelFor(path)}</label>
      {options ? (
        <select {...common} value={value} onChange={(e) => onChange(path, e.target.value)}>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input {...common} type={type} step={step} value={value} onChange={(e) => onChange(path, e.target.value)} />
      )}
      {error && <span id={errorId} className="field-error">{error}</span>}
    </div>
  );
}

function ProfileForm({ user }) {
  const { saveUser } = useData();
  const toast = useToast();
  const original = useMemo(() => createDraft(user), [user]);
  const [draft, setDraft] = useState(() => createDraft(user));
  const [touched, setTouched] = useState({});

  const current = useMemo(() => coerce(draft), [draft]);
  const errors = useMemo(() => validate(draft), [draft]);
  const changes = useMemo(() => changedPaths(original, current), [original, current]);
  const dirty = isDirty(original, current);
  const valid = Object.keys(errors).length === 0;

  const touch = (path) => setTouched((t) => ({ ...t, [path]: true }));
  const change = (path, value) => {
    setDraft((d) => setField(d, path, value));
    touch(path);
  };
  const props = { draft, errors, touched, onChange: change, onTouch: touch };

  const save = (event) => {
    event.preventDefault();
    if (!valid || !dirty) return;
    const saved = { ...user, ...current };
    saveUser(saved);
    toast.success(`Saved ${fullName(saved)}`);
    setDraft(createDraft(saved));
    setTouched({});
  };

  return (
    <div className="profile-grid">
      <form className="card stack" onSubmit={save} noValidate aria-label="Profile form">
        <fieldset className="fs">
          <legend>Basics</legend>
          <div className="fs-grid">
            <Field {...props} path="firstName" />
            <Field {...props} path="lastName" />
            <Field {...props} path="email" type="email" />
            <Field {...props} path="age" type="number" />
            <Field {...props} path="department" options={DEPARTMENTS} />
            <Field {...props} path="role" />
          </div>
        </fieldset>
        <fieldset className="fs">
          <legend>Address</legend>
          <div className="fs-grid">
            <Field {...props} path="address.street" />
            <Field {...props} path="address.city" />
            <Field {...props} path="address.country" options={Object.keys(COUNTRIES)} />
            <Field {...props} path="address.geo.lat" type="number" step="any" />
            <Field {...props} path="address.geo.lng" type="number" step="any" />
          </div>
        </fieldset>
        <fieldset className="fs">
          <legend>Preferences</legend>
          <div className="fs-grid">
            <Field {...props} path="preferences.theme" options={['light', 'dark']} />
            <Field {...props} path="preferences.language" options={LANGUAGES} />
          </div>
          <div className="checks">
            {['email', 'push', 'sms'].map((k) => <Field key={k} {...props} type="checkbox" path={`preferences.notifications.${k}`} />)}
            {['showSalary', 'showEmail'].map((k) => <Field key={k} {...props} type="checkbox" path={`preferences.privacy.${k}`} />)}
          </div>
        </fieldset>
        <fieldset className="fs" aria-describedby={errors.skills ? 'skills-error' : undefined}>
          <legend>Skills</legend>
          <div className="checks">
            {SKILLS.map((skill) => (
              <label key={skill} className="check">
                <input
                  type="checkbox"
                  checked={draft.skills.includes(skill)}
                  onChange={() => { setDraft((d) => toggleSkill(d, skill)); touch('skills'); }}
                />
                {skill}
              </label>
            ))}
          </div>
          {touched.skills && errors.skills && <span id="skills-error" className="field-error">{errors.skills}</span>}
        </fieldset>
        <div className="row">
          <button type="submit" className="btn btn-primary" disabled={!valid || !dirty}>Save</button>
          {!valid && <span className="field-error">Fix the highlighted fields to save.</span>}
        </div>
      </form>

      <aside className="stack">
        <section className="card" aria-labelledby="changes-h">
          <h3 id="changes-h">Changes</h3>
          <p role="status" aria-live="polite" className={dirty ? 'dirty-badge is-dirty' : 'dirty-badge'}>
            {dirty ? 'Dirty: unsaved changes' : 'Clean: nothing to save'}
          </p>
          {changes.length === 0 ? <p className="muted">No changes yet.</p> : (
            <ul className="changes" aria-label="Changed fields">
              {changes.map((path) => (
                <li key={path}>
                  <code className="change-path">{path}</code>
                  <span className="change-val">
                    {show(getField(original, path, undefined))} → {show(getField(current, path, undefined))}
                  </span>
                  <button type="button" className="btn btn-sm" aria-label={`Undo ${path}`} onClick={() => setDraft((d) => resetField(d, original, path))}>Undo</button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="btn btn-sm" disabled={!dirty} onClick={() => { setDraft(createDraft(user)); setTouched({}); }}>Reset all</button>
        </section>

        <section className="card" aria-labelledby="payload-h">
          <h3 id="payload-h">Public payload</h3>
          <p className="card-sub">
            <code>omit(draft, [&apos;salary&apos;, &apos;preferences.privacy&apos;, &apos;address.street&apos;])</code> hides these paths, nested ones included.
          </p>
          <pre className="codebox payload" tabIndex={0}>{JSON.stringify(publicPayload(draft), null, 2)}</pre>
        </section>

        <section className="card" aria-labelledby="safe-h">
          <h3 id="safe-h">Safe reads</h3>
          <ul className="safe">
            <li><code>get(draft, &apos;address.geo.lat&apos;, &apos;n/a&apos;)</code> → <strong>{String(get(draft, 'address.geo.lat', 'n/a'))}</strong></li>
            <li><code>get(draft, &apos;contact.phone&apos;, &apos;n/a&apos;)</code> → <strong>{String(get(draft, 'contact.phone', 'n/a'))}</strong></li>
            <li><code>has(draft, &apos;address.geo&apos;)</code> → <strong>{String(hasField(draft, 'address.geo'))}</strong></li>
            <li><code>has(draft, &apos;contact.phone&apos;)</code> → <strong>{String(hasField(draft, 'contact.phone'))}</strong></li>
          </ul>
        </section>
      </aside>
    </div>
  );
}

export default function ProfileScreen() {
  const { users, selectedId, setSelectedId } = useData();
  const choices = useMemo(() => {
    const first = sortBy(users.slice(0, PICKER_SIZE), ['firstName', 'lastName']);
    const selected = users.find((u) => u.id === selectedId);
    return selected && !first.includes(selected) ? [selected, ...first] : first;
  }, [users, selectedId]);
  const user = users.find((u) => u.id === selectedId) ?? users[0];

  return (
    <section className="profile" aria-labelledby="profile-h">
      <h2 id="profile-h" className="sr-only">Profile form</h2>
      <div className="card stack picker">
        <div className="field">
          <label htmlFor="user-picker">Choose a user</label>
          <select id="user-picker" value={user.id} onChange={(e) => setSelectedId(Number(e.target.value))}>
            {choices.map((u) => <option key={u.id} value={u.id}>{fullName(u)} ({u.email})</option>)}
          </select>
        </div>
        <p className="muted">Draft is a cloneDeep: editing it never touches the saved user until you save.</p>
      </div>
      <ProfileForm key={user.id} user={user} />
    </section>
  );
}
