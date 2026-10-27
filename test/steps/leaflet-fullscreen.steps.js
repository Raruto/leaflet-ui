import assert from 'node:assert/strict';
import { Then, When } from '@cucumber/cucumber';

Then('there is one fullscreen button and no zoom buttons', async function () {
  assert.equal(await this.page.locator('.leaflet-fullscreen-icon').count(), 1);
  assert.equal(await this.page.locator('.leaflet-control-zoom-in,.leaflet-control-zoom-out').count(), 0);
});

When('I enter and exit fullscreen', async function () {
  await this.page.getByRole('button', { name: 'Enter Fullscreen', exact: true }).click();
  assert.equal(await this.page.evaluate(() => map._isFullscreen), true);
  await this.page.getByRole('button', { name: 'Exit Fullscreen', exact: true }).click();
});

Then('the map has left fullscreen', async function () {
  assert.equal(await this.page.evaluate(() => map._isFullscreen), false);
  assert.equal(await this.page.locator('#map').evaluate(element => element.classList.contains('leaflet-pseudo-fullscreen')), false);
});

Then('native fullscreen can be entered and exited', async function () {
  const container = this.page.locator('#map');
  const initial = await container.boundingBox();
  await this.page.getByRole('button', { name: 'Enter Fullscreen', exact: true }).click();
  await this.page.waitForFunction(() => document.fullscreenElement === map.getContainer() && map._isFullscreen);
  assert.equal(await this.page.getByRole('button', { name: 'Exit Fullscreen', exact: true }).getAttribute('aria-pressed'), 'true');
  await this.page.getByRole('button', { name: 'Exit Fullscreen', exact: true }).click();
  await this.page.waitForFunction(() => !document.fullscreenElement && !map._isFullscreen);
  assert.equal(await this.page.getByRole('button', { name: 'Enter Fullscreen', exact: true }).getAttribute('aria-pressed'), 'false');
  assert.deepEqual(await container.boundingBox(), initial);
});
