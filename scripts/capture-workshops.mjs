// Runs on the GitHub Actions Ubuntu runner, with its own Chromium/SwiftShader.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve('artifacts/workshop-review');
await mkdir(output, { recursive: true });
const server = spawn('npm', ['run', 'preview', '--', '--port', '4173', '--strictPort'], {
  stdio: 'pipe', env: process.env, detached: true,
});
let serverLog = '';
server.stdout.on('data', data => { serverLog += String(data); });
server.stderr.on('data', data => { serverLog += String(data); });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const base = 'http://127.0.0.1:4173/';
const variants = ['citrus', 'burgundy', 'blackgold'];
const stations = ['overview', 'front', 'back', 'top', 'lathe', 'rack'];
const issues = [], captures = [];
let browser;

try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(base)).ok) { ready = true; break; } } catch {}
    await pause(500);
  }
  if (!ready) throw Error('Vite preview did not start: ' + serverLog);
  browser = await chromium.launch({ headless: true, args: [
    '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader', '--disable-dev-shm-usage',
  ] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const watch = page => {
    page.on('pageerror', error => issues.push(error.message));
    page.on('console', message => { if (message.type() === 'error') issues.push(message.text()); });
  };
  watch(page);
  const capture = async (page, name) => {
    const bytes = await page.screenshot({ path: resolve(output, name + '.png'), animations: 'disabled' });
    if (bytes.length < 12000) throw Error('Blank or incomplete screenshot: ' + name);
    captures.push(name);
    console.log('Captured', name, bytes.length);
  };
  for (const variant of variants) {
    await page.goto(base + '?room=workshop-' + variant + '&capture=1', { waitUntil: 'networkidle' });
    await page.locator('canvas').first().waitFor({ state: 'visible' });
    await page.locator('#loader').waitFor({ state: 'detached' });
    for (const station of stations) {
      // The inspection buttons intentionally remain hidden from the player.
      await page.evaluate(id => document.querySelector('#workshop-camera-review [data-station="' + id + '"]').click(), station);
      await page.waitForTimeout(350);
      await capture(page, variant + '-' + station);
    }
  }

  // Verify the actual room selector and default inspection mode, outside capture mode.
  await page.goto(base + '?room=workshop-citrus', { waitUntil: 'networkidle' });
  await page.locator('#loader').waitFor({ state: 'detached' });
  if (await page.locator('#workshop-camera-review').count()) throw Error('QA toolbar leaked into regular UI');
  if (!await page.getByRole('button', { name: '工作台', exact: true }).isVisible()) throw Error('Workbench inspection mode missing');
  if (await page.locator('#hud').isVisible()) throw Error('Character HUD shown in inspection mode');
  for (const variant of variants) {
    await page.getByRole('combobox', { name: '选择房间' }).selectOption('workshop-' + variant);
    await page.locator('#loader').waitFor({ state: 'detached' });
    if (!page.url().includes('room=workshop-' + variant)) throw Error('Room selector failed');
  }
  await page.getByRole('button', { name: '夜间', exact: true }).click();
  if (await page.getByRole('button', { name: '夜间', exact: true }).getAttribute('aria-pressed') !== 'true') {
    throw Error('Night control did not toggle');
  }
  await page.waitForTimeout(800);
  await capture(page, 'blackgold-night-ui');
  await page.getByRole('button', { name: '行走', exact: true }).click();
  if (!await page.locator('#hud').isVisible()) throw Error('Walk mode failed');

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  watch(mobile);
  for (const variant of variants) {
    await mobile.goto(base + '?room=workshop-' + variant, { waitUntil: 'networkidle' });
    await mobile.locator('#loader').waitFor({ state: 'detached' });
    if (!await mobile.locator('#camera-joystick').isVisible()) throw Error('Mobile orbit control missing');
    await capture(mobile, variant + '-mobile');
  }
  await writeFile(resolve(output, 'report.json'), JSON.stringify({
    commit: process.env.GITHUB_SHA ?? null, variants, stations, captures, issues,
  }, null, 2));
  if (issues.length) throw Error('Browser errors: ' + issues.join('; '));
} finally {
  await browser?.close();
  try { if (server.pid) process.kill(-server.pid, 'SIGTERM'); } catch {}
  server.stdout.destroy();
  server.stderr.destroy();
}
