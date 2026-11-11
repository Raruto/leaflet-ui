import { cp, readFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'acorn';
import * as esbuild from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));

/**
 * Replace selected AST nodes without reprinting the rest of the plugin source.
 * A replaced node owns its entire range, so its children are not visited.
 * Applying edits from the end keeps all Acorn offsets valid.
 */
function rewrite(source, transform) {
  const changes = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type) {
      const replacement = transform(node, source);
      if (replacement !== undefined) {
        changes.push({ start: node.start, end: node.end, replacement });
        return;
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  }
  visit(parse(source, { ecmaVersion: 'latest', sourceType: 'module' }));
  for (const { start, end, replacement } of changes.sort((a, b) => b.start - a.start)) {
    source = source.slice(0, start) + replacement + source.slice(end);
  }
  return source;
}

/**
 * Convert the known Leaflet 1 `.extend({...})` definitions into classes that
 * work with both Leaflet versions. Options and event mixins are installed on
 * each class; the original initializer runs before its init hooks.
 *
 * This intentionally handles only the bundled plugins' current class shapes.
 * When upgrading a plugin, review its definitions and update the count below.
 */
function upgradeClasses(source, path) {
  let count = 0;
  source = rewrite(source, (node, text) => {
    if (node.type !== 'CallExpression' || node.callee.type !== 'MemberExpression' ||
        node.callee.property.name !== 'extend' || node.arguments[0]?.type !== 'ObjectExpression') return;
    const parent = text.slice(node.callee.object.start, node.callee.object.end);
    if (!/^(?:L|leaflet)\.(?:Control|Marker|Handler)$|^LocationMarker$/.test(parent)) return;
    count++;
    const properties = node.arguments[0].properties;
    const initialize = properties.find(property => property.key?.name === 'initialize');
    const options = properties.find(property => property.key?.name === 'options');
    const includes = properties.find(property => property.key?.name === 'includes');
    const methods = properties.filter(property => !['initialize', 'options', 'includes'].includes(property.key?.name));
    if (properties.some(property => property.type !== 'Property' || property.computed)) {
      throw new Error(`Unsupported legacy class in ${path}`);
    }
    if (includes && !/L\.Evented/.test(text.slice(includes.value.start, includes.value.end))) {
      throw new Error(`Unsupported legacy class mixin in ${path}`);
    }
    const initMethod = initialize
      ? initialize.method
        ? `__uiInitialize${text.slice(initialize.value.start, initialize.value.end)}`
        : `__uiInitialize: ${text.slice(initialize.value.start, initialize.value.end)}`
      : '';
    const members = [...(initMethod ? [initMethod] : []), ...methods.map(property => text.slice(property.start, property.end))].join(',\n');
    const initOptions = options ? `this.mergeOptions(${text.slice(options.value.start, options.value.end)});` : '';
    // Evented also contains class lifecycle fields on Leaflet 1; mixing those
    // into the new class would overwrite its own init-hook handling.
    const initEvents = includes ? `this.include(Object.fromEntries(Object.getOwnPropertyNames(L.Evented.prototype).filter(name => !['constructor', 'initialize', 'callInitHooks', '_initHooks', 'options'].includes(name)).map(name => [name, L.Evented.prototype[name]])));` : '';
    const superArgs = /(?:L|leaflet)\.Control$/.test(parent) && initialize ? '' : '...args';
    const base = parent === 'LocationMarker' ? parent : `(L.version.startsWith('1.') ? ${parent}.extend({}) : ${parent})`;
    // Leaflet 1 can call hooks from super(); Leaflet 2 counts pending hooks.
    // Defer both until the plugin initializer has run, including for subclasses.
    return `(class extends ${base} {
      static initHooks = true;
      constructor(...args) {
        super(${superArgs});
        if (!this.__uiInitialized) {
          this.__uiInitialized = true;
          if (this.__uiInitialize) this.__uiInitialize(...args);
          if (L.version.startsWith('1.')) this.callInitHooks();
          else while (this._initHooksLeft > 0) this.callInitHooks();
        }
      }
      callInitHooks() {
        if (this.__uiInitialized) super.callInitHooks();
      }
      static {
        ${initEvents}
        ${initOptions}
        this.include({${members}});
      }
    })`;
  });
  const parts = path.split(/[\\/]/);
  const packageName = parts[parts.lastIndexOf('node_modules') + 1];
  const expected = {
    'leaflet.locatecontrol': 3,
    'leaflet-search': 2,
    'leaflet.fullscreen': 1,
    'leaflet-minimap': 1,
    'leaflet-loading': 1,
    'leaflet.control.resizer': 1,
    'leaflet.visualclick': 1,
    'leaflet-easyprint': 1,
  }[packageName];
  if (count !== expected) throw new Error(`Expected ${expected} legacy classes in ${path}, found ${count}`);
  return source;
}

/**
 * Replace removed Leaflet helpers with native equivalents. Repeat the pass
 * because a replaced call can contain another call in its arguments.
 */
function upgradeCalls(source) {
  let previous;
  do {
    previous = source;
    source = rewrite(source, (node, text) => {
      if (node.type !== 'CallExpression' || node.callee.type !== 'MemberExpression') return;
      const callee = text.slice(node.callee.start, node.callee.end);
      const args = node.arguments.map(arg => text.slice(arg.start, arg.end));
      if (callee === 'L.DomUtil.addClass' || callee === 'L.DomUtil.removeClass') {
        if (args.length !== 2) throw new Error(`Unsupported ${callee} call`);
        return `(${args[0]}).classList.${callee.endsWith('addClass') ? 'add' : 'remove'}(...(${args[1]}).trim().split(/\\s+/))`;
      }
      if (callee === 'L.Util.bind') {
        if (args.length < 2) throw new Error('Unsupported L.Util.bind call');
        return `(${args[0]}).bind(${args.slice(1).join(', ')})`;
      }
      if (callee === 'L.Util.requestAnimFrame') {
        if (args.length < 1 || args.length > 2) throw new Error('Unsupported L.Util.requestAnimFrame call');
        return `requestAnimationFrame(${args.length === 2 ? `(${args[0]}).bind(${args[1]})` : args[0]})`;
      }
    });
  } while (source !== previous);
  // Keep this separate: the Leaflet 1 branch still contains the original call.
  return rewrite(source, (node, text) => {
    if (node.type !== 'CallExpression' || node.callee.type !== 'MemberExpression' ||
        text.slice(node.callee.start, node.callee.end) !== 'L.latLng') return;
    const args = node.arguments.map(arg => text.slice(arg.start, arg.end)).join(', ');
    return `(L.latLng ? L.latLng(${args}) : new L.LatLng(${args}))`;
  });
}

/**
 * Split chained DomEvent calls: Leaflet 2 no longer returns DomEvent from
 * on/off, but the individual calls must remain in their original order.
 */
function upgradeEventChains(source) {
  return rewrite(source, (node, text) => {
    function chain(call) {
      if (call.type !== 'CallExpression' || call.callee.type !== 'MemberExpression') return;
      const callee = text.slice(call.callee.start, call.callee.end).replace(/\s/g, '');
      if (/^(?:L|leaflet)\.DomEvent\.(?:on|off|disableClickPropagation|disableScrollPropagation)$/.test(callee)) {
        return { root: callee.slice(0, callee.lastIndexOf('.')), calls: [text.slice(call.start, call.end)] };
      }
      const name = call.callee.property.name;
      if (name !== 'on' && name !== 'off') return;
      const previous = chain(call.callee.object);
      if (!previous) return;
      const args = call.arguments.map(arg => text.slice(arg.start, arg.end)).join(', ');
      previous.calls.push(`${previous.root}.${name}(${args})`);
      return previous;
    }
    const result = chain(node);
    if (result?.calls.length > 1) return `(${result.calls.join(', ')})`;
  });
}

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
      // Use the browser UMD build rather than the package's module entry.
      build.onResolve({ filter: /^leaflet\.fullscreen\/dist\/Control\.FullScreen\.umd\.js$/ }, () => ({
        path: resolve(root, 'node_modules/leaflet.fullscreen/dist/Control.FullScreen.umd.js'),
      }));
      // Older plugins still need their browser UMD branch.
      build.onLoad({ filter: /[\\/]node_modules[\\/](?:@raruto[\\/])?(?:leaflet-i18n|leaflet-minimap|leaflet-search|leaflet-easyprint|leaflet-loading|leaflet\.control\.resizer|leaflet\.visualclick|leaflet-pegman|leaflet-edit-osm|leaflet-control-layers-inline|leaflet-gesture-handling|leaflet\.locatecontrol|leaflet\.fullscreen)[\\/].*\.js$/ }, async ({ path }) => {
        let source = (await readFile(path, 'utf8'))
          .replace(/\btypeof (module|exports|define)\b/g, '"undefined"')
          .replace(/\bfactory\(window\.L\)/g, 'factory(L)');
        // Restrict compatibility rewrites to the legacy plugins they target.
        // The modified source exists only in the bundle, not in node_modules.
        const legacy = /[\\/](?:leaflet-minimap|leaflet-search|leaflet-easyprint|leaflet-loading|leaflet\.control\.resizer|leaflet\.visualclick|leaflet\.locatecontrol|leaflet\.fullscreen)[\\/]/.test(path);
        if (legacy) {
          source = source
            .replace(/\bL\.Util\.extend\b/g, 'Object.assign')
            .replace(/\bL\.Util\.isArray\b/g, 'Array.isArray')
            .replace(/\bL\.setOptions\b/g, 'L.Util.setOptions')
            .replace(/\bL\.stamp\b/g, 'L.Util.stamp')
            .replace(/\bL\.rectangle\(/g, 'new L.Rectangle(')
            .replace(/\bL\.divIcon\(/g, 'new L.DivIcon(')
            .replace(/\bL\.marker\(/g, 'new L.Marker(')
            .replace(/\bL\.Browser\.any3d\b/g, '(L.Browser?.any3d ?? true)')
            .replace(/\bL\.Browser\./g, 'L.Browser?.')
            .replace(/\bL\.DomEvent\.addListener\b/g, 'L.DomEvent.on')
            .replace(/\bL\.DomUtil\.disableTextSelection\(\)/g, "window.addEventListener('selectstart', L.DomEvent.preventDefault)")
            .replace(/\bL\.DomUtil\.enableTextSelection\(\)/g, "window.removeEventListener('selectstart', L.DomEvent.preventDefault)")
            .replace('L.Control.Resizer.include(L.Evented.prototype);',
              "L.Control.Resizer.include(Object.fromEntries(Object.getOwnPropertyNames(L.Evented.prototype).filter(name => !['constructor', 'initialize', 'callInitHooks', '_initHooks', 'options'].includes(name)).map(name => [name, L.Evented.prototype[name]])));");
          source = upgradeCalls(source);
          source = upgradeEventChains(source);
          source = upgradeClasses(source, path);
        }
        // Search and Loading refer to class names or initializers moved in Leaflet 2.
        if (path.includes('leaflet-search')) {
          source = source
            .replace(/new L\.Icon\.Default\(\)/g, 'new (L.DefaultIcon || L.Icon.Default)()')
            .replace('L.Marker.prototype.initialize.call(this, latlng, options);',
              'if (L.Marker.prototype.initialize) L.Marker.prototype.initialize.call(this, latlng, options);');
        }
        if (path.includes('leaflet-loading')) {
          source = source.replace(/\bL\.Control\.Zoom\b/g, '(L.ZoomControl || L.Control.Zoom)');
        }
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
        // Plugins register their public factories on the page's Leaflet object.
        return {
          contents: `const L = window.L || window.leaflet;\nif (!L) throw new Error('Leaflet must be loaded before leaflet-ui');\nL.control ||= {};\nL.gridLayer ||= {};\n${source}`,
          loader: 'js',
          resolveDir: dirname(path),
          watchFiles: [path],
        };
      });
    },
  }],
};
// Ship readable and minified JavaScript with sourcemaps, plus bundled CSS.
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

/**
 * Build all outputs and copy gesture locales. In watch mode, return an async
 * disposer for the esbuild contexts; a one-shot build returns no disposer.
 */
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
