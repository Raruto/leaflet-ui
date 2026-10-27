import assert from 'node:assert/strict';
import { Then, When } from '@cucumber/cucumber';

When('I search for a place', async function () {
  await this.page.evaluate(() => map.controls.search.expand());
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
