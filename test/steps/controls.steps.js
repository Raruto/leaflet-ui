import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';

async function inlineMapPage(page, baseUrl) {
  await page.route(`${baseUrl}/test/map.html?*`, route => route.fulfill({
    contentType: 'text/html',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Leaflet UI tests</title>
  <script>
    const leafletVersions = {
      '1.9.4': 'leaflet.js',
      '2.0.0-alpha.1': 'leaflet-global-src.js',
    };
    const leafletVersion = new URL(location.href).searchParams.get('leaflet') || '1.9.4';
    const leafletConfig = leafletVersions[leafletVersion];
    if (!leafletConfig) throw new Error('Unsupported Leaflet version: ' + leafletVersion);
    const leafletAssets = 'https://unpkg.com/leaflet@' + leafletVersion + '/dist/';
    document.write('<link rel="stylesheet" href="' + leafletAssets + 'leaflet.css">');
    document.write('<script src="' + leafletAssets + leafletConfig + '"><\\/script>');
    document.addEventListener('DOMContentLoaded', () => {
      const label = document.createElement('label');
      label.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:10000;background:white;color:black;padding:4px 8px;font:13px sans-serif;';
      label.append('Leaflet ');
      const select = document.createElement('select');
      select.setAttribute('aria-label', 'Leaflet version');
      for (const version of Object.keys(leafletVersions)) {
        select.add(new Option(version, version, false, version === leafletVersion));
      }
      select.addEventListener('change', () => {
        const url = new URL(location.href);
        url.searchParams.set('leaflet', select.value);
        location.assign(url);
      });
      label.append(select);
      document.body.append(label);
    });
  </script>
  <link rel="stylesheet" href="/dist/leaflet-ui.css">
</head>
<body>
  <div id="map" style="width: 600px; height: 400px;"></div>
</body>
</html>`,
  }));
}

Given('the test page {string} is open', async function (page) {
  if (page === 'map.html') await inlineMapPage(this.page, this.baseUrl);
  await this.page.goto(`${this.baseUrl}/test/${page}?sample=kept#view`);
});

When('I select Leaflet {string}', async function (version) {
  await Promise.all([
    this.page.waitForURL(url => url.searchParams.get('leaflet') === version),
    this.page.getByRole('combobox', { name: 'Leaflet version' }).selectOption(version),
  ]);
});

Then('Leaflet {string} is loaded with {int} test maps', async function (version, maps) {
  await this.page.waitForFunction(expected => (window.L || window.leaflet)?.version === expected, version);
  assert.equal(await this.page.locator(`script[src^="https://unpkg.com/leaflet@${version}/dist/"]`).count(), 1);
  assert.equal(await this.page.locator(`link[href="https://unpkg.com/leaflet@${version}/dist/leaflet.css"]`).count(), 1);
  assert.equal(await this.page.getByRole('combobox', { name: 'Leaflet version' }).inputValue(), version);
  assert.equal(await this.page.locator('.map.leaflet-container, .leaflet-map.leaflet-container').count(), maps);
  const url = new URL(this.page.url());
  assert.equal(url.searchParams.get('sample'), 'kept');
  assert.equal(url.hash, '#view');
});

async function createMap(bundle, options = {}) {
  const version = process.env.LEAFLET_VERSION === '2' ? '2.0.0-alpha.1' : '1.9.4';
  await inlineMapPage(this.page, this.baseUrl);
  await this.page.goto(`${this.baseUrl}/test/map.html?leaflet=${version}`);
  await this.page.evaluate(() => { window.originalLeaflet = window.L || window.leaflet; });
  await this.page.addScriptTag({ url: `${this.baseUrl}/dist/${bundle}` });
  await this.page.evaluate(options => {
    window.L = window.originalLeaflet;
    window.map = new L.Map('map', {
      center: [41, 12],
      zoom: 5,
      rotate: true,
      pegmanControl: false,
      includeLeafletCSS: false,
      includeLeafletUICSS: false,
      fullscreenControl: { forcePseudoFullscreen: true },
      ...options,
    });
  }, options);
}

Given('a map using {string}', async function (bundle) {
  await createMap.call(this, bundle);
});

Given('a map using {string} with options:', async function (bundle, options) {
  await createMap.call(this, bundle, JSON.parse(options));
});

Given('a map using {string} without zoom controls', async function (bundle) {
  await createMap.call(this, bundle, { zoomControl: false });
});

Then('there is one fullscreen button and no zoom buttons', async function () {
  assert.equal(await this.page.locator('.leaflet-fullscreen-icon').count(), 1);
  assert.equal(await this.page.locator('.leaflet-control-zoom-in,.leaflet-control-zoom-out').count(), 0);
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
  if (process.env.LEAFLET_VERSION === '2') {
    assert.deepEqual(await this.page.evaluate(() => ({
      mapFactory: typeof L.map,
      domHelper: typeof L.DomUtil.addClass,
    })), { mapFactory: 'undefined', domHelper: 'undefined' });
  }
});

Then('zoom buttons are visible and change the map zoom', async function () {
  const initial = await this.page.evaluate(() => map.getZoom());
  const zoomIn = this.page.getByRole('button', { name: 'Zoom in', exact: true });
  const zoomOut = this.page.getByRole('button', { name: 'Zoom out', exact: true });
  assert.equal(await zoomIn.isVisible(), true);
  assert.equal(await zoomOut.isVisible(), true);
  await zoomIn.click();
  await this.page.waitForFunction(zoom => map.getZoom() === zoom + 1 && !map._animatingZoom, initial);
  await zoomOut.click();
  await this.page.waitForFunction(zoom => map.getZoom() === zoom && !map._animatingZoom, initial);
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
    const position = new L.LatLng(41.1, 12.1);
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

When('I search for a place', async function () {
  await this.page.route('https://nominatim.openstreetmap.org/**', route => {
    const url = new URL(route.request().url());
    const callback = url.searchParams.get('json_callback');
    assert.ok(callback, 'The search request must use JSONP');
    assert.equal(url.searchParams.get('q'), 'Rome');
    return route.fulfill({
      contentType: 'application/javascript',
      body: `${callback}(${JSON.stringify([{ display_name: 'Rome, Italy', lat: '41.9', lon: '12.5' }])})`,
    });
  });
  await this.page.getByPlaceholder('Search...', { exact: true }).pressSequentially('Rome');
  await this.page.locator('.search-tip').filter({ hasText: 'Rome, Italy' }).click();
});

Then('the map moves to the search result', async function () {
  await this.page.waitForFunction(() => map.getZoom() === 10 && !map._animatingZoom && !map._panAnim?._inProgress);
  const state = await this.page.evaluate(() => ({
    center: map.getCenter(),
    marker: map.controls.search._markerSearch.getLatLng(),
    expanded: map.controls.search._container.classList.contains('search-exp'),
  }));
  assert.ok(Math.abs(state.center.lat - 41.9) < 0.001);
  assert.ok(Math.abs(state.center.lng - 12.5) < 0.001);
  assert.deepEqual(state.marker, { lat: 41.9, lng: 12.5 });
  assert.equal(state.expanded, false);
});

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

When('I zoom into satellite detail and back out', async function () {
  await this.page.evaluate(() => map.setZoom(18, { animate: false }));
  assert.equal(await this.page.evaluate(() => map._lastMapTypeId), 'satellite');
  await this.page.evaluate(() => map.setZoom(17, { animate: false }));
});

Then('the previous base layer is restored', async function () {
  assert.equal(await this.page.evaluate(() => map._lastMapTypeId), 'terrain');
});

Then('the loading indicator follows map loading events', async function () {
  await this.page.waitForFunction(() => !map.controls.loading.isLoading());
  const indicator = this.page.locator('.leaflet-control-loading');
  assert.equal(await indicator.isVisible(), false);
  await this.page.evaluate(() => map.fire('dataloading', { id: 'test-data' }));
  assert.equal(await indicator.isVisible(), true);
  await this.page.evaluate(() => map.fire('dataload', { id: 'test-data' }));
  assert.equal(await indicator.isVisible(), false);
});

Then('the edit link opens the current map position', async function () {
  await this.context.route('**/www.openstreetmap.org/edit?**', route => route.fulfill({
    contentType: 'text/html',
    body: '<title>OSM editor fixture</title>',
  }));
  const position = await this.page.evaluate(() => ({ center: map.getCenter(), zoom: map.getZoom() }));
  const [popup] = await Promise.all([
    this.page.waitForEvent('popup'),
    this.page.getByRole('link', { name: 'Edit', exact: false }).click(),
  ]);
  try {
    await popup.waitForLoadState('domcontentloaded');
    const url = new URL(popup.url());
    assert.equal(url.hostname, 'www.openstreetmap.org');
    assert.equal(url.pathname, '/edit');
    assert.equal(Number(url.searchParams.get('zoom')), position.zoom);
    assert.equal(Number(url.searchParams.get('lat')), position.center.lat);
    assert.equal(Number(url.searchParams.get('lon')), position.center.lng);
  } finally {
    await popup.close();
  }
});

When('I view the map at {int} pixels with {string} controls', async function (width, controls) {
  await this.page.setViewportSize({ width, height: 800 });
  this.touchControls = controls === 'touch';
  await this.page.evaluate(touch => {
    document.body.style.margin = '0';
    const container = map.getContainer();
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.classList.toggle('leaflet-touch', touch);
    map.invalidateSize({ animate: false });
    map.controls.layers._layerControlInputs[3].click();
  }, this.touchControls);
});

Then('the layer selector retains its pre-1.9 dimensions', async function () {
  const sizes = await this.page.locator('.leaflet-control-layers-inline').evaluate(control => {
    const box = () => {
      const rect = control.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    };
    const wrapped = box();
    const labels = [...control.querySelectorAll('.leaflet-control-layers-base label')];
    const wrappers = labels.map(label => label.firstElementChild);
    wrappers.forEach(wrapper => wrapper.replaceWith(...wrapper.childNodes));
    const legacy = box();
    labels.forEach((label, index) => {
      wrappers[index].append(...label.childNodes);
      label.append(wrappers[index]);
    });
    return { wrapped, legacy };
  });
  assert.ok(Math.abs(sizes.wrapped.width - sizes.legacy.width) < 0.1, JSON.stringify(sizes));
  assert.ok(Math.abs(sizes.wrapped.height - sizes.legacy.height) < 0.1, JSON.stringify(sizes));
  assert.equal(sizes.wrapped.height, this.touchControls ? 38 : 30);
});

Then('the footer retains its pre-1.9 typography', async function () {
  const styles = await this.page.locator('.leaflet-control-scale, .leaflet-control-attribution').evaluateAll(elements => elements.map(element => {
    const style = getComputedStyle(element);
    return { fontSize: style.fontSize, lineHeight: style.lineHeight };
  }));
  assert.equal(styles.length, 3);
  for (const style of styles) {
    assert.deepEqual(style, { fontSize: '11px', lineHeight: '16.5px' });
  }
  const attribution = this.page.locator('.leaflet-control-attribution:not(.leaflet-edit-osm)');
  assert.equal(await attribution.getByRole('link', { name: 'Leaflet', exact: true }).count(), 1);
  assert.equal(await attribution.getByRole('link', { name: 'CC-BY-SA', exact: true }).count(), 1);
});

Then('the controls fit the map and the minimap remains clickable', async function () {
  const boxes = await this.page.locator('#map > .leaflet-control-container > div > .leaflet-control').evaluateAll(elements => elements.map(element => {
    const rect = element.getBoundingClientRect();
    return { name: element.className, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
  }));
  const viewport = this.page.viewportSize();
  for (const box of boxes) {
    assert.ok(box.left >= 0 && box.top >= 0 && box.right <= viewport.width && box.bottom <= viewport.height, JSON.stringify(box));
  }
  await this.page.locator('.leaflet-control-minimap').click();
  assert.equal(await this.page.evaluate(() => map.controls.minimap._layer.mapTypeId), 'topo');
});

When('I add a second map with different UI options', async function () {
  await this.page.evaluate(() => {
    const container = document.createElement('div');
    container.id = 'second-map';
    container.style.cssText = 'width:600px;height:400px';
    document.body.append(container);
    window.secondMap = new L.Map(container, {
      center: [45, 9],
      zoom: 8,
      mapTypeId: 'topo',
      zoomControl: false,
      fullscreenControl: false,
      locateControl: false,
      searchControl: false,
      minimapControl: false,
      pegmanControl: false,
      includeLeafletCSS: false,
      includeLeafletUICSS: false,
    });
  });
});

Then('both maps keep independent layers and controls', async function () {
  const state = await this.page.evaluate(() => ({
    first: Object.values(map._layers).filter(layer => layer instanceof L.TileLayer).map(layer => layer.mapTypeId),
    second: Object.values(secondMap._layers).filter(layer => layer instanceof L.TileLayer).map(layer => layer.mapTypeId),
    firstZoom: map.getContainer().querySelectorAll('.leaflet-control-zoom-in').length,
    secondButtons: secondMap.getContainer().querySelectorAll('.leaflet-control-zoom-in,.leaflet-fullscreen-icon,.leaflet-control-search,.leaflet-control-locate,.leaflet-control-minimap').length,
    sameLayer: map.controls.layers._layers.some(first => secondMap.controls.layers._layers.some(second => first.layer === second.layer)),
  }));
  assert.deepEqual(state.first, ['streets']);
  assert.deepEqual(state.second, ['topo']);
  assert.equal(state.firstZoom, 1);
  assert.equal(state.secondButtons, 0);
  assert.equal(state.sameLayer, false);
});

Then('removing one map leaves the other usable', async function () {
  await this.page.evaluate(() => secondMap.remove());
  await this.page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await this.page.waitForFunction(() => map.getZoom() === 6 && !map._animatingZoom);
  assert.equal(await this.page.locator('#second-map .leaflet-control-container').count(), 0);
});

Then('empty translations remain empty', async function () {
  assert.equal(await this.page.evaluate(() => {
    L.registerLocale('test', { empty: '' });
    L.setLocale('test');
    return L.i18n('empty');
  }), '');
});
