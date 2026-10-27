import { cp, readFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));

const javascript = {
  absWorkingDir: root,
  entryPoints: ['src/leaflet-ui.js'],
  bundle: true,
  format: 'iife',
  sourcemap: true,
  mainFields: ['module', 'browser', 'main'],
  define: { 'import.meta': 'null' },
  plugins: [{
    name: 'leaflet-browser-umd',
    setup(build) {
      build.onResolve({ filter: /^leaflet\.fullscreen\/dist\/Control\.FullScreen\.umd\.js$/ }, () => ({
        path: resolve(root, 'node_modules/leaflet.fullscreen/dist/Control.FullScreen.umd.js'),
      }));
      // Older plugins still need their browser UMD branch.
      build.onLoad({ filter: /[\\/]node_modules[\\/](?:@raruto[\\/])?(?:leaflet-i18n|leaflet-minimap|leaflet-search|leaflet-easyprint|leaflet-loading|leaflet\.control\.resizer|leaflet\.visualclick|leaflet-pegman|leaflet-edit-osm|leaflet-control-layers-inline|leaflet-gesture-handling|leaflet\.locatecontrol|leaflet\.fullscreen)[\\/].*\.js$/ }, async ({ path }) => {
        let source = (await readFile(path, 'utf8'))
          .replace(/\btypeof (module|exports|define)\b/g, '"undefined"')
          .replace(/\bfactory\(window\.L\)/g, 'factory(L)')
          .replace(/\bL\.Evented\.prototype\b/g, 'L.Mixin.Events');
        // Translations register on the public Leaflet object; other plugins share the adapter.
        if (path.includes('leaflet-i18n')) source = source.replace(/\bL\.Util\.extend\b/g, 'Object.assign');

        // Add the pointer event that Leaflet 2 uses without removing legacy mouse support.
        if (path.includes('leaflet.control.resizer')) {
          source = source.replace(/mousedown mouseup click touchstart drag/g, 'pointerdown mousedown mouseup click touchstart drag');
        }
        if (path.includes('leaflet-pegman')) {
          const createLayer = 'this._googleStreetViewLayer = new L.GridLayer.GoogleMutant(this.options.mutant);';
          if (!source.includes(createLayer)) throw new Error('Unsupported leaflet-pegman GoogleMutant initialization');
          // The remote GoogleMutant uses public Leaflet and needs idempotent cleanup on Leaflet 2.
          source = source.replace(createLayer, `
            const leaflet = window.L || window.leaflet;
            if (!leaflet.Util.requestAnimFrame) {
              leaflet.Util = { ...leaflet.Util, requestAnimFrame: L.Util.requestAnimFrame };
            }
            ${createLayer}
            this._googleStreetViewLayer.onRemove = function(map) {
              L.GridLayer.prototype.onRemove.call(this, map);
              this._observer.disconnect();
              this._mutantContainer.remove();
              this._logoContainer?.remove();
              this._attributionContainer?.remove();
              if (this._mutant) google.maps.event.clearListeners(this._mutant, "idle");
            };`);
        }
        if (path.includes('leaflet-easyprint')) {
          // Escape percent signs before EasyPrint serializes SVG into a data URL.
          const serialize = '.then(h.escapeXhtml)';
          if (!source.includes(serialize)) throw new Error('Unsupported leaflet-easyprint SVG serializer');
          source = source.replace(serialize, '.then(svg => svg.replace(/%/g, "%25"))' + serialize);
        }
        return {
          contents: `import ${path.includes('leaflet-i18n') ? '{ Leaflet as L }' : 'L'} from ${JSON.stringify(resolve(root, 'src/leaflet-compat.js'))};\n${source}`,
          loader: 'js',
          resolveDir: dirname(path),
        };
      });
    },
  }],
};
const builds = [
  { ...javascript, outfile: 'dist/leaflet-ui-src.js' },
  { ...javascript, outfile: 'dist/leaflet-ui.js', minify: true },
  {
    absWorkingDir: root,
    entryPoints: ['src/leaflet-ui.css'],
    outfile: 'dist/leaflet-ui.css',
    outbase: 'node_modules',
    bundle: true,
    minify: true,
    loader: { '.png': 'file', '.svg': 'file', '.gif': 'file' },
    assetNames: 'images/[dir]/[name]',
    plugins: [{
      name: 'image-paths',
      setup(build) {
        build.onResolve({ filter: /\.(png|svg|gif)$/ }, ({ path, resolveDir }) => {
          if (/^(?:[a-z]+:|\/\/)/i.test(path)) return { path, external: true };
          const source = resolve(resolveDir, path);
          // postcss-copy joined the final directory name directly to the filename.
          return {
            path: resolve(dirname(source), '..', basename(dirname(source)) + basename(source)),
            pluginData: { source },
          };
        });
        build.onLoad({ filter: /\.(png|svg|gif)$/ }, async ({ pluginData }) => ({
          contents: await readFile(pluginData.source),
          loader: 'file',
          watchFiles: [pluginData.source],
        }));
      },
    }],
  },
];

export async function build({ watch = false } = {}) {
  await cp(
    resolve(root, 'node_modules/@raruto/leaflet-gesture-handling/dist/locales'),
    resolve(root, 'dist/locales'),
    { recursive: true },
  );

  if (!watch) {
    await Promise.all(builds.map(options => esbuild.build(options)));
    return;
  }

  const contexts = await Promise.all(builds.map(options => esbuild.context(options)));
  try {
    await Promise.all(contexts.map(context => context.rebuild()));
    await Promise.all(contexts.map(context => context.watch()));
  } catch (error) {
    await Promise.all(contexts.map(context => context.dispose()));
    throw error;
  }
  return () => Promise.all(contexts.map(context => context.dispose()));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await build();
}
