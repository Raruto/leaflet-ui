import assert from 'node:assert/strict';
import { Then, When } from '@cucumber/cucumber';

When('I drag the rotation control through {int} degrees', async function (degrees) {
  const box = await this.page.locator('.leaflet-control-rotate-toggle').boundingBox();
  assert.ok(box);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await this.page.mouse.move(x, y);
  await this.page.mouse.down();
  await this.page.mouse.move(x - degrees, y, { steps: 5 });
  await this.page.mouse.up();
});

Then('the bearing and rotation arrow are updated', async function () {
  assert.equal(await this.page.evaluate(() => map.getBearing()), 315);
  assert.equal(await this.page.locator('.leaflet-control-rotate-arrow').evaluate(element => element.style.transform), 'rotate(315deg)');
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
