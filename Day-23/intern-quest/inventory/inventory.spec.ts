import { test, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { visible } from '../e2e/helpers';
import { contextFor, dbFault, describeScreen, fixture, record, shot, watch, type Observation } from './record';

/**
 * ERROR INVENTORY scenarios. Each one causes ONE failure and records what a person would see. Nothing is asserted:
 * the output is docs/errors/<label>.md (run before the work, and again after it, with the same scenarios).
 */
const BASE = 'http://localhost:3131';
const OTHER_ORIGIN = 'http://127.0.0.1:3131'; // the same server under another origin (another host name)

type Who = 'intern' | 'mentor' | 'guest';
interface Scenario {
  id: string;
  area: string;
  operation: string;
  fault: string;
  who: Who;
  run: (page: Page, context: BrowserContext) => Promise<Partial<Observation> | void>;
}

function scenario(s: Scenario): void {
  test(`${s.id} ${s.operation}: ${s.fault}`, async ({ browser }) => {
    const context = await contextFor(browser, s.who, BASE);
    const page = await context.newPage();
    const seen = watch(page);
    try {
      const extra = (await s.run(page, context)) ?? {};
      const sees = extra.sees ?? (await describeScreen(page));
      const screenshot = await shot(page, s.id);
      record({ id: s.id, area: s.area, operation: s.operation, fault: s.fault, ...extra, sees, screenshot, console: seen.console, pageErrors: seen.pageErrors, noise: seen.noise });
    } finally {
      await dbFault('pass');
      await context.close();
    }
  });
}

const wait = (page: Page, ms: number) => page.waitForTimeout(ms);
/** "stuck": the button still cannot be pressed, or still says it is working */
const isStuck = async (button: Locator) => (await button.isDisabled()) || /…|\.\.\./.test(await button.innerText());

async function openNewQuest(page: Page, title: string): Promise<Locator> {
  await page.goto('/journal/new');
  await visible(page.getByLabel('Title')).fill(title);
  await visible(page.getByRole('button', { name: 'React', exact: true })).click();
  return visible(page.locator('form.editor button[type=submit]'));
}

// ---------------------------------------------------------------------------------------------------------------------
// The browser's side: the network fails between the browser and our API
// ---------------------------------------------------------------------------------------------------------------------

scenario({
  id: 'C1', area: 'Journal', operation: 'Publish a quest', fault: 'browser offline', who: 'intern',
  run: async (page, context) => {
    const button = await openNewQuest(page, 'Inventory offline');
    await context.setOffline(true);
    await button.click();
    await wait(page, 6000);
    return { stuck: await isStuck(button), ms: 6000 };
  },
});

scenario({
  id: 'C2', area: 'Journal', operation: 'Publish a quest', fault: 'request never answers', who: 'intern',
  run: async (page) => {
    const button = await openNewQuest(page, 'Inventory hang');
    await page.route('**/api/quests', () => { /* never answered */ });
    await button.click();
    await wait(page, 15_000);
    return { stuck: await isStuck(button), ms: 15_000 };
  },
});

scenario({
  id: 'C3', area: 'Journal', operation: 'Publish a quest', fault: 'API answers 500 with an HTML page', who: 'intern',
  run: async (page) => {
    const button = await openNewQuest(page, 'Inventory html 500');
    await page.route('**/api/quests', (route) => route.fulfill({ status: 500, contentType: 'text/html', body: '<!DOCTYPE html><h1>Internal Server Error</h1>' }));
    await button.click();
    await wait(page, 2000);
    return { status: 500, contentType: 'text/html', stuck: await isStuck(button) };
  },
});

scenario({
  id: 'C4', area: 'Journal', operation: 'Publish a quest', fault: 'session ended while the form was open (401)', who: 'intern',
  run: async (page, context) => {
    const button = await openNewQuest(page, 'Inventory session ended');
    await context.clearCookies();
    const answer = page.waitForResponse('**/api/quests');
    await button.click();
    const response = await answer;
    await wait(page, 1500);
    const keepsDraft = (await visible(page.getByLabel('Title')).inputValue()) === 'Inventory session ended';
    const signInLink = await page.getByRole('link', { name: /sign in/i }).filter({ visible: true }).count();
    return { status: response.status(), stuck: await isStuck(button), note: `draft kept: ${keepsDraft}; a sign-in link offered: ${signInLink > 0}` };
  },
});

scenario({
  id: 'C5', area: 'Journal', operation: 'Delete a quest', fault: 'browser offline', who: 'intern',
  run: async (page, context) => {
    await page.goto(`/journal/${fixture().questId}`);
    await visible(page.getByRole('button', { name: 'Delete quest' })).click();
    await context.setOffline(true);
    const confirm = page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true });
    await confirm.click();
    await wait(page, 5000);
    const dialogOpen = await page.getByRole('dialog').isVisible();
    return { stuck: dialogOpen && (await confirm.isDisabled()), ms: 5000, note: `confirm dialog still open: ${dialogOpen}` };
  },
});

scenario({
  id: 'C6', area: 'Character', operation: 'Save the character', fault: 'browser offline', who: 'intern',
  run: async (page, context) => {
    await page.goto('/character');
    const button = visible(page.getByRole('button', { name: 'Save character' }));
    await button.waitFor();
    await context.setOffline(true);
    await button.click();
    await wait(page, 5000);
    return { stuck: await isStuck(visible(page.locator('form button[type=submit].big-button'))), ms: 5000 };
  },
});

scenario({
  id: 'C7', area: 'Guild hall', operation: 'Add a mentor note', fault: 'browser offline', who: 'mentor',
  run: async (page, context) => {
    await page.goto('/guild');
    const input = visible(page.getByPlaceholder('Leave a note…')).first();
    await input.fill('Inventory note');
    await context.setOffline(true);
    await visible(page.getByRole('button', { name: 'Add note' })).first().click();
    await wait(page, 5000);
    return { ms: 5000, note: `note text still in the box: ${(await input.inputValue()) === 'Inventory note'}` };
  },
});

scenario({
  id: 'C8', area: 'Guild hall', operation: 'Award a badge', fault: 'browser offline', who: 'mentor',
  run: async (page, context) => {
    await page.goto('/guild');
    await visible(page.getByRole('button', { name: 'Award badge' })).first().click();
    await page.getByRole('dialog').getByLabel('Name').fill('Inventory badge');
    await context.setOffline(true);
    await page.getByRole('dialog').getByRole('button', { name: 'Award', exact: true }).click();
    await wait(page, 5000);
    return { ms: 5000, note: `dialog still open: ${await page.getByRole('dialog').isVisible()}` };
  },
});

scenario({
  id: 'C9', area: 'Sign-in', operation: 'Sign in (server action)', fault: 'browser offline', who: 'guest',
  run: async (page, context) => {
    await page.goto('/login');
    await visible(page.getByLabel('Email')).fill('ada@example.com');
    await visible(page.getByLabel('Password')).fill('demo-password-123');
    await context.setOffline(true);
    const button = visible(page.locator('form button[type=submit]')).first();
    await button.click();
    await wait(page, 6000);
    return { stuck: await isStuck(button), ms: 6000 };
  },
});

scenario({
  id: 'C10', area: 'Navigation', operation: 'Open another page from the menu', fault: 'browser offline', who: 'intern',
  run: async (page, context) => {
    await page.goto('/journal');
    await visible(page.getByRole('heading', { level: 1 })).waitFor();
    await context.setOffline(true);
    await visible(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Character' })).click();
    await wait(page, 5000);
    return { ms: 5000, note: `the tab now shows: ${page.url()}` };
  },
});

scenario({
  id: 'C11', area: 'Journal', operation: 'Publish, then load the reward screen', fault: 'code chunk fails to load (a new deploy while the tab was open)', who: 'intern',
  run: async (page) => {
    const button = await openNewQuest(page, 'Inventory chunk failure');
    await page.route('**/_next/static/chunks/**', (route) => route.abort());
    await button.click();
    await wait(page, 5000);
    return { ms: 5000 };
  },
});

// ---------------------------------------------------------------------------------------------------------------------
// The server's side: the database is slow, unavailable or unreachable (through the fault proxy)
// ---------------------------------------------------------------------------------------------------------------------

const PAGES: { id: string; path: () => string; who: Who; name: string }[] = [
  { id: 'S1', path: () => '/', who: 'guest', name: 'Home page (public, cached)' },
  { id: 'S2', path: () => `/c/${fixture().handle}`, who: 'guest', name: 'Public character sheet (cached)' },
  { id: 'S3', path: () => '/journal', who: 'intern', name: 'Journal' },
  { id: 'S4', path: () => '/journal/new', who: 'intern', name: 'New quest form' },
  { id: 'S5', path: () => '/character', who: 'intern', name: 'Character page' },
  { id: 'S6', path: () => '/guild', who: 'mentor', name: 'Guild hall' },
];
for (const p of PAGES) {
  scenario({
    id: p.id, area: 'Pages', operation: `Open: ${p.name}`, fault: 'database unavailable (503)', who: p.who,
    run: async (page) => {
      await dbFault('unavailable');
      const response = await page.goto(p.path());
      await wait(page, 2500);
      return { status: response?.status() ?? null };
    },
  });
}

scenario({
  id: 'S7', area: 'Pages', operation: 'Open: Journal', fault: 'database unreachable (connection dropped)', who: 'intern',
  run: async (page) => {
    await dbFault('down');
    const response = await page.goto('/journal');
    await wait(page, 2500);
    return { status: response?.status() ?? null };
  },
});

for (const [id, mode] of [['S8', 'unavailable'], ['S9', 'down']] as const) {
  scenario({
    id, area: 'API', operation: 'GET /api/quests', fault: mode === 'down' ? 'database unreachable' : 'database unavailable (503)', who: 'intern',
    run: async (page, context) => {
      await dbFault(mode);
      const response = await context.request.get('/api/quests');
      const body = (await response.text()).replace(/\s+/g, ' ').slice(0, 120);
      await page.setContent(`<pre style="font:14px monospace;white-space:pre-wrap;padding:16px">GET /api/quests → ${response.status()}\ncontent-type: ${response.headers()['content-type']}\n\n${body.replace(/</g, '&lt;')}</pre>`);
      return { status: response.status(), contentType: response.headers()['content-type'] ?? null, sees: `body starts "${body.slice(0, 90)}"` };
    },
  });
}

scenario({
  id: 'S10', area: 'Journal', operation: 'Publish a quest', fault: 'database unavailable (503)', who: 'intern',
  run: async (page) => {
    const button = await openNewQuest(page, 'Inventory db unavailable');
    await dbFault('unavailable');
    const answer = page.waitForResponse('**/api/quests');
    await button.click();
    const response = await answer;
    await wait(page, 1500);
    return { status: response.status(), contentType: response.headers()['content-type'] ?? null, stuck: await isStuck(button) };
  },
});

scenario({
  id: 'S11', area: 'Sign-in', operation: 'Sign in', fault: 'database unavailable (503)', who: 'guest',
  run: async (page) => {
    await page.goto('/login');
    await visible(page.getByLabel('Email')).fill('ada@example.com');
    await visible(page.getByLabel('Password')).fill('demo-password-123');
    await dbFault('unavailable');
    const button = visible(page.locator('form button[type=submit]')).first();
    await button.click();
    await wait(page, 8000);
    return { stuck: await isStuck(button), ms: 8000 };
  },
});

scenario({
  id: 'S12', area: 'Pages', operation: 'Open: Journal', fault: 'database slow (3 s per query): what shows while waiting', who: 'intern',
  run: async (page) => {
    await dbFault('slow', 3000);
    const started = Date.now();
    await page.goto('/journal', { waitUntil: 'commit' });
    await wait(page, 1500);
    const whileWaiting = await describeScreen(page);
    const screenshot = await shot(page, 'S12-waiting');
    await visible(page.getByRole('heading', { level: 1 })).waitFor({ timeout: 60_000 });
    return { sees: `after 1.5 s: ${whileWaiting}`, ms: Date.now() - started, note: `waiting screenshot: ${screenshot}; ms = time until the heading appeared` };
  },
});

scenario({
  id: 'S13', area: 'Journal', operation: 'Publish a quest', fault: 'database never answers (no timeout anywhere?)', who: 'intern',
  run: async (page) => {
    const button = await openNewQuest(page, 'Inventory db hang');
    await dbFault('slow', 120_000);
    await button.click();
    await wait(page, 20_000);
    return { stuck: await isStuck(button), ms: 20_000 };
  },
});

// ---------------------------------------------------------------------------------------------------------------------
// Not found: records and addresses that do not exist
// ---------------------------------------------------------------------------------------------------------------------

const MISSING: { id: string; path: string; who: Who; name: string; api?: boolean }[] = [
  { id: 'N1', path: '/journal/00000000-0000-4000-8000-000000000000', who: 'intern', name: 'a quest id that does not exist' },
  { id: 'N2', path: '/journal/not-a-uuid', who: 'intern', name: 'a malformed quest id' },
  { id: 'N3', path: '/no-such-page', who: 'guest', name: 'an unknown address' },
  { id: 'N4', path: '/@nobody-at-all', who: 'guest', name: 'an unknown character' },
  { id: 'N5', path: '/api/quests/00000000-0000-4000-8000-000000000000', who: 'intern', name: 'API: a quest id that does not exist', api: true },
  { id: 'N6', path: '/api/quests/not-a-uuid', who: 'intern', name: 'API: a malformed quest id', api: true },
  { id: 'N7', path: '/api/nothing-here', who: 'guest', name: 'API: an unknown endpoint', api: true },
];
for (const m of MISSING) {
  scenario({
    id: m.id, area: 'Not found', operation: `Open ${m.path}`, fault: m.name, who: m.who,
    run: async (page) => {
      const response = await page.goto(m.path);
      await wait(page, 800);
      const contentType = response?.headers()['content-type'] ?? null;
      if (m.api) {
        const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 100);
        return { status: response?.status() ?? null, contentType, sees: `body starts "${body}"` };
      }
      return { status: response?.status() ?? null, contentType };
    },
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// CORS today: another origin calls our API
// ---------------------------------------------------------------------------------------------------------------------

scenario({
  id: 'X1', area: 'CORS', operation: 'GET /api/quests from another origin', fault: `page on ${OTHER_ORIGIN} calls ${BASE}`, who: 'guest',
  run: async (page, context) => {
    // the same request with the same Origin header, sent outside a browser: what the server really answered
    const direct = await context.request.get(`${BASE}/api/quests`, { headers: { Origin: OTHER_ORIGIN } });
    const serverAnswer = `the server answered ${direct.status()} with access-control-allow-origin=${direct.headers()['access-control-allow-origin'] ?? '(none)'}`;
    const seenByNetwork: string[] = [];
    page.on('requestfailed', (r) => {
      if (r.url().startsWith(`${BASE}/api/`)) seenByNetwork.push(`${r.method()} failed in the browser: ${r.failure()?.errorText ?? '?'}`);
    });
    await page.goto(`${OTHER_ORIGIN}/no-such-page`);
    const result = await page.evaluate(async (url) => {
      try {
        const r = await fetch(url);
        return `JavaScript got status ${r.status}`;
      } catch (error) {
        return `JavaScript got ${String(error)}`;
      }
    }, `${BASE}/api/quests`);
    await wait(page, 500);
    return { sees: result, note: `${serverAnswer}; ${seenByNetwork.join(' | ') || '(no failure event)'}` };
  },
});

scenario({
  id: 'X2', area: 'CORS', operation: 'POST JSON to /api/quests from another origin', fault: 'a non-simple request: needs a preflight', who: 'guest',
  run: async (page, context) => {
    // the preflight the browser sends first, sent by hand so its answer can be read (pages do not see preflights)
    const preflight = await context.request.fetch(`${BASE}/api/quests`, {
      method: 'OPTIONS',
      headers: { Origin: OTHER_ORIGIN, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
    });
    const ph = preflight.headers();
    const preflightAnswer = `preflight OPTIONS -> ${preflight.status()}, allow-origin=${ph['access-control-allow-origin'] ?? '(none)'}, allow-methods=${ph['access-control-allow-methods'] ?? '(none)'}, allow=${ph.allow ?? '(none)'}`;
    const seenByNetwork: string[] = [];
    page.on('response', (r) => {
      if (r.url().startsWith(`${BASE}/api/`)) {
        const h = r.headers();
        seenByNetwork.push(`${r.request().method()} ${r.status()} allow-origin=${h['access-control-allow-origin'] ?? '(none)'} allow=${h.allow ?? '(none)'}`);
      }
    });
    await page.goto(`${OTHER_ORIGIN}/no-such-page`);
    const result = await page.evaluate(async (url) => {
      try {
        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
        return `JavaScript got status ${r.status}`;
      } catch (error) {
        return `JavaScript got ${String(error)}`;
      }
    }, `${BASE}/api/quests`);
    await wait(page, 500);
    return { sees: result, note: `${preflightAnswer}; seen by the page: ${seenByNetwork.join(' | ') || '(no POST was sent)'}` };
  },
});
