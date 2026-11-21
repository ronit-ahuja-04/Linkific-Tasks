import Link from 'next/link';
import Pip from '@/components/Pip';

/**
 * Shown IN PLACE of the journal (or editor) until the user has a character. A redirect would also work, but the
 * browser's router remembers redirects it has seen: after the character exists, it kept sending /journal back here.
 * Rendering a prompt instead means there is nothing stale to remember.
 */
export default function CreateCharacterPrompt() {
  return (
    <section className="card onboarding" aria-labelledby="onboarding-title">
      <div className="onboarding-pip" aria-hidden="true"><Pip stage="egg" mood="happy" hop={0} /></div>
      <div>
        <h1 id="onboarding-title">First, create your character</h1>
        <p>Pick a class and dress up Pip. Then every day you log becomes a quest that earns XP for the skills you used.</p>
        <Link href="/character" className="big-button">Create my character</Link>
      </div>
    </section>
  );
}
