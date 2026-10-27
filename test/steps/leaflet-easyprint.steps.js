import assert from 'node:assert/strict';
import { Then, When } from '@cucumber/cucumber';

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
