import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
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
  if (this.bundledImport) {
    await this.page.route(`${this.baseUrl}/dist/${bundle}`, route => route.fulfill({
      contentType: 'application/javascript',
      body: this.bundledImport,
    }));
  }
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

Given('a map importing the browser bundle {string} through a bundler', async function (bundle) {
  const result = await build({
    absWorkingDir: fileURLToPath(new URL('../../', import.meta.url)),
    stdin: { contents: `import './dist/${bundle}';`, resolveDir: fileURLToPath(new URL('../../', import.meta.url)) },
    bundle: true,
    platform: 'browser',
    format: 'iife',
    write: false,
  });
  this.bundledImport = result.outputFiles[0].text;
  await createMap.call(this, bundle);
});

Given('a map using {string} with options:', async function (bundle, options) {
  await createMap.call(this, bundle, JSON.parse(options));
});

Given('a map using {string} without zoom controls', async function (bundle) {
  await createMap.call(this, bundle, { zoomControl: false });
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

Then('no preset controls or base layers are added', async function () {
  const state = await this.page.evaluate(() => ({
    controls: map.controls,
    layers: Object.values(map._layers).filter(layer => layer instanceof L.TileLayer).length,
    dom: map.getContainer().querySelectorAll('.leaflet-control').length,
  }));
  assert.deepEqual(state, { controls: undefined, layers: 0, dom: 0 });
});

Then('only the attribution control remains and handlers are disabled', async function () {
  const state = await this.page.evaluate(() => ({
    controls: Object.keys(map.controls),
    dom: map.getContainer().querySelectorAll('.leaflet-control').length,
    gestures: map.gestureHandling.enabled(),
    feedback: map.visualClick.enabled(),
  }));
  assert.deepEqual(state, { controls: ['attribution'], dom: 1, gestures: false, feedback: false });
});

Then('the selected fallback layer and custom options are applied', async function () {
  const state = await this.page.evaluate(() => ({
    type: map.options.mapTypeId,
    zoom: map.controls.zoom.getPosition(),
    search: map.controls.search.options.url,
    apiKey: map.options.mapTypes.terrain.options.apikey,
    tile: map.controls.layers._layers[0].layer.getTileUrl({ x: 1, y: 1 }),
  }));
  assert.equal(state.type, 'terrain');
  assert.equal(state.zoom, 'topleft');
  assert.match(state.search, /accept-language=it&/);
  assert.equal(state.apiKey, 'first-map-test-key');
  assert.match(state.tile, /apikey=first-map-test-key/);
});

Then('a new map keeps the original default options', async function () {
  const state = await this.page.evaluate(() => {
    const container = document.createElement('div');
    container.style.cssText = 'width:600px;height:400px';
    document.body.append(container);
    const other = new L.Map(container, {
      center: [41, 12], zoom: 5, pegmanControl: false,
      includeLeafletCSS: false, includeLeafletUICSS: false,
    });
    const result = {
      zoom: other.controls.zoom.getPosition(),
      apiKey: other.options.mapTypes.terrain.options.apikey,
      url: other.options.mapTypes.terrain.url,
      search: other.controls.search.options.url,
      layers: other.options.mapTypeIds,
    };
    other.remove();
    container.remove();
    return result;
  });
  assert.equal(state.zoom, 'bottomright');
  assert.equal(state.apiKey, undefined);
  assert.doesNotMatch(state.url, /apikey=/);
  assert.match(state.search, /accept-language=en-US&/);
  assert.deepEqual(state.layers, ['streets', 'terrain', 'satellite', 'topo']);
});

Given('custom plugin assets are available', async function () {
  await this.page.route(`${this.baseUrl}/regression-plugin.js`, route => route.fulfill({
    contentType: 'application/javascript',
    body: 'window.regressionPluginLoaded = true;',
  }));
  await this.page.route(`${this.baseUrl}/regression-plugin.css`, route => route.fulfill({
    contentType: 'text/css',
    body: '#map { --regression-plugin: loaded; }',
  }));
});

Then('custom JavaScript and CSS load without additional core stylesheets', async function () {
  await this.page.waitForFunction(() => window.regressionPluginLoaded &&
    getComputedStyle(map.getContainer()).getPropertyValue('--regression-plugin').trim() === 'loaded');
  const stylesheets = await this.page.locator('link[rel="stylesheet"]').evaluateAll(links => links.map(link => new URL(link.href).pathname));
  assert.equal(stylesheets.filter(path => path.endsWith('/leaflet.css')).length, 1);
  assert.equal(stylesheets.filter(path => path.endsWith('/leaflet-ui.css')).length, 1);
  assert.equal(stylesheets.filter(path => path.endsWith('/regression-plugin.css')).length, 1);
  assert.equal(await this.page.evaluate(() => map.options.plugins.length), 2);
});

import assert from 'node:assert/strict';
import { Then } from '@cucumber/cucumber';

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

Then('the scale updates with zoom and zoom buttons respect limits', async function () {
  const original = await this.page.locator('.leaflet-control-scale-line').innerText();
  await this.page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await this.page.waitForFunction(() => map.getZoom() === 6 && !map._animatingZoom);
  assert.notEqual(await this.page.locator('.leaflet-control-scale-line').innerText(), original);
  assert.equal(await this.page.getByRole('button', { name: 'Zoom in', exact: true }).getAttribute('aria-disabled'), 'true');
  await this.page.evaluate(() => map.setZoom(4, { animate: false }));
  assert.equal(await this.page.getByRole('button', { name: 'Zoom out', exact: true }).getAttribute('aria-disabled'), 'true');
  await this.page.getByRole('button', { name: 'Zoom out', exact: true }).click({ force: true });
  assert.equal(await this.page.evaluate(() => map.getZoom()), 4);
});
