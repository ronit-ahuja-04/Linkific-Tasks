import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Card, buttonClass } from '../components/ui.jsx';

export default function ContactSent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-4">
      <Card
        as="section"
        className="w-full max-w-lg animate-rise p-8 text-center sm:p-10"
        aria-labelledby="contact-sent-title"
      >
        <span
          className="mx-auto mb-5 flex size-20 animate-pop items-center justify-center rounded-full bg-good-soft text-good"
          aria-hidden="true"
        >
          <CheckCircle2 size={44} />
        </span>
        <h1 id="contact-sent-title" className="text-3xl font-bold tracking-tight">
          Message received
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted [&_code]:break-words [&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs">
          The form was submitted with{' '}
          <code>navigate(&apos;/contact/sent&apos;, {'{ replace: true }'})</code>. Press your
          browser&apos;s Back button: it skips the form you already sent.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className={buttonClass({ variant: 'primary' })}>
            Back to mission control
          </Link>
          <Link to="/contact" className={buttonClass({ variant: 'secondary' })}>
            Send another
          </Link>
        </div>
      </Card>
    </div>
  );
}
