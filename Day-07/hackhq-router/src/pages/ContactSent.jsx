import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

export default function ContactSent() {
  return (
    <div className="station-view contact-view">
      <section className="contact-sent" aria-labelledby="contact-sent-title">
        <span className="contact-sent-icon" aria-hidden="true">
          <CheckCircle2 size={44} />
        </span>
        <h1 id="contact-sent-title" className="contact-sent-title">
          Message received
        </h1>
        <p className="contact-sent-copy">
          The form was submitted with{' '}
          <code>navigate(&apos;/contact/sent&apos;, {'{ replace: true }'})</code>. Press your
          browser&apos;s Back button: it skips the form you already sent.
        </p>
        <div className="contact-sent-actions">
          <Link to="/" className="btn btn-primary">
            Back to mission control
          </Link>
          <Link to="/contact" className="btn btn-secondary">
            Send another
          </Link>
        </div>
      </section>
    </div>
  );
}
