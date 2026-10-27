import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Given, Then, When } from '@cucumber/cucumber';

Given('a simulated Google Maps service', async function () {
  await this.context.addInitScript(() => {
    // Simulate only the remote API: Pegman and GoogleMutant stay real.
    const googleState = window.googleState = { maps: [], requests: [], panoramas: [], coverage: [] };
    class LatLng {
      constructor(lat, lng) { this.latitude = lat; this.longitude = lng; }
      lat() { return this.latitude; }
      lng() { return this.longitude; }
    }
    class GoogleMap {
      constructor(container, options) {
        this.zoom = options.zoom;
        this.__gm = { layoutManager: { positions: new Map([1, 2, 3].map(index => [index, document.createElement('div')])) } };
        googleState.maps.push(this);
      }
      getZoom() { return this.zoom; }
      setZoom(zoom) { this.zoom = zoom; }
      setCenter(center) { this.center = center; }
    }
    class StreetViewCoverageLayer {
      constructor() { googleState.coverage.push(this); }
      setMap(map) { this.map = map; }
    }
    class StreetViewPanorama {
      constructor(container, options) {
        this.container = container;
        this.options = options;
        this.listeners = {};
        googleState.panoramas.push(this);
      }
      addListener(name, callback) {
        this.listeners[name] = callback;
        return { remove: () => delete this.listeners[name] };
      }
      setPano(pano) { this.pano = pano; }
      setPov(pov) { this.pov = pov; this.listeners.pov_changed?.(); }
      setVisible(visible) { this.visible = visible; }
      getPosition() { return this.position; }
      getPov() { return this.pov; }
    }
    class StreetViewService {
      getPanoramaByLocation(position, radius, callback) {
        googleState.requests.push({ lat: position.lat(), lng: position.lng(), radius });
        const panorama = googleState.panoramas.at(-1);
        panorama.position = position;
        callback({ location: { pano: 'test-panorama', latLng: position } }, googleState.status || 'OK');
      }
    }
    window.google = { maps: {
      Map: GoogleMap, LatLng, StreetViewCoverageLayer, StreetViewPanorama, StreetViewService,
      StreetViewStatus: { OK: 'OK' },
      ControlPosition: { BOTTOM_LEFT: 2, BOTTOM_RIGHT: 3 },
      geometry: { spherical: { computeHeading: () => 90 } },
      event: {
        addListenerOnce: (target, name, callback) => queueMicrotask(callback),
        clearListeners: () => {},
      },
    } };
  });
  this.googleMutantRequests = [];
  await this.page.route('https://unpkg.com/leaflet.gridlayer.googlemutant@*/**', route => {
    this.googleMutantRequests.push(route.request().url());
    return route.fulfill({
      path: fileURLToPath(new URL('../../node_modules/leaflet.gridlayer.googlemutant/dist/Leaflet.GoogleMutant.js', import.meta.url)),
      contentType: 'application/javascript',
    });
  });
});

When('I activate Street View coverage', async function () {
  assert.deepEqual(this.googleMutantRequests, []);
  await this.page.locator('.leaflet-pegman').hover();
  await this.page.waitForFunction(() => {
    const control = map.controls.pegman;
    return control._googleStreetViewLayer;
  });
  await this.page.locator('.leaflet-pegman').click();
  await this.page.waitForFunction(() => map.controls.pegman._googleStreetViewLayer._mutantIsReady);
  assert.equal(this.googleMutantRequests.length, 1);
});

Then('GoogleMutant synchronizes with the Leaflet map', async function () {
  await this.page.evaluate(() => map.setView([42, 13], 8, { animate: false }));
  await this.page.waitForFunction(() => googleState.maps.at(-1).getZoom() === 8);
  const state = await this.page.evaluate(() => {
    const layer = map.controls.pegman._googleStreetViewLayer;
    return {
      realLayer: layer instanceof L.GridLayer.GoogleMutant,
      visible: map.hasLayer(layer),
      center: [layer._mutant.center.lat(), layer._mutant.center.lng()],
      coverageAttached: googleState.coverage.some(coverage => coverage.map === layer._mutant),
    };
  });
  assert.equal(state.realLayer, true);
  assert.equal(state.visible, true);
  assert.deepEqual(state.center, [42, 13]);
  assert.equal(state.coverageAttached, true);
});

Then('GoogleMutant renders tiles received from the simulated service', async function () {
  await this.page.route('**/google-tile.png?*', route => route.fulfill({
    contentType: 'image/png',
    body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==', 'base64'),
  }));
  const tileKey = await this.page.evaluate(() => {
    const layer = map.controls.pegman._googleStreetViewLayer;
    const tile = Object.values(layer._tiles).find(tile => tile.current);
    const image = new Image();
    image.src = `/google-tile.png?x=${tile.coords.x}&y=${tile.coords.y}&z=${tile.coords.z}&!2ssvv!`;
    const container = document.createElement('div');
    container.append(image);
    layer._mutantContainer.append(container);
    return layer._tileCoordsToKey(tile.coords);
  });
  await this.page.waitForFunction(key => {
    const tile = map.controls.pegman._googleStreetViewLayer._tiles[key];
    return tile.el.dataset.pending === '0' && tile.el.querySelector('img')?.naturalWidth > 0;
  }, tileKey);
  assert.equal(await this.page.evaluate(key => {
    const layer = map.controls.pegman._googleStreetViewLayer;
    const image = layer._tiles[key].el.querySelector('img');
    return image !== layer._mutantContainer.querySelector('img') && image.style.visibility === 'visible';
  }, tileKey), true);
});

When('I select a Street View location', async function () {
  await this.page.mouse.click(300, 180);
});

Then('the panorama and Pegman marker show the selected location', async function () {
  const state = await this.page.evaluate(() => {
    const control = map.controls.pegman;
    const panorama = googleState.panoramas.at(-1);
    return {
      request: googleState.requests.at(-1),
      marker: control._pegmanMarker.getLatLng(),
      markerVisible: map.hasLayer(control._pegmanMarker),
      pano: panorama.pano, visible: panorama.visible, heading: panorama.pov.heading,
      theme: map.getContainer().classList.contains('leaflet-pegman-v3-small'),
    };
  });
  assert.ok(state.request);
  assert.equal(state.request.radius, 500);
  assert.deepEqual(state.marker, { lat: state.request.lat, lng: state.request.lng });
  assert.equal(state.markerVisible, true);
  assert.equal(state.visible, true);
  assert.equal(state.pano, 'test-panorama');
  assert.equal(state.heading, 90);
  assert.equal(state.theme, true);
  assert.equal(await this.page.locator('.pano-canvas').isVisible(), true);
});

Then('closing Street View removes coverage and the marker', async function () {
  await this.page.keyboard.press('Escape');
  const state = await this.page.evaluate(() => ({
    coverage: map.hasLayer(map.controls.pegman._googleStreetViewLayer),
    marker: map.hasLayer(map.controls.pegman._pegmanMarker),
    enabled: map.controls.pegman._streetViewLayerEnabled,
  }));
  assert.deepEqual(state, { coverage: false, marker: false, enabled: false });
  assert.equal(await this.page.locator('.pano-canvas').isVisible(), false);
});

Then('dragging Pegman onto the map opens a panorama', async function () {
  const box = await this.page.locator('.leaflet-pegman').boundingBox();
  await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await this.page.mouse.down();
  await this.page.mouse.move(280, 180, { steps: 15 });
  const dropLocation = await this.page.evaluate(() =>
    (map.pointerEventToLatLng || map.mouseEventToLatLng).call(map, { clientX: 280, clientY: 180 }));
  await this.page.mouse.up();
  await this.page.locator('.pano-canvas').waitFor({ state: 'visible' });
  const state = await this.page.evaluate(location => ({
    marker: map.hasLayer(map.controls.pegman._pegmanMarker),
    position: map.latLngToContainerPoint(map.controls.pegman._pegmanMarker.getLatLng()),
    expected: map.latLngToContainerPoint(new L.LatLng(location.lat, location.lng)),
    dragging: map.controls.pegman.getContainer().classList.contains('dragging'),
  }), dropLocation);
  assert.equal(state.marker, true);
  assert.ok(Math.abs(state.position.x - state.expected.x) <= 1, JSON.stringify(state));
  assert.ok(Math.abs(state.position.y - state.expected.y) <= 1, JSON.stringify(state));
  assert.equal(state.dragging, false);
  await this.page.evaluate(() => googleState.panoramas.at(-1).listeners.closeclick());
  assert.equal(await this.page.locator('.pano-canvas').isVisible(), false);
  assert.equal(await this.page.evaluate(() => map.hasLayer(map.controls.pegman._pegmanMarker)), false);
});

Then('a location without Street View reports a warning', async function () {
  const warnings = [];
  const onConsole = message => {
    if (message.type() === 'warning') warnings.push(message.text());
  };
  this.page.on('console', onConsole);
  try {
    await this.page.evaluate(() => {
      googleState.status = 'ZERO_RESULTS';
      map.controls.pegman.findStreetViewData(0, 0);
    });
    assert.deepEqual(warnings, ['Street View data not found for this location.']);
    assert.equal(await this.page.locator('.pano-canvas').isVisible(), false);
    await this.page.evaluate(() => map.controls.pegman.clear());
  } finally {
    this.page.off('console', onConsole);
  }
});
