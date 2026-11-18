/**
 * MOCK DATA for SalesPulse. Generated from a seeded random number generator, so every load (and
 * every test) sees exactly the same business. Nothing here is real.
 *
 * Four tables, like a small analytics warehouse would give a dashboard:
 *   sales     one row per month x region x category      (24 months, 288 rows)
 *   users     one row per day x region                   (365 days, 1,460 rows)
 *   products  one row per product                        (30 rows)
 *   scores    customer satisfaction and retention per region x category (12 rows)
 */
export const REGIONS = ['North America', 'Europe', 'Asia-Pacific', 'Latin America'];
export const CATEGORIES = ['Software', 'Hardware', 'Services'];

/** First and last month of the sales data, and the last day of the user data */
export const FIRST_MONTH = '2024-12';
export const LAST_MONTH = '2026-11';
export const LAST_DAY = '2026-11-30';
export const MONTH_COUNT = 24;
export const DAY_COUNT = 365;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (rng, min, max) => min + rng() * (max - min);
const round = (n, digits = 0) => Math.round(n * 10 ** digits) / 10 ** digits;

/** '2024-12' plus n months */
export function addMonths(month, n) {
  const [y, m] = month.split('-').map(Number);
  const index = y * 12 + (m - 1) + n;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}

const MONTHS = Array.from({ length: MONTH_COUNT }, (_, i) => addMonths(FIRST_MONTH, i));
export const ALL_MONTHS = MONTHS;

// Business shape: bigger regions, a category mix, yearly growth and a holiday peak
const REGION_SIZE = { 'North America': 1.0, Europe: 0.82, 'Asia-Pacific': 0.7, 'Latin America': 0.38 };
const REGION_GROWTH = { 'North America': 0.012, Europe: 0.009, 'Asia-Pacific': 0.024, 'Latin America': 0.017 }; // per month
const CATEGORY_BASE = { Software: 78000, Hardware: 52000, Services: 36000 };
const CATEGORY_MARGIN = { Software: 0.74, Hardware: 0.31, Services: 0.52 };
const SEASON = [0.92, 0.9, 0.97, 1.0, 1.02, 1.0, 0.96, 0.95, 1.04, 1.08, 1.18, 1.3]; // Jan..Dec

export function generateSales(seed = 14) {
  const rng = mulberry32(seed);
  const rows = [];
  MONTHS.forEach((month, monthIndex) => {
    const monthNumber = Number(month.slice(5)) - 1;
    for (const region of REGIONS) {
      for (const category of CATEGORIES) {
        const trend = (1 + REGION_GROWTH[region]) ** monthIndex;
        const noise = between(rng, 0.93, 1.07);
        const revenue = round(CATEGORY_BASE[category] * REGION_SIZE[region] * trend * SEASON[monthNumber] * noise);
        const marginNoise = between(rng, -0.025, 0.025);
        const cost = round(revenue * (1 - (CATEGORY_MARGIN[category] + marginNoise)));
        const averageOrder = category === 'Hardware' ? 310 : category === 'Software' ? 140 : 520;
        const orders = Math.max(1, round(revenue / (averageOrder * between(rng, 0.92, 1.08))));
        rows.push({ month, region, category, revenue, cost, orders, units: round(orders * between(rng, 1.1, 2.4)) });
      }
    }
  });
  return rows;
}

const addDays = (isoDay, n) => {
  const d = new Date(`${isoDay}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export function generateUsers(seed = 15) {
  const rng = mulberry32(seed);
  const rows = [];
  const first = addDays(LAST_DAY, -(DAY_COUNT - 1));
  for (let i = 0; i < DAY_COUNT; i += 1) {
    const date = addDays(first, i);
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday
    const weekly = weekday === 0 || weekday === 6 ? 0.72 : weekday === 1 ? 1.08 : 1; // quieter weekends
    const growth = 1 + (i / DAY_COUNT) * 0.55;
    const campaign = i % 61 > 54 ? 1.35 : 1; // a short marketing spike every two months
    for (const region of REGIONS) {
      const visitors = round(2400 * REGION_SIZE[region] * growth * weekly * campaign * between(rng, 0.88, 1.12));
      const sessions = round(visitors * between(rng, 1.25, 1.5));
      const signups = round(visitors * between(rng, 0.028, 0.045) * (campaign > 1 ? 1.2 : 1));
      rows.push({ date, region, visitors, sessions, signups });
    }
  }
  return rows;
}

const PRODUCT_NAMES = {
  Software: ['Analytics Suite', 'Flow Builder', 'Insight Cloud', 'Task Planner', 'Secure Vault', 'Report Studio', 'Sync Hub', 'Design Kit', 'Code Review Pro', 'Form Maker'],
  Hardware: ['Edge Router', 'Smart Display', 'Dev Keyboard', 'Sensor Pack', 'Dock Station', 'Field Tablet', 'Power Hub', 'Studio Mic', 'Camera Rig', 'Rack Server'],
  Services: ['Onboarding', 'Premium Support', 'Training Day', 'Audit Package', 'Migration', 'Custom Reports', 'Managed Hosting', 'Workshop', 'Integration', 'Health Check'],
};
const PRICE_RANGE = { Software: [25, 420], Hardware: [60, 1400], Services: [150, 4800] };

export function generateProducts(seed = 16) {
  const rng = mulberry32(seed);
  return CATEGORIES.flatMap((category) =>
    PRODUCT_NAMES[category].map((name, i) => {
      const [low, high] = PRICE_RANGE[category];
      const price = round(low + (high - low) * rng() ** 1.6);
      // cheaper products sell more: units fall as price rises, with noise
      const units = Math.max(20, round((90000 / (price + 40)) * (CATEGORY_BASE[category] / 40000) * between(rng, 0.55, 1.5)));
      return {
        id: `${category.slice(0, 2).toLowerCase()}-${i + 1}`,
        name,
        category,
        price,
        units,
        revenue: round(price * units),
        rating: round(between(rng, 3.1, 4.9), 1),
      };
    })
  );
}

export function generateScores(seed = 17) {
  const rng = mulberry32(seed);
  return REGIONS.flatMap((region) =>
    CATEGORIES.map((category) => ({
      region,
      category,
      satisfaction: round(between(rng, 64, 94)),
      retention: round(between(rng, 58, 93)),
    }))
  );
}

/** The whole dataset, generated once */
let cache;
export function getWarehouse() {
  cache ??= { sales: generateSales(), users: generateUsers(), products: generateProducts(), scores: generateScores() };
  return cache;
}
