import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const url = process.argv[2];
if (!url) {
  throw new Error('Usage: node scripts/desktop_smoke.js <url>');
}

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.log('Playwright not installed; skipping browser DOM smoke test.');
  process.exit(0);
}

const distFontsDir = path.resolve('dist/assets');
if (!fs.existsSync(distFontsDir)) {
  throw new Error('dist/assets missing after build');
}

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl'],
});

const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

const pageErrors = [];
page.on('pageerror', (err) => pageErrors.push(err.message));

const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    consoleErrors.push(msg.text());
  }
});

await page.goto(url, { waitUntil: 'networkidle' });

const title = await page.title();
if (!title.includes('Пирожковый Двор')) {
  throw new Error(`Unexpected title: ${title}`);
}

const heading = await page.locator('h1').first().textContent();
if (!heading?.includes('Пирожковый Двор 3D')) {
  throw new Error(`Unexpected h1: ${heading}`);
}

await page.getByRole('button', { name: 'Смена (120 сек)' }).click();
await page.getByRole('button', { name: 'Свободный мир' }).click();
await page.getByRole('button', { name: 'Начать игру' }).click();
await page.waitForTimeout(400);

const finishBtn = page.getByRole('button', { name: 'Завершить' });
await finishBtn.click();
await page.waitForTimeout(300);

const gameOverHeading = await page.getByText('Игра завершена').isVisible();
if (!gameOverHeading) {
  throw new Error('Expected game over overlay to appear');
}

await page.getByRole('button', { name: 'В главное меню' }).click();
await page.waitForTimeout(200);

if (pageErrors.length > 0) {
  throw new Error(`Uncaught page errors: ${pageErrors.join(' | ')}`);
}

const nonWebglErrors = consoleErrors.filter((e) => !/WebGL|YouTube|youtube/i.test(e));
if (nonWebglErrors.length > 0) {
  throw new Error(`Console errors: ${nonWebglErrors.join(' | ')}`);
}

await browser.close();
console.log('Desktop UI smoke check passed.');
