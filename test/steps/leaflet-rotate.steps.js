import assert from 'node:assert/strict';
import { Then, When } from '@cucumber/cucumber';

When('I drag the rotation control left by {int} pixels', async function (pixels) {
  const box = await this.page.locator('.leaflet-control-rotate-toggle').boundingBox();
  assert.ok(box);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await this.page.mouse.move(x, y);
  await this.page.mouse.down();
  await this.page.mouse.move(x - pixels, y, { steps: 5 });
  await this.page.mouse.up();
});

Then('the bearing is {int} degrees and the rotation arrow is updated', async function (degrees) {
  const bearing = await this.page.evaluate(() => map.getBearing());
  assert.ok(Math.abs(bearing - degrees) < 1e-9, `Expected ${degrees} degrees, got ${bearing}`);
  assert.equal(await this.page.locator('.leaflet-control-rotate-arrow').evaluate(element => element.style.transform), `rotate(${degrees}deg)`);
  assert.equal(await this.page.locator('.leaflet-control-rotate').isVisible(), true);
});

Then('rotated map coordinates round-trip correctly', async function () {
  const state = await this.page.evaluate(() => {
    const position = new L.LatLng(41.1, 12.1);
    const screen = map.latLngToContainerPoint(position);
    const restored = map.containerPointToLatLng(screen);
    return { position, restored };
  });
  assert.ok(Math.abs(state.position.lat - state.restored.lat) < 0.05);
  assert.ok(Math.abs(state.position.lng - state.restored.lng) < 0.05);
});
