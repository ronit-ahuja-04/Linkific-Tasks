import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { CODE_REEF, USERS, overflowX, signIn, sql } from './helpers';

// Every main page, for every role: no serious or critical WCAG 2.1 AA problems (axe), and no sideways scrolling on
// a phone. These only read pages, so they use the seeded accounts as they are.
const firstLesson = () =>
  sql(`select l.id from lessons l join units u on u.id = l.unit_id
       where u.course_id = '${CODE_REEF.id}' and u.published and l.deleted_at is null order by u.position, l.position limit 1`);

const pages: {
  role: keyof typeof USERS | 'visitor';
  path: () => string;
  ready: (p: Page) => Promise<void>;
}[] = [
  {
    role: 'visitor',
    path: () => '/',
    ready: (p) => p.getByRole('link', { name: /taste/ }).waitFor(),
  },
  { role: 'visitor', path: () => '/login', ready: (p) => p.getByLabel('Email').waitFor() },
  { role: 'visitor', path: () => '/register', ready: (p) => p.getByLabel('Email').waitFor() },
  {
    role: 'visitor',
    path: () => '/taste',
    ready: (p) => p.getByRole('link', { name: /Code Reef/ }).waitFor(),
  },
  {
    role: 'visitor',
    path: () => `/taste/${CODE_REEF.slug}`,
    ready: (p) => p.getByText('No account needed').waitFor(),
  },
  {
    role: 'visitor',
    path: () => '/forgot-password',
    ready: (p) => p.getByRole('heading', { name: 'Forgot your password?' }).waitFor(),
  },
  {
    role: 'visitor',
    path: () => '/islands/atlantis',
    ready: (p) => p.getByRole('heading', { name: 'This island isn’t on the map' }).waitFor(),
  },
  {
    role: 'visitor',
    path: () => '/verify/NOTAREAL01',
    ready: (p) => p.getByRole('heading', { name: 'No certificate with this code' }).waitFor(),
  },
  {
    role: 'maya',
    path: () => `/map?island=${CODE_REEF.slug}`,
    ready: (p) =>
      p
        .getByRole('heading', { name: /Code Reef/ })
        .first()
        .waitFor(),
  },
  { role: 'maya', path: () => '/explore', ready: (p) => p.getByLabel('Search islands').waitFor() },
  { role: 'maya', path: () => '/me', ready: (p) => p.getByRole('heading', { level: 1 }).waitFor() },
  {
    role: 'maya',
    path: () => '/review',
    ready: (p) => p.getByRole('heading', { level: 1 }).waitFor(),
  },
  {
    role: 'maya',
    path: () => `/learn/${firstLesson()}`,
    ready: (p) => p.getByRole('heading', { level: 1 }).waitFor(),
  },
  {
    role: 'riya',
    path: () => '/studio',
    ready: (p) => p.getByRole('link', { name: 'New island' }).waitFor(),
  },
  { role: 'riya', path: () => '/studio/new', ready: (p) => p.getByLabel('Course title').waitFor() },
  {
    role: 'riya',
    path: () => `/studio/${CODE_REEF.id}`,
    ready: (p) => p.getByRole('heading', { name: 'The path' }).waitFor(),
  },
  {
    role: 'riya',
    path: () => `/studio/${CODE_REEF.id}/lessons/${firstLesson()}`,
    ready: (p) => p.getByLabel('Lesson title').waitFor(),
  },
  {
    role: 'admin',
    path: () => '/admin',
    ready: (p) => p.getByRole('tab', { name: 'Reports' }).waitFor(),
  },
];

for (const role of ['visitor', 'maya', 'riya', 'admin'] as const) {
  test.describe(role === 'visitor' ? 'a visitor' : `signed in as ${role}`, () => {
    test.beforeEach(async ({ page }) => {
      if (role !== 'visitor') await signIn(page, USERS[role].email);
    });

    for (const entry of pages.filter((e) => e.role === role)) {
      const label = entry.path().replace(/[0-9a-f-]{36}/g, ':id');
      test(`${label} has no serious accessibility problems and fits a phone`, async ({ page }) => {
        const path = entry.path();
        await page.goto(path);
        await entry.ready(page);
        // Let entrance animations finish (axe would measure half-faded text); endless ones (stars) don't count.
        await page.waitForFunction(() =>
          document
            .getAnimations()
            .every(
              (a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity,
            ),
        );
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();
        const serious = results.violations
          .filter((v) => v.impact === 'serious' || v.impact === 'critical')
          .map(
            (v) =>
              `${v.id}: ${v.help} → ${v.nodes
                .map((n) => n.target.join(' '))
                .slice(0, 3)
                .join(' | ')}`,
          );
        expect(serious, `axe on ${path}`).toEqual([]);

        await page.setViewportSize({ width: 375, height: 812 });
        await entry.ready(page);
        expect(await overflowX(page), `sideways scroll on ${path} at 375 px`).toBeLessThanOrEqual(
          0,
        );
      });
    }
  });
}
