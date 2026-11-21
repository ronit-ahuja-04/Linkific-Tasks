import { CLASS_INFO, CLASSES } from '@/lib/game';

/** Placeholder until milestone M4 builds the real pages: shows that the game rules load. */
export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: '48px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Intern Quest</h1>
      <p>Your internship logbook as a role-playing game. The game rules and the database are in place; the pages arrive in milestone M4.</p>
      <h2>Classes</h2>
      <ul>{CLASSES.map((c) => <li key={c}><strong>{CLASS_INFO[c].label}</strong>: {CLASS_INFO[c].motto}</li>)}</ul>
    </main>
  );
}
