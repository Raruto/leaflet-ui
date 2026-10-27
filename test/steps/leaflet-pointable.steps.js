import assert from 'node:assert/strict';
import { Then, When } from '@cucumber/cucumber';

When('I add a pointable canvas overlay', async function () {
  await this.page.waitForFunction(() => map._pointableLayers);
  await this.page.evaluate(() => {
    window.pointableClicks = 0;
    map.on('pointable_mouseclick', () => pointableClicks++);
    const Overlay = L.GridLayer.extend({
      createTile() {
        const tile = document.createElement('canvas');
        tile.width = tile.height = 256;
        const context = tile.getContext('2d');
        context.fillStyle = '#008800';
        context.fillRect(0, 0, 128, 256);
        return tile;
      },
    });
    window.overlay = new Overlay({ pointable: true }).addTo(map);
  });
});

Then('opaque pixels are clickable and transparent pixels are not', async function () {
  const points = await this.page.evaluate(() => {
    for (const tile of Object.values(overlay._tiles)) {
      const rect = tile.el.getBoundingClientRect();
      if (rect.left > 20 && rect.right < 580 && rect.top < 250 && rect.bottom > 160) {
        return { opaque: { x: rect.left + 60, y: 180 }, transparent: { x: rect.left + 190, y: 180 } };
      }
    }
    throw new Error('No visible canvas tile available for pixel checks');
  });
  for (const [kind, point] of Object.entries(points)) {
    await this.page.mouse.move(point.x, point.y);
    await this.page.mouse.move(point.x + 1, point.y);
    assert.equal(await this.page.evaluate(() => map.isPointablePixel()), kind === 'opaque');
    assert.equal(await this.page.locator('#map').evaluate(element => element.style.cursor), kind === 'opaque' ? 'pointer' : '');
    await this.page.mouse.click(point.x + 1, point.y);
  }
  assert.equal(await this.page.evaluate(() => pointableClicks), 1);
});

Then('removing the overlay unregisters it', async function () {
  assert.equal(await this.page.evaluate(() => Object.keys(map._pointableLayers).length), 1);
  await this.page.evaluate(() => overlay.remove());
  assert.equal(await this.page.evaluate(() => Object.keys(map._pointableLayers).length), 0);
  await this.page.mouse.move(300, 180);
  assert.equal(await this.page.evaluate(() => map.isPointablePixel()), false);
});

Then('custom plugin scripts are shared between maps', async function () {
  const state = await this.page.evaluate(async () => {
    const container = document.createElement('div');
    container.style.cssText = 'width:300px;height:200px';
    document.body.append(container);
    const other = new L.Map(container, {
      center: [41, 12], zoom: 5,
      pegmanControl: false, minimapControl: false,
      includeLeafletCSS: false, includeLeafletUICSS: false,
      plugins: ['/node_modules/leaflet-pointable/leaflet-pointable.js'],
    });
    await new Promise(resolve => other.once('plugins_loaded', resolve));
    const result = {
      scripts: document.querySelectorAll('script[src$="/node_modules/leaflet-pointable/leaflet-pointable.js"]').length,
      independent: !!other._pointableLayers && other._pointableLayers !== map._pointableLayers,
    };
    other.remove();
    container.remove();
    return result;
  });
  assert.deepEqual(state, { scripts: 1, independent: true });
});
