// Generates the blog's cover images as 1200x630 PNGs with no dependencies: a diagonal gradient plus one pattern each.
// The covers are committed, so this only needs to run if you change a colour: `npm run covers`.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const W = 1200;
const H = 630;

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const body = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), 8 + data.length);
  return out;
};
const png = (rgb) => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(W, 0);
  header.writeUInt32BE(H, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // colour type: RGB
  const rows = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y += 1) rgb.copy(rows, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(rows, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
};

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));

// pattern(x, y) returns 0..1: how strongly to lighten the pixel
const patterns = {
  circles: (x, y) => [[300, 320, 220], [520, 260, 150], [820, 380, 260]].some(([cx, cy, r]) => Math.abs(Math.hypot(x - cx, y - cy) - r) < 5) ? 0.55 : 0,
  bands: (x, y) => ((x + y) % 120 < 14 ? 0.35 : 0),
  squares: (x, y) => [[200, 140, 260], [420, 240, 300], [700, 120, 220]].some(([sx, sy, s]) => x > sx && x < sx + s && y > sy && y < sy + s && (x - sx < 5 || x - sx > s - 5 || y - sy < 5 || y - sy > s - 5)) ? 0.6 : 0,
  rings: (x, y) => (Math.abs((Math.hypot(x - 900, y - 315) % 70) - 35) < 4 && Math.hypot(x - 900, y - 315) < 420 ? 0.45 : 0),
  dots: (x, y) => (Math.hypot((x % 60) - 30, (y % 60) - 30) < 6 ? 0.5 : 0),
  waves: (x, y) => (Math.abs(((y + Math.sin(x / 80) * 28) % 70) - 35) < 4 ? 0.4 : 0),
};

const covers = [
  ['what-is-nextjs', '#1d4ed8', '#7c3aed', 'circles'],
  ['file-based-routing', '#047857', '#0e7490', 'bands'],
  ['server-and-client-components', '#ea580c', '#db2777', 'squares'],
  ['data-fetching-and-caching', '#b45309', '#b91c1c', 'rings'],
  ['rendering-strategies', '#6d28d9', '#3730a3', 'dots'],
  ['images-fonts-and-metadata', '#0f766e', '#1e3a8a', 'waves'],
];

mkdirSync('public/covers', { recursive: true });
for (const [name, from, to, pattern] of covers) {
  const rgb = Buffer.alloc(W * H * 3);
  const a = hex(from);
  const b = hex(to);
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const base = mix(a, b, (x / W + y / H) / 2);
      const lift = patterns[pattern](x, y);
      const [r, g, bl] = lift ? mix(base, [255, 255, 255], lift) : base;
      const i = (y * W + x) * 3;
      rgb[i] = r;
      rgb[i + 1] = g;
      rgb[i + 2] = bl;
    }
  }
  writeFileSync(`public/covers/${name}.png`, png(rgb));
  console.log(`public/covers/${name}.png`);
}
