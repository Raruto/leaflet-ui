import { build } from './build.js';
import { startServer } from './server.js';

const stopBuild = await build({ watch: true });
let server;
try {
  server = await startServer(Number(process.env.PORT || 8080));
  console.log(`Serving on http://127.0.0.1:${server.address().port}/test/`);
} catch (error) {
  await stopBuild();
  throw error;
}

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await stopBuild();
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
