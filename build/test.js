import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from './build.js';

await build();

for (const version of ['1', '2']) {
  console.log(`\nTesting Leaflet ${version}`);
  const result = spawnSync(process.execPath, [
    'node_modules/@cucumber/cucumber/bin/cucumber.js',
    ...process.argv.slice(2),
  ], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    env: { ...process.env, LEAFLET_VERSION: version },
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status ?? 1;
}
