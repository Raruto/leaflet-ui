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
    checked: [...map.controls.layers._layerControlInputs].filter(input => input.checked).map(input => map.controls.layers._getLayer(input.layerId).layer.mapTypeId),
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
