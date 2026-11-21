import type { Metadata } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import './globals.css';

/** Rounded, friendly type: Fredoka for headings and numbers, Nunito for text. Self-hosted by next/font. */
const display = Fredoka({ subsets: ['latin'], variable: '--font-display', weight: ['500', '600', '700'], display: 'swap' });
const body = Nunito({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Intern Quest', template: '%s | Intern Quest' },
  description: 'Your internship logbook as a role-playing game: quests, XP, levels, badges, and Pip.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
