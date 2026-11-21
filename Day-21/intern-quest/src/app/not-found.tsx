import Link from 'next/link';
import Pip from '@/components/Pip';

/** Any page or record that does not exist (or is not yours to see) */
export default function NotFound() {
  return (
    <main className="auth-screen not-found">
      <section className="auth-hero">
        <p className="wordmark">Intern Quest</p>
        <h1>This quest is <span>off the map.</span></h1>
        <p className="auth-lede">There is nothing at this address, or it is not yours to see.</p>
        <Link href="/" className="big-button nf-home">Back to the guild</Link>
      </section>
      <div className="nf-pip" aria-hidden="true"><Pip stage="sprout" mood="worried" hop={0} /></div>
    </main>
  );
}
