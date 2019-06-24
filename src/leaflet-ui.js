import 'google-maps'; // async

import 'leaflet.gridlayer.googlemutant';
import 'leaflet.locatecontrol';
import 'leaflet.fullscreen';
import 'leaflet-pegman';
import '@raruto/leaflet-gesture-handling';
import 'leaflet-control-layers-inline';

// import './leaflet-ui.css';

(function() {

  L.Map.mergeOptions({
    mapTypeId: 'topo',
    mapTypeIds: ['osm', 'terrain', 'satellite', 'topo'],
    gestureHandling: true,
    zoomControl: true,
    pegmanControl: true,
    locateControl: true,
    fullscreenControl: true,
    layersControl: true,
    disableDefaultUI: false,
  });

  L.Map.addInitHook(function() {
    if (!!this.options.disableDefaultUI) {
      this.zoomControl.remove();
      this.attributionControl.remove();
    } else {
      this.zoomControl.remove();
      this.attributionControl.remove();
      if (!window.google && isGMap.call(this)) (GoogleMapsLoader).load(initMap.bind(this));
      else initMap.call(this);
    }
  });

  function isGMap() {
    return inArray(this.options.mapTypeIds.concat(this.options.mapTypeId), ['terrain', 'satellite']);
  }

  function initMap() {
    var controls = {},
      layers = {},
      baseMaps = {};

    if (this.options.gestureHandling) {
      this.gestureHandling.enable();
    }

    if (this.options.layersControl) {

      if (this.options.mapTypeIds.includes('osm')) {
        baseMaps.OSM = layers.osm = new L.TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        });
      }

      if (isGMap.call(this)) {

        if (this.options.mapTypeIds.includes('terrain')) {
          baseMaps.Terrain = layers.terrain = new L.GridLayer.GoogleMutant({
            type: 'terrain',
            maxZoom: 24,
          });
        }

        if (this.options.mapTypeIds.includes('satellite')) {
          baseMaps.Satellite = layers.satellite = new L.GridLayer.GoogleMutant({
            type: 'satellite',
            maxZoom: 24,
          });
        }

      }

      if (this.options.mapTypeIds.includes('topo')) {
        baseMaps.Topo = layers.topo = new L.TileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
          maxZoom: 17,
          attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
        });
      }

      controls.baseLayers = new L.Control.Layers(baseMaps, null, {
        inline: true,
        position: 'topleft'
      });

    }

    if (this.options.attributionControl) {
      this.attributionControl.addTo(this);
      controls.attribution = this.attributionControl;
      this.on('baselayerchange', L.bind(updateLeafletAttribution, this, this.attributionControl.options.prefix));
    }

    if (this.options.zoomControl) {
      this.zoomControl.setPosition('bottomright');
      this.zoomControl.addTo(this);
      controls.zoom = this.zoomControl;
    }

    if (this.options.pegmanControl) {
      controls.pegman = new L.Control.Pegman({
        position: 'bottomright',
        theme: "leaflet-pegman-v3-small",
      });
    }

    if (this.options.locateControl) {
      controls.locate = new L.Control.Locate({
        position: "bottomright"
      });
    }

    if (this.options.fullscreenControl) {
      controls.fullscreen = new L.Control.FullScreen({
        position: 'topright',
        title: 'Enter Fullscreen',
        titleCancel: 'Exit Fullscreen',
        forceSeparateButton: true,
      });
    }

    for (var i in controls) {
      if (controls[i].addTo) {
        controls[i].addTo(this);
      }
    }

    this.controls = controls;

    if (!isGMap.call(this)) {
      // needed some delay for sync loading
      setTimeout(function() {
        this.fire('idle');
      }.bind(this), 50);
    } else {
      this.fire('idle');
    }

    if (this.options.mapTypeId) {
      var key = findKey(baseMaps, this.options.mapTypeId);
      if (key) baseMaps[key].addTo(this); // fires 'baselayerchange'.
    }


  }

  function updateLeafletAttribution(defaultAttribution, e) {
    this.attributionControl.setPrefix((e && e.layer && e.layer instanceof L.GridLayer.GoogleMutant) ? false : defaultAttribution);
  }

  function findKey(object, key) {
    // Find key in object with ignorecase.
    return Object.keys(object).find(k => k.toLowerCase() === key.toLowerCase());
  }

  function inArray(array, items) {
    // Check if an array contains any element from another one.
    return array.some(r => items.includes(r));
  }



})();
