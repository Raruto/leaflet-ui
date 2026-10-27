import assert from 'node:assert/strict';
import { Then } from '@cucumber/cucumber';

Then('map clicks and context clicks show feedback that disappears', async function () {
  const markers = this.page.locator('.leaflet-visualclick-icon,.leaflet-visualclick-icon-touch');
  for (const button of ['left', 'right']) {
    await this.page.mouse.click(300, 180, { button });
    await markers.first().waitFor({ state: 'attached' });
    assert.equal(await markers.count(), 1);
    assert.equal(await markers.evaluate(element => getComputedStyle(element).pointerEvents), 'none');
    assert.match(await markers.evaluate(element => getComputedStyle(element, '::after').animationName), /visualclick-pulsate/);
    await markers.waitFor({ state: 'detached' });
  }
});

Then('control clicks and disabled visual feedback create no marker', async function () {
  const markers = this.page.locator('.leaflet-visualclick-icon,.leaflet-visualclick-icon-touch');
  await this.page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  assert.equal(await markers.count(), 0);
  await this.page.evaluate(() => map.visualClick.disable());
  await this.page.mouse.click(300, 180);
  assert.equal(await markers.count(), 0);
});
