import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Buffer } from 'node:buffer';

const user = { id: 'test-user', name: 'Test Listener', role: 'admin' };
const book = {
  _id: 'test-book',
  title: 'The Test Audiobook',
  authors: [{ name: 'Test Author' }],
  genres: [{ name: 'Learning' }],
  description: 'A local fixture for checking the library and player.',
  duration: 45,
  coverImage: null,
  chapters: [
    { title: 'First chapter', audioFile: 'audio/test.wav', duration: 1 },
    { title: 'Second chapter', audioFile: 'audio/test.wav', duration: 1 },
  ],
};

// A real, silent WAV lets Chromium exercise media playback without a backend.
const wav = Buffer.alloc(44 + 8000 * 45, 128);
wav.write('RIFF', 0);
wav.writeUInt32LE(wav.length - 8, 4);
wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(8000, 24);
wav.writeUInt32LE(8000, 28);
wav.writeUInt16LE(1, 32);
wav.writeUInt16LE(8, 34);
wav.write('data', 36);
wav.writeUInt32LE(wav.length - 44, 40);

test.beforeEach(async ({ page }) => {
  await page.route('https://accounts.google.com/**', route => route.abort());
  await page.route('**/api/**', route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === '/api/books') return route.fulfill({ json: { books: [book] } });
    if (pathname === '/api/books/test-book') return route.fulfill({ json: book });
    if (pathname === '/api/auth/login') return route.fulfill({ status: 400, json: { message: 'Invalid credentials' } });
    if (pathname === '/api/auth/signup') return route.fulfill({ status: 400, json: { message: 'Account already exists' } });
    return route.fulfill({ json: {} });
  });
  await page.route('**/uploads/audio/test.wav', route => route.fulfill({ contentType: 'audio/wav', body: wav }));
  await page.route('**/placeholder-book.jpg', route => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#334155"/></svg>',
  }));
  await page.addInitScript(() => {
    window.speechCalls = [];
    if (window.speechSynthesis) {
      window.speechSynthesis.speak = utterance => window.speechCalls.push(utterance.text);
    }
    // Existing users may still have the old preferences saved.
    localStorage.setItem('voiceEnabled', 'true');
    localStorage.setItem('screenReaderMode', 'true');
  });
});

async function signIn(page) {
  await page.addInitScript(value => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify(value));
  }, user);
}

async function expectSilent(page) {
  await expect(page.getByRole('button', { name: /voice feedback|screen reader|enable voice|disable voice/i })).toHaveCount(0);
  await expect(page.locator('body > [aria-live], .sr-only[aria-live]')).toHaveCount(0);
  expect(await page.evaluate(() => window.speechCalls)).toEqual([]);
}

const routes = [
  { url: '/', surface: '#root > div' },
  { url: '/login', surface: '#login-form' },
  { url: '/signup', surface: '#signup-form' },
  { url: '/dashboard', surface: '[role="listitem"]', authenticated: true },
  { url: '/admindashboard', surface: '[class*="bookCard"]', authenticated: true },
  { url: '/book/test-book', surface: '[class*="playerCard"]', authenticated: true },
];

for (const route of routes) {
  test(`${route.url}: night mode works and custom reading stays removed`, async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    if (route.authenticated) await signIn(page);
    await page.goto(route.url);
    const toggle = page.getByRole('button', { name: 'Night mode', exact: true });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    const surface = page.locator(route.surface);
    await expect(surface).toBeVisible();
    const lightColor = await surface.evaluate(element => getComputedStyle(element).backgroundColor);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveClass('dark');
    expect(await page.evaluate(() => localStorage.getItem('nightMode'))).toBe('true');
    await expect.poll(async () => {
      const color = await surface.evaluate(element => getComputedStyle(element).backgroundColor);
      return color !== lightColor && color.match(/\d+/g).slice(0, 3).map(Number).every(value => value < 70);
    }).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('night-mode.png'), fullPage: true });

    // Focus handlers used to speak. Keyboard activation must also work on player pages.
    for (let i = 0; i < 10; i++) await page.keyboard.press('Tab');
    await toggle.focus();
    await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('html')).not.toHaveClass('dark');
    await expect(surface).toHaveCSS('background-color', lightColor);
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expectSilent(page);
    expect(errors).toEqual([]);
  });
}

test('theme survives client navigation and reload, including returning to day mode', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Night mode' }).click();
  await page.getByRole('link', { name: 'Sign In', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Night mode' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: 'Sign up', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Night mode' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Night mode' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Night mode' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('html')).not.toHaveClass('dark');
});

test('saved preference overrides the operating system color scheme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Night mode' })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Night mode' }).click();
  await page.emulateMedia({ colorScheme: 'light' });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Night mode' })).toHaveAttribute('aria-pressed', 'true');
});

test('theme toggles even if saving the preference is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'nightMode') throw new DOMException('Storage blocked', 'SecurityError');
      return original.call(this, key, value);
    };
  });
  await page.goto('/login');
  const toggle = page.getByRole('button', { name: 'Night mode' });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveClass('dark');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
});

test('login and signup errors remain visible without spoken feedback', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email address/i).fill('listener@example.com');
  await page.getByLabel(/^Password/).fill('Password123!');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Invalid credentials');
  await expectSilent(page);

  await page.getByRole('link', { name: 'Sign up', exact: true }).click();
  await page.getByLabel('Full Name').fill('Test Listener');
  await page.getByLabel(/email address/i).fill('listener@example.com');
  await page.getByLabel(/^Password/).fill('Password123!');
  await page.getByLabel('Confirm Password').fill('Different123!');
  await page.getByRole('button', { name: 'Create Account', exact: true }).click();
  await expect(page.getByText('Passwords do not match')).toBeVisible();
  await page.getByLabel('Confirm Password').fill('Password123!');
  await page.getByRole('button', { name: 'Create Account', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Account already exists');
  await expectSilent(page);
});

test('audiobook playback, volume and chapters still work while changing themes', async ({ page }) => {
  await signIn(page);
  await page.goto('/book/test-book');
  const audio = page.locator('audio');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect.poll(() => audio.evaluate(element => element.readyState)).toBeGreaterThan(0);
  await expect.poll(() => audio.evaluate(element => element.paused)).toBe(false);
  const toggle = page.getByRole('button', { name: 'Night mode' });
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => audio.evaluate(element => element.paused)).toBe(false);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect.poll(() => audio.evaluate(element => element.paused)).toBe(true);
  await page.getByRole('button', { name: 'Mute', exact: true }).click();
  await expect.poll(() => audio.evaluate(element => element.volume)).toBe(0);
  await page.getByRole('button', { name: 'Unmute', exact: true }).click();
  await expect.poll(() => audio.evaluate(element => element.volume)).toBeGreaterThan(0);
  await page.getByRole('button', { name: /Playback speed:/ }).click();
  await expect.poll(() => audio.evaluate(element => element.playbackRate)).toBe(1.25);
  await page.getByRole('button', { name: 'Select chapter' }).click();
  await page.getByRole('option', { name: /Second chapter/ }).click();
  await expect(page.getByText('Chapter 2 of 2')).toBeVisible();
  await expect.poll(() => audio.evaluate(element => element.paused)).toBe(false);
  await expectSilent(page);
});

test('admin forms and existing visual accessibility controls support night mode', async ({ page }) => {
  await signIn(page);
  await page.goto('/admindashboard');
  await page.getByRole('button', { name: 'Night mode' }).click();
  await page.getByRole('button', { name: 'Add New', exact: true }).click();
  await expect(page.getByPlaceholder('Enter book title')).toBeVisible();
  const inputColor = await page.getByPlaceholder('Enter book title').evaluate(element => getComputedStyle(element).backgroundColor);
  expect(inputColor.match(/\d+/g).slice(0, 3).map(Number).every(value => value < 70)).toBe(true);
  await page.goto('/signup');
  await page.getByRole('button', { name: 'Toggle high contrast' }).click();
  await page.getByRole('button', { name: 'Enable large text' }).click();
  await expect(page.locator('body')).toHaveClass(/high-contrast/);
  await expect(page.locator('body')).toHaveClass(/large-text/);
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await page.getByRole('button', { name: 'Night mode' }).click();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expectSilent(page);
});

test('production source no longer contains the custom speech implementation', () => {
  const root = path.resolve('src');
  const files = readdirSync(root, { recursive: true }).filter(file => /\.(jsx?|css)$/.test(file));
  for (const file of files) {
    expect(readFileSync(path.join(root, file), 'utf8'), file).not.toMatch(/speechSynthesis|SpeechSynthesisUtterance|voiceEnabled|screenReaderMode|toggleVoiceEnabled|\bspeak\(|\bannounce\(/);
  }
});
