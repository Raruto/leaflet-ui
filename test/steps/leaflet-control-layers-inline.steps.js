import assert from 'node:assert/strict';
import { Then, When } from '@cucumber/cucumber';

When('I zoom into satellite detail and back out', async function () {
  await this.page.evaluate(() => map.setZoom(18, { animate: false }));
  assert.equal(await this.page.evaluate(() => map._lastMapTypeId), 'satellite');
  await this.page.evaluate(() => map.setZoom(17, { animate: false }));
});

Then('the previous base layer is restored', async function () {
  assert.equal(await this.page.evaluate(() => map._lastMapTypeId), 'terrain');
});

Then('the custom provider is selected without a preset layer control', async function () {
  const state = await this.page.evaluate(() => {
    window.customBaseLayer = Object.values(map._layers).find(layer => layer.mapTypeId === 'custom');
    return {
      selected: !!customBaseLayer && map.hasLayer(customBaseLayer),
      id: map.options.mapTypeId,
      url: customBaseLayer?.getTileUrl({ x: 1, y: 2 }),
      attribution: map.attributionControl.getContainer().textContent,
      selector: !!map.controls.layers,
    };
  });
  assert.equal(state.selected, true);
  assert.equal(state.id, 'custom');
  assert.match(state.url, /\/tiles\/5\/1\/2\.png\?key=test-key$/);
  assert.match(state.attribution, /Custom attribution/);
  assert.equal(state.selector, false);
  assert.equal(await this.page.locator('.leaflet-control-layers').count(), 0);
});

Then('native layers and a native layer selector work alongside the UI', async function () {
  await this.page.evaluate(() => {
    window.customMarker = new L.Marker([41, 12]).addTo(map);
    new L.Control.Layers({ 'Custom provider': customBaseLayer }, { 'Custom marker': customMarker }, { collapsed: false }).addTo(map);
  });
  assert.equal(await this.page.locator('.leaflet-control-layers').count(), 1);
  const overlay = this.page.getByRole('checkbox', { name: 'Custom marker' });
  await overlay.uncheck();
  assert.equal(await this.page.evaluate(() => map.hasLayer(customMarker)), false);
  await overlay.check();
  assert.equal(await this.page.evaluate(() => map.hasLayer(customMarker)), true);
  assert.equal(await this.page.evaluate(() => map.hasLayer(customBaseLayer)), true);
});
