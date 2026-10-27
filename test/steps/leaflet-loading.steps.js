import assert from 'node:assert/strict';
import { Then } from '@cucumber/cucumber';

Then('the loading indicator follows map loading events', async function () {
  await this.page.waitForFunction(() => !map.controls.loading.isLoading());
  const indicator = this.page.locator('.leaflet-control-loading');
  assert.equal(await indicator.isVisible(), false);
  await this.page.evaluate(() => map.fire('dataloading', { id: 'test-data' }));
  assert.equal(await indicator.isVisible(), true);
  await this.page.evaluate(() => map.fire('dataload', { id: 'test-data' }));
  assert.equal(await indicator.isVisible(), false);
});
