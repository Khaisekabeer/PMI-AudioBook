import { test, expect } from '@playwright/test';

// Exercise the actual React OAuth integration without using real Google accounts.
async function mockGoogle(page, response) {
  await page.route('https://accounts.google.com/gsi/client', route => route.fulfill({
    contentType: 'application/javascript',
    body: `
      window.google = { accounts: { oauth2: {
        initTokenClient(config) {
          window.googleClientConfig = { clientId: config.client_id, scope: config.scope };
          return { requestAccessToken() { config.callback(${JSON.stringify(response)}); } };
        }
      } } };
    `,
  }));
}

for (const route of ['/login', '/signup']) {
  test(`${route}: Google SDK loads once and successful sign-in reaches the dashboard`, async ({ page }) => {
    await mockGoogle(page, { access_token: 'test-google-access-token' });
    await page.route('https://www.googleapis.com/oauth2/v3/userinfo', route => route.fulfill({
      json: { email: 'listener@example.com', name: 'Google Listener' },
    }));
    let submittedToken;
    await page.route('**/api/auth/google', async route => {
      submittedToken = route.request().postDataJSON().token;
      await route.fulfill({ json: {
        token: 'test-app-token',
        user: { id: 'google-user', name: 'Google Listener', role: 'user' },
      } });
    });
    await page.route('**/api/books', route => route.fulfill({ json: { books: [] } }));
    await page.goto(route);
    await expect.poll(() => page.evaluate(() => Boolean(window.googleClientConfig))).toBe(true);
    await expect(page.locator('script[src="https://accounts.google.com/gsi/client"]')).toHaveCount(1);
    const config = await page.evaluate(() => window.googleClientConfig);
    expect(config.clientId).toMatch(/\.apps\.googleusercontent\.com$/);
    expect(config.scope).toContain('openid profile email');
    await page.getByRole('button', { name: /Sign (in|up) with Google/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: /Hi, Google/ })).toBeVisible();
    expect(submittedToken).toBe('test-google-access-token');
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBe('test-app-token');
  });

  test(`${route}: a Google authorization error does not authenticate`, async ({ page }) => {
    await mockGoogle(page, { error: 'access_denied', error_description: 'Google sign-in was cancelled' });
    let backendCalls = 0;
    await page.route('**/api/auth/google', route => {
      backendCalls++;
      return route.fulfill({ status: 500, json: {} });
    });
    await page.goto(route);
    await expect.poll(() => page.evaluate(() => Boolean(window.googleClientConfig))).toBe(true);
    await page.getByRole('button', { name: /Sign (in|up) with Google/i }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    expect(backendCalls).toBe(0);
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  });
}
