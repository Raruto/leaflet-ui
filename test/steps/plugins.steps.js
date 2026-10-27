import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Given, Then, When } from '@cucumber/cucumber';

When('I export the map in {string} format', async function (size) {
  this.printState = await this.page.evaluate(() => {
    new L.Rectangle([[39, 10], [43, 14]], { color: '#ff0000', fillOpacity: 1 }).addTo(map);
    window.printEvents = [];
    map.on('easyPrint-start easyPrint-finished', event => printEvents.push(event.type));
    return { size: map.getSize(), center: map.getCenter(), zoom: map.getZoom() };
  });
  const download = this.page.waitForEvent('download');
  await this.page.locator('.leaflet-control-easyPrint').hover();
  await this.page.locator(`.easyPrintSizeMode a.${size}`).click();
  this.download = await download;
});

Then('a PNG of {int} by {int} pixels is downloaded', async function (width, height) {
  assert.equal(this.download.suggestedFilename(), 'map.png');
  assert.equal(await this.download.failure(), null);
  const stream = await this.download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const png = Buffer.concat(chunks);
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(png.readUInt32BE(16), width);
  assert.equal(png.readUInt32BE(20), height);
  const pixel = await this.page.evaluate(async base64 => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    return [...context.getImageData(image.width / 2, image.height / 2, 1, 1).data];
  }, png.toString('base64'));
  assert.deepEqual(pixel, [255, 0, 0, 255], 'The PNG must contain the rendered map overlay');
});

Then('printing restores the map size, position and controls', async function () {
  await this.page.waitForFunction(() => printEvents.includes('easyPrint-finished'));
  const state = await this.page.evaluate(() => ({
    size: map.getSize(), center: map.getCenter(), zoom: map.getZoom(),
  }));
  assert.deepEqual(state, this.printState);
  assert.deepEqual(await this.page.evaluate(() => printEvents), ['easyPrint-start', 'easyPrint-finished']);
  assert.equal(await this.page.locator('.epHolder,.epOuterContainer').count(), 0);
  assert.equal(await this.page.getByRole('button', { name: 'Zoom in', exact: true }).isVisible(), true);
  await this.download.delete();
});

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

Then('scrolling without a modifier warns without zooming', async function () {
  this.gestureZoom = await this.page.evaluate(() => map.getZoom());
  await this.page.mouse.move(300, 180);
  await this.page.mouse.wheel(0, -180);
  await this.page.waitForFunction(() => map.getContainer().classList.contains('leaflet-gesture-handling-warning'));
  assert.equal(await this.page.evaluate(() => map.getZoom()), this.gestureZoom);
  assert.equal(await this.page.evaluate(() => map.scrollWheelZoom.enabled()), false);
  await this.page.waitForFunction(() => !map.getContainer().classList.contains('leaflet-gesture-handling-warning'));
});

Then('control-scroll zooms the map', async function () {
  await this.page.keyboard.down('Control');
  try {
    await this.page.mouse.wheel(0, -180);
    await this.page.waitForFunction(zoom => map.getZoom() > zoom && !map._animatingZoom, this.gestureZoom);
  } finally {
    await this.page.keyboard.up('Control');
  }
});

Then('fullscreen suspends gestures and restores them on exit', async function () {
  await this.page.getByRole('button', { name: 'Enter Fullscreen', exact: true }).click();
  assert.equal(await this.page.evaluate(() => map.gestureHandling.enabled()), false);
  await this.page.getByRole('button', { name: 'Exit Fullscreen', exact: true }).click();
  assert.equal(await this.page.evaluate(() => map.gestureHandling.enabled()), true);
});

Then('disabling gesture handling removes the warning behavior', async function () {
  await this.page.evaluate(() => map.gestureHandling.disable());
  const zoom = await this.page.evaluate(() => map.getZoom());
  await this.page.mouse.move(300, 180);
  await this.page.mouse.wheel(0, 180);
  await this.page.waitForFunction(zoom => map.getZoom() < zoom && !map._animatingZoom, zoom);
  assert.equal(await this.page.locator('#map').evaluate(element => element.classList.contains('leaflet-gesture-handling')), false);
});

Then('one finger warns and two fingers permit map dragging', async function () {
  this.touchSession = await this.context.newCDPSession(this.page);
  await this.touchSession.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await this.touchSession.send('Input.dispatchTouchEvent', {
    type: 'touchStart', touchPoints: [{ x: 260, y: 180, id: 1 }],
  });
  await this.page.waitForFunction(() => map.getContainer().classList.contains('leaflet-gesture-handling-touch'));
  assert.equal(await this.page.evaluate(() => map.dragging.enabled()), false);
  await this.touchSession.send('Input.dispatchTouchEvent', {
    type: 'touchStart', touchPoints: [{ x: 260, y: 180, id: 1 }, { x: 340, y: 180, id: 2 }],
  });
  await this.page.waitForFunction(() => map.dragging.enabled());
  await this.touchSession.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await this.page.waitForFunction(() => !map.getContainer().classList.contains('leaflet-gesture-handling-warning'));
});

Then('touches on controls do not show gesture warnings', async function () {
  const box = await this.page.getByRole('button', { name: 'Zoom in', exact: true }).boundingBox();
  await this.touchSession.send('Input.dispatchTouchEvent', {
    type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }],
  });
  assert.equal(await this.page.evaluate(() => map.getContainer().classList.contains('leaflet-gesture-handling-warning')), false);
  await this.touchSession.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await this.touchSession.detach();
});

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

Then('map clicks and context clicks show feedback that disappears', async function () {
  const markers = this.page.locator('.leaflet-visualclick-icon,.leaflet-visualclick-icon-touch');
  for (const button of ['left', 'right']) {
    await this.page.mouse.click(300, 180, { button });
    await markers.first().waitFor({ state: 'attached' });
    assert.equal(await markers.count(), 1);
    assert.equal(await markers.evaluate(element => getComputedStyle(element).pointerEvents), 'none');
    assert.match(await markers.evaluate(element => getComputedStyle(element, '::after').animationName), /visualclick-pulsate/);
    await markers.waitFor({ state: 'detached' });
  }
});

Then('control clicks and disabled visual feedback create no marker', async function () {
  const markers = this.page.locator('.leaflet-visualclick-icon,.leaflet-visualclick-icon-touch');
  await this.page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  assert.equal(await markers.count(), 0);
  await this.page.evaluate(() => map.visualClick.disable());
  await this.page.mouse.click(300, 180);
  assert.equal(await markers.count(), 0);
});

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

Then('the locate button displays the browser position and stops on a second click', async function () {
  await this.context.grantPermissions(['geolocation']);
  await this.context.setGeolocation({ latitude: 41.1, longitude: 12.1, accuracy: 10 });
  const button = this.page.getByRole('button', { name: 'Show me where I am', exact: true });
  await button.click();
  await this.page.waitForFunction(() => map.controls.locate._marker && !map._animatingZoom && !map._panAnim?._inProgress);
  assert.deepEqual(await this.page.evaluate(() => map.controls.locate._marker.getLatLng()), { lat: 41.1, lng: 12.1 });
  assert.equal(await this.page.locator('.leaflet-control-locate.active').count(), 1);
  await button.click();
  assert.equal(await this.page.evaluate(() => map.controls.locate._active), false);
  assert.equal(await this.page.locator('.leaflet-control-locate.active').count(), 0);
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

Then('native fullscreen can be entered and exited', async function () {
  const container = this.page.locator('#map');
  const initial = await container.boundingBox();
  await this.page.getByRole('button', { name: 'Enter Fullscreen', exact: true }).click();
  await this.page.waitForFunction(() => document.fullscreenElement === map.getContainer() && map._isFullscreen);
  assert.equal(await this.page.getByRole('button', { name: 'Exit Fullscreen', exact: true }).getAttribute('aria-pressed'), 'true');
  await this.page.getByRole('button', { name: 'Exit Fullscreen', exact: true }).click();
  await this.page.waitForFunction(() => !document.fullscreenElement && !map._isFullscreen);
  assert.equal(await this.page.getByRole('button', { name: 'Enter Fullscreen', exact: true }).getAttribute('aria-pressed'), 'false');
  assert.deepEqual(await container.boundingBox(), initial);
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

Then('an empty search displays no results without moving the map', async function () {
  const center = await this.page.evaluate(() => {
    map.controls.search.expand();
    return map.getCenter();
  });
  await this.page.route('https://nominatim.openstreetmap.org/**', route => {
    const callback = new URL(route.request().url()).searchParams.get('json_callback');
    assert.ok(callback);
    return route.fulfill({ contentType: 'application/javascript', body: `${callback}([])` });
  });
  const response = this.page.waitForResponse(response => response.url().startsWith('https://nominatim.openstreetmap.org/'));
  await this.page.getByPlaceholder('Search...', { exact: true }).pressSequentially('Nowhere');
  await response;
  await this.page.waitForFunction(() => !map.controls.search._container.classList.contains('search-load'));
  await this.page.getByPlaceholder('Search...', { exact: true }).press('Enter');
  await this.page.locator('.search-alert').waitFor({ state: 'visible' });
  assert.equal(await this.page.locator('.search-tip').count(), 0);
  assert.deepEqual(await this.page.evaluate(() => map.getCenter()), center);
  await this.page.keyboard.press('Escape');
});

Then('a geolocation denial is reported and locating stops', async function () {
  const result = await this.page.evaluate(() => {
    window.locationErrors = [];
    map.controls.locate.options.onLocationError = error => locationErrors.push({ code: error.code, message: error.message });
    map.locate = () => map;
    map.stopLocate = () => map;
    map.controls.locate.start();
    map.fire('locationerror', { code: 1, message: 'Permission denied' });
    return { errors: locationErrors, active: map.controls.locate._active };
  });
  assert.deepEqual(result, { errors: [{ code: 1, message: 'Permission denied' }], active: false });
  assert.equal(await this.page.locator('.leaflet-control-locate.active').count(), 0);
});

Then('translations support locale switching and interpolation', async function () {
  const translations = await this.page.evaluate(() => {
    L.registerLocale('it-test', { 'Hello {name}': 'Ciao {name}', empty: '' });
    L.setLocale('it-test');
    const italian = L.i18n('Hello {name}', { name: 'Leaflet' });
    const empty = L.i18n('empty');
    L.setLocale('unregistered-test');
    return { italian, empty, fallback: L.i18n('Hello {name}', { name: 'Leaflet' }) };
  });
  assert.deepEqual(translations, { italian: 'Ciao Leaflet', empty: '', fallback: 'Hello Leaflet' });
});
