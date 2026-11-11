import assert from 'node:assert/strict';
import { Then, When } from '@cucumber/cucumber';

When('I switch base layers and click the minimap', async function () {
  await this.page.evaluate(() => {
    map.controls.locate.stop();
    map.setBearing(0);
  });
  await this.page.locator('.leaflet-control-layers-base label').filter({ hasText: 'Terrain' }).click();
  assert.equal(await this.page.evaluate(() => map._lastMapTypeId), 'terrain');
  await this.page.locator('.leaflet-control-layers-base label').filter({ hasText: 'Satellite' }).click();
  assert.equal(await this.page.evaluate(() => map.controls.minimap._layer.mapTypeId), 'terrain');
  await this.page.locator('.leaflet-control-minimap').click();
});

Then('the base layer, minimap and attribution stay synchronized', async function () {
  const state = await this.page.evaluate(() => ({
    active: Object.values(map.controls.minimap._mainMapBaseLayers).filter(layer => map.hasLayer(layer)).map(layer => layer.mapTypeId),
    checked: map.controls.layers._layerControlInputs instanceof Map
      ? [...map.controls.layers._layerControlInputs].filter(([input]) => input.checked).map(([, layer]) => layer.mapTypeId)
      : map.controls.layers._layerControlInputs.filter(input => input.checked).map(input => map.controls.layers._getLayer(input.layerId).layer.mapTypeId),
    mini: map.controls.minimap._layer.mapTypeId,
    attribution: map.controls.attribution.getContainer().innerText,
  }));
  assert.deepEqual(state.active, ['terrain']);
  assert.deepEqual(state.checked, ['terrain']);
  assert.equal(state.mini, 'satellite');
  assert.match(state.attribution, /Thunderforest/);
  assert.match(state.attribution, /OpenStreetMap/);
  assert.doesNotMatch(state.attribution, /Esri/);
});

Then('minimap toggle events work without 3D support', async function () {
  const events = await this.page.evaluate(async () => {
    const mini = map.controls.minimap;
    const previousBrowser = L.Browser;
    L.Browser = { ...previousBrowser, any3d: false };
    try {
      return await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Minimap toggle event not received')), 2000);
        mini.once('toggle', event => {
          clearTimeout(timeout);
          resolve({ minimized: event.minimized });
        });
        mini._minimize();
      });
    } finally {
      L.Browser = previousBrowser;
    }
  });
  assert.deepEqual(events, { minimized: true });
});
