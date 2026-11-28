import { Check, Copy, Printer } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { Guardian, Wisp } from '../../components/characters';
import { Button, Loading, buttonClasses } from '../../components/ui';
import { verifyCertificate } from '../../lib/api/trust';
import { useAsync } from '../../lib/useAsync';
import { useToast } from '../toast/useToast';

/**
 * A certificate anyone can check: lumo.app/verify/<code>. It shows only the name, the island and the date.
 * Works signed out; the holder also gets copy-link and print buttons.
 */
export function VerifyPage() {
  const { code = '' } = useParams();
  const cert = useAsync(() => verifyCertificate(code), [code]);
  const signedIn = useAppSelector((s) => s.auth.status === 'signedIn');
  const toast = useToast();

  if (cert.status === 'loading') return <Loading label="Checking the certificate…" />;
  if (cert.status === 'error' || !cert.data) {
    return (
      <main
        id="main"
        className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-night px-6 text-center text-white"
      >
        <Wisp size={110} mood="sad" />
        <h1 className="m-0 text-3xl font-bold">No certificate with this code</h1>
        <p className="m-0 max-w-sm text-moon">
          Check the code ({code.toUpperCase() || 'empty'}). Real Lumo certificates are 10 letters
          and numbers.
        </p>
        <Link to="/" className={buttonClasses({ variant: 'glow' })}>
          Go to Lumo
        </Link>
      </main>
    );
  }
  const c = cert.data;
  const date = new Date(c.issued_at).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return (
    <main
      id="main"
      className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-night px-5 py-10 print:bg-white"
    >
      <article
        aria-labelledby="cert-title"
        className="relative flex w-full max-w-2xl flex-col items-center gap-4 overflow-hidden rounded-[var(--radius-panel)] border-[6px] border-glow bg-paper px-6 py-10 text-center text-ink shadow-[0_0_80px_rgba(255,185,56,0.35)] sm:px-12"
      >
        <span className="flex items-center gap-2 rounded-full bg-lagoon-soft px-4 py-1 text-sm font-black text-lagoon-ink">
          <Check aria-hidden="true" className="h-4 w-4" /> Verified Lumo certificate
        </span>
        <div className="flex items-end gap-2">
          <Wisp size={70} stage="beacon" mood="cheer" decorative />
          <Guardian guardian={c.guardian} size={70} decorative />
        </div>
        <p className="m-0 text-dusk">This lights the way for</p>
        <h1 id="cert-title" className="m-0 text-4xl font-bold sm:text-5xl">
          {c.display_name}
        </h1>
        <p className="m-0 max-w-md text-lg">
          who brought every lantern back on <b>{c.island_name}</b>, finishing{' '}
          {c.lessons === 1 ? 'the only lesson' : `all ${c.lessons} lessons`} of{' '}
          <b>{c.course_title}</b>.
        </p>
        <p className="m-0 text-sm text-dusk">
          {date} · Code <span className="font-mono font-bold text-ink">{code.toUpperCase()}</span>
        </p>
      </article>
      <div className="flex flex-wrap justify-center gap-3 print:hidden">
        <Button
          variant="glow"
          leftIcon={<Copy aria-hidden="true" className="h-4 w-4" />}
          onClick={() =>
            void navigator.clipboard.writeText(window.location.href).then(
              () => toast.success('Link copied. Anyone with it can check your certificate.'),
              () => toast.error('Couldn’t copy. Copy the address from the browser instead.'),
            )
          }
        >
          Copy link
        </Button>
        <Button
          variant="dark"
          leftIcon={<Printer aria-hidden="true" className="h-4 w-4" />}
          onClick={() => window.print()}
        >
          Print
        </Button>
        <Link to={signedIn ? '/map' : '/'} className={buttonClasses({ variant: 'dark' })}>
          {signedIn ? 'Back to the map' : 'What is Lumo?'}
        </Link>
      </div>
    </main>
  );
}
