import assert from 'node:assert/strict';
import { Given, Then } from '@cucumber/cucumber';

Then('scrolling without a modifier warns without zooming', async function () {
  this.gestureZoom = await this.page.evaluate(() => map.getZoom());
  await this.page.mouse.move(300, 180);
  await this.page.mouse.wheel(0, -180);
  await this.page.waitForFunction(() => map.getContainer().classList.contains('leaflet-gesture-handling-warning'));
  assert.equal(await this.page.evaluate(() => map.getZoom()), this.gestureZoom);
  assert.equal(await this.page.evaluate(() => map.scrollWheelZoom.enabled()), false);
  await this.page.waitForFunction(() => !map.getContainer().classList.contains('leaflet-gesture-handling-warning'));
});

Then('control-scroll zooms the map', async function () {
  await this.page.keyboard.down('Control');
  try {
    await this.page.mouse.wheel(0, -180);
    await this.page.waitForFunction(zoom => map.getZoom() > zoom && !map._animatingZoom, this.gestureZoom);
  } finally {
    await this.page.keyboard.up('Control');
  }
});

Then('fullscreen suspends gestures and restores them on exit', async function () {
  await this.page.getByRole('button', { name: 'Enter Fullscreen', exact: true }).click();
  assert.equal(await this.page.evaluate(() => map.gestureHandling.enabled()), false);
  await this.page.getByRole('button', { name: 'Exit Fullscreen', exact: true }).click();
  assert.equal(await this.page.evaluate(() => map.gestureHandling.enabled()), true);
});

Then('disabling gesture handling removes the warning behavior', async function () {
  await this.page.evaluate(() => map.gestureHandling.disable());
  const zoom = await this.page.evaluate(() => map.getZoom());
  await this.page.mouse.move(300, 180);
  await this.page.mouse.wheel(0, 180);
  await this.page.waitForFunction(zoom => map.getZoom() < zoom && !map._animatingZoom, zoom);
  assert.equal(await this.page.locator('#map').evaluate(element => element.classList.contains('leaflet-gesture-handling')), false);
});

Then('one finger warns and two fingers permit map dragging', async function () {
  this.touchSession = await this.context.newCDPSession(this.page);
  await this.touchSession.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await this.touchSession.send('Input.dispatchTouchEvent', {
    type: 'touchStart', touchPoints: [{ x: 260, y: 180, id: 1 }],
  });
  await this.page.waitForFunction(() => map.getContainer().classList.contains('leaflet-gesture-handling-touch'));
  assert.equal(await this.page.evaluate(() => map.dragging.enabled()), false);
  await this.touchSession.send('Input.dispatchTouchEvent', {
    type: 'touchStart', touchPoints: [{ x: 260, y: 180, id: 1 }, { x: 340, y: 180, id: 2 }],
  });
  await this.page.waitForFunction(() => map.dragging.enabled());
  await this.touchSession.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await this.page.waitForFunction(() => !map.getContainer().classList.contains('leaflet-gesture-handling-warning'));
});

Then('touches on controls do not show gesture warnings', async function () {
  const box = await this.page.getByRole('button', { name: 'Zoom in', exact: true }).boundingBox();
  await this.touchSession.send('Input.dispatchTouchEvent', {
    type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }],
  });
  assert.equal(await this.page.evaluate(() => map.getContainer().classList.contains('leaflet-gesture-handling-warning')), false);
  await this.touchSession.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await this.touchSession.detach();
});

Given('locale requests are recorded', async function () {
  this.localeResponses = [];
  this.page.on('response', response => {
    if (response.url().includes('/dist/locales/')) {
      this.localeResponses.push({ file: new URL(response.url()).pathname.split('/').pop(), status: response.status() });
    }
  });
});

Then('gesture warnings use the shipped {string} translation', async function (language) {
  const { default: translation } = await import(`../../node_modules/@raruto/leaflet-gesture-handling/dist/locales/${language}.js`);
  await this.page.waitForFunction(() => map.getContainer().hasAttribute('data-gesture-handling-scroll-content'));
  const state = await this.page.evaluate(() => ({
    touch: map.getContainer().getAttribute('data-gesture-handling-touch-content'),
    scroll: map.getContainer().getAttribute('data-gesture-handling-scroll-content'),
    mac: navigator.platform.toUpperCase().includes('MAC'),
  }));
  assert.equal(state.touch, translation.touch);
  assert.equal(state.scroll, state.mac ? translation.scrollMac : translation.scroll);
  await this.page.mouse.move(300, 180);
  await this.page.mouse.wheel(0, -180);
  await this.page.waitForFunction(() => map.getContainer().classList.contains('leaflet-gesture-handling-warning'));
  assert.equal(await this.page.evaluate(() => map.getZoom()), 5);
});

Then('locale {string} falls back to {string}', async function (locale, fallback) {
  assert.ok(this.localeResponses.some(response => response.file === `${locale}.js` && response.status === 404),
    `Expected an unavailable regional locale: ${locale}`);
  assert.ok(this.localeResponses.some(response => response.file === `${fallback}.js` && response.status === (fallback === 'zz' ? 404 : 200)),
    `Expected fallback request: ${fallback}`);
});

Then('locale {string} loads without a missing-file response', async function (locale) {
  assert.ok(this.localeResponses.some(response => response.file === `${locale}.js` && response.status === 200),
    `Expected the shipped regional locale: ${locale}`);
  assert.ok(this.localeResponses.every(response => response.status === 200), JSON.stringify(this.localeResponses));
});

Then('gesture warnings expire after the configured {int} milliseconds', async function (duration) {
  assert.equal(await this.page.evaluate(() => map.options.gestureHandlingOptions.duration), duration);
  await this.page.evaluate(() => {
    window.warningTiming = {};
    const container = map.getContainer();
    window.warningObserver = new MutationObserver(() => {
      const active = container.classList.contains('leaflet-gesture-handling-warning');
      if (active && !warningTiming.start) warningTiming.start = performance.now();
      if (!active && warningTiming.start) {
        warningTiming.elapsed = performance.now() - warningTiming.start;
        warningObserver.disconnect();
      }
    });
    warningObserver.observe(container, { attributes: true, attributeFilter: ['class'] });
  });
  await this.page.mouse.move(300, 180);
  await this.page.mouse.wheel(0, -180);
  await this.page.waitForFunction(() => warningTiming.elapsed !== undefined);
  const elapsed = await this.page.evaluate(() => warningTiming.elapsed);
  assert.ok(elapsed >= duration - 100 && elapsed < duration + 500,
    `Expected approximately ${duration}ms, got ${elapsed}ms`);
});
