// BACKFILL small images for pictures uploaded before Day 24 (LOCAL stack only).
//
//   node scripts/backfill-images.mjs          the perf test accounts only (scripts/perf-data.mjs)
//   node scripts/backfill-images.mjs --all    every account
//
// New uploads get resized copies in the browser (src/lib/images.js). Older ones have only the original, so this does
// what an upload would have done, using the app's own resizing code (bundled and run in Chrome):
//   - avatars: 64 and 256 px WebP squares next to the original; the profile then points at the 256 px one;
//   - image files: a 160 px WebP thumbnail next to the original, recorded in files.thumb_path.
// Originals are never deleted. It uses the local service-role key (read from `supabase status`, never written).
import { execSync } from 'node:child_process';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { rolldown } from 'rolldown';

const ALL = process.argv.includes('--all');
const PERF_EMAILS = ['perf@example.com', 'perf-bot-1@example.com', 'perf-bot-2@example.com', 'perf-bot-3@example.com'];

const status = execSync('npx supabase status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const read = (name) => status.match(new RegExp(`^${name}="?([^"\\n]+)"?$`, 'm'))?.[1];
const URL_ = read('API_URL');
const KEY = read('SERVICE_ROLE_KEY') ?? read('SECRET_KEY');
if (!URL_ || !KEY || !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(URL_)) throw new Error('Local Supabase only (npm run db:start).');
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function api(p, init = {}) {
  const response = await fetch(`${URL_}${p}`, { ...init, headers: { ...headers, ...init.headers } });
  if (!response.ok) throw new Error(`${p}: ${response.status} ${(await response.text()).slice(0, 200)}`);
  return response;
}
const json = async (p, init) => (await api(p, init)).json();
const upload = (bucket, objectPath, bytes, type) => api(`/storage/v1/object/${bucket}/${objectPath}`, { method: 'POST', body: bytes, headers: { 'Content-Type': type, 'x-upsert': 'true', 'cache-control': 'max-age=31536000' } });
const download = async (bucket, objectPath) => Buffer.from(await (await api(`/storage/v1/object/${bucket}/${objectPath}`)).arrayBuffer());

// the app's own resizer, as a script for the page
const build = await rolldown({ input: path.resolve(import.meta.dirname, '../src/lib/images.js'), logLevel: 'silent' });
const { output } = await build.generate({ format: 'iife', name: 'HuddleImages' });
await build.close();

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
await page.addScriptTag({ content: output[0].code });
async function resize(bytes, mime, kind) {
  const result = await page.evaluate(async ({ base64, mime, kind }) => {
    const file = new Blob([Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))], { type: mime });
    const toBase64 = async (blob) => btoa(String.fromCharCode(...new Uint8Array(await blob.arrayBuffer())));
    const variants = kind === 'avatar' ? await window.HuddleImages.avatarVariants(file) : [{ size: 'thumb', ...(await window.HuddleImages.makeThumbnail(file)) }];
    return Promise.all(variants.map(async (v) => ({ size: v.size, ext: v.ext, type: v.blob.type, base64: await toBase64(v.blob) })));
  }, { base64: bytes.toString('base64'), mime, kind });
  return result.map((v) => ({ ...v, bytes: Buffer.from(v.base64, 'base64') }));
}

const { users } = await json('/auth/v1/admin/users?per_page=1000');
const ids = users.filter((u) => ALL || PERF_EMAILS.includes(u.email)).map((u) => u.id);
const inList = `in.(${ids.join(',')})`;
let avatars = 0;
let thumbs = 0;
let saved = 0;

for (const profile of await json(`/rest/v1/profiles?select=id,avatar_path&avatar_path=not.is.null&id=${inList}`)) {
  if (/-256\.(webp|png)$/.test(profile.avatar_path)) continue; // already resized
  const original = await download('avatars', profile.avatar_path);
  const variants = await resize(original, profile.avatar_path.endsWith('.png') ? 'image/png' : 'image/jpeg', 'avatar');
  const base = `${profile.id}/avatar-${Date.now()}`;
  for (const v of variants) await upload('avatars', `${base}-${v.size}.${v.ext}`, v.bytes, v.type);
  const largest = variants[variants.length - 1];
  await api(`/rest/v1/profiles?id=eq.${profile.id}`, { method: 'PATCH', body: JSON.stringify({ avatar_path: `${base}-${largest.size}.${largest.ext}` }), headers: { 'Content-Type': 'application/json' } });
  avatars += 1;
  saved += original.length - variants[0].bytes.length;
}

const files = await json(`/rest/v1/files?select=id,path,mime&thumb_path=is.null&mime=like.image%2F*&owner_id=${inList}`);
for (const file of files.filter((f) => !/gif|svg/.test(f.mime))) {
  const original = await download('attachments', file.path);
  const [thumb] = await resize(original, file.mime, 'thumb');
  const thumbPath = `${file.path}.thumb.${thumb.ext}`;
  await upload('attachments', thumbPath, thumb.bytes, thumb.type);
  await api(`/rest/v1/files?id=eq.${file.id}`, { method: 'PATCH', body: JSON.stringify({ thumb_path: thumbPath }), headers: { 'Content-Type': 'application/json' } });
  thumbs += 1;
  saved += original.length - thumb.bytes.length;
}

await browser.close();
console.log(`Resized ${avatars} avatars and made ${thumbs} thumbnails (${ALL ? 'all accounts' : 'perf test accounts'}). A page view of each now downloads ${(saved / 1024 / 1024).toFixed(1)} MB less in total.`);
