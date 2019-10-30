(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
}((function () { 'use strict';

  var version = "0.3.0+master.6edcb30";

  /*!
  Copyright (c) 2016 Dominik Moritz

  This file is part of the leaflet locate control. It is licensed under the MIT license.
  You can find the project at: https://github.com/domoritz/leaflet-locatecontrol
  */
  (function (factory, window) {
       // see https://github.com/Leaflet/Leaflet/blob/master/PLUGIN-GUIDE.md#module-loaders
       // for details on how to structure a leaflet plugin.

      // define an AMD module that relies on 'leaflet'
      if (typeof define === 'function' && define.amd) {
          define(['leaflet'], factory);

      // define a Common JS module that relies on 'leaflet'
      } else if (typeof exports === 'object') {
          if (typeof window !== 'undefined' && window.L) {
              module.exports = factory(L);
          } else {
              module.exports = factory(require('leaflet'));
          }
      }

      // attach your plugin to the global 'L' variable
      if (typeof window !== 'undefined' && window.L){
          window.L.Control.Locate = factory(L);
      }
  } (function (L) {
      var LDomUtilApplyClassesMethod = function(method, element, classNames) {
          classNames = classNames.split(' ');
          classNames.forEach(function(className) {
              L.DomUtil[method].call(this, element, className);
          });
      };

      var addClasses = function(el, names) { LDomUtilApplyClassesMethod('addClass', el, names); };
      var removeClasses = function(el, names) { LDomUtilApplyClassesMethod('removeClass', el, names); };

      /**
       * Compatible with L.Circle but a true marker instead of a path
       */
      var LocationMarker = L.Marker.extend({
          initialize: function (latlng, options) {
              L.Util.setOptions(this, options);
              this._latlng = latlng;
              this.createIcon();
          },

          /**
           * Create a styled circle location marker
           */
          createIcon: function() {
              var opt = this.options;

              var style = '';

              if (opt.color !== undefined) {
                  style += 'stroke:'+opt.color+';';
              }
              if (opt.weight !== undefined) {
                  style += 'stroke-width:'+opt.weight+';';
              }
              if (opt.fillColor !== undefined) {
                  style += 'fill:'+opt.fillColor+';';
              }
              if (opt.fillOpacity !== undefined) {
                  style += 'fill-opacity:'+opt.fillOpacity+';';
              }
              if (opt.opacity !== undefined) {
                  style += 'opacity:'+opt.opacity+';';
              }

              var icon = this._getIconSVG(opt, style);

              this._locationIcon = L.divIcon({
                  className: icon.className,
                  html: icon.svg,
                  iconSize: [icon.w,icon.h],
              });

              this.setIcon(this._locationIcon);
          },

          /**
           * Return the raw svg for the shape
           *
           * Split so can be easily overridden
           */
          _getIconSVG: function(options, style) {
              var r = options.radius;
              var w = options.weight;
              var s = r + w;
              var s2 = s * 2;
              var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+s2+'" height="'+s2+'" version="1.1" viewBox="-'+s+' -'+s+' '+s2+' '+s2+'">' +
              '<circle r="'+r+'" style="'+style+'" />' +
              '</svg>';
              return {
                  className: 'leaflet-control-locate-location',
                  svg: svg,
                  w: s2,
                  h: s2
              };
          },

          setStyle: function(style) {
              L.Util.setOptions(this, style);
              this.createIcon();
          }
      });

      var CompassMarker = LocationMarker.extend({
          initialize: function (latlng, heading, options) {
              L.Util.setOptions(this, options);
              this._latlng = latlng;
              this._heading = heading;
              this.createIcon();
          },

          setHeading: function(heading) {
              this._heading = heading;
          },

          /**
           * Create a styled arrow compass marker
           */
          _getIconSVG: function(options, style) {
              var r = options.radius;
              var w = (options.width + options.weight);
              var h = (r+options.depth + options.weight)*2;
              var path = 'M0,0 l'+(options.width/2)+','+options.depth+' l-'+(w)+',0 z';
              var svgstyle = 'transform: rotate('+this._heading+'deg)';
              var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+(w)+'" height="'+h+'" version="1.1" viewBox="-'+(w/2)+' 0 '+w+' '+h+'" style="'+svgstyle+'">'+
              '<path d="'+path+'" style="'+style+'" />'+
              '</svg>';
              return {
                  className: 'leaflet-control-locate-heading',
                  svg: svg,
                  w: w,
                  h: h
              };
          },
      });


      var LocateControl = L.Control.extend({
          options: {
              /** Position of the control */
              position: 'topleft',
              /** The layer that the user's location should be drawn on. By default creates a new layer. */
              layer: undefined,
              /**
               * Automatically sets the map view (zoom and pan) to the user's location as it updates.
               * While the map is following the user's location, the control is in the `following` state,
               * which changes the style of the control and the circle marker.
               *
               * Possible values:
               *  - false: never updates the map view when location changes.
               *  - 'once': set the view when the location is first determined
               *  - 'always': always updates the map view when location changes.
               *              The map view follows the user's location.
               *  - 'untilPan': like 'always', except stops updating the
               *                view if the user has manually panned the map.
               *                The map view follows the user's location until she pans.
               *  - 'untilPanOrZoom': (default) like 'always', except stops updating the
               *                view if the user has manually panned the map.
               *                The map view follows the user's location until she pans.
               */
              setView: 'untilPanOrZoom',
              /** Keep the current map zoom level when setting the view and only pan. */
              keepCurrentZoomLevel: false,
              /**
               * This callback can be used to override the viewport tracking
               * This function should return a LatLngBounds object.
               *
               * For example to extend the viewport to ensure that a particular LatLng is visible:
               *
               * getLocationBounds: function(locationEvent) {
               *    return locationEvent.bounds.extend([-33.873085, 151.219273]);
               * },
               */
              getLocationBounds: function (locationEvent) {
                  return locationEvent.bounds;
              },
              /** Smooth pan and zoom to the location of the marker. Only works in Leaflet 1.0+. */
              flyTo: false,
              /**
               * The user location can be inside and outside the current view when the user clicks on the
               * control that is already active. Both cases can be configures separately.
               * Possible values are:
               *  - 'setView': zoom and pan to the current location
               *  - 'stop': stop locating and remove the location marker
               */
              clickBehavior: {
                  /** What should happen if the user clicks on the control while the location is within the current view. */
                  inView: 'stop',
                  /** What should happen if the user clicks on the control while the location is outside the current view. */
                  outOfView: 'setView',
                  /**
                   * What should happen if the user clicks on the control while the location is within the current view
                   * and we could be following but are not. Defaults to a special value which inherits from 'inView';
                   */
                  inViewNotFollowing: 'inView',
              },
              /**
               * If set, save the map bounds just before centering to the user's
               * location. When control is disabled, set the view back to the
               * bounds that were saved.
               */
              returnToPrevBounds: false,
              /**
               * Keep a cache of the location after the user deactivates the control. If set to false, the user has to wait
               * until the locate API returns a new location before they see where they are again.
               */
              cacheLocation: true,
              /** If set, a circle that shows the location accuracy is drawn. */
              drawCircle: true,
              /** If set, the marker at the users' location is drawn. */
              drawMarker: true,
              /** If set and supported then show the compass heading */
              showCompass: true,
              /** The class to be used to create the marker. For example L.CircleMarker or L.Marker */
              markerClass: LocationMarker,
              /** The class us be used to create the compass bearing arrow */
              compassClass: CompassMarker,
              /** Accuracy circle style properties. NOTE these styles should match the css animations styles */
              circleStyle: {
                  className:   'leaflet-control-locate-circle',
                  color:       '#136AEC',
                  fillColor:   '#136AEC',
                  fillOpacity: 0.15,
                  weight:      0
              },
              /** Inner marker style properties. Only works if your marker class supports `setStyle`. */
              markerStyle: {
                  className:   'leaflet-control-locate-marker',
                  color:       '#fff',
                  fillColor:   '#2A93EE',
                  fillOpacity: 1,
                  weight:      3,
                  opacity:     1,
                  radius:      9
              },
              /** Compass */
              compassStyle: {
                  fillColor:   '#2A93EE',
                  fillOpacity: 1,
                  weight:      0,
                  color:       '#fff',
                  opacity:     1,
                  radius:      9, // How far is the arrow is from the center of of the marker
                  width:       9, // Width of the arrow
                  depth:       6  // Length of the arrow
              },
              /**
               * Changes to accuracy circle and inner marker while following.
               * It is only necessary to provide the properties that should change.
               */
              followCircleStyle: {},
              followMarkerStyle: {
                  // color: '#FFA500',
                  // fillColor: '#FFB000'
              },
              followCompassStyle: {},
              /** The CSS class for the icon. For example fa-location-arrow or fa-map-marker */
              icon: 'fa fa-map-marker',
              iconLoading: 'fa fa-spinner fa-spin',
              /** The element to be created for icons. For example span or i */
              iconElementTag: 'span',
              /** Padding around the accuracy circle. */
              circlePadding: [0, 0],
              /** Use metric units. */
              metric: true,
              /**
               * This callback can be used in case you would like to override button creation behavior.
               * This is useful for DOM manipulation frameworks such as angular etc.
               * This function should return an object with HtmlElement for the button (link property) and the icon (icon property).
               */
              createButtonCallback: function (container, options) {
                  var link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single', container);
                  link.title = options.strings.title;
                  var icon = L.DomUtil.create(options.iconElementTag, options.icon, link);
                  return { link: link, icon: icon };
              },
              /** This event is called in case of any location error that is not a time out error. */
              onLocationError: function(err, control) {
                  alert(err.message);
              },
              /**
               * This event is called when the user's location is outside the bounds set on the map.
               * The event is called repeatedly when the location changes.
               */
              onLocationOutsideMapBounds: function(control) {
                  control.stop();
                  alert(control.options.strings.outsideMapBoundsMsg);
              },
              /** Display a pop-up when the user click on the inner marker. */
              showPopup: true,
              strings: {
                  title: "Show me where I am",
                  metersUnit: "meters",
                  feetUnit: "feet",
                  popup: "You are within {distance} {unit} from this point",
                  outsideMapBoundsMsg: "You seem located outside the boundaries of the map"
              },
              /** The default options passed to leaflets locate method. */
              locateOptions: {
                  maxZoom: Infinity,
                  watch: true,  // if you overwrite this, visualization cannot be updated
                  setView: false // have to set this to false because we have to
                                 // do setView manually
              }
          },

          initialize: function (options) {
              // set default options if nothing is set (merge one step deep)
              for (var i in options) {
                  if (typeof this.options[i] === 'object') {
                      L.extend(this.options[i], options[i]);
                  } else {
                      this.options[i] = options[i];
                  }
              }

              // extend the follow marker style and circle from the normal style
              this.options.followMarkerStyle = L.extend({}, this.options.markerStyle, this.options.followMarkerStyle);
              this.options.followCircleStyle = L.extend({}, this.options.circleStyle, this.options.followCircleStyle);
              this.options.followCompassStyle = L.extend({}, this.options.compassStyle, this.options.followCompassStyle);
          },

          /**
           * Add control to map. Returns the container for the control.
           */
          onAdd: function (map) {
              var container = L.DomUtil.create('div',
                  'leaflet-control-locate leaflet-bar leaflet-control');

              this._layer = this.options.layer || new L.LayerGroup();
              this._layer.addTo(map);
              this._event = undefined;
              this._compassHeading = null;
              this._prevBounds = null;

              var linkAndIcon = this.options.createButtonCallback(container, this.options);
              this._link = linkAndIcon.link;
              this._icon = linkAndIcon.icon;

              L.DomEvent
                  .on(this._link, 'click', L.DomEvent.stopPropagation)
                  .on(this._link, 'click', L.DomEvent.preventDefault)
                  .on(this._link, 'click', this._onClick, this)
                  .on(this._link, 'dblclick', L.DomEvent.stopPropagation);

              this._resetVariables();

              this._map.on('unload', this._unload, this);

              return container;
          },

          /**
           * This method is called when the user clicks on the control.
           */
          _onClick: function() {
              this._justClicked = true;
              var wasFollowing =  this._isFollowing();
              this._userPanned = false;
              this._userZoomed = false;

              if (this._active && !this._event) {
                  // click while requesting
                  this.stop();
              } else if (this._active && this._event !== undefined) {
                  var behaviors = this.options.clickBehavior;
                  var behavior = behaviors.outOfView;
                  if (this._map.getBounds().contains(this._event.latlng)) {
                      behavior = wasFollowing ? behaviors.inView : behaviors.inViewNotFollowing;
                  }

                  // Allow inheriting from another behavior
                  if (behaviors[behavior]) {
                      behavior = behaviors[behavior];
                  }

                  switch (behavior) {
                      case 'setView':
                          this.setView();
                          break;
                      case 'stop':
                          this.stop();
                          if (this.options.returnToPrevBounds) {
                              var f = this.options.flyTo ? this._map.flyToBounds : this._map.fitBounds;
                              f.bind(this._map)(this._prevBounds);
                          }
                          break;
                  }
              } else {
                  if (this.options.returnToPrevBounds) {
                    this._prevBounds = this._map.getBounds();
                  }
                  this.start();
              }

              this._updateContainerStyle();
          },

          /**
           * Starts the plugin:
           * - activates the engine
           * - draws the marker (if coordinates available)
           */
          start: function() {
              this._activate();

              if (this._event) {
                  this._drawMarker(this._map);

                  // if we already have a location but the user clicked on the control
                  if (this.options.setView) {
                      this.setView();
                  }
              }
              this._updateContainerStyle();
          },

          /**
           * Stops the plugin:
           * - deactivates the engine
           * - reinitializes the button
           * - removes the marker
           */
          stop: function() {
              this._deactivate();

              this._cleanClasses();
              this._resetVariables();

              this._removeMarker();
          },

          /**
           * Keep the control active but stop following the location
           */
          stopFollowing: function() {
              this._userPanned = true;
              this._updateContainerStyle();
              this._drawMarker();
          },

          /**
           * This method launches the location engine.
           * It is called before the marker is updated,
           * event if it does not mean that the event will be ready.
           *
           * Override it if you want to add more functionalities.
           * It should set the this._active to true and do nothing if
           * this._active is true.
           */
          _activate: function() {
              if (!this._active) {
                  this._map.locate(this.options.locateOptions);
                  this._active = true;

                  // bind event listeners
                  this._map.on('locationfound', this._onLocationFound, this);
                  this._map.on('locationerror', this._onLocationError, this);
                  this._map.on('dragstart', this._onDrag, this);
                  this._map.on('zoomstart', this._onZoom, this);
                  this._map.on('zoomend', this._onZoomEnd, this);
                  if (this.options.showCompass) {
                      if ('ondeviceorientationabsolute' in window) {
                          L.DomEvent.on(window, 'deviceorientationabsolute', this._onDeviceOrientation, this);
                      } else if ('ondeviceorientation' in window) {
                          L.DomEvent.on(window, 'deviceorientation', this._onDeviceOrientation, this);
                      }
                  }
              }
          },

          /**
           * Called to stop the location engine.
           *
           * Override it to shutdown any functionalities you added on start.
           */
          _deactivate: function() {
              this._map.stopLocate();
              this._active = false;

              if (!this.options.cacheLocation) {
                  this._event = undefined;
              }

              // unbind event listeners
              this._map.off('locationfound', this._onLocationFound, this);
              this._map.off('locationerror', this._onLocationError, this);
              this._map.off('dragstart', this._onDrag, this);
              this._map.off('zoomstart', this._onZoom, this);
              this._map.off('zoomend', this._onZoomEnd, this);
              if (this.options.showCompass) {
                  this._compassHeading = null;
                  if ('ondeviceorientationabsolute' in window) {
                      L.DomEvent.off(window, 'deviceorientationabsolute', this._onDeviceOrientation, this);
                  } else if ('ondeviceorientation' in window) {
                      L.DomEvent.off(window, 'deviceorientation', this._onDeviceOrientation, this);
                  }
              }
          },

          /**
           * Zoom (unless we should keep the zoom level) and an to the current view.
           */
          setView: function() {
              this._drawMarker();
              if (this._isOutsideMapBounds()) {
                  this._event = undefined;  // clear the current location so we can get back into the bounds
                  this.options.onLocationOutsideMapBounds(this);
              } else {
                  if (this.options.keepCurrentZoomLevel) {
                      var f = this.options.flyTo ? this._map.flyTo : this._map.panTo;
                      f.bind(this._map)([this._event.latitude, this._event.longitude]);
                  } else {
                      var f = this.options.flyTo ? this._map.flyToBounds : this._map.fitBounds;
                      // Ignore zoom events while setting the viewport as these would stop following
                      this._ignoreEvent = true;
                      f.bind(this._map)(this.options.getLocationBounds(this._event), {
                          padding: this.options.circlePadding,
                          maxZoom: this.options.locateOptions.maxZoom
                      });
                      L.Util.requestAnimFrame(function(){
                          // Wait until after the next animFrame because the flyTo can be async
                          this._ignoreEvent = false;
                      }, this);

                  }
              }
          },

          /**
           *
           */
          _drawCompass: function() {
              if (!this._event) {
                  return;
              }

              var latlng = this._event.latlng;

              if (this.options.showCompass && latlng && this._compassHeading !== null) {
                  var cStyle = this._isFollowing() ? this.options.followCompassStyle : this.options.compassStyle;
                  if (!this._compass) {
                      this._compass = new this.options.compassClass(latlng, this._compassHeading, cStyle).addTo(this._layer);
                  } else {
                      this._compass.setLatLng(latlng);
                      this._compass.setHeading(this._compassHeading);
                      // If the compassClass can be updated with setStyle, update it.
                      if (this._compass.setStyle) {
                          this._compass.setStyle(cStyle);
                      }
                  }
                  // 
              }
              if (this._compass && (!this.options.showCompass || this._compassHeading === null)) {
                  this._compass.removeFrom(this._layer);
                  this._compass = null;
              }
          },

          /**
           * Draw the marker and accuracy circle on the map.
           *
           * Uses the event retrieved from onLocationFound from the map.
           */
          _drawMarker: function() {
              if (this._event.accuracy === undefined) {
                  this._event.accuracy = 0;
              }

              var radius = this._event.accuracy;
              var latlng = this._event.latlng;

              // circle with the radius of the location's accuracy
              if (this.options.drawCircle) {
                  var style = this._isFollowing() ? this.options.followCircleStyle : this.options.circleStyle;

                  if (!this._circle) {
                      this._circle = L.circle(latlng, radius, style).addTo(this._layer);
                  } else {
                      this._circle.setLatLng(latlng).setRadius(radius).setStyle(style);
                  }
              }

              var distance, unit;
              if (this.options.metric) {
                  distance = radius.toFixed(0);
                  unit =  this.options.strings.metersUnit;
              } else {
                  distance = (radius * 3.2808399).toFixed(0);
                  unit = this.options.strings.feetUnit;
              }

              // small inner marker
              if (this.options.drawMarker) {
                  var mStyle = this._isFollowing() ? this.options.followMarkerStyle : this.options.markerStyle;
                  if (!this._marker) {
                      this._marker = new this.options.markerClass(latlng, mStyle).addTo(this._layer);
                  } else {
                      this._marker.setLatLng(latlng);
                      // If the markerClass can be updated with setStyle, update it.
                      if (this._marker.setStyle) {
                          this._marker.setStyle(mStyle);
                      }
                  }
              }

              this._drawCompass();

              var t = this.options.strings.popup;
              if (this.options.showPopup && t && this._marker) {
                  this._marker
                      .bindPopup(L.Util.template(t, {distance: distance, unit: unit}))
                      ._popup.setLatLng(latlng);
              }
              if (this.options.showPopup && t && this._compass) {
                  this._compass
                      .bindPopup(L.Util.template(t, {distance: distance, unit: unit}))
                      ._popup.setLatLng(latlng);
              }
          },

          /**
           * Remove the marker from map.
           */
          _removeMarker: function() {
              this._layer.clearLayers();
              this._marker = undefined;
              this._circle = undefined;
          },

          /**
           * Unload the plugin and all event listeners.
           * Kind of the opposite of onAdd.
           */
          _unload: function() {
              this.stop();
              this._map.off('unload', this._unload, this);
          },

          /**
           * Sets the compass heading
           */
          _setCompassHeading: function(angle) {
              if (!isNaN(parseFloat(angle)) && isFinite(angle)) {
                  angle = Math.round(angle);

                  this._compassHeading = angle;
                  L.Util.requestAnimFrame(this._drawCompass, this);
              } else {
                  this._compassHeading = null;
              }
          },

          /**
           * If the compass fails calibration just fail safely and remove the compass
           */
          _onCompassNeedsCalibration: function() {
              this._setCompassHeading();
          },

          /**
           * Process and normalise compass events
           */
          _onDeviceOrientation: function(e) {
              if (!this._active) {
                  return;
              }

              if (e.webkitCompassHeading) {
                  // iOS
                  this._setCompassHeading(e.webkitCompassHeading);
              } else if (e.absolute && e.alpha) {
                  // Android
                  this._setCompassHeading(360 - e.alpha);
              }
          },

          /**
           * Calls deactivate and dispatches an error.
           */
          _onLocationError: function(err) {
              // ignore time out error if the location is watched
              if (err.code == 3 && this.options.locateOptions.watch) {
                  return;
              }

              this.stop();
              this.options.onLocationError(err, this);
          },

          /**
           * Stores the received event and updates the marker.
           */
          _onLocationFound: function(e) {
              // no need to do anything if the location has not changed
              if (this._event &&
                  (this._event.latlng.lat === e.latlng.lat &&
                   this._event.latlng.lng === e.latlng.lng &&
                       this._event.accuracy === e.accuracy)) {
                  return;
              }

              if (!this._active) {
                  // we may have a stray event
                  return;
              }

              this._event = e;

              this._drawMarker();
              this._updateContainerStyle();

              switch (this.options.setView) {
                  case 'once':
                      if (this._justClicked) {
                          this.setView();
                      }
                      break;
                  case 'untilPan':
                      if (!this._userPanned) {
                          this.setView();
                      }
                      break;
                  case 'untilPanOrZoom':
                      if (!this._userPanned && !this._userZoomed) {
                          this.setView();
                      }
                      break;
                  case 'always':
                      this.setView();
                      break;
              }

              this._justClicked = false;
          },

          /**
           * When the user drags. Need a separate event so we can bind and unbind event listeners.
           */
          _onDrag: function() {
              // only react to drags once we have a location
              if (this._event && !this._ignoreEvent) {
                  this._userPanned = true;
                  this._updateContainerStyle();
                  this._drawMarker();
              }
          },

          /**
           * When the user zooms. Need a separate event so we can bind and unbind event listeners.
           */
          _onZoom: function() {
              // only react to drags once we have a location
              if (this._event && !this._ignoreEvent) {
                  this._userZoomed = true;
                  this._updateContainerStyle();
                  this._drawMarker();
              }
          },

          /**
           * After a zoom ends update the compass and handle sideways zooms
           */
          _onZoomEnd: function() {
              if (this._event) {
                  this._drawCompass();
              }

              if (this._event && !this._ignoreEvent) {
                  // If we have zoomed in and out and ended up sideways treat it as a pan
                  if (this._marker && !this._map.getBounds().pad(-.3).contains(this._marker.getLatLng())) {
                      this._userPanned = true;
                      this._updateContainerStyle();
                      this._drawMarker();
                  }
              }
          },

          /**
           * Compute whether the map is following the user location with pan and zoom.
           */
          _isFollowing: function() {
              if (!this._active) {
                  return false;
              }

              if (this.options.setView === 'always') {
                  return true;
              } else if (this.options.setView === 'untilPan') {
                  return !this._userPanned;
              } else if (this.options.setView === 'untilPanOrZoom') {
                  return !this._userPanned && !this._userZoomed;
              }
          },

          /**
           * Check if location is in map bounds
           */
          _isOutsideMapBounds: function() {
              if (this._event === undefined) {
                  return false;
              }
              return this._map.options.maxBounds &&
                  !this._map.options.maxBounds.contains(this._event.latlng);
          },

          /**
           * Toggles button class between following and active.
           */
          _updateContainerStyle: function() {
              if (!this._container) {
                  return;
              }

              if (this._active && !this._event) {
                  // active but don't have a location yet
                  this._setClasses('requesting');
              } else if (this._isFollowing()) {
                  this._setClasses('following');
              } else if (this._active) {
                  this._setClasses('active');
              } else {
                  this._cleanClasses();
              }
          },

          /**
           * Sets the CSS classes for the state.
           */
          _setClasses: function(state) {
              if (state == 'requesting') {
                  removeClasses(this._container, "active following");
                  addClasses(this._container, "requesting");

                  removeClasses(this._icon, this.options.icon);
                  addClasses(this._icon, this.options.iconLoading);
              } else if (state == 'active') {
                  removeClasses(this._container, "requesting following");
                  addClasses(this._container, "active");

                  removeClasses(this._icon, this.options.iconLoading);
                  addClasses(this._icon, this.options.icon);
              } else if (state == 'following') {
                  removeClasses(this._container, "requesting");
                  addClasses(this._container, "active following");

                  removeClasses(this._icon, this.options.iconLoading);
                  addClasses(this._icon, this.options.icon);
              }
          },

          /**
           * Removes all classes from button.
           */
          _cleanClasses: function() {
              L.DomUtil.removeClass(this._container, "requesting");
              L.DomUtil.removeClass(this._container, "active");
              L.DomUtil.removeClass(this._container, "following");

              removeClasses(this._icon, this.options.iconLoading);
              addClasses(this._icon, this.options.icon);
          },

          /**
           * Reinitializes state variables.
           */
          _resetVariables: function() {
              // whether locate is active or not
              this._active = false;

              // true if the control was clicked for the first time
              // we need this so we can pan and zoom once we have the location
              this._justClicked = false;

              // true if the user has panned the map after clicking the control
              this._userPanned = false;

              // true if the user has zoomed the map after clicking the control
              this._userZoomed = false;
          }
      });

      L.control.locate = function (options) {
          return new L.Control.Locate(options);
      };

      return LocateControl;
  }, window));

  (function () {

  L.Control.FullScreen = L.Control.extend({
  	options: {
  		position: 'topleft',
  		title: 'Full Screen',
  		titleCancel: 'Exit Full Screen',
  		forceSeparateButton: false,
  		forcePseudoFullscreen: false,
  		fullscreenElement: false
  	},
  	
  	onAdd: function (map) {
  		var className = 'leaflet-control-zoom-fullscreen', container, content = '';
  		
  		if (map.zoomControl && !this.options.forceSeparateButton) {
  			container = map.zoomControl._container;
  		} else {
  			container = L.DomUtil.create('div', 'leaflet-bar');
  		}
  		
  		if (this.options.content) {
  			content = this.options.content;
  		} else {
  			className += ' fullscreen-icon';
  		}

  		this._createButton(this.options.title, className, content, container, this.toggleFullScreen, this);
  		this._map.fullscreenControl = this;

  		this._map.on('enterFullscreen exitFullscreen', this._toggleTitle, this);

  		return container;
  	},
  	
  	onRemove: function (map) {
  		L.DomEvent
  			.off(this.link, 'click', L.DomEvent.stopPropagation)
  			.off(this.link, 'click', L.DomEvent.preventDefault)
  			.off(this.link, 'click', this.toggleFullScreen, this);
  		
  		L.DomEvent
  			.off(this._container, fullScreenApi.fullScreenEventName, L.DomEvent.stopPropagation)
  			.off(this._container, fullScreenApi.fullScreenEventName, L.DomEvent.preventDefault)
  			.off(this._container, fullScreenApi.fullScreenEventName, this._handleFullscreenChange, this);
  		
  		L.DomEvent
  			.off(document, fullScreenApi.fullScreenEventName, L.DomEvent.stopPropagation)
  			.off(document, fullScreenApi.fullScreenEventName, L.DomEvent.preventDefault)
  			.off(document, fullScreenApi.fullScreenEventName, this._handleFullscreenChange, this);
  	},
  	
  	_createButton: function (title, className, content, container, fn, context) {
  		this.link = L.DomUtil.create('a', className, container);
  		this.link.href = '#';
  		this.link.title = title;
  		this.link.innerHTML = content;

  		this.link.setAttribute('role', 'button');
  		this.link.setAttribute('aria-label', title);

  		L.DomEvent
  			.on(this.link, 'click', L.DomEvent.stopPropagation)
  			.on(this.link, 'click', L.DomEvent.preventDefault)
  			.on(this.link, 'click', fn, context);
  		
  		L.DomEvent
  			.on(container, fullScreenApi.fullScreenEventName, L.DomEvent.stopPropagation)
  			.on(container, fullScreenApi.fullScreenEventName, L.DomEvent.preventDefault)
  			.on(container, fullScreenApi.fullScreenEventName, this._handleFullscreenChange, context);
  		
  		L.DomEvent
  			.on(document, fullScreenApi.fullScreenEventName, L.DomEvent.stopPropagation)
  			.on(document, fullScreenApi.fullScreenEventName, L.DomEvent.preventDefault)
  			.on(document, fullScreenApi.fullScreenEventName, this._handleFullscreenChange, context);

  		return this.link;
  	},
  	
  	toggleFullScreen: function () {
  		var map = this._map;
  		map._exitFired = false;
  		if (map._isFullscreen) {
  			if (fullScreenApi.supportsFullScreen && !this.options.forcePseudoFullscreen) {
  				fullScreenApi.cancelFullScreen();
  			} else {
  				L.DomUtil.removeClass(this.options.fullscreenElement ? this.options.fullscreenElement : map._container, 'leaflet-pseudo-fullscreen');
  			}
  			map.fire('exitFullscreen');
  			map._exitFired = true;
  			map._isFullscreen = false;
  		}
  		else {
  			if (fullScreenApi.supportsFullScreen && !this.options.forcePseudoFullscreen) {
  				fullScreenApi.requestFullScreen(this.options.fullscreenElement ? this.options.fullscreenElement : map._container);
  			} else {
  				L.DomUtil.addClass(this.options.fullscreenElement ? this.options.fullscreenElement : map._container, 'leaflet-pseudo-fullscreen');
  			}
  			map.fire('enterFullscreen');
  			map._isFullscreen = true;
  		}
  	},
  	
  	_toggleTitle: function () {
  		this.link.title = this._map._isFullscreen ? this.options.title : this.options.titleCancel;
  	},
  	
  	_handleFullscreenChange: function () {
  		var map = this._map;
  		map.invalidateSize();
  		if (!fullScreenApi.isFullScreen() && !map._exitFired) {
  			map.fire('exitFullscreen');
  			map._exitFired = true;
  			map._isFullscreen = false;
  		}
  	}
  });

  L.Map.include({
  	toggleFullscreen: function () {
  		this.fullscreenControl.toggleFullScreen();
  	}
  });

  L.Map.addInitHook(function () {
  	if (this.options.fullscreenControl) {
  		this.addControl(L.control.fullscreen(this.options.fullscreenControlOptions));
  	}
  });

  L.control.fullscreen = function (options) {
  	return new L.Control.FullScreen(options);
  };

  /* 
  Native FullScreen JavaScript API
  -------------
  Assumes Mozilla naming conventions instead of W3C for now

  source : http://johndyer.name/native-fullscreen-javascript-api-plus-jquery-plugin/

  */

  	var 
  		fullScreenApi = { 
  			supportsFullScreen: false,
  			isFullScreen: function () { return false; }, 
  			requestFullScreen: function () {}, 
  			cancelFullScreen: function () {},
  			fullScreenEventName: '',
  			prefix: ''
  		},
  		browserPrefixes = 'webkit moz o ms khtml'.split(' ');
  	
  	// check for native support
  	if (typeof document.exitFullscreen !== 'undefined') {
  		fullScreenApi.supportsFullScreen = true;
  	} else {
  		// check for fullscreen support by vendor prefix
  		for (var i = 0, il = browserPrefixes.length; i < il; i++) {
  			fullScreenApi.prefix = browserPrefixes[i];
  			if (typeof document[fullScreenApi.prefix + 'CancelFullScreen'] !== 'undefined') {
  				fullScreenApi.supportsFullScreen = true;
  				break;
  			}
  		}
  		if (typeof document['msExitFullscreen'] !== 'undefined') {
  			fullScreenApi.prefix = 'ms';
  			fullScreenApi.supportsFullScreen = true;
  		}
  	}
  	
  	// update methods to do something useful
  	if (fullScreenApi.supportsFullScreen) {
  		if (fullScreenApi.prefix === 'ms') {
  			fullScreenApi.fullScreenEventName = 'MSFullscreenChange';
  		} else {
  			fullScreenApi.fullScreenEventName = fullScreenApi.prefix + 'fullscreenchange';
  		}
  		fullScreenApi.isFullScreen = function () {
  			switch (this.prefix) {
  				case '':
  					return document.fullscreen;
  				case 'webkit':
  					return document.webkitIsFullScreen;
  				case 'ms':
  					return document.msFullscreenElement;
  				default:
  					return document[this.prefix + 'FullScreen'];
  			}
  		};
  		fullScreenApi.requestFullScreen = function (el) {
  			switch (this.prefix) {
  				case '':
  					return el.requestFullscreen();
  				case 'ms':
  					return el.msRequestFullscreen();
  				default:
  					return el[this.prefix + 'RequestFullScreen']();
  			}
  		};
  		fullScreenApi.cancelFullScreen = function () {
  			switch (this.prefix) {
  				case '':
  					return document.exitFullscreen();
  				case 'ms':
  					return document.msExitFullscreen();
  				default:
  					return document[this.prefix + 'CancelFullScreen']();
  			}
  		};
  	}

  	// jQuery plugin
  	if (typeof jQuery !== 'undefined') {
  		jQuery.fn.requestFullScreen = function () {
  			return this.each(function () {
  				var el = jQuery(this);
  				if (fullScreenApi.supportsFullScreen) {
  					fullScreenApi.requestFullScreen(el);
  				}
  			});
  		};
  	}

  	// export api
  	window.fullScreenApi = fullScreenApi;
  })();

  /**
   * leaflet-pegman
   *
   * @author    Raruto
   * @license   GPL-3.0+
   * @link https://github.com/Raruto/leaflet-pegman
   * @desc Leaflet plugin that allows an easy integration with the Google StreetView Service API
   */
  L.Control.Pegman = L.Control.extend({
  	includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,
  	options: {
  		position: 'bottomright',
  		theme: "leaflet-pegman-v3-default", // or "leaflet-pegman-v3-small"
  		debug: false,
  		apiKey: '',
  		libraries: '',
  		mutant: {
  			attribution: 'Map data: &copy; <a href="https://www.google.com/intl/en/help/terms_maps.html">Google</a>',
  			pane: "overlayPane",
  			type: null, // Non-image map type (used to force a transparent background)
  		},
  		pano: {
  			enableCloseButton: true,
  		}
  	},

  	__interactURL: 'https://unpkg.com/interactjs@1.2.9/dist/interact.min.js',
  	__gmapsURL: 'https://maps.googleapis.com/maps/api/js?v=3',
  	__mutantURL: 'https://unpkg.com/leaflet.gridlayer.googlemutant@0.8.0/Leaflet.GoogleMutant.js',

  	initialize: function(options) {

  		if (typeof options.logging !== "undefined") options.debug = options.logging;

  		L.Util.setOptions(this, options);

  		// Grab Left/Right/Up/Down Direction of Mouse for Pegman Image
  		this._mousePos = {
  			direction: {},
  			old: {},
  		};

  		this._pegmanMarkerCoords = null;
  		this._streetViewCoords = null;
  		this._streetViewLayerEnabled = false;

  		this._dropzoneMapOpts = {
  			accept: '.draggable', // Only Accept Elements Matching this CSS Selector
  			overlap: 0.75, // Require a 75% Element Overlap for a Drop to be Possible
  			ondropactivate: L.bind(this.onDropZoneActivated, this),
  			ondragenter: L.bind(this.onDropZoneDragEntered, this),
  			ondragleave: L.bind(this.onDropZoneDragLeaved, this),
  			ondrop: L.bind(this.onDropZoneDropped, this),
  			ondropdeactivate: L.bind(this.onDropZoneDeactivated, this),
  		};
  		this._draggableMarkerOpts = {
  			inertia: false,
  			onmove: L.bind(this.onDraggableMove, this),
  			onend: L.bind(this.onDraggableEnd, this),
  		};

  		this._pegmanMarkerOpts = {
  			draggable: true,
  			icon: L.icon({
  				className: "pegman-marker",
  				iconSize: [52, 52],
  				iconAnchor: [26, 13],
  				iconUrl: 'data:image/png;base64,' + "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAFElEQVR4XgXAAQ0AAABAMP1L30IDCPwC/o5WcS4AAAAASUVORK5CYII=",
  			}),
  		};
  		this._lazyLoaderAdded = false;
  	},

  	onAdd: function(map) {
  		this._map = map;

  		this._container = L.DomUtil.create('div', 'leaflet-pegman pegman-control leaflet-bar');
  		this._pegman = L.DomUtil.create('div', 'pegman draggable drag-drop', this._container);
  		this._pegmanButton = L.DomUtil.create('div', 'pegman-button', this._container);
  		this._pegmanMarker = L.marker([0, 0], this._pegmanMarkerOpts);
  		this._panoDiv = this.options.panoDiv ? document.querySelector(this.options.panoDiv) : L.DomUtil.create('div', '', this._map._container);

  		L.DomUtil.addClass(this._panoDiv, 'pano-canvas');
  		L.DomUtil.addClass(this._map._container, this.options.theme);

  		L.DomEvent.disableClickPropagation(this._panoDiv);
  		// L.DomEvent.on(this._container, 'click mousedown touchstart dblclick', this._disableClickPropagation, this);
  		L.DomEvent.on(this._container, 'click mousedown dblclick', this._disableClickPropagation, this);

  		this._container.addEventListener('touchstart', this._loadScripts.bind(this, !L.Browser.touch), { once: true });
  		this._container.addEventListener('mousedown', this._loadScripts.bind(this, true), { once: true });
  		this._container.addEventListener('mouseover', this._loadScripts.bind(this, false), { once: true });


  		this._loadInteractHandlers();
  		this._loadGoogleHandlers();

  		L.DomEvent.on(document, 'mousemove', this.mouseMoveTracking, this);
  		L.DomEvent.on(document, 'keyup', this.keyUpTracking, this);

  		this._pegmanMarker.on("dragend", this.onPegmanMarkerDragged, this);
  		this._map.on("click", this.onMapClick, this);
  		this._map.on("layeradd", this.onMapLayerAdd, this);

  		return this._container;
  	},

  	onRemove: function(map) {
  		this._googleStreetViewLayer.remove();
  		this._pegmanMarker.remove();

  		L.DomUtil.remove(this._panoDiv);

  		L.DomEvent.off(document, 'mousemove', this.mouseMoveTracking, this);
  		L.DomEvent.off(document, 'keyup', this.keyUpTracking, this);
  	},

  	_log: function(args) {
  		if (this.options.debug) {
  			console.log(args);
  		}
  	},

  	_addClasses: function(el, classNames) {
  		classNames = classNames.split(" ");
  		for (var s in classNames) {
  			L.DomUtil.addClass(el, classNames[s]);
  		}
  	},

  	_removeClasses: function(el, classNames) {
  		classNames = classNames.split(" ");
  		for (var s in classNames) {
  			L.DomUtil.removeClass(el, classNames[s]);
  		}
  	},

  	_removeAttributes: function(el, attrNames) {
  		for (var a in attrNames) {
  			el.removeAttribute(attrNames[a]);
  		}
  	},

  	_insertAfter: function(targetNode, newNode) {
  		targetNode.parentNode.insertBefore(newNode, targetNode.nextSibling);
  	},

  	_translateElement: function(el, dx, dy) {
  		if (dx === false && dy === false) {
  			this._removeAttributes(this._pegman, ["style", "data-x", "data-y"]);
  		}
  		// Element's position is preserved within the data-x/data-y attributes
  		var x = (parseFloat(el.getAttribute('data-x')) || 0) + dx;
  		var y = (parseFloat(el.getAttribute('data-y')) || 0) + dy;

  		// Translate element
  		el.style.webkitTransform = el.style.transform = 'translate(' + x + 'px, ' + y + 'px)';

  		// Update position attributes
  		el.setAttribute('data-x', x);
  		el.setAttribute('data-y', y);
  	},

  	_updateClasses: function(action) {
  		switch (action) {
  			case "pegman-dragging":
  				this._removeClasses(this._pegman, "dropped");
  				this._addClasses(this._container, "dragging");
  				break;
  			case "pegman-dragged":
  				this._removeClasses(this._pegman, "can-drop dragged left right active dropped");
  				this._removeAttributes(this._pegman, ["style", "data-x", "data-y"]);
  				break;
  			case "dropzone-actived":
  				this._addClasses(this._map._container, "drop-active");
  				break;
  			case "dropzone-drag-entered":
  				this._addClasses(this._pegman, "active can-drop");
  				this._addClasses(this._map._container, "drop-target");
  				break;
  			case "dropzone-drag-leaved":
  				this._removeClasses(this._map._container, "drop-target");
  				this._removeClasses(this._pegman, "can-drop");
  				break;
  			case "dropzone-drop":
  				this._removeClasses(this._container, "dragging");
  				this._removeClasses(this._pegman, "active left right");
  				this._addClasses(this._pegman, "dropped");
  				this._removeClasses(this._pegman, "can-drop dragged left right active dropped");
  				break;
  			case "dropzone-deactivated":
  				this._removeClasses(this._pegman, "active left right");
  				this._removeClasses(this._map._container, "drop-active drop-target");
  				break;
  			case "mousemove-top":
  				this._addClasses(this._pegman, "top");
  				this._removeClasses(this._pegman, "bottom right left");
  				break;
  			case "mousemove-bottom":
  				this._addClasses(this._pegman, "bottom");
  				this._removeClasses(this._pegman, "top right left");
  				break;
  			case "mousemove-left":
  				this._addClasses(this._pegman, "left");
  				this._removeClasses(this._pegman, "right top bottom");
  				break;
  			case "mousemove-right":
  				this._addClasses(this._pegman, "right");
  				this._removeClasses(this._pegman, "left top bottom");
  				break;
  			case "pegman-added":
  				this._addClasses(this._container, "active");
  				break;
  			case "pegman-removed":
  				this._removeClasses(this._container, "active");
  				break;
  			case "streetview-shown":
  				this._addClasses(this._container, "streetview-layer-active");
  				break;
  			case "streetview-hidden":
  				this._removeClasses(this._container, "streetview-layer-active");
  				break;
  			default:
  				throw "Unhandled event:" + action;
  		}
  		this.fire("svpc_" + action);
  	},

  	onDraggableMove: function(e) {
  		this.mouseMoveTracking(e);
  		this.pegmanRemove();
  		this._updateClasses("pegman-dragging");
  		this._translateElement(this._pegman, e.dx, e.dy);
  	},

  	onDraggableEnd: function(e) {
  		this._pegmanMarkerCoords = this._map.mouseEventToLatLng(e);
  		this.pegmanAdd();
  		this._updateClasses("pegman-dragged");
  	},

  	onDropZoneActivated: function(e) {
  		this._updateClasses("dropzone-actived");
  	},

  	onDropZoneDragEntered: function(e) {
  		this.showStreetViewLayer();
  		this._updateClasses("dropzone-drag-entered");
  	},

  	onDropZoneDragLeaved: function(e) {
  		this._updateClasses("dropzone-drag-leaved");
  	},

  	onDropZoneDropped: function(e) {
  		this._updateClasses("dropzone-drop");
  		this._translateElement(this._pegman, false, false);
  	},

  	onDropZoneDeactivated: function(e) {
  		this._updateClasses("dropzone-deactivated");
  	},

  	onPegmanMarkerDragged: function(e) {
  		this._pegmanMarkerCoords = this._pegmanMarker.getLatLng();
  		this.findStreetViewData(this._pegmanMarkerCoords.lat, this._pegmanMarkerCoords.lng);
  	},

  	onMapClick: function(e) {
  		if (this._streetViewLayerEnabled)
  			this.findStreetViewData(e.latlng.lat, e.latlng.lng);
  	},

  	onMapLayerAdd: function(e) {
  		if (this._googleStreetViewLayer)
  			this._googleStreetViewLayer.bringToFront();
  	},

  	onStreetViewPanoramaClose: function() {
  		this.clear();
  	},

  	clear: function() {
  		this.pegmanRemove();
  		this.hideStreetViewLayer();
  		this.closeStreetViewPanorama();
  	},

  	toggleStreetViewLayer: function(e) {
  		if (this._streetViewLayerEnabled) this.clear();
  		else this.showStreetViewLayer();
  		this._log("streetview-layer-toggled");
  	},

  	pegmanAdd: function() {
  		this._pegmanMarker.addTo(this._map);
  		this._pegmanMarker.setLatLng(this._pegmanMarkerCoords);
  		this.findStreetViewData(this._pegmanMarkerCoords.lat, this._pegmanMarkerCoords.lng);
  		this._updateClasses("pegman-added");
  	},

  	pegmanRemove: function() {
  		this._pegmanMarker.removeFrom(this._map);
  		this._updateClasses("pegman-removed");
  	},

  	closeStreetViewPanorama: function() {
  		this._panoDiv.style.display = "none";
  	},

  	openStreetViewPanorama: function() {
  		this._panoDiv.style.display = "block";
  	},

  	hideStreetViewLayer: function() {
  		if (this._googleStreetViewLayer) {
  			this._googleStreetViewLayer.removeFrom(this._map);
  			this._streetViewLayerEnabled = false;
  			this._updateClasses("streetview-hidden");
  		}
  	},

  	showStreetViewLayer: function() {
  		if (this._googleStreetViewLayer) {
  			this._googleStreetViewLayer.addTo(this._map);
  			this._streetViewLayerEnabled = true;
  			this._updateClasses("streetview-shown");
  		}
  	},

  	findStreetViewData: function(lat, lng) {
  		this._streetViewCoords = new google.maps.LatLng(lat, lng);
  		var zoom = this._map.getZoom();
  		var searchRadius = 100;

  		if (zoom < 6) searchRadius = 5000;
  		else if (zoom < 10) searchRadius = 500;
  		else if (zoom < 15) searchRadius = 250;
  		else if (zoom >= 17) searchRadius = 50;
  		else searchRadius = 100;

  		this._streetViewService.getPanoramaByLocation(this._streetViewCoords, searchRadius, L.bind(this.processStreetViewServiceData, this));
  	},

  	processStreetViewServiceData: function(data, status) {
  		if (status == google.maps.StreetViewStatus.OK) {
  			this.openStreetViewPanorama();
  			this._panorama.setPano(data.location.pano);
  			this._panorama.setPov({
  				heading: google.maps.geometry.spherical.computeHeading(data.location.latLng, this._streetViewCoords),
  				pitch: 0,
  				zoom: 0
  			});
  			this._panorama.setVisible(true);
  		} else {
  			console.warn("Street View data not found for this location.");
  			// this.clear(); // TODO: add a visual feedback when no SV data available
  		}
  	},

  	/**
  	 * mouseMoveTracking
  	 * @desc internal function used to style pegman while dragging
  	 */
  	mouseMoveTracking: function(e) {
  		var mousePos = this._mousePos;

  		// Top <--> Bottom
  		if (e.pageY < mousePos.old.y) {
  			mousePos.direction.y = 'top';
  			this._updateClasses("mousemove-top");
  		} else if (e.pageY > mousePos.old.y) {
  			mousePos.direction.y = 'bottom';
  			this._updateClasses("mousemove-bottom");
  		}
  		// Left <--> Right
  		if (e.pageX < mousePos.old.x) {
  			mousePos.direction.x = 'left';
  			this._updateClasses("mousemove-left");
  		} else if (e.pageX > mousePos.old.x) {
  			mousePos.direction.x = 'right';
  			this._updateClasses("mousemove-right");
  		}

  		mousePos.old.x = e.pageX;
  		mousePos.old.y = e.pageY;
  	},

  	/**
  	 * keyUpTracking
  	 * @desc internal function used to track keyup events
  	 */
  	keyUpTracking: function(e) {
  		if (e.keyCode == 27) {
  			this._log('escape pressed');
  			this.clear();
  		}
  	},

  	_disableClickPropagation: function(e) {
  		L.DomEvent.stopPropagation(e);
  		L.DomEvent.preventDefault(e);
  	},

  	_loadGoogleHandlers: function(toggleStreetView) {
  		if (typeof google !== 'object' || typeof google.maps !== 'object' || typeof L.GridLayer.GoogleMutant !== 'function') return;
  		this._initGoogleMaps(toggleStreetView);
  		this._initMouseTracker();
  	},

  	_initGoogleMaps: function(toggleStreetView) {
  		this._googleStreetViewLayer = L.gridLayer.googleMutant(this.options.mutant);
  		this._googleStreetViewLayer.addGoogleLayer('StreetViewCoverageLayer');

  		this._panorama = new google.maps.StreetViewPanorama(this._panoDiv, this.options.pano);
  		this._streetViewService = new google.maps.StreetViewService();

  		google.maps.event.addListener(this._panorama, 'closeclick', L.bind(this.onStreetViewPanoramaClose, this));

  		if (toggleStreetView) {
  			this.showStreetViewLayer();
  		}
  	},

  	_initMouseTracker: function() {
  		if (!this._googleStreetViewLayer) return;

  		var tileSize = this._googleStreetViewLayer.getTileSize();

  		this.tileWidth = tileSize.x;
  		this.tileHeight = tileSize.y;

  		this.defaultDraggableCursor = this._map._container.style.cursor;

  		this._map.on("mousemove", this._setMouseCursor, this);
  	},

  	_setMouseCursor: function(e) {
  		var coords = this._getTileCoords(e.latlng.lat, e.latlng.lng, this._map.getZoom());
  		var img = this._getTileImage(coords);
  		var pixel = this._getTilePixelPoint(img, e.originalEvent);
  		var hasTileData = this._hasTileData(img, pixel);
  		this._map._container.style.cursor = hasTileData ? 'pointer' : this.defaultDraggableCursor;
  	},

  	_getTileCoords: function(lat, lon, zoom) {
  		var xtile = parseInt(Math.floor((lon + 180) / 360 * (1 << zoom)));
  		var ytile = parseInt(Math.floor((1 - Math.log(Math.tan(this._toRad(lat)) + 1 / Math.cos(this._toRad(lat))) / Math.PI) / 2 * (1 << zoom)));
  		return {
  			x: xtile,
  			y: ytile,
  			z: zoom,
  		};
  	},

  	_getTileImage: function(coords) {
  		if (!this._googleStreetViewLayer || !this._googleStreetViewLayer._tiles) return;
  		var key = this._googleStreetViewLayer._tileCoordsToKey(coords);
  		var tile = this._googleStreetViewLayer._tiles[key];
  		if (!tile) return;
  		var img = tile.el.querySelector('img');
  		if (!img) return;
  		this._downloadTile(img.src, this._tileLoaded); // crossOrigin = "Anonymous"
  		return img;
  	},

  	_getTilePixelPoint: function(img, e) {
  		if (!img) return;
  		var imgRect = img.getBoundingClientRect();
  		var imgPos = {
  			pageY: (imgRect.top + window.scrollY).toFixed(0),
  			pageX: (imgRect.left + window.scrollX).toFixed(0)
  		};
  		var mousePos = {
  			x: e.pageX - imgPos.pageX,
  			y: e.pageY - imgPos.pageY
  		};
  		return mousePos;
  	},

  	_hasTileData: function(img, pixelPoint) {
  		if (!this.tileContext || !pixelPoint) return;
  		var pixelData = this.tileContext.getImageData(pixelPoint.x, pixelPoint.y, 1, 1).data;
  		var alpha = pixelData[3];
  		var hasTileData = (alpha != 0);
  		return hasTileData;
  	},

  	_toRad: function(number) {
  		return number * Math.PI / 180;
  	},

  	_downloadTile: function(imageSrc, callback) {
  		if (!imageSrc) return;
  		var img = new Image();
  		img.crossOrigin = "Anonymous";
  		img.addEventListener("load", callback.bind(this, img), false);
  		img.src = imageSrc;
  	},

  	_tileLoaded: function(img) {
  		this.tileCanvas = document.createElement("canvas");
  		this.tileContext = this.tileCanvas.getContext("2d");

  		this.tileCanvas.width = this.tileWidth;
  		this.tileCanvas.height = this.tileHeight;

  		this.tileContext.drawImage(img, 0, 0);
  	},

  	_loadInteractHandlers: function() {
  		// TODO: trying to replace "interact.js" with default "L.Draggable" object
  		// var draggable = new L.Draggable(this._container);
  		// draggable.enable();
  		// draggable.on('drag', function(e) { console.log(e); });
  		if (typeof interact !== 'function') return;

  		// Enable Draggable Element to be Dropped into Map Container
  		this._draggable = interact(this._pegman).draggable(this._draggableMarkerOpts);
  		this._dropzone = interact(this._map._container).dropzone(this._dropzoneMapOpts);

  		this._draggable.styleCursor(false);

  		// Toggle on/off SV Layer on Pegman's Container single clicks
  		interact(this._container).on("tap", L.bind(this.toggleStreetViewLayer, this));

  		// Prevent map drags (Desktop / Mobile) while dragging pegman control
  		L.DomEvent.on(this._container, "touchstart", function(e) { this._map.dragging.disable(); }, this);
  		L.DomEvent.on(this._container, "touchend", function(e) { this._map.dragging.enable(); }, this);
  	},

  	_loadScripts: function(toggleStreetView) {
  		if (this._lazyLoaderAdded) return;
  		this._lazyLoaderAdded = true;

  		this._loadJS(this.__interactURL, this._loadInteractHandlers.bind(this), typeof interact !== 'function');
  		this._loadJS(this.__gmapsURL + '&key=' + this.options.apiKey + '&libraries=' + this.options.libraries + '&callback=?', this._loadGoogleHandlers.bind(this, toggleStreetView), typeof google !== 'object' || typeof google.maps !== 'object');
  		this._loadJS(this.__mutantURL, this._loadGoogleHandlers.bind(this, toggleStreetView), typeof L.GridLayer.GoogleMutant !== 'function');

  	},

  	_loadJS: function(url, callback, condition) {
  		if (!condition) {
  			callback();
  			return;
  		}
  		if (url.indexOf('callback=?') !== -1) {
  			this._jsonp(url, callback);
  		} else {
  			var script = document.createElement('script');
  			script.src = url;
  			var loaded = function() {
  				script.onload = script.onreadystatechange = null;
  				this._log(url + " loaded");
  				callback();
  			}.bind(this);
  			script.onload = script.onreadystatechange = loaded;

  			var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
  			head.insertBefore(script, head.firstChild);
  		}
  	},

  	_jsonp: function(url, callback, params) {
  		var query = url.indexOf('?') === -1 ? '?' : '&';
  		params = params || {};
  		for (var key in params) {
  			if (params.hasOwnProperty(key)) {
  				query += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&';
  			}
  		}

  		var timestamp = new Date().getUTCMilliseconds();
  		var jsonp = "json_call_" + timestamp; // uniqueId('json_call');
  		window[jsonp] = function(data) {
  			callback(data);
  			window[jsonp] = undefined;
  		};

  		var script = document.createElement('script');
  		if (url.indexOf('callback=?') !== -1) {
  			script.src = url.replace('callback=?', 'callback=' + jsonp) + query.slice(0, -1);
  		} else {
  			script.src = url + query + 'callback=' + jsonp;
  		}
  		var loaded = function() {
  			if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
  				script.onload = script.onreadystatechange = null;
  				if (script && script.parentNode) {
  					script.parentNode.removeChild(script);
  				}
  			}
  		};
  		script.async = true;
  		script.onload = script.onreadystatechange = loaded;
  		var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
  		// Use insertBefore instead of appendChild to circumvent an IE6 bug.
  		// This arises when a base node is used.
  		head.insertBefore(script, head.firstChild);
  	},

  });

  L.control.pegman = function(options) {
  	return new L.Control.Pegman(options);
  };

  !function(t,a){"object"==typeof exports&&"undefined"!=typeof module?a(exports):"function"==typeof define&&define.amd?define("leaflet-gesture-handling",["exports"],a):a((t=t||self)["leaflet-gesture-handling"]={});}(undefined,function(t){var e={ar:{touch:"استخدم إصبعين لتحريك الخريطة",scroll:"‏استخدم ctrl + scroll لتصغير/تكبير الخريطة",scrollMac:"يمكنك استخدام ⌘ + التمرير لتكبير/تصغير الخريطة"},bg:{touch:"Използвайте два пръста, за да преместите картата",scroll:"Задръжте бутона Ctrl натиснат, докато превъртате, за да промените мащаба на картата",scrollMac:"Задръжте бутона ⌘ натиснат, докато превъртате, за да промените мащаба на картата"},bn:{touch:"মানচিত্রটিকে সরাতে দুটি আঙ্গুল ব্যবহার করুন",scroll:"ম্যাপ জুম করতে ctrl + scroll ব্যবহার করুন",scrollMac:"ম্যাপে জুম করতে ⌘ বোতাম টিপে স্ক্রল করুন"},ca:{touch:"Fes servir dos dits per moure el mapa",scroll:"Prem la tecla Control mentre et desplaces per apropar i allunyar el mapa",scrollMac:"Prem la tecla ⌘ mentre et desplaces per apropar i allunyar el mapa"},cs:{touch:"K posunutí mapy použijte dva prsty",scroll:"Velikost zobrazení mapy změňte podržením klávesy Ctrl a posouváním kolečka myši",scrollMac:"Velikost zobrazení mapy změníte podržením klávesy ⌘ a posunutím kolečka myši / touchpadu"},da:{touch:"Brug to fingre til at flytte kortet",scroll:"Brug ctrl + rullefunktionen til at zoome ind og ud på kortet",scrollMac:"Brug ⌘ + rullefunktionen til at zoome ind og ud på kortet"},de:{touch:"Verschieben der Karte mit zwei Fingern",scroll:"Verwende Strg+Scrollen zum Zoomen der Karte",scrollMac:"⌘"},el:{touch:"Χρησιμοποιήστε δύο δάχτυλα για μετακίνηση στον χάρτη",scroll:"Χρησιμοποιήστε το πλήκτρο Ctrl και κύλιση, για να μεγεθύνετε τον χάρτη",scrollMac:"Χρησιμοποιήστε το πλήκτρο ⌘ + κύλιση για εστίαση στον χάρτη"},en:{touch:"Use two fingers to move the map",scroll:"Use ctrl + scroll to zoom the map",scrollMac:"Use ⌘ + scroll to zoom the map"},"en-AU":{touch:"Use two fingers to move the map",scroll:"Use ctrl + scroll to zoom the map",scrollMac:"Use ⌘ + scroll to zoom the map"},"en-GB":{touch:"Use two fingers to move the map",scroll:"Use ctrl + scroll to zoom the map",scrollMac:"Use ⌘ + scroll to zoom the map"},es:{touch:"Para mover el mapa, utiliza dos dedos",scroll:"Mantén pulsada la tecla Ctrl mientras te desplazas para acercar o alejar el mapa",scrollMac:"Mantén pulsada la tecla ⌘ mientras te desplazas para acercar o alejar el mapa"},eu:{touch:"Erabili bi hatz mapa mugitzeko",scroll:"Mapan zooma aplikatzeko, sakatu Ktrl eta egin gora edo behera",scrollMac:"Eduki sakatuta ⌘ eta egin gora eta behera mapa handitu eta txikitzeko"},fa:{touch:"برای حرکت دادن نقشه از دو انگشت استفاده کنید.",scroll:"‏برای بزرگ‌نمایی نقشه از ctrl + scroll استفاده کنید",scrollMac:"برای بزرگ‌نمایی نقشه، از ⌘ + پیمایش استفاده کنید."},fi:{touch:"Siirrä karttaa kahdella sormella.",scroll:"Zoomaa karttaa painamalla Ctrl-painiketta ja vierittämällä.",scrollMac:"Zoomaa karttaa pitämällä painike ⌘ painettuna ja vierittämällä."},fil:{touch:"Gumamit ng dalawang daliri upang iusog ang mapa",scroll:"Gamitin ang ctrl + scroll upang i-zoom ang mapa",scrollMac:"Gamitin ang ⌘ + scroll upang i-zoom ang mapa"},fr:{touch:"Utilisez deux doigts pour déplacer la carte",scroll:"Vous pouvez zoomer sur la carte à l'aide de CTRL+Molette de défilement",scrollMac:"Vous pouvez zoomer sur la carte à l'aide de ⌘+Molette de défilement"},gl:{touch:"Utiliza dous dedos para mover o mapa",scroll:"Preme Ctrl mentres te desprazas para ampliar o mapa",scrollMac:"Preme ⌘ e desprázate para ampliar o mapa"},gu:{touch:"નકશો ખસેડવા બે આંગળીઓનો ઉપયોગ કરો",scroll:"નકશાને ઝૂમ કરવા માટે ctrl + સ્ક્રોલનો ઉપયોગ કરો",scrollMac:"નકશાને ઝૂમ કરવા ⌘ + સ્ક્રોલનો ઉપયોગ કરો"},hi:{touch:"मैप एक जगह से दूसरी जगह ले जाने के लिए दो उंगलियों का इस्तेमाल करें",scroll:"मैप को ज़ूम करने के लिए ctrl + स्क्रोल का उपयोग करें",scrollMac:"मैप को ज़ूम करने के लिए ⌘ + स्क्रोल का उपयोग करें"},hr:{touch:"Pomičite kartu pomoću dva prsta",scroll:"Upotrijebite Ctrl i klizač miša da biste zumirali kartu",scrollMac:"Upotrijebite gumb ⌘ dok se pomičete za zumiranje karte"},hu:{touch:"Két ujjal mozgassa a térképet",scroll:"A térkép a ctrl + görgetés használatával nagyítható",scrollMac:"A térkép a ⌘ + görgetés használatával nagyítható"},id:{touch:"Gunakan dua jari untuk menggerakkan peta",scroll:"Gunakan ctrl + scroll untuk memperbesar atau memperkecil peta",scrollMac:"Gunakan ⌘ + scroll untuk memperbesar atau memperkecil peta"},it:{touch:"Utilizza due dita per spostare la mappa",scroll:"Utilizza CTRL + scorrimento per eseguire lo zoom della mappa",scrollMac:"Utilizza ⌘ + scorrimento per eseguire lo zoom della mappa"},iw:{touch:"הזז את המפה באמצעות שתי אצבעות",scroll:"‏אפשר לשנות את מרחק התצוגה במפה באמצעות מקש ctrl וגלילה",scrollMac:"אפשר לשנות את מרחק התצוגה במפה באמצעות מקש ⌘ וגלילה"},ja:{touch:"地図を移動させるには指 2 本で操作します",scroll:"地図をズームするには、Ctrl キーを押しながらスクロールしてください",scrollMac:"地図をズームするには、⌘ キーを押しながらスクロールしてください"},kn:{touch:"Use two fingers to move the map",scroll:"Use Ctrl + scroll to zoom the map",scrollMac:"Use ⌘ + scroll to zoom the map"},ko:{touch:"지도를 움직이려면 두 손가락을 사용하세요.",scroll:"지도를 확대/축소하려면 Ctrl을 누른 채 스크롤하세요.",scrollMac:"지도를 확대하려면 ⌘ + 스크롤 사용"},lt:{touch:"Perkelkite žemėlapį dviem pirštais",scroll:"Slinkite nuspaudę klavišą „Ctrl“, kad pakeistumėte žemėlapio mastelį",scrollMac:"Paspauskite klavišą ⌘ ir slinkite, kad priartintumėte žemėlapį"},lv:{touch:"Lai pārvietotu karti, bīdiet to ar diviem pirkstiem",scroll:"Kartes tālummaiņai izmantojiet ctrl + ritināšanu",scrollMac:"Lai veiktu kartes tālummaiņu, izmantojiet ⌘ + ritināšanu"},ml:{touch:"മാപ്പ് നീക്കാൻ രണ്ട് വിരലുകൾ ഉപയോഗിക്കുക",scroll:"കൺട്രോൾ + സ്‌ക്രോൾ ഉപയോഗിച്ച് ‌മാപ്പ് ‌സൂം ചെയ്യുക",scrollMac:"⌘ + സ്‌ക്രോൾ ഉപയോഗിച്ച് ‌മാപ്പ് ‌സൂം ചെയ്യുക"},mr:{touch:"नकाशा हलविण्यासाठी दोन बोटे वापरा",scroll:"नकाशा झूम करण्यासाठी ctrl + scroll वापरा",scrollMac:"नकाशावर झूम करण्यासाठी ⌘ + स्क्रोल वापरा"},nl:{touch:"Gebruik twee vingers om de kaart te verplaatsen",scroll:"Gebruik Ctrl + scrollen om in- en uit te zoomen op de kaart",scrollMac:"Gebruik ⌘ + scrollen om in en uit te zoomen op de kaart"},no:{touch:"Bruk to fingre for å flytte kartet",scroll:"Hold ctrl-tasten inne og rull for å zoome på kartet",scrollMac:"Hold inne ⌘-tasten og rull for å zoome på kartet"},pl:{touch:"Przesuń mapę dwoma palcami",scroll:"Naciśnij CTRL i przewiń, by przybliżyć mapę",scrollMac:"Naciśnij ⌘ i przewiń, by przybliżyć mapę"},pt:{touch:"Use dois dedos para mover o mapa",scroll:"Pressione Ctrl e role a tela simultaneamente para aplicar zoom no mapa",scrollMac:"Use ⌘ e role a tela simultaneamente para aplicar zoom no mapa"},"pt-BR":{touch:"Use dois dedos para mover o mapa",scroll:"Pressione Ctrl e role a tela simultaneamente para aplicar zoom no mapa",scrollMac:"Use ⌘ e role a tela simultaneamente para aplicar zoom no mapa"},"pt-PT":{touch:"Utilize dois dedos para mover o mapa",scroll:"Utilizar ctrl + deslocar para aumentar/diminuir zoom do mapa",scrollMac:"Utilize ⌘ + deslocar para aumentar/diminuir o zoom do mapa"},ro:{touch:"Folosiți două degete pentru a deplasa harta",scroll:"Apăsați tasta ctrl și derulați simultan pentru a mări harta",scrollMac:"Folosiți ⌘ și derulați pentru a mări/micșora harta"},ru:{touch:"Чтобы переместить карту, проведите по ней двумя пальцами",scroll:"Чтобы изменить масштаб, прокручивайте карту, удерживая клавишу Ctrl.",scrollMac:"Чтобы изменить масштаб, нажмите ⌘ + прокрутка"},sk:{touch:"Mapu môžete posunúť dvoma prstami",scroll:"Ak chcete priblížiť mapu, stlačte kláves ctrl a posúvajte",scrollMac:"Ak chcete priblížiť mapu, stlačte kláves ⌘ a posúvajte kolieskom myši"},sl:{touch:"Premaknite zemljevid z dvema prstoma",scroll:"Zemljevid povečate tako, da držite tipko Ctrl in vrtite kolesce na miški",scrollMac:"Uporabite ⌘ + funkcijo pomika, da povečate ali pomanjšate zemljevid"},sr:{touch:"Мапу померајте помоћу два прста",scroll:"Притисните ctrl тастер док померате да бисте зумирали мапу",scrollMac:"Притисните тастер ⌘ док померате да бисте зумирали мапу"},sv:{touch:"Använd två fingrar för att flytta kartan",scroll:"Använd ctrl + rulla för att zooma kartan",scrollMac:"Använd ⌘ + rulla för att zooma på kartan"},ta:{touch:"மேப்பை நகர்த்த இரண்டு விரல்களைப் பயன்படுத்தவும்",scroll:"மேப்பை பெரிதாக்கி/சிறிதாக்கிப் பார்க்க, ctrl பட்டனைப் பிடித்தபடி, மேலே/கீழே ஸ்க்ரால் செய்யவும்",scrollMac:"மேப்பை பெரிதாக்கி/சிறிதாக்கிப் பார்க்க, ⌘ பட்டனைப் பிடித்தபடி, மேலே/கீழே ஸ்க்ரால் செய்யவும்"},te:{touch:"మ్యాప్‌ని తరలించడం కోసం రెండు వేళ్లను ఉపయోగించండి",scroll:"మ్యాప్‌ని జూమ్ చేయడానికి ctrl బటన్‌ను నొక్కి ఉంచి, స్క్రోల్ చేయండి",scrollMac:"మ్యాప్ జూమ్ చేయాలంటే ⌘ + స్క్రోల్ ఉపయోగించండి"},th:{touch:"ใช้ 2 นิ้วเพื่อเลื่อนแผนที่",scroll:"กด Ctrl ค้างไว้ แล้วเลื่อนหน้าจอเพื่อซูมแผนที่",scrollMac:"กด ⌘ แล้วเลื่อนหน้าจอเพื่อซูมแผนที่"},tl:{touch:"Gumamit ng dalawang daliri upang iusog ang mapa",scroll:"Gamitin ang ctrl + scroll upang i-zoom ang mapa",scrollMac:"Gamitin ang ⌘ + scroll upang i-zoom ang mapa"},tr:{touch:"Haritada gezinmek için iki parmağınızı kullanın",scroll:"Haritayı yakınlaştırmak için ctrl + kaydırma kombinasyonunu kullanın",scrollMac:"Haritayı yakınlaştırmak için ⌘ tuşuna basıp ekranı kaydırın"},uk:{touch:"Переміщуйте карту двома пальцями",scroll:"Щоб змінювати масштаб карти, прокручуйте коліщатко миші, утримуючи клавішу Ctrl",scrollMac:"Щоб змінити масштаб карти, використовуйте ⌘ + прокручування"},vi:{touch:"Sử dụng hai ngón tay để di chuyển bản đồ",scroll:"Sử dụng ctrl + cuộn để thu phóng bản đồ",scrollMac:"Sử dụng ⌘ + cuộn để thu phóng bản đồ"},"zh-CN":{touch:"使用双指移动地图",scroll:"按住 Ctrl 并滚动鼠标滚轮才可缩放地图",scrollMac:"按住 ⌘ 并滚动鼠标滚轮才可缩放地图"},"zh-TW":{touch:"同時以兩指移動地圖",scroll:"按住 ctrl 鍵加上捲動滑鼠可以縮放地圖",scrollMac:"按 ⌘ 加上滾動捲軸可以縮放地圖"}},a=!1,l={text:{},duration:1700},o=L.Handler.extend({_isScrolling:!1,_isTouching:!1,_isFading:!1,addHooks:function(){this._handleTouch=L.bind(this._handleTouch,this),this._setGestureHandlingOptions(),this._disableInteractions(),this._map._container.addEventListener("touchstart",this._handleTouch),this._map._container.addEventListener("touchmove",this._handleTouch),this._map._container.addEventListener("touchend",this._handleTouch),this._map._container.addEventListener("touchcancel",this._handleTouch),this._map._container.addEventListener("click",this._handleTouch),L.DomEvent.on(this._map._container,"mousewheel",this._handleScroll,this),L.DomEvent.on(this._map,"mouseover",this._handleMouseOver,this),L.DomEvent.on(this._map,"mouseout",this._handleMouseOut,this),L.DomEvent.on(this._map,"movestart",this._handleDragging,this),L.DomEvent.on(this._map,"move",this._handleDragging,this),L.DomEvent.on(this._map,"moveend",this._handleDragging,this),L.DomEvent.off(this._map,"enterFullscreen",this._onEnterFullscreen,this),L.DomEvent.off(this._map,"exitFullscreen",this._onExitFullscreen,this),L.DomEvent.on(this._map,"enterFullscreen",this._onEnterFullscreen,this),L.DomEvent.on(this._map,"exitFullscreen",this._onExitFullscreen,this),L.DomUtil.addClass(this._map._container,"leaflet-gesture-handling");},removeHooks:function(){this._enableInteractions(),this._map._container.removeEventListener("touchstart",this._handleTouch),this._map._container.removeEventListener("touchmove",this._handleTouch),this._map._container.removeEventListener("touchend",this._handleTouch),this._map._container.removeEventListener("touchcancel",this._handleTouch),this._map._container.removeEventListener("click",this._handleTouch),L.DomEvent.off(this._map._container,"mousewheel",this._handleScroll,this),L.DomEvent.off(this._map,"mouseover",this._handleMouseOver,this),L.DomEvent.off(this._map,"mouseout",this._handleMouseOut,this),L.DomEvent.off(this._map,"movestart",this._handleDragging,this),L.DomEvent.off(this._map,"move",this._handleDragging,this),L.DomEvent.off(this._map,"moveend",this._handleDragging,this),L.DomUtil.removeClass(this._map._container,"leaflet-gesture-handling");},_handleDragging:function(t){"movestart"==t.type||"move"==t.type?a=!0:"moveend"==t.type&&(a=!1);},_disableInteractions:function(){this._map.dragging.disable(),this._map.scrollWheelZoom.disable(),this._map.tap&&this._map.tap.disable();},_enableInteractions:function(){this._map.dragging.enable(),this._map.scrollWheelZoom.enable(),this._map.tap&&this._map.tap.enable();},_enableWarning:function(t){clearTimeout(this._isFading),L.DomUtil.addClass(this._map._container,"leaflet-gesture-handling-"+t),L.DomUtil.addClass(this._map._container,"leaflet-gesture-handling-warning");},_disableWarning:function(t,a){clearTimeout(this._isFading),this._isFading=setTimeout(L.bind(function(t){L.DomUtil.removeClass(this._map._container,"leaflet-gesture-handling-"+t);},this,t),a||this._map.options.gestureHandlingOptions.duration),L.DomUtil.removeClass(this._map._container,"leaflet-gesture-handling-warning");},_isLanguageContent:function(t){return t&&t.touch&&t.scroll&&t.scrollMac},_isMacUser:function(){return 0<=navigator.platform.toUpperCase().indexOf("MAC")},_parseGestureHandlingOptions:function(){var t=L.extend(this._map.options.gestureHandlingOptions,l);return this._map.options.gestureHandlingText&&(t.text=this._map.options.gestureHandlingText),t},_setGestureHandlingOptions:function(){var t=this._parseGestureHandlingOptions(),a=this._isLanguageContent(t.text)?t.text:this._getLanguageContent(t.locale);this._map._container.setAttribute("data-gesture-handling-touch-content",a.touch),this._map._container.setAttribute("data-gesture-handling-scroll-content",a.scroll),this._touchWarning=a.touch,this._scrollWarning=a.scroll;},_getUserLanguage:function(){return navigator.languages?navigator.languages[0]:navigator.language||navigator.userLanguage},_getLanguageContent:function(t){t=t||this._getUserLanguage()||"en";var a=e[t];return (a=(a=a||-1===t.indexOf("-")?a:e[t.split("-")[0]])||e.en).scroll=this._isMacUser()?a.scrollMac:a.scroll,a},_hasClass:function(t,a){for(var e=0;e<a.length;e++)if(L.DomUtil.hasClass(t,a[e]))return !0;return !1},_handleTouch:function(t){this._hasClass(t.target,["leaflet-control-minimap","leaflet-interactive","leaflet-popup-content","leaflet-popup-content-wrapper","leaflet-popup-close-button","leaflet-control-zoom-in","leaflet-control-zoom-out"])?L.DomUtil.hasClass(t.target,"leaflet-interactive")&&"touchmove"===t.type&&1===t.touches.length?this._enableTouchWarning():this._disableTouchWarning():"touchmove"!==t.type&&"touchstart"!==t.type?this._disableTouchWarning():1===t.touches.length?this._enableTouchWarning():this._disableTouchWarning();},_enableTouchWarning:function(){this._enableWarning("touch"),this._disableInteractions();},_disableTouchWarning:function(t){clearTimeout(this._isTouching),this._isTouching=setTimeout(L.bind(function(){this._disableWarning("touch"),this._enableInteractions();},this),t||0);},_enableScrollWarning:function(){this._enableWarning("scroll"),this._map.scrollWheelZoom.disable();},_disableScrollWarning:function(t){clearTimeout(this._isScrolling),this._isScrolling=setTimeout(L.bind(function(){this._disableWarning("scroll"),this._map.scrollWheelZoom.enable();},this),t||0);},_handleScroll:function(t){t.metaKey||t.ctrlKey?(t.preventDefault(),this._disableScrollWarning()):(this._enableScrollWarning(),this._disableScrollWarning(this._map.options.gestureHandlingOptions.duration));},_handleMouseOver:function(t){this._enableInteractions();},_handleMouseOut:function(t){a||this._disableInteractions();},_onExitFullscreen:function(){this._map.options.gestureHandling&&this._map.gestureHandling.enable();},_onEnterFullscreen:function(){this._map.options.gestureHandling&&this._map.gestureHandling.disable();}});L.Map.mergeOptions({gestureHandlingOptions:l}),L.Map.addInitHook("addHandler","gestureHandling",o),t.GestureHandling=o,t.default=o,Object.defineProperty(t,"__esModule",{value:!0});});

  /**
   * leaflet-control-layers-inline
   *
   * @author    Raruto
   * @license   GPL-3.0+
   * @link https://github.com/Raruto/leaflet-control-layers-inline
   * @desc Leaflet plugin that allows to display inline layers control
   */
  (function() {

    var layersProto = L.Control.Layers.prototype;
    var initializeLayersProto = layersProto.initialize;
    var onAddLayersProto = layersProto.onAdd;

    layersProto.options.inline = false;

    L.Control.Layers.include({

      initialize: function(baseLayers, overlays, options) {
        if (options.inline) {
          options.collapsed = false;
        }
        initializeLayersProto.call(this, baseLayers, overlays, options);
      },

      onAdd: function(map) {
        onAddLayersProto.call(this, map);
        if (this.options.inline) {
          this.options.collapsed = false;
          L.DomUtil.addClass(this._container, "leaflet-control-layers-inline");
        }
        if (this.options.className) {
          L.DomUtil.addClass(this._container, this.options.className);
        }
        return this._container;
      },

    });

  })();

  (function(factory,window){if(typeof define==="function"&&define.amd){define(["leaflet"],factory);}else if(typeof exports==="object"){module.exports=factory(require("leaflet"));}if(typeof window!=="undefined"&&window.L){window.L.Control.MiniMap=factory(L);window.L.control.minimap=function(layer,options){return new window.L.Control.MiniMap(layer,options)};}})(function(L){var MiniMap=L.Control.extend({includes:L.Evented?L.Evented.prototype:L.Mixin.Events,options:{position:"bottomright",toggleDisplay:false,zoomLevelOffset:-5,zoomLevelFixed:false,centerFixed:false,zoomAnimation:false,autoToggleDisplay:false,minimized:false,width:150,height:150,collapsedWidth:19,collapsedHeight:19,aimingRectOptions:{color:"#ff7800",weight:1,clickable:false},shadowRectOptions:{color:"#000000",weight:1,clickable:false,opacity:0,fillOpacity:0},strings:{hideText:"Hide MiniMap",showText:"Show MiniMap"},mapOptions:{}},initialize:function(layer,options){L.Util.setOptions(this,options);this.options.aimingRectOptions.clickable=false;this.options.shadowRectOptions.clickable=false;this._layer=layer;},onAdd:function(map){this._mainMap=map;this._container=L.DomUtil.create("div","leaflet-control-minimap");this._container.style.width=this.options.width+"px";this._container.style.height=this.options.height+"px";L.DomEvent.disableClickPropagation(this._container);L.DomEvent.on(this._container,"mousewheel",L.DomEvent.stopPropagation);var mapOptions={attributionControl:false,dragging:!this.options.centerFixed,zoomControl:false,zoomAnimation:this.options.zoomAnimation,autoToggleDisplay:this.options.autoToggleDisplay,touchZoom:this.options.centerFixed?"center":!this._isZoomLevelFixed(),scrollWheelZoom:this.options.centerFixed?"center":!this._isZoomLevelFixed(),doubleClickZoom:this.options.centerFixed?"center":!this._isZoomLevelFixed(),boxZoom:!this._isZoomLevelFixed(),crs:map.options.crs};mapOptions=L.Util.extend(this.options.mapOptions,mapOptions);this._miniMap=new L.Map(this._container,mapOptions);this._miniMap.addLayer(this._layer);this._mainMapMoving=false;this._miniMapMoving=false;this._userToggledDisplay=false;this._minimized=false;if(this.options.toggleDisplay){this._addToggleButton();}this._miniMap.whenReady(L.Util.bind(function(){this._aimingRect=L.rectangle(this._mainMap.getBounds(),this.options.aimingRectOptions).addTo(this._miniMap);this._shadowRect=L.rectangle(this._mainMap.getBounds(),this.options.shadowRectOptions).addTo(this._miniMap);this._mainMap.on("moveend",this._onMainMapMoved,this);this._mainMap.on("move",this._onMainMapMoving,this);this._miniMap.on("movestart",this._onMiniMapMoveStarted,this);this._miniMap.on("move",this._onMiniMapMoving,this);this._miniMap.on("moveend",this._onMiniMapMoved,this);},this));return this._container},addTo:function(map){L.Control.prototype.addTo.call(this,map);var center=this.options.centerFixed||this._mainMap.getCenter();this._miniMap.setView(center,this._decideZoom(true));this._setDisplay(this.options.minimized);return this},onRemove:function(map){this._mainMap.off("moveend",this._onMainMapMoved,this);this._mainMap.off("move",this._onMainMapMoving,this);this._miniMap.off("moveend",this._onMiniMapMoved,this);this._miniMap.removeLayer(this._layer);},changeLayer:function(layer){this._miniMap.removeLayer(this._layer);this._layer=layer;this._miniMap.addLayer(this._layer);},_addToggleButton:function(){this._toggleDisplayButton=this.options.toggleDisplay?this._createButton("",this._toggleButtonInitialTitleText(),"leaflet-control-minimap-toggle-display leaflet-control-minimap-toggle-display-"+this.options.position,this._container,this._toggleDisplayButtonClicked,this):undefined;this._toggleDisplayButton.style.width=this.options.collapsedWidth+"px";this._toggleDisplayButton.style.height=this.options.collapsedHeight+"px";},_toggleButtonInitialTitleText:function(){if(this.options.minimized){return this.options.strings.showText}else{return this.options.strings.hideText}},_createButton:function(html,title,className,container,fn,context){var link=L.DomUtil.create("a",className,container);link.innerHTML=html;link.href="#";link.title=title;var stop=L.DomEvent.stopPropagation;L.DomEvent.on(link,"click",stop).on(link,"mousedown",stop).on(link,"dblclick",stop).on(link,"click",L.DomEvent.preventDefault).on(link,"click",fn,context);return link},_toggleDisplayButtonClicked:function(){this._userToggledDisplay=true;if(!this._minimized){this._minimize();}else{this._restore();}},_setDisplay:function(minimize){if(minimize!==this._minimized){if(!this._minimized){this._minimize();}else{this._restore();}}},_minimize:function(){if(this.options.toggleDisplay){this._container.style.width=this.options.collapsedWidth+"px";this._container.style.height=this.options.collapsedHeight+"px";this._toggleDisplayButton.className+=" minimized-"+this.options.position;this._toggleDisplayButton.title=this.options.strings.showText;}else{this._container.style.display="none";}this._minimized=true;this._onToggle();},_restore:function(){if(this.options.toggleDisplay){this._container.style.width=this.options.width+"px";this._container.style.height=this.options.height+"px";this._toggleDisplayButton.className=this._toggleDisplayButton.className.replace("minimized-"+this.options.position,"");this._toggleDisplayButton.title=this.options.strings.hideText;}else{this._container.style.display="block";}this._minimized=false;this._onToggle();},_onMainMapMoved:function(e){if(!this._miniMapMoving){var center=this.options.centerFixed||this._mainMap.getCenter();this._mainMapMoving=true;this._miniMap.setView(center,this._decideZoom(true));this._setDisplay(this._decideMinimized());}else{this._miniMapMoving=false;}this._aimingRect.setBounds(this._mainMap.getBounds());},_onMainMapMoving:function(e){this._aimingRect.setBounds(this._mainMap.getBounds());},_onMiniMapMoveStarted:function(e){if(!this.options.centerFixed){var lastAimingRect=this._aimingRect.getBounds();var sw=this._miniMap.latLngToContainerPoint(lastAimingRect.getSouthWest());var ne=this._miniMap.latLngToContainerPoint(lastAimingRect.getNorthEast());this._lastAimingRectPosition={sw:sw,ne:ne};}},_onMiniMapMoving:function(e){if(!this.options.centerFixed){if(!this._mainMapMoving&&this._lastAimingRectPosition){this._shadowRect.setBounds(new L.LatLngBounds(this._miniMap.containerPointToLatLng(this._lastAimingRectPosition.sw),this._miniMap.containerPointToLatLng(this._lastAimingRectPosition.ne)));this._shadowRect.setStyle({opacity:1,fillOpacity:.3});}}},_onMiniMapMoved:function(e){if(!this._mainMapMoving){this._miniMapMoving=true;this._mainMap.setView(this._miniMap.getCenter(),this._decideZoom(false));this._shadowRect.setStyle({opacity:0,fillOpacity:0});}else{this._mainMapMoving=false;}},_isZoomLevelFixed:function(){var zoomLevelFixed=this.options.zoomLevelFixed;return this._isDefined(zoomLevelFixed)&&this._isInteger(zoomLevelFixed)},_decideZoom:function(fromMaintoMini){if(!this._isZoomLevelFixed()){if(fromMaintoMini){return this._mainMap.getZoom()+this.options.zoomLevelOffset}else{var currentDiff=this._miniMap.getZoom()-this._mainMap.getZoom();var proposedZoom=this._miniMap.getZoom()-this.options.zoomLevelOffset;var toRet;if(currentDiff>this.options.zoomLevelOffset&&this._mainMap.getZoom()<this._miniMap.getMinZoom()-this.options.zoomLevelOffset){if(this._miniMap.getZoom()>this._lastMiniMapZoom){toRet=this._mainMap.getZoom()+1;this._miniMap.setZoom(this._miniMap.getZoom()-1);}else{toRet=this._mainMap.getZoom();}}else{toRet=proposedZoom;}this._lastMiniMapZoom=this._miniMap.getZoom();return toRet}}else{if(fromMaintoMini){return this.options.zoomLevelFixed}else{return this._mainMap.getZoom()}}},_decideMinimized:function(){if(this._userToggledDisplay){return this._minimized}if(this.options.autoToggleDisplay){if(this._mainMap.getBounds().contains(this._miniMap.getBounds())){return true}return false}return this._minimized},_isInteger:function(value){return typeof value==="number"},_isDefined:function(value){return typeof value!=="undefined"},_onToggle:function(){L.Util.requestAnimFrame(function(){L.DomEvent.on(this._container,"transitionend",this._fireToggleEvents,this);if(!L.Browser.any3d){L.Util.requestAnimFrame(this._fireToggleEvents,this);}},this);},_fireToggleEvents:function(){L.DomEvent.off(this._container,"transitionend",this._fireToggleEvents,this);var data={minimized:this._minimized};this.fire(this._minimized?"minimize":"restore",data);this.fire("toggle",data);}});L.Map.mergeOptions({miniMapControl:false});L.Map.addInitHook(function(){if(this.options.miniMapControl){this.miniMapControl=(new MiniMap).addTo(this);}});return MiniMap},window);

  /*
   * L.Control.Loading is a control that shows a loading indicator when tiles are
   * loading or when map-related AJAX requests are taking place.
   */

  (function () {

      var console = window.console || {
          error: function () {},
          warn: function () {}
      };

      function defineLeafletLoading(L) {
          L.Control.Loading = L.Control.extend({
              options: {
                  delayIndicator: null,
                  position: 'topleft',
                  separate: false,
                  zoomControl: null,
                  spinjs: false,
                  spin: { 
                      lines: 7, 
                      length: 3, 
                      width: 3, 
                      radius: 5, 
                      rotate: 13, 
                      top: "83%"
                  }
              },

              initialize: function(options) {
                  L.setOptions(this, options);
                  this._dataLoaders = {};

                  // Try to set the zoom control this control is attached to from the 
                  // options
                  if (this.options.zoomControl !== null) {
                      this.zoomControl = this.options.zoomControl;
                  }
              },

              onAdd: function(map) {
                  if (this.options.spinjs && (typeof Spinner !== 'function')) {
                      return console.error("Leaflet.loading cannot load because you didn't load spin.js (http://fgnass.github.io/spin.js/), even though you set it in options.");
                  }
                  this._addLayerListeners(map);
                  this._addMapListeners(map);

                  // Try to set the zoom control this control is attached to from the map
                  // the control is being added to
                  if (!this.options.separate && !this.zoomControl) {
                      if (map.zoomControl) {
                          this.zoomControl = map.zoomControl;
                      } else if (map.zoomsliderControl) {
                          this.zoomControl = map.zoomsliderControl;
                      }
                  }

                  // Create the loading indicator
                  var classes = 'leaflet-control-loading';
                  var container;
                  if (this.zoomControl && !this.options.separate) {
                      // If there is a zoom control, hook into the bottom of it
                      container = this.zoomControl._container;
                      // These classes are no longer used as of Leaflet 0.6
                      classes += ' leaflet-bar-part-bottom leaflet-bar-part last';

                      // Loading control will be added to the zoom control. So the visible last element is not the
                      // last dom element anymore. So add the part-bottom class.
                      L.DomUtil.addClass(this._getLastControlButton(), 'leaflet-bar-part-bottom');
                  }
                  else {
                      // Otherwise, create a container for the indicator
                      container = L.DomUtil.create('div', 'leaflet-control-zoom leaflet-control-layer-container leaflet-bar');
                  }
                  this._indicatorContainer = container;
                  this._indicator = L.DomUtil.create('a', classes, container);
                  if (this.options.spinjs) {
                      this._spinner = new Spinner(this.options.spin).spin();
                      this._indicator.appendChild(this._spinner.el);
                  }
                  return container;
              },

              onRemove: function(map) {
                  this._removeLayerListeners(map);
                  this._removeMapListeners(map);
              },

              removeFrom: function (map) {
                  if (this.zoomControl && !this.options.separate) {
                      // Override Control.removeFrom() to avoid clobbering the entire
                      // _container, which is the same as zoomControl's
                      this._container.removeChild(this._indicator);
                      this._map = null;
                      this.onRemove(map);
                      return this;
                  }
                  else {
                      // If this control is separate from the zoomControl, call the
                      // parent method so we don't leave behind an empty container
                      return L.Control.prototype.removeFrom.call(this, map);
                  }
              },

              addLoader: function(id) {
                  this._dataLoaders[id] = true;
                  if (this.options.delayIndicator && !this.delayIndicatorTimeout) {
                      // If we are delaying showing the indicator and we're not
                      // already waiting for that delay, set up a timeout.
                      var that = this;
                      this.delayIndicatorTimeout = setTimeout(function () {
                          that.updateIndicator();
                          that.delayIndicatorTimeout = null;
                      }, this.options.delayIndicator);
                  }
                  else {
                      // Otherwise show the indicator immediately
                      this.updateIndicator();
                  }
              },

              removeLoader: function(id) {
                  delete this._dataLoaders[id];
                  this.updateIndicator();

                  // If removing this loader means we're in no danger of loading,
                  // clear the timeout. This prevents old delays from instantly 
                  // triggering the indicator.
                  if (this.options.delayIndicator && this.delayIndicatorTimeout && !this.isLoading()) {
                      clearTimeout(this.delayIndicatorTimeout);
                      this.delayIndicatorTimeout = null;
                  }
              },

              updateIndicator: function() {
                  if (this.isLoading()) {
                      this._showIndicator();
                  }
                  else {
                      this._hideIndicator();
                  }
              },

              isLoading: function() {
                  return this._countLoaders() > 0;
              },

              _countLoaders: function() {
                  var size = 0, key;
                  for (key in this._dataLoaders) {
                      if (this._dataLoaders.hasOwnProperty(key)) size++;
                  }
                  return size;
              },

              _showIndicator: function() {
                  // Show loading indicator
                  L.DomUtil.addClass(this._indicator, 'is-loading');
                  L.DomUtil.addClass(this._indicatorContainer, 'is-loading');

                  // If zoomControl exists, make the zoom-out button not last
                  if (!this.options.separate) {
                      if (this.zoomControl instanceof L.Control.Zoom) {
                          L.DomUtil.removeClass(this._getLastControlButton(), 'leaflet-bar-part-bottom');
                      }
                      else if (typeof L.Control.Zoomslider === 'function' && this.zoomControl instanceof L.Control.Zoomslider) {
                          L.DomUtil.removeClass(this.zoomControl._ui.zoomOut, 'leaflet-bar-part-bottom');
                      }
                  }
              },

              _hideIndicator: function() {
                  // Hide loading indicator
                  L.DomUtil.removeClass(this._indicator, 'is-loading');
                  L.DomUtil.removeClass(this._indicatorContainer, 'is-loading');

                  // If zoomControl exists, make the zoom-out button last
                  if (!this.options.separate) {
                      if (this.zoomControl instanceof L.Control.Zoom) {
                          L.DomUtil.addClass(this._getLastControlButton(), 'leaflet-bar-part-bottom');
                      }
                      else if (typeof L.Control.Zoomslider === 'function' && this.zoomControl instanceof L.Control.Zoomslider) {
                          L.DomUtil.addClass(this.zoomControl._ui.zoomOut, 'leaflet-bar-part-bottom');
                      }
                  }
              },

              _getLastControlButton: function() {
                  var container = this.zoomControl._container,
                      index = container.children.length - 1;

                  // Find the last visible control button that is not our loading
                  // indicator
                  while (index > 0) {
                      var button = container.children[index];
                      if (!(this._indicator === button || button.offsetWidth === 0 || button.offsetHeight === 0)) {
                          break;
                      }
                      index--;
                  }

                  return container.children[index];
              },

              _handleLoading: function(e) {
                  this.addLoader(this.getEventId(e));
              },

              _handleBaseLayerChange: function (e) {
                  var that = this;

                  // Check for a target 'layer' that contains multiple layers, such as
                  // L.LayerGroup. This will happen if you have an L.LayerGroup in an
                  // L.Control.Layers.
                  if (e.layer && e.layer.eachLayer && typeof e.layer.eachLayer === 'function') {
                      e.layer.eachLayer(function (layer) {
                          that._handleBaseLayerChange({ layer: layer });
                      });
                  }
                  else {
                      // If we're changing to a canvas layer, don't handle loading
                      // as canvas layers will not fire load events.
                      if (!(L.TileLayer.Canvas && e.layer instanceof L.TileLayer.Canvas)) {
                          that._handleLoading(e);
                      }
                  }
              },

              _handleLoad: function(e) {
                  this.removeLoader(this.getEventId(e));
              },

              getEventId: function(e) {
                  if (e.id) {
                      return e.id;
                  }
                  else if (e.layer) {
                      return e.layer._leaflet_id;
                  }
                  return e.target._leaflet_id;
              },

              _layerAdd: function(e) {
                  if (!e.layer || !e.layer.on) return
                  try {
                      e.layer.on({
                          loading: this._handleLoading,
                          load: this._handleLoad
                      }, this);
                  }
                  catch (exception) {
                      console.warn('L.Control.Loading: Tried and failed to add ' +
                                   ' event handlers to layer', e.layer);
                      console.warn('L.Control.Loading: Full details', exception);
                  }
              },

              _layerRemove: function(e) {
                  if (!e.layer || !e.layer.off) return;
                  try {
                      e.layer.off({
                          loading: this._handleLoading,
                          load: this._handleLoad
                      }, this);
                  }
                  catch (exception) {
                      console.warn('L.Control.Loading: Tried and failed to remove ' +
                                   'event handlers from layer', e.layer);
                      console.warn('L.Control.Loading: Full details', exception);
                  }
              },

              _addLayerListeners: function(map) {
                  // Add listeners for begin and end of load to any layers already on the 
                  // map
                  map.eachLayer(function(layer) {
                      if (!layer.on) return;
                      layer.on({
                          loading: this._handleLoading,
                          load: this._handleLoad
                      }, this);
                  }, this);

                  // When a layer is added to the map, add listeners for begin and end
                  // of load
                  map.on('layeradd', this._layerAdd, this);
                  map.on('layerremove', this._layerRemove, this);
              },

              _removeLayerListeners: function(map) {
                  // Remove listeners for begin and end of load from all layers
                  map.eachLayer(function(layer) {
                      if (!layer.off) return;
                      layer.off({
                          loading: this._handleLoading,
                          load: this._handleLoad
                      }, this);
                  }, this);

                  // Remove layeradd/layerremove listener from map
                  map.off('layeradd', this._layerAdd, this);
                  map.off('layerremove', this._layerRemove, this);
              },

              _addMapListeners: function(map) {
                  // Add listeners to the map for (custom) dataloading and dataload
                  // events, eg, for AJAX calls that affect the map but will not be
                  // reflected in the above layer events.
                  map.on({
                      baselayerchange: this._handleBaseLayerChange,
                      dataloading: this._handleLoading,
                      dataload: this._handleLoad,
                      layerremove: this._handleLoad
                  }, this);
              },

              _removeMapListeners: function(map) {
                  map.off({
                      baselayerchange: this._handleBaseLayerChange,
                      dataloading: this._handleLoading,
                      dataload: this._handleLoad,
                      layerremove: this._handleLoad
                  }, this);
              }
          });

          L.Map.addInitHook(function () {
              if (this.options.loadingControl) {
                  this.loadingControl = new L.Control.Loading();
                  this.addControl(this.loadingControl);
              }
          });

          L.Control.loading = function(options) {
              return new L.Control.Loading(options);
          };
      }

      if (typeof define === 'function' && define.amd) {
          // Try to add leaflet.loading to Leaflet using AMD
          define(['leaflet'], function (L) {
              defineLeafletLoading(L);
          });
      }
      else {
          // Else use the global L
          defineLeafletLoading(L);
      }

  })();

  /* 
   * Leaflet Control Search v2.9.7 - 2019-01-14 
   * 
   * Copyright 2019 Stefano Cudini 
   * stefano.cudini@gmail.com 
   * http://labs.easyblog.it/ 
   * 
   * Licensed under the MIT license. 
   * 
   * Demo: 
   * http://labs.easyblog.it/maps/leaflet-search/ 
   * 
   * Source: 
   * git@github.com:stefanocudini/leaflet-search.git 
   * 
   */
  /*
  	Name					Data passed			   Description

  	Managed Events:
  	 search:locationfound	{latlng, title, layer} fired after moved and show markerLocation
  	 search:expanded		{}					   fired after control was expanded
  	 search:collapsed		{}					   fired after control was collapsed
   	 search:cancel			{}					   fired after cancel button clicked

  	Public methods:
  	 setLayer()				L.LayerGroup()         set layer search at runtime
  	 showAlert()            'Text message'         show alert message
  	 searchText()			'Text searched'        search text by external code
  */

  //TODO implement can do research on multiple sources layers and remote		
  //TODO history: false,		//show latest searches in tooltip		
  //FIXME option condition problem {autoCollapse: true, markerLocation: true} not show location
  //FIXME option condition problem {autoCollapse: false }
  //
  //TODO here insert function  search inputText FIRST in _recordsCache keys and if not find results.. 
  //  run one of callbacks search(sourceData,jsonpUrl or options.layer) and run this.showTooltip
  //
  //TODO change structure of _recordsCache
  //	like this: _recordsCache = {"text-key1": {loc:[lat,lng], ..other attributes.. }, {"text-key2": {loc:[lat,lng]}...}, ...}
  //	in this mode every record can have a free structure of attributes, only 'loc' is required
  //TODO important optimization!!! always append data in this._recordsCache
  //  now _recordsCache content is emptied and replaced with new data founded
  //  always appending data on _recordsCache give the possibility of caching ajax, jsonp and layersearch!
  //
  //TODO here insert function  search inputText FIRST in _recordsCache keys and if not find results.. 
  //  run one of callbacks search(sourceData,jsonpUrl or options.layer) and run this.showTooltip
  //
  //TODO change structure of _recordsCache
  //	like this: _recordsCache = {"text-key1": {loc:[lat,lng], ..other attributes.. }, {"text-key2": {loc:[lat,lng]}...}, ...}
  //	in this way every record can have a free structure of attributes, only 'loc' is required

  (function (factory) {
      if(typeof define === 'function' && define.amd) {
      //AMD
          define(['leaflet'], factory);
      } else if(typeof module !== 'undefined') {
      // Node/CommonJS
          module.exports = factory(require('leaflet'));
      } else {
      // Browser globals
          if(typeof window.L === 'undefined')
              throw 'Leaflet must be loaded first';
          factory(window.L);
      }
  })(function (L) {


  L.Control.Search = L.Control.extend({
  	
  	includes: L.version[0]==='1' ? L.Evented.prototype : L.Mixin.Events,

  	options: {
  		url: '',						//url for search by ajax request, ex: "search.php?q={s}". Can be function to returns string for dynamic parameter setting
  		layer: null,					//layer where search markers(is a L.LayerGroup)				
  		sourceData: null,				//function to fill _recordsCache, passed searching text by first param and callback in second				
  		//TODO implements uniq option 'sourceData' to recognizes source type: url,array,callback or layer				
  		jsonpParam: null,				//jsonp param name for search by jsonp service, ex: "callback"
  		propertyLoc: 'loc',				//field for remapping location, using array: ['latname','lonname'] for select double fields(ex. ['lat','lon'] ) support dotted format: 'prop.subprop.title'
  		propertyName: 'title',			//property in marker.options(or feature.properties for vector layer) trough filter elements in layer,
  		formatData: null,				//callback for reformat all data from source to indexed data object
  		filterData: null,				//callback for filtering data from text searched, params: textSearch, allRecords
  		moveToLocation: null,			//callback run on location found, params: latlng, title, map
  		buildTip: null,					//function to return row tip html node(or html string), receive text tooltip in first param
  		container: '',					//container id to insert Search Control		
  		zoom: null,						//default zoom level for move to location
  		minLength: 1,					//minimal text length for autocomplete
  		initial: true,					//search elements only by initial text
  		casesensitive: false,			//search elements in case sensitive text
  		autoType: true,					//complete input with first suggested result and select this filled-in text.
  		delayType: 400,					//delay while typing for show tooltip
  		tooltipLimit: -1,				//limit max results to show in tooltip. -1 for no limit, 0 for no results
  		tipAutoSubmit: true,			//auto map panTo when click on tooltip
  		firstTipSubmit: false,			//auto select first result con enter click
  		autoResize: true,				//autoresize on input change
  		collapsed: true,				//collapse search control at startup
  		autoCollapse: false,			//collapse search control after submit(on button or on tips if enabled tipAutoSubmit)
  		autoCollapseTime: 1200,			//delay for autoclosing alert and collapse after blur
  		textErr: 'Location not found',	//error message
  		textCancel: 'Cancel',		    //title in cancel button		
  		textPlaceholder: 'Search...',   //placeholder value			
  		hideMarkerOnCollapse: false,    //remove circle and marker on search control collapsed		
  		position: 'topleft',		
  		marker: {						//custom L.Marker or false for hide
  			icon: false,				//custom L.Icon for maker location or false for hide
  			animate: true,				//animate a circle over location found
  			circle: {					//draw a circle in location found
  				radius: 10,
  				weight: 3,
  				color: '#e03',
  				stroke: true,
  				fill: false
  			}
  		}
  	},

  	_getPath: function(obj, prop) {
  		var parts = prop.split('.'),
  			last = parts.pop(),
  			len = parts.length,
  			cur = parts[0],
  			i = 1;

  		if(len > 0)
  			while((obj = obj[cur]) && i < len)
  				cur = parts[i++];

  		if(obj)
  			return obj[last];
  	},

  	_isObject: function(obj) {
  		return Object.prototype.toString.call(obj) === "[object Object]";
  	},

  	initialize: function(options) {
  		L.Util.setOptions(this, options || {});
  		this._inputMinSize = this.options.textPlaceholder ? this.options.textPlaceholder.length : 10;
  		this._layer = this.options.layer || new L.LayerGroup();
  		this._filterData = this.options.filterData || this._defaultFilterData;
  		this._formatData = this.options.formatData || this._defaultFormatData;
  		this._moveToLocation = this.options.moveToLocation || this._defaultMoveToLocation;
  		this._autoTypeTmp = this.options.autoType;	//useful for disable autoType temporarily in delete/backspace keydown
  		this._countertips = 0;		//number of tips items
  		this._recordsCache = {};	//key,value table! to store locations! format: key,latlng
  		this._curReq = null;
  	},

  	onAdd: function (map) {
  		this._map = map;
  		this._container = L.DomUtil.create('div', 'leaflet-control-search');
  		this._input = this._createInput(this.options.textPlaceholder, 'search-input');
  		this._tooltip = this._createTooltip('search-tooltip');
  		this._cancel = this._createCancel(this.options.textCancel, 'search-cancel');
  		this._button = this._createButton(this.options.textPlaceholder, 'search-button');
  		this._alert = this._createAlert('search-alert');

  		if(this.options.collapsed===false)
  			this.expand(this.options.collapsed);

  		if(this.options.marker) {
  			
  			if(this.options.marker instanceof L.Marker || this.options.marker instanceof L.CircleMarker)
  				this._markerSearch = this.options.marker;

  			else if(this._isObject(this.options.marker))
  				this._markerSearch = new L.Control.Search.Marker([0,0], this.options.marker);

  			this._markerSearch._isMarkerSearch = true;
  		}

  		this.setLayer( this._layer );

  		map.on({
  			// 		'layeradd': this._onLayerAddRemove,
  			// 		'layerremove': this._onLayerAddRemove
  			'resize': this._handleAutoresize
  			}, this);
  		return this._container;
  	},
  	addTo: function (map) {

  		if(this.options.container) {
  			this._container = this.onAdd(map);
  			this._wrapper = L.DomUtil.get(this.options.container);
  			this._wrapper.style.position = 'relative';
  			this._wrapper.appendChild(this._container);
  		}
  		else
  			L.Control.prototype.addTo.call(this, map);

  		return this;
  	},

  	onRemove: function(map) {
  		this._recordsCache = {};
  		// map.off({
  		// 		'layeradd': this._onLayerAddRemove,
  		// 		'layerremove': this._onLayerAddRemove
  		// 	}, this);
  		map.off({
  			// 		'layeradd': this._onLayerAddRemove,
  			// 		'layerremove': this._onLayerAddRemove
  			'resize': this._handleAutoresize
  			}, this);
  	},

  	// _onLayerAddRemove: function(e) {
  	// 	//without this, run setLayer also for each Markers!! to optimize!
  	// 	if(e.layer instanceof L.LayerGroup)
  	// 		if( L.stamp(e.layer) != L.stamp(this._layer) )
  	// 			this.setLayer(e.layer);
  	// },

  	setLayer: function(layer) {	//set search layer at runtime
  		//this.options.layer = layer; //setting this, run only this._recordsFromLayer()
  		this._layer = layer;
  		this._layer.addTo(this._map);
  		return this;
  	},
  	
  	showAlert: function(text) {
  		var self = this;
  		text = text || this.options.textErr;
  		this._alert.style.display = 'block';
  		this._alert.innerHTML = text;
  		clearTimeout(this.timerAlert);
  		
  		this.timerAlert = setTimeout(function() {
  			self.hideAlert();
  		},this.options.autoCollapseTime);
  		return this;
  	},
  	
  	hideAlert: function() {
  		this._alert.style.display = 'none';
  		return this;
  	},
  		
  	cancel: function() {
  		this._input.value = '';
  		this._handleKeypress({ keyCode: 8 });//simulate backspace keypress
  		this._input.size = this._inputMinSize;
  		this._input.focus();
  		this._cancel.style.display = 'none';
  		this._hideTooltip();
  		this.fire('search:cancel');
  		return this;
  	},
  	
  	expand: function(toggle) {
  		toggle = typeof toggle === 'boolean' ? toggle : true;
  		this._input.style.display = 'block';
  		L.DomUtil.addClass(this._container, 'search-exp');
  		if ( toggle !== false ) {
  			this._input.focus();
  			this._map.on('dragstart click', this.collapse, this);
  		}
  		this.fire('search:expanded');
  		return this;	
  	},

  	collapse: function() {
  		this._hideTooltip();
  		this.cancel();
  		this._alert.style.display = 'none';
  		this._input.blur();
  		if(this.options.collapsed)
  		{
  			this._input.style.display = 'none';
  			this._cancel.style.display = 'none';			
  			L.DomUtil.removeClass(this._container, 'search-exp');		
  			if (this.options.hideMarkerOnCollapse) {
  				this._map.removeLayer(this._markerSearch);
  			}
  			this._map.off('dragstart click', this.collapse, this);
  		}
  		this.fire('search:collapsed');
  		return this;
  	},
  	
  	collapseDelayed: function() {	//collapse after delay, used on_input blur
  		var self = this;
  		if (!this.options.autoCollapse) return this;
  		clearTimeout(this.timerCollapse);
  		this.timerCollapse = setTimeout(function() {
  			self.collapse();
  		}, this.options.autoCollapseTime);
  		return this;		
  	},

  	collapseDelayedStop: function() {
  		clearTimeout(this.timerCollapse);
  		return this;		
  	},

  	////start DOM creations
  	_createAlert: function(className) {
  		var alert = L.DomUtil.create('div', className, this._container);
  		alert.style.display = 'none';

  		L.DomEvent
  			.on(alert, 'click', L.DomEvent.stop, this)
  			.on(alert, 'click', this.hideAlert, this);

  		return alert;
  	},

  	_createInput: function (text, className) {
  		var self = this;
  		var label = L.DomUtil.create('label', className, this._container);
  		var input = L.DomUtil.create('input', className, this._container);
  		input.type = 'text';
  		input.size = this._inputMinSize;
  		input.value = '';
  		input.autocomplete = 'off';
  		input.autocorrect = 'off';
  		input.autocapitalize = 'off';
  		input.placeholder = text;
  		input.style.display = 'none';
  		input.role = 'search';
  		input.id = input.role + input.type + input.size;
  		
  		label.htmlFor = input.id;
  		label.style.display = 'none';
  		label.value = text;

  		L.DomEvent
  			.disableClickPropagation(input)
  			.on(input, 'keyup', this._handleKeypress, this)
  			.on(input, 'paste', function(e) {
  				setTimeout(function(e) {
  					self._handleKeypress(e);
  				},10,e);
  			}, this)
  			.on(input, 'blur', this.collapseDelayed, this)
  			.on(input, 'focus', this.collapseDelayedStop, this);
  		
  		return input;
  	},

  	_createCancel: function (title, className) {
  		var cancel = L.DomUtil.create('a', className, this._container);
  		cancel.href = '#';
  		cancel.title = title;
  		cancel.style.display = 'none';
  		cancel.innerHTML = "<span>&otimes;</span>";//imageless(see css)

  		L.DomEvent
  			.on(cancel, 'click', L.DomEvent.stop, this)
  			.on(cancel, 'click', this.cancel, this);

  		return cancel;
  	},
  	
  	_createButton: function (title, className) {
  		var button = L.DomUtil.create('a', className, this._container);
  		button.href = '#';
  		button.title = title;

  		L.DomEvent
  			.on(button, 'click', L.DomEvent.stop, this)
  			.on(button, 'click', this._handleSubmit, this)			
  			.on(button, 'focus', this.collapseDelayedStop, this)
  			.on(button, 'blur', this.collapseDelayed, this);

  		return button;
  	},

  	_createTooltip: function(className) {
  		var self = this;		
  		var tool = L.DomUtil.create('ul', className, this._container);
  		tool.style.display = 'none';
  		L.DomEvent
  			.disableClickPropagation(tool)
  			.on(tool, 'blur', this.collapseDelayed, this)
  			.on(tool, 'mousewheel', function(e) {
  				self.collapseDelayedStop();
  				L.DomEvent.stopPropagation(e);//disable zoom map
  			}, this)
  			.on(tool, 'mouseover', function(e) {
  				self.collapseDelayedStop();
  			}, this);
  		return tool;
  	},

  	_createTip: function(text, val) {//val is object in recordCache, usually is Latlng
  		var tip;
  		
  		if(this.options.buildTip)
  		{
  			tip = this.options.buildTip.call(this, text, val); //custom tip node or html string
  			if(typeof tip === 'string')
  			{
  				var tmpNode = L.DomUtil.create('div');
  				tmpNode.innerHTML = tip;
  				tip = tmpNode.firstChild;
  			}
  		}
  		else
  		{
  			tip = L.DomUtil.create('li', '');
  			tip.innerHTML = text;
  		}
  		
  		L.DomUtil.addClass(tip, 'search-tip');
  		tip._text = text; //value replaced in this._input and used by _autoType

  		if(this.options.tipAutoSubmit)
  			L.DomEvent
  				.disableClickPropagation(tip)		
  				.on(tip, 'click', L.DomEvent.stop, this)
  				.on(tip, 'click', function(e) {
  					this._input.value = text;
  					this._handleAutoresize();
  					this._input.focus();
  					this._hideTooltip();	
  					this._handleSubmit();
  				}, this);

  		return tip;
  	},

  	//////end DOM creations

  	_getUrl: function(text) {
  		return (typeof this.options.url === 'function') ? this.options.url(text) : this.options.url;
  	},

  	_defaultFilterData: function(text, records) {
  	
  		var I, icase, regSearch, frecords = {};

  		text = text.replace(/[.*+?^${}()|[\]\\]/g, '');  //sanitize remove all special characters
  		if(text==='')
  			return [];

  		I = this.options.initial ? '^' : '';  //search only initial text
  		icase = !this.options.casesensitive ? 'i' : undefined;

  		regSearch = new RegExp(I + text, icase);

  		//TODO use .filter or .map
  		for(var key in records) {
  			if( regSearch.test(key) )
  				frecords[key]= records[key];
  		}
  		
  		return frecords;
  	},

  	showTooltip: function(records) {
  		

  		this._countertips = 0;
  		this._tooltip.innerHTML = '';
  		this._tooltip.currentSelection = -1;  //inizialized for _handleArrowSelect()

  		if(this.options.tooltipLimit)
  		{
  			for(var key in records)//fill tooltip
  			{
  				if(this._countertips === this.options.tooltipLimit)
  					break;
  				
  				this._countertips++;

  				this._tooltip.appendChild( this._createTip(key, records[key]) );
  			}
  		}
  		
  		if(this._countertips > 0)
  		{
  			this._tooltip.style.display = 'block';
  			
  			if(this._autoTypeTmp)
  				this._autoType();

  			this._autoTypeTmp = this.options.autoType;//reset default value
  		}
  		else
  			this._hideTooltip();

  		this._tooltip.scrollTop = 0;

  		return this._countertips;
  	},

  	_hideTooltip: function() {
  		this._tooltip.style.display = 'none';
  		this._tooltip.innerHTML = '';
  		return 0;
  	},

  	_defaultFormatData: function(json) {	//default callback for format data to indexed data
  		var self = this,
  			propName = this.options.propertyName,
  			propLoc = this.options.propertyLoc,
  			i, jsonret = {};

  		if( L.Util.isArray(propLoc) )
  			for(i in json)
  				jsonret[ self._getPath(json[i],propName) ]= L.latLng( json[i][ propLoc[0] ], json[i][ propLoc[1] ] );
  		else
  			for(i in json)
  				jsonret[ self._getPath(json[i],propName) ]= L.latLng( self._getPath(json[i],propLoc) );
  		//TODO throw new Error("propertyName '"+propName+"' not found in JSON data");
  		return jsonret;
  	},

  	_recordsFromJsonp: function(text, callAfter) {  //extract searched records from remote jsonp service
  		L.Control.Search.callJsonp = callAfter;
  		var script = L.DomUtil.create('script','leaflet-search-jsonp', document.getElementsByTagName('body')[0] ),			
  			url = L.Util.template(this._getUrl(text)+'&'+this.options.jsonpParam+'=L.Control.Search.callJsonp', {s: text}); //parsing url
  			//rnd = '&_='+Math.floor(Math.random()*10000);
  			//TODO add rnd param or randomize callback name! in recordsFromJsonp
  		script.type = 'text/javascript';
  		script.src = url;
  		return { abort: function() { script.parentNode.removeChild(script); } };
  	},

  	_recordsFromAjax: function(text, callAfter) {	//Ajax request
  		if (window.XMLHttpRequest === undefined) {
  			window.XMLHttpRequest = function() {
  				try { return new ActiveXObject("Microsoft.XMLHTTP.6.0"); }
  				catch  (e1) {
  					try { return new ActiveXObject("Microsoft.XMLHTTP.3.0"); }
  					catch (e2) { throw new Error("XMLHttpRequest is not supported"); }
  				}
  			};
  		}
  		var IE8or9 = ( L.Browser.ie && !window.atob && document.querySelector ),
  			request = IE8or9 ? new XDomainRequest() : new XMLHttpRequest(),
  			url = L.Util.template(this._getUrl(text), {s: text});

  		//rnd = '&_='+Math.floor(Math.random()*10000);
  		//TODO add rnd param or randomize callback name! in recordsFromAjax			
  		
  		request.open("GET", url);
  		

  		request.onload = function() {
  			callAfter( JSON.parse(request.responseText) );
  		};
  		request.onreadystatechange = function() {
  		    if(request.readyState === 4 && request.status === 200) {
  		    	this.onload();
  		    }
  		};

  		request.send();
  		return request;   
  	},

    _searchInLayer: function(layer, retRecords, propName) {
      var self = this, loc;

      if(layer instanceof L.Control.Search.Marker) return;

      if(layer instanceof L.Marker || layer instanceof L.CircleMarker)
      {
        if(self._getPath(layer.options,propName))
        {
          loc = layer.getLatLng();
          loc.layer = layer;
          retRecords[ self._getPath(layer.options,propName) ] = loc;
        }
        else if(self._getPath(layer.feature.properties,propName))
        {
          loc = layer.getLatLng();
          loc.layer = layer;
          retRecords[ self._getPath(layer.feature.properties,propName) ] = loc;
        }
        else {
          //throw new Error("propertyName '"+propName+"' not found in marker"); 
          console.warn("propertyName '"+propName+"' not found in marker"); 
        }
      }
      else if(layer instanceof L.Path || layer instanceof L.Polyline || layer instanceof L.Polygon)
      {
        if(self._getPath(layer.options,propName))
        {
          loc = layer.getBounds().getCenter();
          loc.layer = layer;
          retRecords[ self._getPath(layer.options,propName) ] = loc;
        }
        else if(self._getPath(layer.feature.properties,propName))
        {
          loc = layer.getBounds().getCenter();
          loc.layer = layer;
          retRecords[ self._getPath(layer.feature.properties,propName) ] = loc;
        }
        else {
          //throw new Error("propertyName '"+propName+"' not found in shape"); 
          console.warn("propertyName '"+propName+"' not found in shape"); 
        }
      }
      else if(layer.hasOwnProperty('feature'))//GeoJSON
      {
        if(layer.feature.properties.hasOwnProperty(propName))
        {
          if(layer.getLatLng && typeof layer.getLatLng === 'function') {
            loc = layer.getLatLng();
            loc.layer = layer;			
            retRecords[ layer.feature.properties[propName] ] = loc;
          } else if(layer.getBounds && typeof layer.getBounds === 'function') {
            loc = layer.getBounds().getCenter();
            loc.layer = layer;			
            retRecords[ layer.feature.properties[propName] ] = loc;
          } else {
            console.warn("Unknown type of Layer");
          }
        }
        else {
          //throw new Error("propertyName '"+propName+"' not found in feature");
          console.warn("propertyName '"+propName+"' not found in feature"); 
        }
      }
      else if(layer instanceof L.LayerGroup)
      {
        layer.eachLayer(function (layer) {
          self._searchInLayer(layer, retRecords, propName);
        });
      }
    },
  	
  	_recordsFromLayer: function() {	//return table: key,value from layer
  		var self = this,
  			retRecords = {},
  			propName = this.options.propertyName;
  		
  		this._layer.eachLayer(function (layer) {
  			self._searchInLayer(layer, retRecords, propName);
  		});
  		
  		return retRecords;
  	},
  	
  	_autoType: function() {
  		
  		//TODO implements autype without selection(useful for mobile device)
  		
  		var start = this._input.value.length,
  			firstRecord = this._tooltip.firstChild ? this._tooltip.firstChild._text : '',
  			end = firstRecord.length;

  		if (firstRecord.indexOf(this._input.value) === 0) { // If prefix match
  			this._input.value = firstRecord;
  			this._handleAutoresize();

  			if (this._input.createTextRange) {
  				var selRange = this._input.createTextRange();
  				selRange.collapse(true);
  				selRange.moveStart('character', start);
  				selRange.moveEnd('character', end);
  				selRange.select();
  			}
  			else if(this._input.setSelectionRange) {
  				this._input.setSelectionRange(start, end);
  			}
  			else if(this._input.selectionStart) {
  				this._input.selectionStart = start;
  				this._input.selectionEnd = end;
  			}
  		}
  	},

  	_hideAutoType: function() {	// deselect text:

  		var sel;
  		if ((sel = this._input.selection) && sel.empty) {
  			sel.empty();
  		}
  		else if (this._input.createTextRange) {
  			sel = this._input.createTextRange();
  			sel.collapse(true);
  			var end = this._input.value.length;
  			sel.moveStart('character', end);
  			sel.moveEnd('character', end);
  			sel.select();
  		}
  		else {
  			if (this._input.getSelection) {
  				this._input.getSelection().removeAllRanges();
  			}
  			this._input.selectionStart = this._input.selectionEnd;
  		}
  	},
  	
  	_handleKeypress: function (e) {	//run _input keyup event
  		var self = this;

  		switch(e.keyCode)
  		{
  			case 27://Esc
  				this.collapse();
  			break;
  			case 13://Enter
  				if(this._countertips == 1 || (this.options.firstTipSubmit && this._countertips > 0)) {
            			if(this._tooltip.currentSelection == -1) {
  						this._handleArrowSelect(1);
            			}
  				}
  				this._handleSubmit();	//do search
  			break;
  			case 38://Up
  				this._handleArrowSelect(-1);
  			break;
  			case 40://Down
  				this._handleArrowSelect(1);
  			break;
  			case  8://Backspace
  			case 45://Insert
  			case 46://Delete
  				this._autoTypeTmp = false;//disable temporarily autoType
  			break;
  			case 37://Left
  			case 39://Right
  			case 16://Shift
  			case 17://Ctrl
  			case 35://End
  			case 36://Home
  			break;
  			default://All keys
  				if(this._input.value.length)
  					this._cancel.style.display = 'block';
  				else
  					this._cancel.style.display = 'none';

  				if(this._input.value.length >= this.options.minLength)
  				{
  					clearTimeout(this.timerKeypress);	//cancel last search request while type in				
  					this.timerKeypress = setTimeout(function() {	//delay before request, for limit jsonp/ajax request

  						self._fillRecordsCache();
  					
  					}, this.options.delayType);
  				}
  				else
  					this._hideTooltip();
  		}

  		this._handleAutoresize();
  	},

  	searchText: function(text) {
  		var code = text.charCodeAt(text.length);

  		this._input.value = text;

  		this._input.style.display = 'block';
  		L.DomUtil.addClass(this._container, 'search-exp');

  		this._autoTypeTmp = false;

  		this._handleKeypress({keyCode: code});
  	},
  	
  	_fillRecordsCache: function() {

  		var self = this,
  			inputText = this._input.value, records;

  		if(this._curReq && this._curReq.abort)
  			this._curReq.abort();
  		//abort previous requests

  		L.DomUtil.addClass(this._container, 'search-load');	

  		if(this.options.layer)
  		{
  			//TODO _recordsFromLayer must return array of objects, formatted from _formatData
  			this._recordsCache = this._recordsFromLayer();
  			
  			records = this._filterData( this._input.value, this._recordsCache );

  			this.showTooltip( records );

  			L.DomUtil.removeClass(this._container, 'search-load');
  		}
  		else
  		{
  			if(this.options.sourceData)
  				this._retrieveData = this.options.sourceData;

  			else if(this.options.url)	//jsonp or ajax
  				this._retrieveData = this.options.jsonpParam ? this._recordsFromJsonp : this._recordsFromAjax;

  			this._curReq = this._retrieveData.call(this, inputText, function(data) {
  				
  				self._recordsCache = self._formatData.call(self, data);

  				//TODO refact!
  				if(self.options.sourceData)
  					records = self._filterData( self._input.value, self._recordsCache );
  				else
  					records = self._recordsCache;

  				self.showTooltip( records );
   
  				L.DomUtil.removeClass(self._container, 'search-load');
  			});
  		}
  	},
  	
  	_handleAutoresize: function() {
  	    var maxWidth;

  		if (this._input.style.maxWidth !== this._map._container.offsetWidth) {
  			maxWidth = this._map._container.clientWidth;

  			// other side margin + padding + width border + width search-button + width search-cancel
  			maxWidth -= 10 + 20 + 1 + 30 + 22; 

  			this._input.style.maxWidth = maxWidth.toString() + 'px';
  		}

  		if (this.options.autoResize && (this._container.offsetWidth + 20 < this._map._container.offsetWidth)) {
  			this._input.size = this._input.value.length < this._inputMinSize ? this._inputMinSize : this._input.value.length;
  		}
  	},

  	_handleArrowSelect: function(velocity) {
  	
  		var searchTips = this._tooltip.hasChildNodes() ? this._tooltip.childNodes : [];
  			
  		for (i=0; i<searchTips.length; i++)
  			L.DomUtil.removeClass(searchTips[i], 'search-tip-select');
  		
  		if ((velocity == 1 ) && (this._tooltip.currentSelection >= (searchTips.length - 1))) {// If at end of list.
  			L.DomUtil.addClass(searchTips[this._tooltip.currentSelection], 'search-tip-select');
  		}
  		else if ((velocity == -1 ) && (this._tooltip.currentSelection <= 0)) { // Going back up to the search box.
  			this._tooltip.currentSelection = -1;
  		}
  		else if (this._tooltip.style.display != 'none') {
  			this._tooltip.currentSelection += velocity;
  			
  			L.DomUtil.addClass(searchTips[this._tooltip.currentSelection], 'search-tip-select');
  			
  			this._input.value = searchTips[this._tooltip.currentSelection]._text;

  			// scroll:
  			var tipOffsetTop = searchTips[this._tooltip.currentSelection].offsetTop;
  			
  			if (tipOffsetTop + searchTips[this._tooltip.currentSelection].clientHeight >= this._tooltip.scrollTop + this._tooltip.clientHeight) {
  				this._tooltip.scrollTop = tipOffsetTop - this._tooltip.clientHeight + searchTips[this._tooltip.currentSelection].clientHeight;
  			}
  			else if (tipOffsetTop <= this._tooltip.scrollTop) {
  				this._tooltip.scrollTop = tipOffsetTop;
  			}
  		}
  	},

  	_handleSubmit: function() {	//button and tooltip click and enter submit

  		this._hideAutoType();
  		
  		this.hideAlert();
  		this._hideTooltip();

  		if(this._input.style.display == 'none')	//on first click show _input only
  			this.expand();
  		else
  		{
  			if(this._input.value === '')	//hide _input only
  				this.collapse();
  			else
  			{
  				var loc = this._getLocation(this._input.value);
  				
  				if(loc===false)
  					this.showAlert();
  				else
  				{
  					this.showLocation(loc, this._input.value);
  					this.fire('search:locationfound', {
  							latlng: loc,
  							text: this._input.value,
  							layer: loc.layer ? loc.layer : null
  						});
  				}
  			}
  		}
  	},

  	_getLocation: function(key) {	//extract latlng from _recordsCache

  		if( this._recordsCache.hasOwnProperty(key) )
  			return this._recordsCache[key];//then after use .loc attribute
  		else
  			return false;
  	},

  	_defaultMoveToLocation: function(latlng, title, map) {
  		if(this.options.zoom)
   			this._map.setView(latlng, this.options.zoom);
   		else
  			this._map.panTo(latlng);
  	},

  	showLocation: function(latlng, title) {	//set location on map from _recordsCache
  		var self = this;

  		self._map.once('moveend zoomend', function(e) {

  			if(self._markerSearch) {
  				self._markerSearch.addTo(self._map).setLatLng(latlng);
  			}
  			
  		});

  		self._moveToLocation(latlng, title, self._map);
  		//FIXME autoCollapse option hide self._markerSearch before visualized!!
  		if(self.options.autoCollapse)
  			self.collapse();

  		return self;
  	}
  });

  L.Control.Search.Marker = L.Marker.extend({

  	includes: L.version[0]==='1' ? L.Evented.prototype : L.Mixin.Events,
  	
  	options: {
  		icon: new L.Icon.Default(),
  		animate: true,
  		circle: {
  			radius: 10,
  			weight: 3,
  			color: '#e03',
  			stroke: true,
  			fill: false
  		}
  	},
  	
  	initialize: function (latlng, options) {
  		L.setOptions(this, options);

  		if(options.icon === true)
  			options.icon = new L.Icon.Default();

  		L.Marker.prototype.initialize.call(this, latlng, options);
  		
  		if( L.Control.Search.prototype._isObject(this.options.circle) )
  			this._circleLoc = new L.CircleMarker(latlng, this.options.circle);
  	},

  	onAdd: function (map) {
  		L.Marker.prototype.onAdd.call(this, map);
  		if(this._circleLoc) {
  			map.addLayer(this._circleLoc);
  			if(this.options.animate)
  				this.animate();
  		}
  	},

  	onRemove: function (map) {
  		L.Marker.prototype.onRemove.call(this, map);
  		if(this._circleLoc)
  			map.removeLayer(this._circleLoc);
  	},
  	
  	setLatLng: function (latlng) {
  		L.Marker.prototype.setLatLng.call(this, latlng);
  		if(this._circleLoc)
  			this._circleLoc.setLatLng(latlng);
  		return this;
  	},
  	
  	_initIcon: function () {
  		if(this.options.icon)
  			L.Marker.prototype._initIcon.call(this);
  	},

  	_removeIcon: function () {
  		if(this.options.icon)
  			L.Marker.prototype._removeIcon.call(this);
  	},

  	animate: function() {
  	//TODO refact animate() more smooth! like this: http://goo.gl/DDlRs
  		if(this._circleLoc)
  		{
  			var circle = this._circleLoc,
  				tInt = 200,	//time interval
  				ss = 5,	//frames
  				mr = parseInt(circle._radius/ss),
  				oldrad = this.options.circle.radius,
  				newrad = circle._radius * 2,
  				acc = 0;

  			circle._timerAnimLoc = setInterval(function() {
  				acc += 0.5;
  				mr += acc;	//adding acceleration
  				newrad -= mr;
  				
  				circle.setRadius(newrad);

  				if(newrad<oldrad)
  				{
  					clearInterval(circle._timerAnimLoc);
  					circle.setRadius(oldrad);//reset radius
  					//if(typeof afterAnimCall == 'function')
  						//afterAnimCall();
  						//TODO use create event 'animateEnd' in L.Control.Search.Marker 
  				}
  			}, tInt);
  		}
  		
  		return this;
  	}
  });

  L.Map.addInitHook(function () {
      if (this.options.searchControl) {
          this.searchControl = L.control.search(this.options.searchControl);
          this.addControl(this.searchControl);
      }
  });

  L.control.search = function (options) {
      return new L.Control.Search(options);
  };

  return L.Control.Search;

  });

  !function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e():"function"==typeof define&&define.amd?define(e):e();}(0,function(){function t(t,e){return e={exports:{}},t(e,e.exports),e.exports}var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{},n=t(function(t){!function(e){function n(t,e){function n(t){return e.bgcolor&&(t.style.backgroundColor=e.bgcolor),e.width&&(t.style.width=e.width+"px"),e.height&&(t.style.height=e.height+"px"),e.style&&Object.keys(e.style).forEach(function(n){t.style[n]=e.style[n];}),t}return e=e||{},s(e),Promise.resolve(t).then(function(t){return u(t,e.filter,!0)}).then(c).then(d).then(n).then(function(n){return g(n,e.width||h.width(t),e.height||h.height(t))})}function i(t,e){return l(t,e||{}).then(function(e){return e.getContext("2d").getImageData(0,0,h.width(t),h.height(t)).data})}function o(t,e){return l(t,e||{}).then(function(t){return t.toDataURL()})}function r(t,e){return e=e||{},l(t,e).then(function(t){return t.toDataURL("image/jpeg",e.quality||1)})}function a(t,e){return l(t,e||{}).then(h.canvasToBlob)}function s(t){void 0===t.imagePlaceholder?w.impl.options.imagePlaceholder=M.imagePlaceholder:w.impl.options.imagePlaceholder=t.imagePlaceholder,void 0===t.cacheBust?w.impl.options.cacheBust=M.cacheBust:w.impl.options.cacheBust=t.cacheBust;}function l(t,e){function i(t){var n=document.createElement("canvas");if(n.width=e.width||h.width(t),n.height=e.height||h.height(t),e.bgcolor){var i=n.getContext("2d");i.fillStyle=e.bgcolor,i.fillRect(0,0,n.width,n.height);}return n}return n(t,e).then(h.makeImage).then(h.delay(100)).then(function(e){var n=i(t);return n.getContext("2d").drawImage(e,0,0),n})}function u(t,e,n){function i(t){return t instanceof HTMLCanvasElement?h.makeImage(t.toDataURL()):t.cloneNode(!1)}function o(t,e,n){var i=t.childNodes;return 0===i.length?Promise.resolve(e):function(t,e,n){var i=Promise.resolve();return e.forEach(function(e){i=i.then(function(){return u(e,n)}).then(function(e){e&&t.appendChild(e);});}),i}(e,h.asArray(i),n).then(function(){return e})}function r(t,e){function n(){!function(t,e){t.cssText?e.cssText=t.cssText:function(t,e){h.asArray(t).forEach(function(n){e.setProperty(n,t.getPropertyValue(n),t.getPropertyPriority(n));});}(t,e);}(window.getComputedStyle(t),e.style);}function i(){function n(n){var i=window.getComputedStyle(t,n),o=i.getPropertyValue("content");if(""!==o&&"none"!==o){var r=h.uid();e.className=e.className+" "+r;var a=document.createElement("style");a.appendChild(function(t,e,n){var i="."+t+":"+e,o=n.cssText?function(t){var e=t.getPropertyValue("content");return t.cssText+" content: "+e+";"}(n):function(t){function e(e){return e+": "+t.getPropertyValue(e)+(t.getPropertyPriority(e)?" !important":"")}return h.asArray(t).map(e).join("; ")+";"}(n);return document.createTextNode(i+"{"+o+"}")}(r,n,i)),e.appendChild(a);}}[":before",":after"].forEach(function(t){n(t);});}function o(){t instanceof HTMLTextAreaElement&&(e.innerHTML=t.value),t instanceof HTMLInputElement&&e.setAttribute("value",t.value);}function r(){e instanceof SVGElement&&(e.setAttribute("xmlns","http://www.w3.org/2000/svg"),e instanceof SVGRectElement&&["width","height"].forEach(function(t){var n=e.getAttribute(t);n&&e.style.setProperty(t,n);}));}return e instanceof Element?Promise.resolve().then(n).then(i).then(o).then(r).then(function(){return e}):e}return n||!e||e(t)?Promise.resolve(t).then(i).then(function(n){return o(t,n,e)}).then(function(e){return r(t,e)}):Promise.resolve()}function c(t){return p.resolveAll().then(function(e){var n=document.createElement("style");return t.appendChild(n),n.appendChild(document.createTextNode(e)),t})}function d(t){return f.inlineAll(t).then(function(){return t})}function g(t,e,n){return Promise.resolve(t).then(function(t){return t.setAttribute("xmlns","http://www.w3.org/1999/xhtml"),(new XMLSerializer).serializeToString(t)}).then(h.escapeXhtml).then(function(t){return '<foreignObject x="0" y="0" width="100%" height="100%">'+t+"</foreignObject>"}).then(function(t){return '<svg xmlns="http://www.w3.org/2000/svg" width="'+e+'" height="'+n+'">'+t+"</svg>"}).then(function(t){return "data:image/svg+xml;charset=utf-8,"+t})}var h=function(){function t(){var t="application/font-woff",e="image/jpeg";return {woff:t,woff2:t,ttf:"application/font-truetype",eot:"application/vnd.ms-fontobject",png:"image/png",jpg:e,jpeg:e,gif:"image/gif",tiff:"image/tiff",svg:"image/svg+xml"}}function e(t){var e=/\.([^\.\/]*?)$/g.exec(t);return e?e[1]:""}function n(n){var i=e(n).toLowerCase();return t()[i]||""}function i(t){return -1!==t.search(/^(data:)/)}function o(t){return new Promise(function(e){for(var n=window.atob(t.toDataURL().split(",")[1]),i=n.length,o=new Uint8Array(i),r=0;r<i;r++)o[r]=n.charCodeAt(r);e(new Blob([o],{type:"image/png"}));})}function r(t){return t.toBlob?new Promise(function(e){t.toBlob(e);}):o(t)}function a(t,e){var n=document.implementation.createHTMLDocument(),i=n.createElement("base");n.head.appendChild(i);var o=n.createElement("a");return n.body.appendChild(o),i.href=e,o.href=t,o.href}function s(t){return new Promise(function(e,n){var i=new Image;i.onload=function(){e(i);},i.onerror=n,i.src=t;})}function l(t){var e=3e4;return w.impl.options.cacheBust&&(t+=(/\?/.test(t)?"&":"?")+(new Date).getTime()),new Promise(function(n){function i(){if(4===a.readyState){if(200!==a.status)return void(s?n(s):r("cannot fetch resource: "+t+", status: "+a.status));var e=new FileReader;e.onloadend=function(){var t=e.result.split(/,/)[1];n(t);},e.readAsDataURL(a.response);}}function o(){s?n(s):r("timeout of "+e+"ms occured while fetching resource: "+t);}function r(t){console.error(t),n("");}var a=new XMLHttpRequest;a.onreadystatechange=i,a.ontimeout=o,a.responseType="blob",a.timeout=e,a.open("GET",t,!0),a.send();var s;if(w.impl.options.imagePlaceholder){var l=w.impl.options.imagePlaceholder.split(/,/);l&&l[1]&&(s=l[1]);}})}function u(t,e){return "data:"+e+";base64,"+t}function c(t){return t.replace(/([.*+?^${}()|\[\]\/\\])/g,"\\$1")}function d(t){return function(e){return new Promise(function(n){setTimeout(function(){n(e);},t);})}}function g(t){for(var e=[],n=t.length,i=0;i<n;i++)e.push(t[i]);return e}function h(t){return t.replace(/#/g,"%23").replace(/\n/g,"%0A")}function m(t){var e=f(t,"border-left-width"),n=f(t,"border-right-width");return t.scrollWidth+e+n}function p(t){var e=f(t,"border-top-width"),n=f(t,"border-bottom-width");return t.scrollHeight+e+n}function f(t,e){var n=window.getComputedStyle(t).getPropertyValue(e);return parseFloat(n.replace("px",""))}return {escape:c,parseExtension:e,mimeType:n,dataAsUrl:u,isDataUrl:i,canvasToBlob:r,resolveUrl:a,getAndEncode:l,uid:function(){var t=0;return function(){return "u"+function(){return ("0000"+(Math.random()*Math.pow(36,4)<<0).toString(36)).slice(-4)}()+t++}}(),delay:d,asArray:g,escapeXhtml:h,makeImage:s,width:m,height:p}}(),m=function(){function t(t){return -1!==t.search(o)}function e(t){for(var e,n=[];null!==(e=o.exec(t));)n.push(e[1]);return n.filter(function(t){return !h.isDataUrl(t)})}function n(t,e,n,i){function o(t){return new RegExp("(url\\(['\"]?)("+h.escape(t)+")(['\"]?\\))","g")}return Promise.resolve(e).then(function(t){return n?h.resolveUrl(t,n):t}).then(i||h.getAndEncode).then(function(t){return h.dataAsUrl(t,h.mimeType(e))}).then(function(n){return t.replace(o(e),"$1"+n+"$3")})}function i(i,o,r){return function(){return !t(i)}()?Promise.resolve(i):Promise.resolve(i).then(e).then(function(t){var e=Promise.resolve(i);return t.forEach(function(t){e=e.then(function(e){return n(e,t,o,r)});}),e})}var o=/url\(['"]?([^'"]+?)['"]?\)/g;return {inlineAll:i,shouldProcess:t,impl:{readUrls:e,inline:n}}}(),p=function(){function t(){return e().then(function(t){return Promise.all(t.map(function(t){return t.resolve()}))}).then(function(t){return t.join("\n")})}function e(){function t(t){return t.filter(function(t){return t.type===CSSRule.FONT_FACE_RULE}).filter(function(t){return m.shouldProcess(t.style.getPropertyValue("src"))})}function e(t){var e=[];return t.forEach(function(t){try{h.asArray(t.cssRules||[]).forEach(e.push.bind(e));}catch(e){console.log("Error while reading CSS rules from "+t.href,e.toString());}}),e}function n(t){return {resolve:function(){var e=(t.parentStyleSheet||{}).href;return m.inlineAll(t.cssText,e)},src:function(){return t.style.getPropertyValue("src")}}}return Promise.resolve(h.asArray(document.styleSheets)).then(e).then(t).then(function(t){return t.map(n)})}return {resolveAll:t,impl:{readAll:e}}}(),f=function(){function t(t){function e(e){return h.isDataUrl(t.src)?Promise.resolve():Promise.resolve(t.src).then(e||h.getAndEncode).then(function(e){return h.dataAsUrl(e,h.mimeType(t.src))}).then(function(e){return new Promise(function(n,i){t.onload=n,t.onerror=i,t.src=e;})})}return {inline:e}}function e(n){return n instanceof Element?function(t){var e=t.style.getPropertyValue("background");return e?m.inlineAll(e).then(function(e){t.style.setProperty("background",e,t.style.getPropertyPriority("background"));}).then(function(){return t}):Promise.resolve(t)}(n).then(function(){return n instanceof HTMLImageElement?t(n).inline():Promise.all(h.asArray(n.childNodes).map(function(t){return e(t)}))}):Promise.resolve(n)}return {inlineAll:e,impl:{newImage:t}}}(),M={imagePlaceholder:void 0,cacheBust:!1},w={toSvg:n,toPng:o,toJpeg:r,toBlob:a,toPixelData:i,impl:{fontFaces:p,images:f,util:h,inliner:m,options:{}}};t.exports=w;}();}),i=t(function(t){var n=n||function(t){if(!(void 0===t||"undefined"!=typeof navigator&&/MSIE [1-9]\./.test(navigator.userAgent))){var e=t.document,n=function(){return t.URL||t.webkitURL||t},i=e.createElementNS("http://www.w3.org/1999/xhtml","a"),o="download"in i,r=function(t){var e=new MouseEvent("click");t.dispatchEvent(e);},a=/constructor/i.test(t.HTMLElement)||t.safari,s=/CriOS\/[\d]+/.test(navigator.userAgent),l=function(e){(t.setImmediate||t.setTimeout)(function(){throw e},0);},u=function(t){var e=function(){"string"==typeof t?n().revokeObjectURL(t):t.remove();};setTimeout(e,4e4);},c=function(t,e,n){e=[].concat(e);for(var i=e.length;i--;){var o=t["on"+e[i]];if("function"==typeof o)try{o.call(t,n||t);}catch(t){l(t);}}},d=function(t){return /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(t.type)?new Blob([String.fromCharCode(65279),t],{type:t.type}):t},g=function(e,l,g){g||(e=d(e));var h,m=this,p=e.type,f="application/octet-stream"===p,M=function(){c(m,"writestart progress write writeend".split(" "));};if(m.readyState=m.INIT,o)return h=n().createObjectURL(e),void setTimeout(function(){i.href=h,i.download=l,r(i),M(),u(h),m.readyState=m.DONE;});!function(){if((s||f&&a)&&t.FileReader){var i=new FileReader;return i.onloadend=function(){var e=s?i.result:i.result.replace(/^data:[^;]*;/,"data:attachment/file;");t.open(e,"_blank")||(t.location.href=e),e=void 0,m.readyState=m.DONE,M();},i.readAsDataURL(e),void(m.readyState=m.INIT)}if(h||(h=n().createObjectURL(e)),f)t.location.href=h;else{t.open(h,"_blank")||(t.location.href=h);}m.readyState=m.DONE,M(),u(h);}();},h=g.prototype,m=function(t,e,n){return new g(t,e||t.name||"download",n)};return "undefined"!=typeof navigator&&navigator.msSaveOrOpenBlob?function(t,e,n){return e=e||t.name||"download",n||(t=d(t)),navigator.msSaveOrOpenBlob(t,e)}:(h.abort=function(){},h.readyState=h.INIT=0,h.WRITING=1,h.DONE=2,h.error=h.onwritestart=h.onprogress=h.onwrite=h.onabort=h.onerror=h.onwriteend=null,m)}}("undefined"!=typeof self&&self||"undefined"!=typeof window&&window||e.content);t.exports&&(t.exports.saveAs=n);});L.Control.EasyPrint=L.Control.extend({options:{title:"Print map",position:"topleft",sizeModes:["Current"],filename:"map",exportOnly:!1,hidden:!1,tileWait:500,hideControlContainer:!0,hideClasses:[],customWindowTitle:window.document.title,spinnerBgCOlor:"#0DC5C1",customSpinnerClass:"epLoader",defaultSizeTitles:{Current:"Current Size",A4Landscape:"A4 Landscape",A4Portrait:"A4 Portrait"}},onAdd:function(){this.mapContainer=this._map.getContainer(),this.options.sizeModes=this.options.sizeModes.map(function(t){return "Current"===t?{name:this.options.defaultSizeTitles.Current,className:"CurrentSize"}:"A4Landscape"===t?{height:this._a4PageSize.height,width:this._a4PageSize.width,name:this.options.defaultSizeTitles.A4Landscape,className:"A4Landscape page"}:"A4Portrait"===t?{height:this._a4PageSize.width,width:this._a4PageSize.height,name:this.options.defaultSizeTitles.A4Portrait,className:"A4Portrait page"}:t},this);var t=L.DomUtil.create("div","leaflet-control-easyPrint leaflet-bar leaflet-control");if(!this.options.hidden){this._addCss(),L.DomEvent.addListener(t,"mouseover",this._togglePageSizeButtons,this),L.DomEvent.addListener(t,"mouseout",this._togglePageSizeButtons,this);var e="leaflet-control-easyPrint-button";this.options.exportOnly&&(e+="-export"),this.link=L.DomUtil.create("a",e,t),this.link.id="leafletEasyPrint",this.link.title=this.options.title,this.holder=L.DomUtil.create("ul","easyPrintHolder",t),this.options.sizeModes.forEach(function(t){var e=L.DomUtil.create("li","easyPrintSizeMode",this.holder);e.title=t.name;L.DomUtil.create("a",t.className,e);L.DomEvent.addListener(e,"click",this.printMap,this);},this),L.DomEvent.disableClickPropagation(t);}return t},printMap:function(t,e){e&&(this.options.filename=e),this.options.exportOnly||(this._page=window.open("","_blank","toolbar=no,status=no,menubar=no,scrollbars=no,resizable=no,left=10, top=10, width=200, height=250, visible=none"),this._page.document.write(this._createSpinner(this.options.customWindowTitle,this.options.customSpinnerClass,this.options.spinnerBgCOlor))),this.originalState={mapWidth:this.mapContainer.style.width,widthWasAuto:!1,widthWasPercentage:!1,mapHeight:this.mapContainer.style.height,zoom:this._map.getZoom(),center:this._map.getCenter()},"auto"===this.originalState.mapWidth?(this.originalState.mapWidth=this._map.getSize().x+"px",this.originalState.widthWasAuto=!0):this.originalState.mapWidth.includes("%")&&(this.originalState.percentageWidth=this.originalState.mapWidth,this.originalState.widthWasPercentage=!0,this.originalState.mapWidth=this._map.getSize().x+"px"),this._map.fire("easyPrint-start",{event:t}),this.options.hidden||this._togglePageSizeButtons({type:null}),this.options.hideControlContainer&&this._toggleControls(),this.options.hideClasses.length>0&&this._toggleClasses(this.options.hideClasses);var n="string"!=typeof t?t.target.className:t;if("CurrentSize"===n)return this._printOpertion(n);this.outerContainer=this._createOuterContainer(this.mapContainer),this.originalState.widthWasAuto&&(this.outerContainer.style.width=this.originalState.mapWidth),this._createImagePlaceholder(n);},_createImagePlaceholder:function(t){var e=this;n.toPng(this.mapContainer,{width:parseInt(this.originalState.mapWidth.replace("px")),height:parseInt(this.originalState.mapHeight.replace("px"))}).then(function(n){e.blankDiv=document.createElement("div");var i=e.blankDiv;e.outerContainer.parentElement.insertBefore(i,e.outerContainer),i.className="epHolder",i.style.backgroundImage='url("'+n+'")',i.style.position="absolute",i.style.zIndex=1011,i.style.display="initial",i.style.width=e.originalState.mapWidth,i.style.height=e.originalState.mapHeight,e._resizeAndPrintMap(t);}).catch(function(t){console.error("oops, something went wrong!",t);});},_resizeAndPrintMap:function(t){this.outerContainer.style.opacity=0;var e=this.options.sizeModes.filter(function(e){return e.className===t});e=e[0],this.mapContainer.style.width=e.width+"px",this.mapContainer.style.height=e.height+"px",this.mapContainer.style.width>this.mapContainer.style.height?this.orientation="portrait":this.orientation="landscape",this._map.setView(this.originalState.center),this._map.setZoom(this.originalState.zoom),this._map.invalidateSize(),this.options.tileLayer?this._pausePrint(t):this._printOpertion(t);},_pausePrint:function(t){var e=this,n=setInterval(function(){e.options.tileLayer.isLoading()||(clearInterval(n),e._printOpertion(t));},e.options.tileWait);},_printOpertion:function(t){var e=this,o=this.mapContainer.style.width;(this.originalState.widthWasAuto&&"CurrentSize"===t||this.originalState.widthWasPercentage&&"CurrentSize"===t)&&(o=this.originalState.mapWidth),n.toPng(e.mapContainer,{width:parseInt(o),height:parseInt(e.mapContainer.style.height.replace("px"))}).then(function(t){var n=e._dataURItoBlob(t);e.options.exportOnly?i.saveAs(n,e.options.filename+".png"):e._sendToBrowserPrint(t,e.orientation),e._toggleControls(!0),e._toggleClasses(e.options.hideClasses,!0),e.outerContainer&&(e.originalState.widthWasAuto?e.mapContainer.style.width="auto":e.originalState.widthWasPercentage?e.mapContainer.style.width=e.originalState.percentageWidth:e.mapContainer.style.width=e.originalState.mapWidth,e.mapContainer.style.height=e.originalState.mapHeight,e._removeOuterContainer(e.mapContainer,e.outerContainer,e.blankDiv),e._map.invalidateSize(),e._map.setView(e.originalState.center),e._map.setZoom(e.originalState.zoom)),e._map.fire("easyPrint-finished");}).catch(function(t){console.error("Print operation failed",t);});},_sendToBrowserPrint:function(t,e){this._page.resizeTo(600,800);var n=this._createNewWindow(t,e,this);this._page.document.body.innerHTML="",this._page.document.write(n),this._page.document.close();},_createSpinner:function(t,e,n){return "<html><head><title>"+t+"</title></head><body><style>\n      body{\n        background: "+n+";\n      }\n      .epLoader,\n      .epLoader:before,\n      .epLoader:after {\n        border-radius: 50%;\n      }\n      .epLoader {\n        color: #ffffff;\n        font-size: 11px;\n        text-indent: -99999em;\n        margin: 55px auto;\n        position: relative;\n        width: 10em;\n        height: 10em;\n        box-shadow: inset 0 0 0 1em;\n        -webkit-transform: translateZ(0);\n        -ms-transform: translateZ(0);\n        transform: translateZ(0);\n      }\n      .epLoader:before,\n      .epLoader:after {\n        position: absolute;\n        content: '';\n      }\n      .epLoader:before {\n        width: 5.2em;\n        height: 10.2em;\n        background: #0dc5c1;\n        border-radius: 10.2em 0 0 10.2em;\n        top: -0.1em;\n        left: -0.1em;\n        -webkit-transform-origin: 5.2em 5.1em;\n        transform-origin: 5.2em 5.1em;\n        -webkit-animation: load2 2s infinite ease 1.5s;\n        animation: load2 2s infinite ease 1.5s;\n      }\n      .epLoader:after {\n        width: 5.2em;\n        height: 10.2em;\n        background: #0dc5c1;\n        border-radius: 0 10.2em 10.2em 0;\n        top: -0.1em;\n        left: 5.1em;\n        -webkit-transform-origin: 0px 5.1em;\n        transform-origin: 0px 5.1em;\n        -webkit-animation: load2 2s infinite ease;\n        animation: load2 2s infinite ease;\n      }\n      @-webkit-keyframes load2 {\n        0% {\n          -webkit-transform: rotate(0deg);\n          transform: rotate(0deg);\n        }\n        100% {\n          -webkit-transform: rotate(360deg);\n          transform: rotate(360deg);\n        }\n      }\n      @keyframes load2 {\n        0% {\n          -webkit-transform: rotate(0deg);\n          transform: rotate(0deg);\n        }\n        100% {\n          -webkit-transform: rotate(360deg);\n          transform: rotate(360deg);\n        }\n      }\n      </style>\n    <div class=\""+e+'">Loading...</div></body></html>'},_createNewWindow:function(t,e,n){return "<html><head>\n        <style>@media print {\n          img { max-width: 98%!important; max-height: 98%!important; }\n          @page { size: "+e+";}}\n        </style>\n        <script>function step1(){\n        setTimeout('step2()', 10);}\n        function step2(){window.print();window.close()}\n        <\/script></head><body onload='step1()'>\n        <img src=\""+t+'" style="display:block; margin:auto;"></body></html>'},_createOuterContainer:function(t){var e=document.createElement("div");return t.parentNode.insertBefore(e,t),t.parentNode.removeChild(t),e.appendChild(t),e.style.width=t.style.width,e.style.height=t.style.height,e.style.display="inline-block",e.style.overflow="hidden",e},_removeOuterContainer:function(t,e,n){e.parentNode&&(e.parentNode.insertBefore(t,e),e.parentNode.removeChild(n),e.parentNode.removeChild(e));},_addCss:function(){var t=document.createElement("style");t.type="text/css",t.innerHTML=".leaflet-control-easyPrint-button { \n      background-image: url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjE2cHgiIGhlaWdodD0iMTZweCIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPGc+Cgk8cGF0aCBkPSJNMTI4LDMyaDI1NnY2NEgxMjhWMzJ6IE00ODAsMTI4SDMyYy0xNy42LDAtMzIsMTQuNC0zMiwzMnYxNjBjMCwxNy42LDE0LjM5OCwzMiwzMiwzMmg5NnYxMjhoMjU2VjM1Mmg5NiAgIGMxNy42LDAsMzItMTQuNCwzMi0zMlYxNjBDNTEyLDE0Mi40LDQ5Ny42LDEyOCw0ODAsMTI4eiBNMzUyLDQ0OEgxNjBWMjg4aDE5MlY0NDh6IE00ODcuMTk5LDE3NmMwLDEyLjgxMy0xMC4zODcsMjMuMi0yMy4xOTcsMjMuMiAgIGMtMTIuODEyLDAtMjMuMjAxLTEwLjM4Ny0yMy4yMDEtMjMuMnMxMC4zODktMjMuMiwyMy4xOTktMjMuMkM0NzYuODE0LDE1Mi44LDQ4Ny4xOTksMTYzLjE4Nyw0ODcuMTk5LDE3NnoiIGZpbGw9IiMwMDAwMDAiLz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K);\n      background-size: 16px 16px; \n      cursor: pointer; \n    }\n    .leaflet-control-easyPrint-button-export { \n      background-image: url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjE2cHgiIGhlaWdodD0iMTZweCIgdmlld0JveD0iMCAwIDQzMy41IDQzMy41IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA0MzMuNSA0MzMuNTsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8Zz4KCTxnIGlkPSJmaWxlLWRvd25sb2FkIj4KCQk8cGF0aCBkPSJNMzk1LjI1LDE1M2gtMTAyVjBoLTE1M3YxNTNoLTEwMmwxNzguNSwxNzguNUwzOTUuMjUsMTUzeiBNMzguMjUsMzgyLjV2NTFoMzU3di01MUgzOC4yNXoiIGZpbGw9IiMwMDAwMDAiLz4KCTwvZz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K);\n      background-size: 16px 16px; \n      cursor: pointer; \n    }\n    .easyPrintHolder a {\n      background-size: 16px 16px;\n      cursor: pointer;\n    }\n    .easyPrintHolder .CurrentSize{\n      background-image: url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTZweCIgdmVyc2lvbj0iMS4xIiBoZWlnaHQ9IjE2cHgiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgNjQgNjQiPgogIDxnPgogICAgPGcgZmlsbD0iIzFEMUQxQiI+CiAgICAgIDxwYXRoIGQ9Ik0yNS4yNTUsMzUuOTA1TDQuMDE2LDU3LjE0NVY0Ni41OWMwLTEuMTA4LTAuODk3LTIuMDA4LTIuMDA4LTIuMDA4QzAuODk4LDQ0LjU4MiwwLDQ1LjQ4MSwwLDQ2LjU5djE1LjQwMiAgICBjMCwwLjI2MSwwLjA1MywwLjUyMSwwLjE1NSwwLjc2N2MwLjIwMywwLjQ5MiwwLjU5NCwwLjg4MiwxLjA4NiwxLjA4N0MxLjQ4Niw2My45NDcsMS43NDcsNjQsMi4wMDgsNjRoMTUuNDAzICAgIGMxLjEwOSwwLDIuMDA4LTAuODk4LDIuMDA4LTIuMDA4cy0wLjg5OC0yLjAwOC0yLjAwOC0yLjAwOEg2Ljg1NWwyMS4yMzgtMjEuMjRjMC43ODQtMC43ODQsMC43ODQtMi4wNTUsMC0yLjgzOSAgICBTMjYuMDM5LDM1LjEyMSwyNS4yNTUsMzUuOTA1eiIgZmlsbD0iIzAwMDAwMCIvPgogICAgICA8cGF0aCBkPSJtNjMuODQ1LDEuMjQxYy0wLjIwMy0wLjQ5MS0wLjU5NC0wLjg4Mi0xLjA4Ni0xLjA4Ny0wLjI0NS0wLjEwMS0wLjUwNi0wLjE1NC0wLjc2Ny0wLjE1NGgtMTUuNDAzYy0xLjEwOSwwLTIuMDA4LDAuODk4LTIuMDA4LDIuMDA4czAuODk4LDIuMDA4IDIuMDA4LDIuMDA4aDEwLjU1NmwtMjEuMjM4LDIxLjI0Yy0wLjc4NCwwLjc4NC0wLjc4NCwyLjA1NSAwLDIuODM5IDAuMzkyLDAuMzkyIDAuOTA2LDAuNTg5IDEuNDIsMC41ODlzMS4wMjctMC4xOTcgMS40MTktMC41ODlsMjEuMjM4LTIxLjI0djEwLjU1NWMwLDEuMTA4IDAuODk3LDIuMDA4IDIuMDA4LDIuMDA4IDEuMTA5LDAgMi4wMDgtMC44OTkgMi4wMDgtMi4wMDh2LTE1LjQwMmMwLTAuMjYxLTAuMDUzLTAuNTIyLTAuMTU1LTAuNzY3eiIgZmlsbD0iIzAwMDAwMCIvPgogICAgPC9nPgogIDwvZz4KPC9zdmc+Cg==)\n    }\n    .easyPrintHolder .page {\n      background-image: url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMS4xLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDQ0NC44MzMgNDQ0LjgzMyIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDQ0LjgzMyA0NDQuODMzOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGc+Cgk8Zz4KCQk8cGF0aCBkPSJNNTUuMjUsNDQ0LjgzM2gzMzQuMzMzYzkuMzUsMCwxNy03LjY1LDE3LTE3VjEzOS4xMTdjMC00LjgxNy0xLjk4My05LjM1LTUuMzgzLTEyLjQ2N0wyNjkuNzMzLDQuNTMzICAgIEMyNjYuNjE3LDEuNywyNjIuMzY3LDAsMjU4LjExNywwSDU1LjI1Yy05LjM1LDAtMTcsNy42NS0xNywxN3Y0MTAuODMzQzM4LjI1LDQzNy4xODMsNDUuOSw0NDQuODMzLDU1LjI1LDQ0NC44MzN6ICAgICBNMzcyLjU4MywxNDYuNDgzdjAuODVIMjU2LjQxN3YtMTA4LjhMMzcyLjU4MywxNDYuNDgzeiBNNzIuMjUsMzRoMTUwLjE2N3YxMzAuMzMzYzAsOS4zNSw3LjY1LDE3LDE3LDE3aDEzMy4xNjd2MjI5LjVINzIuMjVWMzR6ICAgICIgZmlsbD0iIzAwMDAwMCIvPgoJPC9nPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=);\n    }\n    .easyPrintHolder .A4Landscape { \n      transform: rotate(-90deg);\n    }\n\n    .leaflet-control-easyPrint-button{\n      display: inline-block;\n    }\n    .easyPrintHolder{\n      margin-top:-31px;\n      margin-bottom: -5px;\n      margin-left: 30px;\n      padding-left: 0px;\n      display: none;\n    }\n\n    .easyPrintSizeMode {\n      display: inline-block;\n    }\n    .easyPrintHolder .easyPrintSizeMode a {\n      border-radius: 0px;\n    }\n\n    .easyPrintHolder .easyPrintSizeMode:last-child a{\n      border-top-right-radius: 2px;\n      border-bottom-right-radius: 2px;\n      margin-left: -1px;\n    }\n\n    .easyPrintPortrait:hover, .easyPrintLandscape:hover{\n      background-color: #757570;\n      cursor: pointer;\n    }",document.body.appendChild(t);},_dataURItoBlob:function(t){for(var e=atob(t.split(",")[1]),n=t.split(",")[0].split(":")[1].split(";")[0],i=new ArrayBuffer(e.length),o=new DataView(i),r=0;r<e.length;r++)o.setUint8(r,e.charCodeAt(r));return new Blob([i],{type:n})},_togglePageSizeButtons:function(t){var e=this.holder.style,n=this.link.style;"mouseover"===t.type?(e.display="block",n.borderTopRightRadius="0",n.borderBottomRightRadius="0"):(e.display="none",n.borderTopRightRadius="2px",n.borderBottomRightRadius="2px");},_toggleControls:function(t){var e=document.getElementsByClassName("leaflet-control-container")[0];if(t)return e.style.display="block";e.style.display="none";},_toggleClasses:function(t,e){t.forEach(function(t){var n=document.getElementsByClassName(t)[0];if(e)return n.style.display="block";n.style.display="none";});},_a4PageSize:{height:715,width:1045}}),L.easyPrint=function(t){return new L.Control.EasyPrint(t)};});

  (function(L) {
      if (typeof L === 'undefined') {
          throw new Error('Leaflet must be included first');
      }

      L.Control.Resizer = L.Control.extend({
          options: {
              direction: 'e',  // valid values e, s, se
              onlyOnHover: false,
              updateAlways: true,
              pan:false,
          },

          _END: {
              mousedown: 'mouseup',
              touchstart: 'touchend',
              pointerdown: 'touchend',
              MSPointerDown: 'touchend'
          },

          _MOVE: {
              mousedown: 'mousemove',
              touchstart: 'touchmove',
              pointerdown: 'touchmove',
              MSPointerDown: 'touchmove'
          },

          initialize: function(options) {
              L.Util.setOptions(this, options);
              this._initialOffsetX = 0;
              this._initialOffsetY = 0;
              this.options.position = 'leaflet-control-resizer-corner-' + this.options.direction;
              this.enable();
          },

          enable: function() {
              this._enabled = true;
              return this;
          },

          disable: function() {
              this._enabled = false;
              return this;
          },

          onAdd: function (map) {
              this._prepareLocation(map);

              var className = 'leaflet-control-resizer';
              var classNameTransp = className + (this.options.onlyOnHover ? '-transparent' : '-opaque');
              var classNameLoc = className + '-' + this.options.direction;
              this._container = L.DomUtil.create('div',
                                                 className + ' ' + classNameTransp + ' ' + classNameLoc,
                                                 map.getContainer());
              var container = this._container;

              L.DomEvent.on(container, 'mousedown mouseup click touchstart drag', L.DomEvent.stopPropagation);

              /* IE11 seems to process events in the wrong order, so the only way to prevent map movement while dragging the
               * slider is to disable map dragging when the cursor enters the slider (by the time the mousedown event fires
               * it's too late becuase the event seems to go to the map first, which results in any subsequent motion
               * resulting in map movement even after map.dragging.disable() is called.
               */
              /*
              L.DomEvent.on(container, 'mouseenter', function (e) { map.dragging.disable(); });
              L.DomEvent.on(container, 'mouseleave', function (e) { map.dragging.enable(); });
              */

              L.DomEvent.on(container, 'mousedown touchstart', this._initResize, this);

              return this._container;
          },

          onRemove: function(map) {
              L.DomEvent.off(this._container, 'mousedown touchstart', this._initResize, this);
              L.DomEvent.off(this._container, 'mousedown mouseup click touchstart drag', L.DomEvent.stopPropagation);
          },

          fakeHover: function(ms) {
              var className = 'leaflet-control-resizer-transparent-fakedhover';
              var cont = this._container;
              L.DomUtil.addClass(cont, className);
              setTimeout(function() { L.DomUtil.removeClass(cont, className); }, ms | 1000);
          },

          _prepareLocation: function(map) {
              var corners = map._controlCorners;
              var l = 'leaflet-control-resizer-corner-' + this.options.direction;
              var container = map._controlContainer;

              corners[l] = L.DomUtil.create('div', l, container);
          },

          _initResize: function (e) {
              if (e._simulated || !this._enabled) { return; }

              if (this._started) return;
              this._started = true;
              this._moved = false;

              var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e);

              L.DomUtil.disableImageDrag();
              L.DomUtil.disableTextSelection();

              this.fire('down', e);

              var mapCont = this._map.getContainer();
              this._initialOffsetX = mapCont.offsetWidth + mapCont.offsetLeft - first.clientX;
              this._initialOffsetY = mapCont.offsetHeight + mapCont.offsetTop - first.clientY;

              L.DomEvent.on(document, this._END[e.type], this._stopResizing, this);
              L.DomEvent.on(this._container, this._END[e.type], this._stopResizing, this);

              L.DomEvent.on(document, this._MOVE[e.type], this._duringResizing, this);
          },

          _duringResizing: function (e) {
              if (e._simulated) { return; }

              var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e);

              L.DomEvent.preventDefault(e);

              if (!this._moved) {
                  this.fire('dragstart', e);
              }
              this.fire('predrag', e);

              var mapCont = this._map.getContainer();
              if (this.options.direction.indexOf('e') >=0) {
                  mapCont.style.width = (first.clientX - mapCont.offsetLeft + this._initialOffsetX) + 'px';
                  this._moved = true;
              }
              if (this.options.direction.indexOf('s') >=0) {
                  mapCont.style.height = (first.clientY - mapCont.offsetTop + this._initialOffsetY) + 'px';
                  this._moved = true;
              }
              this._moved = true;

              if (this.options.updateAlways) {
                  this._map.invalidateSize({ pan: this.options.pan });
              }

              this.fire('drag', e);
          },

          _stopResizing: function(e) {
              if (e._simulated) { return; }

              for (var i in this._MOVE)
              {
                  L.DomEvent.off(document, this._MOVE[i], this._duringResizing, this);

                  L.DomEvent.off(document, this._END[i], this._stopResizing, this);
                  L.DomEvent.off(this._container, this._END[i], this._stopResizing, this);
              }

              this._map.invalidateSize({ pan: this.options.pan });

              L.DomUtil.enableImageDrag();
              L.DomUtil.enableTextSelection();
              this._started = false;
              this.fire('dragend', e);
          }

      });

      L.Control.Resizer.include(L.Evented.prototype);

      L.control.resizer = function (options) {
          return new L.Control.Resizer(options);
      };
  })(L);

  const currentScript = document.currentScript;
  const currentVersion = version.split("+")[0].trim();


  var lazyLoader = {

  	baseURL: 'https://unpkg.com/',

  	// Sequentially download multiple scripts.
  	loadSyncScripts: function(urls) {
  		return urls.reduce((prev, curr) => prev.then(() => lazyLoader.loadAsyncScripts(curr)), Promise.resolve());
  	},

  	// Parallel download multiple scripts.
  	loadAsyncScripts: function(urls) {
  		return Promise.all(urls.map((url) => lazyLoader.loadScript(url)));
  	},

  	// Dynamically load a single script.
  	loadScript: function(url) {
  		return new Promise((resolve, reject) => {

  			let type = url.split('.').pop().split('?')[0];
  			let tag = type == 'css' ? 'link' : 'script';
  			let script = document.createElement(tag);
  			let head = document.head;
  			let root_script = (head.contains(currentScript) ? currentScript : head.lastChild) || head;
  			let prev_tag = lazyLoader["prev_" + tag] || (tag == 'script' && lazyLoader.prev_link ? lazyLoader.prev_link : root_script);
  			let base_url = (url.indexOf("/") === 0 || url.indexOf('http://') === 0 || url.indexOf('https://') === 0) ? '' : lazyLoader.baseURL;

  			if (type == 'css') {
  				script.rel = 'stylesheet';
  			}

  			script.addEventListener('load', resolve, {
  				once: true
  			});
  			script.setAttribute(type == 'css' ? 'href' : 'src', base_url + url);

  			if (prev_tag.parentNode && prev_tag.nextSibling)
  				prev_tag.parentNode.insertBefore(script, prev_tag.nextSibling);
  			else
  				head.appendChild(script);

  			lazyLoader["prev_" + tag] = script;

  		});
  	}

  };


  (function() {

  	// You can ovveride them by passing one of the following to leaflet map constructor.
  	var default_options = {
  		mapTypes: {
  			streets: {
  				name: 'Streets',
  				url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  				options: {
  					maxZoom: 24,
  					maxNativeZoom: 19,
  					attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  				},
  			},
  			terrain: {
  				name: 'Terrain',
  				url: 'https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png',
  				options: {
  					maxZoom: 24,
  					maxNativeZoom: 22,
  					attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Map style: &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>',
  					// apikey: '<your apikey>',
  				},
  			},
  			satellite: {
  				name: 'Satellite',
  				url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  				options: {
  					maxZoom: 24,
  					maxNativeZoom: 18,
  					attribution: 'Map data: &copy; <a href="http://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  				},
  			},
  			topo: {
  				name: 'Topo',
  				url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  				options: {
  					maxZoom: 24,
  					maxNativeZoom: 17,
  					attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
  				},
  			},
  		},
  		zoomControl: {
  			position: 'bottomright'
  		},
  		scaleControl: {
  			width: 200,
  			position: 'bottomright',
  			imperial: false,
  		},
  		pegmanControl: {
  			position: 'bottomright',
  			theme: "leaflet-pegman-v3-small",
  		},
  		locateControl: {
  			position: "bottomright"
  		},
  		fullscreenControl: {
  			position: 'topright',
  			title: 'Enter Fullscreen',
  			titleCancel: 'Exit Fullscreen',
  			forceSeparateButton: true,
  		},
  		layersControl: {
  			inline: true,
  			position: 'topleft'
  		},
  		minimapControl: {
  			position: 'bottomleft',
  			toggleDisplay: false,
  			toggleMapTypes: true, // Automatically switch between "satellite" and "roads" layers.
  			width: 75,
  			height: 75,
  			aimingRectOptions: {
  				color: '#000000',
  				weight: 1,
  				opacity: 0,
  				fillOpacity: 0,
  			},
  			shadowRectOptions: {
  				color: '#000000',
  				weight: 1,
  				opacity: 0,
  				fillOpacity: 0,
  			},
  			mapOptions: {
  				mapTypeId: 'satellite',
  				gestureHandling: false,
  				searchControl: false,
  				loadingControl: false,
  				_isMiniMap: true,
  			}
  		},
  		editInOSMControl: {
  			position: "bottomright"
  		},
  		loadingControl: {
  			separate: true,
  			position: 'bottomright'
  		},
  		searchControl: {
  			url: 'https://nominatim.openstreetmap.org/search?format=json&accept-language={querylang}&q={s}',
  			querylang: 'en-US',
  			detectUserLang: true,
  			jsonpParam: 'json_callback',
  			propertyName: 'display_name',
  			propertyLoc: ['lat', 'lon'],
  			markerLocation: true,
  			autoType: false,
  			autoCollapse: true,
  			firstTipSubmit: true,
  			minLength: 1,
  			zoom: 10,
  			position: "bottomright",
  		},
  		printControl: {
  			position: 'bottomright',
  			hideControlContainer: true,
  			exportOnly: true,
  			sizeModes: [ /*'Current',*/ 'A4Portrait', 'A4Landscape'],
  			//tileWait: 1200,
  		},
  		resizerControl: {
  			direction: 's'
  		},
  		disableDefaultUI: false,
  		// TODO: pluginsBaseURL: 'https://unpkg.com/',
  		plugins: [
  			// "@raruto/leaflet-elevation@0.4.5/leaflet-elevation.css",
  			// "@raruto/leaflet-elevation@0.4.5/leaflet-elevation.js",
  			// "leaflet-kmz@0.3.1/dist/leaflet-kmz.js",
  			// "leaflet-transparency@0.0.5/leaflet-transparency.min.js"
  		],
  		_isMiniMap: false, // used to prevent infinite loops when loading the minimap control.
  	};

  	// See "default_options" for a complete list of allowed values.
  	L.Map.mergeOptions({
  		mapTypeId: 'streets',
  		mapTypeIds: ['streets', 'terrain', 'satellite', 'topo'],
  		mapTypes: undefined,
  		gestureHandling: true,
  		zoomControl: true,
  		scaleControl: true,
  		pegmanControl: true,
  		locateControl: true,
  		fullscreenControl: true,
  		layersControl: true,
  		minimapControl: true,
  		editInOSMControl: true,
  		loadingControl: true,
  		searchControl: true,
  		printControl: false,
  		resizerControl: false,
  		disableDefaultUI: false,
  		includeLeafletCSS: true,
  		apiKeys: undefined, // eg. { thunderforest: "", google: "", ... }
  		_isMiniMap: false, // used to prevent infinite loops when loading the minimap control.
  	});

  	// Customize leaflet Map default aspect.
  	L.Map.addInitHook(function() {
  		disableDefaultUI.call(this);
  		if (this.options._isMiniMap) {
  			return; // prevent infinite loops when loading the minimap control.
  		}
  		if (!this.options.disableDefaultUI) {
  			setDeafultOptions.call(this);
  			initMap.call(this);
  		}
  	});

  	// Disable leaflet map default controls.
  	function disableDefaultUI() {
  		if (this.zoomControl) this.zoomControl.remove();
  		if (this.fullscreenControl && this.options.fullscreenControl && !this.options.zoomControl) this.fullscreenControl.remove();
  		if (this.searchControl && this.options.searchControl) this.searchControl.remove();
  		if (this.attributionControl) this.attributionControl.remove();
  	}

  	// Deep merge "default_options" and do some sanity check.
  	function setDeafultOptions() {
  		// Recursive merge leaflet map options.
  		for (let i in default_options) {
  			if (this.options[i] === true || typeof this.options[i] === "undefined") {
  				this.options[i] = default_options[i];
  			} else if (typeof this.options[i] === "object" && this.options[i] instanceof Array === false) {
  				this.options[i] = deepMerge(default_options[i], this.options[i]);
  			}
  		}

  		// Set deafult tile providers Api Keys (if any).
  		if (this.options.apiKeys) {
  			if (this.options.apiKeys.thunderforest) {
  				this.options.mapTypes.terrain.options.apikey = this.options.apiKeys.thunderforest;
  			}
  			if (this.options.apiKeys.google) {
  				this.options.pegmanControl.apiKey = this.options.apiKeys.google;
  			}
  		}
  		// Append Thunderforest Api Key.
  		if (this.options.mapTypes.terrain.options.apikey) {
  			var url = this.options.mapTypes.terrain.url;
  			if (url.indexOf('apikey=') === -1) {
  				this.options.mapTypes.terrain.url += (url.indexOf('?') === -1 ? '?' : '&') + 'apikey={apikey}';
  			}
  		}
  		// Fix default mapTypeId if missing in mapTypeIds array.
  		if (this.options.mapTypeIds.includes(this.options.mapTypeId) === false && this.options.mapTypeIds.length > 0) {
  			this.options.mapTypeId = this.options.mapTypeIds[0];
  		}
  		// Auto detect user "querylang" value when using search control.
  		if (this.options.searchControl && this.options.searchControl.detectUserLang) {
  			this.options.searchControl.querylang = window.navigator.languages ? window.navigator.languages[0] : (window.navigator.userLanguage || window.navigator.language);
  		}
  		// Replace default "querylang" value when using search control.
  		if (this.options.searchControl && this.options.searchControl.querylang) {
  			this.options.searchControl.url = this.options.searchControl.url.replace('{querylang}', this.options.searchControl.querylang);
  		}
  		// Avoid missing center/zoom values when using minimap control.
  		if (this.options.minimapControl && !this.options.center && !this.options.zoom) {
  			this.setView([0, 0], 0);
  		}
  	}
  	// Initialize default leaflet map controls and layers.
  	function initMap() {
  		var controls = {},
  			layers = {},
  			baseMaps = {};

  		// Gesture Handling.
  		if (this.options.gestureHandling) {
  			this.gestureHandling.enable();
  		}

  		// Load all user selected layers.
  		for (let i in this.options.mapTypeIds) {
  			var id = this.options.mapTypeIds[i];
  			if (this.options.mapTypes[id]) {
  				baseMaps[this.options.mapTypes[id].name] = layers[id] = new L.TileLayer(this.options.mapTypes[id].url, this.options.mapTypes[id].options);
  				layers[id].mapTypeId = id; // save mapTypeId for easy access.
  			}
  		}

  		// Layers Control.
  		if (this.options.layersControl) {
  			controls.layers = new L.Control.Layers(baseMaps, null, this.options.layersControl);
  		}

  		// Attribution Control.
  		if (this.options.attributionControl && this.attributionControl) {
  			this.attributionControl.addTo(this);
  			controls.attribution = this.attributionControl;
  			this.on('baselayerchange', L.bind(updateLeafletAttribution, this, this.attributionControl.options.prefix));
  		}

  		// Edit in OSM link.
  		if (this.options.editInOSMControl) {
  			controls.editInOSM = new L.Control.EditInOSM(this.options.editInOSMControl);
  		}

  		// Scale Control.
  		if (this.options.scaleControl) {
  			controls.scale = new L.Control.Scale(this.options.scaleControl);
  		}

  		// Zoom Control.
  		if (this.options.zoomControl && this.zoomControl) {
  			this.zoomControl.setPosition(this.options.zoomControl.position);
  			this.zoomControl.addTo(this);
  			controls.zoom = this.zoomControl;
  		}

  		// Pegman Control.
  		if (this.options.pegmanControl) {
  			controls.pegman = new L.Control.Pegman(this.options.pegmanControl);
  		}

  		// Locate Control.
  		if (this.options.locateControl) {
  			controls.locate = new L.Control.Locate(this.options.locateControl);
  		}

  		// Search Control.
  		if (this.options.searchControl) {
  			controls.search = this.searchControl = new L.Control.Search(this.options.searchControl);
  		}

  		// Print Control.
  		if (this.options.printControl) {
  			controls.print = new L.Control.EasyPrint(this.options.printControl);
  		}

  		// Loading Control.
  		if (this.options.loadingControl) {
  			controls.loading = new L.Control.Loading(this.options.loadingControl);
  		}

  		// Fullscreen Control.
  		if (this.options.fullscreenControl) {
  			controls.fullscreen = this.fullscreenControl = new L.Control.FullScreen(this.options.fullscreenControl);
  		}

  		// Minimap Control.
  		if (this.options.minimapControl) {
  			var miniMapTypeId = this.options.minimapControl.mapOptions.mapTypeId;
  			var miniMapLayer = this.options.mapTypes[miniMapTypeId];
  			if (miniMapLayer) {
  				miniMapLayer = new L.TileLayer(miniMapLayer.url, miniMapLayer.options);
  				miniMapLayer.mapTypeId = miniMapTypeId; // save mapTypeId for easy access.
  				controls.minimap = new L.Control.MiniMap(miniMapLayer, this.options.minimapControl);
  				controls.minimap._mainMapBaseLayers = baseMaps; // save baseMaps for easy access.
  			}
  		}

  		// Resizer Control.
  		if (this.options.resizerControl) {
  			controls.resizer = new L.Control.Resizer(this.options.resizerControl);
  		}

  		// Load all user selected controls.
  		for (let i in controls) {
  			if (controls[i].addTo) {
  				controls[i].addTo(this);
  			}
  		}
  		this.controls = controls; // save controls for easy access.

  		// Fire idle event.
  		this.whenReady(function() {
  			this.fire('idle');
  			// Prevent adding multiple default base layers when using multiple maps.
  			if (this.options.mapTypeId) {
  				var baseLayer = this.options.mapTypes[this.options.mapTypeId];
  				if (baseLayer && baseMaps[baseLayer.name]) {
  					this.options.layers = this.options.layers.filter(item => item._leaflet_id !== baseMaps[baseLayer.name]._leaflet_id);
  					baseMaps[baseLayer.name].bringToBack();
  				}
  			}
  		}, this);

  		// Set default base layer.
  		if (this.options.mapTypeId) {
  			var baseLayer = this.options.mapTypes[this.options.mapTypeId];
  			if (baseLayer && baseMaps[baseLayer.name]) {
  				this.options.layers.unshift(baseMaps[baseLayer.name]); // Add to the array of layers that will be automatically loaded within the map initially.
  			}
  		}

  		// Load custom plugins.
  		if (this.options.plugins) {
  			if (!lazyLoader.loader) {
  				var core_plugins = ["leaflet-ui@" + currentVersion + "/dist/leaflet-ui.css"];
  				if (!window.L) {
  					core_plugins.unshift("leaflet@1.3.4/dist/leaflet.css");
  					core_plugins.unshift("leaflet@1.3.4/dist/leaflet.js");
  				} else if (this.options.includeLeafletCSS && L.version) {
  					let core_css_url = "leaflet@" + L.version + "/dist/leaflet.css";
  					let core_css_exists = false;
  					for (let i = 0; i < document.styleSheets.length; i++) {
  						if (document.styleSheets[i].href && document.styleSheets[i].href.indexOf(core_css_url) > 0) {
  							core_css_exists = true;
  							break;
  						}
  					}
  					if (!core_css_exists) {
  						core_plugins.unshift(core_css_url);
  					}
  				}
  				lazyLoader.loader = lazyLoader.loadSyncScripts([core_plugins, this.options.plugins]);
  			}

  			// Lazy load initHooks
  			if (this._initHooks) {
  				let initHooks = this._initHooks.length;
  				this.once('plugins_loaded', function() {
  					if (initHooks < this._initHooks.length)
  						for (var i = initHooks, len = this._initHooks.length; i < len; i++) {
  							this._initHooks[i].call(this);
  						}
  					this.fire('initHooks_called');
  				});
  			}

  			lazyLoader.loader
  				.then(function() {
  					this.fire('plugins_loaded');
  				}.bind(this));
  		}
  	}

  	// Conditionally load Leaflet Map Attributions.
  	function updateLeafletAttribution(defaultAttribution, e) {
  		if (e && e.layer) {
  			// Remove leaflet attribution when showing GoogleMutant tiles
  			this.attributionControl.setPrefix((L.GridLayer.GoogleMutant && e.layer instanceof L.GridLayer.GoogleMutant) ? false : defaultAttribution);
  			// Keep default baselayers to the lower level
  			if (e.layer.mapTypeId && e.layer.bringToBack) e.layer.bringToBack();
  		}
  	}

  	var minimapProto = L.Control.MiniMap.prototype;
  	var onAddMinimapProto = minimapProto.onAdd;

  	// Customize MiniMap default core behavior.
  	L.Control.MiniMap.include({
  		onAdd: function(map) {
  			var container = onAddMinimapProto.call(this, map);

  			// Disable mouse handlers
  			if (this._miniMap) {
  				this._miniMap.doubleClickZoom.disable();
  				this._miniMap.touchZoom.disable();
  				this._miniMap.scrollWheelZoom.disable();
  			}
  			// Automatically switch between "satellite" and "roads" layers.
  			if (this.options.toggleMapTypes) {
  				L.DomEvent.on(map, 'baselayerchange', this._handleMainMapTypeChange, this);
  				L.DomEvent.on(this._container, 'click', this._handleMiniMapTypeToggle, this);
  			}
  			return container;
  		},
  		_handleMainMapTypeChange: function(e) {
  			if (!this._handligMiniMapTypeToggle) {
  				if (e && e.layer) {
  					var minimap = this,
  						mainmap = this._mainMap,
  						miniMapTypeId = minimap._layer.mapTypeId,
  						mainMapTypeId = e.layer.mapTypeId;


  					if (mainmap.options.mapTypeIds.length > 0 && inArray(mainmap.options.mapTypeIds, mainMapTypeId)) {
  						if (mainMapTypeId != miniMapTypeId) {
  							minimap._lastMapTypeId = mainMapTypeId;
  						}

  						var mapTypeId,
  							miniMapLayer;

  						if (mainMapTypeId == "satellite" && miniMapTypeId == "satellite") {
  							mapTypeId = minimap._lastMapTypeId;
  						} else if (mainMapTypeId != "satellite" && miniMapTypeId != "satellite") {
  							mapTypeId = "satellite";
  						}
  						miniMapLayer = mainmap.options.mapTypes[mapTypeId];

  						if (miniMapLayer) {
  							miniMapLayer = new L.TileLayer(miniMapLayer.url, miniMapLayer.options);
  							miniMapLayer.mapTypeId = mapTypeId; // save mapTypeId for easy access.
  							minimap._lastMapTypeId = miniMapTypeId;
  							minimap.changeLayer(miniMapLayer);
  						}

  					}
  				}
  			}
  		},
  		_handleMiniMapTypeToggle: function() {
  			this._handligMiniMapTypeToggle = true;
  			if (this._layer && this._mainMapBaseLayers) {
  				var minimap = this,
  					mainmap = this._mainMap,
  					miniMapTypeId = this._layer.mapTypeId,
  					mainMapTypeId;
  				for (let i in this._mainMapBaseLayers) {
  					if (mainmap.hasLayer(this._mainMapBaseLayers[i]) && miniMapTypeId != this._mainMapBaseLayers[i].mapTypeId) {
  						mainMapTypeId = this._mainMapBaseLayers[i].mapTypeId;
  						break;
  					}
  				}

  				if (mainmap.options.mapTypeIds.length > 0 && inArray(mainmap.options.mapTypeIds, miniMapTypeId)) {
  					var mapTypeId,
  						miniMapLayer;

  					mapTypeId = minimap._lastMapTypeId || mainmap.options.mapTypeId;

  					if (minimap._lastMapTypeId != "satellite" && miniMapTypeId != "satellite") {
  						mapTypeId = "satellite";
  					}

  					miniMapLayer = mainmap.options.mapTypes[mapTypeId];

  					if (miniMapLayer) {
  						miniMapLayer = new L.TileLayer(miniMapLayer.url, miniMapLayer.options);
  						miniMapLayer.mapTypeId = mapTypeId; // save mapTypeId for easy access.
  						minimap._lastMapTypeId = miniMapTypeId;

  						minimap.changeLayer(miniMapLayer);

  						for (let i in this._mainMapBaseLayers) {
  							this._mainMapBaseLayers[i].remove();
  							if (minimap._lastMapTypeId == this._mainMapBaseLayers[i].mapTypeId) {
  								this._mainMapBaseLayers[i].addTo(mainmap);
  							}
  						}

  					}
  				}
  				this._handligMiniMapTypeToggle = false;
  			}
  		},
  	});

  	// Custom open in OSM Edit link.
  	L.Control.EditInOSM = L.Control.extend({
  		options: {
  			editor: false, // eg: "id", "potlatch2" or "remote"
  		},
  		_edit: function() {
  			var center = this._map.getCenter();
  			var z = this._map.getZoom();
  			var editor = this.options.editor ? '&editor=' + this.options.editor : '';
  			window.open('http://www.openstreetmap.org/edit?' + 'zoom=' + z + editor + '&lat=' + center.lat + '&lon=' + center.lng);
  		},
  		onAdd: function(map) {
  			var container = L.DomUtil.create('div', 'leaflet-control-attribution leaflet-edit-osm'),
  				link = L.DomUtil.create('a', '', container);

  			link.href = '#';
  			link.innerHTML = '✎ Edit';
  			link.title = 'Edit in OpenStreetMap';

  			L.DomEvent
  				.on(link, 'click', L.DomEvent.stopPropagation)
  				.on(link, 'mousedown', L.DomEvent.stopPropagation)
  				.on(link, 'dblclick', L.DomEvent.stopPropagation)
  				.on(link, 'click', L.DomEvent.preventDefault)
  				.on(link, 'click', L.bind(this._edit, this), this);

  			return container;
  		}
  	});

  	// Check if an array contains any element from another one.
  	function inArray(array, items) {
  		return array.some(r => items.includes(r));
  	}

  	// Simple object check.
  	function isObject(item) {
  		return (item && typeof item === 'object' && !Array.isArray(item));
  	}

  	// Deep merge two objects (note: circular references not supported).
  	function deepMerge(target, ...sources) {
  		if (!sources.length) return target;
  		const source = sources.shift();
  		if (isObject(target) && isObject(source)) {
  			for (const key in source) {
  				if (isObject(source[key])) {
  					if (!target[key]) Object.assign(target, {
  						[key]: {}
  					});
  					deepMerge(target[key], source[key]);
  				} else {
  					Object.assign(target, {
  						[key]: source[key]
  					});
  				}
  			}
  		}
  		return deepMerge(target, ...sources);
  	}

  })();

})));
//# sourceMappingURL=leaflet-ui-src.js.map
