import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Card, buttonClass } from '../components/ui.jsx';

export default function ContactSent() {
  return (
    <div
      className="d-flex align-items-center justify-content-center py-3"
      style={{ minHeight: '60vh' }}
    >
      <Card
        as="section"
        className="w-100 animate-rise p-4 p-sm-5 text-center"
        style={{ maxWidth: '32rem' }}
        aria-labelledby="contact-sent-title"
      >
        <span
          className="mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle animate-pop bg-success-subtle text-success"
          style={{ width: '5rem', height: '5rem' }}
          aria-hidden="true"
        >
          <CheckCircle2 size={44} />
        </span>
        <h1 id="contact-sent-title" className="fs-2 fw-bold">
          Message received
        </h1>
        <p className="mx-auto mt-2 mb-0 text-body-secondary" style={{ maxWidth: '28rem' }}>
          The form was submitted with{' '}
          <code className="text-break">
            navigate(&apos;/contact/sent&apos;, {'{ replace: true }'})
          </code>
          . Press your browser&apos;s Back button: it skips the form you already sent.
        </p>
        <div className="mt-4 d-flex flex-column flex-sm-row justify-content-center gap-3">
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
