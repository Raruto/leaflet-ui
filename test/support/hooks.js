import assert from 'node:assert/strict';
import { After, AfterAll, Before, BeforeAll, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium } from 'playwright';
import { startServer } from '../../build/server.js';

setDefaultTimeout(10000);

let server;
let browser;
let baseUrl;

BeforeAll(async () => {
  server = await startServer(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

Before({ tags: '@browser' }, async function () {
  this.baseUrl = baseUrl;
  browser ??= await chromium.launch();
  this.context = await browser.newContext();
  await this.context.route('**/*', route => {
    return route.request().url().startsWith(`${baseUrl}/`) ? route.continue() : route.abort();
  });
  this.page = await this.context.newPage();
  this.errors = [];
  this.page.on('pageerror', error => this.errors.push(error.message));
});

After({ tags: '@browser' }, async function () {
  try {
    assert.deepEqual(this.errors, [], 'Unexpected browser errors');
  } finally {
    await this.context?.close();
  }
});

AfterAll({ timeout: 30000 }, async () => {
  try {
    await browser?.close();
  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  }
});
