// LARGE TEST DATA for the Day 24 performance work, on the LOCAL Supabase stack only.
//
//   node scripts/perf-data.mjs add      adds the data set (does nothing if it is already there)
//   node scripts/perf-data.mjs remove   removes all of it again (users, rows, stored files)
//   node scripts/perf-data.mjs status   says whether it is there
//
// What it adds, all owned by four test accounts (`perf@example.com` and three "perf bots"):
//   - a PRIVATE room "Perf lab" with 5,000 messages over 30 days, from the four of them (only they can see it);
//   - 1,000 PRIVATE notes for perf@example.com, with 15 tags;
//   - 300 files for perf@example.com: 40 real photos (large JPEGs, ~2000x1500) and 260 small documents;
//   - a large photo as each account's avatar.
// Nothing existing is changed or deleted: your own accounts never see this data (private room, private notes).
// Sign in as perf@example.com / perf-password-123 (local only) to see it.
//
// It uses the service-role key of the LOCAL stack, read from `supabase status` at run time, kept in memory, never
// written or printed. It refuses to run against anything but a local address.
import { execSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const PASSWORD = 'perf-password-123';
const PEOPLE = [
  { email: 'perf@example.com', username: 'perf_tester', full_name: 'Perf Tester' },
  { email: 'perf-bot-1@example.com', username: 'perf_bot_ada', full_name: 'Ada (perf bot)' },
  { email: 'perf-bot-2@example.com', username: 'perf_bot_linus', full_name: 'Linus (perf bot)' },
  { email: 'perf-bot-3@example.com', username: 'perf_bot_grace', full_name: 'Grace (perf bot)' },
];
const ROOM = 'Perf lab';
const COUNTS = { messages: 5000, notes: 1000, files: 300, photos: 40 };

const status = execSync('npx supabase status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const read = (name) => status.match(new RegExp(`^${name}="?([^"\\n]+)"?$`, 'm'))?.[1];
const URL_ = read('API_URL');
const KEY = read('SERVICE_ROLE_KEY') ?? read('SECRET_KEY');
if (!URL_ || !KEY) throw new Error('Could not read the local Supabase status. Is the stack running? (npm run db:start)');
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(URL_)) throw new Error(`Refusing to run against ${URL_}: local stack only.`);

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };
async function api(path, { method = 'GET', body, extra = {}, raw = false } = {}) {
  const response = await fetch(`${URL_}${path}`, {
    method,
    headers: { ...headers, ...(body !== undefined && !raw ? { 'Content-Type': 'application/json' } : {}), ...extra },
    body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

// ---------------------------------------------------------------- a seeded random generator (same data every run)
let seed = 24;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (list) => list[Math.floor(rand() * list.length)];
const WORDS = ('deploy review api cache render bundle query schema index migration token session route layout component hook state effect memo '
  + 'test fixture build lint release hotfix rollback metric latency queue worker retry timeout storage bucket image upload preview '
  + 'design sprint standup ticket backlog estimate demo feedback pairing refactor naming docs checklist incident outage dashboard').split(' ');
const sentence = (min = 6, max = 16) => {
  const n = min + Math.floor(rand() * (max - min));
  const words = Array.from({ length: n }, () => pick(WORDS));
  return `${words[0][0].toUpperCase()}${words[0].slice(1)} ${words.slice(1).join(' ')}.`;
};
const paragraph = (sentences) => Array.from({ length: sentences }, () => sentence()).join(' ');

// ---------------------------------------------------------------- users
async function findUsers() {
  const { users } = await api('/auth/v1/admin/users?per_page=1000');
  return PEOPLE.map((p) => users.find((u) => u.email === p.email) ?? null);
}

async function createUsers() {
  const ids = [];
  for (const person of PEOPLE) {
    const user = await api('/auth/v1/admin/users', {
      method: 'POST',
      body: { email: person.email, password: PASSWORD, email_confirm: true, user_metadata: { username: person.username, full_name: person.full_name } },
    });
    ids.push(user.id);
  }
  return ids;
}

// ---------------------------------------------------------------- pictures: real photo-sized JPEGs, drawn by Chrome
async function makePhotos(count, width, height) {
  const browser = await chromium.launch({ channel: 'chrome' }); // the system Chrome, as the browser tests use
  const page = await browser.newPage();
  const photos = [];
  for (let i = 0; i < count; i += 1) {
    const dataUrl = await page.evaluate(({ i, width, height }) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const g = canvas.getContext('2d');
      const hue = (i * 47) % 360;
      const gradient = g.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, `hsl(${hue} 70% 55%)`);
      gradient.addColorStop(1, `hsl(${(hue + 120) % 360} 60% 35%)`);
      g.fillStyle = gradient;
      g.fillRect(0, 0, width, height);
      // fine detail and noise, like a real photo: a JPEG of it is large, as camera pictures are
      for (let k = 0; k < 900; k += 1) {
        g.fillStyle = `hsla(${(hue + k * 13) % 360} 80% ${30 + (k % 50)}% / 0.35)`;
        g.beginPath();
        g.arc((k * 7919) % width, (k * 104729) % height, 4 + (k % 60), 0, Math.PI * 2);
        g.fill();
      }
      const noise = g.getImageData(0, 0, width, height);
      for (let p = 0; p < noise.data.length; p += 4) {
        const n = ((p * 2654435761) % 41) - 20;
        noise.data[p] += n;
        noise.data[p + 1] += n;
        noise.data[p + 2] += n;
      }
      g.putImageData(noise, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.92);
    }, { i, width, height });
    photos.push(Buffer.from(dataUrl.split(',')[1], 'base64'));
  }
  await browser.close();
  return photos;
}

async function upload(bucket, path, bytes, type) {
  await api(`/storage/v1/object/${bucket}/${path}`, { method: 'POST', body: bytes, raw: true, extra: { 'Content-Type': type, 'x-upsert': 'true' } });
}

async function inBatches(rows, size, send) {
  for (let i = 0; i < rows.length; i += size) await send(rows.slice(i, i + size));
}

async function pool(items, concurrency, task) {
  let next = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (next < items.length) await task(items[next++]);
  }));
}

// ---------------------------------------------------------------- add
async function add() {
  if ((await findUsers()).some(Boolean)) {
    console.log('The perf data set is already there (run `remove` first to rebuild it).');
    return;
  }
  console.log('Creating 4 test accounts…');
  const ids = await createUsers();
  const [me] = ids;

  console.log('Drawing photos (avatars and file previews)…');
  const avatars = await makePhotos(PEOPLE.length, 1600, 1600);
  const photos = await makePhotos(8, 2000, 1500);
  await pool(ids.map((id, i) => ({ id, i })), 4, async ({ id, i }) => {
    const path = `${id}/avatar.jpg`;
    await upload('avatars', path, avatars[i], 'image/jpeg');
    await api(`/rest/v1/profiles?id=eq.${id}`, { method: 'PATCH', body: { avatar_path: path }, extra: { Prefer: 'return=minimal' } });
  });

  console.log(`A private room with ${COUNTS.messages} messages…`);
  const [room] = await api('/rest/v1/rooms', { method: 'POST', body: { name: ROOM, topic: 'Day 24 performance test data', is_private: true, created_by: me }, extra: { Prefer: 'return=representation' } });
  await api('/rest/v1/room_members', {
    method: 'POST',
    body: ids.slice(1).map((user_id) => ({ room_id: room.id, user_id, role: 'member' })),
    extra: { Prefer: 'return=minimal,resolution=ignore-duplicates' },
  });
  const start = Date.now() - 30 * 24 * 3600 * 1000;
  const step = (30 * 24 * 3600 * 1000) / COUNTS.messages;
  const messages = Array.from({ length: COUNTS.messages }, (_, i) => {
    const long = rand() < 0.1;
    return {
      room_id: room.id,
      user_id: rand() < 0.3 ? me : pick(ids.slice(1)),
      body: long ? `${paragraph(3)}\n\n${paragraph(2)}` : sentence(3, 18),
      created_at: new Date(start + i * step + Math.floor(rand() * step * 0.5)).toISOString(),
    };
  });
  await inBatches(messages, 500, (batch) => api('/rest/v1/messages', { method: 'POST', body: batch, extra: { Prefer: 'return=minimal' } }));

  console.log(`${COUNTS.notes} notes with tags…`);
  const tags = await api('/rest/v1/tags', {
    method: 'POST',
    body: WORDS.slice(0, 15).map((name) => ({ owner_id: me, name })),
    extra: { Prefer: 'return=representation' },
  });
  const notes = Array.from({ length: COUNTS.notes }, (_, i) => ({
    owner_id: me,
    title: `${i + 1}. ${sentence(2, 6).slice(0, -1)}`.slice(0, 120),
    body: Array.from({ length: 1 + Math.floor(rand() * 4) }, () => paragraph(2 + Math.floor(rand() * 4))).join('\n\n'),
    visibility: 'private',
    pinned: rand() < 0.05,
    priority: Math.floor(rand() * 6),
    created_at: new Date(start + i * 2_600_000).toISOString(),
  }));
  const savedNotes = [];
  await inBatches(notes, 250, async (batch) => savedNotes.push(...await api('/rest/v1/notes', { method: 'POST', body: batch, extra: { Prefer: 'return=representation' } })));
  const links = savedNotes.flatMap((note) => [...new Set(Array.from({ length: Math.floor(rand() * 4) }, () => pick(tags).id))].map((tag_id) => ({ note_id: note.id, tag_id })));
  await inBatches(links, 500, (batch) => api('/rest/v1/note_tags', { method: 'POST', body: batch, extra: { Prefer: 'return=minimal' } }));

  console.log(`${COUNTS.files} files (${COUNTS.photos} photos), uploaded to storage…`);
  const files = Array.from({ length: COUNTS.files }, (_, i) => {
    const photo = i % Math.round(COUNTS.files / COUNTS.photos) === 0 && i / Math.round(COUNTS.files / COUNTS.photos) < COUNTS.photos;
    const name = photo ? `photo-${i + 1}.jpg` : `${pick(WORDS)}-${pick(WORDS)}-${i + 1}.${pick(['txt', 'md', 'csv'])}`;
    const bytes = photo ? photos[i % photos.length] : Buffer.from(paragraph(3 + Math.floor(rand() * 10)));
    return { name, bytes, mime: photo ? 'image/jpeg' : 'text/plain', path: `${me}/perf-${String(i + 1).padStart(3, '0')}-${name}`, created_at: new Date(start + i * 8_000_000).toISOString() };
  });
  await pool(files, 8, (f) => upload('attachments', f.path, f.bytes, f.mime));
  await inBatches(files, 100, (batch) => api('/rest/v1/files', {
    method: 'POST',
    body: batch.map((f) => ({ owner_id: me, path: f.path, name: f.name, mime: f.mime, size: f.bytes.length, created_at: f.created_at })),
    extra: { Prefer: 'return=minimal' },
  }));

  console.log(`Done. Sign in as ${PEOPLE[0].email} / ${PASSWORD} (local only). Room "${ROOM}": /chat/${room.id}`);
}

// ---------------------------------------------------------------- remove
async function remove() {
  const users = (await findUsers()).filter(Boolean);
  if (users.length === 0) {
    console.log('No perf data to remove.');
    return;
  }
  for (const user of users) {
    for (const bucket of ['avatars', 'attachments']) {
      for (;;) {
        const objects = await api(`/storage/v1/object/list/${bucket}`, { method: 'POST', body: { prefix: user.id, limit: 1000 } });
        if (objects.length === 0) break;
        await api(`/storage/v1/object/${bucket}`, { method: 'DELETE', body: { prefixes: objects.map((o) => `${user.id}/${o.name}`) } });
      }
    }
    // deleting the account cascades: profile, rooms it created (and their messages), notes, tags, file rows
    await api(`/auth/v1/admin/users/${user.id}`, { method: 'DELETE' });
  }
  console.log(`Removed ${users.length} test accounts with their rooms, messages, notes and files.`);
}

async function report() {
  const [me] = await findUsers();
  if (!me) {
    console.log('The perf data set is not there. Add it with: node scripts/perf-data.mjs add');
    return;
  }
  const count = async (path) => {
    const response = await fetch(`${URL_}/rest/v1/${path}`, { method: 'HEAD', headers: { ...headers, Prefer: 'count=exact' } });
    return response.headers.get('content-range')?.split('/')[1];
  };
  const [room] = await api(`/rest/v1/rooms?select=id&name=eq.${encodeURIComponent(ROOM)}&created_by=eq.${me.id}`);
  console.log(`perf data: room ${room?.id} with ${await count(`messages?room_id=eq.${room?.id}`)} messages, ${await count(`notes?owner_id=eq.${me.id}`)} notes, ${await count(`files?owner_id=eq.${me.id}`)} files`);
}

const command = process.argv[2];
if (command === 'add') await add();
else if (command === 'remove') await remove();
else if (command === 'status') await report();
else console.log('usage: node scripts/perf-data.mjs add | remove | status');
