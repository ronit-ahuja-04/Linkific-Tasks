import { expect, test } from '@playwright/test';

test.describe('routing and layouts', () => {
  test('home lists three posts and marks Home as the current page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Notes on Next.js');
    await expect(page.locator('main article')).toHaveCount(3);
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
  });

  test('client-side navigation: clicking Blog changes the page and the current link without a reload', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => { (window as unknown as { __marker: string }).__marker = 'still here'; });
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Blog' }).click();
    await expect(page).toHaveURL(/\/blog$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Blog' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Blog' })).toHaveAttribute('aria-current', 'page');
    expect(await page.evaluate(() => (window as unknown as { __marker?: string }).__marker)).toBe('still here'); // no full reload
  });

  test('the blog list filters by topic through the URL (searchParams)', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('main article')).toHaveCount(6);
    await page.getByRole('navigation', { name: 'Filter by topic' }).getByRole('link', { name: '#routing' }).click();
    await expect(page).toHaveURL(/\/blog\?tag=routing$/);
    await expect(page.locator('main article')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 3 })).toContainText('File-based routing');
    await page.goto('/blog?tag=nothing');
    await expect(page.getByText('No posts tagged “nothing”.')).toBeVisible();
  });

  test('the route group (marketing) is not in the URL, and shares its own sidebar layout', async ({ page }) => {
    await page.goto('/about');
    await expect(page).toHaveURL(/\/about$/);
    const sidebar = page.getByRole('navigation', { name: 'About pages' });
    await expect(sidebar).toBeVisible();
    await sidebar.getByRole('link', { name: 'Contact' }).click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(sidebar).toBeVisible(); // the layout stayed mounted
    expect((await page.request.get('/marketing/about')).status()).toBe(404);
  });

  test('an unknown address shows the 404 page with a real 404 status', async ({ page }) => {
    const response = await page.goto('/no/such/page');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  });
});

test.describe('dynamic route /blog/[slug]', () => {
  test('renders the post, with a Markdown body and related posts', async ({ page }) => {
    await page.goto('/blog/data-fetching-and-caching');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fetching data and caching it');
    await expect(page.locator('.prose h2').first()).toBeVisible();
    await expect(page.locator('.prose pre')).toContainText("cacheLife('days')");
    await expect(page.getByRole('heading', { name: 'Related posts' })).toBeVisible();
  });

  test('an unknown slug shows the post not-found page and is marked noindex', async ({ page }) => {
    await page.goto('/blog/this-post-does-not-exist');
    await expect(page.getByRole('heading', { name: 'Post not found' })).toBeVisible();
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', 'noindex');
  });

  test('every post in the build is reachable from the sitemap', async ({ page, request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1] ?? '').filter((u) => u.includes('/blog/'));
    expect(urls).toHaveLength(6);
    for (const url of urls) {
      const response = await page.goto(new URL(url).pathname);
      expect(response?.status(), url).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });
});

test.describe('server and client components', () => {
  test('the like button (a client component) toggles its state', async ({ page }) => {
    await page.goto('/blog/what-is-nextjs');
    const like = page.getByRole('button', { name: /likes?$/ });
    await expect(like).toHaveText('♡ 0 likes');
    await like.click();
    await expect(like).toHaveText('♥ 1 like');
    await expect(like).toHaveAttribute('aria-pressed', 'true');
    await like.click();
    await expect(like).toHaveText('♡ 0 likes');
  });

  test('the disclosure (client) shows server-rendered children when opened', async ({ page }) => {
    await page.goto('/blog/what-is-nextjs');
    await expect(page.getByText('developer-in-training')).toHaveCount(0);
    await page.getByRole('button', { name: /About the author/ }).click();
    await expect(page.getByText('developer-in-training')).toBeVisible();
  });

  test('the article text is in the server HTML (no JavaScript needed to read it)', async ({ request }) => {
    const html = await (await request.get('/blog/what-is-nextjs')).text();
    expect(html).toContain('React is a library for building user interfaces');
  });
});

test.describe('images', () => {
  test('next/image serves a resized WebP, with width and height set (no layout shift) and the main image preloaded', async ({ page, request }) => {
    await page.goto('/blog/rendering-strategies');
    const cover = page.locator('.article-cover img');
    await expect(cover).toHaveAttribute('width', '1200');
    await expect(cover).toHaveAttribute('height', '630');
    await expect(cover).toHaveAttribute('srcset', /_next\/image\?url=%2Fcovers%2Frendering-strategies\.png&w=\d+&q=75/);
    expect(await cover.getAttribute('loading')).not.toBe('lazy'); // `priority`
    const src = await cover.evaluate((img: HTMLImageElement) => img.currentSrc);
    expect(src).toContain('/_next/image');
    const optimised = await request.get(src, { headers: { Accept: 'image/webp' } });
    expect(optimised.headers()['content-type']).toBe('image/webp');
    const original = await request.get('/covers/rendering-strategies.png');
    expect((await optimised.body()).length).toBeLessThan((await original.body()).length / 3);
  });

  test('images below the fold are lazy-loaded', async ({ page }) => {
    await page.goto('/blog');
    expect(await page.locator('.card-image img').last().getAttribute('loading')).toBe('lazy');
  });
});

test.describe('metadata and SEO', () => {
  test('a post has its own title, description, canonical URL, Open Graph, Twitter card and JSON-LD', async ({ page }) => {
    await page.goto('/blog/file-based-routing');
    await expect(page).toHaveTitle('File-based routing in the App Router | Dispatch');
    const meta = (selector: string) => page.locator(selector).first().getAttribute('content');
    expect(await meta('meta[name="description"]')).toContain('Folders become URLs');
    expect(await meta('meta[property="og:type"]')).toBe('article');
    expect(await meta('meta[property="og:image"]')).toMatch(/\/covers\/file-based-routing\.png$/);
    expect(await meta('meta[property="article:published_time"]')).toBe('2026-11-05');
    expect(await meta('meta[name="twitter:card"]')).toBe('summary_large_image');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/blog\/file-based-routing$/);
    const ld: unknown = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
    expect(ld).toMatchObject({ '@type': 'BlogPosting', headline: 'File-based routing in the App Router', datePublished: '2026-11-05' });
  });

  test('pages without their own title use the site template; the home page uses the default', async ({ page }) => {
    await page.goto('/about');
    await expect(page).toHaveTitle('About | Dispatch');
    await page.goto('/');
    await expect(page).toHaveTitle('Dispatch: notes on Next.js');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('robots.txt points at the sitemap and keeps crawlers out of the API', async ({ request }) => {
    const text = await (await request.get('/robots.txt')).text();
    expect(text).toContain('Disallow: /api/');
    expect(text).toMatch(/Sitemap: .*\/sitemap\.xml/);
  });

  test('fonts are self-hosted: no request goes to Google', async ({ page }) => {
    const hosts = new Set<string>();
    page.on('request', (r) => hosts.add(new URL(r.url()).hostname));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect([...hosts]).toEqual(['localhost']);
    const family = await page.locator('h1').evaluate((el) => getComputedStyle(el).fontFamily);
    expect(family).toMatch(/Fraunces/i);
  });
});

test.describe('error handling', () => {
  test('a page that throws shows error.tsx with a Try again button, and the header still works', async ({ page }) => {
    await page.goto('/broken');
    await expect(page.getByRole('heading', { name: 'Something went wrong' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Blog' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Blog' })).toBeVisible();
  });
});
