import times from 'lodash/times';
import deburr from 'lodash/deburr';
import toLower from 'lodash/toLower';
import memoize from 'lodash/memoize';
import range from 'lodash/range';
import capitalize from 'lodash/capitalize';

/**
 * A deterministic fake dataset. The same seed always gives the same users, so tests, screenshots
 * and benchmarks are repeatable. (Lodash's own random(), sample() and shuffle() use Math.random()
 * and cannot be seeded, so a tiny seeded generator is used here instead.)
 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES = ['Aarav', 'Zoë', 'José', 'Mei', 'Liam', 'Sofía', 'Noah', 'Priya', 'Émile', 'Olivia', 'Kenji', 'Amara', 'Lucas', 'Fatima', 'Ethan', 'Chloé', 'Rohan', 'Isabella', 'Mateo', 'Hana', 'Daniel', 'Anaïs', 'Arjun', 'Layla', 'Oscar', 'Yuki', 'Nia', 'Hugo', 'Sana', 'Felix', 'Ingrid', 'Tariq', 'Elena', 'Kofi', 'Jörg', 'Camille', 'Diego', 'Aisha', 'Viktor', 'Leila'];
const LAST_NAMES = ['Sharma', 'Müller', 'García', 'Chen', 'Nguyen', 'Okafor', 'Silva', 'Kowalski', 'Haddad', 'Johansson', 'Tanaka', 'Rossi', 'Dubois', 'Patel', 'Santos', 'Kim', 'Novak', 'Ali', 'Fernández', 'Schmidt', 'Moreau', 'Singh', 'Ivanov', 'Lopez', 'Wang', 'Rahman', 'Brown', 'Costa', 'Nakamura', 'Bianchi', 'Khan', 'Andersson', 'Oliveira', 'Zhang', 'Hernández', 'Mensah', 'Jovanović', 'Reyes', 'Larsen', 'Yilmaz'];
export const DEPARTMENTS = ['Engineering', 'Design', 'Product', 'Marketing', 'Sales', 'Support', 'Finance', 'People'];
const ROLES = {
  Engineering: ['Frontend Engineer', 'Backend Engineer', 'QA Engineer', 'DevOps Engineer', 'Engineering Manager'],
  Design: ['Product Designer', 'UX Researcher', 'Brand Designer'],
  Product: ['Product Manager', 'Product Analyst', 'Technical Writer'],
  Marketing: ['Content Strategist', 'Growth Marketer', 'SEO Specialist'],
  Sales: ['Account Executive', 'Sales Engineer', 'Customer Success Manager'],
  Support: ['Support Specialist', 'Support Lead'],
  Finance: ['Financial Analyst', 'Accountant'],
  People: ['Recruiter', 'People Partner'],
};
const BASE_SALARY = { Engineering: 90000, Design: 80000, Product: 95000, Marketing: 65000, Sales: 70000, Support: 50000, Finance: 75000, People: 62000 };
export const COUNTRIES = {
  India: { cities: ['Mumbai', 'Bengaluru', 'Delhi'], factor: 0.45, lat: 20, lng: 78 },
  Germany: { cities: ['Berlin', 'Munich', 'Hamburg'], factor: 1.0, lat: 51, lng: 10 },
  Spain: { cities: ['Madrid', 'Barcelona', 'Valencia'], factor: 0.85, lat: 40, lng: -4 },
  'United States': { cities: ['New York', 'Austin', 'Seattle'], factor: 1.35, lat: 38, lng: -97 },
  Brazil: { cities: ['São Paulo', 'Rio de Janeiro', 'Curitiba'], factor: 0.6, lat: -14, lng: -51 },
  Japan: { cities: ['Tokyo', 'Osaka', 'Kyoto'], factor: 1.05, lat: 36, lng: 138 },
  Nigeria: { cities: ['Lagos', 'Abuja', 'Kano'], factor: 0.4, lat: 9, lng: 8 },
  France: { cities: ['Paris', 'Lyon', 'Toulouse'], factor: 0.95, lat: 46, lng: 2 },
};
export const SKILLS = ['React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'Figma', 'Docker', 'AWS', 'GraphQL', 'Testing', 'Accessibility', 'CSS', 'Leadership', 'Writing', 'Analytics', 'SEO', 'Negotiation', 'Excel', 'Public speaking', 'Mentoring', 'Kubernetes', 'Go', 'Swift', 'Research'];
const STREETS = ['Maple Street', 'Oak Avenue', 'Station Road', 'Park Lane', 'River Drive', 'Market Square', 'Hill Crescent', 'Lake View'];
const BIO_OPENERS = ['Loves turning messy problems into simple products', 'Spends weekends contributing to open source', 'Believes good documentation is a feature', 'Always the first to automate a boring task', 'Runs a small newsletter about their craft', 'Is happiest pairing with a teammate on a hard bug'];

const pick = (rng, list) => list[Math.floor(rng() * list.length)];
const between = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));

function makeUser(id, rng) {
  const firstName = pick(rng, FIRST_NAMES);
  const lastName = pick(rng, LAST_NAMES);
  const department = pick(rng, DEPARTMENTS);
  const country = pick(rng, Object.keys(COUNTRIES));
  const { cities, factor, lat, lng } = COUNTRIES[country];
  const city = pick(rng, cities);
  const seniority = 0.8 + rng() * 0.9; // 0.8 to 1.7
  const joinedYear = between(rng, 2015, 2026);
  const joinedAt = new Date(Date.UTC(joinedYear, between(rng, 0, 11), between(rng, 1, 28))).toISOString().slice(0, 10);
  // draw until there are enough DISTINCT skills (uniq over a fixed number of draws could leave only one)
  const wanted = between(rng, 3, 6);
  const skills = [];
  while (skills.length < wanted) {
    const skill = pick(rng, SKILLS);
    if (!skills.includes(skill)) skills.push(skill);
  }
  return {
    id,
    firstName,
    lastName,
    email: `${toLower(deburr(firstName))}.${toLower(deburr(lastName))}${id}@example.com`,
    age: between(rng, 22, 64),
    country,
    city,
    department,
    role: pick(rng, ROLES[department]),
    salary: Math.round((BASE_SALARY[department] * factor * seniority) / 500) * 500,
    rating: Math.round((1 + rng() * 4) * 10) / 10,
    joinedAt,
    skills,
    bio: `${pick(rng, BIO_OPENERS)}. Based in ${city}.`,
    address: {
      street: `${between(rng, 1, 240)} ${pick(rng, STREETS)}`,
      city,
      country,
      geo: { lat: Math.round((lat + (rng() - 0.5) * 6) * 1000) / 1000, lng: Math.round((lng + (rng() - 0.5) * 8) * 1000) / 1000 },
    },
    preferences: {
      theme: rng() < 0.5 ? 'light' : 'dark',
      language: pick(rng, ['en', 'es', 'hi', 'de', 'fr']),
      notifications: { email: rng() < 0.8, push: rng() < 0.5, sms: rng() < 0.15 },
      privacy: { showSalary: rng() < 0.2, showEmail: rng() < 0.7 },
    },
  };
}

/** `times(n, fn)` calls fn(0), fn(1) ... fn(n - 1) and collects the results */
export function generateUsers(count = 10_000, seed = 42) {
  const rng = mulberry32(seed);
  return times(count, (index) => makeUser(index + 1, rng));
}

/** memoize caches by argument: asking for the same size twice returns the very same array */
export const getDataset = memoize((count) => generateUsers(count), (count) => count);

export const fullName = (user) => `${user.firstName} ${user.lastName}`;
export const displayName = (user) => `${capitalize(user.firstName)} ${capitalize(user.lastName)}`;
export const YEARS = range(2015, 2027);
