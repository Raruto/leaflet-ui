# leaflet-ui

[![NPM version](https://img.shields.io/npm/v/leaflet-ui.svg?color=red)](https://www.npmjs.com/package/leaflet-ui)
[![License](https://img.shields.io/badge/license-GPL%203-blue.svg?style=flat)](LICENSE)

Leaflet presets for common user interface customizations

_For a working example see [demo](https://raruto.github.io/leaflet-ui/examples/leaflet-ui.html)_

<p align="center">
    <a href="https://raruto.github.io/leaflet-ui/examples/leaflet-ui.html"><img src="https://raruto.github.io/img/leaflet-ui.png" alt="Leaflet default UI" /></a>
</p>


* * *

## How to use

1.  **include CSS & JavaScript**
    ```html
    <head>
    ...
    <style> html, body, #map { height: 100%; width: 100%; padding: 0; margin: 0; } </style>
    <!-- Leaflet -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <!-- Leaflet-UI -->
    <script src="https://unpkg.com/leaflet-ui@latest/dist/leaflet-ui.js"></script>
    ...
    </head>
    ```
2.  **choose a div container used for the slippy map**
    ```html
    <body>
    ...
      <div id="map"></div>
    ...
    </body>
    ```
3.  **create your first simple “leaflet-ui” slippy map**
    ```html
    <script>
      var map = L.map('map', {
        center: [41.4583, 12.7059],
        zoom: 5,

        // Optional customizations
        mapTypeId: 'topo',
        mapTypeIds: ['streets', 'terrain', 'satellite', 'topo'],
        gestureHandling: true,
        zoomControl: true,
        pegmanControl: true,
        locateControl: true,
        fullscreenControl: true,
        layersControl: true,
        minimapControl: true,
        editInOSMControl: true,
        loadingControl: true,
        searchControl: true,
        disableDefaultUI: false,

        // Experimental feature
        rotate: true,
      });
      map.once('idle',function(){ /* Waiting for map init */});
    </script>
    ```

* * *

**Compatible with:** Leaflet 1.9.3 or newer (1.x).

* * *

## Development

Requires Node.js 22 or newer.

```sh
npm install --legacy-peer-deps
npm run build
npm run dev
```

`build` bundles JavaScript, CSS, images and translations into `dist/` with esbuild.
Images keep the legacy `postcss-copy` paths under `dist/images/`, without hashes.
`dev` builds and watches the source files, and serves the project with `node:http`
at <http://127.0.0.1:8080/test/>. Reload the page after a rebuild.
Set the `PORT` environment variable to use a different port.
Directories always show a directory listing, even when `index.html` is present.
Open `/test/index.html` explicitly to view the test map.
Open <http://127.0.0.1:8080/> to browse the project.
The pages in `test/` use the local bundles; `examples/` uses the published package.
The install flag is needed for the existing `leaflet-pegman` / GoogleMutant peer
dependency conflict.

Tests use Cucumber.js and Playwright, with scenarios in `test/features/`,
step definitions in `test/steps/` and browser hooks in `test/support/`.
Install Chromium once, then run the suite:

```sh
npx playwright install chromium
npm test
```

`npm test` builds the bundles before checking UI controls in Chromium.
Browser tests use local assets and block external
requests. Cucumber arguments are forwarded, for example `npm test -- --tags "@browser"`
(in Windows PowerShell, use `npm.cmd test -- --tags "@browser"`).

* * *

**Contributors:** [Raruto](https://github.com/Raruto/leaflet-ui)
