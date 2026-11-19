// @vitest-environment jsdom
import type slugify from 'tiny-slugify';
import type { SlugOptions } from 'tiny-slugify';
import type { ProvidedContext } from 'vitest';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { Counter, bannerStyle, describeEvent, formatPrice, greet, logoUrl, parseQuery, query, readApiUrl, type AnalyticsEventName } from '../src/07-declaration-files';

describe('07 a hand-written .d.ts for a plain JS file', () => {
  it('functions run, and the .d.ts types them', () => {
    expect(formatPrice(5)).toBe('USD 5.00');
    expect(formatPrice(5, 'EUR')).toBe('EUR 5.00');
    expect(parseQuery('?a=1&b=two')).toEqual({ a: '1', b: 'two' });
    expect(query('x=1&y=2&z=3')).toBe(3);
    expect(greet()).toBe('Hello, stranger');
    expectTypeOf(formatPrice).toBeCallableWith(1, 'USD');
    expectTypeOf(parseQuery).returns.toEqualTypeOf<Record<string, string>>();
  });
  it('the compiler rejects calls the JS would have silently accepted', () => {
    expect(() =>
      // @ts-expect-error  the JS has no idea, but the .d.ts overloads only allow 'USD' | 'EUR'
      formatPrice(5, 'GBP')
    ).not.toThrow();
    expect(() =>
      // @ts-expect-error  amount must be a number: at run time '5'.toFixed is not a function
      formatPrice('5')
    ).toThrow();
  });
  it('classes are described too', () => {
    const c = new Counter(2);
    expect(c.inc()).toBe(3);
    expect(c.inc(10)).toBe(13);
    expectTypeOf(c.count).toBeNumber();
    // @ts-expect-error  Counter has no `dec` method
    expect(() => c.dec()).toThrow();
  });
});

describe('07 module declarations', () => {
  it("'*.svg' imports are strings", () => {
    expectTypeOf(logoUrl).toBeString();
    expect(typeof logoUrl).toBe('string');
  });
  it('an untyped package gets overloads', () => {
    expectTypeOf<typeof slugify>().toBeCallableWith('Hello World');
    expectTypeOf<typeof slugify>().toBeCallableWith('Hello World', '_');
    expectTypeOf<typeof slugify>().toBeCallableWith('Hello World', { lower: true });
    expectTypeOf<SlugOptions['separator']>().toEqualTypeOf<'-' | '_' | undefined>();
    // @ts-expect-error  separator must be '-' or '_'
    const bad: SlugOptions = { separator: '.' };
    expect(bad).toBeDefined();
  });
});

describe('07 augmenting globals and third-party types', () => {
  it('Window has appConfig', () => {
    window.appConfig = { apiUrl: 'http://api.test', features: ['a'] };
    expect(readApiUrl(window)).toBe('http://api.test');
    // @ts-expect-error  appConfig has `apiUrl`, not `apiURL`
    expect(window.appConfig.apiURL).toBeUndefined();
    expectTypeOf(globalThis.__BUILD_ID__).toEqualTypeOf<string | undefined>(); // checked BEFORE assigning, which would narrow it
    globalThis.__BUILD_ID__ = 'abc';
    expect(globalThis.__BUILD_ID__).toBe('abc');
  });
  it('React CSSProperties accepts custom properties, and still checks values', () => {
    expect(bannerStyle('teal')).toMatchObject({ '--accent': 'teal', '--gap': 8 });
    // @ts-expect-error  custom properties may be string | number | undefined, not boolean
    const bad: import('react').CSSProperties = { '--accent': true };
    expect(bad).toBeDefined();
  });
  it("vitest's ProvidedContext was augmented", () => {
    expectTypeOf<ProvidedContext['apiUrl']>().toBeString();
  });
});

describe('07 ambient namespace', () => {
  it('Analytics.* types are global', () => {
    const e: Analytics.Event = { name: 'click', at: 1 };
    expect(describeEvent(e)).toBe('click@1');
    expectTypeOf<AnalyticsEventName>().toEqualTypeOf<'page_view' | 'click' | 'purchase'>();
    // @ts-expect-error  'hover' is not an Analytics.EventName
    const bad: Analytics.Event = { name: 'hover', at: 1 };
    expect(bad).toBeDefined();
  });
});
