import { createServer } from 'node:http';
import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(fileURLToPath(new URL('../', import.meta.url)));
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.map': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function outsideRoot(filename) {
  const path = relative(root, filename);
  return path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path);
}

const escapeHtml = value => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

export function startServer(port = 8080) {
  const server = createServer(async (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
      return;
    }

    let filename;
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (pathname.includes('\0')) throw new URIError('Invalid path');
      filename = resolve(root, `.${pathname}`);
    } catch {
      response.writeHead(400).end('Bad request');
      return;
    }

    if (outsideRoot(filename)) {
      response.writeHead(403).end('Forbidden');
      return;
    }

    try {
      filename = await realpath(filename);
      if (outsideRoot(filename)) {
        response.writeHead(403).end('Forbidden');
        return;
      }
      if ((await stat(filename)).isDirectory()) {
        const entries = await readdir(filename, { withFileTypes: true });
        const base = new URL(request.url, 'http://localhost').pathname.replace(/\/?$/, '/');
        const links = entries.map(entry => {
          const suffix = entry.isDirectory() ? '/' : '';
          const href = `${base}${encodeURIComponent(entry.name)}${suffix}`;
          return `<li><a href="${escapeHtml(href)}">${escapeHtml(entry.name)}${suffix}</a></li>`;
        }).join('');
        response.writeHead(200, {
          'Content-Type': contentTypes['.html'],
          'Cache-Control': 'no-store',
        });
        response.end(request.method === 'HEAD' ? undefined : `<ul>${links}</ul>`);
        return;
      }
      if (!(await stat(filename)).isFile()) {
        response.writeHead(404).end('Not found');
        return;
      }
      const content = await readFile(filename);
      response.writeHead(200, {
        'Content-Type': contentTypes[extname(filename)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
        response.writeHead(404).end('Not found');
      } else {
        console.error(error);
        response.writeHead(500).end('Internal server error');
      }
    }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.off('error', reject);
      resolve(server);
    });
  });
}
