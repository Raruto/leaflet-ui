import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';

Given('a map using {string}', async function (bundle) {
  await this.page.goto(`${this.baseUrl}/test/fixtures/map.html`);
  await this.page.evaluate(() => { window.originalLeaflet = L; });
  await this.page.addScriptTag({ url: `${this.baseUrl}/dist/${bundle}` });
  await this.page.evaluate(() => {
    window.map = L.map('map', {
      center: [41, 12],
      zoom: 5,
      rotate: true,
      pegmanControl: false,
      includeLeafletCSS: false,
      includeLeafletUICSS: false,
      fullscreenControl: { forcePseudoFullscreen: true },
    });
  });
});

Then("the UI controls use the page's Leaflet", async function () {
  const state = await this.page.evaluate(() => ({
    sameLeaflet: L === window.originalLeaflet,
    controls: Object.keys(map.controls),
    locateFactory: L.control.locate() instanceof L.Control.Locate,
    fullscreenFactory: L.control.fullscreen() instanceof L.Control.FullScreen,
    fullscreenButtons: map.getContainer().querySelectorAll('.leaflet-fullscreen-icon').length,
    gestures: map.gestureHandling.enabled(),
  }));
  assert.equal(state.sameLeaflet, true);
  assert.deepEqual(state.controls, [
    'layers', 'attribution', 'editInOSM', 'scale', 'zoom', 'rotate',
    'locate', 'search', 'loading', 'fullscreen', 'minimap',
  ]);
  assert.equal(state.locateFactory, true);
  assert.equal(state.fullscreenFactory, true);
  assert.equal(state.fullscreenButtons, 1);
  assert.equal(state.gestures, true);
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

When('I rotate the map, open search and locate a position', async function () {
  this.state = await this.page.evaluate(() => {
    map.setBearing(40);
    map.controls.search.expand();
    const position = L.latLng(41.1, 12.1);
    // Simulate geolocation without requesting device permissions.
    map.locate = () => map;
    map.stopLocate = () => map;
    map.controls.locate.start();
    map.fire('locationfound', { latlng: position, bounds: position.toBounds(30), accuracy: 15 });
    return {
      bearing: map.getBearing(),
      searchExpanded: map.controls.search._container.classList.contains('search-exp'),
      position: map.controls.locate._marker.getLatLng(),
    };
  });
});

Then('rotation, search and location are updated', function () {
  assert.equal(this.state.bearing, 40);
  assert.equal(this.state.searchExpanded, true);
  assert.deepEqual(this.state.position, { lat: 41.1, lng: 12.1 });
});

Then('empty translations remain empty', async function () {
  assert.equal(await this.page.evaluate(() => {
    L.registerLocale('test', { empty: '' });
    L.setLocale('test');
    return L.i18n('empty');
  }), '');
});
