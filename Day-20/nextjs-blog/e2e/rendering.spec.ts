import { expect, test } from '@playwright/test';

const stamp = (html: string, id: string): string | undefined => new RegExp(`data-testid="${id}"[^>]*>([^<]+)<`).exec(html)?.[1];

test.describe('SSG, ISR, SSR and CSR on /rendering', () => {
  test('the first HTML already has the static, ISR and fallback parts, but not the CSR text', async ({ request }) => {
    const html = await (await request.get('/rendering')).text();
    expect(stamp(html, 'ssg-stamp')).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(stamp(html, 'isr-stamp')).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(html).toContain('Loading in the browser…'); // CSR: only the placeholder is in the HTML
    expect(html).not.toMatch(/data-testid="csr-stamp"[^>]*>\d{4}-/);
  });

  test('SSR streams: the page shell is sent with a fallback, and the request-time value arrives in the same response', async ({ request }) => {
    const html = await (await request.get('/rendering')).text();
    expect(html).toContain('Rendering on the server…'); // the Suspense fallback travelled in the shell
    expect(stamp(html, 'ssr-stamp')).toMatch(/^\d{4}-\d{2}-\d{2}T/); // and was replaced by the real value
  });

  test('on reload the static stamp stays, the server and client stamps move', async ({ page }) => {
    const read = async () => ({
      ssg: await page.getByTestId('ssg-stamp').textContent(),
      ssr: await page.getByTestId('ssr-stamp').textContent(),
      csr: await page.getByTestId('csr-stamp').textContent(),
    });
    await page.goto('/rendering');
    await expect(page.getByTestId('ssr-stamp')).toBeVisible();
    await expect(page.getByTestId('csr-stamp')).toHaveText(/^\d{4}-/);
    const first = await read();
    await page.waitForTimeout(50);
    await page.reload();
    await expect(page.getByTestId('ssr-stamp')).toBeVisible();
    await expect(page.getByTestId('csr-stamp')).toHaveText(/^\d{4}-/);
    const second = await read();
    expect(second.ssg).toBe(first.ssg);
    expect(second.ssr).not.toBe(first.ssr);
    expect(second.csr).not.toBe(first.csr);
  });

  test('ISR: after the 15 second lifetime a visit triggers a rebuild, and a later visit sees the new value', async ({ request }) => {
    test.setTimeout(60_000);
    const first = stamp(await (await request.get('/rendering')).text(), 'isr-stamp');
    await new Promise((resolve) => setTimeout(resolve, 16_000));
    await request.get('/rendering'); // this visit still gets the old copy, and starts the background rebuild
    await expect
      .poll(async () => stamp(await (await request.get('/rendering')).text(), 'isr-stamp'), { timeout: 15_000, intervals: [500] })
      .not.toBe(first);
  });
});

test.describe('route handlers', () => {
  test('GET /api/posts is a static JSON list', async ({ request }) => {
    const response = await request.get('/api/posts');
    expect(response.status()).toBe(200);
    const body: { count: number; posts: { slug: string; body?: string }[] } = await response.json();
    expect(body.count).toBe(6);
    expect(body.posts[0]).not.toHaveProperty('body'); // lists never carry article text
  });

  test('GET /api/posts/[slug] returns one post, or a JSON 404', async ({ request }) => {
    const found = await request.get('/api/posts/what-is-nextjs');
    expect(found.status()).toBe(200);
    expect(await found.json()).toMatchObject({ slug: 'what-is-nextjs', title: 'What Next.js is, and why use it' });
    const missing = await request.get('/api/posts/nope');
    expect(missing.status()).toBe(404);
    expect(await missing.json()).toEqual({ error: 'Post not found', slug: 'nope' });
  });

  test('GET /api/time is different every time and is not cacheable', async ({ request }) => {
    const a = await request.get('/api/time');
    expect(a.headers()['cache-control']).toBe('no-store');
    await new Promise((resolve) => setTimeout(resolve, 20));
    const b = await request.get('/api/time');
    expect((await a.json()).now).not.toBe((await b.json()).now);
  });
});
