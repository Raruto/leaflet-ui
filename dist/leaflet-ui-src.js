(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
}((function () { 'use strict';

  var version = "0.5.9+master.f634be9e";

  // Following https://github.com/Leaflet/Leaflet/blob/master/PLUGIN-GUIDE.md
  (function (factory, window) {

      // define an AMD module that relies on 'leaflet'
      if (typeof define === 'function' && define.amd) {
          define(['leaflet'], factory);

          // define a Common JS module that relies on 'leaflet'
      } else if (typeof exports === 'object') {
          module.exports = factory(require('leaflet'));
      }

      // attach your plugin to the global 'L' variable
      if (typeof window !== 'undefined' && window.L) {
          factory(window.L);

      }
  }(function (L) {
      L.locales = {};
      L.locale = null;
      L.registerLocale = function registerLocale(code, locale) {
          L.locales[code] = L.Util.extend({}, L.locales[code], locale);
      };
      L.setLocale = function setLocale(code) {
          L.locale = code;
      };
      return L.i18n = L._ = function translate(string, data) {
          if (L.locale && L.locales[L.locale] && L.locales[L.locale][string]) {
              string = L.locales[L.locale][string];
          }
          try {
              // Do not fail if some data is missing
              // a bad translation should not break the app
              string = L.Util.template(string, data);
          }
          catch (err) {/*pass*/
          }

          return string;
      };
  }, window));

  /**
   * L.DomUtil
   */
  const domUtilProto = L.extend({}, L.DomUtil);

  L.extend(L.DomUtil, {

      setTransform: function(el, offset, scale, bearing, pivot) {
          var pos = offset || new L.Point(0, 0);

          if (!bearing) {
              offset = pos._round();
              return domUtilProto.setTransform.call(this, el, offset, scale);
          }

          pos = pos.rotateFrom(bearing, pivot);

          el.style[L.DomUtil.TRANSFORM] =
              'translate3d(' + pos.x + 'px,' + pos.y + 'px' + ',0)' +
              (scale ? ' scale(' + scale + ')' : '') +
              ' rotate(' + bearing + 'rad)';
      },

      setPosition: function(el, point, bearing, pivot) { // (HTMLElement, Point[, Boolean])
          if (!bearing) {
              return domUtilProto.setPosition.call(this, el, point);
          }

          /*eslint-disable */
          el._leaflet_pos = point;
          /*eslint-enable */

          if (L.Browser.any3d) {
              L.DomUtil.setTransform(el, point, undefined, bearing, pivot);
          } else {
              el.style.left = point.x + 'px';
              el.style.top = point.y + 'px';
          }
      },

      // Constants for rotation
      DEG_TO_RAD: Math.PI / 180,
      RAD_TO_DEG: 180 / Math.PI,

  });

  /**
   * L.Draggable
   */
  L.Draggable.include({

      updateMapBearing: function(mapBearing) {
          this._mapBearing = mapBearing;
      },

  });

  /**
   * L.Point
   */
  L.extend(L.Point.prototype, {

      // Rotate around (0,0) by applying the 2D rotation matrix:
      // ⎡ x' ⎤ = ⎡ cos θ  -sin θ ⎤ ⎡ x ⎤
      // ⎣ y' ⎦   ⎣ sin θ   cos θ ⎦ ⎣ y ⎦
      // Theta must be given in radians.
      rotate: function(theta) {
          if (!theta) { return this; }
          var sinTheta = Math.sin(theta);
          var cosTheta = Math.cos(theta);

          return new L.Point(
              this.x * cosTheta - this.y * sinTheta,
              this.x * sinTheta + this.y * cosTheta
          );
      },

      // Rotate around (pivot.x, pivot.y) by:
      // 1. subtract (pivot.x, pivot.y)
      // 2. rotate around (0, 0)
      // 3. add (pivot.x, pivot.y) back
      // same as `this.subtract(pivot).rotate(theta).add(pivot)`
      rotateFrom: function(theta, pivot) {
          if (!theta) { return this; }
          var sinTheta = Math.sin(theta);
          var cosTheta = Math.cos(theta);
          var cx = pivot.x,
              cy = pivot.y;
          var x = this.x - cx,
              y = this.y - cy;

          return new L.Point(
              x * cosTheta - y * sinTheta + cx,
              x * sinTheta + y * cosTheta + cy
          );
      },

  });

  /**
   * L.DivOverlay
   */
  const divOverlayProto = L.extend({}, L.DivOverlay.prototype);

  L.DivOverlay.include({

      getEvents: function() {
          return L.extend(divOverlayProto.getEvents.call(this), { rotate: this._updatePosition });
      },

      _updatePosition: function() {
          if (!this._map) { return; }

          var pos = this._map.latLngToLayerPoint(this._latlng),
              offset = L.point(this.options.offset),
              anchor = this._getAnchor();

          if (this._zoomAnimated) {
              // TODO: use divOverlayProto._updatePosition
              if (this._map._rotate) {
                  pos = this._map.rotatedPointToMapPanePoint(pos);
              }
              L.DomUtil.setPosition(this._container, pos.add(anchor));
          } else {
              offset = offset.add(pos).add(anchor);
          }

          var bottom = this._containerBottom = -offset.y,
              left = this._containerLeft = -Math.round(this._containerWidth / 2) + offset.x;

          // bottom position the popup in case the height of the popup changes (images loading etc)
          this._container.style.bottom = bottom + 'px';
          this._container.style.left = left + 'px';
      },

  });

  /**
   * L.Popup
   */
  const popupProto = L.extend({}, L.Popup.prototype);

  L.Popup.include({

      _animateZoom: function(e) {
          if (!this._map._rotate) {
              popupProto._animateZoom.call(this, e);
          }
          var pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center),
              anchor = this._getAnchor();

          pos = this._map.rotatedPointToMapPanePoint(pos);

          L.DomUtil.setPosition(this._container, pos.add(anchor));
      },

      _adjustPan: function() {
          if (!this.options.autoPan || (this._map._panAnim && this._map._panAnim._inProgress)) { return; }

          var map = this._map,
              marginBottom = parseInt(L.DomUtil.getStyle(this._container, 'marginBottom'), 10) || 0,
              containerHeight = this._container.offsetHeight + marginBottom,
              containerWidth = this._containerWidth,
              layerPos = new L.Point(this._containerLeft, -containerHeight - this._containerBottom);

          layerPos._add(L.DomUtil.getPosition(this._container));

          // var containerPos = map.layerPointToContainerPoint(layerPos);
          // TODO: use popupProto._adjustPan
          var containerPos = layerPos._add(this._map._getMapPanePos()),
              padding = L.point(this.options.autoPanPadding),
              paddingTL = L.point(this.options.autoPanPaddingTopLeft || padding),
              paddingBR = L.point(this.options.autoPanPaddingBottomRight || padding),
              size = map.getSize(),
              dx = 0,
              dy = 0;

          if (containerPos.x + containerWidth + paddingBR.x > size.x) { // right
              dx = containerPos.x + containerWidth - size.x + paddingBR.x;
          }
          if (containerPos.x - dx - paddingTL.x < 0) { // left
              dx = containerPos.x - paddingTL.x;
          }
          if (containerPos.y + containerHeight + paddingBR.y > size.y) { // bottom
              dy = containerPos.y + containerHeight - size.y + paddingBR.y;
          }
          if (containerPos.y - dy - paddingTL.y < 0) { // top
              dy = containerPos.y - paddingTL.y;
          }

          // @namespace Map
          // @section Popup events
          // @event autopanstart: Event
          // Fired when the map starts autopanning when opening a popup.
          if (dx || dy) {
              map
                  .fire('autopanstart')
                  .panBy([dx, dy]);
          }
      },

  });

  /**
   * L.Tooltip
   */
  const tooltipProto = L.extend({}, L.Tooltip.prototype);

  L.Tooltip.include({

      _updatePosition: function() {
          if (!this._map._rotate) {
              return tooltipProto._updatePosition.call(this);
          }
          var pos = this._map.latLngToLayerPoint(this._latlng);

          pos = this._map.rotatedPointToMapPanePoint(pos);
          this._setPosition(pos);
      },

      _animateZoom: function(e) {
          if (!this._map._rotate) {
              return tooltipProto._animateZoom.call(this, e);
          }
          var pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center);

          pos = this._map.rotatedPointToMapPanePoint(pos);
          this._setPosition(pos);
      },

  });

  /**
   * L.Icon
   */
  const iconProto = L.extend({}, L.Icon.prototype);

  L.Icon.include({

      _setIconStyles: function(img, name) {
          var options = this.options;
          var sizeOption = options[name + 'Size'];

          if (typeof sizeOption === 'number') {
              sizeOption = [sizeOption, sizeOption];
          }

          var size = L.point(sizeOption),
              anchor = L.point(name === 'shadow' && options.shadowAnchor || options.iconAnchor ||
                  size && size.divideBy(2, true));

          img.className = 'leaflet-marker-' + name + ' ' + (options.className || '');

          if (anchor) {
              img.style.marginLeft = (-anchor.x) + 'px';
              img.style.marginTop = (-anchor.y) + 'px';
              // TODO: use iconProto._setIconStyles
              img.style[L.DomUtil.TRANSFORM + "Origin"] = anchor.x + "px " + anchor.y + "px 0px";
          }

          if (size) {
              img.style.width = size.x + 'px';
              img.style.height = size.y + 'px';
          }
      },

  });

  /**
   * L.Handler.MarkerDrag
   */
  var markerDragProto;

  var MarkerDrag = {

      _onDragStart: function() {
          if (!this._marker._map._rotate) {
              return markerDragProto._onDragStart.call(this)
          }
          this._draggable.updateMapBearing(this._marker._map._bearing);
      },

      _onDrag: function(e) {
          var marker = this._marker,
              // TODO: use markerDragProto._onDrag
              rotated_marker = marker.options.rotation || marker.options.rotateWithView,
              shadow = marker._shadow,
              iconPos = L.DomUtil.getPosition(marker._icon);

          // TODO: use markerDragProto._onDrag
          // update shadow position
          if (!rotated_marker && shadow) {
              L.DomUtil.setPosition(shadow, iconPos);
          }

          // TODO: use markerDragProto._onDrag
          if (marker._map._rotate) {
              // Reverse calculation from mapPane coordinates to rotatePane coordinates
              iconPos = marker._map.mapPanePointToRotatedPoint(iconPos);
          }
          var latlng = marker._map.layerPointToLatLng(iconPos);

          marker._latlng = latlng;
          e.latlng = latlng;
          e.oldLatLng = this._oldLatLng;

          // TODO: use markerDragProto._onDrag
          if (rotated_marker) marker.setLatLng(latlng); // use `setLatLng` to presisit rotation. low efficiency
          else marker.fire('move', e); // `setLatLng` will trig 'move' event. we imitate here.

          // @event drag: Event
          // Fired repeatedly while the user drags the marker.
          marker
              .fire('drag', e);
      },

      _onDragEnd: function(e) {
          if (this._marker._map._rotate) {
              this._marker.update();
          }
          markerDragProto._onDragEnd.call(this, e);
      },

  };

  /**
   * L.Marker
   */
  const markerProto = L.extend({}, L.Marker.prototype);

  L.Marker.mergeOptions({

      // @option rotation: Number = 0
      // Rotation of this marker in rad
      rotation: 0,

      // @option rotateWithView: Boolean = false
      // Rotate this marker when map rotates
      rotateWithView: false,

  });

  L.Marker.include({

      getEvents: function() {
          return L.extend(markerProto.getEvents.call(this), { rotate: this.update });
      },

      onAdd: function(map) {
          markerProto.onAdd.call(this, map);
          map.on('rotate', this.update, this);
      },

      _initInteraction: function() {
          var ret = markerProto._initInteraction.call(this);
          if (this.dragging && this.dragging.enabled() && this._map && this._map._rotate) {
              // L.Handler.MarkerDrag is used internally by L.Marker to make the markers draggable
              markerDragProto = markerDragProto || Object.getPrototypeOf(this.dragging);
              this.dragging._onDragStart = MarkerDrag._onDragStart.bind(this.dragging);
              this.dragging._onDrag = MarkerDrag._onDrag.bind(this.dragging);
              this.dragging._onDragEnd = MarkerDrag._onDragEnd.bind(this.dragging);
              this.dragging.disable();
              this.dragging.enable();
          }
          return ret;
      },

      _setPos: function(pos) {

          // TODO: use markerProto._setPos
          if (this._map._rotate) {
              pos = this._map.rotatedPointToMapPanePoint(pos);
          }

          // TODO: use markerProto._setPos
          var bearing = this.options.rotation || 0;
          if (this.options.rotateWithView) {
              bearing += this._map._bearing;
          }

          // TODO: use markerProto._setPos
          L.DomUtil.setPosition(this._icon, pos, bearing, pos);

          // TODO: use markerProto._setPos
          if (this._shadow) {
              L.DomUtil.setPosition(this._shadow, pos, bearing, pos);
          }

          this._zIndex = pos.y + this.options.zIndexOffset;

          this._resetZIndex();
      },

      _updateZIndex: function(offset) {
          if (!this._map._rotate) {
              return markerProto._updateZIndex.call(this, offset)
          }
          this._icon.style.zIndex = Math.round(this._zIndex + offset);
      },

      setRotation: function(rotation) {
          this.options.rotation = rotation;
          this.update();
      },

  });

  /**
   * L.GridLayer
   */
  const gridLayerProto = L.extend({}, L.GridLayer.prototype);

  L.GridLayer.include({

      getEvents: function() {
          var events = gridLayerProto.getEvents.call(this);
          if (this._map._rotate && !this.options.updateWhenIdle) {
              if (!this._onRotate) {
                  this._onRotate = L.Util.throttle(this._onMoveEnd, this.options.updateInterval, this);
              }
              events.rotate = this._onRotate;
          }
          return events;
      },

      _getTiledPixelBounds: function(center) {
          if (!this._map._rotate) {
              return gridLayerProto._getTiledPixelBounds.call(this, center);
          }

          var map = this._map,
              mapZoom = map._animatingZoom ? Math.max(map._animateToZoom, map.getZoom()) : map.getZoom(),
              scale = map.getZoomScale(mapZoom, this._tileZoom),
              pixelCenter = map.project(center, this._tileZoom).floor(),
              size = map.getSize(),
              halfSize = new L.Bounds([
                  map.containerPointToLayerPoint([0, 0]).floor(),
                  map.containerPointToLayerPoint([size.x, 0]).floor(),
                  map.containerPointToLayerPoint([0, size.y]).floor(),
                  map.containerPointToLayerPoint([size.x, size.y]).floor()
              ]).getSize().divideBy(scale * 2);

          return new L.Bounds(pixelCenter.subtract(halfSize), pixelCenter.add(halfSize));
      },

  });

  /**
   * L.Canvas
   */
  const canvasProto = L.extend({}, L.Canvas.prototype);

  L.Canvas.include({

      onAdd: function() {
          canvasProto.onAdd.call(this);
          // When rotating the canvas itself, it is cleared by some weird reason, so redraw.
          this._map.on('rotate', this._redraw, this);
      },

      onRemove: function() {
          canvasProto.onRemove.call(this);
          this._map.off('rotate', this._redraw, this);
      },

      _update: function() {
          canvasProto._update.call(this);
          // Tell paths to redraw themselves
          this.fire('update');
      },

  });

  /**
   * L.Renderer
   */
  const rendererProto = L.extend({}, L.Renderer.prototype);

  L.Renderer.include({

      onAdd: function() {
          rendererProto.onAdd.call(this);
          // this._map.on('rotate', this._update, this);
      },

      onRemove: function() {
          rendererProto.onRemove.call(this);
          // this._map.off('rotate', this._update, this);
      },

      _updateTransform: function(center, zoom) {
          if (!this._map._rotate) {
              return rendererProto._updateTransform.call(this, center, zoom);
          }
          var scale = this._map.getZoomScale(zoom, this._zoom),
              offset = this._map._latLngToNewLayerPoint(this._topLeft, zoom, center);
          if (L.Browser.any3d) {
              L.DomUtil.setTransform(this._container, offset, scale);
          } else {
              L.DomUtil.setPosition(this._container, offset);
          }
      },

      _update: function() {
          if (!this._map._rotate) {
              return rendererProto._update.call(this);
          }
          // Update pixel bounds of renderer container (for positioning/sizing/clipping later)
          // Subclasses are responsible of firing the 'update' event.
          var p = this.options.padding,
              map = this._map,
              size = this._map.getSize(),
              padMin = size.multiplyBy(-p),
              padMax = size.multiplyBy(1 + p),
              //// TODO: Somehow refactor this out into map.something() - the code is
              ////   pretty much the same as in GridLayer.
              clip = new L.Bounds([
                  map.containerPointToLayerPoint([padMin.x, padMin.y]).floor(),
                  map.containerPointToLayerPoint([padMin.x, padMax.y]).floor(),
                  map.containerPointToLayerPoint([padMax.x, padMin.y]).floor(),
                  map.containerPointToLayerPoint([padMax.x, padMax.y]).floor()
              ]);
          //min = this._map.containerPointToLayerPoint(size.multiplyBy(-p)).round();

          this._bounds = clip;
          // this._topLeft = clip.min;
          this._topLeft = this._map.layerPointToLatLng(clip.min);

          this._center = this._map.getCenter();
          this._zoom = this._map.getZoom();
      },

  });

  /**
   * L.SVG
   */
  const svgProto = L.extend({}, L.SVG.prototype);

  L.SVG.include({

      _update: function() {
          svgProto._update.call(this);
          if (this._map._rotate) {
              this.fire('update');
          }
      },

  });

  /**
   * L.Map
   */
  const mapProto = L.extend({}, L.Map.prototype);

  L.Map.mergeOptions({ rotate: false, bearing: 0, });

  L.Map.include({

      initialize: function(id, options) { // (HTMLElement or String, Object)
          if (options.rotate) {
              this._rotate = true;
              this._bearing = 0;
          }
          mapProto.initialize.call(this, id, options);
          if(this.options.rotate){
            this.setBearing(this.options.bearing);
          }
      },

      // createPane: function(name, container) {
      //     if (!this._rotate || name == 'mapPane') {
      //         return mapProto.createPane.call(this, name, container);
      //     }
      //     // init "rotatePane"
      //     if (!this._rotatePane) {
      //         // this._pivot = this.getSize().divideBy(2);
      //         this._rotatePane = mapProto.createPane.call(this, 'rotatePane', this._mapPane);
      //         L.DomUtil.setPosition(this._rotatePane, new L.Point(0, 0), this._bearing, this._pivot);
      //     }
      //     return mapProto.createPane.call(this, name, container || this._rotatePane);
      // },

      containerPointToLayerPoint: function(point) { // (Point)
          if (!this._rotate) {
              return mapProto.containerPointToLayerPoint.call(this, point);
          }
          return L.point(point)
              .subtract(this._getMapPanePos())
              .rotateFrom(-this._bearing, this._getRotatePanePos())
              .subtract(this._getRotatePanePos());
      },

      getBounds: function() {
          if (!this._rotate) {
              return mapProto.getBounds.call(this);
          }
          var size = this.getSize();
          var topleft = this.layerPointToLatLng(this.containerPointToLayerPoint([0, 0])),
              topright = this.layerPointToLatLng(this.containerPointToLayerPoint([size.x, 0])),
              bottomright = this.layerPointToLatLng(this.containerPointToLayerPoint([size.x, size.y])),
              bottomleft = this.layerPointToLatLng(this.containerPointToLayerPoint([0, size.y]));

          // Use LatLngBounds' build-in constructor that automatically extends the bounds to fit the passed points
          return new L.LatLngBounds([topleft, topright, bottomright, bottomleft]);
      },

      layerPointToContainerPoint: function(point) { // (Point)
          if (!this._rotate) {
              return mapProto.layerPointToContainerPoint.call(this, point);
          }
          return L.point(point)
              .add(this._getRotatePanePos())
              .rotateFrom(this._bearing, this._getRotatePanePos())
              .add(this._getMapPanePos());
      },

      // Rotation methods
      // setBearing will work with just the 'theta' parameter.
      setBearing: function(theta) {
          if (!L.Browser.any3d || !this._rotate) { return; }

          var rotatePanePos = this._getRotatePanePos();
          var halfSize = this.getSize().divideBy(2);
          this._pivot = this._getMapPanePos().clone().multiplyBy(-1).add(halfSize);

          rotatePanePos = rotatePanePos.rotateFrom(-this._bearing, this._pivot);

          this._bearing = theta * L.DomUtil.DEG_TO_RAD; // TODO: mod 360
          this._rotatePanePos = rotatePanePos.rotateFrom(this._bearing, this._pivot);

          L.DomUtil.setPosition(this._rotatePane, rotatePanePos, this._bearing, this._pivot);

          this.fire('rotate');
      },

      getBearing: function() {
          return this._bearing * L.DomUtil.RAD_TO_DEG;
      },

      _initPanes: function() {
          var panes = this._panes = {};
          this._paneRenderers = {};

          // @section
          //
          // Panes are DOM elements used to control the ordering of layers on the map. You
          // can access panes with [`map.getPane`](#map-getpane) or
          // [`map.getPanes`](#map-getpanes) methods. New panes can be created with the
          // [`map.createPane`](#map-createpane) method.
          //
          // Every map has the following default panes that differ only in zIndex.
          //
          // @pane mapPane: HTMLElement = 'auto'
          // Pane that contains all other map panes

          this._mapPane = this.createPane('mapPane', this._container);
          L.DomUtil.setPosition(this._mapPane, new L.Point(0, 0));

          if (this._rotate) {
              this._rotatePane = this.createPane('rotatePane', this._mapPane);
              this._norotatePane = this.createPane('norotatePane', this._mapPane);

              // @pane tilePane: HTMLElement = 2
              // Pane for tile layers
              this.createPane('tilePane', this._rotatePane);
              // @pane overlayPane: HTMLElement = 4
              // Pane for overlays like polylines and polygons
              this.createPane('overlayPane', this._rotatePane);

              // @pane shadowPane: HTMLElement = 5
              // Pane for overlay shadows (e.g. marker shadows)
              this.createPane('shadowPane', this._norotatePane);
              // @pane markerPane: HTMLElement = 6
              // Pane for marker icons
              this.createPane('markerPane', this._norotatePane);
              // @pane tooltipPane: HTMLElement = 650
              // Pane for tooltips.
              this.createPane('tooltipPane', this._norotatePane);
              // @pane popupPane: HTMLElement = 700
              // Pane for popups.
              this.createPane('popupPane', this._norotatePane);
          } else {
              // @pane tilePane: HTMLElement = 2
              // Pane for tile layers
              this.createPane('tilePane');
              // @pane overlayPane: HTMLElement = 4
              // Pane for overlays like polylines and polygons
              this.createPane('overlayPane');
              // @pane shadowPane: HTMLElement = 5
              // Pane for overlay shadows (e.g. marker shadows)
              this.createPane('shadowPane');
              // @pane markerPane: HTMLElement = 6
              // Pane for marker icons
              this.createPane('markerPane');
              // @pane tooltipPane: HTMLElement = 650
              // Pane for tooltips.
              this.createPane('tooltipPane');
              // @pane popupPane: HTMLElement = 700
              // Pane for popups.
              this.createPane('popupPane');
          }

          if (!this.options.markerZoomAnimation) {
              L.DomUtil.addClass(panes.markerPane, 'leaflet-zoom-hide');
              L.DomUtil.addClass(panes.shadowPane, 'leaflet-zoom-hide');
          }
      },

      // @method rotatedPointToMapPanePoint(point: Point): Point
      // Converts a coordinate from the rotated pane reference system
      // to the reference system of the not rotated map pane.
      rotatedPointToMapPanePoint: function(point) {
          return L.point(point).rotate(this._bearing)._add(this._getRotatePanePos());
      },

      // @method mapPanePointToRotatedPoint(point: Point): Point
      // Converts a coordinate from the not rotated map pane reference system
      // to the reference system of the rotated pane.
      mapPanePointToRotatedPoint: function(point) {
          return L.point(point)._subtract(this._getRotatePanePos()).rotate(-this._bearing);
      },

      // offset of the specified place to the current center in pixels
      _getCenterOffset: function(latlng) {
          var centerOffset = mapProto._getCenterOffset.call(this, latlng);
          if (this._rotate) {
              centerOffset = centerOffset.rotate(this._bearing);
          }
          return centerOffset;
      },

      _getRotatePanePos: function() {
          return this._rotatePanePos || new L.Point(0, 0);
      },

      _getNewPixelOrigin: function(center, zoom) {
          var viewHalf = this.getSize()._divideBy(2);
          if (!this._rotate) {
              mapProto._getNewPixelOrigin.call(this, center, zoom);
          }
          return this.project(center, zoom)
              .rotate(this._bearing)
              ._subtract(viewHalf)
              ._add(this._getMapPanePos())
              ._add(this._getRotatePanePos())
              .rotate(-this._bearing)
              ._round();
      },

      _handleGeolocationResponse: function(pos) {
          var lat = pos.coords.latitude,
              lng = pos.coords.longitude,
              // TODO: use mapProto._handleGeolocationResponse
              hdg = pos.coords.heading,
              latlng = new L.LatLng(lat, lng),
              bounds = latlng.toBounds(pos.coords.accuracy),
              options = this._locateOptions;

          if (options.setView) {
              var zoom = this.getBoundsZoom(bounds);
              this.setView(latlng, options.maxZoom ? Math.min(zoom, options.maxZoom) : zoom);
          }

          var data = {
              latlng: latlng,
              bounds: bounds,
              timestamp: pos.timestamp,
              // TODO: use mapProto._handleGeolocationResponse
              heading: hdg
          };

          for (var i in pos.coords) {
              if (typeof pos.coords[i] === 'number') {
                  data[i] = pos.coords[i];
              }
          }

          // @event locationfound: LocationEvent
          // Fired when geolocation (using the [`locate`](#map-locate) method)
          // went successfully.
          this.fire('locationfound', data);
      },

  });

  /*
   * L.Map.CompassBearing will rotate the map according to a smartphone's compass.
   */

  L.Map.CompassBearing = L.Handler.extend({

      initialize: function(map) {
          if (!window.DeviceOrientationEvent) {
              this._capable = false;
              return;
          }
          this._capable = true;
          this._map = map;

          this._throttled = L.Util.throttle(this._onDeviceOrientation, 1000, this);
      },

      addHooks: function() {
          if (this._capable && this._map._rotate) {
              L.DomEvent.on(window, 'deviceorientation', this._throttled, this);
          }
      },

      removeHooks: function() {
          if (this._capable && this._map._rotate) {
              L.DomEvent.off(window, 'deviceorientation', this._throttled, this);
          }
      },

      _onDeviceOrientation: function(event) {
          if (event.alpha !== null) {
              this._map.setBearing(event.alpha - window.orientation);
          }
      },

  });

  // @section Handlers
  // @property compassBearing: Handler
  // Compass bearing handler.
  L.Map.addInitHook('addHandler', 'compassBearing', L.Map.CompassBearing);

  /*
   * L.Handler.ContainerMutation triggers `invalidateResize` when the map's DOM container mutates.
   */

  // @namespace Map
  // @section Interaction Options
  L.Map.mergeOptions({

      // @option trackContainerMutation: Boolean = false
      // Whether the map uses [mutation observers](https://developer.mozilla.org/docs/Web/API/MutationObserver)
      // to detect changes in its container and trigger `invalidateSize`. Disabled
      // by default due to support not being available in all web browsers.
      trackContainerMutation: false

  });

  L.Map.ContainerMutation = L.Handler.extend({

      addHooks: function() {
          if (!L.Browser.mutation) {
              return;
          }

          if (!this._observer) {
              this._observer = new MutationObserver(L.Util.bind(this._onMutation, this));
          }

          this._observer.observe(this._map.getContainer(), {
              childList: false,
              attributes: true,
              characterData: false,
              subtree: false,
              attributeFilter: ['style']
          });
      },

      removeHooks: function() {
          if (!L.Browser.mutation) {
              return;
          }
          this._observer.disconnect();
      },

      _onMutation: function() {
          this._map.invalidateSize();
      },

  });

  // @section Handlers
  // @property containerMutation: Handler
  // Container mutation handler (disabled unless [`trackContainerMutation`](#map-trackcontainermutation) is set).
  L.Map.addInitHook('addHandler', 'trackContainerMutation', L.Map.ContainerMutation);

  /*
   * L.Handler.TouchGestures is both TouchZoom plus TouchRotate.
   */

  // @namespace Map
  // @section Interaction Options
  L.Map.mergeOptions({

      // @option bounceAtZoomLimits: Boolean = true
      // Set it to false if you don't want the map to zoom beyond min/max zoom
      // and then bounce back when pinch-zooming.
      bounceAtZoomLimits: true,

  });

  L.Map.TouchGestures = L.Handler.extend({

      initialize: function(map) {
          this._map = map;
          this.rotate = !!this._map.options.touchRotate;
          this.zoom = !!this._map.options.touchZoom;
      },

      addHooks: function() {
          L.DomEvent.on(this._map._container, 'touchstart', this._onTouchStart, this);
      },

      removeHooks: function() {
          L.DomEvent.off(this._map._container, 'touchstart', this._onTouchStart, this);
      },

      _onTouchStart: function(e) {
          var map = this._map;

          if (!e.touches || e.touches.length !== 2 || map._animatingZoom || this._zooming || this._rotating) { return; }

          var p1 = map.mouseEventToContainerPoint(e.touches[0]),
              p2 = map.mouseEventToContainerPoint(e.touches[1]),
              vector = p1.subtract(p2);

          this._centerPoint = map.getSize()._divideBy(2);
          this._startLatLng = map.containerPointToLatLng(this._centerPoint);

          if (this.zoom) {
              if (map.options.touchZoom !== 'center') {
                  this._pinchStartLatLng = map.containerPointToLatLng(p1.add(p2)._divideBy(2));
              }
              this._startDist = p1.distanceTo(p2);
              this._startZoom = map.getZoom();
              this._zooming = true;
          } else {
              this._zooming = false;
          }

          if (this.rotate) {
              this._startTheta = Math.atan(vector.x / vector.y);
              this._startBearing = map.getBearing();
              if (vector.y < 0) { this._startBearing += 180; }
              this._rotating = true;
          } else {
              this._rotating = false;
          }

          this._moved = false;

          map.stop();

          L.DomEvent
              .on(document, 'touchmove', this._onTouchMove, this)
              .on(document, 'touchend', this._onTouchEnd, this);

          L.DomEvent.preventDefault(e);
      },

      _onTouchMove: function(e) {
          if (!e.touches || e.touches.length !== 2 || !(this._zooming || this._rotating)) { return; }

          var map = this._map,
              p1 = map.mouseEventToContainerPoint(e.touches[0]),
              p2 = map.mouseEventToContainerPoint(e.touches[1]),
              vector = p1.subtract(p2),
              scale = p1.distanceTo(p2) / this._startDist,
              delta;

          if (this._rotating) {
              var theta = Math.atan(vector.x / vector.y);
              var bearingDelta = (theta - this._startTheta) * L.DomUtil.RAD_TO_DEG;
              if (vector.y < 0) { bearingDelta += 180; }
              if (bearingDelta) {
                  /// TODO: The pivot should be the last touch point, but zoomAnimation manages to
                  ///   overwrite the rotate pane position. Maybe related to #3529.
                  map.setBearing(this._startBearing - bearingDelta);
              }
          }

          if (this._zooming) {
              this._zoom = map.getScaleZoom(scale, this._startZoom);

              if (!map.options.bounceAtZoomLimits && (
                      (this._zoom < map.getMinZoom() && scale < 1) ||
                      (this._zoom > map.getMaxZoom() && scale > 1))) {
                  this._zoom = map._limitZoom(this._zoom);
              }

              if (map.options.touchZoom === 'center') {
                  this._center = this._startLatLng;
                  if (scale === 1) { return; }
              } else {
                  // Get delta from pinch to center, so centerLatLng is delta applied to initial pinchLatLng
                  delta = p1._add(p2)._divideBy(2)._subtract(this._centerPoint);
                  if (scale === 1 && delta.x === 0 && delta.y === 0) { return; }

                  var alpha = -map.getBearing() * L.DomUtil.DEG_TO_RAD;

                  this._center = map.unproject(map.project(this._pinchStartLatLng).subtract(delta.rotate(alpha)));
              }

          }

          if (!this._moved) {
              map._moveStart(true);
              this._moved = true;
          }

          L.Util.cancelAnimFrame(this._animRequest);

          var moveFn = L.bind(map._move, map, this._center, this._zoom, { pinch: true, round: false });
          this._animRequest = L.Util.requestAnimFrame(moveFn, this, true);

          L.DomEvent.preventDefault(e);
      },

      _onTouchEnd: function() {
          if (!this._moved || !this._zooming) {
              this._zooming = false;
              return;
          }

          this._zooming = false;
          this._rotating = false;
          L.Util.cancelAnimFrame(this._animRequest);

          L.DomEvent
              .off(document, 'touchmove', this._onTouchMove)
              .off(document, 'touchend', this._onTouchEnd);

          if (this.zoom) {
              // Pinch updates GridLayers' levels only when snapZoom is off, so snapZoom becomes noUpdate.
              if (this._map.options.zoomAnimation) {
                  this._map._animateZoom(this._center, this._map._limitZoom(this._zoom), true, this._map.options.snapZoom);
              } else {
                  this._map._resetView(this._center, this._map._limitZoom(this._zoom));
              }
          }
      },

  });

  // @section Handlers
  // @property touchGestures: Handler
  // Touch gestures handler.
  L.Map.addInitHook('addHandler', 'touchGestures', L.Map.TouchGestures);

  /*
   * L.Handler.TouchRotate is used by L.Map to add two-finger rotation gestures.
   */

  // @namespace Map
  // @section Interaction Options
  L.Map.mergeOptions({

      // @section Touch interaction options
      // @option touchRotate: Boolean|String = *
      // Whether the map can be rotated with a two-finger rotation gesture
      touchRotate: false,

  });

  L.Map.TouchRotate = L.Handler.extend({

      addHooks: function() {
          this._map.touchGestures.enable();
          this._map.touchGestures.rotate = true;
      },

      removeHooks: function() {
          this._map.touchGestures.rotate = false;
      },

  });

  // @section Handlers
  // @property touchZoom: Handler
  // Touch rotate handler.
  L.Map.addInitHook('addHandler', 'touchRotate', L.Map.TouchRotate);

  /*
   * L.Handler.ShiftKeyRotate is used by L.Map to add shift-wheel rotation.
   */

  // @namespace Map
  // @section Interaction Options
  L.Map.mergeOptions({

      // @section ShiftKey interaction options
      // @option shiftKeyRotate: Boolean|String = *
      // Whether the map can be rotated with a shit-wheel rotation
      shiftKeyRotate: true,

  });

  L.Map.ShiftKeyRotate = L.Handler.extend({

      addHooks: function() {
          L.DomEvent.on(this._map._container, "wheel", this._handleShiftScroll, this);
          // this._map.shiftKeyRotate.enable();
          this._map.shiftKeyRotate.rotate = true;
      },

      removeHooks: function() {
          L.DomEvent.off(this._map._container, "wheel", this._handleShiftScroll, this);
          this._map.shiftKeyRotate.rotate = false;
      },

      _handleShiftScroll: function(e) {
          if (e.shiftKey) {
              e.preventDefault();
              this._map.scrollWheelZoom.disable();
              this._map.setBearing((this._map._bearing * L.DomUtil.RAD_TO_DEG) + Math.sign(e.deltaY) * 5);
          } else {
              this._map.scrollWheelZoom.enable();
          }
      },

  });

  // @section Handlers
  // @property touchZoom: Handler
  // Touch rotate handler.
  L.Map.addInitHook('addHandler', 'shiftKeyRotate', L.Map.ShiftKeyRotate);

  // decrease "scrollWheelZoom" handler priority over "shiftKeyRotate" handler
  L.Map.addInitHook(function() {
      if (this.scrollWheelZoom.enabled() && this.shiftKeyRotate.enabled()) {
          this.scrollWheelZoom.disable();
          this.scrollWheelZoom.enable();
      }
  });

  /*
   * L.Handler.TouchZoom is used by L.Map to add pinch zoom on supported mobile browsers.
   */

  // @namespace Map
  // @section Interaction Options
  L.Map.mergeOptions({

      // @section Touch interaction options
      // @option touchZoom: Boolean|String = *
      // Whether the map can be zoomed by touch-dragging with two fingers. If
      // passed `'center'`, it will zoom to the center of the view regardless of
      // where the touch events (fingers) were. Enabled for touch-capable web
      // browsers except for old Androids.
      touchZoom: L.Browser.touch && !L.Browser.android23,

      bounceAtZoomLimits: false,
  });

  L.Map.TouchZoom = L.Handler.extend({

      addHooks: function() {
          L.DomUtil.addClass(this._map._container, 'leaflet-touch-zoom');
          this._map.touchGestures.enable();
          this._map.touchGestures.zoom = true;
      },

      removeHooks: function() {
          L.DomUtil.removeClass(this._map._container, 'leaflet-touch-zoom');
          this._map.touchGestures.zoom = false;
      },

  });

  // @section Handlers
  // @property touchZoom: Handler
  // Touch zoom handler.
  L.Map.addInitHook('addHandler', 'touchZoom', L.Map.TouchZoom);

  /**
   * L.Control.Rotate
   */

  // A tri-state control for map rotation. States are:
  // Locked (default)
  // Unlocked (user can pinch-rotate)
  // Follow (rotation follows device orientation, if available)
  L.Control.Rotate = L.Control.extend({

      options: {
          position: 'topleft',
          closeOnZeroBearing: true
      },

      onAdd: function(map) {
          this._onDeviceOrientation = L.Util.throttle(this._unthrottledOnDeviceOrientation, 100, this);

          var container = this._container = L.DomUtil.create('div', 'leaflet-control-rotate leaflet-bar');

          // this.button = L.Control.Zoom.prototype._createButton.call(this, 'R', 'leaflet-control-rotate', 'leaflet-control-rotate', container, this._toggleLock);

          var arrow = this._arrow = L.DomUtil.create('span', 'leaflet-control-rotate-arrow');

          arrow.style.backgroundImage = `url("data:image/svg+xml;charset=utf-8,%3Csvg width='29' height='29' viewBox='0 0 29 29' xmlns='http://www.w3.org/2000/svg' fill='%23333'%3E%3Cpath d='M10.5 14l4-8 4 8h-8z'/%3E%3Cpath d='M10.5 16l4 8 4-8h-8z' fill='%23ccc'/%3E%3C/svg%3E")`;
          arrow.style.cursor = 'grab';
          arrow.style.display = 'block';
          arrow.style.width = '100%';
          arrow.style.height = '100%';
          arrow.style.backgroundRepeat = 'no-repeat';
          arrow.style.backgroundPosition = '50%';

          // Copy-pasted from L.Control.Zoom
          var link = this._link = L.DomUtil.create('a', 'leaflet-control-rotate-toggle', container);
          link.appendChild(arrow);
          link.href = '#';
          link.title = 'Rotate map';

          L.DomEvent
              .on(link, 'dblclick', L.DomEvent.stopPropagation)
              .on(link, 'mousedown', this._handleMouseDown, this)
              .on(link, 'click', L.DomEvent.stop)
              .on(link, 'click', this._cycleState, this)
              .on(link, 'click', this._refocusOnMap, this);

          if (!L.Browser.any3d) {
              L.DomUtil.addClass(link, 'leaflet-disabled');
          }

          this._restyle();

          map.on('rotate', this._restyle.bind(this));

          // State flag
          this._follow = false;
          this._canFollow = false;

          if (this.options.closeOnZeroBearing && map.getBearing() === 0) {
              container.style.display = 'none';
          }

          return container;
      },

      _handleMouseDown: function(e) {
          L.DomEvent.stopPropagation(e);
          this.dragging = true;
          this.dragstartX = e.pageX;
          this.dragstartY = e.pageY;
          L.DomEvent
              .on(document, 'mousemove', this._handleMouseDrag, this)
              .on(document, 'mouseup', this._handleMouseUp, this);
      },

      _handleMouseUp: function(e) {
          L.DomEvent.stopPropagation(e);
          this.dragging = false;

          L.DomEvent
              .off(document, 'mousemove', this._handleMouseDrag, this)
              .off(document, 'mouseup', this._handleMouseUp, this);
      },

      _handleMouseDrag: function(e) {
          if (!this.dragging) { return; }
          var deltaX = e.clientX - this.dragstartX;
          this._map.setBearing(deltaX);
      },

      _cycleState: function(ev) {
          var map = this._map;

          if (!map) { return; }

          if (!map.touchRotate.enabled() && !map.compassBearing.enabled()) {
              // Go from disabled to touch
              map.touchRotate.enable();

              // console.log('state is now: touch rotate');
          } else {

              if (!map.compassBearing.enabled()) {
                  // Go from touch to compass
                  map.touchRotate.disable();
                  map.compassBearing.enable();

                  // console.log('state is now: compass');

                  // It is possible that compass is not supported. If so,
                  // the hangler will automatically go from compass to disabled.
              } else {
                  // Go from compass to disabled
                  map.compassBearing.disable();

                  // console.log('state is now: locked');

                  map.setBearing(0);
                  if (this.options.closeOnZeroBearing) {
                      map.touchRotate.enable();
                  }
              }
          }
          this._restyle();
      },

      _restyle: function() {
          if (this._map.options.rotate) {
              var map = this._map;
              var bearing = map.getBearing();
              if (this.options.closeOnZeroBearing && bearing) {
                  this._container.style.display = 'block';
              }

              var cssTransform = 'rotate(' + bearing + 'deg)';
              this._arrow.style.transform = cssTransform;

              if (map.compassBearing.enabled()) {
                  this._link.style.backgroundColor = 'orange';
              } else if (map.touchRotate.enabled()) {
                  this._link.style.backgroundColor = null;
              } else {
                  this._link.style.backgroundColor = 'grey';
                  if (this.options.closeOnZeroBearing && map.getBearing() === 0) {
                      this._container.style.display = 'none';
                  }
              }
          } else {
              L.DomUtil.addClass(this._link, 'leaflet-disabled');
          }
      },

  });

  L.control.rotate = function(options) {
      return new L.Control.Rotate(options);
  };

  L.Map.mergeOptions({
      rotateControl: true,
  });

  L.Map.addInitHook(function() {
      if (this.options.rotateControl) {
          var options = typeof this.options.rotateControl === 'object' ? this.options.rotateControl : {};
          this.rotateControl = L.control.rotate(options);
          this.addControl(this.rotateControl);
      }
  });

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
      const LDomUtilApplyClassesMethod = (method, element, classNames) => {
          classNames = classNames.split(' ');
          classNames.forEach(function(className) {
              L.DomUtil[method].call(this, element, className);
          });
      };

      const addClasses = (el, names) => LDomUtilApplyClassesMethod('addClass', el, names);
      const removeClasses = (el, names) => LDomUtilApplyClassesMethod('removeClass', el, names);

      /**
       * Compatible with L.Circle but a true marker instead of a path
       */
      const LocationMarker = L.Marker.extend({
          initialize(latlng, options) {
              L.Util.setOptions(this, options);
              this._latlng = latlng;
              this.createIcon();
          },

          /**
           * Create a styled circle location marker
           */
          createIcon() {
              const opt = this.options;

              let style = '';

              if (opt.color !== undefined) {
                  style += `stroke:${opt.color};`;
              }
              if (opt.weight !== undefined) {
                  style += `stroke-width:${opt.weight};`;
              }
              if (opt.fillColor !== undefined) {
                  style += `fill:${opt.fillColor};`;
              }
              if (opt.fillOpacity !== undefined) {
                  style += `fill-opacity:${opt.fillOpacity};`;
              }
              if (opt.opacity !== undefined) {
                  style += `opacity:${opt.opacity};`;
              }

              const icon = this._getIconSVG(opt, style);

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
          _getIconSVG(options, style) {
              const r = options.radius;
              const w = options.weight;
              const s = r + w;
              const s2 = s * 2;
              const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s2}" height="${s2}" version="1.1" viewBox="-${s} -${s} ${s2} ${s2}">` +
              '<circle r="'+r+'" style="'+style+'" />' +
              '</svg>';
              return {
                  className: 'leaflet-control-locate-location',
                  svg,
                  w: s2,
                  h: s2
              };
          },

          setStyle(style) {
              L.Util.setOptions(this, style);
              this.createIcon();
          }
      });

      const CompassMarker = LocationMarker.extend({
          initialize(latlng, heading, options) {
              L.Util.setOptions(this, options);
              this._latlng = latlng;
              this._heading = heading;
              this.createIcon();
          },

          setHeading(heading) {
              this._heading = heading;
          },

          /**
           * Create a styled arrow compass marker
           */
          _getIconSVG(options, style) {
              const r = options.radius;
              const w = (options.width + options.weight);
              const h = (r+options.depth + options.weight)*2;
              const path = `M0,0 l${options.width/2},${options.depth} l-${w},0 z`;
              const svgstyle = `transform: rotate(${this._heading}deg)`;
              const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" version="1.1" viewBox="-${w/2} 0 ${w} ${h}" style="${svgstyle}">`+
              '<path d="'+path+'" style="'+style+'" />'+
              '</svg>';
              return {
                  className: 'leaflet-control-locate-heading',
                  svg,
                  w,
                  h
              };
          },
      });


      const LocateControl = L.Control.extend({
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
       /** After activating the plugin by clicking on the icon, zoom to the selected zoom level, even when keepCurrentZoomLevel is true. Set to 'false' to disable this feature. */
       initialZoomLevel: false,
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
              getLocationBounds(locationEvent) {
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
              icon: 'leaflet-control-locate-location-arrow',
              iconLoading: 'leaflet-control-locate-spinner',
              /** The element to be created for icons. For example span or i */
              iconElementTag: 'span',
              /** The element to be created for the text. For example small or span */
              textElementTag: 'small',
              /** Padding around the accuracy circle. */
              circlePadding: [0, 0],
              /** Use metric units. */
              metric: true,
              /**
               * This callback can be used in case you would like to override button creation behavior.
               * This is useful for DOM manipulation frameworks such as angular etc.
               * This function should return an object with HtmlElement for the button (link property) and the icon (icon property).
               */
              createButtonCallback(container, options) {
                  const link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single', container);
                  link.title = options.strings.title;
                  link.href = '#';
                  link.setAttribute('role', 'button');
                  const icon = L.DomUtil.create(options.iconElementTag, options.icon, link);

                  if (options.strings.text !== undefined) {
                      const text = L.DomUtil.create(options.textElementTag, 'leaflet-locate-text', link);
                      text.textContent = options.strings.text;
                      link.classList.add('leaflet-locate-text-active');
                      link.parentNode.style.display = "flex";
                      if (options.icon.length > 0) {
                          icon.classList.add('leaflet-locate-icon');
                      }
                  }

                  return { link, icon };
              },
              /** This event is called in case of any location error that is not a time out error. */
              onLocationError(err, control) {
                  alert(err.message);
              },
              /**
               * This event is called when the user's location is outside the bounds set on the map.
               * The event is called repeatedly when the location changes.
               */
              onLocationOutsideMapBounds(control) {
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

          initialize(options) {
              // set default options if nothing is set (merge one step deep)
              for (const i in options) {
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
          onAdd(map) {
              const container = L.DomUtil.create('div',
              'leaflet-control-locate leaflet-bar leaflet-control');
              this._container = container;
              this._map = map;
              this._layer = this.options.layer || new L.LayerGroup();
              this._layer.addTo(map);
              this._event = undefined;
              this._compassHeading = null;
              this._prevBounds = null;

              const linkAndIcon = this.options.createButtonCallback(container, this.options);
              this._link = linkAndIcon.link;
              this._icon = linkAndIcon.icon;

              L.DomEvent.on(
                this._link,
                "click",
                function (ev) {
                  L.DomEvent.stopPropagation(ev);
                  L.DomEvent.preventDefault(ev);
                  this._onClick();
                },
                this
              ).on(this._link, "dblclick", L.DomEvent.stopPropagation);

              this._resetVariables();

              this._map.on('unload', this._unload, this);

              return container;
          },

          /**
           * This method is called when the user clicks on the control.
           */
          _onClick() {
              this._justClicked = true;
              const wasFollowing =  this._isFollowing();
              this._userPanned = false;
              this._userZoomed = false;

              if (this._active && !this._event) {
                  // click while requesting
                  this.stop();
              } else if (this._active) {
                  const behaviors = this.options.clickBehavior;
                  let behavior = behaviors.outOfView;
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
                              const f = this.options.flyTo ? this._map.flyToBounds : this._map.fitBounds;
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
          start() {
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
          stop() {
              this._deactivate();

              this._cleanClasses();
              this._resetVariables();

              this._removeMarker();
          },

          /**
           * Keep the control active but stop following the location
           */
          stopFollowing() {
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
          _activate() {
              if (!this._active) {
                  this._map.locate(this.options.locateOptions);
                  this._map.fire('locateactivate', this);
                  this._active = true;

                  // bind event listeners
                  this._map.on('locationfound', this._onLocationFound, this);
                  this._map.on('locationerror', this._onLocationError, this);
                  this._map.on('dragstart', this._onDrag, this);
                  this._map.on('zoomstart', this._onZoom, this);
                  this._map.on('zoomend', this._onZoomEnd, this);
                  if (this.options.showCompass) {
                      const oriAbs = 'ondeviceorientationabsolute' in window;
                      if (oriAbs || ('ondeviceorientation' in window)) {
                          const _this = this;
                          const deviceorientation = function () {
                              L.DomEvent.on(window, oriAbs ? 'deviceorientationabsolute' : 'deviceorientation', _this._onDeviceOrientation, _this);
                          };
                          if (DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
                              DeviceOrientationEvent.requestPermission().then(function (permissionState) {
                                  if (permissionState === 'granted') {
                                      deviceorientation();
                                  }
                              });
                          } else {
                              deviceorientation();
                          }
                      }
                  }
              }
          },

          /**
           * Called to stop the location engine.
           *
           * Override it to shutdown any functionalities you added on start.
           */
          _deactivate() {
              this._map.stopLocate();
              this._map.fire('locatedeactivate', this);
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
          setView() {
                      this._drawMarker();
                      if (this._isOutsideMapBounds()) {
                          this._event = undefined;  // clear the current location so we can get back into the bounds
                          this.options.onLocationOutsideMapBounds(this);
                      } else {
                          if (this._justClicked && this.options.initialZoomLevel !== false) {
                                      var f = this.options.flyTo ? this._map.flyTo : this._map.setView;
                                      f.bind(this._map)([this._event.latitude, this._event.longitude], this.options.initialZoomLevel);
                          } else if (this.options.keepCurrentZoomLevel) {
                                      var f = this.options.flyTo ? this._map.flyTo : this._map.panTo;
                                      f.bind(this._map)([this._event.latitude, this._event.longitude]);
                          } else {
                              var f = this.options.flyTo ? this._map.flyToBounds : this._map.fitBounds;
                              // Ignore zoom events while setting the viewport as these would stop following
                              this._ignoreEvent = true;
                              f.bind(this._map)(this.options.getLocationBounds(this._event), {
                                  padding: this.options.circlePadding,
                                  maxZoom: this.options.initialZoomLevel || this.options.locateOptions.maxZoom
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
          _drawCompass() {
              if (!this._event) {
                  return;
              }

              const latlng = this._event.latlng;

              if (this.options.showCompass && latlng && this._compassHeading !== null) {
                  const cStyle = this._isFollowing() ? this.options.followCompassStyle : this.options.compassStyle;
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
          _drawMarker() {
              if (this._event.accuracy === undefined) {
                  this._event.accuracy = 0;
              }

              const radius = this._event.accuracy;
              const latlng = this._event.latlng;

              // circle with the radius of the location's accuracy
              if (this.options.drawCircle) {
                  const style = this._isFollowing() ? this.options.followCircleStyle : this.options.circleStyle;

                  if (!this._circle) {
                      this._circle = L.circle(latlng, radius, style).addTo(this._layer);
                  } else {
                      this._circle.setLatLng(latlng).setRadius(radius).setStyle(style);
                  }
              }

              let distance;
              let unit;
              if (this.options.metric) {
                  distance = radius.toFixed(0);
                  unit =  this.options.strings.metersUnit;
              } else {
                  distance = (radius * 3.2808399).toFixed(0);
                  unit = this.options.strings.feetUnit;
              }

              // small inner marker
              if (this.options.drawMarker) {
                  const mStyle = this._isFollowing() ? this.options.followMarkerStyle : this.options.markerStyle;
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

              const t = this.options.strings.popup;
              function getPopupText() {
                  if (typeof t === 'string') {
                      return L.Util.template(t, {distance, unit});
                  } else if (typeof t === 'function') {
                      return t({distance, unit});
                  } else {
                      return t;
                  }
              }
              if (this.options.showPopup && t && this._marker) {
                  this._marker
                      .bindPopup(getPopupText())
                      ._popup.setLatLng(latlng);
              }
              if (this.options.showPopup && t && this._compass) {
                  this._compass
                      .bindPopup(getPopupText())
                      ._popup.setLatLng(latlng);
              }
          },

          /**
           * Remove the marker from map.
           */
          _removeMarker() {
              this._layer.clearLayers();
              this._marker = undefined;
              this._circle = undefined;
          },

          /**
           * Unload the plugin and all event listeners.
           * Kind of the opposite of onAdd.
           */
          _unload() {
              this.stop();
              this._map.off('unload', this._unload, this);
          },

          /**
           * Sets the compass heading
           */
          _setCompassHeading(angle) {
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
          _onCompassNeedsCalibration() {
              this._setCompassHeading();
          },

          /**
           * Process and normalise compass events
           */
          _onDeviceOrientation(e) {
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
          _onLocationError(err) {
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
          _onLocationFound(e) {
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
          _onDrag() {
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
          _onZoom() {
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
          _onZoomEnd() {
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
          _isFollowing() {
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
          _isOutsideMapBounds() {
              if (this._event === undefined) {
                  return false;
              }
              return this._map.options.maxBounds &&
                  !this._map.options.maxBounds.contains(this._event.latlng);
          },

          /**
           * Toggles button class between following and active.
           */
          _updateContainerStyle() {
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
          _setClasses(state) {
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
          _cleanClasses() {
              L.DomUtil.removeClass(this._container, "requesting");
              L.DomUtil.removeClass(this._container, "active");
              L.DomUtil.removeClass(this._container, "following");

              removeClasses(this._icon, this.options.iconLoading);
              addClasses(this._icon, this.options.icon);
          },

          /**
           * Reinitializes state variables.
           */
          _resetVariables() {
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

      L.control.locate = (options) => new L.Control.Locate(options);

      return LocateControl;
  }, window));

  /*!
  * Based on package 'screenfull'
  * v5.2.0 - 2021-11-03
  * (c) Sindre Sorhus; MIT License
  * Added definition for using screenfull as an amd module
  * Must be placed before the definition of leaflet.fullscreen
  * as it is required by that
  */
  (function (root, factory) {
  	if (typeof define === 'function' && define.amd) {
  		define('screenfull', factory);
    } else if (typeof module === 'object' && module.exports) {
  		module.exports.screenfull = factory();
    } else {
  		// Save 'screenfull' into global window variable
  		root.screenfull = factory();
  	}
  }(typeof self !== 'undefined' ? self : window, function () {

  	var document = typeof window !== 'undefined' && typeof window.document !== 'undefined' ? window.document : {};

  	var fn = (function () {
  		var val;

  		var fnMap = [
  			[
  				'requestFullscreen',
  				'exitFullscreen',
  				'fullscreenElement',
  				'fullscreenEnabled',
  				'fullscreenchange',
  				'fullscreenerror'
  			],
  			// New WebKit
  			[
  				'webkitRequestFullscreen',
  				'webkitExitFullscreen',
  				'webkitFullscreenElement',
  				'webkitFullscreenEnabled',
  				'webkitfullscreenchange',
  				'webkitfullscreenerror'

  			],
  			// Old WebKit
  			[
  				'webkitRequestFullScreen',
  				'webkitCancelFullScreen',
  				'webkitCurrentFullScreenElement',
  				'webkitCancelFullScreen',
  				'webkitfullscreenchange',
  				'webkitfullscreenerror'

  			],
  			[
  				'mozRequestFullScreen',
  				'mozCancelFullScreen',
  				'mozFullScreenElement',
  				'mozFullScreenEnabled',
  				'mozfullscreenchange',
  				'mozfullscreenerror'
  			],
  			[
  				'msRequestFullscreen',
  				'msExitFullscreen',
  				'msFullscreenElement',
  				'msFullscreenEnabled',
  				'MSFullscreenChange',
  				'MSFullscreenError'
  			]
  		];

  		var i = 0;
  		var l = fnMap.length;
  		var ret = {};

  		for (; i < l; i++) {
  			val = fnMap[i];
  			if (val && val[1] in document) {
  				for (i = 0; i < val.length; i++) {
  					ret[fnMap[0][i]] = val[i];
  				}
  				return ret;
  			}
  		}

  		return false;
  	})();

  	var eventNameMap = {
  		change: fn.fullscreenchange,
  		error: fn.fullscreenerror
  	};

  	var screenfull = {
  		request: function (element, options) {
  			return new Promise(function (resolve, reject) {
  				var onFullScreenEntered = function () {
  					this.off('change', onFullScreenEntered);
  					resolve();
  				}.bind(this);

  				this.on('change', onFullScreenEntered);

  				element = element || document.documentElement;

  				var returnPromise = element[fn.requestFullscreen](options);

  				if (returnPromise instanceof Promise) {
  					returnPromise.then(onFullScreenEntered).catch(reject);
  				}
  			}.bind(this));
  		},
  		exit: function () {
  			return new Promise(function (resolve, reject) {
  				if (!this.isFullscreen) {
  					resolve();
  					return;
  				}

  				var onFullScreenExit = function () {
  					this.off('change', onFullScreenExit);
  					resolve();
  				}.bind(this);

  				this.on('change', onFullScreenExit);

  				var returnPromise = document[fn.exitFullscreen]();

  				if (returnPromise instanceof Promise) {
  					returnPromise.then(onFullScreenExit).catch(reject);
  				}
  			}.bind(this));
  		},
  		toggle: function (element, options) {
  			return this.isFullscreen ? this.exit() : this.request(element, options);
  		},
  		onchange: function (callback) {
  			this.on('change', callback);
  		},
  		onerror: function (callback) {
  			this.on('error', callback);
  		},
  		on: function (event, callback) {
  			var eventName = eventNameMap[event];
  			if (eventName) {
  				document.addEventListener(eventName, callback, false);
  			}
  		},
  		off: function (event, callback) {
  			var eventName = eventNameMap[event];
  			if (eventName) {
  				document.removeEventListener(eventName, callback, false);
  			}
  		},
  		raw: fn
  	};

  	if (!fn) {
  		return {isEnabled: false};
  	} else {
  		Object.defineProperties(screenfull, {
  			isFullscreen: {
  				get: function () {
  					return Boolean(document[fn.fullscreenElement]);
  				}
  			},
  			element: {
  				enumerable: true,
  				get: function () {
  					return document[fn.fullscreenElement];
  				}
  			},
  			isEnabled: {
  				enumerable: true,
  				get: function () {
  					// Coerce to boolean in case of old WebKit
  					return Boolean(document[fn.fullscreenEnabled]);
  				}
  			}
  		});
  		return screenfull;
  	}
  }));

  /*!
  * leaflet.fullscreen
  */
  (function (root, factory) {
    if (typeof define === 'function' && define.amd) {
  		// define an AMD module that requires 'leaflet' and 'screenfull'
  		// and resolve to an object containing leaflet and screenfull
  		define('leafletFullScreen', ['leaflet', 'screenfull'], factory);
    } else if (typeof module === 'object' && module.exports) {
  		// define a CommonJS module that requires 'leaflet' and 'screenfull'
  		module.exports = factory(require('leaflet'), require('screenfull'));
    } else {
  		// Assume 'leaflet' and 'screenfull' are loaded into global variable already
  		factory(root.L, root.screenfull);
  	}
  }(typeof self !== 'undefined' ? self : window, function (leaflet, screenfull) {

  	leaflet.Control.FullScreen = leaflet.Control.extend({
  		options: {
  			position: 'topleft',
  			title: 'Full Screen',
  			titleCancel: 'Exit Full Screen',
  			forceSeparateButton: false,
  			forcePseudoFullscreen: false,
  			fullscreenElement: false
  		},

  		_screenfull: screenfull,

  		onAdd: function (map) {
  			var className = 'leaflet-control-zoom-fullscreen', container, content = '';

  			if (map.zoomControl && !this.options.forceSeparateButton) {
  				container = map.zoomControl._container;
  			} else {
  				container = leaflet.DomUtil.create('div', 'leaflet-bar');
  			}

  			if (this.options.content) {
  				content = this.options.content;
  			} else {
  				className += ' fullscreen-icon';
  			}

  			this._createButton(this.options.title, className, content, container, this.toggleFullScreen, this);
  			this._map.fullscreenControl = this;

  			this._map.on('enterFullscreen exitFullscreen', this._toggleState, this);

  			return container;
  		},

  		onRemove: function () {
  			leaflet.DomEvent
  				.off(this.link, 'click', leaflet.DomEvent.stop)
  				.off(this.link, 'click', this.toggleFullScreen, this);

  			if (this._screenfull.isEnabled) {
  				leaflet.DomEvent
  					.off(this._container, this._screenfull.raw.fullscreenchange, leaflet.DomEvent.stop)
  					.off(this._container, this._screenfull.raw.fullscreenchange, this._handleFullscreenChange, this);

  				leaflet.DomEvent
  					.off(document, this._screenfull.raw.fullscreenchange, leaflet.DomEvent.stop)
  					.off(document, this._screenfull.raw.fullscreenchange, this._handleFullscreenChange, this);
  			}
  		},

  		_createButton: function (title, className, content, container, fn, context) {
  			this.link = leaflet.DomUtil.create('a', className, container);
  			this.link.href = '#';
  			this.link.title = title;
  			this.link.innerHTML = content;

  			this.link.setAttribute('role', 'button');
  			this.link.setAttribute('aria-label', title);

  			L.DomEvent.disableClickPropagation(container);

  			leaflet.DomEvent
  				.on(this.link, 'click', leaflet.DomEvent.stop)
  				.on(this.link, 'click', fn, context);

  			if (this._screenfull.isEnabled) {
  				leaflet.DomEvent
  					.on(container, this._screenfull.raw.fullscreenchange, leaflet.DomEvent.stop)
  					.on(container, this._screenfull.raw.fullscreenchange, this._handleFullscreenChange, context);

  				leaflet.DomEvent
  					.on(document, this._screenfull.raw.fullscreenchange, leaflet.DomEvent.stop)
  					.on(document, this._screenfull.raw.fullscreenchange, this._handleFullscreenChange, context);
  			}

  			return this.link;
  		},

  		toggleFullScreen: function () {
  			var map = this._map;
  			map._exitFired = false;
  			if (map._isFullscreen) {
  				if (this._screenfull.isEnabled && !this.options.forcePseudoFullscreen) {
  					this._screenfull.exit();
  				} else {
  					leaflet.DomUtil.removeClass(this.options.fullscreenElement ? this.options.fullscreenElement : map._container, 'leaflet-pseudo-fullscreen');
  					map.invalidateSize();
  				}
  				map.fire('exitFullscreen');
  				map._exitFired = true;
  				map._isFullscreen = false;
  			}
  			else {
  				if (this._screenfull.isEnabled && !this.options.forcePseudoFullscreen) {
  					this._screenfull.request(this.options.fullscreenElement ? this.options.fullscreenElement : map._container);
  				} else {
  					leaflet.DomUtil.addClass(this.options.fullscreenElement ? this.options.fullscreenElement : map._container, 'leaflet-pseudo-fullscreen');
  					map.invalidateSize();
  				}
  				map.fire('enterFullscreen');
  				map._isFullscreen = true;
  			}
  		},

  		_toggleState: function () {
  			this.link.title = this._map._isFullscreen ? this.options.title : this.options.titleCancel;
  			this._map._isFullscreen ? L.DomUtil.removeClass(this.link, 'leaflet-fullscreen-on') : L.DomUtil.addClass(this.link, 'leaflet-fullscreen-on');
  		},

  		_handleFullscreenChange: function () {
  			var map = this._map;
  			map.invalidateSize();
  			if (!this._screenfull.isFullscreen && !map._exitFired) {
  				map.fire('exitFullscreen');
  				map._exitFired = true;
  				map._isFullscreen = false;
  			}
  		}
  	});

  	leaflet.Map.include({
  		toggleFullscreen: function () {
  			this.fullscreenControl.toggleFullScreen();
  		}
  	});

  	leaflet.Map.addInitHook(function () {
  		if (this.options.fullscreenControl) {
  			this.addControl(leaflet.control.fullscreen(this.options.fullscreenControlOptions));
  		}
  	});

  	leaflet.control.fullscreen = function (options) {
  		return new leaflet.Control.FullScreen(options);
  	};

  	// must return an object containing also screenfull to make screenfull
  	// available outside of this package, if used as an amd module,
  	// as webpack cannot handle amd define with moduleid
  	return {leaflet: leaflet, screenfull: screenfull};
  }));

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
  			fullscreenControl: false,
  			imageDateControl: true
  		},
  		marker: {
  			draggable: true,
  			icon: L.icon({
  				className: "pegman-marker",
  				iconSize: [52, 52],
  				iconAnchor: [24, 33],
  				iconUrl: 'data:image/png;base64,' + "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAFElEQVR4XgXAAQ0AAABAMP1L30IDCPwC/o5WcS4AAAAASUVORK5CYII=",
  			}),
  		}
  	},

  	__interactURL: 'https://unpkg.com/interactjs@1.2.9/dist/interact.min.js',
  	__gmapsURL: 'https://maps.googleapis.com/maps/api/js?v=3',
  	__mutantURL: 'https://unpkg.com/leaflet.gridlayer.googlemutant@0.10.0/Leaflet.GoogleMutant.js',

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

  		this._lazyLoaderAdded = false;
  	},

  	onAdd: function(map) {
  		this._map = map;

  		this._container = L.DomUtil.create('div', 'leaflet-pegman pegman-control leaflet-bar');
  		this._pegman = L.DomUtil.create('div', 'pegman draggable drag-drop', this._container);
  		this._pegmanButton = L.DomUtil.create('div', 'pegman-button', this._container);
  		this._pegmanMarker = L.marker([0, 0], this.options.marker);
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
  		if (this._googleStreetViewLayer) this._googleStreetViewLayer.remove();
  		if (this._pegmanMarker) this._pegmanMarker.remove();

  		L.DomUtil.remove(this._panoDiv);

  		L.DomEvent.off(document, 'mousemove', this.mouseMoveTracking, this);
  		L.DomEvent.off(document, 'keyup', this.keyUpTracking, this);

  		map.off("mousemove", this._setMouseCursor, this);
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
  		this.findStreetViewData(this._pegmanMarkerCoords.lat, this._pegmanMarkerCoords.lng);
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
  		if (this._streetViewLayerEnabled) {
  			this.findStreetViewData(e.latlng.lat, e.latlng.lng);
  		}
  	},

  	onMapLayerAdd: function(e) {
  		if (this._googleStreetViewLayer)
  			this._googleStreetViewLayer.bringToFront();
  	},

  	onStreetViewPanoramaClose: function() {
  		this.clear();
  	},

  	onPanoramaPositionChanged: function() {
  		var pos = this._panorama.getPosition();
  		pos = L.latLng(pos.lat(), pos.lng());
  		if (this._map && !this._map.getBounds().pad(-0.05).contains(pos)) {
  			this._map.panTo(pos);
  		}
  		this._pegmanMarker.setLatLng(pos);
  	},

  	onPanoramaPovChanged: function() {
  		var pov = this._panorama.getPov();
  		this._pegmanMarker.getElement().style.backgroundPosition = "0 " + -Math.abs((Math.round(pov.heading / (360 / 16)) % 16) * Math.round(835 / 16)) + 'px'; // sprite_height = 835px; num_rows = 16; pegman_angle = [0, 360] deg
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
  		if (typeof google === 'undefined') {
  			this._loadScripts(true);
  			return this.once('svpc_streetview-shown', L.bind(this.findStreetViewData, this, lat, lng));
  		}

  		if (!this._pegmanMarker._map && this._map) {
  			this._pegmanMarkerCoords = L.latLng(lat, lng);
  			return this.pegmanAdd();
  		}

  		// var searchRadiusPx = 24,
  		// 	latlng = L.latLng(lat, lng),
  		// 	p = this._map.project(latlng).add([searchRadiusPx, 0]),
  		// 	searchRadius = latlng.distanceTo(this._map.unproject(p));

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

  		this._panorama.addListener('closeclick', L.bind(this.onStreetViewPanoramaClose, this));
  		this._panorama.addListener('position_changed', L.bind(this.onPanoramaPositionChanged, this));
  		this._panorama.addListener('pov_changed', L.bind(this.onPanoramaPovChanged, this));

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

  //English
  var defaultLocale = {
  	touch: "Use two fingers to move the map",
  	scroll: "Use ctrl + scroll to zoom the map",
  	scrollMac: "Use \u2318 + scroll to zoom the map"
  };

  // Prevent CORS issues for relative locations (dynamic import)
  const baseURL = ((document.currentScript && document.currentScript.src) || (({ url: (typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('leaflet-ui-src.js', document.baseURI).href)) }) && (typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('leaflet-ui-src.js', document.baseURI).href)))).split("/").slice(0,-1).join("/") + '/';

  var draggingMap = false;
  var gestureHandlingOptions = {
  	text: {},
  	duration: 1700
  };

  var GestureHandling = L.Handler.extend({

  	_isScrolling: false,
  	_isTouching: false,
  	_isFading: false,

  	addHooks: function() {
  		this._handleTouch = L.bind(this._handleTouch, this);

  		this._setGestureHandlingOptions();
  		this._disableInteractions();

  		//Uses native event listeners instead of L.DomEvent due to issues with Android touch events turning into pointer events
  		this._map._container.addEventListener("touchstart", this._handleTouch);
  		this._map._container.addEventListener("touchmove", this._handleTouch);
  		this._map._container.addEventListener("touchend", this._handleTouch);
  		this._map._container.addEventListener("touchcancel", this._handleTouch);
  		this._map._container.addEventListener("click", this._handleTouch);

  		L.DomEvent.on(this._map._container, "wheel", this._handleScroll, this);
  		L.DomEvent.on(this._map._container, "mouseenter", this._handleMouseOver, this);
  		L.DomEvent.on(this._map._container, "mouseleave", this._handleMouseOut, this);

  		// Listen to these events so will not disable dragging if the user moves the mouse out the boundary of the map container whilst actively dragging the map.
  		L.DomEvent.on(this._map, "movestart", this._handleDragging, this);
  		L.DomEvent.on(this._map, "move", this._handleDragging, this);
  		L.DomEvent.on(this._map, "moveend", this._handleDragging, this);

  		// Prevent page scroll on "leaflet-popup-content"
  		this._map.on("popupopen", this._handleScrollOnPopup, this);
  		this._map.on("popupclose", this._handleScrollOnPopup, this);

  		// Reset any previously added fullscreen events
  		L.DomEvent.off(this._map, "enterFullscreen", this._onEnterFullscreen, this);
  		L.DomEvent.off(this._map, "exitFullscreen", this._onExitFullscreen, this);
  		L.DomEvent.on(this._map, "enterFullscreen", this._onEnterFullscreen, this);
  		L.DomEvent.on(this._map, "exitFullscreen", this._onExitFullscreen, this);

  		L.DomUtil.addClass(this._map._container, "leaflet-gesture-handling");
  	},

  	removeHooks: function() {
  		this._enableInteractions();

  		this._map._container.removeEventListener("touchstart", this._handleTouch);
  		this._map._container.removeEventListener("touchmove", this._handleTouch);
  		this._map._container.removeEventListener("touchend", this._handleTouch);
  		this._map._container.removeEventListener("touchcancel", this._handleTouch);
  		this._map._container.removeEventListener("click", this._handleTouch);

  		L.DomEvent.off(this._map._container, "wheel", this._handleScroll, this);
  		L.DomEvent.off(this._map._container, "mouseenter", this._handleMouseOver, this);
  		L.DomEvent.off(this._map._container, "mouseleave", this._handleMouseOut, this);

  		L.DomEvent.off(this._map, "movestart", this._handleDragging, this);
  		L.DomEvent.off(this._map, "move", this._handleDragging, this);
  		L.DomEvent.off(this._map, "moveend", this._handleDragging, this);

  		this._map.off("popupopen", this._handleScrollOnPopup, this);
  		this._map.off("popupclose", this._handleScrollOnPopup, this);

  		L.DomUtil.removeClass(this._map._container, "leaflet-gesture-handling");
  	},

  	_handleDragging: function(e) {
  		if (e.type == "movestart" || e.type == "move") {
  			draggingMap = true;
  		} else if (e.type == "moveend") {
  			draggingMap = false;
  		}
  	},

  	_disableInteraction: function(name) {
  		// disable the handler only if related option is true
  		if (this._map.options[name] && this._map[name]) {
  			this._map[name].disable();
  		}
  	},

  	_enableInteraction: function(name) {
  		// enable the handler only if related option is true
  		if (this._map.options[name] && this._map[name]) {
  			this._map[name].enable();
  		}
  	},

  	_disableInteractions: function() {
  		this._disableInteraction('dragging');
  		this._disableInteraction('scrollWheelZoom');
  		this._disableInteraction('tap');
  	},

  	_enableInteractions: function() {
  		this._enableInteraction('dragging');
  		this._enableInteraction('scrollWheelZoom');
  		this._enableInteraction('tap');
  	},

  	_enableWarning: function(gesture) {
  		clearTimeout(this._isFading);
  		L.DomUtil.addClass(this._map._container, "leaflet-gesture-handling-" + gesture);
  		L.DomUtil.addClass(this._map._container, "leaflet-gesture-handling-warning");
  	},

  	_disableWarning: function(gesture, delay) {
  		clearTimeout(this._isFading);
  		this._isFading = setTimeout(
  			L.bind(function(gesture) {
  				L.DomUtil.removeClass(this._map._container, "leaflet-gesture-handling-" + gesture);
  			}, this, gesture),
  			delay || this._map.options.gestureHandlingOptions.duration
  		);
  		L.DomUtil.removeClass(this._map._container, "leaflet-gesture-handling-warning");
  	},

  	_isLanguageContent: function(text) {
  		return text && text.touch && text.scroll && text.scrollMac;
  	},

  	_isMacUser: function() {
  		return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  	},

  	_parseGestureHandlingOptions: function() {
  		var text = this._map.options.gestureHandlingOptions.text || this._map.options.gestureHandlingText || gestureHandlingOptions.text;
  		var duration = this._map.options.gestureHandlingOptions.duration || this._map.options.gestureHandlingDuration || gestureHandlingOptions.duration;
  		var options = L.extend(this._map.options.gestureHandlingOptions, gestureHandlingOptions);
  		// Merge default gestureHandlingOptions into the new options object
  		options.text = text;
  		options.duration = duration;
  		return options;
  	},

  	_setGestureHandlingOptions: function() {
  		var opts = this._parseGestureHandlingOptions();

  		//If user has supplied custom language, use that, otherwise auto set it from the language files
  		(this._isLanguageContent(opts.text) ? Promise.resolve(opts.text) : this._getLanguageContent(opts.locale)).then((content) => {
  			this._map._container.setAttribute("data-gesture-handling-touch-content", content.touch);
  			this._map._container.setAttribute("data-gesture-handling-scroll-content", content.scroll);
  			this._touchWarning = content.touch;
  			this._scrollWarning = content.scroll;
  		});

  	},

  	_getUserLanguage: function() {
  		return navigator.languages ? navigator.languages[0] : navigator.language || navigator.userLanguage;
  	},

  	_getLanguageContent: function(lang) {
  		//Determine user language (eg. fr or en-US)
  		lang = lang || this._getUserLanguage() || "en";
  		var resolve, promise = new Promise(_resolve => { resolve = _resolve; });
  		var consume = (m) => {
  			var content = m.default || {};
  			//Check if they're on a mac for displaying appropriate command control (⌘ instead of Ctrl)
  			content.scroll = this._isMacUser() ? content.scrollMac : content.scroll;
  			resolve(content);
  		};

  		//Lookup the appropriate language content
  		import(baseURL + './locales/' + lang + '.js').then(consume)
  		//If no result, try searching by the first part only (eg. en-US, just use en).
  		.catch((e) => import(baseURL + './locales/' + lang.split("-")[0] + '.js').then(consume)
  			// If still nothing, default to English.
  			.catch((e) => Promise.resolve({default:defaultLocale}).then(consume))
  		);

  		return promise;
  	},

  	_handleTouch: function(e) {
  		//Disregard touch events on the controls and popups if present
  		var ignore = L.DomUtil.hasClass(e.target, "leaflet-interactive") || e.target.closest('.leaflet-control-container') || e.target.closest('.leaflet-popup-pane');

  		if (ignore) {
  			if (L.DomUtil.hasClass(e.target, "leaflet-interactive") && e.type === "touchmove" && e.touches.length === 1) {
  				this._enableTouchWarning();
  			} else {
  				this._disableTouchWarning();
  			}
  		} else if (e.type !== "touchmove" && e.type !== "touchstart") {
  			this._disableTouchWarning();
  		} else if (e.touches.length === 1) {
  			this._enableTouchWarning();
  		} else {
  			e.preventDefault();
  			this._disableTouchWarning();
  			this._enableInteractions();
  		}
  	},

  	_enableTouchWarning: function() {
  		this._enableWarning('touch');
  		this._disableInteractions();
  	},

  	_disableTouchWarning: function(delay) {
  		clearTimeout(this._isTouching);
  		// Set a timeout to run after touching ends
  		this._isTouching = setTimeout(
  			L.bind(
  				function() {
  					this._disableWarning('touch');
  					// this._enableInteractions();
  				}, this),
  			delay || 0
  		);
  	},

  	_enableScrollWarning: function() {
  		this._enableWarning('scroll');
  		this._disableInteraction('scrollWheelZoom');
  	},

  	_disableScrollWarning: function(delay) {
  		clearTimeout(this._isScrolling);
  		// Set a timeout to run after scrolling ends
  		this._isScrolling = setTimeout(
  			L.bind(
  				function() {
  					this._disableWarning('scroll');
  					this._enableInteraction('scrollWheelZoom');
  				}, this),
  			delay || 0
  		);
  	},

  	_handleScroll: function(e) {
  		if (this._map.scrollWheelZoom && this._map.scrollWheelZoom.enabled()) {
  			if (e.metaKey || e.ctrlKey || (e.shiftKey && this._map._rotate)) {
  				e.preventDefault();
  				this._disableScrollWarning();
  			} else {
  				this._enableScrollWarning();
  				this._disableScrollWarning(this._map.options.gestureHandlingOptions.duration);
  			}
  		}
  	},

  	_handleScrollOnPopup: function(e) {
  		L.DomEvent[e.type == 'popupopen' ? 'on' : 'off']
  		(e.popup._contentNode, "wheel", this._handleScroll, this);
  	},

  	_handleMouseOver: function(e) {
  		this._enableInteractions();
  	},

  	_handleMouseOut: function(e) {
  		if (!draggingMap) this._disableInteractions();
  	},

  	_onExitFullscreen: function() {
  		if (this._map.options.gestureHandling)
  			this._map.gestureHandling.enable();
  	},

  	_onEnterFullscreen: function() {
  		if (this._map.options.gestureHandling)
  			this._map.gestureHandling.disable();
  	},

  });

  L.Map.mergeOptions({
  	gestureHandlingOptions: gestureHandlingOptions
  });

  L.Map.addInitHook("addHandler", "gestureHandling", GestureHandling);

  L.Control.EditInOSM = L.Control.extend({
  	options: {
  		position: "bottomright",
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

  L.control.editInOSM = function(options) {
  	return new L.Control.EditInOSM(options);
  };

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

  (function(factory,window){if(typeof define==="function"&&define.amd){define(["leaflet"],factory);}else if(typeof exports==="object"){module.exports=factory(require("leaflet"));}if(typeof window!=="undefined"&&window.L){window.L.Control.MiniMap=factory(L);window.L.control.minimap=function(layer,options){return new window.L.Control.MiniMap(layer,options)};}})(function(L){var MiniMap=L.Control.extend({includes:L.Evented?L.Evented.prototype:L.Mixin.Events,options:{position:"bottomright",toggleDisplay:false,zoomLevelOffset:-5,zoomLevelFixed:false,centerFixed:false,zoomAnimation:false,autoToggleDisplay:false,minimized:false,width:150,height:150,collapsedWidth:19,collapsedHeight:19,aimingRectOptions:{color:"#ff7800",weight:1,clickable:false},shadowRectOptions:{color:"#000000",weight:1,clickable:false,opacity:0,fillOpacity:0},strings:{hideText:"Hide MiniMap",showText:"Show MiniMap"},mapOptions:{}},initialize:function(layer,options){L.Util.setOptions(this,options);this.options.aimingRectOptions.clickable=false;this.options.shadowRectOptions.clickable=false;this._layer=layer;},onAdd:function(map){this._mainMap=map;this._container=L.DomUtil.create("div","leaflet-control-minimap");this._container.style.width=this.options.width+"px";this._container.style.height=this.options.height+"px";L.DomEvent.disableClickPropagation(this._container);L.DomEvent.on(this._container,"mousewheel",L.DomEvent.stopPropagation);var mapOptions={attributionControl:false,dragging:!this.options.centerFixed,zoomControl:false,zoomAnimation:this.options.zoomAnimation,autoToggleDisplay:this.options.autoToggleDisplay,touchZoom:this.options.centerFixed?"center":!this._isZoomLevelFixed(),scrollWheelZoom:this.options.centerFixed?"center":!this._isZoomLevelFixed(),doubleClickZoom:this.options.centerFixed?"center":!this._isZoomLevelFixed(),boxZoom:!this._isZoomLevelFixed(),crs:map.options.crs};mapOptions=L.Util.extend(this.options.mapOptions,mapOptions);this._miniMap=new L.Map(this._container,mapOptions);this._miniMap.addLayer(this._layer);this._mainMapMoving=false;this._miniMapMoving=false;this._userToggledDisplay=false;this._minimized=false;if(this.options.toggleDisplay){this._addToggleButton();}this._miniMap.whenReady(L.Util.bind(function(){this._aimingRect=L.rectangle(this._mainMap.getBounds(),this.options.aimingRectOptions).addTo(this._miniMap);this._shadowRect=L.rectangle(this._mainMap.getBounds(),this.options.shadowRectOptions).addTo(this._miniMap);this._mainMap.on("moveend",this._onMainMapMoved,this);this._mainMap.on("move",this._onMainMapMoving,this);this._miniMap.on("movestart",this._onMiniMapMoveStarted,this);this._miniMap.on("move",this._onMiniMapMoving,this);this._miniMap.on("moveend",this._onMiniMapMoved,this);},this));return this._container},addTo:function(map){L.Control.prototype.addTo.call(this,map);var center=this.options.centerFixed||this._mainMap.getCenter();this._miniMap.setView(center,this._decideZoom(true));this._setDisplay(this.options.minimized);return this},onRemove:function(map){this._mainMap.off("moveend",this._onMainMapMoved,this);this._mainMap.off("move",this._onMainMapMoving,this);this._miniMap.off("moveend",this._onMiniMapMoved,this);this._miniMap.removeLayer(this._layer);},changeLayer:function(layer){this._miniMap.removeLayer(this._layer);this._layer=layer;this._miniMap.addLayer(this._layer);},_addToggleButton:function(){this._toggleDisplayButton=this.options.toggleDisplay?this._createButton("",this._toggleButtonInitialTitleText(),"leaflet-control-minimap-toggle-display leaflet-control-minimap-toggle-display-"+this.options.position,this._container,this._toggleDisplayButtonClicked,this):undefined;this._toggleDisplayButton.style.width=this.options.collapsedWidth+"px";this._toggleDisplayButton.style.height=this.options.collapsedHeight+"px";},_toggleButtonInitialTitleText:function(){if(this.options.minimized){return this.options.strings.showText}else {return this.options.strings.hideText}},_createButton:function(html,title,className,container,fn,context){var link=L.DomUtil.create("a",className,container);link.innerHTML=html;link.href="#";link.title=title;var stop=L.DomEvent.stopPropagation;L.DomEvent.on(link,"click",stop).on(link,"mousedown",stop).on(link,"dblclick",stop).on(link,"click",L.DomEvent.preventDefault).on(link,"click",fn,context);return link},_toggleDisplayButtonClicked:function(){this._userToggledDisplay=true;if(!this._minimized){this._minimize();}else {this._restore();}},_setDisplay:function(minimize){if(minimize!==this._minimized){if(!this._minimized){this._minimize();}else {this._restore();}}},_minimize:function(){if(this.options.toggleDisplay){this._container.style.width=this.options.collapsedWidth+"px";this._container.style.height=this.options.collapsedHeight+"px";this._toggleDisplayButton.className+=" minimized-"+this.options.position;this._toggleDisplayButton.title=this.options.strings.showText;}else {this._container.style.display="none";}this._minimized=true;this._onToggle();},_restore:function(){if(this.options.toggleDisplay){this._container.style.width=this.options.width+"px";this._container.style.height=this.options.height+"px";this._toggleDisplayButton.className=this._toggleDisplayButton.className.replace("minimized-"+this.options.position,"");this._toggleDisplayButton.title=this.options.strings.hideText;}else {this._container.style.display="block";}this._minimized=false;this._onToggle();},_onMainMapMoved:function(e){if(!this._miniMapMoving){var center=this.options.centerFixed||this._mainMap.getCenter();this._mainMapMoving=true;this._miniMap.setView(center,this._decideZoom(true));this._setDisplay(this._decideMinimized());}else {this._miniMapMoving=false;}this._aimingRect.setBounds(this._mainMap.getBounds());},_onMainMapMoving:function(e){this._aimingRect.setBounds(this._mainMap.getBounds());},_onMiniMapMoveStarted:function(e){if(!this.options.centerFixed){var lastAimingRect=this._aimingRect.getBounds();var sw=this._miniMap.latLngToContainerPoint(lastAimingRect.getSouthWest());var ne=this._miniMap.latLngToContainerPoint(lastAimingRect.getNorthEast());this._lastAimingRectPosition={sw:sw,ne:ne};}},_onMiniMapMoving:function(e){if(!this.options.centerFixed){if(!this._mainMapMoving&&this._lastAimingRectPosition){this._shadowRect.setBounds(new L.LatLngBounds(this._miniMap.containerPointToLatLng(this._lastAimingRectPosition.sw),this._miniMap.containerPointToLatLng(this._lastAimingRectPosition.ne)));this._shadowRect.setStyle({opacity:1,fillOpacity:.3});}}},_onMiniMapMoved:function(e){if(!this._mainMapMoving){this._miniMapMoving=true;this._mainMap.setView(this._miniMap.getCenter(),this._decideZoom(false));this._shadowRect.setStyle({opacity:0,fillOpacity:0});}else {this._mainMapMoving=false;}},_isZoomLevelFixed:function(){var zoomLevelFixed=this.options.zoomLevelFixed;return this._isDefined(zoomLevelFixed)&&this._isInteger(zoomLevelFixed)},_decideZoom:function(fromMaintoMini){if(!this._isZoomLevelFixed()){if(fromMaintoMini){return this._mainMap.getZoom()+this.options.zoomLevelOffset}else {var currentDiff=this._miniMap.getZoom()-this._mainMap.getZoom();var proposedZoom=this._miniMap.getZoom()-this.options.zoomLevelOffset;var toRet;if(currentDiff>this.options.zoomLevelOffset&&this._mainMap.getZoom()<this._miniMap.getMinZoom()-this.options.zoomLevelOffset){if(this._miniMap.getZoom()>this._lastMiniMapZoom){toRet=this._mainMap.getZoom()+1;this._miniMap.setZoom(this._miniMap.getZoom()-1);}else {toRet=this._mainMap.getZoom();}}else {toRet=proposedZoom;}this._lastMiniMapZoom=this._miniMap.getZoom();return toRet}}else {if(fromMaintoMini){return this.options.zoomLevelFixed}else {return this._mainMap.getZoom()}}},_decideMinimized:function(){if(this._userToggledDisplay){return this._minimized}if(this.options.autoToggleDisplay){if(this._mainMap.getBounds().contains(this._miniMap.getBounds())){return true}return false}return this._minimized},_isInteger:function(value){return typeof value==="number"},_isDefined:function(value){return typeof value!=="undefined"},_onToggle:function(){L.Util.requestAnimFrame(function(){L.DomEvent.on(this._container,"transitionend",this._fireToggleEvents,this);if(!L.Browser.any3d){L.Util.requestAnimFrame(this._fireToggleEvents,this);}},this);},_fireToggleEvents:function(){L.DomEvent.off(this._container,"transitionend",this._fireToggleEvents,this);var data={minimized:this._minimized};this.fire(this._minimized?"minimize":"restore",data);this.fire("toggle",data);}});L.Map.mergeOptions({miniMapControl:false});L.Map.addInitHook(function(){if(this.options.miniMapControl){this.miniMapControl=(new MiniMap).addTo(this);}});return MiniMap},window);

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
   * Leaflet Control Search v3.0.0 - 2021-08-18 
   * 
   * Copyright 2021 Stefano Cudini 
   * stefano.cudini@gmail.com 
   * https://opengeo.tech/ 
   * 
   * Licensed under the MIT license. 
   * 
   * Demo: 
   * https://opengeo.tech/maps/leaflet-search/ 
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
          }
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
  			
  		for (var i=0; i<searchTips.length; i++)
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

  !function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e():"function"==typeof define&&define.amd?define(e):e();}(0,function(){function t(t,e){return e={exports:{}},t(e,e.exports),e.exports}var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{},n=t(function(t){!function(e){function n(t,e){function n(t){return e.bgcolor&&(t.style.backgroundColor=e.bgcolor),e.width&&(t.style.width=e.width+"px"),e.height&&(t.style.height=e.height+"px"),e.style&&Object.keys(e.style).forEach(function(n){t.style[n]=e.style[n];}),t}return e=e||{},s(e),Promise.resolve(t).then(function(t){return u(t,e.filter,!0)}).then(c).then(d).then(n).then(function(n){return g(n,e.width||h.width(t),e.height||h.height(t))})}function i(t,e){return l(t,e||{}).then(function(e){return e.getContext("2d").getImageData(0,0,h.width(t),h.height(t)).data})}function o(t,e){return l(t,e||{}).then(function(t){return t.toDataURL()})}function r(t,e){return e=e||{},l(t,e).then(function(t){return t.toDataURL("image/jpeg",e.quality||1)})}function a(t,e){return l(t,e||{}).then(h.canvasToBlob)}function s(t){void 0===t.imagePlaceholder?w.impl.options.imagePlaceholder=M.imagePlaceholder:w.impl.options.imagePlaceholder=t.imagePlaceholder,void 0===t.cacheBust?w.impl.options.cacheBust=M.cacheBust:w.impl.options.cacheBust=t.cacheBust;}function l(t,e){function i(t){var n=document.createElement("canvas");if(n.width=e.width||h.width(t),n.height=e.height||h.height(t),e.bgcolor){var i=n.getContext("2d");i.fillStyle=e.bgcolor,i.fillRect(0,0,n.width,n.height);}return n}return n(t,e).then(h.makeImage).then(h.delay(100)).then(function(e){var n=i(t);return n.getContext("2d").drawImage(e,0,0),n})}function u(t,e,n){function i(t){return t instanceof HTMLCanvasElement?h.makeImage(t.toDataURL()):t.cloneNode(!1)}function o(t,e,n){var i=t.childNodes;return 0===i.length?Promise.resolve(e):function(t,e,n){var i=Promise.resolve();return e.forEach(function(e){i=i.then(function(){return u(e,n)}).then(function(e){e&&t.appendChild(e);});}),i}(e,h.asArray(i),n).then(function(){return e})}function r(t,e){function n(){!function(t,e){t.cssText?e.cssText=t.cssText:function(t,e){h.asArray(t).forEach(function(n){e.setProperty(n,t.getPropertyValue(n),t.getPropertyPriority(n));});}(t,e);}(window.getComputedStyle(t),e.style);}function i(){function n(n){var i=window.getComputedStyle(t,n),o=i.getPropertyValue("content");if(""!==o&&"none"!==o){var r=h.uid();e.className=e.className+" "+r;var a=document.createElement("style");a.appendChild(function(t,e,n){var i="."+t+":"+e,o=n.cssText?function(t){var e=t.getPropertyValue("content");return t.cssText+" content: "+e+";"}(n):function(t){function e(e){return e+": "+t.getPropertyValue(e)+(t.getPropertyPriority(e)?" !important":"")}return h.asArray(t).map(e).join("; ")+";"}(n);return document.createTextNode(i+"{"+o+"}")}(r,n,i)),e.appendChild(a);}}[":before",":after"].forEach(function(t){n(t);});}function o(){t instanceof HTMLTextAreaElement&&(e.innerHTML=t.value),t instanceof HTMLInputElement&&e.setAttribute("value",t.value);}function r(){e instanceof SVGElement&&(e.setAttribute("xmlns","http://www.w3.org/2000/svg"),e instanceof SVGRectElement&&["width","height"].forEach(function(t){var n=e.getAttribute(t);n&&e.style.setProperty(t,n);}));}return e instanceof Element?Promise.resolve().then(n).then(i).then(o).then(r).then(function(){return e}):e}return n||!e||e(t)?Promise.resolve(t).then(i).then(function(n){return o(t,n,e)}).then(function(e){return r(t,e)}):Promise.resolve()}function c(t){return p.resolveAll().then(function(e){var n=document.createElement("style");return t.appendChild(n),n.appendChild(document.createTextNode(e)),t})}function d(t){return f.inlineAll(t).then(function(){return t})}function g(t,e,n){return Promise.resolve(t).then(function(t){return t.setAttribute("xmlns","http://www.w3.org/1999/xhtml"),(new XMLSerializer).serializeToString(t)}).then(h.escapeXhtml).then(function(t){return '<foreignObject x="0" y="0" width="100%" height="100%">'+t+"</foreignObject>"}).then(function(t){return '<svg xmlns="http://www.w3.org/2000/svg" width="'+e+'" height="'+n+'">'+t+"</svg>"}).then(function(t){return "data:image/svg+xml;charset=utf-8,"+t})}var h=function(){function t(){var t="application/font-woff",e="image/jpeg";return {woff:t,woff2:t,ttf:"application/font-truetype",eot:"application/vnd.ms-fontobject",png:"image/png",jpg:e,jpeg:e,gif:"image/gif",tiff:"image/tiff",svg:"image/svg+xml"}}function e(t){var e=/\.([^\.\/]*?)$/g.exec(t);return e?e[1]:""}function n(n){var i=e(n).toLowerCase();return t()[i]||""}function i(t){return -1!==t.search(/^(data:)/)}function o(t){return new Promise(function(e){for(var n=window.atob(t.toDataURL().split(",")[1]),i=n.length,o=new Uint8Array(i),r=0;r<i;r++)o[r]=n.charCodeAt(r);e(new Blob([o],{type:"image/png"}));})}function r(t){return t.toBlob?new Promise(function(e){t.toBlob(e);}):o(t)}function a(t,e){var n=document.implementation.createHTMLDocument(),i=n.createElement("base");n.head.appendChild(i);var o=n.createElement("a");return n.body.appendChild(o),i.href=e,o.href=t,o.href}function s(t){return new Promise(function(e,n){var i=new Image;i.onload=function(){e(i);},i.onerror=n,i.src=t;})}function l(t){var e=3e4;return w.impl.options.cacheBust&&(t+=(/\?/.test(t)?"&":"?")+(new Date).getTime()),new Promise(function(n){function i(){if(4===a.readyState){if(200!==a.status)return void(s?n(s):r("cannot fetch resource: "+t+", status: "+a.status));var e=new FileReader;e.onloadend=function(){var t=e.result.split(/,/)[1];n(t);},e.readAsDataURL(a.response);}}function o(){s?n(s):r("timeout of "+e+"ms occured while fetching resource: "+t);}function r(t){console.error(t),n("");}var a=new XMLHttpRequest;a.onreadystatechange=i,a.ontimeout=o,a.responseType="blob",a.timeout=e,a.open("GET",t,!0),a.send();var s;if(w.impl.options.imagePlaceholder){var l=w.impl.options.imagePlaceholder.split(/,/);l&&l[1]&&(s=l[1]);}})}function u(t,e){return "data:"+e+";base64,"+t}function c(t){return t.replace(/([.*+?^${}()|\[\]\/\\])/g,"\\$1")}function d(t){return function(e){return new Promise(function(n){setTimeout(function(){n(e);},t);})}}function g(t){for(var e=[],n=t.length,i=0;i<n;i++)e.push(t[i]);return e}function h(t){return t.replace(/#/g,"%23").replace(/\n/g,"%0A")}function m(t){var e=f(t,"border-left-width"),n=f(t,"border-right-width");return t.scrollWidth+e+n}function p(t){var e=f(t,"border-top-width"),n=f(t,"border-bottom-width");return t.scrollHeight+e+n}function f(t,e){var n=window.getComputedStyle(t).getPropertyValue(e);return parseFloat(n.replace("px",""))}return {escape:c,parseExtension:e,mimeType:n,dataAsUrl:u,isDataUrl:i,canvasToBlob:r,resolveUrl:a,getAndEncode:l,uid:function(){var t=0;return function(){return "u"+function(){return ("0000"+(Math.random()*Math.pow(36,4)<<0).toString(36)).slice(-4)}()+t++}}(),delay:d,asArray:g,escapeXhtml:h,makeImage:s,width:m,height:p}}(),m=function(){function t(t){return -1!==t.search(o)}function e(t){for(var e,n=[];null!==(e=o.exec(t));)n.push(e[1]);return n.filter(function(t){return !h.isDataUrl(t)})}function n(t,e,n,i){function o(t){return new RegExp("(url\\(['\"]?)("+h.escape(t)+")(['\"]?\\))","g")}return Promise.resolve(e).then(function(t){return n?h.resolveUrl(t,n):t}).then(i||h.getAndEncode).then(function(t){return h.dataAsUrl(t,h.mimeType(e))}).then(function(n){return t.replace(o(e),"$1"+n+"$3")})}function i(i,o,r){return function(){return !t(i)}()?Promise.resolve(i):Promise.resolve(i).then(e).then(function(t){var e=Promise.resolve(i);return t.forEach(function(t){e=e.then(function(e){return n(e,t,o,r)});}),e})}var o=/url\(['"]?([^'"]+?)['"]?\)/g;return {inlineAll:i,shouldProcess:t,impl:{readUrls:e,inline:n}}}(),p=function(){function t(){return e().then(function(t){return Promise.all(t.map(function(t){return t.resolve()}))}).then(function(t){return t.join("\n")})}function e(){function t(t){return t.filter(function(t){return t.type===CSSRule.FONT_FACE_RULE}).filter(function(t){return m.shouldProcess(t.style.getPropertyValue("src"))})}function e(t){var e=[];return t.forEach(function(t){try{h.asArray(t.cssRules||[]).forEach(e.push.bind(e));}catch(e){console.log("Error while reading CSS rules from "+t.href,e.toString());}}),e}function n(t){return {resolve:function(){var e=(t.parentStyleSheet||{}).href;return m.inlineAll(t.cssText,e)},src:function(){return t.style.getPropertyValue("src")}}}return Promise.resolve(h.asArray(document.styleSheets)).then(e).then(t).then(function(t){return t.map(n)})}return {resolveAll:t,impl:{readAll:e}}}(),f=function(){function t(t){function e(e){return h.isDataUrl(t.src)?Promise.resolve():Promise.resolve(t.src).then(e||h.getAndEncode).then(function(e){return h.dataAsUrl(e,h.mimeType(t.src))}).then(function(e){return new Promise(function(n,i){t.onload=n,t.onerror=i,t.src=e;})})}return {inline:e}}function e(n){return n instanceof Element?function(t){var e=t.style.getPropertyValue("background");return e?m.inlineAll(e).then(function(e){t.style.setProperty("background",e,t.style.getPropertyPriority("background"));}).then(function(){return t}):Promise.resolve(t)}(n).then(function(){return n instanceof HTMLImageElement?t(n).inline():Promise.all(h.asArray(n.childNodes).map(function(t){return e(t)}))}):Promise.resolve(n)}return {inlineAll:e,impl:{newImage:t}}}(),M={imagePlaceholder:void 0,cacheBust:!1},w={toSvg:n,toPng:o,toJpeg:r,toBlob:a,toPixelData:i,impl:{fontFaces:p,images:f,util:h,inliner:m,options:{}}};t.exports=w;}();}),i=t(function(t){var n=n||function(t){if(!(void 0===t||"undefined"!=typeof navigator&&/MSIE [1-9]\./.test(navigator.userAgent))){var e=t.document,n=function(){return t.URL||t.webkitURL||t},i=e.createElementNS("http://www.w3.org/1999/xhtml","a"),o="download"in i,r=function(t){var e=new MouseEvent("click");t.dispatchEvent(e);},a=/constructor/i.test(t.HTMLElement)||t.safari,s=/CriOS\/[\d]+/.test(navigator.userAgent),l=function(e){(t.setImmediate||t.setTimeout)(function(){throw e},0);},u=function(t){var e=function(){"string"==typeof t?n().revokeObjectURL(t):t.remove();};setTimeout(e,4e4);},c=function(t,e,n){e=[].concat(e);for(var i=e.length;i--;){var o=t["on"+e[i]];if("function"==typeof o)try{o.call(t,n||t);}catch(t){l(t);}}},d=function(t){return /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(t.type)?new Blob([String.fromCharCode(65279),t],{type:t.type}):t},g=function(e,l,g){g||(e=d(e));var h,m=this,p=e.type,f="application/octet-stream"===p,M=function(){c(m,"writestart progress write writeend".split(" "));};if(m.readyState=m.INIT,o)return h=n().createObjectURL(e),void setTimeout(function(){i.href=h,i.download=l,r(i),M(),u(h),m.readyState=m.DONE;});!function(){if((s||f&&a)&&t.FileReader){var i=new FileReader;return i.onloadend=function(){var e=s?i.result:i.result.replace(/^data:[^;]*;/,"data:attachment/file;");t.open(e,"_blank")||(t.location.href=e),e=void 0,m.readyState=m.DONE,M();},i.readAsDataURL(e),void(m.readyState=m.INIT)}if(h||(h=n().createObjectURL(e)),f)t.location.href=h;else {t.open(h,"_blank")||(t.location.href=h);}m.readyState=m.DONE,M(),u(h);}();},h=g.prototype,m=function(t,e,n){return new g(t,e||t.name||"download",n)};return "undefined"!=typeof navigator&&navigator.msSaveOrOpenBlob?function(t,e,n){return e=e||t.name||"download",n||(t=d(t)),navigator.msSaveOrOpenBlob(t,e)}:(h.abort=function(){},h.readyState=h.INIT=0,h.WRITING=1,h.DONE=2,h.error=h.onwritestart=h.onprogress=h.onwrite=h.onabort=h.onerror=h.onwriteend=null,m)}}("undefined"!=typeof self&&self||"undefined"!=typeof window&&window||e.content);t.exports&&(t.exports.saveAs=n);});L.Control.EasyPrint=L.Control.extend({options:{title:"Print map",position:"topleft",sizeModes:["Current"],filename:"map",exportOnly:!1,hidden:!1,tileWait:500,hideControlContainer:!0,hideClasses:[],customWindowTitle:window.document.title,spinnerBgCOlor:"#0DC5C1",customSpinnerClass:"epLoader",defaultSizeTitles:{Current:"Current Size",A4Landscape:"A4 Landscape",A4Portrait:"A4 Portrait"}},onAdd:function(){this.mapContainer=this._map.getContainer(),this.options.sizeModes=this.options.sizeModes.map(function(t){return "Current"===t?{name:this.options.defaultSizeTitles.Current,className:"CurrentSize"}:"A4Landscape"===t?{height:this._a4PageSize.height,width:this._a4PageSize.width,name:this.options.defaultSizeTitles.A4Landscape,className:"A4Landscape page"}:"A4Portrait"===t?{height:this._a4PageSize.width,width:this._a4PageSize.height,name:this.options.defaultSizeTitles.A4Portrait,className:"A4Portrait page"}:t},this);var t=L.DomUtil.create("div","leaflet-control-easyPrint leaflet-bar leaflet-control");if(!this.options.hidden){this._addCss(),L.DomEvent.addListener(t,"mouseover",this._togglePageSizeButtons,this),L.DomEvent.addListener(t,"mouseout",this._togglePageSizeButtons,this);var e="leaflet-control-easyPrint-button";this.options.exportOnly&&(e+="-export"),this.link=L.DomUtil.create("a",e,t),this.link.id="leafletEasyPrint",this.link.title=this.options.title,this.holder=L.DomUtil.create("ul","easyPrintHolder",t),this.options.sizeModes.forEach(function(t){var e=L.DomUtil.create("li","easyPrintSizeMode",this.holder);e.title=t.name;L.DomUtil.create("a",t.className,e);L.DomEvent.addListener(e,"click",this.printMap,this);},this),L.DomEvent.disableClickPropagation(t);}return t},printMap:function(t,e){e&&(this.options.filename=e),this.options.exportOnly||(this._page=window.open("","_blank","toolbar=no,status=no,menubar=no,scrollbars=no,resizable=no,left=10, top=10, width=200, height=250, visible=none"),this._page.document.write(this._createSpinner(this.options.customWindowTitle,this.options.customSpinnerClass,this.options.spinnerBgCOlor))),this.originalState={mapWidth:this.mapContainer.style.width,widthWasAuto:!1,widthWasPercentage:!1,mapHeight:this.mapContainer.style.height,zoom:this._map.getZoom(),center:this._map.getCenter()},"auto"===this.originalState.mapWidth?(this.originalState.mapWidth=this._map.getSize().x+"px",this.originalState.widthWasAuto=!0):this.originalState.mapWidth.includes("%")&&(this.originalState.percentageWidth=this.originalState.mapWidth,this.originalState.widthWasPercentage=!0,this.originalState.mapWidth=this._map.getSize().x+"px"),this._map.fire("easyPrint-start",{event:t}),this.options.hidden||this._togglePageSizeButtons({type:null}),this.options.hideControlContainer&&this._toggleControls(),this.options.hideClasses.length>0&&this._toggleClasses(this.options.hideClasses);var n="string"!=typeof t?t.target.className:t;if("CurrentSize"===n)return this._printOpertion(n);this.outerContainer=this._createOuterContainer(this.mapContainer),this.originalState.widthWasAuto&&(this.outerContainer.style.width=this.originalState.mapWidth),this._createImagePlaceholder(n);},_createImagePlaceholder:function(t){var e=this;n.toPng(this.mapContainer,{width:parseInt(this.originalState.mapWidth.replace("px")),height:parseInt(this.originalState.mapHeight.replace("px"))}).then(function(n){e.blankDiv=document.createElement("div");var i=e.blankDiv;e.outerContainer.parentElement.insertBefore(i,e.outerContainer),i.className="epHolder",i.style.backgroundImage='url("'+n+'")',i.style.position="absolute",i.style.zIndex=1011,i.style.display="initial",i.style.width=e.originalState.mapWidth,i.style.height=e.originalState.mapHeight,e._resizeAndPrintMap(t);}).catch(function(t){console.error("oops, something went wrong!",t);});},_resizeAndPrintMap:function(t){this.outerContainer.style.opacity=0;var e=this.options.sizeModes.filter(function(e){return e.className===t});e=e[0],this.mapContainer.style.width=e.width+"px",this.mapContainer.style.height=e.height+"px",this.mapContainer.style.width>this.mapContainer.style.height?this.orientation="portrait":this.orientation="landscape",this._map.setView(this.originalState.center),this._map.setZoom(this.originalState.zoom),this._map.invalidateSize(),this.options.tileLayer?this._pausePrint(t):this._printOpertion(t);},_pausePrint:function(t){var e=this,n=setInterval(function(){e.options.tileLayer.isLoading()||(clearInterval(n),e._printOpertion(t));},e.options.tileWait);},_printOpertion:function(t){var e=this,o=this.mapContainer.style.width;(this.originalState.widthWasAuto&&"CurrentSize"===t||this.originalState.widthWasPercentage&&"CurrentSize"===t)&&(o=this.originalState.mapWidth),n.toPng(e.mapContainer,{width:parseInt(o),height:parseInt(e.mapContainer.style.height.replace("px"))}).then(function(t){var n=e._dataURItoBlob(t);e.options.exportOnly?i.saveAs(n,e.options.filename+".png"):e._sendToBrowserPrint(t,e.orientation),e._toggleControls(!0),e._toggleClasses(e.options.hideClasses,!0),e.outerContainer&&(e.originalState.widthWasAuto?e.mapContainer.style.width="auto":e.originalState.widthWasPercentage?e.mapContainer.style.width=e.originalState.percentageWidth:e.mapContainer.style.width=e.originalState.mapWidth,e.mapContainer.style.height=e.originalState.mapHeight,e._removeOuterContainer(e.mapContainer,e.outerContainer,e.blankDiv),e._map.invalidateSize(),e._map.setView(e.originalState.center),e._map.setZoom(e.originalState.zoom)),e._map.fire("easyPrint-finished");}).catch(function(t){console.error("Print operation failed",t);});},_sendToBrowserPrint:function(t,e){this._page.resizeTo(600,800);var n=this._createNewWindow(t,e,this);this._page.document.body.innerHTML="",this._page.document.write(n),this._page.document.close();},_createSpinner:function(t,e,n){return "<html><head><title>"+t+"</title></head><body><style>\n      body{\n        background: "+n+";\n      }\n      .epLoader,\n      .epLoader:before,\n      .epLoader:after {\n        border-radius: 50%;\n      }\n      .epLoader {\n        color: #ffffff;\n        font-size: 11px;\n        text-indent: -99999em;\n        margin: 55px auto;\n        position: relative;\n        width: 10em;\n        height: 10em;\n        box-shadow: inset 0 0 0 1em;\n        -webkit-transform: translateZ(0);\n        -ms-transform: translateZ(0);\n        transform: translateZ(0);\n      }\n      .epLoader:before,\n      .epLoader:after {\n        position: absolute;\n        content: '';\n      }\n      .epLoader:before {\n        width: 5.2em;\n        height: 10.2em;\n        background: #0dc5c1;\n        border-radius: 10.2em 0 0 10.2em;\n        top: -0.1em;\n        left: -0.1em;\n        -webkit-transform-origin: 5.2em 5.1em;\n        transform-origin: 5.2em 5.1em;\n        -webkit-animation: load2 2s infinite ease 1.5s;\n        animation: load2 2s infinite ease 1.5s;\n      }\n      .epLoader:after {\n        width: 5.2em;\n        height: 10.2em;\n        background: #0dc5c1;\n        border-radius: 0 10.2em 10.2em 0;\n        top: -0.1em;\n        left: 5.1em;\n        -webkit-transform-origin: 0px 5.1em;\n        transform-origin: 0px 5.1em;\n        -webkit-animation: load2 2s infinite ease;\n        animation: load2 2s infinite ease;\n      }\n      @-webkit-keyframes load2 {\n        0% {\n          -webkit-transform: rotate(0deg);\n          transform: rotate(0deg);\n        }\n        100% {\n          -webkit-transform: rotate(360deg);\n          transform: rotate(360deg);\n        }\n      }\n      @keyframes load2 {\n        0% {\n          -webkit-transform: rotate(0deg);\n          transform: rotate(0deg);\n        }\n        100% {\n          -webkit-transform: rotate(360deg);\n          transform: rotate(360deg);\n        }\n      }\n      </style>\n    <div class=\""+e+'">Loading...</div></body></html>'},_createNewWindow:function(t,e,n){return "<html><head>\n        <style>@media print {\n          img { max-width: 98%!important; max-height: 98%!important; }\n          @page { size: "+e+";}}\n        </style>\n        <script>function step1(){\n        setTimeout('step2()', 10);}\n        function step2(){window.print();window.close()}\n        <\/script></head><body onload='step1()'>\n        <img src=\""+t+'" style="display:block; margin:auto;"></body></html>'},_createOuterContainer:function(t){var e=document.createElement("div");return t.parentNode.insertBefore(e,t),t.parentNode.removeChild(t),e.appendChild(t),e.style.width=t.style.width,e.style.height=t.style.height,e.style.display="inline-block",e.style.overflow="hidden",e},_removeOuterContainer:function(t,e,n){e.parentNode&&(e.parentNode.insertBefore(t,e),e.parentNode.removeChild(n),e.parentNode.removeChild(e));},_addCss:function(){var t=document.createElement("style");t.type="text/css",t.innerHTML=".leaflet-control-easyPrint-button { \n      background-image: url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjE2cHgiIGhlaWdodD0iMTZweCIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPGc+Cgk8cGF0aCBkPSJNMTI4LDMyaDI1NnY2NEgxMjhWMzJ6IE00ODAsMTI4SDMyYy0xNy42LDAtMzIsMTQuNC0zMiwzMnYxNjBjMCwxNy42LDE0LjM5OCwzMiwzMiwzMmg5NnYxMjhoMjU2VjM1Mmg5NiAgIGMxNy42LDAsMzItMTQuNCwzMi0zMlYxNjBDNTEyLDE0Mi40LDQ5Ny42LDEyOCw0ODAsMTI4eiBNMzUyLDQ0OEgxNjBWMjg4aDE5MlY0NDh6IE00ODcuMTk5LDE3NmMwLDEyLjgxMy0xMC4zODcsMjMuMi0yMy4xOTcsMjMuMiAgIGMtMTIuODEyLDAtMjMuMjAxLTEwLjM4Ny0yMy4yMDEtMjMuMnMxMC4zODktMjMuMiwyMy4xOTktMjMuMkM0NzYuODE0LDE1Mi44LDQ4Ny4xOTksMTYzLjE4Nyw0ODcuMTk5LDE3NnoiIGZpbGw9IiMwMDAwMDAiLz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K);\n      background-size: 16px 16px; \n      cursor: pointer; \n    }\n    .leaflet-control-easyPrint-button-export { \n      background-image: url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjE2cHgiIGhlaWdodD0iMTZweCIgdmlld0JveD0iMCAwIDQzMy41IDQzMy41IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA0MzMuNSA0MzMuNTsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8Zz4KCTxnIGlkPSJmaWxlLWRvd25sb2FkIj4KCQk8cGF0aCBkPSJNMzk1LjI1LDE1M2gtMTAyVjBoLTE1M3YxNTNoLTEwMmwxNzguNSwxNzguNUwzOTUuMjUsMTUzeiBNMzguMjUsMzgyLjV2NTFoMzU3di01MUgzOC4yNXoiIGZpbGw9IiMwMDAwMDAiLz4KCTwvZz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K);\n      background-size: 16px 16px; \n      cursor: pointer; \n    }\n    .easyPrintHolder a {\n      background-size: 16px 16px;\n      cursor: pointer;\n    }\n    .easyPrintHolder .CurrentSize{\n      background-image: url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTZweCIgdmVyc2lvbj0iMS4xIiBoZWlnaHQ9IjE2cHgiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgNjQgNjQiPgogIDxnPgogICAgPGcgZmlsbD0iIzFEMUQxQiI+CiAgICAgIDxwYXRoIGQ9Ik0yNS4yNTUsMzUuOTA1TDQuMDE2LDU3LjE0NVY0Ni41OWMwLTEuMTA4LTAuODk3LTIuMDA4LTIuMDA4LTIuMDA4QzAuODk4LDQ0LjU4MiwwLDQ1LjQ4MSwwLDQ2LjU5djE1LjQwMiAgICBjMCwwLjI2MSwwLjA1MywwLjUyMSwwLjE1NSwwLjc2N2MwLjIwMywwLjQ5MiwwLjU5NCwwLjg4MiwxLjA4NiwxLjA4N0MxLjQ4Niw2My45NDcsMS43NDcsNjQsMi4wMDgsNjRoMTUuNDAzICAgIGMxLjEwOSwwLDIuMDA4LTAuODk4LDIuMDA4LTIuMDA4cy0wLjg5OC0yLjAwOC0yLjAwOC0yLjAwOEg2Ljg1NWwyMS4yMzgtMjEuMjRjMC43ODQtMC43ODQsMC43ODQtMi4wNTUsMC0yLjgzOSAgICBTMjYuMDM5LDM1LjEyMSwyNS4yNTUsMzUuOTA1eiIgZmlsbD0iIzAwMDAwMCIvPgogICAgICA8cGF0aCBkPSJtNjMuODQ1LDEuMjQxYy0wLjIwMy0wLjQ5MS0wLjU5NC0wLjg4Mi0xLjA4Ni0xLjA4Ny0wLjI0NS0wLjEwMS0wLjUwNi0wLjE1NC0wLjc2Ny0wLjE1NGgtMTUuNDAzYy0xLjEwOSwwLTIuMDA4LDAuODk4LTIuMDA4LDIuMDA4czAuODk4LDIuMDA4IDIuMDA4LDIuMDA4aDEwLjU1NmwtMjEuMjM4LDIxLjI0Yy0wLjc4NCwwLjc4NC0wLjc4NCwyLjA1NSAwLDIuODM5IDAuMzkyLDAuMzkyIDAuOTA2LDAuNTg5IDEuNDIsMC41ODlzMS4wMjctMC4xOTcgMS40MTktMC41ODlsMjEuMjM4LTIxLjI0djEwLjU1NWMwLDEuMTA4IDAuODk3LDIuMDA4IDIuMDA4LDIuMDA4IDEuMTA5LDAgMi4wMDgtMC44OTkgMi4wMDgtMi4wMDh2LTE1LjQwMmMwLTAuMjYxLTAuMDUzLTAuNTIyLTAuMTU1LTAuNzY3eiIgZmlsbD0iIzAwMDAwMCIvPgogICAgPC9nPgogIDwvZz4KPC9zdmc+Cg==)\n    }\n    .easyPrintHolder .page {\n      background-image: url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMS4xLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDQ0NC44MzMgNDQ0LjgzMyIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDQ0LjgzMyA0NDQuODMzOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGc+Cgk8Zz4KCQk8cGF0aCBkPSJNNTUuMjUsNDQ0LjgzM2gzMzQuMzMzYzkuMzUsMCwxNy03LjY1LDE3LTE3VjEzOS4xMTdjMC00LjgxNy0xLjk4My05LjM1LTUuMzgzLTEyLjQ2N0wyNjkuNzMzLDQuNTMzICAgIEMyNjYuNjE3LDEuNywyNjIuMzY3LDAsMjU4LjExNywwSDU1LjI1Yy05LjM1LDAtMTcsNy42NS0xNywxN3Y0MTAuODMzQzM4LjI1LDQzNy4xODMsNDUuOSw0NDQuODMzLDU1LjI1LDQ0NC44MzN6ICAgICBNMzcyLjU4MywxNDYuNDgzdjAuODVIMjU2LjQxN3YtMTA4LjhMMzcyLjU4MywxNDYuNDgzeiBNNzIuMjUsMzRoMTUwLjE2N3YxMzAuMzMzYzAsOS4zNSw3LjY1LDE3LDE3LDE3aDEzMy4xNjd2MjI5LjVINzIuMjVWMzR6ICAgICIgZmlsbD0iIzAwMDAwMCIvPgoJPC9nPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=);\n    }\n    .easyPrintHolder .A4Landscape { \n      transform: rotate(-90deg);\n    }\n\n    .leaflet-control-easyPrint-button{\n      display: inline-block;\n    }\n    .easyPrintHolder{\n      margin-top:-31px;\n      margin-bottom: -5px;\n      margin-left: 30px;\n      padding-left: 0px;\n      display: none;\n    }\n\n    .easyPrintSizeMode {\n      display: inline-block;\n    }\n    .easyPrintHolder .easyPrintSizeMode a {\n      border-radius: 0px;\n    }\n\n    .easyPrintHolder .easyPrintSizeMode:last-child a{\n      border-top-right-radius: 2px;\n      border-bottom-right-radius: 2px;\n      margin-left: -1px;\n    }\n\n    .easyPrintPortrait:hover, .easyPrintLandscape:hover{\n      background-color: #757570;\n      cursor: pointer;\n    }",document.body.appendChild(t);},_dataURItoBlob:function(t){for(var e=atob(t.split(",")[1]),n=t.split(",")[0].split(":")[1].split(";")[0],i=new ArrayBuffer(e.length),o=new DataView(i),r=0;r<e.length;r++)o.setUint8(r,e.charCodeAt(r));return new Blob([i],{type:n})},_togglePageSizeButtons:function(t){var e=this.holder.style,n=this.link.style;"mouseover"===t.type?(e.display="block",n.borderTopRightRadius="0",n.borderBottomRightRadius="0"):(e.display="none",n.borderTopRightRadius="2px",n.borderBottomRightRadius="2px");},_toggleControls:function(t){var e=document.getElementsByClassName("leaflet-control-container")[0];if(t)return e.style.display="block";e.style.display="none";},_toggleClasses:function(t,e){t.forEach(function(t){var n=document.getElementsByClassName(t)[0];if(e)return n.style.display="block";n.style.display="none";});},_a4PageSize:{height:715,width:1045}}),L.easyPrint=function(t){return new L.Control.EasyPrint(t)};});

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

  /*
  * L.VisualClick
  * Description: A plugin that adds visual feedback when user clicks/taps the map. Useful for when you have a delay on the clickEvents for async fetching of data, or implmentation of Leaflet.singleclick
  * Example: L.visualClick({map: leafletMap}); //Just works
  * Author: Dag Jomar Mersland (twitter: @dagjomar)
  */


  L.Map.VisualClick = L.Handler.extend({

      _makeVisualIcon: function(){

          var touchMode = this._map.options.visualClickMode === 'touch' ? true : false;

          return L.divIcon({
              className: "leaflet-visualclick-icon" + (touchMode ? '-touch' : ''),    // See L.VisualClick.css
              iconSize: [0, 0],
              clickable: false
          });
      },

      _visualIcon: null,

      _onClick: function(e) {

          var map = this._map;

          var latlng = e.latlng;
          var marker = L.marker(latlng, {
              pane: this._map.options.visualClickPane,
              icon: this._visualIcon,
              interactive: false
          }).addTo(map);

          window.setTimeout(function(){
              if(map){
                  map.removeLayer(marker);
              }
          }.bind(this), map.options.visualClick.removeTimeout || 450);    // Should somewhat match the css animation to prevent loops

          return true;
      },

      addHooks: function () {
          if(this._visualIcon === null){
              this._visualIcon = this._makeVisualIcon();
          }

          if (this._map.options.visualClickPane === 'ie10-visual-click-pane') {
              this._map.createPane('ie10-visual-click-pane');
          }

          this._map.on(this._map.options.visualClickEvents, this._onClick, this);
      },

      removeHooks: function () {
          this._map.off(this._map.options.visualClickEvents, this._onClick, this);
      },

  });


  L.Map.mergeOptions({
      visualClick: L.Browser.any3d ? true : false, //Can be true, desktop, touch, false. Not straight forward to use L.Browser.touch flag because true on IE10
      visualClickMode: L.Browser.touch && L.Browser.mobile ? 'touch' : 'desktop', //Not straight forward to use only L.Browser.touch flag because true on IE10 - so this is slightly better
      visualClickEvents: 'click contextmenu', //Standard leaflety way of defining which events to hook on to
      visualClickPane: (L.Browser.ie && document.documentMode === 10) ?
          'ie10-visual-click-pane' :
          'shadowPane'	// Map pane where the pulse markers will be showh
  });

  L.Map.addInitHook('addHandler', 'visualClick', L.Map.VisualClick);

  /* Temporary fix for empty values evaluated as false (leaflet-i18n v0.3.1) */
  (function(){
  	let proto = L.i18n.bind({});
  	L.i18n = L._ = (string, data) => {
  		if (L.locale && L.locales[L.locale] && L.locales[L.locale][string] == "") {
  			L.locales[L.locale][string] = "\u200B";
  		}
  		return proto.call(null, string, data);
  	};
  })();

  (function() {

  	const currentScript = document.currentScript;
  	const currentVersion = version.split("+")[0].trim();

  	let lazyLoader = {

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
  				let base_url = (url.indexOf(".") === 0 || url.indexOf("/") === 0 || url.indexOf('http://') === 0 || url.indexOf('https://') === 0) ? '' : lazyLoader.baseURL;

  				if (type == 'css') {
  					script.rel = 'stylesheet';
  				}

  				script.addEventListener('load', resolve, { once: true });
  				script.setAttribute(type == 'css' ? 'href' : 'src', base_url + url);

  				if (prev_tag.parentNode && prev_tag.nextSibling)
  					prev_tag.parentNode.insertBefore(script, prev_tag.nextSibling);
  				else
  					head.appendChild(script);

  				lazyLoader["prev_" + tag] = script;

  			});
  		}

  	};

  	// You can ovveride them by passing one of the following to leaflet map constructor.
  	let default_options = {
  		mapTypes: {
  			atlas: {
  				name: 'Atlas',
  				url: 'https://{s}.tile.thunderforest.com/mobile-atlas/{z}/{x}/{y}.png',
  				options: {
  					maxZoom: 24,
  					maxNativeZoom: 22,
  					attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Map style: &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>',
  					// apikey: '<your apikey>',
  				},
  			},
  			streets: {
  				name: 'Streets',
  				url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  				options: {
  					maxZoom: 24,
  					maxNativeZoom: 19,
  					attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  				},
  			},
  			cycle: {
  				name: 'Cycle',
  				url: 'https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png',
  				options: {
  					maxZoom: 24,
  					maxNativeZoom: 22,
  					attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Map style: &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>',
  					// apikey: '<your apikey>',
  				},
  			},
  			terrain: {
  				name: 'Terrain',
  				url: 'https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png',
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
  		rotateControl: {
  			position: 'bottomright',
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
  				rotateControl: false
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
  		visualClick: true,
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
  		includeLeafletUICSS: true,
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
  			setDefaultOptions.call(this);
  			initMap.call(this);
  		}
  	});

  	// Disable leaflet map default controls.
  	function disableDefaultUI() {
  		if (this.zoomControl) this.zoomControl.remove();
  		if (this.rotateControl) this.rotateControl.remove();
  		if (this.fullscreenControl && this.options.fullscreenControl && !this.options.zoomControl) this.fullscreenControl.remove();
  		if (this.searchControl && this.options.searchControl) this.searchControl.remove();
  		if (this.attributionControl) this.attributionControl.remove();
  	}

  	// Deep merge "default_options" and do some sanity check.
  	function setDefaultOptions() {
  		let opts = this.options;

  		// Recursive merge leaflet map options.
  		for (let i in default_options) {
  			if (opts[i] === true || typeof opts[i] === "undefined") {
  				opts[i] = default_options[i];
  			} else if (typeof this.options[i] === "object" && opts[i] instanceof Array === false) {
  				opts[i] = deepMerge(default_options[i], opts[i]);
  			}
  		}

  		// Set deafult tile providers Api Keys (if any).
  		if (opts.apiKeys) {
  			if (opts.apiKeys.thunderforest) {
  				opts.mapTypes.atlas.options.apikey   = opts.apiKeys.thunderforest;
  				opts.mapTypes.terrain.options.apikey = opts.apiKeys.thunderforest;
  				opts.mapTypes.cycle.options.apikey   = opts.apiKeys.thunderforest;
  			}
  			if (opts.apiKeys.google) {
  				opts.pegmanControl.apiKey = opts.apiKeys.google;
  			}
  		}
  		// Append Api Keys (query string).
  		for (let k of ['atlas', 'terrain', 'cycle']) {
  			if (opts.mapTypes[k].options.apikey && opts.mapTypes[k].url.indexOf('apikey=') === -1) {
  				opts.mapTypes[k].url += (opts.mapTypes[k].url.indexOf('?') === -1 ? '?' : '&') + 'apikey={apikey}';
  			}
  		}
  		// Fix default mapTypeId if missing in mapTypeIds array.
  		if (opts.mapTypeIds.includes(opts.mapTypeId) === false && opts.mapTypeIds.length > 0) {
  			opts.mapTypeId = opts.mapTypeIds[0];
  		}
  		// Auto detect user "querylang" value when using search control.
  		if (opts.searchControl && opts.searchControl.detectUserLang) {
  			opts.searchControl.querylang = window.navigator.languages ? window.navigator.languages[0] : (window.navigator.userLanguage || window.navigator.language);
  		}
  		// Replace default "querylang" value when using search control.
  		if (opts.searchControl && opts.searchControl.querylang) {
  			opts.searchControl.url = opts.searchControl.url.replace('{querylang}', opts.searchControl.querylang);
  		}
  		// Avoid missing center/zoom values when using minimap control.
  		if (opts.minimapControl && !opts.center && !opts.zoom) {
  			this.setView([0, 0], 0);
  		}
  	}
  	// Initialize default leaflet map controls and layers.
  	function initMap() {
  		let controls = {},
  			layers   = {},
  			baseMaps = {},
  			opts     = this.options;

  		// Gesture Handling.
  		if (opts.gestureHandling) {
  			this.gestureHandling.enable();
  		}

  		// Load all user selected layers.
  		for (let i in opts.mapTypeIds) {
  			let id = opts.mapTypeIds[i];
  			if (opts.mapTypes[id]) {
  				baseMaps[opts.mapTypes[id].name] = layers[id] = new L.TileLayer(opts.mapTypes[id].url, opts.mapTypes[id].options);
  				layers[id].mapTypeId = id; // save mapTypeId for easy access.
  			}
  		}

  		// Keep a reference of previous mapTypeId
  		this._lastMapTypeId = opts.mapTypeId;
  		this._prevMapTypeId = opts.mapTypeId;
  		this.on('baselayerchange', function(e) {
  			if (e && e.layer && e.layer.mapTypeId) {
  				this._prevMapTypeId = this._lastMapTypeId;
  				this._lastMapTypeId = e.layer.mapTypeId;
  			}
  		});

  		// Keep default baselayers to the lower level
  		this.on('baselayerchange', function(e) {
  			if (e && e.layer && e.layer.mapTypeId && e.layer.bringToBack) e.layer.bringToBack();
  		});

  		// Layers Control.
  		if (opts.layersControl) {
  			controls.layers = new L.Control.Layers(baseMaps, null, opts.layersControl);
  			this.on('zoomend', autoToggleSatelliteLayer, this);
  		}

  		// Attribution Control.
  		if (opts.attributionControl && this.attributionControl) {
  			this.attributionControl.addTo(this);
  			controls.attribution = this.attributionControl;
  			this.on('baselayerchange', L.bind(updateLeafletAttribution, this, this.attributionControl.options.prefix));
  		}

  		// Edit in OSM link.
  		if (opts.editInOSMControl) {
  			controls.editInOSM = new L.Control.EditInOSM(opts.editInOSMControl);
  		}

  		// Scale Control.
  		if (opts.scaleControl) {
  			controls.scale = new L.Control.Scale(opts.scaleControl);
  		}

  		// Zoom Control.
  		if (opts.zoomControl && this.zoomControl) {
  			this.zoomControl.setPosition(opts.zoomControl.position);
  			this.zoomControl.addTo(this);
  			controls.zoom = this.zoomControl;
  		}

  		// Rotate Control.
  		if (opts.rotateControl && this.rotateControl) {
  			this.rotateControl.setPosition(opts.rotateControl.position);
  			this.rotateControl.addTo(this);
  			controls.rotate = this.rotateControl;
  		}

  		// Pegman Control.
  		if (opts.pegmanControl) {
  			controls.pegman = new L.Control.Pegman(opts.pegmanControl);
  		}

  		// Locate Control.
  		if (opts.locateControl) {
  			controls.locate = new L.Control.Locate(opts.locateControl);
  		}

  		// Search Control.
  		if (opts.searchControl) {
  			controls.search = this.searchControl = new L.Control.Search(opts.searchControl);
  		}

  		// Print Control.
  		if (opts.printControl) {
  			controls.print = new L.Control.EasyPrint(opts.printControl);
  		}

  		// Loading Control.
  		if (opts.loadingControl) {
  			controls.loading = new L.Control.Loading(opts.loadingControl);
  		}

  		// Fullscreen Control.
  		if (opts.fullscreenControl) {
  			controls.fullscreen = this.fullscreenControl = new L.Control.FullScreen(opts.fullscreenControl);
  		}

  		// Minimap Control.
  		if (opts.minimapControl) {
  			let miniMapTypeId = opts.minimapControl.mapOptions.mapTypeId;
  			let miniMapLayer  = opts.mapTypes[miniMapTypeId];
  			if (miniMapLayer) {
  				miniMapLayer = new L.TileLayer(miniMapLayer.url, miniMapLayer.options);
  				miniMapLayer.mapTypeId = miniMapTypeId; // save mapTypeId for easy access.
  				controls.minimap = new L.Control.MiniMap(miniMapLayer, opts.minimapControl);
  				controls.minimap._mainMapBaseLayers = baseMaps; // save baseMaps for easy access.
  			}
  		}

  		// Resizer Control.
  		if (opts.resizerControl) {
  			controls.resizer = new L.Control.Resizer(opts.resizerControl);
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
  			if (opts.mapTypeId) {
  				let baseLayer = opts.mapTypes[opts.mapTypeId];
  				if (baseLayer && baseMaps[baseLayer.name]) {
  					opts.layers = opts.layers.filter(item => item._leaflet_id !== baseMaps[baseLayer.name]._leaflet_id);
  					let layer = baseMaps[baseLayer.name];
  					if (layer.setZIndex) layer.setZIndex(0);
  					else if (layer.bringToBack) layer.bringToBack();
  				}
  			}
  		}, this);

  		// Set default base layer.
  		if (opts.mapTypeId) {
  			let baseLayer = opts.mapTypes[opts.mapTypeId];
  			if (baseLayer && baseMaps[baseLayer.name]) {
  				opts.layers.unshift(baseMaps[baseLayer.name]); // Add to the array of layers that will be automatically loaded within the map initially.
  			}
  		}

  		// Load custom plugins.
  		if (opts.plugins) {
  			if (!lazyLoader.loader) {
  				let core_plugins = [];
  				if (opts.includeLeafletUICSS) {
  					core_plugins.unshift("leaflet-ui@" + currentVersion + "/dist/leaflet-ui.css");
  				}
  				if (!window.L) {
  					core_plugins.unshift("leaflet@1.3.4/dist/leaflet.css");
  					core_plugins.unshift("leaflet@1.3.4/dist/leaflet.js");
  				} else if (opts.includeLeafletCSS && L.version) {
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
  				lazyLoader.loader = lazyLoader.loadSyncScripts([core_plugins, opts.plugins]);
  			}

  			// Lazy load initHooks
  			if (this._initHooks) {
  				let initHooks = this._initHooks.length;
  				this.once('plugins_loaded', function() {
  					if (initHooks < this._initHooks.length)
  						for (let i = initHooks, len = this._initHooks.length; i < len; i++) {
  							this._initHooks[i].call(this);
  						}
  					this.fire('initHooks_called');
  				});
  			}

  			lazyLoader.loader.then(() => this.fire('plugins_loaded'));
  		}
  	}

  	// Conditionally show leaflet attribution when showing GoogleMutant tiles
  	function updateLeafletAttribution(defaultAttribution, e) {
  		if (e && e.layer) {
  			this.attributionControl.setPrefix((L.GridLayer.GoogleMutant && e.layer instanceof L.GridLayer.GoogleMutant) ? false : defaultAttribution);
  		}
  	}

  	// Automatically show satellite layer at higher zoom levels
  	function autoToggleSatelliteLayer(e) {
  		let zoom = this.getZoom();
  		let control = this.controls.layers;
  		let inputs = control._layerControlInputs;

  		for (let i in inputs) {
  			let input = inputs[i];
  			let layer = control._getLayer(input.layerId).layer;
  			let mapTypeId = layer.mapTypeId;
  			if (mapTypeId == "satellite") {
  				if (zoom >= 18 && !layer._map && !layer._isAutoToggled) {
  					layer._isAutoToggled = true;
  					input.click();
  					break;
  				} else if (zoom < 18 && layer._map && layer._isAutoToggled) {
  					for (let j in inputs) {
  						let input = inputs[j];
  						let layer = control._getLayer(input.layerId).layer;
  						let mapTypeId = layer.mapTypeId;
  						if (mapTypeId == this._prevMapTypeId) {
  							input.click();
  							break;
  						}
  					}
  					layer._isAutoToggled = false;
  					break;
  				} else if (zoom < 18 && !layer._map && layer._isAutoToggled) {
  					layer._isAutoToggled = false;
  					break;
  				}
  			}
  		}

  	}

  	let minimapProto = L.Control.MiniMap.prototype;
  	let onAddMinimapProto = minimapProto.onAdd;

  	// Customize MiniMap default core behavior.
  	L.Control.MiniMap.include({
  		onAdd: function(map) {
  			let container = onAddMinimapProto.call(this, map);

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
  					let minimap = this,
  						mainmap = this._mainMap,
  						miniMapTypeId = minimap._layer.mapTypeId,
  						mainMapTypeId = e.layer.mapTypeId;


  					if (mainmap.options.mapTypeIds.length > 0 && inArray(mainmap.options.mapTypeIds, mainMapTypeId)) {
  						if (mainMapTypeId != miniMapTypeId) {
  							minimap._lastMapTypeId = mainMapTypeId;
  						}

  						let mapTypeId,
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
  				let minimap = this,
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
  					let mapTypeId,
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
