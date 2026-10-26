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
      // Share the page's Leaflet with ESM plugins instead of bundling another copy.
      build.onResolve({ filter: /^leaflet$/ }, () => ({ path: 'leaflet', namespace: 'global-leaflet' }));
      build.onLoad({ filter: /.*/, namespace: 'global-leaflet' }, () => ({
        contents: 'export const { Marker, Util, DivIcon, Control, Circle, DomEvent, LayerGroup, Map } = window.L;',
        loader: 'js',
      }));
      // Older plugins still need their browser UMD branch.
      build.onLoad({
        filter: /[\\/]node_modules[\\/](?:leaflet-i18n|leaflet-minimap|leaflet-search)[\\/].*\.js$/,
      }, async ({ path }) => ({
        contents: (await readFile(path, 'utf8')).replace(/\btypeof (module|exports|define)\b/g, '"undefined"'),
        loader: 'js',
      }));
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
      name: 'legacy-image-paths',
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
