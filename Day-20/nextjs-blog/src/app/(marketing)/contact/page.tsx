import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'How to reach the author of Dispatch.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="prose">
      <h1>Contact</h1>
      <p>This is a learning project with no mail server behind it, so there is no form. The source is in the Linkific-Tasks repository, in <code>Day-20/nextjs-blog</code>.</p>
    </div>
  );
}
