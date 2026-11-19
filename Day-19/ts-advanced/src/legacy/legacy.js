// A plain JavaScript module, as if written years ago. TypeScript does not read it (allowJs is off): it reads legacy.d.ts instead.
export function formatPrice(amount, currency) {
  const code = currency || 'USD';
  return `${code} ${amount.toFixed(2)}`;
}

export function parseQuery(query) {
  const out = {};
  for (const pair of query.replace(/^\?/, '').split('&')) {
    if (!pair) continue;
    const [key, value] = pair.split('=');
    out[decodeURIComponent(key)] = decodeURIComponent(value || '');
  }
  return out;
}

export class Counter {
  constructor(start) {
    this.count = start || 0;
  }
  inc(by) {
    this.count += by === undefined ? 1 : by;
    return this.count;
  }
}

export default function greet(name) {
  return name ? `Hello, ${name}` : 'Hello, stranger';
}
