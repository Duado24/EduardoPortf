import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.PORTFOLIO_URL || 'http://localhost:5174/EduardoPortf/';
const output = process.env.JOURNEY_SCREENSHOTS || '/tmp/eduardo-journey-checks';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] });
const errors = [];
async function open(options = {}, fallback = false) {
  const context = await browser.newContext(options);
  await context.addInitScript(() => {
    const request = window.requestAnimationFrame.bind(window);
    const cancel = window.cancelAnimationFrame.bind(window);
    window.__journeyFrames = new Set();
    window.requestAnimationFrame = callback => {
      const id = request(time => { window.__journeyFrames.delete(id); callback(time); });
      window.__journeyFrames.add(id); return id;
    };
    window.cancelAnimationFrame = id => { window.__journeyFrames.delete(id); cancel(id); };
  });
  if (fallback) await context.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return type.startsWith('webgl') ? null : original.call(this, type, ...args);
    };
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(10000);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}#projects`);
  await page.waitForFunction(() => ['webgl', 'canvas'].includes(document.querySelector('.particle-stage')?.dataset.renderer));
  return { page, context };
}
async function go(page, section, wait = 2400) {
  if (!await page.locator(`.site-header a[href="#${section}"]:visible`).count()) {
    await page.getByRole('button', {name: /Menu/}).click();
  }
  await page.locator(`.site-header a[href="#${section}"]:visible`).first().click();
  if (wait) await page.waitForTimeout(wait);
}
async function settled(page, section) {
  assert.equal(await page.locator('.presentation-state').getAttribute('id'), section);
  assert.equal(await page.locator('.presentation-state').evaluate(e => e.inert), false);
  assert.equal(await page.locator('.presentation-state').evaluate(e => getComputedStyle(e).opacity), '1');
  assert.equal(await page.locator('.visual-region').evaluate(e => e.style.transform), '');
}
try {
  const { page, context } = await open({ viewport: { width: 1440, height: 900 } });
  assert.equal(await page.locator('.particle-stage').getAttribute('data-renderer'), 'webgl');
  await page.getByRole('button', {name:'Pause motion'}).click();
  await page.screenshot({ path: `${output}/projects-before.png` });
  await page.getByRole('button', {name:'Resume motion'}).click();
  for (const sequence of [ ['home','journey','home'], ['projects','journey','projects'], ['about','journey','skills'], ['contact','journey','projects'], ['journey','projects','journey','projects','journey'] ]) {
    for (const section of sequence) { await go(page, section); await settled(page, section); }
  }
  assert.equal(await page.locator('.particle-stage').count(), 1);
  assert.equal(await page.evaluate(() => window.__journeyFrames.size), 0, 'settled Journey has no animation loop');
  console.log('Desktop section sequences passed');
  for (let i = 0; i < 6; i++) {
    await page.locator('.journey-tabs button').nth(i).click();
    await page.waitForTimeout(3600);
    assert.equal(await page.locator('.journey-tabs button').nth(i).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.evaluate(() => window.__journeyFrames.size), 0, 'camera stops scheduling after arrival');
    await page.screenshot({ path: `${output}/constellation-${i}.png` });
  }
  await page.getByRole('button', {name: 'Names: English'}).click();
  assert.match(await page.locator('.journey-tabs button').nth(5).innerText(), /OSA MAYOR/i);
  await page.getByRole('button', {name: 'Reveal Inca dark constellations'}).click();
  await page.waitForTimeout(3800);
  await page.screenshot({path: `${output}/dark-llamas.png`});
  await page.getByRole('button', {name: 'Hide Inca dark constellations'}).click();

  const sky = await page.locator('.visual-region').boundingBox();
  assert.ok(sky.width >= 1440 && sky.height > 900, 'Journey covers the viewport');
  assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), 'desktop uses a single viewport');
  await page.locator('.journey-tabs button').nth(2).click();
  await page.waitForTimeout(140);
  await page.locator('.journey-tabs button').nth(5).click();
  await page.waitForTimeout(800);
  assert.match(await page.locator('.journey-card h2').innerText(), /Instructional Design/);
  await page.locator('.journey-tabs button[aria-pressed="true"]').focus();
  await page.keyboard.press('Home'); await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('.journey-tabs button').nth(1).getAttribute('aria-pressed'), 'true');
  await page.waitForTimeout(3800);
  await page.screenshot({ path: `${output}/journey-desktop.png` });
  for (const section of ['projects','home','journey','about','journey','contact','journey']) await go(page, section, 170);
  await page.setViewportSize({width:1280,height:720});
  await page.waitForTimeout(2600); await settled(page, 'journey');
  await go(page, 'projects'); await page.goBack(); await page.waitForTimeout(2500); await settled(page, 'journey');
  await page.goForward(); await page.waitForTimeout(2500); await settled(page, 'projects');
  await page.getByRole('button', {name:'Pause motion'}).click();
  await page.screenshot({ path: `${output}/projects-returned.png` });
  await page.getByRole('button', {name:'Resume motion'}).click();
  await go(page, 'journey');
  await page.getByRole('button', {name:'Pause motion'}).click();
  await go(page, 'projects', 100); await settled(page, 'projects');
  await go(page, 'journey', 100); await settled(page, 'journey');
  await page.getByRole('button', {name:'Resume motion'}).click();
  await context.close();
  console.log('Interruptions, resize, history and pause passed');
  for (const fallback of [false, true]) {
    const {page, context} = await open({viewport:{width:390,height:844},isMobile:true,hasTouch:true}, fallback);
    await go(page, 'journey'); await settled(page, 'journey');
    if (fallback) assert.equal(await page.locator('.particle-stage').getAttribute('data-renderer'), 'canvas');
    await page.locator('.journey-tabs button').nth(4).tap();
    assert.equal(await page.locator('.journey-tabs button').nth(4).getAttribute('aria-pressed'), 'true');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no mobile horizontal overflow');
    await page.waitForTimeout(800);
    assert.ok(await page.locator('.journey-card').evaluate(e => e.getBoundingClientRect().width > innerWidth * 0.8), 'mobile details stay readable');
    await page.screenshot({path:`${output}/journey-mobile${fallback ? '-canvas' : ''}.png`});
    await go(page,'projects'); await settled(page,'projects');
    await context.close();
  }
  const reduced = await open({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  await go(reduced.page, 'journey', 150); await settled(reduced.page,'journey');
  assert.equal(await reduced.page.locator('.particle-stage').getAttribute('data-renderer'),'canvas');
  assert.equal(await reduced.page.locator('.particle-stage').evaluate(e => getComputedStyle(e).transitionDuration),'0s');
  await reduced.page.getByRole('button', {name:'Enable motion'}).click();
  await reduced.page.locator('.journey-tabs button').nth(3).click();
  await reduced.page.waitForTimeout(3800);
  await reduced.context.close();
  const staticContext = await browser.newContext();
  await staticContext.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null; });
  const staticPage = await staticContext.newPage();
  staticPage.on('pageerror', error => errors.push(error.message));
  await staticPage.goto(`${base}#journey`);
  await staticPage.waitForFunction(() => document.querySelector('.particle-stage')?.dataset.rendererReason === 'unavailable');
  await staticPage.locator('.journey-tabs button').nth(3).click();
  assert.match(await staticPage.locator('.journey-card h2').innerText(), /Software Engineering/);
  await staticContext.close();
  assert.deepEqual(errors, []);
  console.log(`Journey navigation, interruptions, resize, history, keyboard, touch, pause, reduced motion and Canvas checks passed. Screenshots: ${output}`);
} finally { await browser.close(); }
