import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import Pip from '@/components/Pip';
import HeroPip from '@/components/landing/HeroPip';
import HomeCta from '@/components/landing/HomeCta';
import SectionBoundary from '@/components/errors/SectionBoundary';
import { getGuildBoard } from '@/lib/server/public';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: { absolute: `${SITE.name}: your internship as a role-playing game` },
  description: SITE.description,
  alternates: { canonical: '/' },
};

/**
 * The home page. The text is static. The leaderboard is read at REQUEST time (then cached: `use cache`, tag `guild`),
 * not at build time, so building the app never needs the database or its secrets (a Docker image or a preview build
 * can be made without them). The sign-in buttons depend on the session and stream in too.
 */
export default function Home() {
  return (
    <div className="home">
      <header className="home-bar">
        <Link href="/" className="wordmark">Intern Quest</Link>
        <Suspense fallback={<div className="home-cta" />}>
          <HomeCta />
        </Suspense>
      </header>

      <section className="home-hero">
        <div>
          <h1>Your internship, <span>as a role-playing game.</span></h1>
          <p className="home-lede">Log what you build each day. Every entry is a quest that earns XP for the skills you used. Level up, earn badges, and raise Pip from an egg to a guardian.</p>
          <div className="home-actions">
            <Link href="/register" className="big-button big-light">Start your quest</Link>
            <Link href="/c/ronit" className="ghost-button ghost-light">See a real character</Link>
          </div>
        </div>
        <HeroPip />
      </section>

      <section className="home-steps" aria-labelledby="how-title">
        <h2 id="how-title" className="sr-only">How it works</h2>
        <ol>
          <li className="card"><span className="step">1</span><h3>Log a quest</h3><p>What you did, the skills you used, your pull requests, and any blockers.</p></li>
          <li className="card"><span className="step">2</span><h3>Earn XP and level up</h3><p>Harder quests, linked PRs and daily streaks earn more. Each skill levels up on its own.</p></li>
          <li className="card"><span className="step">3</span><h3>Raise Pip</h3><p>Your sidekick reacts to every quest, worries about blockers, and grows as you do.</p></li>
        </ol>
      </section>

      <section className="home-board" aria-labelledby="board-title">
        <h2 id="board-title">The Guild hall</h2>
        <p className="home-lede">Every public adventurer, by XP.</p>
        {/* its own boundary: if the database can not answer, only the leaderboard says so; the rest of the page stays */}
        <SectionBoundary what="The guild board">
          <Suspense fallback={<p className="home-lede">Gathering the guild…</p>}>
            <Board />
          </Suspense>
        </SectionBoundary>
      </section>

      <footer className="home-foot">Intern Quest is a Linkific training project. Pip is drawn in SVG; no AI writes its lines.</footer>
    </div>
  );
}

async function Board() {
  await connection(); // request time, not build time: see the comment on Home
  const board = await getGuildBoard();
  return (
    <>
        {board.length === 0 ? <p className="card empty">No public adventurers yet. Be the first.</p> : (
        <ol className="board">
          {board.map((entry, i) => (
            <li key={entry.handle}>
              <Link href={`/c/${entry.handle}`} className="card board-card">
                <span className="board-rank">#{i + 1}</span>
                <span className="board-pip" aria-hidden="true"><Pip stage={entry.stage} mood="happy" hop={0} tint={entry.tint} accessory={entry.accessory} /></span>
                <span className="board-main">
                  <strong>{entry.displayName}</strong>
                  <span className="muted">@{entry.handle} · {entry.classLabel}</span>
                  <span className="board-level">Level {entry.level} {entry.title}</span>
                </span>
                <span className="board-xp">{entry.totalXp.toLocaleString('en-US')} XP<small>{entry.questCount} quests{entry.topSkill ? ` · ${entry.topSkill}` : ''}</small></span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
