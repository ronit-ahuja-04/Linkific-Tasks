import type { CSSProperties } from 'react';

/**
 * SKELETON SCREENS: the shape of a page, shown while its data loads (Suspense fallbacks). Before Day 23 every
 * fallback was an empty coloured box, so a slow database meant a blank screen (inventory row S12, finding E-9).
 *
 * - Each one has the layout of the real page (same grid classes), so nothing jumps when the content arrives.
 * - They are part of the prerendered HTML (Cache Components), so they appear at once, before any JavaScript.
 * - The shimmer stops when "reduce motion" is on (globals.css).
 * - Screen readers hear one "Loading …" status instead of a pile of empty boxes (the shapes are aria-hidden).
 */
const Bone = ({ w = '100%', h = 16, r, style }: { w?: number | string; h?: number; r?: number; style?: CSSProperties }) => (
  <span className="sk" style={{ width: w, height: h, borderRadius: r, ...style }} />
);

function Loading({ what }: { what: string }) {
  return <p className="sr-only" role="status">Loading {what}…</p>;
}

/** The signed-in frame while the session is read (app/(game)/layout.tsx) */
export function ShellSkeleton() {
  return (
    <div className="shell tone-violet" aria-busy="true">
      <Loading what="Intern Quest" />
      <div className="shell-bar" aria-hidden="true">
        <span className="wordmark">Intern Quest</span>
        <Bone w={300} h={44} r={999} style={{ marginRight: 'auto' }} />
        <Bone w={170} h={36} r={999} />
      </div>
    </div>
  );
}

export function JournalSkeleton() {
  return (
    <div className="journal" aria-busy="true">
      <Loading what="your journal" />
      <section className="journal-hero" aria-hidden="true">
        <Bone w="55%" h={14} />
        <Bone w="80%" h={64} style={{ margin: '12px 0 16px' }} />
        <Bone w="100%" h={14} r={999} />
        <Bone w={190} h={50} r={14} style={{ marginTop: 20 }} />
      </section>
      <section className="card journal-list" aria-hidden="true">
        <Bone w={180} h={24} style={{ marginBottom: 16 }} />
        {[0, 1, 2, 3, 4].map((i) => <Bone key={i} h={58} r={16} style={{ marginBottom: 8 }} />)}
      </section>
    </div>
  );
}

export function EditorSkeleton() {
  return (
    <div className="editor" aria-busy="true">
      <Loading what="the quest" />
      <div className="editor-head" aria-hidden="true"><Bone w={260} h={48} /><Bone w={340} h={14} style={{ margin: '10px 0 16px' }} /></div>
      <div className="editor-grid" aria-hidden="true">
        <div className="card editor-main"><Bone w={60} h={14} /><Bone h={46} r={14} /><Bone w={90} h={14} /><Bone h={220} r={14} /></div>
        <div className="card editor-side"><Bone h={46} r={14} /><Bone h={46} r={14} /><Bone h={120} r={14} /><Bone h={52} r={14} /></div>
      </div>
    </div>
  );
}

export function CharacterSkeleton() {
  return (
    <div className="character-page" aria-busy="true">
      <Loading what="your character" />
      <div className="editor" aria-hidden="true">
        <div className="editor-head"><Bone w={300} h={48} /><Bone w={380} h={14} style={{ margin: '10px 0 16px' }} /></div>
        <div className="editor-grid">
          <div className="card editor-main"><Bone h={46} r={14} /><Bone h={70} r={14} /><Bone h={180} r={14} /></div>
          <div className="card editor-side"><Bone w={60} h={22} /><Bone h={220} r={14} /><Bone h={52} r={14} /></div>
        </div>
      </div>
    </div>
  );
}

export function GuildSkeleton() {
  return (
    <div className="guild" aria-busy="true">
      <Loading what="the guild hall" />
      <section aria-hidden="true">
        <Bone w={240} h={48} /><Bone w="70%" h={14} style={{ margin: '12px 0 18px' }} />
        {[0, 1, 2].map((i) => <div key={i} className="card" style={{ marginBottom: 14 }}><Bone w="40%" h={16} /><Bone w="70%" h={22} style={{ margin: '10px 0' }} /><Bone h={46} r={14} /></div>)}
      </section>
      <aside className="card roster" aria-hidden="true">
        <Bone w={90} h={22} style={{ marginBottom: 12 }} />
        {[0, 1, 2, 3, 4].map((i) => <Bone key={i} h={36} style={{ marginBottom: 10 }} />)}
      </aside>
    </div>
  );
}

/** A public character sheet: full screen, like QuestApp */
export function SheetSkeleton() {
  return (
    <div className="screen sheet-skeleton" aria-busy="true">
      <Loading what="the character sheet" />
      <div className="topbar" aria-hidden="true"><span className="wordmark">Intern Quest</span><Bone w={200} h={36} r={999} /><span /></div>
      <div className="board" aria-hidden="true">
        <div className="card"><Bone w="50%" h={30} /><Bone w="30%" h={14} style={{ margin: '12px 0 20px' }} /><Bone h={240} r={20} /></div>
        <div className="card"><Bone w={160} h={22} style={{ marginBottom: 14 }} />{[0, 1, 2, 3].map((i) => <Bone key={i} h={64} r={16} style={{ marginBottom: 10 }} />)}</div>
      </div>
    </div>
  );
}

/** The leaderboard on the home page */
export function BoardSkeleton() {
  return (
    <div aria-busy="true">
      <Loading what="the guild board" />
      <ol className="board-skeleton" aria-hidden="true">
        {[0, 1, 2].map((i) => <li key={i} className="card"><Bone w={40} h={40} r={999} /><Bone w="60%" h={18} /><Bone w={90} h={18} /></li>)}
      </ol>
    </div>
  );
}

/** Sign-in and registration */
export function AuthSkeleton() {
  return (
    <main className="auth-screen" aria-busy="true">
      <Loading what="the sign-in form" />
      <section className="auth-hero" aria-hidden="true"><p className="wordmark">Intern Quest</p><Bone w="80%" h={110} /></section>
      <section className="auth-card" aria-hidden="true" style={{ display: 'grid', gap: 14 }}>
        <Bone w={120} h={28} /><Bone h={48} r={14} /><Bone h={48} r={14} /><Bone h={48} r={14} /><Bone h={52} r={14} />
      </section>
    </main>
  );
}
