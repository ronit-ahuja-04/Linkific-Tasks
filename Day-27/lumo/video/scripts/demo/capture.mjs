// Capture the screenshots for Lumo's demo video from the real app on the local stack:
//   node scripts/demo/capture.mjs        (needs `npm run dev` on :5180, the local Supabase stack and `npm run worker`)
//
// Every role walks through the product in a real browser (Playwright): a visitor tastes an island, a new learner
// ("Ana", created here and deleted at the end) signs up, learns, forgets, reviews and earns a certificate, an
// instructor asks Wisp to draft a unit, and an admin reviews a report. Each screenshot is saved at 1920×1080 with the
// box of the element the narration talks about, so the video can zoom to it. Test data is removed afterwards.
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const app = path.resolve(root, '..');
const { chromium } = createRequire(path.join(app, 'package.json'))('playwright');

const BASE = process.env.LUMO_URL ?? 'http://localhost:5180';
if (!/^http:\/\/(localhost|127\.0\.0\.1)/.test(BASE))
  throw new Error('Capture only runs against a local app');
const OUT = path.join(root, 'public', 'generated', 'demo');
mkdirSync(OUT, { recursive: true });

const ANA = { name: 'Ana Sharma', handle: 'ana_demo', email: 'ana.demo@lumo.local' };
const NOTE = 'Demo: the wording could be clearer';
const CODE_REEF = 'c0000000-0000-4000-8000-000000000001';
const ADMIN = 'a0000000-0000-4000-8000-000000000004';

const psql = (sql) =>
  execSync(
    `export DOCKER_HOST=unix://$HOME/.colima/default/docker.sock; C=$(docker ps --format '{{.Names}}' | grep '^supabase_db_lumo'); docker exec -i $C psql -U postgres -d postgres -tA -v ON_ERROR_STOP=1`,
    { input: sql, encoding: 'utf8', shell: '/bin/zsh' },
  ).trim();
const log = (...a) => console.log('•', ...a);

const shots = {};
/** Save the viewport and the box (CSS px, 1280×720 space) around the given elements. */
async function shot(page, key, focus = []) {
  const boxes = [];
  for (const loc of [focus].flat()) {
    await loc.scrollIntoViewIfNeeded().catch(() => {});
    const b = await loc.boundingBox();
    if (b) boxes.push(b);
  }
  await page.waitForTimeout(350); // let entrance animations settle
  // Measure again after scrolling settles.
  boxes.length = 0;
  for (const loc of [focus].flat()) {
    const b = await loc.boundingBox();
    if (b) boxes.push(b);
  }
  let box = null;
  if (boxes.length) {
    const x = Math.min(...boxes.map((b) => b.x));
    const y = Math.min(...boxes.map((b) => b.y));
    const r = Math.max(...boxes.map((b) => b.x + b.width));
    const btm = Math.max(...boxes.map((b) => b.y + b.height));
    box = { x, y, w: r - x, h: btm - y };
  }
  await page.screenshot({ path: path.join(OUT, `${key}.png`) });
  shots[key] = { file: `generated/demo/${key}.png`, path: new URL(page.url()).pathname, box };
  log('shot', key, box ? `focus ${Math.round(box.w)}×${Math.round(box.h)}` : '');
}

async function newPage(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1.5,
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('page error:', String(e)));
  return page;
}

async function login(browser, email) {
  const page = await newPage(browser);
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('lumo-demo-123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  return page;
}

async function playVideo(page, seconds) {
  await page.locator('video').first().waitFor();
  await page
    .locator('video')
    .first()
    .evaluate(async (el, ms) => {
      el.muted = true;
      await el.play();
      if (el.textTracks[0]) el.textTracks[0].mode = 'showing';
      await new Promise((r) => setTimeout(r, ms));
      el.pause();
    }, seconds * 1000);
}

const check = (page) => page.getByRole('button', { name: 'Check', exact: true });

let courseId = null;
const browser = await chromium.launch({ channel: 'chrome' });
try {
  psql(`delete from auth.users where email = '${ANA.email}'`);

  // ---- 1. A visitor tastes Code Reef ------------------------------------------------------------------------------
  let p = await newPage(browser);
  await p.goto(BASE);
  const tasteLink = p.getByRole('link', { name: 'Try a 3-minute taste first' });
  await tasteLink.waitFor();
  await shot(p, 'welcome', tasteLink);
  await tasteLink.click();
  const reef = p.getByRole('link', { name: /Code Reef/ });
  await reef.waitFor();
  await shot(p, 'taste-pick', reef);
  await reef.click();
  await p.getByText('No account needed').waitFor();
  await playVideo(p, 5);
  await shot(p, 'taste-lesson', p.locator('video'));
  await p.getByRole('button', { name: /Try the questions/ }).click();
  await check(p).waitFor();
  await p.getByRole('radio').first().click();
  await check(p).click();
  const cont = p.getByRole('button', { name: 'Continue' });
  await cont.waitFor();
  await shot(p, 'taste-feedback', [p.getByRole('radiogroup'), cont]);
  await p.context().close();

  // ---- 2. Ana signs up and meets Wisp -----------------------------------------------------------------------------
  p = await newPage(browser);
  await p.goto(`${BASE}/register`);
  await p.getByLabel('What should Wisp call you?').fill(ANA.name);
  await p.getByLabel('Handle').fill(ANA.handle);
  await p.getByLabel('Email').fill(ANA.email);
  await p.getByLabel('Password', { exact: true }).fill('lumo-demo-123');
  await p.getByRole('button', { name: 'Create my account' }).click();
  await p.waitForURL(/\/setup/);
  const reefBtn = p.getByRole('button', { name: /Code Reef/ });
  await reefBtn.waitFor();
  await shot(p, 'setup-start', reefBtn);
  await reefBtn.click();
  await p.getByRole('button', { name: /Regular/ }).click();
  const cheeky = p.getByRole('button', { name: /Cheeky/ });
  await cheeky.waitFor();
  await shot(p, 'setup-persona', [p.getByRole('button', { name: /Calm|Gentle/ }).first(), cheeky]);
  await cheeky.click();
  await p.getByRole('button', { name: 'I’m brand new' }).click();
  await p.waitForURL(/\/map/);
  const start = p.getByRole('button', { name: /start here/ });
  await start.waitFor();
  await shot(p, 'map', start);

  // ---- 3. A lesson: video, quiz, a report, rewards ----------------------------------------------------------------
  await start.click();
  await p.getByRole('heading', { name: 'For-loops in 90 seconds' }).waitFor();
  await playVideo(p, 9);
  await shot(p, 'lesson-video', p.locator('video'));
  await p.getByRole('button', { name: /Finish the lesson|Continue to the questions/ }).click();
  await p.getByRole('heading', { name: /Lantern lit!/ }).waitFor();
  await p.getByRole('button', { name: 'Next lesson' }).click();
  await p.getByRole('heading', { name: 'What will this print?' }).waitFor();
  await p.getByRole('radio', { name: /^1 2 3$/ }).click();
  await check(p).click();
  const mistake = p.getByText('The loop starts where you tell it');
  await mistake.waitFor();
  await shot(p, 'quiz-wrong', mistake);
  await p.getByRole('button', { name: 'Report a problem' }).click();
  await p.getByLabel('It’s confusing').check();
  await p.getByLabel('Anything else? (optional)').fill(NOTE);
  await p.getByRole('button', { name: 'Send report' }).click();
  await p.getByText(/A person will look at it/).waitFor();
  await p.getByRole('button', { name: 'Continue' }).click();
  await p.keyboard.press('2');
  await p.keyboard.press('Enter');
  await p.getByRole('button', { name: 'Continue' }).waitFor();
  await p.keyboard.press('Enter');
  await p.getByText('Second chance').waitFor();
  await p.getByRole('radio', { name: /^0 1 2$/ }).click();
  await check(p).click();
  await p.getByRole('button', { name: 'Continue' }).click();
  const lit = p.getByRole('heading', { name: /Lantern lit!/ });
  await lit.waitFor();
  await p.waitForTimeout(1200); // let the Light count up
  await shot(p, 'rewards', p.getByRole('status').first());

  // ---- 4. The next day: fog, then a review ------------------------------------------------------------------------
  psql(`update memory_items set due_at = now() - interval '1 minute', last_review_at = now() - interval '1 day'
        where user_id = (select id from profiles where handle = '${ANA.handle}')`);
  await p.goto(`${BASE}/map?island=javascript-foundations`);
  const fog = p.getByText('The fog is back');
  await fog.waitFor();
  await shot(p, 'map-fog', [fog, p.getByRole('link', { name: 'Clear the fog' })]);
  await p.getByRole('link', { name: 'Clear the fog' }).click();
  await p.waitForURL(/\/review/);
  await check(p).first().waitFor();
  const forLoop = (await p.getByRole('radio', { name: /^0 1 2$/ }).count()) > 0;
  await p.getByRole('radio', { name: forLoop ? /^0 1 2$/ : /^nothing$/ }).click();
  await check(p).click();
  await p.getByRole('button', { name: 'Continue' }).waitFor();
  await shot(p, 'review', p.getByRole('radiogroup'));

  // ---- 5. A comeback, then a certificate --------------------------------------------------------------------------
  psql(`update profiles set last_goal_date = (now() at time zone timezone)::date - 5, flame_days = 7, best_flame = 7
        where handle = '${ANA.handle}'`);
  await p.goto(`${BASE}/map?island=javascript-foundations`);
  const welcomeBack = p.getByRole('dialog', { name: /Welcome back/ });
  await welcomeBack.waitFor();
  await shot(p, 'comeback', welcomeBack);
  await p.getByRole('button', { name: 'Just look around' }).click();
  psql(`insert into lesson_progress (user_id, lesson_id)
        select (select id from profiles where handle = '${ANA.handle}'), l.id from lessons l
        join units u on u.id = l.unit_id where u.course_id = '${CODE_REEF}' and u.published and l.deleted_at is null
        on conflict do nothing`);
  await p.reload();
  await p.getByRole('button', { name: 'Claim certificate' }).click();
  await p.waitForURL(/\/verify\//);
  const cert = p.locator('article');
  await p.getByText('Verified Lumo certificate').waitFor();
  await shot(p, 'certificate', cert);
  await p.context().close();

  // ---- 6. The studio: Wisp drafts a unit --------------------------------------------------------------------------
  p = await login(browser, 'riya@lumo.local');
  await p.goto(`${BASE}/studio/${CODE_REEF}`);
  const pathHeading = p.getByRole('heading', { name: 'The path' });
  await pathHeading.waitFor();
  await p.waitForTimeout(800);
  await shot(p, 'studio', [pathHeading, p.getByRole('heading', { name: "Wisp's workshop" })]);
  await p.goto(`${BASE}/studio/new`);
  await p.getByLabel('Course title').fill('Arrays Atoll');
  await p.getByLabel('Link').fill('arrays-atoll-demo');
  await p.getByLabel('Island name').fill('Arrays Atoll');
  await p.getByText('Nova', { exact: true }).click();
  await p.getByRole('button', { name: 'Create island' }).click();
  await p.waitForURL(/\/studio\/[0-9a-f-]{36}$/);
  courseId = p.url().split('/').pop();
  await p.getByRole('button', { name: 'Ask Wisp to draft a unit' }).click();
  await p.getByLabel('Topic').fill('Arrays: lists of values');
  await shot(p, 'topic', p.getByRole('dialog'));
  await p.getByRole('button', { name: 'Draft the unit' }).click();
  const workshop = p.locator('section[aria-labelledby="workshop-heading"]');
  let gotProgress = false;
  const t0 = Date.now();
  while (Date.now() - t0 < 360_000) {
    const msg =
      (await workshop
        .locator('span')
        .first()
        .textContent()
        .catch(() => '')) ?? '';
    if (
      !gotProgress &&
      /Checking|Rendering|Writing/.test(msg) &&
      (await p.getByRole('progressbar').count())
    ) {
      gotProgress = true;
      await shot(p, 'drafting', workshop);
    }
    if (await p.getByText(/Wisp drafted a new unit|Last draft failed/).count()) break;
    await p.waitForTimeout(500);
  }
  const banner = p.getByText(/hidden from learners/).first();
  await banner.waitFor();
  await shot(p, 'drafted', [banner, p.getByRole('button', { name: 'Publish unit' })]);
  await p.context().close();

  // ---- 7. The admin console ---------------------------------------------------------------------------------------
  p = await login(browser, 'admin@lumo.local');
  await p.goto(`${BASE}/admin`);
  const card = p.locator('li').filter({ hasText: NOTE });
  await card.waitFor();
  await shot(p, 'admin-reports', card);
  await p.getByRole('tab', { name: 'People & roles' }).click();
  await p.waitForTimeout(900);
  await shot(p, 'admin-roles', p.getByRole('tabpanel'));
  await p.context().close();

  writeFileSync(path.join(OUT, 'shots.json'), JSON.stringify(shots, null, 2));
  log(`${Object.keys(shots).length} shots saved to ${path.relative(root, OUT)}`);
} catch (e) {
  console.error('Capture failed:', e.message.split('\n')[0]);
  process.exitCode = 1;
} finally {
  psql(`delete from wisp_flags where learner_text = '${NOTE}';
delete from auth.users where email = '${ANA.email}';`);
  if (courseId) {
    psql(`begin; select set_config('request.jwt.claims', '{"sub":"${ADMIN}","role":"authenticated"}', true);
update courses set status = 'archived' where id = '${courseId}'; delete from generation_jobs where course_id = '${courseId}';
delete from courses where id = '${courseId}'; commit;`);
  }
  log('demo data removed');
  await browser.close();
}
