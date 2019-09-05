# leaflet-ui
Leaflet bundle for common user interface customizations

_For a working example see [demo](https://raruto.github.io/examples/leaflet-ui/leaflet-ui.html)_

---

## How to use

1. **include CSS & JavaScript**
    ```html
    <head>
    ...
    <style> html, body, #map { height: 100%; width: 100%; padding: 0; margin: 0; } </style>
    <!-- Leaflet (JS/CSS) -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.3.4/dist/leaflet.css">
    <script src="https://unpkg.com/leaflet@1.3.4/dist/leaflet.js"></script>
    <!-- Leaflet-UI -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet-ui@latest/dist/leaflet-ui.css">
    <script src="https://unpkg.com/leaflet-ui@latest/dist/leaflet-ui.js"></script>
    ...
    </head>
    ```
2. **choose a div container used for the slippy map**
    ```html
    <body>
    ...
	  <div id="map"></div>
    ...
    </body>
    ```
3. **create your first simple “leaflet-ui” slippy map**
    ```html
    <script>
      var map = L.map('map', {
        center: [41.4583, 12.7059],
        zoom: 5,
        // Optional customizations
        mapTypeId: 'topo',
        mapTypeIds: ['osm', 'terrain', 'satellite', 'topo'],
        gestureHandling: true,
        zoomControl: true,
        pegmanControl: true,
        locateControl: true,
        fullscreenControl: true,
        layersControl: true,
        minimapControl: true,
        disableDefaultUI: false,
      });
      map.once('idle',function(){ /* Waiting for map init */});
    </script>
    ```

---

**Compatibile with:** leaflet@1.3.4

---

**Contributors:** [Raruto](https://github.com/Raruto/leaflet-ui)
