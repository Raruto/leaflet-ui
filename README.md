# leaflet-ui

[![NPM version](https://img.shields.io/npm/v/leaflet-ui.svg?color=red)](https://www.npmjs.com/package/leaflet-ui)
[![License](https://img.shields.io/badge/license-GPL%203-blue.svg?style=flat)](LICENSE)

Leaflet presets for a ready-to-use map: base layers, map controls, and sensible defaults in one package.

_For a working example see [demo](https://raruto.github.io/leaflet-ui/examples/leaflet-ui.html)_

<p align="center">
    <a href="https://raruto.github.io/leaflet-ui/examples/leaflet-ui.html"><img src="https://raruto.github.io/img/leaflet-ui.png" alt="Leaflet default UI" /></a>
</p>

## How to use

Just load leaflet first, then leaflet-ui.

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet-ui@latest/dist/leaflet-ui.js"></script>

<style>
  html, body, #map { height: 100%; margin: 0; }
</style>

<div id="map"></div>
<script>
  const map = L.map('map', {
    center: [41.4583, 12.7059],
    zoom: 5,
    mapTypeId: 'topo',
    mapTypeIds: ['streets', 'terrain', 'satellite', 'topo'],
  });
</script>
```

By default, Leaflet UI adds its controls and base layers. Choose the active layer with `mapTypeId`; limit the layer switcher with `mapTypeIds`.

## Options

Pass options to `L.map` alongside Leaflet's regular [map options](https://leafletjs.com/reference.html#map-option). For each control, `false` disables it, `true` uses the preset below, and an object overrides or extends that control's preset. Control-specific options are passed to the corresponding Leaflet plugin.

```js
const map = L.map('map', {
  center: [41.4583, 12.7059],
  zoom: 5,
  mapTypeId: 'topo',
  searchControl: false,
  fullscreenControl: { position: 'topleft' },
  printControl: true,
});
```

### Map and package options

| Option | Default | Description |
| --- | --- | --- |
| `mapTypeId` | `'streets'` | ID of the initially selected base layer. |
| `mapTypeIds` | `['streets', 'terrain', 'satellite', 'topo']` | IDs of base layers to create and show in the layer control. |
| `mapTypes` | See [built-in base layers](#built-in-base-layers) | Base-layer definitions. Add or override entries by ID. |
| `gestureHandling` | `true` | Enable the gesture-handling plugin. |
| `visualClick` | `true` | Enable the visual-click plugin. |
| `rotate` | false | Enables map rotation and pitch. |
| `zoomControl` | `true` | Show Leaflet's zoom control. |
| `rotateControl` | `position: 'bottomright'` | Configure the rotation control when Leaflet Rotate provides it. |
| `scaleControl` | `true` | Show the scale control. |
| `pegmanControl` | `true` | Show Pegman / Street View control. |
| `locateControl` | `true` | Show the geolocation control. |
| `fullscreenControl` | `true` | Show the fullscreen control. |
| `layersControl` | `true` | Show the base-layer control. |
| `minimapControl` | `true` | Show the minimap. |
| `editInOSMControl` | `true` | Show the link to edit the current map area in OpenStreetMap. |
| `loadingControl` | `true` | Show the loading indicator. |
| `searchControl` | `true` | Show the location search control. |
| `printControl` | `false` | Show the print/export control. |
| `resizerControl` | `false` | Show the map resizer handle. |
| `disableDefaultUI` | `false` | Do not initialize Leaflet UI's default layers and controls. |
| `includeLeafletCSS` | `true` | With `plugins` enabled, load Leaflet's CSS if it is not already present. |
| `includeLeafletUICSS` | `true` | With `plugins` enabled, load Leaflet UI's CSS. |
| `plugins` | `[]` | CSS or JavaScript URLs to load after map initialization. |
| `apiKeys` | `undefined` | Provider keys; see [API keys](#api-keys). |

Leaflet's own options such as `center`, `zoom`, `minZoom`, `maxZoom`, `layers`, and `attributionControl` remain available. When `disableDefaultUI` is `true`, Leaflet UI does not create its default base layers or controls.

### Built-in base layers

The `mapTypes` object has the following entries by default. `mapTypeIds` determines which of them are active and available in the layer control; `atlas` and `cycle` are defined but not enabled by default.

| ID | Name | Tile provider | Default tile options |
| --- | --- | --- | --- |
| `streets` | Streets | OpenStreetMap | `maxZoom: 24`, `maxNativeZoom: 19`, attribution required |
| `terrain` | Terrain | Thunderforest Landscape | `maxZoom: 24`, `maxNativeZoom: 22`, attribution required, retina `r` |
| `satellite` | Satellite | Esri World Imagery | `maxZoom: 24`, `maxNativeZoom: 18`, attribution required |
| `topo` | Topo | OpenTopoMap | `maxZoom: 24`, `maxNativeZoom: 17`, attribution required |
| `atlas` | Atlas | Thunderforest Mobile Atlas | `maxZoom: 24`, `maxNativeZoom: 22`, attribution required, retina `r` |
| `cycle` | Cycle | Thunderforest Cycle | `maxZoom: 24`, `maxNativeZoom: 22`, attribution required, retina `r` |

Each entry has `name`, `url`, and `options`. `url` is a Leaflet tile URL template; `options` accepts [TileLayer options](https://leafletjs.com/reference.html#tilelayer-option), including `attribution`. Replace a provider definition or add your own:

```js
const map = L.map('map', {
  center: [41.4583, 12.7059],
  zoom: 5,
  mapTypes: {
    custom: {
      name: 'Custom',
      url: 'https://{s}.tile.example.com/{z}/{x}/{y}.png',
      options: { maxZoom: 20, attribution: '&copy; Example' },
    },
  },
  mapTypeIds: ['custom'],
  mapTypeId: 'custom',
});
```

### Control presets

These are the preset values merged into each control's options object. Other options supported by a control's underlying plugin can also be passed through.

| Option | Preset values |
| --- | --- |
| `zoomControl` | `position: 'bottomright'` |
| `rotateControl` | `position: 'bottomright'` |
| `scaleControl` | `width: 200`, `position: 'bottomright'`, `imperial: false` |
| `pegmanControl` | `position: 'bottomright'`, `theme: 'leaflet-pegman-v3-small'` |
| `locateControl` | `position: 'bottomright'` |
| `fullscreenControl` | `position: 'topright'`, `title: 'Enter Fullscreen'`, `titleCancel: 'Exit Fullscreen'`, `forceSeparateButton: true` |
| `layersControl` | `inline: true`, `position: 'topleft'` |
| `minimapControl` | `position: 'bottomleft'`, `toggleDisplay: false`, `toggleMapTypes: true`, `width: 75`, `height: 75`; see nested defaults below |
| `editInOSMControl` | `position: 'bottomright'` |
| `loadingControl` | `separate: true`, `position: 'bottomright'` |
| `searchControl` | See [search defaults](#search-control-defaults) |
| `printControl` | `position: 'bottomright'`, `hideControlContainer: true`, `exportOnly: true`, `sizeModes: ['A4Portrait', 'A4Landscape']` |
| `resizerControl` | `direction: 's'` |

The minimap's `aimingRectOptions` and `shadowRectOptions` both default to `{ color: '#000000', weight: 1, opacity: 0, fillOpacity: 0 }`. Its nested `mapOptions` defaults to `{ mapTypeId: 'satellite', gestureHandling: false, searchControl: false, loadingControl: false, _isMiniMap: true, rotateControl: false }`. These are Leaflet MiniMap options plus Leaflet UI map options.

#### Search control defaults

| Option | Default |
| --- | --- |
| `url` | `https://nominatim.openstreetmap.org/search?format=json&accept-language={querylang}&q={s}` |
| `querylang` | Browser language when detected; otherwise `'en-US'` |
| `detectUserLang` | `true` |
| `jsonpParam` | `'json_callback'` |
| `propertyName` | `'display_name'` |
| `propertyLoc` | `['lat', 'lon']` |
| `markerLocation` | `true` |
| `autoType` | `false` |
| `autoCollapse` | `true` |
| `firstTipSubmit` | `true` |
| `minLength` | `1` |
| `zoom` | `10` |
| `position` | `'bottomright'` |

### API keys

`apiKeys.thunderforest` is applied to the built-in `atlas`, `terrain`, and `cycle` layers. `apiKeys.google` is applied to Pegman:

```js
apiKeys: {
  thunderforest: 'YOUR_THUNDERFOREST_API_KEY',
  google: 'YOUR_GOOGLE_MAPS_API_KEY',
}
```

### Custom plugins and events

Use `plugins` to load browser-ready plugin scripts or stylesheets when creating a map. This is useful for plugins that register Leaflet controls, layers, or map init hooks:

```js
const map = L.map('map', {
  center: [41.4583, 12.7059],
  zoom: 5,
  plugins: [
    'leaflet-pointable@0.1.0/leaflet-pointable.js',
    '/assets/my-map-plugin.js',
    '/assets/my-map-plugin.css',
  ],
});

map.once('plugins_loaded', () => {
  // Plugin scripts are ready; use their APIs here.
});
```

Each entry is loaded as a stylesheet if its URL ends in `.css`, otherwise as a script. Supported URL forms:

| URL form | Example | Resolved from |
| --- | --- | --- |
| Package path | `leaflet-pointable@0.1.0/leaflet-pointable.js` | `https://unpkg.com/` |
| Root-relative path | `/assets/my-plugin.js` | Current site's origin |
| Relative path | `./assets/my-plugin.css` | Current document URL |
| Absolute URL | `https://cdn.example.com/my-plugin.js` | As provided |

Leaflet UI loads Leaflet CSS when `includeLeafletCSS` is enabled and it is not already detected, and loads Leaflet UI CSS when `includeLeafletUICSS` is enabled. It then loads custom plugin URLs. URLs within each group are requested in parallel, so do not rely on the order of entries in `plugins` for script dependencies. If one plugin depends on another, bundle them together or load them yourself in dependency order before creating the map.

The default `plugins: []` still enables this loading step, including Leaflet UI CSS. Set `includeLeafletCSS: false` or `includeLeafletUICSS: false` to skip the corresponding stylesheet. Set `plugins: false` to skip the plugin-loading step entirely, including its automatic stylesheet loading.

### Events

These are the events Leaflet UI itself fires on the map:

| Event | When it fires | Conditions |
| --- | --- | --- |
| `idle` | The map is ready and its initial layers have been added. | Fires when default UI initialization runs; not fired with `disableDefaultUI: true`. |
| `plugins_loaded` | Leaflet UI's automatic stylesheet and `plugins` loading step completes. | Fires when `plugins` is truthy (including the default empty array); not fired with `plugins: false`. |
| `initHooks_called` | After `plugins_loaded`, once newly registered Leaflet map init hooks have been called for this map. | Fires when `plugins` is truthy. |

Listen for these events on the map:

```js
const map = L.map('map', { plugins: ['/assets/my-plugin.js'] });

map.once('idle', () => console.log('Map ready'));
map.once('plugins_loaded', () => console.log('Plugin files loaded'));
map.once('initHooks_called', () => console.log('Plugin map hooks called'));
```

Attach listeners immediately after constructing the map. `plugins_loaded` and `initHooks_called` are asynchronous because they wait for resource loading; `idle` is tied to Leaflet's map-ready lifecycle. Leaflet's standard map events and events emitted by bundled or custom plugins are also available, but are not generated by Leaflet UI itself; see the relevant plugin documentation for their names and payloads.

Use tile providers according to their terms of service and include their required attribution.

## Development

```sh
npm install
npm test
```

`npm test` builds the bundle and runs browser tests.

* * *

**Compatible with:** Leaflet@1.9.4 and Leaflet@2.0.0-alpha.1.

* * *

**Contributors:** [Raruto](https://github.com/Raruto/leaflet-ui)