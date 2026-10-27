import assert from 'node:assert/strict';
import { Then, When } from '@cucumber/cucumber';

async function dragHandle(page, dx, dy) {
  const box = await page.locator('.leaflet-control-resizer').boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy, { steps: 5 });
  await page.mouse.up();
}

When('I drag the resize handle by {int} pixels horizontally and {int} vertically', async function (dx, dy) {
  this.resizeState = await this.page.evaluate(() => {
    window.resizeEvents = [];
    map.controls.resizer.on('dragstart dragend', event => resizeEvents.push(event.type));
    return { size: map.getSize(), topLeft: map.containerPointToLatLng([0, 0]) };
  });
  await dragHandle(this.page, dx, dy);
});

Then('the map grows by {int} pixels horizontally and {int} vertically', async function (dx, dy) {
  const state = await this.page.evaluate(() => ({
    size: map.getSize(),
    width: map.getContainer().clientWidth,
    height: map.getContainer().clientHeight,
    topLeft: map.containerPointToLatLng([0, 0]),
    events: resizeEvents,
  }));
  assert.equal(state.size.x, this.resizeState.size.x + dx);
  assert.equal(state.size.y, this.resizeState.size.y + dy);
  assert.equal(state.width, state.size.x);
  assert.equal(state.height, state.size.y);
  assert.deepEqual(state.topLeft, this.resizeState.topLeft);
  assert.deepEqual(state.events, ['dragstart', 'dragend']);
});

Then('disabling the resizer prevents further resizing', async function () {
  const size = await this.page.evaluate(() => {
    map.controls.resizer.disable();
    return map.getSize();
  });
  await dragHandle(this.page, 20, 20);
  assert.deepEqual(await this.page.evaluate(() => map.getSize()), size);
});
