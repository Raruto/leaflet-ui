import assert from 'node:assert/strict';
import { Then } from '@cucumber/cucumber';

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
