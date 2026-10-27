import assert from 'node:assert/strict';
import { Then } from '@cucumber/cucumber';

Then('empty translations remain empty', async function () {
  assert.equal(await this.page.evaluate(() => {
    L.registerLocale('test', { empty: '' });
    L.setLocale('test');
    return L.i18n('empty');
  }), '');
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
