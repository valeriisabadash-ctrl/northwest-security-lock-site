import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const pages = Object.values(JSON.parse(await readFile('data/pages.json', 'utf8')));

test.beforeEach(async ({ page }) => {
  // Third-party analytics are unnecessary for UI tests. No live lead is submitted.
  await page.route(/googletagmanager\.com|cdn\.vercel-insights\.com|\/_vercel\//, route => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  await page.route('https://momentummatrix.ai/form-relay.html', route => route.fulfill({
    status: 200, contentType: 'text/html',
    body: `<script>addEventListener('message', event => { if(event.data.type === 'northwest-lead-submit') event.source.postMessage({type:'northwest-lead-result',requestId:event.data.requestId,ok:true},event.origin); });</script>`,
  }));
});

for (const width of [390, 1280]) {
  test(`all pages load without overflow or script exceptions at ${width}px`, async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: 844 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const config of pages) {
      const response = await page.goto(config.path, { waitUntil: 'domcontentloaded' });
      expect(response.status(), config.path).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), config.path + ' overflow').toBe(true);
      await expect(page.locator('h1')).toBeVisible();
      if (config.path !== '/') await expect(page.locator('nav[aria-label="Breadcrumb"]')).toBeVisible();
      expect(await page.locator('link[rel="stylesheet"]').count()).toBe(1);
      expect(await page.locator('#northwest-form-relay').count()).toBe(0);
      if (['/', '/contact', '/reviews'].includes(config.path)) await page.screenshot({ path: `test-results/${config.path.slice(1) || 'home'}-${width}.png`, fullPage: true });
    }
    expect(errors).toEqual([]);
  });
}

test('new fragments and old request URLs preserve service selection', async ({ page }) => {
  for (const url of ['/#request-modal&service=Rekeying', '/?request=1&service=Rekeying']) {
    await page.goto(url);
    await expect(page.locator('#request-modal')).toHaveClass(/open/);
    await expect(page.locator('select[name="service"]')).toHaveValue('Rekeying');
    await expect(page.locator('#northwest-form-relay')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.locator('#request-modal')).not.toHaveClass(/open/);
  }
});

test('mobile navigation and request form still work with a mocked relay', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('.menu-toggle').click();
  await expect(page.locator('.menu-toggle')).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(page.locator('.menu-toggle')).toHaveAttribute('aria-expanded', 'false');
  await page.goto('/#request-modal&service=Rekeying');
  const form = page.locator('#service-request-form');
  await expect(page.locator('#request-modal')).toHaveClass(/open/);
  await form.locator('[name="name"]').fill('Automated local test');
  await form.locator('[name="phone"]').fill('5035550100');
  await form.locator('[name="location"]').fill('Local preview test');
  await form.locator('[name="details"]').fill('Local mocked relay validation. This is not sent to the business.');
  const urgency = form.locator('[name="urgency"]');
  if (await urgency.count()) await urgency.selectOption({ index: 1 });
  await form.locator('button[type="submit"]').click();
  await expect(form.locator('.form-status')).toContainText('Please complete every required field');
  await form.locator('[name="request_type"]').selectOption('Home');
  await form.locator('button[type="submit"]').click();
  await expect(form.locator('.form-status')).toContainText('Request sent successfully');
});

test('structured data and breadcrumbs are present without client JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/contact');
  await expect(page.locator('nav[aria-label="Breadcrumb"]')).toBeVisible();
  expect(JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())['@graph'].some(node => node['@type'] === 'Locksmith')).toBe(true);
  await context.close();
});
