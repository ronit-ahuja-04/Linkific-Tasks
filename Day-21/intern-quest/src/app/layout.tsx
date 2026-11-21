import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Intern Quest', template: '%s | Intern Quest' },
  description: 'Your internship logbook as a role-playing game: quests, XP, levels, badges, and Pip.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
