/** Site-wide constants (public: safe in the browser bundle) */
export const SITE = {
  name: 'Intern Quest',
  description: 'Your internship logbook as a role-playing game: every day is a quest, every skill levels up, and Pip grows with you.',
  /** NEXT_PUBLIC_ variables are inlined at build time; set it per environment in Vercel */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
} as const;
