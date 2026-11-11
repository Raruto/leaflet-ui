import assert from 'node:assert/strict';
import { Then } from '@cucumber/cucumber';

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

Then('the location and compass markers retain their own coordinates and styles', async function () {
  const result = await this.page.evaluate(() => {
    const { markerClass, compassClass } = map.controls.locate.options;
    const location = new markerClass(new L.LatLng(41, 12), { radius: 8, color: 'red' });
    const compass = new compassClass(new L.LatLng(42, 13), 90, { radius: 10, color: 'blue', width: 5, depth: 3 });
    return {
      location: { latlng: location.getLatLng(), radius: location.options.radius, icon: location._locationIcon.options.html },
      compass: { latlng: compass.getLatLng(), radius: compass.options.radius, heading: compass._heading, icon: compass._locationIcon.options.html },
    };
  });
  assert.deepEqual(result.location.latlng, { lat: 41, lng: 12 });
  assert.deepEqual(result.compass.latlng, { lat: 42, lng: 13 });
  assert.equal(result.location.radius, 8);
  assert.equal(result.compass.radius, 10);
  assert.equal(result.compass.heading, 90);
  assert.match(result.location.icon, /<circle/);
  assert.match(result.compass.icon, /<path/);
});
