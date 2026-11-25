import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, CircleAlert, CircleCheck, FileText, Inbox, Info, Plus, Search, Trash2, TriangleAlert, X } from 'lucide-react';
import { CONTRAST_PAIRS, contrastRatio, formatRatio, toHex } from '../lib/contrast';
import { RADII, SCALES, SEMANTIC_GROUPS, SHADOWS, SPACING, TYPE_SCALE } from '../lib/designTokens';
import CountBadge from '../components/ui/CountBadge';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import RelativeTime from '../components/ui/RelativeTime';
import UnderTheHood from '../components/ui/UnderTheHood';
import ThemeToggle from '../components/ThemeToggle';
import '../styles/styleguide.css';

/**
 * THE LIVING STYLE GUIDE (/styleguide, public). Every colour on this page is read from the real CSS at run
 * time (a probe element per token, in a light and a dark scope), and the contrast table runs the same
 * function as `npm run contrast`. If a token changes, this page changes with it: design and code can not drift.
 */
const SECTIONS = [
  ['sg-principles', 'Principles'],
  ['sg-colour', 'Colour'],
  ['sg-contrast', 'Contrast'],
  ['sg-type', 'Typography'],
  ['sg-space', 'Spacing and layout'],
  ['sg-shape', 'Shape and elevation'],
  ['sg-components', 'Components'],
];

const PRINCIPLES = [
  ['Hierarchy', 'One h1 per page, one primary button per view. Size and weight say what matters first; colour is not needed for it.'],
  ['Contrast', 'Every text pair passes WCAG AA (4.5:1) in both themes, checked by a script. The amber accent is rare, so it stands out when it appears.'],
  ['Alignment', 'A 4px grid for every space and a 12-column layout grid. Things that line up read as one system.'],
  ['Proximity', 'Related things sit close (a label 4px from its input), groups sit apart (24px between cards). Space does the grouping, not boxes.'],
  ['Repetition', 'Every page opens with the same header and ends with the same "Under the hood" panel. Learn one page, know them all.'],
  ['White space', 'Generous padding and a 70-character line. Room to breathe is what makes a dense work tool feel calm.'],
];

const COLOR_TOKENS = [
  ...new Set([
    ...SCALES.flatMap((s) => s.steps.map((step) => `${s.prefix}-${step}`)),
    ...SEMANTIC_GROUPS.flatMap((g) => g.tokens.map(([name]) => name)),
    ...CONTRAST_PAIRS.flatMap((p) => [p.fg, p.bg]),
  ]),
];

/** Resolve each colour token to the colour the browser actually computes, inside a light and a dark scope */
function useResolvedColors(tokens) {
  const lightRef = useRef(null);
  const darkRef = useRef(null);
  const [values, setValues] = useState(null);
  useEffect(() => {
    const read = (container) => {
      const out = {};
      for (const token of tokens) {
        const probe = document.createElement('span');
        probe.style.color = `var(${token})`;
        container.appendChild(probe);
        out[token] = getComputedStyle(probe).color;
        probe.remove();
      }
      return out;
    };
    if (lightRef.current && darkRef.current) setValues({ light: read(lightRef.current), dark: read(darkRef.current) });
  }, [tokens]);
  return { lightRef, darkRef, values };
}

function Section({ id, title, intro, children }) {
  return (
    <section className="sg-section" aria-labelledby={id}>
      <h2 id={id} tabIndex={-1}>{title}</h2>
      {intro && <p className="sg-intro">{intro}</p>}
      {children}
    </section>
  );
}

function Verdict({ ratio, min }) {
  if (!Number.isFinite(ratio)) return <span className="sg-verdict">n/a</span>;
  const pass = Math.floor(ratio * 100) / 100 >= min;
  return (
    <span className={`sg-verdict ${pass ? 'is-pass' : 'is-fail'}`}>
      {pass ? <Check size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
      {formatRatio(ratio)}:1 <span className="sr-only">{pass ? 'passes' : 'fails'}</span>
    </span>
  );
}

function ThemePreview({ theme }) {
  return (
    <div className="sg-preview" data-theme={theme}>
      <p className="eyebrow">{theme === 'light' ? 'Light' : 'Dark'}</p>
      <div className="card sg-preview-card">
        <div className="sg-preview-row">
          <span className="sg-preview-title">Design review</span>
          <span className="count count-attention">3</span>
        </div>
        <span className="sg-preview-meta">Updated 2 hours ago by Mira</span>
        <span className="sg-preview-link">Open the room</span>
        <div className="cluster">
          <span className="btn btn-primary btn-sm">Reply</span>
          <span className="btn btn-sm">Mute</span>
          <span className="badge badge-primary">Team</span>
          <span className="badge badge-attention">2 mentions</span>
        </div>
        <span className="sg-preview-input">Write a message…</span>
      </div>
    </div>
  );
}

export default function StyleguidePage() {
  const { lightRef, darkRef, values } = useResolvedColors(COLOR_TOKENS);
  const [pressed, setPressed] = useState({ mine: true, pinned: false, team: false });
  const [removed, setRemoved] = useState(false);
  const ids = { hint: useId(), error: useId(), name: useId(), email: useId(), disabled: useId(), visibility: useId(), message: useId() };
  const [now] = useState(() => Date.now());

  useEffect(() => { document.title = 'Design system · Huddle'; }, []);

  const results = useMemo(() => {
    if (!values) return null;
    return CONTRAST_PAIRS.map((pair) => ({
      ...pair,
      light: contrastRatio(values.light[pair.fg], values.light[pair.bg]),
      dark: contrastRatio(values.dark[pair.fg], values.dark[pair.bg]),
    }));
  }, [values]);
  const passing = results ? results.reduce((n, r) => n + [r.light, r.dark].filter((x) => Math.floor(x * 100) / 100 >= r.min).length, 0) : 0;

  return (
    <div className="sg">
      <a className="skip-link" href="#sg-main">Skip to content</a>
      {/* Probe scopes: where the token values are measured (hidden, never read out) */}
      <div ref={lightRef} data-theme="light" hidden />
      <div ref={darkRef} data-theme="dark" hidden />

      <header className="sg-header">
        <Link to="/" className="brand"><span className="brand-mark" aria-hidden="true">H</span>Huddle</Link>
        <span className="sg-header-label">Design system</span>
        <span className="header-spacer" />
        <ThemeToggle className="icon-btn icon-btn-outline" />
      </header>

      <div className="sg-layout">
        <nav className="sg-toc" aria-label="On this page">
          <p className="eyebrow" aria-hidden="true">On this page</p>
          <ul>
            {SECTIONS.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}
          </ul>
        </nav>

        <main id="sg-main" className="sg-main" tabIndex={-1}>
          <PageHeader
            title="Huddle design system"
            description="The tokens and components the whole app is built from, rendered live from the real CSS. Switch the theme to see the dark mapping; every value below updates with it."
          />

          <Section id="sg-principles" title="Principles" intro="Six principles, and where each one shows up in Huddle.">
            <ul className="sg-principles">
              {PRINCIPLES.map(([name, text]) => (
                <li key={name} className="card">
                  <h3>{name}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="sg-colour" title="Colour" intro="Green is the brand, warm grey does almost all the work, amber means “this needs you”. Components never use a scale directly: they use the semantic tokens further down, so the dark theme is just a different mapping.">
            <div className="sg-previews" aria-hidden="true" inert>
              <ThemePreview theme="light" />
              <ThemePreview theme="dark" />
            </div>

            <h3 className="sg-h3">Scales</h3>
            {SCALES.map((scale) => (
              <div key={scale.name} className="sg-scale">
                <div className="sg-scale-head">
                  <h4>{scale.name}</h4>
                  <p>{scale.role}</p>
                </div>
                <ul className="sg-swatches">
                  {scale.steps.map((step) => {
                    const token = `${scale.prefix}-${step}`;
                    return (
                      <li key={token}>
                        <span className="sg-swatch" style={{ background: `var(${token})` }} aria-hidden="true" />
                        <span className="sg-swatch-name">{step}</span>
                        <code className="sg-swatch-hex">{values ? toHex(values.light[token]) : '…'}</code>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            <h3 className="sg-h3">Semantic tokens</h3>
            <div className="sg-semantic">
              {SEMANTIC_GROUPS.map((group) => (
                <div key={group.name} className="card sg-semantic-group">
                  <h4>{group.name}</h4>
                  <ul>
                    {group.tokens.map(([token, use]) => (
                      <li key={token}>
                        <span className="sg-chip-pair" aria-hidden="true">
                          <span data-theme="light" style={{ background: `var(${token})` }} />
                          <span data-theme="dark" style={{ background: `var(${token})` }} />
                        </span>
                        <span className="sg-token">
                          <code>{token}</code>
                          <span>{use}</span>
                        </span>
                        <span className="sg-token-values">
                          {values ? `${toHex(values.light[token])} / ${toHex(values.dark[token])}` : '…'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section id="sg-contrast" title="Contrast" intro="Every foreground and background pair the interface uses, measured in this browser from the live CSS, in both themes. Text needs 4.5:1; the edges of controls and the focus ring need 3:1. The same check runs in the unit tests and in npm run contrast.">
            <p className="sg-summary" role="status">
              {results ? `${passing} of ${results.length * 2} pairs pass (${results.length} pairs × 2 themes).` : 'Measuring…'}
            </p>
            <div className="table-wrap" role="region" aria-label="Contrast table" tabIndex={0}>
              <table className="data sg-contrast-table">
                <thead>
                  <tr>
                    <th scope="col">Used for</th>
                    <th scope="col">Light</th>
                    <th scope="col">Dark</th>
                    <th scope="col" className="num">Needs</th>
                  </tr>
                </thead>
                <tbody>
                  {(results ?? CONTRAST_PAIRS).map((pair) => (
                    <tr key={`${pair.fg}|${pair.bg}`}>
                      <td>
                        {pair.use}
                        <span className="sg-pair"><code>{pair.fg}</code> on <code>{pair.bg}</code></span>
                      </td>
                      {['light', 'dark'].map((theme) => (
                        <td key={theme}>
                          <span className="sg-cell">
                            <span data-theme={theme} className={pair.min === 3 ? 'sg-sample sg-sample-ui' : 'sg-sample'} style={pair.min === 3 ? { background: `var(${pair.bg})`, borderColor: `var(${pair.fg})` } : { background: `var(${pair.bg})`, color: `var(${pair.fg})` }} aria-hidden="true">
                              {pair.min === 3 ? '' : 'Aa'}
                            </span>
                            <Verdict ratio={pair[theme]} min={pair.min} />
                          </span>
                        </td>
                      ))}
                      <td className="num">{pair.min}:1</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="sg-type" title="Typography" intro="Inter for everything you read, JetBrains Mono for code. One modular scale (ratio 1.25 from 16px), in rem so it grows with the browser’s text-size setting. Body text 1.5 line height, headings 1.2.">
            <div className="sg-fonts">
              <div className="card">
                <p className="eyebrow">Interface · Inter</p>
                <p className="sg-font-sample">Aa Bb Gg Qq 0123456789</p>
                <p className="sg-weights">
                  <span style={{ fontWeight: 400 }}>Regular 400</span>
                  <span style={{ fontWeight: 500 }}>Medium 500</span>
                  <span style={{ fontWeight: 600 }}>Semibold 600</span>
                  <span style={{ fontWeight: 700 }}>Bold 700</span>
                </p>
                <p className="muted">With <code>cv05</code> on, <span className="sg-glyphs">Il1 O0</span> stay distinct, which matters for usernames and share links.</p>
              </div>
              <div className="card">
                <p className="eyebrow">Code · JetBrains Mono</p>
                <pre className="sg-code"><code>{"const { data } = await supabase\n  .from('messages')\n  .select('id, body, author:profiles(username)')\n  .eq('room_id', roomId);"}</code></pre>
              </div>
            </div>
            <ul className="sg-type-scale">
              {TYPE_SCALE.map((step) => (
                <li key={step.token}>
                  <span className="sg-type-meta">
                    <code>{step.token}</code>
                    <span>{step.px}px · {step.px / 16}rem</span>
                    <span>{step.use}</span>
                  </span>
                  <span className="sg-type-sample" style={{ fontSize: `var(${step.token})`, lineHeight: step.px >= 20 ? 'var(--leading-tight)' : 'var(--leading-normal)', fontWeight: step.px >= 20 ? 600 : 400 }}>
                    Plan the week with your team
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="sg-space" title="Spacing and layout" intro="A 4px base and eight steps: every gap, margin and padding in the app comes from this list (only 1–3px hairlines and borders are written directly). Layout is a 12-column grid, written mobile first: one column on a phone, then 640, 960 and 1280px breakpoints.">
            <ul className="sg-spacing">
              {SPACING.map(([token, px, use]) => (
                <li key={token}>
                  <code>{token}</code>
                  <span className="sg-space-bar" style={{ width: `var(${token})` }} aria-hidden="true" />
                  <span className="sg-space-px">{px}px</span>
                  <span className="muted">{use}</span>
                </li>
              ))}
            </ul>
            <div className="grid-12 sg-grid-demo" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => <span key={i} className="span-1" />)}
              <span className="span-8">span-8</span>
              <span className="span-4">span-4</span>
              <span className="span-4">span-4</span>
              <span className="span-4">span-4</span>
              <span className="span-4">span-4</span>
            </div>
          </Section>

          <Section id="sg-shape" title="Shape and elevation" intro="Small radii keep it calm and work-like. In the light theme depth comes from soft warm shadows; in the dark theme surfaces get lighter as they come forward, because a shadow can not be seen on black.">
            <ul className="sg-shapes">
              {RADII.map(([token, use]) => (
                <li key={token}>
                  <span className="sg-radius" style={{ borderRadius: `var(${token})` }} aria-hidden="true" />
                  <code>{token}</code>
                  <span className="muted">{use}</span>
                </li>
              ))}
            </ul>
            <ul className="sg-shapes">
              {SHADOWS.map(([token, use]) => (
                <li key={token}>
                  <span className="sg-shadow" style={{ boxShadow: `var(${token})` }} aria-hidden="true" />
                  <code>{token}</code>
                  <span className="muted">{use}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="sg-components" title="Components" intro="Hover and Tab through these: every control has hover, focus-visible and disabled states. The focus ring is shown on one of each so it is visible in screenshots too.">
            <h3 className="sg-h3">Buttons</h3>
            <p className="sg-note">One primary button per view (the one thing you came to do). Secondary for everything else, ghost for low-key actions in toolbars, danger only for actions you can not undo.</p>
            <div className="sg-demo stack">
              <div className="cluster">
                <button type="button" className="btn btn-primary"><Plus size={16} aria-hidden="true" />New note</button>
                <button type="button" className="btn">Cancel</button>
                <button type="button" className="btn btn-ghost">Mark all read</button>
                <button type="button" className="btn btn-danger"><Trash2 size={16} aria-hidden="true" />Delete</button>
                <button type="button" className="btn btn-danger-solid">Delete for everyone</button>
              </div>
              <div className="cluster">
                <button type="button" className="btn btn-primary sg-show-focus">Focused</button>
                <button type="button" className="btn btn-primary" disabled>Disabled</button>
                <button type="button" className="btn" disabled>Disabled</button>
                <button type="button" className="btn btn-primary btn-sm">Small</button>
                <button type="button" className="btn btn-sm">Small</button>
                <button type="button" className="icon-btn" aria-label="Search"><Search size={18} aria-hidden="true" /></button>
                <button type="button" className="icon-btn icon-btn-outline" aria-label="Attach a file"><FileText size={18} aria-hidden="true" /></button>
              </div>
            </div>

            <h3 className="sg-h3">Form fields</h3>
            <p className="sg-note">Every input has a visible label above it (never a placeholder instead). Hints and errors are tied to the input with <code>aria-describedby</code>; an error is text plus an icon, not only a red border.</p>
            <div className="sg-demo sg-form">
              <div className="field">
                <label htmlFor={ids.name}>Room name</label>
                <input id={ids.name} className="input" defaultValue="design-review" aria-describedby={ids.hint} />
                <span id={ids.hint} className="field-hint">Lowercase, no spaces. Everyone in the team can see it.</span>
              </div>
              <div className="field">
                <label htmlFor={ids.email}>Email</label>
                <input id={ids.email} className="input" type="email" defaultValue="sam@" aria-invalid="true" aria-describedby={ids.error} />
                <span id={ids.error} className="field-error">Enter a full email address, like sam@example.com</span>
              </div>
              <div className="field">
                <label htmlFor={ids.disabled}>Workspace</label>
                <input id={ids.disabled} className="input" defaultValue="Huddle" disabled />
              </div>
              <div className="field">
                <label htmlFor={ids.visibility}>Visibility</label>
                <select id={ids.visibility} defaultValue="team">
                  <option value="private">Only me</option>
                  <option value="team">My team</option>
                </select>
              </div>
              <div className="field sg-span-2">
                <label htmlFor={ids.message}>Message</label>
                <textarea id={ids.message} placeholder="Write a message, @ to mention someone" />
              </div>
              <label className="checkbox"><input type="checkbox" defaultChecked /> Pin this note</label>
            </div>

            <h3 className="sg-h3">Badges, counts and chips</h3>
            <p className="sg-note">Amber is only for things waiting on you. A count always shows the number, so colour is never the only signal.</p>
            <div className="sg-demo stack">
              <div className="cluster">
                <span className="badge">Draft</span>
                <span className="badge badge-primary">Team</span>
                <span className="badge badge-attention">2 mentions</span>
                <span className="badge badge-success">Uploaded</span>
                <span className="badge badge-warning">Expires in 5 min</span>
                <span className="badge badge-danger">Failed</span>
                <span className="badge badge-info">Shared</span>
              </div>
              <div className="cluster">
                <span className="sg-count-demo">General <CountBadge count={4} label="4 new messages" /></span>
                <span className="sg-count-demo">Design review <CountBadge count={3} attention label="3 unread mentions" /></span>
                <span className="sg-count-demo">Everyone <CountBadge count={140} label="140 new messages" /></span>
              </div>
              <div className="cluster" role="group" aria-label="Note filters">
                <button type="button" className="chip" aria-pressed={pressed.mine} onClick={() => setPressed((p) => ({ ...p, mine: !p.mine }))}>Mine</button>
                <button type="button" className="chip" aria-pressed={pressed.pinned} onClick={() => setPressed((p) => ({ ...p, pinned: !p.pinned }))}>Pinned</button>
                <button type="button" className="chip" aria-pressed={pressed.team} onClick={() => setPressed((p) => ({ ...p, team: !p.team }))}>Shared with team</button>
                {!removed && (
                  <span className="chip">
                    Tag: design
                    <button type="button" className="chip-remove" aria-label="Remove filter: tag design" onClick={() => setRemoved(true)}><X size={14} aria-hidden="true" /></button>
                  </span>
                )}
              </div>
            </div>

            <h3 className="sg-h3">Messages</h3>
            <div className="sg-demo stack">
              <div className="alert alert-info"><Info size={16} aria-hidden="true" /><span>Realtime is connected. New messages appear as they are sent.</span></div>
              <div className="alert alert-success"><CircleCheck size={16} aria-hidden="true" /><span>Note saved.</span></div>
              <div className="alert alert-warning"><TriangleAlert size={16} aria-hidden="true" /><span>This share link expires in 5 minutes.</span></div>
              <div className="alert alert-error"><CircleAlert size={16} aria-hidden="true" /><span>Could not upload: the file is larger than 10 MB.</span></div>
              <div className="alert alert-attention"><Info size={16} aria-hidden="true" /><span>You were mentioned in 2 rooms since yesterday.</span></div>
              <div className="snack snack--success sg-static-snack">
                <CircleCheck className="snack-icon" size={18} aria-hidden="true" />
                <p className="snack-message">Toast: “Link copied”. Toasts confirm an action and leave by themselves; errors stay until closed.</p>
              </div>
            </div>

            <h3 className="sg-h3">Cards, page header and time</h3>
            <div className="sg-demo stack">
              <PageHeader
                headingLevel={4}
                title="Notes"
                description="Write things down, share them with your team."
                actions={<><button type="button" className="btn">Filters</button><button type="button" className="btn btn-primary"><Plus size={16} aria-hidden="true" />New note</button></>}
              />
              <div className="sg-cards">
                <article className="card card-interactive">
                  <div className="card-header">
                    <h4 className="card-title">Sprint retro notes</h4>
                    <span className="badge badge-primary">Team</span>
                  </div>
                  <p className="muted">What went well: the chat redesign landed early. To fix: flaky upload test.</p>
                  <p className="sg-card-meta">
                    <span className="avatar" aria-hidden="true">MK</span>
                    <span>Mira K. · <RelativeTime date={now - 2 * 3600 * 1000} /></span>
                  </p>
                </article>
                <div className="card">
                  <EmptyState headingLevel={4} icon={<Inbox size={22} />} title="No files yet" action={<button type="button" className="btn btn-primary btn-sm">Upload a file</button>}>
                    Drop a file here or upload one. Images get a preview; anything can get a share link.
                  </EmptyState>
                </div>
              </div>
              <p className="cluster sg-times">
                <span>Times read as people say them:</span>
                <RelativeTime date={now - 20 * 1000} />
                <RelativeTime date={now - 5 * 60 * 1000} />
                <RelativeTime date={now - 26 * 3600 * 1000} />
                <RelativeTime date={now - 12 * 24 * 3600 * 1000} />
                <span className="muted">(hover one for the exact date)</span>
              </p>
            </div>

            <h3 className="sg-h3">Under the hood</h3>
            <p className="sg-note">Day 17’s developer notes, kept but collapsed, in the same place on every page. Press <kbd>Enter</kbd> or <kbd>Space</kbd> on the summary to open it.</p>
            <div className="sg-demo">
              <UnderTheHood>
                <ul>
                  <li>The list comes from <code>supabase.from(&apos;notes&apos;).select()</code>; Row Level Security returns only your notes and your team’s shared ones.</li>
                  <li>New notes arrive over a Realtime channel, so a second tab updates without a reload.</li>
                </ul>
              </UnderTheHood>
            </div>
          </Section>
        </main>
      </div>
    </div>
  );
}
