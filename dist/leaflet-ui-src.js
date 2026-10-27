(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // src/leaflet-compat.js
  var Leaflet, L2, leaflet_compat_default;
  var init_leaflet_compat = __esm({
    "src/leaflet-compat.js"() {
      Leaflet = window.L || window.leaflet;
      if (!Leaflet) throw new Error("Leaflet must be loaded before leaflet-ui");
      Leaflet.control ||= {};
      Leaflet.gridLayer ||= {};
      L2 = Object.assign(Object.create(Leaflet), Leaflet.Util);
      L2.Util = {
        ...Leaflet.Util,
        extend: Object.assign,
        bind: (fn, context, ...args) => fn.bind(context, ...args),
        isArray: Array.isArray,
        requestAnimFrame: (fn, context) => requestAnimationFrame(context ? fn.bind(context) : fn)
      };
      L2.Mixin = { Events: Object.fromEntries(
        Object.getOwnPropertyNames(L2.Evented.prototype).filter((name) => name !== "constructor").map((name) => [name, L2.Evented.prototype[name]])
      ) };
      for (const [factory, Constructor] of Object.entries({
        marker: L2.Marker,
        icon: L2.Icon,
        divIcon: L2.DivIcon,
        latLng: L2.LatLng,
        rectangle: L2.Rectangle
      })) {
        if (!L2[factory]) L2[factory] = (...args) => new Constructor(...args);
      }
      L2.Browser = { any3d: true, ...Leaflet.Browser };
      L2.DomEvent = {
        ...Leaflet.DomEvent,
        addListener: Leaflet.DomEvent.on
      };
      L2.DomUtil = {
        ...Leaflet.DomUtil,
        addClass: (element, names) => element.classList.add(...names.trim().split(/\s+/)),
        removeClass: (element, names) => element.classList.remove(...names.trim().split(/\s+/))
      };
      leaflet_compat_default = L2;
    }
  });

  // node_modules/leaflet.fullscreen/dist/Control.FullScreen.umd.js
  var require_Control_FullScreen_umd = __commonJS({
    "node_modules/leaflet.fullscreen/dist/Control.FullScreen.umd.js"(exports2) {
      init_leaflet_compat();
      (function(global2, factory) {
        false ? module.exports = factory(null) : false ? define(["leaflet"], factory) : (global2 = typeof globalThis !== "undefined" ? globalThis : global2 || self, global2.L = global2.L || {}, global2.L.Control = global2.L.Control || {}, global2.L.Control.FullScreen = factory(global2.L));
      })(exports2, (function(leaflet) {
        "use strict";
        if (typeof document === "undefined") {
          console.warn('"window.document" is undefined; leaflet.fullscreen requires this object to access the DOM');
        }
        const nativeAPI = (() => {
          const methodMap = [
            // Standard
            [
              "requestFullscreen",
              "exitFullscreen",
              "fullscreenElement",
              "fullscreenEnabled",
              "fullscreenchange",
              "fullscreenerror"
            ],
            // New WebKit
            [
              "webkitRequestFullscreen",
              "webkitExitFullscreen",
              "webkitFullscreenElement",
              "webkitFullscreenEnabled",
              "webkitfullscreenchange",
              "webkitfullscreenerror"
            ]
          ];
          const baseList = methodMap[0];
          const ret = {};
          for (const methodList of methodMap) {
            if (methodList[1] in document) {
              for (let i = 0; i < methodList.length; i++) {
                ret[baseList[i]] = methodList[i];
              }
              return ret;
            }
          }
          return false;
        })();
        const eventNameMap = {
          change: nativeAPI.fullscreenchange,
          error: nativeAPI.fullscreenerror
        };
        const fullscreenAPI = {
          // Request fullscreen for a specific element
          async request(element, options) {
            element = element || document.documentElement;
            const requestMethod = nativeAPI.requestFullscreen;
            await this._callNative(() => {
              return element[requestMethod](options);
            });
          },
          // Exit fullscreen mode
          async exit() {
            if (!this.isFullscreen) {
              return;
            }
            const exitMethod = nativeAPI.exitFullscreen;
            await this._callNative(() => {
              return document[exitMethod]();
            });
          },
          // Helper to handle browser differences (Promise vs Event)
          async _callNative(action) {
            const result = action();
            if (result instanceof Promise) {
              await result;
              return;
            }
            await new Promise((resolve) => {
              const listener = () => {
                this.off("change", listener);
                resolve();
              };
              this.on("change", listener);
            });
          },
          // Add event listener for fullscreen changes
          on(event, callback) {
            const eventName = eventNameMap[event];
            if (eventName) {
              document.addEventListener(eventName, callback);
            }
          },
          // Remove event listener
          off(event, callback) {
            const eventName = eventNameMap[event];
            if (eventName) {
              document.removeEventListener(eventName, callback);
            }
          },
          nativeAPI
        };
        Object.defineProperties(fullscreenAPI, {
          isFullscreen: {
            get() {
              return Boolean(document[nativeAPI.fullscreenElement]);
            }
          },
          isEnabled: {
            enumerable: true,
            get() {
              return Boolean(document[nativeAPI.fullscreenEnabled]);
            }
          }
        });
        const FullScreen = leaflet.Control.extend({
          options: {
            position: "topleft",
            title: "Full Screen",
            titleCancel: "Exit Full Screen",
            forceSeparateButton: false,
            forcePseudoFullscreen: false,
            fullscreenElement: false
          },
          _screenfull: fullscreenAPI,
          onAdd(map) {
            let className = "leaflet-control-zoom-fullscreen";
            let container;
            let content = "";
            if (map.zoomControl && !this.options.forceSeparateButton) {
              container = map.zoomControl._container;
            } else {
              container = document.createElement("div");
              container.className = "leaflet-bar";
            }
            if (this.options.content) {
              content = this.options.content;
            } else {
              className += " leaflet-fullscreen-icon";
            }
            this._createButton(this.options.title, className, content, container, this.toggleFullScreen, this);
            this._map.fullscreenControl = this;
            this._map.on("enterFullscreen exitFullscreen", this._toggleState, this);
            return container;
          },
          onRemove() {
            leaflet.DomEvent.off(this.link, "click", leaflet.DomEvent.stop).off(this.link, "click", this.toggleFullScreen, this);
            if (this._screenfull.isEnabled) {
              leaflet.DomEvent.off(document, this._screenfull.nativeAPI.fullscreenchange, leaflet.DomEvent.stop).off(document, this._screenfull.nativeAPI.fullscreenchange, this._handleFullscreenChange, this);
            }
          },
          _createButton(title, className, content, container, fn, context) {
            this.link = document.createElement("a");
            this.link.className = className;
            container.appendChild(this.link);
            this.link.href = "#";
            this.link.title = title;
            this.link.innerHTML = content;
            this.link.setAttribute("role", "button");
            this.link.setAttribute("aria-label", title);
            leaflet.DomEvent.disableClickPropagation(container);
            leaflet.DomEvent.on(this.link, "click", leaflet.DomEvent.stop).on(this.link, "click", fn, context);
            if (this._screenfull.isEnabled) {
              leaflet.DomEvent.on(document, this._screenfull.nativeAPI.fullscreenchange, leaflet.DomEvent.stop).on(document, this._screenfull.nativeAPI.fullscreenchange, this._handleFullscreenChange, context);
            }
            return this.link;
          },
          async toggleFullScreen() {
            const map = this._map;
            const { fullscreenElement, forcePseudoFullscreen } = this.options;
            const container = fullscreenElement || map.getContainer();
            const useNative = this._screenfull.isEnabled && !forcePseudoFullscreen;
            if (map._isFullscreen) {
              map._exitFired = true;
              if (useNative) {
                await this._screenfull.exit();
              } else {
                container.classList.remove("leaflet-pseudo-fullscreen");
              }
              map.invalidateSize();
              map._isFullscreen = false;
              map.fire("exitFullscreen");
            } else {
              map._exitFired = false;
              if (useNative) {
                await this._screenfull.request(container);
              } else {
                container.classList.add("leaflet-pseudo-fullscreen");
              }
              map.invalidateSize();
              map._isFullscreen = true;
              map.fire("enterFullscreen");
            }
          },
          _toggleState() {
            const { title, titleCancel } = this.options;
            const isFullscreen = this._map._isFullscreen;
            this.link.title = isFullscreen ? titleCancel : title;
            this.link.setAttribute("aria-label", this.link.title);
            this.link.setAttribute("aria-pressed", isFullscreen.toString());
            this.link.classList.toggle("leaflet-fullscreen-on", isFullscreen);
          },
          _handleFullscreenChange() {
            const map = this._map;
            const wasExitedExternally = !this._screenfull.isFullscreen && map._isFullscreen && !map._exitFired;
            if (wasExitedExternally) {
              map._exitFired = true;
              map._isFullscreen = false;
              map.fire("exitFullscreen");
              map.invalidateSize();
            }
          }
        });
        leaflet.Map.include({
          toggleFullscreen() {
            this.fullscreenControl.toggleFullScreen();
          }
        });
        leaflet.Map.mergeOptions({
          fullscreenControl: false
        });
        leaflet.Map.addInitHook(function() {
          if (this.options.fullscreenControl) {
            this.addControl(new FullScreen(this.options.fullscreenControlOptions));
          }
        });
        return FullScreen;
      }));
    }
  });

  // package.json
  var version = "0.7.0";

  // src/leaflet-ui.js
  init_leaflet_compat();

  // node_modules/leaflet-i18n/Leaflet.i18n.js
  init_leaflet_compat();
  (function(factory, window2) {
    if (false) {
      define(["leaflet"], factory);
    } else if (false) {
      Leaflet_i18n_module.exports = factory(null);
    }
    if (typeof window2 !== "undefined" && window2.L) {
      factory(Leaflet);
    }
  })(function(L3) {
    L3.locales = {};
    L3.locale = null;
    L3.registerLocale = function registerLocale(code, locale) {
      L3.locales[code] = Object.assign({}, L3.locales[code], locale);
    };
    L3.setLocale = function setLocale(code) {
      L3.locale = code;
    };
    return L3.i18n = L3._ = function translate(string, data) {
      if (L3.locale && L3.locales[L3.locale] && typeof L3.locales[L3.locale][string] !== "undefined") {
        string = L3.locales[L3.locale][string];
      }
      try {
        string = L3.Util.template(string, data);
      } catch (err) {
      }
      return string;
    };
  }, window);

  // node_modules/leaflet-rotate/src/dom/DomUtil.js
  var domUtilProto = Object.assign({}, L.DomUtil);
  Object.assign(L.DomUtil, {
    /**
     * Resets the 3D CSS transform of `el` so it is translated by `offset` pixels,
     * optionally scaled by `scale`, and rotated around `pivot` when `bearing` is set.
     *
     * @param {HTMLElement} el Element to transform.
     * @param {L.Point} [offset] Translation in pixels; defaults to the origin.
     * @param {number} [scale] Optional scale factor.
     * @param {number} [bearing] Optional rotation in radians.
     * @param {L.Point} [pivot] Point in pixels around which to rotate.
     * 
     * @returns {void}
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    setTransform(el, offset, scale, bearing, pivot) {
      let pos = offset || new L.Point(0, 0);
      if (!bearing) {
        return domUtilProto.setTransform(el, pos._round(), scale);
      }
      pos = pos.rotateFrom(bearing, pivot);
      el.style.transform = "translate3d(" + pos.x + "px," + pos.y + "px,0)" + (scale ? " scale(" + scale + ")" : "") + " rotate(" + bearing + "rad)";
    },
    /**
     * Sets the position of `el` to `point`, using CSS transforms or top/left positioning
     * depending on browser support, and optionally rotating it around `pivot`.
     *
     * @param {HTMLElement} el Element to position.
     * @param {L.Point} point Position in pixels.
     * @param {number} [bearing] Rotation in radians; zero or omitted uses Leaflet positioning.
     * @param {L.Point} [pivot] Point in pixels around which to rotate.
     * @param {number} [scale] Optional scale factor.
     * 
     * @returns {void}
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    setPosition(el, point, bearing, pivot, scale) {
      if (!bearing) {
        return domUtilProto.setPosition(el, point);
      }
      el._leaflet_pos = point;
      L.DomUtil.setTransform(el, point, scale, bearing, pivot);
    },
    /**
     * Returns the position assigned to `el`.
     *
     * @param {HTMLElement} el Element whose Leaflet position is requested.
     * 
     * @returns {L.Point} Stored Leaflet position, or the position measured by Leaflet.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    getPosition(el) {
      return el._leaflet_pos || domUtilProto.getPosition(el);
    }
  });

  // node_modules/leaflet-rotate/src/dom/Draggable.js
  L.Draggable.include({
    /** @TODO */
    // updateMapBearing(mapBearing) {
    //     this._mapBearing = mapBearing;
    // },
  });

  // node_modules/leaflet-rotate/src/geometry/Point.js
  Object.assign(L.Point.prototype, {
    /**
     * Rotate around (0,0) by applying the 2D rotation matrix:
     * 
     * ⎡ x' ⎤ = ⎡ cos θ  -sin θ ⎤ ⎡ x ⎤
     * ⎣ y' ⎦   ⎣ sin θ   cos θ ⎦ ⎣ y ⎦
     * 
     * @param {number} theta Rotation angle in radians, counterclockwise.
     * @returns {L.Point} Rotated point (or this point when theta is zero).
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    rotate(theta) {
      return this.rotateFrom(theta, new L.Point(0, 0));
    },
    /**
     * Rotate around (pivot.x, pivot.y) by:
     * 
     * 1. subtract (pivot.x, pivot.y)
     * 2. rotate around (0, 0)
     * 3. add (pivot.x, pivot.y) back
     * 
     * same as `this.subtract(pivot).rotate(theta).add(pivot)`
     * 
     * @param {number} theta Rotation angle in radians, counterclockwise.
     * @param {L.Point} pivot Point to rotate around.
     * 
     * @returns {L.Point}
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    rotateFrom(theta, pivot) {
      if (!theta) {
        return this;
      }
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      const cx = pivot.x, cy = pivot.y;
      const x = this.x - cx, y = this.y - cy;
      return new L.Point(
        x * cosTheta - y * sinTheta + cx,
        x * sinTheta + y * cosTheta + cy
      );
    }
  });
  function toPoint(point) {
    if (point == null || point instanceof L.Point) {
      return point;
    }
    return Array.isArray(point) ? new L.Point(point[0], point[1]) : new L.Point(point.x, point.y);
  }

  // node_modules/leaflet-rotate/src/layer/DivOverlay.js
  var divOverlayProto = Object.defineProperties({}, Object.getOwnPropertyDescriptors(L.DivOverlay.prototype));
  L.DivOverlay.include({
    /**
     * Extend overlay event subscriptions to refresh position after map rotation and pitch.
     * 
     * @listens L.Map~rotate
     * @listens L.Map~pitch
     *
     * @returns {Object} Leaflet event map for the overlay.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    getEvents() {
      const events = Object.assign(divOverlayProto.getEvents.apply(this, arguments), {
        rotate: this._updatePosition,
        pitch: this._updatePitchEvents
      });
      if (this._map && this._map._pitch) {
        events.move = this._updatePosition;
      }
      return events;
    },
    /**
     * Listen to map movement only while pitch is non-zero.
     * 
     * @since leaflet-rotate (0.5.0)
     */
    _updatePitchEvents() {
      if (this._map._pitch) {
        this._map.on("move", this._updatePosition, this);
      } else {
        this._map.off("move", this._updatePosition, this);
      }
    },
    /**
     * Reposition the overlay after map movement, applying rotation/pitch-aware coordinates.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _updatePosition() {
      if (!this._map) {
        return;
      }
      divOverlayProto._updatePosition.apply(this, arguments);
      if (this._map._rotate && this._zoomAnimated) {
        const anchor = this._getAnchor();
        const pos = L.DomUtil.getPosition(this._container).subtract(anchor);
        L.DomUtil.setPosition(this._container, this._map.rotatedPointToMapPanePoint(pos).add(anchor));
      } else if (this._map._rotate) {
        const mapPanePoint = this._map.rotatedPointToMapPanePoint(this._map.latLngToLayerPoint(this._latlng)), offset = toPoint(this.options.offset || [0, 0]), anchor = this._getAnchor();
        this._containerLeft = -Math.round(this._containerWidth / 2) + mapPanePoint.x + offset.x + anchor.x;
        this._containerBottom = -(mapPanePoint.y + offset.y + anchor.y);
        this._container.style.left = this._containerLeft + "px";
        this._container.style.bottom = this._containerBottom + "px";
        this._container.style.top = "";
        L.DomUtil.setPosition(this._container, new L.Point(0, 0));
        this._container.style.transform = "";
      }
    }
  });

  // node_modules/leaflet-rotate/src/layer/Popup.js
  var popupProto = Object.defineProperties({}, Object.getOwnPropertyDescriptors(L.Popup.prototype));
  L.Popup.include({
    /**
     * Update the popup position during zoom animation and transform it into map-pane coordinates.
     *
     * @param {Object} e Zoom animation event.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _animateZoom(e) {
      popupProto._animateZoom.apply(this, arguments);
      if (this._map && this._map._rotate) {
        const anchor = this._getAnchor();
        const pos = L.DomUtil.getPosition(this._container).subtract(anchor);
        L.DomUtil.setPosition(this._container, this._map.rotatedPointToMapPanePoint(pos).add(anchor));
      }
    },
    /**
     * Pan the map when a popup with auto-pan enabled would extend beyond the viewport.
     * 
     * @see https://github.com/fnicollet/Leaflet/pull/21
     *
     * @fires L.Map#autopanstart
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _adjustPan() {
      if (!this.options.autoPan || this._map._panAnim && this._map._panAnim._inProgress) {
        return;
      }
      if (this._autopanning) {
        this._autopanning = false;
        return;
      }
      const map = this._map, marginBottom = parseInt(getComputedStyle(this._container).marginBottom, 10) || 0, containerHeight = this._container.offsetHeight + marginBottom, containerWidth = this._containerWidth, layerPos = new L.Point(this._containerLeft, -containerHeight - this._containerBottom);
      layerPos._add(L.DomUtil.getPosition(this._container));
      const containerPos = layerPos._add(this._map._getMapPanePos()), padding = toPoint(this.options.autoPanPadding || [0, 0]), paddingTL = toPoint(this.options.autoPanPaddingTopLeft || padding), paddingBR = toPoint(this.options.autoPanPaddingBottomRight || padding), size = map.getSize();
      let dx = 0, dy = 0;
      if (containerPos.x + containerWidth + paddingBR.x > size.x) {
        dx = containerPos.x + containerWidth - size.x + paddingBR.x;
      }
      if (containerPos.x - dx - paddingTL.x < 0) {
        dx = containerPos.x - paddingTL.x;
      }
      if (containerPos.y + containerHeight + paddingBR.y > size.y) {
        dy = containerPos.y + containerHeight - size.y + paddingBR.y;
      }
      if (containerPos.y - dy - paddingTL.y < 0) {
        dy = containerPos.y - paddingTL.y;
      }
      if (dx || dy) {
        if (this.options.keepInView) {
          this._autopanning = true;
        }
        map.fire("autopanstart").panBy([dx, dy]);
      }
    }
  });

  // node_modules/leaflet-rotate/src/layer/Tooltip.js
  var tooltipProto = Object.defineProperties({}, Object.getOwnPropertyDescriptors(L.Tooltip.prototype));
  L.Tooltip.include({
    /**
     * Reposition the tooltip during zoom animation using transformed map coordinates.
     *
     * @param {Object} e Zoom animation event.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _animateZoom(e) {
      if (!this._map._rotate) {
        return tooltipProto._animateZoom.apply(this, arguments);
      }
      let pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center);
      pos = this._map.rotatedPointToMapPanePoint(pos);
      this._setPosition(pos);
    },
    /**
     * Recompute tooltip screen position after map movement.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _updatePosition() {
      if (!this._map._rotate) {
        return tooltipProto._updatePosition.apply(this, arguments);
      }
      let pos = this._map.latLngToLayerPoint(this._latlng);
      pos = this._map.rotatedPointToMapPanePoint(pos);
      this._setPosition(pos);
    }
  });

  // node_modules/leaflet-rotate/src/layer/marker/Icon.js
  var iconProto = Object.defineProperties({}, Object.getOwnPropertyDescriptors(L.Icon.prototype));
  L.Icon.include({
    /**
     * Set marker icon dimensions and anchor styles, including the rotation origin.
     * 
     * @param {HTMLImageElement} img Icon or shadow element.
     * @param {string} name Icon style key (`icon` or `shadow`).
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _setIconStyles(img, name) {
      const options = this.options;
      let sizeOption = options[name + "Size"];
      if (typeof sizeOption === "number") {
        sizeOption = [sizeOption, sizeOption];
      }
      const size = sizeOption ? new L.Point(...Array.isArray(sizeOption) ? sizeOption : [sizeOption.x, sizeOption.y]) : null, anchorOption = name === "shadow" && options.shadowAnchor || options.iconAnchor || size && size.divideBy(2, true), anchor = anchorOption ? new L.Point(...Array.isArray(anchorOption) ? anchorOption : [anchorOption.x, anchorOption.y]) : null;
      img.className = "leaflet-marker-" + name + " " + (options.className || "");
      if (anchor) {
        img.style.marginLeft = -anchor.x + "px";
        img.style.marginTop = -anchor.y + "px";
        img.style.transformOrigin = anchor.x + "px " + anchor.y + "px 0px";
      }
      if (size) {
        img.style.width = size.x + "px";
        img.style.height = size.y + "px";
      }
    }
  });

  // node_modules/leaflet-rotate/src/layer/marker/Marker.js
  var markerProto = Object.defineProperties({}, Object.getOwnPropertyDescriptors(L.Marker.prototype));
  L.Marker.mergeOptions({
    /**
     * Rotation of the marker icon in radians.
     * 
     * @type {Number}
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    rotation: 0,
    /**
     * Rotate the marker icon when the map bearing changes.
     *
     * Combine with `keepUpright: true` to keep the marker readable while
     * preserving its line alignment.
     * 
     * @type {Boolean}
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    rotateWithView: false,
    /**
     * Flip the icon when needed to keep it upright while map-aligned.
     *
     * @type {Boolean}
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    keepUpright: false,
    /**
     * Optional scale of the marker icon and shadow.
     * 
     * @type {Number}
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    scale: void 0
  });
  var markerDragProto;
  var MarkerDrag = {
    // _onDragStart() {
    //     if (!this._marker._map._rotate) {
    //         return markerDragProto._onDragStart.apply(this, arguments);
    //     }
    //     this._draggable.updateMapBearing(this._marker._map._bearing);
    // },
    /**
     * Update a dragged marker's geographic position from its transformed icon position.
     * 
     * @param {Object} e Marker drag event with `latlng` and `oldLatLng` fields.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _onDrag(e) {
      const marker = this._marker, rotated_marker = marker.options.rotation || marker.options.rotateWithView, shadow = marker._shadow;
      let iconPos = L.DomUtil.getPosition(marker._icon);
      if (!rotated_marker && shadow) {
        L.DomUtil.setPosition(shadow, iconPos);
      }
      if (marker._map._rotate) {
        iconPos = marker._map.mapPanePointToRotatedPoint(iconPos);
      }
      const latlng = marker._map.layerPointToLatLng(iconPos);
      marker._latlng = latlng;
      e.latlng = latlng;
      e.oldLatLng = this._oldLatLng;
      if (rotated_marker) marker.setLatLng(latlng);
      else marker.fire("move", e);
      marker.fire("drag", e);
    },
    /**
     * Reposition the marker after a drag ends, then run Leaflet's drag-end logic.
     * 
     * @param {Object} e Marker drag-end event.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _onDragEnd(e) {
      if (this._marker._map._rotate) {
        this._marker.update();
      }
      markerDragProto._onDragEnd.apply(this, arguments);
    }
  };
  L.Marker.include({
    /**
     * Extend marker event subscriptions to reposition its icon after bearing or pitch changes.
     * 
     * @listens L.Map~rotate
     * @listens L.Map~pitch
     * 
     * @returns {Object} Leaflet event map for the marker.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    getEvents() {
      const events = Object.assign(markerProto.getEvents.apply(this, arguments), {
        rotate: this.update,
        pitch: this._updatePitchEvents
      });
      if (this._map && this._map._pitch) {
        events.move = this.update;
      }
      return events;
    },
    /**
     * Subscribe to map movement while pitch is active to keep the icon aligned.
     * 
     * @since leaflet-rotate (0.5.0)
     */
    _updatePitchEvents() {
      if (this._map._pitch) {
        this._map.on("move", this.update, this);
      } else {
        this._map.off("move", this.update, this);
      }
    },
    /**
     * Install rotation-aware drag callbacks when marker dragging is enabled.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _initInteraction() {
      const ret = markerProto._initInteraction.apply(this, arguments);
      if (this.dragging && this.dragging.enabled() && this._map && this._map._rotate) {
        markerDragProto = markerDragProto || Object.getPrototypeOf(this.dragging);
        this.dragging.disable();
        Object.assign(this.dragging, {
          // _onDragStart: MarkerDrag._onDragStart.bind(this.dragging),
          _onDrag: MarkerDrag._onDrag.bind(this.dragging),
          _onDragEnd: MarkerDrag._onDragEnd.bind(this.dragging)
        });
        this.dragging.enable();
      }
      return ret;
    },
    /**
     * Position and rotate the marker icon and shadow in map-pane coordinates.
     * 
     * @param {L.Point} pos Marker anchor in layer-point coordinates.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _setPos(pos) {
      if (this._map._rotate) {
        pos = this._map.rotatedPointToMapPanePoint(pos);
      }
      let bearing = this.options.rotation || 0;
      if (this.options.rotateWithView) {
        bearing += this._map._bearing;
      }
      if (this.options.keepUpright) {
        bearing = (bearing % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        if (bearing > Math.PI / 2 && bearing < 3 * Math.PI / 2) {
          bearing += Math.PI;
        }
        bearing %= 2 * Math.PI;
      }
      if (this._icon) {
        L.DomUtil.setPosition(this._icon, pos, bearing, pos, this.options.scale);
      }
      if (this._shadow) {
        L.DomUtil.setPosition(this._shadow, pos, bearing, pos, this.options.scale);
      }
      this._zIndex = pos.y + this.options.zIndexOffset;
      this._resetZIndex();
    },
    // _updateZIndex(offset) {
    //     if (!this._map._rotate) {
    //         return markerProto._updateZIndex.apply(this, arguments);
    //     }
    //     this._icon.style.zIndex = Math.round(this._zIndex + offset);
    // },
    /**
     * Set the marker icon's rotation and redraw it.
     * 
     * @param {number} rotation Angle in radians.
     * 
     * @returns {void}
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    setRotation(rotation) {
      this.options.rotation = rotation;
      this.update();
    }
  });

  // node_modules/leaflet-rotate/src/layer/tile/GridLayer.js
  var gridLayerProto = Object.defineProperties({}, Object.getOwnPropertyDescriptors(L.GridLayer.prototype));
  L.GridLayer.include({
    /**
     * Add a throttled tile refresh after map bearing changes.
     * 
     * @listens L.Map~rotate
     * 
     * @returns {Object} Leaflet event map for the grid layer.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    getEvents() {
      const events = gridLayerProto.getEvents.apply(this, arguments);
      if (this._map._rotate && !this.options.updateWhenIdle) {
        if (!this._onRotate) {
          this._onRotate = L.Util.throttle(this._onMoveEnd, this.options.updateInterval, this);
        }
        events.rotate = this._onRotate;
      }
      return events;
    },
    /**
     * Return tile pixel bounds that cover the rotated viewport.
     * 
     * @param {L.LatLng} center View center used to calculate bounds.
     * 
     * @returns {L.Bounds} Pixel bounds covered by the layer's tiles.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _getTiledPixelBounds(center) {
      if (!this._map._rotate) {
        return gridLayerProto._getTiledPixelBounds.apply(this, arguments);
      }
      return this._map._getNewPixelBounds(center, this._tileZoom);
    }
  });

  // node_modules/leaflet-rotate/src/layer/vector/Renderer.js
  var rendererProto = Object.defineProperties({}, Object.getOwnPropertyDescriptors(L.Renderer.prototype));
  var rendererBase = Object.getPrototypeOf(L.Renderer.prototype);
  var rendererGetEvents = rendererProto.getEvents || rendererBase.getEvents;
  var rendererOnMoveEnd = rendererProto._onMoveEnd || rendererBase._onMoveEnd;
  L.Renderer.include({
    /**
     * Subscribe the renderer to map rotation so its visible bounds are recalculated.
     * 
     * @listens L.Map~rotate
     * 
     * @returns {Object} Leaflet event map for the renderer.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    getEvents() {
      const events = rendererGetEvents.apply(this, arguments);
      return Object.assign(events, { rotate: this._onRotate });
    },
    /**
     * Reproject vector paths and refresh renderer bounds after bearing changes.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _onRotate() {
      if (!this._map._rotate) {
        return;
      }
      this._onZoomEnd();
      if (L.version.startsWith("2.")) {
        this._onMoveEnd();
      } else {
        this._update();
      }
    },
    /**
     * Add the zoom-animation class needed for correct renderer transforms in Leaflet 1.
     *
     * Fixes `map.flyTo()` when `map.options.zoomAnimation` is false.
     * 
     * @see https://github.com/Leaflet/Leaflet/pull/8794
     * 
     * @since leaflet-rotate (v0.2.0)
     */
    onAdd() {
      rendererProto.onAdd.apply(this, arguments);
      if (L.version <= "1.9.3") {
        this._container.classList.add("leaflet-zoom-animated");
      }
    },
    /**
     * Update the renderer transform during zoom animation, accounting for rotated coordinates.
     *
     * @FIXME layer drifts on `map.setZoom()` (eg. zoom during animation)
     * 
     * the main cause seems to be related to `this._updateTransform(path._center, path._zoom))`
     * and `this._topLeft = this._map.layerPointToLatLng(this._bounds.min);`
     * 
     * @example
     *   map.setZoom(2);
     *   path._renderer._update();
     *   path._renderer._updateTransform(path._renderer._center, path._renderer._zoom);
     * 
     * @see https://github.com/Leaflet/Leaflet/pull/8794
     * @see https://github.com/Leaflet/Leaflet/pull/8103
     * @see https://github.com/Leaflet/Leaflet/issues/7466
     * 
     * @TODO recheck these changes against leaflet@v1.9.3
     * 
     * @see https://github.com/Leaflet/Leaflet/compare/v1.7.0...v1.9.3
     * 
     * @param {L.LatLng} center Target map center.
     * @param {number} zoom Target zoom level.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _updateTransform(center, zoom) {
      if (L.version.startsWith("2.")) {
        if (this._map._rotate) {
          const scale2 = this._map.getZoomScale(zoom, this._zoom), offset2 = this._topLeftPoint.multiplyBy(scale2).subtract(this._map._getNewPixelOrigin(center, zoom));
          L.DomUtil.setTransform(this._container, offset2, scale2);
          return;
        }
        return rendererBase._updateTransform.apply(this, arguments);
      }
      if (!this._map._rotate) {
        return rendererProto._updateTransform.apply(this, arguments);
      }
      if (zoom === this._zoom) {
        return;
      }
      const scale = this._map.getZoomScale(zoom, this._zoom), offset = this._map._latLngToNewLayerPoint(this._topLeft, zoom, center);
      L.DomUtil.setTransform(this._container, offset, scale);
    },
    /**
     * Recalculate bounds and finish renderer updates after movement on Leaflet 2.
     *
     * @param {Object} ev Map movement event.
     * 
     * @since leaflet-rotate (v0.4.0)
     */
    _onMoveEnd(ev) {
      if (!L.version.startsWith("2.") || !this._map._rotate) {
        return rendererOnMoveEnd.apply(this, arguments);
      }
      this._bounds = this._map._getPaddedPixelBounds(this.options.padding);
      this._topLeft = this._map.layerPointToLatLng(this._bounds.min);
      this._center = this._map.getCenter();
      this._zoom = this._map.getZoom();
      this._topLeftPoint = this._map._getNewPixelOrigin(this._center, this._zoom).add(this._bounds.min);
      this._updateTransform(this._center, this._zoom);
      this._resizeContainer();
      this._onSettled(ev);
    },
    /**
     * Resize the renderer container to cover the pitch-aware map bounds.
     * 
     * @since leaflet-rotate (v0.4.0)
     */
    _resizeContainer() {
      if (!L.version.startsWith("2.") || !this._map._rotate || !this._bounds) {
        return rendererBase._resizeContainer.apply(this, arguments);
      }
      const size = this._bounds.getSize();
      this._container.style.width = size.x + "px";
      this._container.style.height = size.y + "px";
      return size;
    },
    // getEvents() {
    //     const events = {
    //         viewreset: this._reset,
    //         zoom: this._onZoom,
    //         moveend: this._update,
    //         zoomend: this._onZoomEnd
    //     };
    //     if (this._zoomAnimated) {
    //         events.zoomanim = this._onAnimZoom;
    //     }
    //     return events;
    // },
    // _onAnimZoom(ev) {
    //     this._updateTransform(ev.center, ev.zoom);
    // },
    // _onZoom() {
    //     this._updateTransform(this._map.getCenter(), this._map.getZoom());
    // },
    // _onZoomEnd() {
    //     for (const id in this._layers) {
    //         this._layers[id]._project();
    //     }
    // },
    // _reset() {
    //     this._update();
    //     this._updateTransform(this._center, this._zoom);
    //     for (const id in this._layers) {
    //         this._layers[id]._reset();
    //     }
    // },
    // _updatePaths() {
    //     for (const id in this._layers) {
    //         this._layers[id]._update();
    //     }
    // },
    /**
     * Recalculate renderer bounds and cached view state.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _update() {
      if (!this._map._rotate) {
        return rendererProto._update.apply(this, arguments);
      }
      this._bounds = this._map._getPaddedPixelBounds(this.options.padding);
      this._topLeft = this._map.layerPointToLatLng(this._bounds.min);
      this._center = this._map.getCenter();
      this._zoom = this._map.getZoom();
    }
  });

  // node_modules/leaflet-rotate/src/map/Map.js
  var mapProto = Object.defineProperties({}, Object.getOwnPropertyDescriptors(L.Map.prototype));
  L.Map.mergeOptions({
    /**
     * @type {boolean} Enable bearing and pitch transformations.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    rotate: false,
    /**
     * @type {number} Initial map bearing in degrees.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    bearing: 0,
    /**
     * @type {number} Initial map pitch in degrees, clamped to 0–85.
     * 
     * @since leaflet-rotate (0.5.0)
     */
    pitch: 0
  });
  L.Map.include({
    /**
     * Apply an immediate animated-zoom frame without waiting for a transition delay.
     *
     * @param {L.LatLng} center Target center.
     * @param {number} zoom Target zoom level.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _animateZoomNoDelay(center, zoom) {
      if (!this._mapPane) {
        return;
      }
      this._animatingZoom = true;
      this._animateToCenter = center;
      this._animateToZoom = zoom;
      this._move(center, zoom, void 0, true);
      this._onZoomTransitionEnd();
    },
    /**
     * Initialize the Leaflet map and apply its initial bearing and pitch.
     * 
     * @param {HTMLElement|string} id Map container element or its ID.
     * @param {Object} [options={}] Leaflet map options, including `rotate`, `bearing`, and `pitch`.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    initialize(id, options) {
      if (options.rotate) {
        this._rotate = true;
        this._bearing = 0;
        this._pitch = 0;
      }
      mapProto.initialize.apply(this, arguments);
      if (this.options.rotate) {
        this.on("resize", this._updatePitchTransform, this);
        this.setBearing(this.options.bearing);
        this.setPitch(this.options.pitch);
      }
    },
    /**
     * Given a pixel coordinate relative to the map container,
     * returns the corresponding pixel coordinate relative to
     * the [origin pixel](#map-getpixelorigin).
     * 
     * @param {L.Point|number[]} point Pixel coordinate in the map container.
     * 
     * @returns {L.Point} Corresponding layer-point coordinate.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    containerPointToLayerPoint(point) {
      if (!this._rotate) {
        return mapProto.containerPointToLayerPoint.apply(this, arguments);
      }
      if (this._pitch) {
        return this._transformPitchPoint(
          toPoint(point).subtract(this._getMapPanePos()),
          this._pitchInverseTransform
        );
      }
      return toPoint(point).subtract(this._getMapPanePos()).rotateFrom(-this._bearing, this._getRotatePanePos()).subtract(this._getRotatePanePos());
    },
    /**
     * Given a pixel coordinate relative to the [origin pixel](#map-getpixelorigin),
     * returns the corresponding pixel coordinate relative to the map container.
     * 
     * @param {L.Point|number[]} point Pixel coordinate in layer-point space.
     * 
     * @returns {L.Point} Corresponding pixel coordinate in the map container.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    layerPointToContainerPoint(point) {
      if (!this._rotate) {
        return mapProto.layerPointToContainerPoint.apply(this, arguments);
      }
      if (this._pitch) {
        return this._transformPitchPoint(point, this._pitchTransform).add(this._getMapPanePos());
      }
      return toPoint(point).add(this._getRotatePanePos()).rotateFrom(this._bearing, this._getRotatePanePos()).add(this._getMapPanePos());
    },
    /**
     * Converts a coordinate from the rotated pane reference system
     * to the reference system of the not rotated map pane.
     * 
     * (rotatePane) --> (mapPane)
     * (rotatePane) --> (norotatePane)
     * 
     * @param {L.Point|number[]} point Point in the rotated pane.
     * 
     * @returns {L.Point} Corresponding point in map-pane coordinates.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    rotatedPointToMapPanePoint(point) {
      if (this._pitch) {
        return this._transformPitchPoint(point, this._pitchTransform);
      }
      return toPoint(point).rotate(this._bearing)._add(this._getRotatePanePos());
    },
    /**
     * Converts a coordinate from the not rotated map pane reference system
     * to the reference system of the rotated pane.
     * 
     * (mapPane) --> (rotatePane)
     * (norotatePane) --> (rotatePane)
     * 
     * @param {L.Point|number[]} point Point in map-pane coordinates.
     * 
     * @returns {L.Point} Corresponding point in the rotated pane.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    mapPanePointToRotatedPoint(point) {
      if (this._pitch) {
        return this._transformPitchPoint(point, this._pitchInverseTransform);
      }
      return toPoint(point)._subtract(this._getRotatePanePos()).rotate(-this._bearing);
    },
    // latLngToLayerPoint(latlng) {
    //     const projectedPoint = this.project(L.latLng(latlng))._round();
    //     return projectedPoint._subtract(this.getPixelOrigin());
    // },
    // latLngToContainerPoint(latlng) {
    // 	return this.layerPointToContainerPoint(this.latLngToLayerPoint(toLatLng(latlng)));
    // },
    /**
     * Given latlng bounds, returns the bounds in projected pixel
     * relative to the map container.
     * 
     * @see https://github.com/ronikar/Leaflet/blob/5c480ef959b947c3beed7065425a5a36c486262b/src/map/Map.js#L1114-L1135
     * 
     * @param {L.LatLngBounds} bounds Geographic bounds to project.
     * 
     * @returns {L.Bounds} Axis-aligned bounds in container-pixel coordinates.
     * 
     * @since leaflet-rotate (v0.2.0)
     */
    mapBoundsToContainerBounds(bounds) {
      if (!this._rotate && mapProto.mapBoundsToContainerBounds) {
        return mapProto.mapBoundsToContainerBounds.apply(this, arguments);
      }
      const origin = this.getPixelOrigin();
      const nw = this.layerPointToContainerPoint(this.project(bounds.getNorthWest())._subtract(origin)), ne = this.layerPointToContainerPoint(this.project(bounds.getNorthEast())._subtract(origin)), sw = this.layerPointToContainerPoint(this.project(bounds.getSouthWest())._subtract(origin)), se = this.layerPointToContainerPoint(this.project(bounds.getSouthEast())._subtract(origin));
      return new L.Bounds([
        new L.Point(Math.min(nw.x, ne.x, se.x, sw.x), Math.min(nw.y, ne.y, se.y, sw.y)),
        // [ minX, minY ]
        new L.Point(Math.max(nw.x, ne.x, se.x, sw.x), Math.max(nw.y, ne.y, se.y, sw.y))
        // [ maxX, maxY ]
      ]);
    },
    /**
     * Return the geographic bounds of the current viewport, accounting for rotation and pitch.
     * 
     * The result is the smallest geographic bounds containing all four viewport corners.
     * 
     * @returns {L.LatLngBounds} Geographic bounds visible in the map viewport.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    getBounds() {
      if (!this._rotate) {
        return mapProto.getBounds.apply(this, arguments);
      }
      const size = this.getSize();
      return new L.LatLngBounds([
        this.containerPointToLatLng([0, 0]),
        // topleft
        this.containerPointToLatLng([size.x, 0]),
        // topright 
        this.containerPointToLatLng([size.x, size.y]),
        // bottomright
        this.containerPointToLatLng([0, size.y])
        // bottomleft
      ]);
    },
    /**
     * Returns the bounds of the current map view in projected pixel
     * coordinates (sometimes useful in layer and overlay implementations).
     * 
     * @TODO find out if map bounds calculated by `L.Map::getPixelBounds()`
     *       function should match the `rotatePane` or `norotatePane` bounds
     *
     * @see https://github.com/fnicollet/Leaflet/issues/7
     * 
     * @returns {L.Bounds}
     */
    // getPixelBounds(center, zoom) {
    //     // const topLeftPoint = map.containerPointToLayerPoint(this._getTopLeftPoint());
    //     const topLeftPoint = this._getTopLeftPoint(center, zoom);
    //       return new L.Bounds(topLeftPoint, topLeftPoint.add(this.getSize()));
    // },
    /**
     * Set the map bearing, optionally animating to the new value.
     * 
     * @param {number} theta Target bearing in degrees; normalized to [0, 360).
     * @param {Object} [options] Animation options.
     * @param {boolean} [options.animate=false] Animate the change.
     * @param {number} [options.duration=0.25] Animation duration in seconds.
     * @param {number} [options.easeLinearity=0.5] Easing curve linearity.
     * 
     * @returns {void}
     * 
     * @fires L.Map#rotate
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    setBearing(theta, options) {
      if (!this._rotate) {
        return;
      }
      if (options && options.animate) {
        this._bearingAnimationId = (this._bearingAnimationId || 0) + 1;
        const animationId = this._bearingAnimationId;
        if (this._bearingAnimationFrame) {
          cancelAnimationFrame(this._bearingAnimationFrame);
        }
        const startBearing = this.getBearing(), endBearing = L.Util.wrapNum(theta, [0, 360]), delta = (endBearing - startBearing + 540) % 360 - 180, duration = Math.max(0, options.duration == null ? 0.25 : options.duration) * 1e3, easeLinearity = Math.max(options.easeLinearity || 0.5, 0.2), startTime = performance.now();
        const animate = function() {
          if (!this._mapPane) {
            delete this._bearingAnimationFrame;
            return;
          }
          const progress = duration ? Math.min((performance.now() - startTime) / duration, 1) : 1, eased = 1 - Math.pow(1 - progress, 1 / easeLinearity);
          this._setBearing(progress === 1 ? endBearing : startBearing + delta * eased);
          if (this._bearingAnimationId !== animationId) {
            return;
          }
          if (progress < 1) {
            this._bearingAnimationFrame = requestAnimationFrame(animate.bind(this));
          } else {
            delete this._bearingAnimationFrame;
          }
        };
        this._bearingAnimationFrame = requestAnimationFrame(animate.bind(this));
        return;
      }
      this._bearingAnimationId = (this._bearingAnimationId || 0) + 1;
      if (this._bearingAnimationFrame) {
        cancelAnimationFrame(this._bearingAnimationFrame);
        delete this._bearingAnimationFrame;
      }
      this._setBearing(theta);
    },
    /**
     * Apply a bearing immediately and update the rotated pane and map coordinates.
     * 
     * @param {number} theta Bearing in degrees.
     * @param {L.LatLng} [mapCenter] Center to preserve while applying the change.
     * 
     * @fires L.Map#rotate
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _setBearing(theta, mapCenter) {
      if (!mapCenter && this._loaded) {
        mapCenter = this.getCenter();
      }
      const bearing = L.Util.wrapNum(theta, [0, 360]) * (Math.PI / 180), center = this._getPixelCenter(), oldPos = this._getRotatePanePos().rotateFrom(-this._bearing, center), newPos = oldPos.rotateFrom(bearing, center);
      this._pivot = center;
      this._bearing = bearing;
      this._rotatePanePos = newPos;
      if (this._pitch) {
        this._rotatePane._leaflet_pos = oldPos;
        this._updatePitchTransform();
      } else {
        L.DomUtil.setPosition(this._rotatePane, oldPos, bearing, center);
      }
      if (mapCenter) {
        this._pixelOrigin = this.project(mapCenter, this._zoom).subtract(this.containerPointToLayerPoint(this.getSize().divideBy(2)));
        delete this._lastCenter;
        this.fire("move");
      }
      this.fire("rotate");
    },
    /**
     * Transform a point with a projective matrix, accepting DOMMatrix or its 2D inverse.
     * 
     * @param {L.Point|number[]} point Input pixel coordinate.
     * @param {DOMMatrix|Object} matrix Forward or inverse transformation matrix.
     * 
     * @returns {L.Point} Transformed pixel coordinate.
     * 
     * @since leaflet-rotate (0.5.0)
     */
    _transformPitchPoint(point, matrix) {
      point = toPoint(point);
      if (!(matrix instanceof DOMMatrix)) {
        const denominator = matrix.g * point.x + matrix.h * point.y + matrix.i;
        return new L.Point(
          (matrix.a * point.x + matrix.b * point.y + matrix.c) / denominator,
          (matrix.d * point.x + matrix.e * point.y + matrix.f) / denominator
        );
      }
      const transformed = new DOMPoint(point.x, point.y).matrixTransform(matrix);
      return new L.Point(transformed.x / transformed.w, transformed.y / transformed.w);
    },
    /**
     * Apply the current pitch/bearing CSS transform and cache its forward and inverse matrices.
     * 
     * @since leaflet-rotate (0.5.0)
     */
    _updatePitchTransform() {
      if (!this._pitch || !this._rotatePane) {
        return;
      }
      const pivot = this._getPixelCenter(), size = this.getSize(), perspective = Math.max(1, size.y * 1.5), position = this._rotatePane._leaflet_pos || new L.Point(0, 0), transform = `translate3d(${pivot.x}px,${pivot.y}px,0) perspective(${perspective}px) rotateX(${this.getPitch()}deg) rotateZ(${this.getBearing()}deg) translate3d(${position.x - pivot.x}px,${position.y - pivot.y}px,0)`;
      this._rotatePane.style.transformOrigin = "0 0";
      this._rotatePane.style.transform = transform;
      const matrix = this._pitchTransform = new DOMMatrix(getComputedStyle(this._rotatePane).transform), a = matrix.m11, b = matrix.m21, c = matrix.m41, d = matrix.m12, e = matrix.m22, f = matrix.m42, g = matrix.m14, h = matrix.m24, i = matrix.m44, determinant = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
      this._pitchInverseTransform = {
        a: (e * i - f * h) / determinant,
        b: (c * h - b * i) / determinant,
        c: (b * f - c * e) / determinant,
        d: (f * g - d * i) / determinant,
        e: (a * i - c * g) / determinant,
        f: (c * d - a * f) / determinant,
        g: (d * h - e * g) / determinant,
        h: (b * g - a * h) / determinant,
        i: (a * e - b * d) / determinant
      };
    },
    /**
     * Set the map pitch in degrees. Values are clamped to the range 0–85.
     *
     * @param {number} pitch Pitch angle in degrees; clamped to [0, 85].
     * 
     * @returns {L.Map} This map instance.
     * 
     * @fires L.Map#pitch
     * 
     * @since leaflet-rotate (0.5.0)
     */
    setPitch(pitch) {
      this._setPitchAndBearing(pitch, this.getBearing());
      return this;
    },
    /**
     * Update pitch and bearing together, preserving the current map center.
     * Used by the Ctrl+drag handler to avoid applying two separate transforms.
     * 
     * @param {number} pitch Pitch angle in degrees.
     * @param {number} bearing Bearing angle in degrees.
     * 
     * @fires L.Map#pitch
     * @fires L.Map#rotate
     * 
     * @since leaflet-rotate (0.5.0)
     */
    _setPitchAndBearing(pitch, bearing) {
      if (!this._rotate) {
        return;
      }
      const clampedPitch = Math.max(0, Math.min(pitch, 85)) * (Math.PI / 180), clampedBearing = L.Util.wrapNum(bearing, [0, 360]) * (Math.PI / 180), pitchChanged = clampedPitch !== this._pitch;
      if (!pitchChanged && clampedBearing === this._bearing) {
        return;
      }
      const mapCenter = this._loaded ? this.getCenter() : void 0;
      if (pitchChanged) {
        this._pitch = clampedPitch;
        this._rotatePane.style.transformOrigin = L.version.startsWith("2.") ? "0 0" : "";
      }
      this._setBearing(bearing, mapCenter);
      if (pitchChanged) {
        this.fire("pitch");
      }
    },
    /**
     * Get the current map pitch in degrees.
     * 
     * @returns {number} Pitch angle in degrees.
     * 
     * @since leaflet-rotate (0.5.0)
     */
    getPitch() {
      return (this._pitch || 0) * (180 / Math.PI);
    },
    /**
     * Get the current map bearing. Enable the `rotate` map option before calling.
     * 
     * @returns {number} Bearing in degrees, normalized to [0, 360).
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    getBearing() {
      return this._bearing * (180 / Math.PI);
    },
    /**
     * Creates a new [map pane](#map-pane) with the given name if it doesn't
     * exist already, then returns it. The pane is created as a child of
     * `container`, or as a child of the main map pane if not set.
     * 
     * @param {String} name leaflet pane
     * @param {HTMLElement} [container] parent element
     * 
     * @returns {HTMLElement} pane container
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    // createPane(name, container) {
    //     if (!this._rotate || name == 'mapPane') {
    //         return mapProto.createPane.apply(this, arguments);
    //     }
    //     // init "rotatePane"
    //     if (!this._rotatePane) {
    //         // this._pivot = this.getSize().divideBy(2);
    //         this._rotatePane = mapProto.createPane.call(this, 'rotatePane', this._mapPane);
    //         L.DomUtil.setPosition(this._rotatePane, new L.Point(0, 0), this._bearing, this._pivot);
    //     }
    //     return mapProto.createPane.call(this, name, container || this._rotatePane);
    // },
    /**
     * Panes are DOM elements used to control the ordering of layers on
     * the map. You can access panes with [`map.getPane`](#map-getpane)
     * or [`map.getPanes`](#map-getpanes) methods. New panes can be created
     * with the [`map.createPane`](#map-createpane) method.
     * 
     * Every map has the following default panes that differ only in zIndex:
     * 
     * - mapPane     [HTMLElement = 'auto'] - Pane that contains all other map panes
     * - tilePane    [HTMLElement = 2]      - Pane for tile layers
     * - overlayPane [HTMLElement = 4]      - Pane for overlays like polylines and polygons
     * - shadowPane  [HTMLElement = 5]      - Pane for overlay shadows (e.g. marker shadows)
     * - markerPane  [HTMLElement = 6]      - Pane for marker icons
     * - tooltipPane [HTMLElement = 650]    - Pane for tooltips.
     * - popupPane   [HTMLElement = 700]    - Pane for popups.
     */
    /**
     * Create the map's panes, placing tile/vector layers in the transformed pane
     * and markers/overlays in the pane that remains upright.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _initPanes() {
      const panes = this._panes = {};
      this._paneRenderers = {};
      this._mapPane = this.createPane("mapPane", this._container);
      L.DomUtil.setPosition(this._mapPane, new L.Point(0, 0));
      if (this._rotate) {
        this._rotatePane = this.createPane("rotatePane", this._mapPane);
        this._norotatePane = this.createPane("norotatePane", this._mapPane);
        if (L.version.startsWith("2.")) {
          this._rotatePane.style.transformOrigin = "0 0";
        }
        this.createPane("tilePane", this._rotatePane);
        this.createPane("overlayPane", this._rotatePane);
        this.createPane("shadowPane", this._norotatePane);
        this.createPane("markerPane", this._norotatePane);
        this.createPane("tooltipPane", this._norotatePane);
        this.createPane("popupPane", this._norotatePane);
      } else {
        this.createPane("tilePane");
        this.createPane("overlayPane");
        this.createPane("shadowPane");
        this.createPane("markerPane");
        this.createPane("tooltipPane");
        this.createPane("popupPane");
      }
      if (!this.options.markerZoomAnimation) {
        panes.markerPane.classList.add("leaflet-zoom-hide");
        panes.shadowPane.classList.add("leaflet-zoom-hide");
      }
    },
    /**
     * Pans the map the minimum amount to make the `latlng` visible. Use
     * padding options to fit the display to more restricted bounds.
     * If `latlng` is already within the (optionally padded) display bounds,
     * the map will not be panned.
     * 
     * @see https://github.com/Raruto/leaflet-rotate/issues/18
     * 
     * @param {L.LatLng} latlng Geographic point to keep visible.
     * @param {Object} [options={}] Padding options (`padding`, `paddingTopLeft`, `paddingBottomRight`).
     * 
     * @returns {L.Map} current map instance
     * 
     * @since leaflet-rotate (v0.1.4)
     */
    panInside(latlng, options) {
      if (!this._rotate || !this._pitch && Math.abs(this._bearing).toFixed(1) < 0.1) {
        return mapProto.panInside.apply(this, arguments);
      }
      options = options || {};
      const paddingTL = toPoint(options.paddingTopLeft || options.padding || [0, 0]), paddingBR = toPoint(options.paddingBottomRight || options.padding || [0, 0]), pixelPoint = this.latLngToContainerPoint(latlng), pixelBounds = new L.Bounds([new L.Point(0, 0), this.getSize()]), pixelCenter = pixelBounds.getCenter(), paddedBounds = new L.Bounds([pixelBounds.min.add(paddingTL), pixelBounds.max.subtract(paddingBR)]), paddedSize = paddedBounds.getSize();
      if (!paddedBounds.contains(pixelPoint)) {
        this._enforcingBounds = true;
        const centerOffset = pixelPoint.subtract(paddedBounds.getCenter());
        const offset = paddedBounds.extend(pixelPoint).getSize().subtract(paddedSize);
        pixelCenter.x += centerOffset.x < 0 ? -offset.x : offset.x;
        pixelCenter.y += centerOffset.y < 0 ? -offset.y : offset.y;
        this.panTo(this.containerPointToLatLng(pixelCenter), options);
        this._enforcingBounds = false;
      }
      return this;
    },
    /**
     * Pans the map to the closest view that would lie inside the given bounds
     * (if it's not already), controlling the animation using the options specific,
     * if any.
     * 
     * @TODO check if map bounds calculated by `L.Map::panInsideBounds()`
     *       function should match the `rotatePane` or `norotatePane` bounds
     *
     * @see https://github.com/fnicollet/Leaflet/issues/7
     * 
     * @param {L.LatLngBounds} bounds Geographic bounds to fit inside the viewport.
     * @param {Object} [options] Pan animation options.
     * 
     * @returns {L.Map} This map instance.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    // panInsideBounds(bounds, options) {
    //     this._enforcingBounds = true;
    //     const center = this.getCenter(),
    //         newCenter = this._limitCenter(center, this._zoom, L.latLngBounds(bounds));
    //
    //     if (!center.equals(newCenter)) {
    //         this.panTo(newCenter, options);
    //     }
    //
    //     this._enforcingBounds = false;
    //     return this;
    // },
    // adjust center for view to get inside bounds
    // _limitCenter(center, zoom, bounds) {
    //
    //     if (!bounds) { return center; }
    //
    //     const centerPoint = this.project(center, zoom),
    //         viewHalf = this.getSize().divideBy(2),
    //         viewBounds = new Bounds(centerPoint.subtract(viewHalf), centerPoint.add(viewHalf)),
    //         offset = this._getBoundsOffset(viewBounds, bounds, zoom);
    //
    //     // If offset is less than a pixel, ignore.
    //     // This prevents unstable projections from getting into
    //     // an infinite loop of tiny offsets.
    //     if (Math.abs(offset.x) <= 1 && Math.abs(offset.y) <= 1) {
    //             return center;
    //     }
    //
    //     return this.unproject(centerPoint.add(offset), zoom);
    // },
    // @method flyToBounds(bounds: LatLngBounds, options?: fitBounds options): this
    // Sets the view of the map with a smooth animation like [`flyTo`](#map-flyto),
    // but takes a bounds parameter like [`fitBounds`](#map-fitbounds).
    // flyToBounds(bounds, options) {
    //     const target = this._getBoundsCenterZoom(bounds, options);
    //     return this.flyTo(target.center, target.zoom, options);
    // },
    // _getBoundsCenterZoom(bounds, options) {
    //
    //     options = options || {};
    //     bounds = bounds.getBounds ? bounds.getBounds() : toLatLngBounds(bounds);
    //
    //     const paddingTL = L.point(options.paddingTopLeft || options.padding || [0, 0]),
    //           paddingBR = L.point(options.paddingBottomRight || options.padding || [0, 0]);
    //
    //     let zoom = this.getBoundsZoom(bounds, false, paddingTL.add(paddingBR));
    //
    //     zoom = (typeof options.maxZoom === 'number') ? Math.min(options.maxZoom, zoom) : zoom;
    //
    //     if (zoom === Infinity) {
    //         return { center: bounds.getCenter(), zoom };
    //     }
    //
    //     return { center, zoom };
    //
    // },
    /**
     * Returns the maximum zoom level on which the given bounds fit to the map
     * view in its entirety. If `inside` (optional) is set to `true`, the method
     * instead returns the minimum zoom level on which the map view fits into
     * the given bounds in its entirety.
     * 
     * @param {L.LatLngBounds} bounds Geographic bounds to fit.
     * @param {boolean} [inside=false] Fit the viewport inside bounds instead of bounds inside the viewport.
     * @param {L.Point|number[]} [padding=[0,0]] Pixel padding around the viewport.
     * 
     * @returns {number} Zoom level satisfying the fit.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    getBoundsZoom(bounds, inside, padding) {
      if (!this._rotate || !this._pitch && Math.abs(this._bearing).toFixed(1) < 0.1) {
        return mapProto.getBoundsZoom.apply(this, arguments);
      }
      bounds = bounds instanceof L.LatLngBounds ? bounds : new L.LatLngBounds(bounds);
      padding = toPoint(padding || [0, 0]);
      let zoom = this.getZoom() || 0;
      const min = this.getMinZoom(), max = this.getMaxZoom(), size = this.getSize().subtract(padding), boundsSize = this.mapBoundsToContainerBounds(bounds).getSize(), snap = this.options.zoomSnap, scalex = size.x / boundsSize.x, scaley = size.y / boundsSize.y, scale = inside ? Math.max(scalex, scaley) : Math.min(scalex, scaley);
      zoom = this.getScaleZoom(scale, zoom);
      if (snap) {
        zoom = Math.round(zoom / (snap / 100)) * (snap / 100);
        zoom = inside ? Math.ceil(zoom / snap) * snap : Math.floor(zoom / snap) * snap;
      }
      return Math.max(min, Math.min(max, zoom));
    },
    /**
     * Layer point of the current center
     * 
     * @returns {L.Point} layer center
     */
    // _getCenterLayerPoint() {
    //    return this.containerPointToLayerPoint(this.getSize()._divideBy(2));
    // },
    /**
     * Return the pixel offset from the current center to the given geographic point.
     * 
     * @param {L.LatLng} latlng Geographic point.
     * 
     * @returns {L.Point} Offset in layer pixels, adjusted for bearing and pitch.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _getCenterOffset(latlng) {
      let centerOffset = mapProto._getCenterOffset.apply(this, arguments);
      if (this._pitch) {
        const center = this.getSize()._divideBy(2);
        centerOffset = this.containerPointToLayerPoint(center.add(centerOffset)).subtract(this.containerPointToLayerPoint(center));
      } else if (this._rotate) {
        centerOffset = centerOffset.rotate(this._bearing);
      }
      return centerOffset;
    },
    /**
     * Return the current position of the rotated pane.
     * 
     * @returns {L.Point} Rotated-pane position in map-pane coordinates.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _getRotatePanePos() {
      return this._rotatePanePos || new L.Point(0, 0);
    },
    // _latLngToNewLayerPoint(latlng, zoom, center) {
    //    const topLeft = this._getNewPixelOrigin(center, zoom);
    //    return this.project(latlng, zoom)._subtract(topLeft);
    //},
    /**
     * Calculate the pixel origin for a target view while preserving bearing-aware alignment.
     * 
     * @param {L.LatLng} center Target center.
     * @param {number} zoom Target zoom level.
     * 
     * @returns {L.Point} New pixel origin.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _getNewPixelOrigin(center, zoom) {
      if (!this._rotate || L.version.startsWith("2.")) {
        return mapProto._getNewPixelOrigin.apply(this, arguments);
      }
      const viewHalf = this.getSize()._divideBy(2);
      return this.project(center, zoom).rotate(this._bearing)._subtract(viewHalf)._add(this._getMapPanePos())._add(this._getRotatePanePos()).rotate(-this._bearing)._round();
    },
    /**
     * Calculate the pixel bounds needed to cover the transformed viewport.
     * 
     * @param {L.LatLng} [center=this.getCenter()] Target center.
     * @param {number} [zoom=this.getZoom()] Target zoom level.
     * 
     * @returns {L.Bounds} Pixel bounds in projected map coordinates.
     * 
     * @since leaflet-rotate (v0.2.0)
     * 
     * @see src\layer\tile\GridLayer::_getTiledPixelBounds()
     */
    _getNewPixelBounds(center, zoom) {
      center = center || this.getCenter();
      zoom = zoom || this.getZoom();
      if (!this._rotate && mapProto._getNewPixelBounds) {
        return mapProto._getNewPixelBounds.apply(this, arguments);
      }
      const mapZoom = this._animatingZoom ? Math.max(this._animateToZoom, this.getZoom()) : this.getZoom(), scale = this.getZoomScale(mapZoom, zoom), pixelCenter = this.project(center, zoom).floor(), size = this.getSize(), halfSize = new L.Bounds([
        this.containerPointToLayerPoint([0, 0]).floor(),
        this.containerPointToLayerPoint([size.x, 0]).floor(),
        this.containerPointToLayerPoint([0, size.y]).floor(),
        this.containerPointToLayerPoint([size.x, size.y]).floor()
      ]).getSize().divideBy(scale * 2);
      return new L.Bounds(pixelCenter.subtract(halfSize), pixelCenter.add(halfSize));
    },
    /**
     * @since leaflet-rotate (v0.2.0)
     * 
     * @returns {L.Point} Map pivot point in pixel coordinates.
     */
    _getPixelCenter() {
      if (!this._rotate && mapProto._getPixelCenter) {
        return mapProto._getPixelCenter.apply(this, arguments);
      }
      return this.getSize()._divideBy(2)._subtract(this._getMapPanePos());
    },
    /**
     * @see src\layer\vector\Renderer::_update()
     * 
     * @param {number} padding Bounds padding as a fraction of map size.
     * 
     * @returns {L.Bounds} Padded bounds in layer-point coordinates.
     * 
     * @since leaflet-rotate (v0.2.0)
     */
    _getPaddedPixelBounds(padding) {
      if (!this._rotate && mapProto._getPaddedPixelBounds) {
        return mapProto._getPaddedPixelBounds.apply(this, arguments);
      }
      const p = padding, size = this.getSize(), padMin = size.multiplyBy(-p), padMax = size.multiplyBy(1 + p);
      return new L.Bounds([
        this.containerPointToLayerPoint([padMin.x, padMin.y]).floor(),
        this.containerPointToLayerPoint([padMin.x, padMax.y]).floor(),
        this.containerPointToLayerPoint([padMax.x, padMin.y]).floor(),
        this.containerPointToLayerPoint([padMax.x, padMax.y]).floor()
      ]);
    },
    /**
     * Build and fire Leaflet's location-found event, including the device heading.
     * 
     * @param {GeolocationPosition} pos Browser geolocation result.
     * 
     * @fires L.Map#locationfound
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _handleGeolocationResponse(pos) {
      if (!this._container._leaflet_id) {
        return;
      }
      const lat = pos.coords.latitude, lng = pos.coords.longitude, hdg = pos.coords.heading, latlng = new L.LatLng(lat, lng), bounds = latlng.toBounds(pos.coords.accuracy), options = this._locateOptions;
      if (options.setView) {
        const zoom = this.getBoundsZoom(bounds);
        this.setView(latlng, options.maxZoom ? Math.min(zoom, options.maxZoom) : zoom);
      }
      const data = {
        latlng,
        bounds,
        timestamp: pos.timestamp,
        /** @TODO use mapProto._handleGeolocationResponse */
        heading: hdg
      };
      for (const i in pos.coords) {
        if (typeof pos.coords[i] === "number") {
          data[i] = pos.coords[i];
        }
      }
      this.fire("locationfound", data);
    }
    /**
     * @see https://github.com/ronikar/Leaflet/blob/5c480ef959b947c3beed7065425a5a36c486262b/src/geo/LatLngBounds.js#L253-L264
     * 
     * @param {L.Bounds} points 
     * 
     * @returns {L.Bounds}
     */
    // toCircumscribedBounds(points) {
    //     const minX = points.reduce(function (pv, v) { return Math.min(pv, v.x); }, points[0].x),
    //         maxX = points.reduce(function (pv, v) { return Math.max(pv, v.x); }, points[0].x),
    //         minY = points.reduce(function (pv, v) { return Math.min(pv, v.y); }, points[0].y),
    //         maxY = points.reduce(function (pv, v) { return Math.max(pv, v.y); }, points[0].y);
    //
    //     return L.bounds(L.point(minX, minY), L.point(maxX, maxY));
    // },
  });

  // node_modules/leaflet-rotate/src/map/handler/CompassBearing.js
  L.Map.CompassBearing = L.Handler.extend({
    /**
     * @param {L.Map} map Map whose bearing follows device orientation.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    initialize(map) {
      this._map = map;
      if ("ondeviceorientationabsolute" in window) {
        this.__deviceOrientationEvent = "deviceorientationabsolute";
      } else if ("ondeviceorientation" in window) {
        this.__deviceOrientationEvent = "deviceorientation";
      }
      this._throttled = L.Util.throttle(this._onDeviceOrientation, 100, this);
    },
    /**
     * Subscribe to the supported device-orientation event, if available.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    addHooks() {
      if (this._map._rotate && this.__deviceOrientationEvent) {
        L.DomEvent.on(window, this.__deviceOrientationEvent, this._throttled, this);
      } else {
        this.disable();
      }
    },
    /**
     * Unsubscribe from device orientation when the handler is disabled.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    removeHooks() {
      if (this._map._rotate && this.__deviceOrientationEvent) {
        L.DomEvent.off(window, this.__deviceOrientationEvent, this._throttled, this);
      }
    },
    /**
     * Apply a device orientation reading to the map bearing.
     *
     * `DeviceOrientationEvent.absolute` - Indicates whether the device is providing absolute
     *                                     orientation values (relatives to Magnetic North) or
     *                                     using some arbitrary frame determined by the device.
     * 
     * `DeviceOrientationEvent.alpha`    - Returns the rotation of the device around the Z axis;
     *                                     that is, the number of degrees by which the device is
     *                                     being twisted around the center of the screen.
     * 
     * `window.orientation`              - Returns the screen orientation in degrees (in 90-degree increments)
     *                                     of the viewport relative to the device's natural orientation.
     *                                     Its only possible values are -90, 0, 90, and 180. Positive
     *                                     values are counterclockwise; negative values are clockwise.
     * 
     * @see https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/absolute
     * @see https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/alpha
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/orientation
     *
     * @param {DeviceOrientationEvent} e Orientation reading from the browser.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _onDeviceOrientation(e) {
      let angle = e.webkitCompassHeading != null ? e.webkitCompassHeading : e.alpha;
      let deviceOrientation = 0;
      if (!Number.isFinite(angle)) {
        return;
      }
      if (!e.absolute && e.webkitCompassHeading) {
        angle = 360 - angle;
      }
      if (!e.absolute && "undefined" !== typeof window.orientation) {
        deviceOrientation = window.orientation;
      }
      this._map.setBearing(angle - deviceOrientation);
    }
  });
  L.Map.addInitHook("addHandler", "compassBearing", L.Map.CompassBearing);

  // node_modules/leaflet-rotate/src/map/handler/ContainerMutation.js
  L.Map.mergeOptions({
    /**
     * Whether the map uses mutation observers to
     * detect changes in its container and trigger
     * `invalidateSize`. Disabled by default due to
     * support not being available in all web browsers.
     *
     * @type {Boolean}
     * 
     * @since leaflet-rotate (v0.1.0)
     * 
     * @see https://developer.mozilla.org/docs/Web/API/MutationObserver
     */
    trackContainerMutation: false
  });
  L.Map.ContainerMutation = L.Handler.extend({
    /**
     * Start observing the map container's style attribute.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    addHooks() {
      if (!this._observer) {
        this._observer = new MutationObserver(L.Util.bind(this._map.invalidateSize, this._map));
      }
      this._observer.observe(this._map.getContainer(), {
        childList: false,
        attributes: true,
        characterData: false,
        subtree: false,
        attributeFilter: ["style"]
      });
    },
    /**
     * Stop observing container mutations.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    removeHooks() {
      this._observer.disconnect();
    }
  });
  L.Map.addInitHook("addHandler", "trackContainerMutation", L.Map.ContainerMutation);

  // node_modules/leaflet-rotate/src/map/handler/TouchGestures.js
  function touchToContainerPoint(map, touch) {
    const container = map.getContainer(), rect = container.getBoundingClientRect();
    return new L.Point(
      touch.clientX - rect.left - container.clientLeft,
      touch.clientY - rect.top - container.clientTop
    );
  }
  L.Map.mergeOptions({
    /**
     * Whether pinch zoom may temporarily exceed min/max zoom and bounce back.
     * 
     * @type {Boolean}
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    bounceAtZoomLimits: true
  });
  L.Map.TouchGestures = L.Handler.extend({
    /**
     * Initialize the shared handler from the map's touch zoom/rotation options.
     * 
     * @param {L.Map} map Map whose touch gestures are handled.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    initialize(map) {
      this._map = map;
      this.rotate = !!this._map.options.touchRotate;
      this.zoom = !!this._map.options.touchZoom;
    },
    /**
     * Listen for the start of two-finger gestures on the map container.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    addHooks() {
      L.DomEvent.on(this._map._container, "touchstart", this._onTouchStart, this);
    },
    /**
     * Remove the touch-start listener.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    removeHooks() {
      L.DomEvent.off(this._map._container, "touchstart", this._onTouchStart, this);
    },
    /**
     * Record initial touch points and start tracking a two-finger gesture.
     * 
     * @param {TouchEvent} e Touch-start event.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _onTouchStart(e) {
      const map = this._map;
      if (!e.touches || e.touches.length !== 2 || map._animatingZoom || this._zooming || this._rotating) {
        return;
      }
      const p1 = touchToContainerPoint(map, e.touches[0]), p2 = touchToContainerPoint(map, e.touches[1]), vector = p1.subtract(p2);
      this._centerPoint = map.getSize()._divideBy(2);
      this._startLatLng = map.containerPointToLatLng(this._centerPoint);
      if (this.zoom) {
        if (map.options.touchZoom !== "center") {
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
        if (vector.y < 0) {
          this._startBearing += 180;
        }
        this._rotating = true;
      } else {
        this._rotating = false;
      }
      this._moved = false;
      map._stop();
      L.DomEvent.on(document, "touchmove", this._onTouchMove, this).on(document, "touchend touchcancel", this._onTouchEnd, this);
      L.DomEvent.preventDefault(e);
    },
    /**
     * Update bearing and/or zoom while the two touch points move.
     * 
     * @param {TouchEvent} e Touch-move event.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _onTouchMove(e) {
      if (!e.touches || e.touches.length !== 2 || !(this._zooming || this._rotating)) {
        return;
      }
      const map = this._map, p1 = touchToContainerPoint(map, e.touches[0]), p2 = touchToContainerPoint(map, e.touches[1]), vector = p1.subtract(p2), scale = p1.distanceTo(p2) / this._startDist;
      let delta;
      if (this._rotating) {
        const theta = Math.atan(vector.x / vector.y);
        let bearingDelta = (theta - this._startTheta) * (180 / Math.PI);
        if (vector.y < 0) {
          bearingDelta += 180;
        }
        if (bearingDelta) {
          map.setBearing(this._startBearing - bearingDelta);
        }
      }
      if (this._zooming) {
        this._zoom = map.getScaleZoom(scale, this._startZoom);
        if (!map.options.bounceAtZoomLimits && (this._zoom < map.getMinZoom() && scale < 1 || this._zoom > map.getMaxZoom() && scale > 1)) {
          this._zoom = map._limitZoom(this._zoom);
        }
        if (map.options.touchZoom === "center") {
          this._center = this._startLatLng;
          if (scale === 1) {
            return;
          }
        } else {
          delta = p1._add(p2)._divideBy(2)._subtract(this._centerPoint);
          if (scale === 1 && delta.x === 0 && delta.y === 0) {
            return;
          }
          const mapDelta = map._pitch ? map.containerPointToLayerPoint(this._centerPoint.add(delta)).subtract(map.containerPointToLayerPoint(this._centerPoint)) : delta.rotate(-map.getBearing() * (Math.PI / 180));
          this._center = map.unproject(map.project(this._pinchStartLatLng).subtract(mapDelta));
        }
      }
      if (!this._moved) {
        map._moveStart(true, false);
        this._moved = true;
      }
      const moveFn = map._move.bind(map, this._center, this._zoom, { pinch: true, round: false }, void 0);
      moveFn();
      if (this.zoom) {
        if (map.options.zoomAnimation) {
          map._animateZoomNoDelay(this._center, map._limitZoom(this._zoom));
        } else {
          map._resetView(this._center, map._limitZoom(this._zoom));
        }
      }
      L.DomEvent.preventDefault(e);
    },
    /**
     * Finish the gesture, settle the zoom and remove document listeners.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _onTouchEnd() {
      if (!this._moved || !(this._zooming || this._rotating)) {
        this._zooming = false;
        return;
      }
      this._zooming = false;
      this._rotating = false;
      L.DomEvent.off(document, "touchmove", this._onTouchMove, this).off(document, "touchend touchcancel", this._onTouchEnd, this);
      if (this.zoom) {
        if (this._map.options.zoomAnimation) {
          this._map._animateZoom(this._center, this._map._limitZoom(this._zoom), true, this._map.options.zoomSnap);
        } else {
          this._map._resetView(this._center, this._map._limitZoom(this._zoom));
        }
      }
    }
  });
  L.Map.addInitHook("addHandler", "touchGestures", L.Map.TouchGestures);

  // node_modules/leaflet-rotate/src/map/handler/TouchRotate.js
  L.Map.mergeOptions({
    /**
     * Whether the map can be rotated with a two-finger rotation gesture
     * 
     * @type {Boolean}
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    touchRotate: false
  });
  L.Map.TouchRotate = L.Handler.extend({
    /**
     * Enable rotation handling in the map's shared touch gesture handler.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    addHooks() {
      this._map.touchGestures.enable();
      this._map.touchGestures.rotate = true;
    },
    /**
     * Disable rotation handling without affecting pinch zoom.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    removeHooks() {
      this._map.touchGestures.rotate = false;
    }
  });
  L.Map.addInitHook("addHandler", "touchRotate", L.Map.TouchRotate);

  // node_modules/leaflet-rotate/src/map/handler/ShiftKeyRotate.js
  L.Map.mergeOptions({
    /**
     * Whether Shift+wheel changes the map bearing.
     * 
     * @type {Boolean}
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    shiftKeyRotate: true,
    /**
     * Whether Ctrl+drag changes bearing and pitch.
     * 
     * @type {Boolean}
     * 
     * @since leaflet-rotate (0.5.0)
     */
    pitchDrag: true
  });
  L.Map.ShiftKeyRotate = L.Handler.extend({
    /**
     * @param {L.Map} map Map controlled by this handler.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    initialize(map) {
      this._map = map;
      this._onMouseDownBound = this._onMouseDown.bind(this);
      this._onMouseMoveBound = this._onMouseMove.bind(this);
      this._onMouseUpBound = this._onMouseUp.bind(this);
    },
    /**
     * Attach enabled wheel and pointer/mouse gesture listeners.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    addHooks() {
      if (this._map.options.shiftKeyRotate) {
        L.DomEvent.on(this._map._container, "wheel", this._handleShiftScroll, this);
      }
      if (this._map.options.pitchDrag) {
        this.addPitchHooks();
      }
    },
    /**
     * Detach gesture listeners and cancel any active drag.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    removeHooks() {
      L.DomEvent.off(this._map._container, "wheel", this._handleShiftScroll, this);
      this.removePitchHooks();
    },
    /**
     * Listen for the start of Ctrl+drag pitch gestures.
     * 
     * @since leaflet-rotate (0.5.0)
     */
    addPitchHooks() {
      if (this._pitchHooksAdded) {
        return;
      }
      this._pitchEvents = L.version.startsWith("2.") ? ["pointerdown", "pointermove", "pointerup pointercancel"] : ["mousedown", "mousemove", "mouseup"];
      this._map._container.addEventListener(this._pitchEvents[0], this._onMouseDownBound, true);
      this._pitchHooksAdded = true;
    },
    /**
     * Stop listening for pitch gestures and remove active document listeners.
     * 
     * @since leaflet-rotate (0.5.0)
     */
    removePitchHooks() {
      if (!this._pitchHooksAdded) {
        return;
      }
      this._map._container.removeEventListener(this._pitchEvents[0], this._onMouseDownBound, true);
      this._onMouseUp();
      delete this._pitchEvents;
      this._pitchHooksAdded = false;
    },
    /**
     * Rotate the map in fixed increments while Shift is held during wheel input.
     * 
     * @param {WheelEvent} e Wheel event from the map container.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _handleShiftScroll(e) {
      if (e.shiftKey) {
        e.preventDefault();
        this._map.scrollWheelZoom.disable();
        this._map.setBearing(this._map.getBearing() + Math.sign(e.deltaY) * 5);
      } else {
        this._map.scrollWheelZoom.enable();
      }
    },
    /**
     * Start Ctrl+drag and capture subsequent movement outside the map.
     * 
     * @param {MouseEvent|PointerEvent} e Gesture start event.
     * 
     * @since leaflet-rotate (0.5.0)
     */
    _onMouseDown(e) {
      if (!this._map._rotate || !this._map.options.pitchDrag || !e.ctrlKey || e.button !== 0) {
        return;
      }
      const scrollWheelZoom = this._map.scrollWheelZoom;
      if (scrollWheelZoom && scrollWheelZoom._timer) {
        clearTimeout(scrollWheelZoom._timer);
        scrollWheelZoom._timer = null;
        scrollWheelZoom._delta = 0;
        scrollWheelZoom._startTime = null;
      }
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this._lastX = e.clientX;
      this._lastY = e.clientY;
      document.addEventListener(this._pitchEvents[1], this._onMouseMoveBound);
      for (const event of this._pitchEvents[2].split(" ")) {
        document.addEventListener(event, this._onMouseUpBound);
      }
    },
    /**
     * Apply pointer movement to pitch (vertical) and bearing (horizontal).
     * 
     * @param {MouseEvent|PointerEvent} e Gesture movement event.
     * 
     * @since leaflet-rotate (0.5.0)
     */
    _onMouseMove(e) {
      this._map._setPitchAndBearing(
        this._map.getPitch() + (this._lastY - e.clientY) * 0.5,
        this._map.getBearing() + (e.clientX - this._lastX) * 0.8
      );
      this._lastX = e.clientX;
      this._lastY = e.clientY;
      e.preventDefault();
    },
    /**
     * End Ctrl+drag and clear document-level listeners.
     * 
     * @since leaflet-rotate (0.5.0)
     */
    _onMouseUp() {
      if (!this._pitchEvents) {
        return;
      }
      document.removeEventListener(this._pitchEvents[1], this._onMouseMoveBound);
      for (const event of this._pitchEvents[2].split(" ")) {
        document.removeEventListener(event, this._onMouseUpBound);
      }
      delete this._lastX;
      delete this._lastY;
    }
  });
  L.Map.addInitHook(function() {
    if (this.options.shiftKeyRotate) {
      this.shiftKeyRotate = new L.Map.ShiftKeyRotate(this);
      this.shiftKeyRotate.enable();
    } else if (this.options.pitchDrag) {
      this.shiftKeyRotate = new L.Map.ShiftKeyRotate(this);
      this.shiftKeyRotate.addPitchHooks();
      this.on("unload", this.shiftKeyRotate.removePitchHooks, this.shiftKeyRotate);
    }
    if (this.scrollWheelZoom.enabled() && this.options.shiftKeyRotate) {
      this.scrollWheelZoom.disable();
      this.scrollWheelZoom.enable();
    }
  });

  // node_modules/leaflet-rotate/src/map/handler/TouchZoom.js
  L.Map.mergeOptions({
    /**
     * Whether the map can be zoomed by touch-dragging
     * with two fingers. If passed `'center'`, it will
     * zoom to the center of the view regardless of
     * where the touch events (fingers) were. Enabled
     * for touch-capable web browsers.
     * 
     * @type {(Boolean|String)}
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    touchZoom: L.Browser.touch,
    /**
     * @TODO check if this is a duplicate of `L.Map.TouchGestures::bounceAtZoomLimits`
     * 
     * Set it to false if you don't want the map to
     * zoom beyond min/max zoom and then bounce back
     * when pinch-zooming.
     * 
     * @type {Boolean}
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    bounceAtZoomLimits: false
  });
  L.Map.TouchZoom = L.Handler.extend({
    /**
     * Enable pinch zoom handling and mark the shared touch handler as active.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    addHooks() {
      this._map._container.classList.add("leaflet-touch-zoom");
      this._map.touchGestures.enable();
      this._map.touchGestures.zoom = true;
    },
    /**
     * Disable pinch zoom handling while preserving touch rotation state.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    removeHooks() {
      this._map._container.classList.remove("leaflet-touch-zoom");
      this._map.touchGestures.zoom = false;
    }
  });
  L.Map.addInitHook("addHandler", "touchZoom", L.Map.TouchZoom);

  // node_modules/leaflet-rotate/src/control/Rotate.js
  L.Control.Rotate = L.Control.extend({
    options: {
      position: "topleft",
      closeOnZeroBearing: true
    },
    /**
     * Create the control element and subscribe to map rotation.
     * 
     * @param {L.Map} map
     * 
     * @returns {HTMLElement} Control container.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    onAdd(map) {
      const container = this._container = L.DomUtil.create("div", "leaflet-control-rotate leaflet-bar");
      const arrow = this._arrow = L.DomUtil.create("span", "leaflet-control-rotate-arrow");
      arrow.style.backgroundImage = `url("data:image/svg+xml;charset=utf-8,%3Csvg width='29' height='29' viewBox='0 0 29 29' xmlns='http://www.w3.org/2000/svg' fill='%23333'%3E%3Cpath d='M10.5 14l4-8 4 8h-8z'/%3E%3Cpath d='M10.5 16l4 8 4-8h-8z' fill='%23ccc'/%3E%3C/svg%3E")`;
      arrow.style.cursor = "grab";
      arrow.style.display = "block";
      arrow.style.width = "100%";
      arrow.style.height = "100%";
      arrow.style.backgroundRepeat = "no-repeat";
      arrow.style.backgroundPosition = "50%";
      const link = this._link = L.DomUtil.create("a", "leaflet-control-rotate-toggle", container);
      link.appendChild(arrow);
      link.href = "#";
      link.title = "Rotate map";
      L.DomEvent.on(link, "dblclick", L.DomEvent.stopPropagation).on(link, "mousedown", this._handleMouseDown, this).on(link, "click", L.DomEvent.stop).on(link, "click", this._cycleState, this).on(link, "click", this._refocusOnMap, this);
      this._restyle();
      map.on("rotate", this._restyle, this);
      this._follow = false;
      this._canFollow = false;
      if (this.options.closeOnZeroBearing && map.getBearing() === 0) {
        container.style.display = "none";
      }
      return container;
    },
    /**
     * Remove the map event listener when the control is detached.
     * 
     * @param {L.Map} map
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    onRemove(map) {
      map.off("rotate", this._restyle, this);
    },
    /**
     * Begin dragging the control's bearing indicator.
     * 
     * @param {MouseEvent} e Mouse-down event.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _handleMouseDown(e) {
      L.DomEvent.stop(e);
      this.dragging = true;
      this.dragstartX = e.pageX;
      this.dragstartY = e.pageY;
      L.DomEvent.on(document, "mousemove", this._handleMouseDrag, this).on(document, "mouseup", this._handleMouseUp, this);
    },
    /**
     * End bearing-indicator dragging and remove document listeners.
     * 
     * @param {MouseEvent} e Mouse-up event.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _handleMouseUp(e) {
      L.DomEvent.stop(e);
      this.dragging = false;
      L.DomEvent.off(document, "mousemove", this._handleMouseDrag, this).off(document, "mouseup", this._handleMouseUp, this);
    },
    /**
     * Set bearing from the horizontal drag distance.
     * 
     * @param {MouseEvent} e Mouse-move event.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _handleMouseDrag(e) {
      if (!this.dragging) {
        return;
      }
      const deltaX = e.clientX - this.dragstartX;
      this._map.setBearing(deltaX);
    },
    /**
     * Cycle through touch, compass, and locked rotation modes.
     * Compass mode may require permission from the browser.
     * 
     * @param {Event} ev Control click event.
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _cycleState(ev) {
      if (!this._map) {
        return;
      }
      const map = this._map;
      if (!map.touchRotate.enabled() && !map.compassBearing.enabled()) {
        map.touchRotate.enable();
      } else if (!map.compassBearing.enabled()) {
        map.touchRotate.disable();
        (DeviceOrientationEvent && DeviceOrientationEvent.requestPermission ? DeviceOrientationEvent.requestPermission() : Promise.resolve("granted")).then((state) => "granted" === state && map.compassBearing.enable());
      } else {
        map.compassBearing.disable();
        map.setBearing(0);
        if (this.options.closeOnZeroBearing) {
          map.touchRotate.enable();
        }
      }
      this._restyle();
    },
    /**
     * Update the control icon and visibility to match the current mode.
     * 
     * @listens L.Map#rotate
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    _restyle() {
      if (!this._map.options.rotate) {
        this._link.classList.add("leaflet-disabled");
      } else {
        const map = this._map;
        const bearing = map.getBearing();
        this._arrow.style.transform = "rotate(" + bearing + "deg)";
        if (bearing && this.options.closeOnZeroBearing) {
          this._container.style.display = "block";
        }
        if (map.compassBearing.enabled()) {
          this._link.style.backgroundColor = "orange";
        } else if (map.touchRotate.enabled()) {
          this._link.style.backgroundColor = null;
        } else {
          this._link.style.backgroundColor = "grey";
          if (0 === bearing && this.options.closeOnZeroBearing) {
            this._container.style.display = "none";
          }
        }
      }
    }
  });
  if (L.control) {
    L.control.rotate = (options) => new L.Control.Rotate(options);
  }
  L.Map.mergeOptions({
    /**
     * Add the rotation control automatically. Set to `false` to disable,
     * or pass an options object to configure the control.
     * 
     * @type {boolean|Object}
     * 
     * @since leaflet-rotate (v0.1.0)
     */
    rotateControl: true
  });
  L.Map.addInitHook(function() {
    if (this.options.rotateControl) {
      const options = typeof this.options.rotateControl === "object" ? this.options.rotateControl : {};
      this.rotateControl = new L.Control.Rotate(options);
      this.addControl(this.rotateControl);
    }
  });

  // node_modules/leaflet.locatecontrol/dist/L.Control.Locate.umd.js
  init_leaflet_compat();
  (function(global2, factory) {
    false ? factory(exports, null) : false ? define(["exports", "leaflet"], factory) : (global2 = typeof globalThis !== "undefined" ? globalThis : global2 || self, factory((global2.L = global2.L || {}, global2.L.Control = global2.L.Control || {}, global2.L.Control.Locate = {}), global2.L));
  })(void 0, (function(exports2, leaflet) {
    "use strict";
    const METERS_TO_FEET = 3.2808399;
    function addClasses(el, names) {
      names.split(" ").forEach((className) => {
        el.classList.add(className);
      });
    }
    function removeClasses(el, names) {
      names.split(" ").forEach((className) => {
        el.classList.remove(className);
      });
    }
    function createElement(tag, className, parent) {
      const el = document.createElement(tag);
      if (className) el.className = className;
      parent?.append(el);
      return el;
    }
    function cloneOptions(options) {
      const cloned = {};
      for (const key in options) {
        const val = options[key];
        if (Array.isArray(val)) {
          cloned[key] = [...val];
        } else if (val?.constructor === Object) {
          cloned[key] = { ...val };
        } else {
          cloned[key] = val;
        }
      }
      return cloned;
    }
    const LocationMarker = leaflet.Marker.extend({
      initialize(latlng, options) {
        leaflet.Util.setOptions(this, options);
        this._latlng = latlng;
        this.createIcon();
      },
      /**
       * Create a styled circle location marker
       */
      createIcon() {
        const opt = this.options;
        const style = [
          ["stroke", opt.color],
          ["stroke-width", opt.weight],
          ["fill", opt.fillColor],
          ["fill-opacity", opt.fillOpacity],
          ["opacity", opt.opacity]
        ].filter(([, v]) => v !== void 0).map(([k, v]) => `${k}="${v}"`).join(" ");
        const icon = this._getIconSVG(opt, style);
        this._locationIcon = new leaflet.DivIcon({
          className: icon.className,
          html: icon.svg,
          iconSize: [icon.w, icon.h]
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
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s2}" height="${s2}" version="1.1" viewBox="-${s} -${s} ${s2} ${s2}"><circle r="${r}" ${style} /></svg>`;
        return {
          className: "leaflet-control-locate-location",
          svg,
          w: s2,
          h: s2
        };
      },
      setStyle(style) {
        leaflet.Util.setOptions(this, style);
        this.createIcon();
      }
    });
    const CompassMarker = LocationMarker.extend({
      initialize(latlng, heading, options) {
        leaflet.Util.setOptions(this, options);
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
        const s = r + options.weight + options.depth;
        const s2 = s * 2;
        const path = this._arrowPoints(r, options.width, options.depth, this._heading);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s2}" height="${s2}" version="1.1" viewBox="-${s} -${s} ${s2} ${s2}"><path d="${path}" ${style} /></svg>`;
        return {
          className: "leaflet-control-locate-heading",
          svg,
          w: s2,
          h: s2
        };
      },
      _arrowPoints(radius, width, depth, heading) {
        const \u03C6 = (heading - 90) * Math.PI / 180;
        const ux = Math.cos(\u03C6);
        const uy = Math.sin(\u03C6);
        const vx = -Math.sin(\u03C6);
        const vy = Math.cos(\u03C6);
        const h = width / 2;
        const Cx = radius * ux;
        const Cy = radius * uy;
        const B1x = Cx + h * vx;
        const B1y = Cy + h * vy;
        const B2x = Cx - h * vx;
        const B2y = Cy - h * vy;
        const Tx = Cx + depth * ux;
        const Ty = Cy + depth * uy;
        return `M ${B1x},${B1y} L ${B2x},${B2y} L ${Tx},${Ty} Z`;
      }
    });
    const LocateControl = leaflet.Control.extend({
      options: {
        /** Position of the control */
        position: "topleft",
        /** The layer that the user's location should be drawn on. By default creates a new layer. */
        layer: void 0,
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
        setView: "untilPanOrZoom",
        /**
         * Keep the current map zoom level when setting the view and only pan.
         * Can be set to:
         * - `true`: Always keep current zoom level
         * - `false`: Allow zooming (default)
         * - `[minZoom, maxZoom]`: Keep zoom only when current zoom is within the specified range
         */
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
          inView: "stop",
          /** What should happen if the user clicks on the control while the location is outside the current view. */
          outOfView: "setView",
          /**
           * What should happen if the user clicks on the control while the location is within the current view
           * and we could be following but are not. Defaults to a special value which inherits from 'inView';
           */
          inViewNotFollowing: "inView"
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
        /**
         * iOS-only compass accuracy threshold (degrees).
         * Show compass only when `webkitCompassAccuracy <= value`.
         * `-1` (uncalibrated) is always rejected.
         * Set to `false` to disable filtering. No effect on Android.
         */
        compassAccuracyThreshold: 45,
        /** The class to be used to create the marker. For example L.CircleMarker or L.Marker */
        markerClass: LocationMarker,
        /** The class us be used to create the compass bearing arrow */
        compassClass: CompassMarker,
        /** Accuracy circle style properties. NOTE these styles should match the css animations styles */
        circleStyle: {
          className: "leaflet-control-locate-circle",
          color: "#136AEC",
          fillColor: "#136AEC",
          fillOpacity: 0.15,
          weight: 0
        },
        /** Inner marker style properties. Only works if your marker class supports `setStyle`. */
        markerStyle: {
          className: "leaflet-control-locate-marker",
          color: "#fff",
          fillColor: "#2A93EE",
          fillOpacity: 1,
          weight: 3,
          opacity: 1,
          radius: 9
        },
        /** Compass */
        compassStyle: {
          fillColor: "#2A93EE",
          fillOpacity: 1,
          weight: 0,
          color: "#fff",
          opacity: 1,
          radius: 9,
          // How far is the arrow from the center of the marker
          width: 9,
          // Width of the arrow
          depth: 6
          // Length of the arrow
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
        icon: "leaflet-control-locate-location-arrow",
        iconLoading: "leaflet-control-locate-spinner",
        /** The element to be created for icons. For example span or i */
        iconElementTag: "span",
        /** The element to be created for the text. For example small or span */
        textElementTag: "small",
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
          const link = createElement("a", "leaflet-bar-part leaflet-bar-part-single", container);
          link.title = options.strings.title;
          link.href = "#";
          link.setAttribute("role", "button");
          link.setAttribute("aria-label", options.strings.title);
          const icon = createElement(options.iconElementTag, options.icon, link);
          icon.classList.add("leaflet-locate-icon");
          if (options.strings.text !== void 0) {
            const text = createElement(options.textElementTag, "leaflet-locate-text", link);
            text.textContent = options.strings.text;
            link.classList.add("leaflet-locate-text-active");
            link.parentNode.style.display = "flex";
          }
          return { link, icon };
        },
        /** This event is called in case of any location error that is not a time out error. */
        onLocationError(err) {
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
          watch: true,
          // if you overwrite this, visualization cannot be updated
          setView: false
          // have to set this to false because we have to
          // do setView manually
        }
      },
      initialize(options = {}) {
        this.options = cloneOptions(this.options);
        for (const key in options) {
          const userVal = options[key];
          const defaultVal = this.options[key];
          if (userVal?.constructor === Object && defaultVal?.constructor === Object) {
            Object.assign(defaultVal, userVal);
          } else {
            this.options[key] = userVal;
          }
        }
        this.options.followMarkerStyle = { ...this.options.markerStyle, ...this.options.followMarkerStyle };
        this.options.followCircleStyle = { ...this.options.circleStyle, ...this.options.followCircleStyle };
        this.options.followCompassStyle = { ...this.options.compassStyle, ...this.options.followCompassStyle };
      },
      /**
       * Add control to map. Returns the container for the control.
       */
      onAdd(map) {
        const container = createElement("div", "leaflet-control-locate leaflet-bar leaflet-control");
        this._container = container;
        this._map = map;
        this._layer = this.options.layer || new leaflet.LayerGroup();
        this._layer.addTo(map);
        this._event = void 0;
        this._compassHeading = null;
        this._prevBounds = null;
        const linkAndIcon = this.options.createButtonCallback(container, this.options);
        this._link = linkAndIcon.link;
        this._icon = linkAndIcon.icon;
        this._linkClickHandler = (ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          this._onClick();
        };
        this._linkDblClickHandler = (ev) => ev.stopPropagation();
        this._link.addEventListener("click", this._linkClickHandler);
        this._link.addEventListener("dblclick", this._linkDblClickHandler);
        this._resetVariables();
        this._map.on("unload", this._unload, this);
        return container;
      },
      /**
       * Called when control is removed from the map.
       */
      onRemove() {
        if (this._link && this._linkClickHandler) {
          this._link.removeEventListener("click", this._linkClickHandler);
        }
        if (this._link && this._linkDblClickHandler) {
          this._link.removeEventListener("dblclick", this._linkDblClickHandler);
        }
        if (this._map) {
          this._map.off("unload", this._unload, this);
        }
        this._linkClickHandler = null;
        this._linkDblClickHandler = null;
        this.stop();
      },
      /**
       * This method is called when the user clicks on the control.
       */
      _onClick() {
        this._justClicked = true;
        const wasFollowing = this._isFollowing();
        this._userPanned = false;
        this._userZoomed = false;
        if (this._active && !this._event) {
          this.stop();
        } else if (this._active) {
          const behaviors = this.options.clickBehavior;
          let behavior = behaviors.outOfView;
          if (this._map.getBounds().contains(this._event.latlng)) {
            behavior = wasFollowing ? behaviors.inView : behaviors.inViewNotFollowing;
          }
          if (behaviors[behavior]) {
            behavior = behaviors[behavior];
          }
          switch (behavior) {
            case "setView":
              this.setView();
              break;
            case "stop":
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
        if (this._active || !this._map) {
          return;
        }
        this._map.locate(this.options.locateOptions);
        this._map.fire("locateactivate", this);
        this._active = true;
        this._map.on("locationfound", this._onLocationFound, this);
        this._map.on("locationerror", this._onLocationError, this);
        this._map.on("dragstart", this._onDrag, this);
        this._map.on("zoomstart", this._onZoom, this);
        this._map.on("zoomend", this._onZoomEnd, this);
        this._activateCompass();
      },
      /**
       * Request DeviceOrientation permission (if needed) and bind compass events.
       * Fails gracefully — geolocation continues without compass.
       */
      async _activateCompass() {
        if (!this.options.showCompass) {
          return;
        }
        const oriAbs = "ondeviceorientationabsolute" in window;
        if (!oriAbs && !("ondeviceorientation" in window)) {
          return;
        }
        const eventName = oriAbs ? "deviceorientationabsolute" : "deviceorientation";
        const deviceOrientationEvent = window.DeviceOrientationEvent;
        if (typeof deviceOrientationEvent !== "undefined" && typeof deviceOrientationEvent.requestPermission === "function") {
          try {
            const permissionState = await deviceOrientationEvent.requestPermission();
            if (permissionState !== "granted") {
              return;
            }
          } catch (err) {
            console.warn("DeviceOrientation permission denied or unavailable:", err);
            return;
          }
        }
        if (!this._active) {
          return;
        }
        this._compassEventName = eventName;
        leaflet.DomEvent.on(window, eventName, this._onDeviceOrientation, this);
      },
      /**
       * Called to stop the location engine.
       *
       * Override it to shutdown any functionalities you added on start.
       */
      _deactivate() {
        if (!this._active || !this._map) {
          return;
        }
        this._map.stopLocate();
        this._map.fire("locatedeactivate", this);
        this._active = false;
        if (!this.options.cacheLocation) {
          this._event = void 0;
        }
        this._map.off("locationfound", this._onLocationFound, this);
        this._map.off("locationerror", this._onLocationError, this);
        this._map.off("dragstart", this._onDrag, this);
        this._map.off("zoomstart", this._onZoom, this);
        this._map.off("zoomend", this._onZoomEnd, this);
        this._deactivateCompass();
      },
      /**
       * Remove compass event listener and reset compass heading state.
       * Symmetric counterpart to _activateCompass().
       */
      _deactivateCompass() {
        if (!this._compassEventName) {
          return;
        }
        this._compassHeading = null;
        leaflet.DomEvent.off(window, this._compassEventName, this._onDeviceOrientation, this);
        this._compassEventName = null;
      },
      /**
       * Check if the current zoom level should be kept based on keepCurrentZoomLevel option.
       * @returns {boolean} true if zoom should be kept, false otherwise
       */
      _shouldKeepCurrentZoom() {
        const option = this.options.keepCurrentZoomLevel;
        if (Array.isArray(option) && option.length === 2) {
          const currentZoom = this._map.getZoom();
          const [minZoom, maxZoom] = option;
          return currentZoom >= minZoom && currentZoom <= maxZoom;
        }
        return option === true;
      },
      /**
       * Pan and/or zoom the map to the current location.
       * Respects keepCurrentZoomLevel and initialZoomLevel options.
       */
      setView() {
        this._drawMarker();
        if (this._isOutsideMapBounds()) {
          this._event = void 0;
          this.options.onLocationOutsideMapBounds(this);
          return;
        }
        const { latlng } = this._event;
        const fly = this.options.flyTo;
        let method, args;
        if (this._justClicked && this.options.initialZoomLevel !== false) {
          method = fly ? "flyTo" : "setView";
          args = [latlng, this.options.initialZoomLevel];
        } else if (this._shouldKeepCurrentZoom()) {
          method = fly ? "flyTo" : "panTo";
          args = [latlng];
        } else {
          method = fly ? "flyToBounds" : "fitBounds";
          args = [
            this.options.getLocationBounds(this._event),
            {
              padding: this.options.circlePadding,
              maxZoom: this.options.locateOptions.maxZoom
            }
          ];
        }
        this._setViewIgnoringEvents(method, args);
      },
      /**
       * Execute a map view method while ignoring zoom/pan events to prevent breaking following mode.
       * @param {string} method - The map method name to call ('flyTo', 'setView', 'panTo', 'fitBounds', 'flyToBounds')
       * @param {Array} args - Arguments to pass to the method
       */
      _setViewIgnoringEvents(method, args) {
        this._ignoreEvent = true;
        this._map[method](...args);
        requestAnimationFrame(() => {
          this._ignoreEvent = false;
        });
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
            if (this._compass.setStyle) {
              this._compass.setStyle(cStyle);
            }
          }
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
        if (!this._event) {
          return;
        }
        const latlng = this._event.latlng;
        const accuracy = this._event.accuracy ?? 0;
        const isFollowing = this._isFollowing();
        if (this.options.drawCircle) {
          const style = isFollowing ? this.options.followCircleStyle : this.options.circleStyle;
          if (this._circle) {
            this._circle.setLatLng(latlng).setRadius(accuracy).setStyle(style);
          } else {
            const options = { ...style, radius: accuracy };
            this._circle = new leaflet.Circle(latlng, options).addTo(this._layer);
          }
        }
        if (this.options.drawMarker) {
          const style = isFollowing ? this.options.followMarkerStyle : this.options.markerStyle;
          if (this._marker) {
            this._marker.setLatLng(latlng);
            if (this._marker.setStyle) {
              this._marker.setStyle(style);
            }
          } else {
            this._marker = new this.options.markerClass(latlng, style).addTo(this._layer);
          }
        }
        this._drawCompass();
        this._bindPopup(latlng, accuracy);
      },
      /**
       * Bind popup with location information to marker and compass.
       * @param {L.LatLng} latlng - The location to bind the popup to.
       * @param {number} accuracy - The accuracy radius in meters.
       */
      _bindPopup(latlng, accuracy) {
        const t = this.options.strings.popup;
        if (!this.options.showPopup || !t) {
          return;
        }
        let distance;
        let unit;
        let altitude;
        if (this.options.metric) {
          distance = accuracy.toFixed(0);
          unit = this.options.strings.metersUnit;
          altitude = this._event?.altitude != null ? this._event.altitude.toFixed(1) : "N/A";
        } else {
          distance = (accuracy * METERS_TO_FEET).toFixed(0);
          unit = this.options.strings.feetUnit;
          altitude = this._event?.altitude != null ? (this._event.altitude * METERS_TO_FEET).toFixed(1) : "N/A";
        }
        const speed = this._event?.speed != null ? this._event.speed.toFixed(2) : "N/A";
        const heading = this._event?.heading != null ? this._event.heading.toFixed(0) : "N/A";
        const data = {
          distance,
          unit,
          lat: latlng.lat.toFixed(6),
          lng: latlng.lng.toFixed(6),
          altitude,
          speed,
          heading
        };
        let popupText;
        if (typeof t === "string") {
          popupText = leaflet.Util.template(t, data);
        } else if (typeof t === "function") {
          popupText = t(data);
        } else {
          popupText = t;
        }
        if (this._marker) {
          this._marker.bindPopup(popupText)._popup.setLatLng(latlng);
        }
        if (this._compass) {
          this._compass.bindPopup(popupText)._popup.setLatLng(latlng);
        }
      },
      /**
       * Remove the marker from map.
       */
      _removeMarker() {
        this._layer.clearLayers();
        this._marker = void 0;
        this._circle = void 0;
        this._compass = void 0;
      },
      /**
       * Unload the plugin and all event listeners.
       * Kind of the opposite of onAdd.
       */
      _unload() {
        this.stop();
        if (this._map) {
          this._map.off("unload", this._unload, this);
        }
      },
      /**
       * Sets the compass heading
       */
      _setCompassHeading(angle) {
        if (Number.isFinite(angle)) {
          this._compassHeading = Math.round(angle);
          requestAnimationFrame(() => this._drawCompass());
        } else {
          this._compassHeading = null;
          this._drawCompass();
        }
      },
      /**
       * If the compass fails calibration just fail safely and remove the compass
       */
      _onCompassNeedsCalibration() {
        this._setCompassHeading();
      },
      /**
       * Process and normalise compass events.
       *
       * On iOS, optionally filters out inaccurate readings based on `compassAccuracyThreshold`.
       * Android has no equivalent accuracy field and is therefore not filtered.
       */
      _onDeviceOrientation(e) {
        if (!this._active) {
          return;
        }
        if (e.webkitCompassHeading != null) {
          const threshold = this.options.compassAccuracyThreshold;
          const filterEnabled = typeof threshold === "number" && e.webkitCompassAccuracy != null;
          const tooInaccurate = filterEnabled && (e.webkitCompassAccuracy < 0 || e.webkitCompassAccuracy > threshold);
          if (tooInaccurate) {
            this._setCompassHeading();
            return;
          }
          const screenAngle = window.screen?.orientation?.angle ?? 0;
          this._setCompassHeading((e.webkitCompassHeading + screenAngle) % 360);
        } else if (e.alpha !== null) {
          this._setCompassHeading(360 - e.alpha);
        }
      },
      /**
       * Calls deactivate and dispatches an error.
       */
      _onLocationError(err) {
        if (err.code === 3 && this.options.locateOptions.watch) {
          this._timeoutCount = (this._timeoutCount || 0) + 1;
          this._map.fire("locationtimeout", {
            error: err,
            control: this,
            count: this._timeoutCount
          });
          if (this._timeoutCount >= 3 && this._container) {
            addClasses(this._container, "locate-timeout");
          }
          return;
        }
        this._timeoutCount = 0;
        this.stop();
        this.options.onLocationError(err, this);
      },
      /**
       * Stores the received event and updates the marker.
       */
      _onLocationFound(e) {
        if (this._event?.latlng?.lat === e.latlng.lat && this._event?.latlng?.lng === e.latlng.lng && this._event?.accuracy === e.accuracy) {
          return;
        }
        if (!this._active) {
          return;
        }
        this._timeoutCount = 0;
        if (this._container) {
          removeClasses(this._container, "locate-timeout");
        }
        this._event = e;
        this._drawMarker();
        this._updateContainerStyle();
        this._map.fire("locatelocationfound", {
          ...e,
          control: this
        });
        switch (this.options.setView) {
          case "once":
            if (this._justClicked) {
              this.setView();
            }
            break;
          case "untilPan":
            if (!this._userPanned) {
              this.setView();
            }
            break;
          case "untilPanOrZoom":
            if (!this._userPanned && !this._userZoomed) {
              this.setView();
            }
            break;
          case "always":
            this.setView();
            break;
        }
        this._justClicked = false;
      },
      /**
       * When the user drags. Need a separate event so we can bind and unbind event listeners.
       */
      _onDrag() {
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
          if (this._marker && !this._map.getBounds().pad(-0.3).contains(this._marker.getLatLng())) {
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
        if (this.options.setView === "always") {
          return true;
        } else if (this.options.setView === "untilPan") {
          return !this._userPanned;
        } else if (this.options.setView === "untilPanOrZoom") {
          return !this._userPanned && !this._userZoomed;
        }
        return false;
      },
      /**
       * Check if location is in map bounds
       */
      _isOutsideMapBounds() {
        if (this._event === void 0) {
          return false;
        }
        return this._map.options.maxBounds && !this._map.options.maxBounds.contains(this._event.latlng);
      },
      /**
       * Toggles button class between following and active.
       */
      _updateContainerStyle() {
        if (!this._container) {
          return;
        }
        if (this._active && !this._event) {
          this._setClasses("requesting");
        } else if (this._isFollowing()) {
          this._setClasses("following");
        } else if (this._active) {
          this._setClasses("active");
        } else {
          this._cleanClasses();
        }
      },
      /**
       * Sets the CSS classes for the state.
       */
      _setClasses(state) {
        switch (state) {
          case "requesting":
            removeClasses(this._container, "active following");
            addClasses(this._container, "requesting");
            removeClasses(this._icon, this.options.icon);
            addClasses(this._icon, this.options.iconLoading);
            break;
          case "active":
            removeClasses(this._container, "requesting following");
            addClasses(this._container, "active");
            removeClasses(this._icon, this.options.iconLoading);
            addClasses(this._icon, this.options.icon);
            break;
          case "following":
            removeClasses(this._container, "requesting");
            addClasses(this._container, "active following");
            removeClasses(this._icon, this.options.iconLoading);
            addClasses(this._icon, this.options.icon);
            break;
        }
      },
      /**
       * Removes all classes from button.
       */
      _cleanClasses() {
        removeClasses(this._container, "requesting active following");
        removeClasses(this._icon, this.options.iconLoading);
        addClasses(this._icon, this.options.icon);
      },
      /**
       * Reinitializes state variables.
       */
      _resetVariables() {
        this._active = false;
        this._justClicked = false;
        this._timeoutCount = 0;
        if (this._container) {
          removeClasses(this._container, "locate-timeout");
        }
        this._userPanned = false;
        this._userZoomed = false;
      }
    });
    function locate(options) {
      return new LocateControl(options);
    }
    exports2.CompassMarker = CompassMarker;
    exports2.LocateControl = LocateControl;
    exports2.LocationMarker = LocationMarker;
    exports2.locate = locate;
    Object.defineProperty(exports2, "__esModule", { value: true });
  }));
  (function() {
    if (typeof window !== "undefined" && window.L) {
      window.L.control = window.L.control || {};
      window.L.control.locate = window.L.Control.Locate.locate;
    }
  })();

  // src/leaflet-ui.js
  var import_Control_FullScreen_umd = __toESM(require_Control_FullScreen_umd());

  // node_modules/leaflet-pegman/leaflet-pegman.js
  init_leaflet_compat();
  leaflet_compat_default.Control.Pegman = leaflet_compat_default.Control.extend({
    includes: Object.fromEntries(Object.getOwnPropertyNames(leaflet_compat_default.Mixin.Events).filter((name) => name !== "constructor").map((name) => [name, leaflet_compat_default.Mixin.Events[name]])),
    options: {
      position: "bottomright",
      theme: "leaflet-pegman-v3-default",
      // or "leaflet-pegman-v3-small"
      debug: false,
      apiKey: "",
      libraries: "geometry",
      mutant: {
        attribution: 'Map data: &copy; <a href="https://www.google.com/intl/en/help/terms_maps.html">Google</a>',
        pane: "overlayPane",
        styles: [{ featureType: "all", elementType: "all", stylers: [{ visibility: "off" }] }],
        type: null
        // Non-image map type (used to force a transparent background)
      },
      pano: {
        enableCloseButton: true,
        fullscreenControl: false,
        imageDateControl: true
      },
      marker: {
        draggable: true,
        icon: new leaflet_compat_default.Icon({
          className: "pegman-marker",
          iconSize: [52, 52],
          iconAnchor: [24, 33],
          iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAFElEQVR4XgXAAQ0AAABAMP1L30IDCPwC/o5WcS4AAAAASUVORK5CYII="
        })
      }
    },
    __gmapsURL: "https://maps.googleapis.com/maps/api/js?v=3",
    __mutantURL: "https://unpkg.com/leaflet.gridlayer.googlemutant@0.16.0/dist/Leaflet.GoogleMutant.js",
    initialize(options) {
      options = options || {};
      leaflet_compat_default.Util.setOptions(this, options);
      this._mousePos = {
        direction: {},
        old: {}
      };
      this._pegmanMarkerCoords = null;
      this._streetViewCoords = null;
      this._streetViewLayerEnabled = false;
      this._lazyLoaderAdded = false;
      this._pointerDownHandler = this._onPointerDown.bind(this);
      this._pointerMoveHandler = this._onPointerMove.bind(this);
      this._pointerUpHandler = this._onPointerUp.bind(this);
      this._pointerCancelHandler = this._onPointerCancel.bind(this);
      this._controlClickHandler = this._onControlClick.bind(this);
    },
    onAdd(map) {
      this._map = map;
      this._lazyLoaderAdded = false;
      this._container = leaflet_compat_default.DomUtil.create("div", "leaflet-pegman pegman-control leaflet-bar");
      this._pegman = leaflet_compat_default.DomUtil.create("div", "pegman", this._container);
      this._pegmanButton = leaflet_compat_default.DomUtil.create("div", "pegman-button", this._container);
      this._pegmanMarker = new leaflet_compat_default.Marker([0, 0], this.options.marker);
      this._panoDiv = this.options.panoDiv ? document.querySelector(this.options.panoDiv) : leaflet_compat_default.DomUtil.create("div", "", this._map._container);
      this._panoDisplay = this._panoDiv.style.display;
      this._panoHadClass = this._panoDiv.classList.contains("pano-canvas");
      this._mapHadTheme = map._container.classList.contains(this.options.theme);
      this._panoDiv.classList.add("pano-canvas");
      this._map._container.classList.add(this.options.theme);
      leaflet_compat_default.DomEvent.disableClickPropagation(this._panoDiv);
      leaflet_compat_default.DomEvent.on(this._container, "click mousedown dblclick", this._disableClickPropagation, this);
      this._pegman.addEventListener("pointerdown", this._pointerDownHandler);
      this._container.addEventListener("click", this._controlClickHandler);
      this._container.addEventListener("touchstart", this._loadScripts.bind(this, !leaflet_compat_default.Browser.touch), { once: true });
      this._container.addEventListener("mousedown", this._loadScripts.bind(this, true), { once: true });
      this._container.addEventListener("mouseover", this._loadScripts.bind(this, false), { once: true });
      this._loadGoogleHandlers();
      leaflet_compat_default.DomEvent.on(document, "mousemove", this.mouseMoveTracking, this);
      leaflet_compat_default.DomEvent.on(document, "keyup", this.keyUpTracking, this);
      this._pegmanMarker.on("dragend", this.onPegmanMarkerDragged, this);
      this._map.on("click", this.onMapClick, this);
      this._map.on("layeradd", this.onMapLayerAdd, this);
      return this._container;
    },
    onRemove(map) {
      this._finishPointerDrag(null, true);
      this._pegman.removeEventListener("pointerdown", this._pointerDownHandler);
      this._container.removeEventListener("click", this._controlClickHandler);
      this.clear();
      if (this._googleStreetViewLayer) this._googleStreetViewLayer.remove();
      if (this._pegmanMarker) this._pegmanMarker.remove();
      if (this._panoramaListeners) this._panoramaListeners.forEach(function(listener) {
        listener.remove();
      });
      this._panoramaListeners = null;
      this._panorama = this._streetViewService = this._googleStreetViewLayer = null;
      this._pegmanMarker.off("dragend", this.onPegmanMarkerDragged, this);
      if (this.options.panoDiv) {
        this._panoDiv.style.display = this._panoDisplay;
        if (!this._panoHadClass) this._panoDiv.classList.remove("pano-canvas");
      } else {
        this._panoDiv.remove();
      }
      if (!this._mapHadTheme) map._container.classList.remove(this.options.theme);
      leaflet_compat_default.DomEvent.off(document, "mousemove", this.mouseMoveTracking, this);
      leaflet_compat_default.DomEvent.off(document, "keyup", this.keyUpTracking, this);
      map.off("mousemove", this._setMouseCursor, this);
      map.off("click", this.onMapClick, this);
      map.off("layeradd", this.onMapLayerAdd, this);
      map._container.style.cursor = this.defaultDraggableCursor || "";
    },
    _onPointerDown(e) {
      if (!this._map || e.button !== 0 || this._pointerId != null) return;
      this._loadScripts(true);
      this._pointerId = e.pointerId;
      this._pointerStart = { x: e.clientX, y: e.clientY };
      this._pointerLast = this._pointerStart;
      this._isDragging = false;
      this._dropTarget = false;
      e.preventDefault();
      document.addEventListener("pointermove", this._pointerMoveHandler);
      document.addEventListener("pointerup", this._pointerUpHandler);
      document.addEventListener("pointercancel", this._pointerCancelHandler);
    },
    _onPointerMove(e) {
      if (e.pointerId !== this._pointerId) return;
      const dx = e.clientX - this._pointerLast.x;
      const dy = e.clientY - this._pointerLast.y;
      if (!this._isDragging) {
        const startX = e.clientX - this._pointerStart.x;
        const startY = e.clientY - this._pointerStart.y;
        if (startX * startX + startY * startY < 9) return;
        this._isDragging = true;
        this._mapDraggingWasEnabled = this._map.dragging.enabled();
        if (this._mapDraggingWasEnabled) this._map.dragging.disable();
        this.onDropZoneActivated(e);
      }
      this._pointerLast = { x: e.clientX, y: e.clientY };
      this.onDraggableMove({ pageX: e.pageX, pageY: e.pageY, dx, dy });
      const overMap = this._pegmanOverMap();
      if (overMap && !this._dropTarget) {
        this._dropTarget = true;
        this.onDropZoneDragEntered(e);
      } else if (!overMap && this._dropTarget) {
        this._dropTarget = false;
        this.onDropZoneDragLeaved(e);
      }
    },
    _onPointerUp(e) {
      this._finishPointerDrag(e, false);
    },
    _onPointerCancel(e) {
      this._finishPointerDrag(e, true);
    },
    _finishPointerDrag(e, canceled) {
      if (this._pointerId == null) return;
      document.removeEventListener("pointermove", this._pointerMoveHandler);
      document.removeEventListener("pointerup", this._pointerUpHandler);
      document.removeEventListener("pointercancel", this._pointerCancelHandler);
      if (this._isDragging) {
        if (!canceled) {
          if (this._dropTarget) this.onDropZoneDropped(e);
          this.onDraggableEnd(e);
        } else {
          this._translateElement(this._pegman, false, false);
          this._removeClasses(this._container, "dragging");
        }
        this.onDropZoneDeactivated(e);
        if (!canceled) {
          this._suppressClick = true;
          setTimeout(function() {
            this._suppressClick = false;
          }.bind(this), 0);
        }
      }
      if (this._mapDraggingWasEnabled) this._map.dragging.enable();
      this._pointerId = null;
      this._isDragging = false;
      this._dropTarget = false;
      this._mapDraggingWasEnabled = false;
    },
    _pegmanOverMap() {
      const pegman = this._pegman.getBoundingClientRect();
      const map = this._map._container.getBoundingClientRect();
      const width = Math.max(0, Math.min(pegman.right, map.right) - Math.max(pegman.left, map.left));
      const height = Math.max(0, Math.min(pegman.bottom, map.bottom) - Math.max(pegman.top, map.top));
      return pegman.width * pegman.height > 0 && width * height / (pegman.width * pegman.height) >= 0.75;
    },
    _onControlClick(e) {
      if (this._suppressClick) {
        this._suppressClick = false;
        return;
      }
      this.toggleStreetViewLayer(e);
    },
    _log(args) {
      if (this.options.debug) {
        console.log(args);
      }
    },
    _addClasses(el, classNames) {
      classNames = classNames.split(" ");
      for (const s in classNames) {
        el.classList.add(classNames[s]);
      }
    },
    _removeClasses(el, classNames) {
      classNames = classNames.split(" ");
      for (const s in classNames) {
        el.classList.remove(classNames[s]);
      }
    },
    _removeAttributes(el, attrNames) {
      for (const a in attrNames) {
        el.removeAttribute(attrNames[a]);
      }
    },
    _translateElement(el, dx, dy) {
      if (dx === false && dy === false) {
        this._removeAttributes(this._pegman, ["style", "data-x", "data-y"]);
      }
      const x = (parseFloat(el.getAttribute("data-x")) || 0) + dx;
      const y = (parseFloat(el.getAttribute("data-y")) || 0) + dy;
      el.style.webkitTransform = el.style.transform = "translate(" + x + "px, " + y + "px)";
      el.setAttribute("data-x", x);
      el.setAttribute("data-y", y);
    },
    _updateClasses(action) {
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
    onDraggableMove(e) {
      this.mouseMoveTracking(e);
      this.pegmanRemove();
      this._updateClasses("pegman-dragging");
      this._translateElement(this._pegman, e.dx, e.dy);
    },
    onDraggableEnd(e) {
      this._pegmanMarkerCoords = (this._map.pointerEventToLatLng || this._map.mouseEventToLatLng).call(this._map, e);
      this.pegmanAdd();
      this.findStreetViewData(this._pegmanMarkerCoords.lat, this._pegmanMarkerCoords.lng);
      this._updateClasses("pegman-dragged");
    },
    onDropZoneActivated(e) {
      this._updateClasses("dropzone-actived");
    },
    onDropZoneDragEntered(e) {
      this.showStreetViewLayer();
      this._updateClasses("dropzone-drag-entered");
    },
    onDropZoneDragLeaved(e) {
      this._updateClasses("dropzone-drag-leaved");
    },
    onDropZoneDropped(e) {
      this._updateClasses("dropzone-drop");
      this._translateElement(this._pegman, false, false);
    },
    onDropZoneDeactivated(e) {
      this._updateClasses("dropzone-deactivated");
    },
    onPegmanMarkerDragged(e) {
      this._pegmanMarkerCoords = this._pegmanMarker.getLatLng();
      this.findStreetViewData(this._pegmanMarkerCoords.lat, this._pegmanMarkerCoords.lng);
    },
    onMapClick(e) {
      if (this._streetViewLayerEnabled) {
        this.findStreetViewData(e.latlng.lat, e.latlng.lng);
      }
    },
    onMapLayerAdd(e) {
      if (this._googleStreetViewLayer)
        this._googleStreetViewLayer.bringToFront();
    },
    onStreetViewPanoramaClose() {
      this.clear();
    },
    onPanoramaPositionChanged() {
      let pos = this._panorama.getPosition();
      pos = new leaflet_compat_default.LatLng(pos.lat(), pos.lng());
      if (this._map && !this._map.getBounds().pad(-0.05).contains(pos)) {
        this._map.panTo(pos);
      }
      this._pegmanMarker.setLatLng(pos);
    },
    onPanoramaPovChanged() {
      const pov = this._panorama.getPov();
      const marker = this._pegmanMarker.getElement();
      if (marker) marker.style.backgroundPosition = "0 " + -Math.abs(Math.round(pov.heading / (360 / 16)) % 16 * Math.round(835 / 16)) + "px";
    },
    clear() {
      this.pegmanRemove();
      this.hideStreetViewLayer();
      this.closeStreetViewPanorama();
    },
    toggleStreetViewLayer(e) {
      if (this._streetViewLayerEnabled) this.clear();
      else this.showStreetViewLayer();
      this._log("streetview-layer-toggled");
    },
    pegmanAdd() {
      this._pegmanMarker.addTo(this._map);
      this._pegmanMarker.setLatLng(this._pegmanMarkerCoords);
      this.findStreetViewData(this._pegmanMarkerCoords.lat, this._pegmanMarkerCoords.lng);
      this._updateClasses("pegman-added");
    },
    pegmanRemove() {
      this._pegmanMarker.removeFrom(this._map);
      this._updateClasses("pegman-removed");
    },
    closeStreetViewPanorama() {
      this._panoDiv.style.display = "none";
      if (this._panorama) this._panorama.setVisible(false);
    },
    openStreetViewPanorama() {
      this._panoDiv.style.display = "block";
    },
    hideStreetViewLayer() {
      if (this._googleStreetViewLayer) {
        this._googleStreetViewLayer.removeFrom(this._map);
        this._streetViewLayerEnabled = false;
        this._updateClasses("streetview-hidden");
      }
    },
    showStreetViewLayer() {
      if (this._googleStreetViewLayer) {
        this._googleStreetViewLayer.addTo(this._map);
        this._streetViewLayerEnabled = true;
        this._updateClasses("streetview-shown");
      }
    },
    findStreetViewData(lat, lng) {
      if (!this._map) return;
      if (!this._streetViewService) {
        this._loadScripts(true);
        return this.once("svpc_streetview-shown", this.findStreetViewData.bind(this, lat, lng));
      }
      if (!this._pegmanMarker._map && this._map) {
        this._pegmanMarkerCoords = new leaflet_compat_default.LatLng(lat, lng);
        return this.pegmanAdd();
      }
      this._streetViewCoords = new google.maps.LatLng(lat, lng);
      const searchRadius = this._getStreetViewSearchRadius();
      const panorama = this._panorama;
      this._streetViewService.getPanoramaByLocation(this._streetViewCoords, searchRadius, function(data, status) {
        if (this._map && this._panorama === panorama) this.processStreetViewServiceData(data, status);
      }.bind(this));
    },
    _getStreetViewSearchRadius() {
      const zoom = this._map.getZoom();
      if (zoom < 6) return 5e3;
      if (zoom < 10) return 500;
      if (zoom < 15) return 250;
      if (zoom >= 17) return 50;
      return 100;
    },
    processStreetViewServiceData(data, status) {
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
      }
    },
    /**
     * mouseMoveTracking
     * @desc internal function used to style pegman while dragging
     */
    mouseMoveTracking(e) {
      const mousePos = this._mousePos;
      if (e.pageY < mousePos.old.y) {
        mousePos.direction.y = "top";
        this._updateClasses("mousemove-top");
      } else if (e.pageY > mousePos.old.y) {
        mousePos.direction.y = "bottom";
        this._updateClasses("mousemove-bottom");
      }
      if (e.pageX < mousePos.old.x) {
        mousePos.direction.x = "left";
        this._updateClasses("mousemove-left");
      } else if (e.pageX > mousePos.old.x) {
        mousePos.direction.x = "right";
        this._updateClasses("mousemove-right");
      }
      mousePos.old.x = e.pageX;
      mousePos.old.y = e.pageY;
    },
    /**
     * keyUpTracking
     * @desc internal function used to track keyup events
     */
    keyUpTracking(e) {
      if (e.keyCode == 27) {
        this._log("escape pressed");
        this.clear();
      }
    },
    _disableClickPropagation(e) {
      leaflet_compat_default.DomEvent.stopPropagation(e);
      leaflet_compat_default.DomEvent.preventDefault(e);
    },
    _loadGoogleHandlers(toggleStreetView) {
      if (!this._map || typeof google !== "object" || typeof google.maps !== "object" || typeof leaflet_compat_default.GridLayer.GoogleMutant !== "function") return;
      if (this._panorama) {
        if (toggleStreetView) this.showStreetViewLayer();
        return;
      }
      this._initGoogleMaps(toggleStreetView);
      this._initMouseTracker();
    },
    _initGoogleMaps(toggleStreetView) {
      if (!leaflet_compat_default.Util.requestAnimFrame) {
        leaflet_compat_default.Util = { ...leaflet_compat_default.Util, requestAnimFrame: (callback) => requestAnimationFrame(callback) };
      }
      const leaflet = window.L || window.leaflet;
      if (!leaflet.Util.requestAnimFrame) {
        leaflet.Util = { ...leaflet.Util, requestAnimFrame: leaflet_compat_default.Util.requestAnimFrame };
      }
      this._googleStreetViewLayer = new leaflet_compat_default.GridLayer.GoogleMutant(this.options.mutant);
      this._googleStreetViewLayer.onRemove = function(map) {
        leaflet_compat_default.GridLayer.prototype.onRemove.call(this, map);
        this._observer.disconnect();
        this._mutantContainer.remove();
        this._logoContainer?.remove();
        this._attributionContainer?.remove();
        if (this._mutant) google.maps.event.clearListeners(this._mutant, "idle");
      };
      const layer = this._googleStreetViewLayer;
      const onMutatedImage = layer._onMutatedImage;
      layer._onMutatedImage = function(image) {
        if (image.src.includes("!2ssvv!")) onMutatedImage.call(this, image);
      };
      layer._boundOnMutatedImage = layer._onMutatedImage.bind(layer);
      this._googleStreetViewLayer.addGoogleLayer("StreetViewCoverageLayer");
      this._panorama = new google.maps.StreetViewPanorama(this._panoDiv, this.options.pano);
      this._streetViewService = new google.maps.StreetViewService();
      this._panoramaListeners = [
        this._panorama.addListener("closeclick", this.onStreetViewPanoramaClose.bind(this)),
        this._panorama.addListener("position_changed", this.onPanoramaPositionChanged.bind(this)),
        this._panorama.addListener("pov_changed", this.onPanoramaPovChanged.bind(this))
      ];
      if (toggleStreetView) {
        this.showStreetViewLayer();
      }
    },
    _initMouseTracker() {
      if (!this._googleStreetViewLayer) return;
      const tileSize = this._googleStreetViewLayer.getTileSize();
      this.tileWidth = tileSize.x;
      this.tileHeight = tileSize.y;
      this.defaultDraggableCursor = this._map._container.style.cursor;
      this._map.on("mousemove", this._setMouseCursor, this);
    },
    _setMouseCursor(e) {
      const coords = this._getTileCoords(e.latlng.lat, e.latlng.lng, this._map.getZoom());
      const img = this._getTileImage(coords);
      const pixel = this._getTilePixelPoint(img, e.originalEvent);
      const hasTileData = this._hasTileData(img, pixel);
      this._map._container.style.cursor = hasTileData ? "pointer" : this.defaultDraggableCursor;
    },
    _getTileCoords(lat, lon, zoom) {
      const xtile = parseInt(Math.floor((lon + 180) / 360 * (1 << zoom)));
      const ytile = parseInt(Math.floor((1 - Math.log(Math.tan(this._toRad(lat)) + 1 / Math.cos(this._toRad(lat))) / Math.PI) / 2 * (1 << zoom)));
      return {
        x: xtile,
        y: ytile,
        z: zoom
      };
    },
    _getTileImage(coords) {
      if (!this._googleStreetViewLayer || !this._googleStreetViewLayer._tiles) return;
      const key = this._googleStreetViewLayer._tileCoordsToKey(coords);
      const tile = this._googleStreetViewLayer._tiles[key];
      if (!tile) return;
      const img = tile.el.querySelector("img");
      if (!img) return;
      this._downloadTile(img.src, this._tileLoaded);
      return img;
    },
    _getTilePixelPoint(img, e) {
      if (!img) return;
      const imgRect = img.getBoundingClientRect();
      const imgPos = {
        pageY: (imgRect.top + window.scrollY).toFixed(0),
        pageX: (imgRect.left + window.scrollX).toFixed(0)
      };
      const mousePos = {
        x: e.pageX - imgPos.pageX,
        y: e.pageY - imgPos.pageY
      };
      return mousePos;
    },
    _hasTileData(img, pixelPoint) {
      if (!this.tileContext || !pixelPoint) return;
      const pixelData = this.tileContext.getImageData(pixelPoint.x, pixelPoint.y, 1, 1).data;
      const alpha = pixelData[3];
      const hasTileData = alpha != 0;
      return hasTileData;
    },
    _toRad(number) {
      return number * Math.PI / 180;
    },
    _downloadTile(imageSrc, callback) {
      if (!imageSrc) return;
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.addEventListener("load", callback.bind(this, img), false);
      img.src = imageSrc;
    },
    _tileLoaded(img) {
      this.tileCanvas = document.createElement("canvas");
      this.tileContext = this.tileCanvas.getContext("2d");
      this.tileCanvas.width = this.tileWidth;
      this.tileCanvas.height = this.tileHeight;
      this.tileContext.drawImage(img, 0, 0);
    },
    _loadScripts(toggleStreetView) {
      if (!this._map || this._lazyLoaderAdded) return;
      this._lazyLoaderAdded = true;
      this._loadJS(this.__gmapsURL + "&key=" + this.options.apiKey + "&libraries=" + this.options.libraries + "&callback=?", this._loadGoogleHandlers.bind(this, toggleStreetView), typeof google !== "object" || typeof google.maps !== "object");
      this._loadJS(this.__mutantURL, this._loadGoogleHandlers.bind(this, toggleStreetView), typeof leaflet_compat_default.GridLayer.GoogleMutant !== "function");
    },
    _loadJS(url, callback, condition) {
      if (!condition) {
        callback();
        return;
      }
      if (url.indexOf("callback=?") !== -1) {
        this._jsonp(url, callback);
      } else {
        const script = document.createElement("script");
        script.src = url;
        const loaded = function() {
          script.onload = script.onreadystatechange = null;
          this._log(url + " loaded");
          callback();
        }.bind(this);
        script.onerror = function() {
          console.error("Failed to load " + url);
        };
        script.onload = script.onreadystatechange = loaded;
        const head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
        head.insertBefore(script, head.firstChild);
      }
    },
    _jsonp(url, callback, params) {
      let query = url.indexOf("?") === -1 ? "?" : "&";
      params = params || {};
      for (const key in params) {
        if (params.hasOwnProperty(key)) {
          query += encodeURIComponent(key) + "=" + encodeURIComponent(params[key]) + "&";
        }
      }
      const timestamp = (/* @__PURE__ */ new Date()).getUTCMilliseconds();
      const jsonp = "json_call_" + timestamp;
      window[jsonp] = function(data) {
        callback(data);
        window[jsonp] = void 0;
      };
      const script = document.createElement("script");
      if (url.indexOf("callback=?") !== -1) {
        script.src = url.replace("callback=?", "callback=" + jsonp) + query.slice(0, -1);
      } else {
        script.src = url + query + "callback=" + jsonp;
      }
      const loaded = function() {
        if (!this.readyState || this.readyState === "loaded" || this.readyState === "complete") {
          script.onload = script.onreadystatechange = null;
          if (script && script.parentNode) {
            script.parentNode.removeChild(script);
          }
        }
      };
      script.async = true;
      script.onload = script.onreadystatechange = loaded;
      const head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
      head.insertBefore(script, head.firstChild);
    }
  });
  (leaflet_compat_default.control || leaflet_compat_default.Control).pegman = function(options) {
    return new leaflet_compat_default.Control.Pegman(options);
  };

  // node_modules/@raruto/leaflet-gesture-handling/src/index.js
  init_leaflet_compat();

  // node_modules/@raruto/leaflet-gesture-handling/src/locales/en.js
  init_leaflet_compat();
  var en_default = {
    touch: "Use two fingers to move the map",
    scroll: "Use ctrl + scroll to zoom the map",
    scrollMac: "Use \u2318 + scroll to zoom the map"
  };

  // node_modules/@raruto/leaflet-gesture-handling/src/index.js
  var baseURL = (document.currentScript && document.currentScript.src || null).split("/").slice(0, -1).join("/") + "/";
  var [leafletMajor, leafletMinor] = leaflet_compat_default.version.split(".").map(Number);
  var usesDomEventTouchHandlers = leafletMajor > 1 || leafletMajor === 1 && leafletMinor >= 8;
  var draggingMap = false;
  var gestureHandlingOptions = {
    text: {},
    duration: 1700
  };
  var GestureHandling = leaflet_compat_default.Handler.extend({
    _isScrolling: false,
    _isTouching: false,
    _isFading: false,
    addHooks() {
      this._handleTouch = this._handleTouch.bind(this);
      this._setGestureHandlingOptions();
      this._disableInteractions();
      if (usesDomEventTouchHandlers) {
        leaflet_compat_default.DomEvent.on(this._map._container, "touchstart", this._handleTouch, this);
        leaflet_compat_default.DomEvent.on(this._map._container, "touchmove", this._handleTouch, this);
        leaflet_compat_default.DomEvent.on(this._map._container, "touchend", this._handleTouch, this);
        leaflet_compat_default.DomEvent.on(this._map._container, "touchcancel", this._handleTouch, this);
        leaflet_compat_default.DomEvent.on(this._map._container, "click", this._handleTouch, this);
      } else {
        this._map._container.addEventListener("touchstart", this._handleTouch);
        this._map._container.addEventListener("touchmove", this._handleTouch);
        this._map._container.addEventListener("touchend", this._handleTouch);
        this._map._container.addEventListener("touchcancel", this._handleTouch);
        this._map._container.addEventListener("click", this._handleTouch);
      }
      leaflet_compat_default.DomEvent.on(this._map._container, "wheel", this._handleScroll, this);
      leaflet_compat_default.DomEvent.on(this._map._container, "mouseenter", this._handleMouseOver, this);
      leaflet_compat_default.DomEvent.on(this._map._container, "mouseleave", this._handleMouseOut, this);
      this._map.on("movestart move moveend", this._handleDragging, this);
      this._map.on("popupopen", this._handleScrollOnPopup, this);
      this._map.on("popupclose", this._handleScrollOnPopup, this);
      this._map.off("enterFullscreen", this._onEnterFullscreen, this);
      this._map.off("exitFullscreen", this._onExitFullscreen, this);
      this._map.on("enterFullscreen", this._onEnterFullscreen, this);
      this._map.on("exitFullscreen", this._onExitFullscreen, this);
      this._map._container.classList.add("leaflet-gesture-handling");
    },
    removeHooks() {
      this._enableInteractions();
      if (usesDomEventTouchHandlers) {
        leaflet_compat_default.DomEvent.off(this._map._container, "touchstart", this._handleTouch, this);
        leaflet_compat_default.DomEvent.off(this._map._container, "touchmove", this._handleTouch, this);
        leaflet_compat_default.DomEvent.off(this._map._container, "touchend", this._handleTouch, this);
        leaflet_compat_default.DomEvent.off(this._map._container, "touchcancel", this._handleTouch, this);
        leaflet_compat_default.DomEvent.off(this._map._container, "click", this._handleTouch, this);
      } else {
        this._map._container.removeEventListener("touchstart", this._handleTouch);
        this._map._container.removeEventListener("touchmove", this._handleTouch);
        this._map._container.removeEventListener("touchend", this._handleTouch);
        this._map._container.removeEventListener("touchcancel", this._handleTouch);
        this._map._container.removeEventListener("click", this._handleTouch);
      }
      leaflet_compat_default.DomEvent.off(this._map._container, "wheel", this._handleScroll, this);
      leaflet_compat_default.DomEvent.off(this._map._container, "mouseenter", this._handleMouseOver, this);
      leaflet_compat_default.DomEvent.off(this._map._container, "mouseleave", this._handleMouseOut, this);
      this._map.off("movestart move moveend", this._handleDragging, this);
      this._map.off("popupopen", this._handleScrollOnPopup, this);
      this._map.off("popupclose", this._handleScrollOnPopup, this);
      this._map._container.classList.remove("leaflet-gesture-handling");
    },
    _handleDragging(e) {
      if (e.type == "movestart" || e.type == "move") {
        draggingMap = true;
      } else if (e.type == "moveend") {
        draggingMap = false;
      }
    },
    _disableInteraction(name) {
      if (this._map.options[name] && this._map[name]) {
        this._map[name].disable();
      }
    },
    _enableInteraction(name) {
      if (this._map.options[name] && this._map[name]) {
        this._map[name].enable();
      }
    },
    _disableInteractions() {
      this._disableInteraction("dragging");
      this._disableInteraction("scrollWheelZoom");
      this._disableInteraction("tap");
    },
    _enableInteractions() {
      this._enableInteraction("dragging");
      this._enableInteraction("scrollWheelZoom");
      this._enableInteraction("tap");
    },
    _enableWarning(gesture) {
      clearTimeout(this._isFading);
      this._map._container.classList.add("leaflet-gesture-handling-" + gesture);
      this._map._container.classList.add("leaflet-gesture-handling-warning");
    },
    _disableWarning(gesture, delay) {
      clearTimeout(this._isFading);
      this._isFading = setTimeout(
        () => this._map._container.classList.remove("leaflet-gesture-handling-" + gesture),
        delay || this._map.options.gestureHandlingOptions.duration
      );
      this._map._container.classList.remove("leaflet-gesture-handling-warning");
    },
    _isLanguageContent(text) {
      return text && text.touch && text.scroll && text.scrollMac;
    },
    _isMacUser() {
      return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    },
    _parseGestureHandlingOptions() {
      const text = this._map.options.gestureHandlingOptions.text || this._map.options.gestureHandlingText || gestureHandlingOptions.text;
      const duration = this._map.options.gestureHandlingOptions.duration || this._map.options.gestureHandlingDuration || gestureHandlingOptions.duration;
      const options = Object.assign(this._map.options.gestureHandlingOptions, gestureHandlingOptions);
      options.text = text;
      options.duration = duration;
      return options;
    },
    _setGestureHandlingOptions() {
      const opts = this._parseGestureHandlingOptions();
      (this._isLanguageContent(opts.text) ? Promise.resolve(opts.text) : this._getLanguageContent(opts.locale)).then((content) => {
        this._map._container.setAttribute("data-gesture-handling-touch-content", content.touch);
        this._map._container.setAttribute("data-gesture-handling-scroll-content", content.scroll);
        this._touchWarning = content.touch;
        this._scrollWarning = content.scroll;
      });
    },
    _getUserLanguage() {
      return navigator.languages ? navigator.languages[0] : navigator.language || navigator.userLanguage;
    },
    _getLanguageContent(lang) {
      lang = (lang || this._getUserLanguage() || "en").replace("_", "-");
      let resolve;
      const promise = new Promise((_resolve) => {
        resolve = _resolve;
      });
      const consume = (m) => {
        const content = m.default || {};
        content.scroll = this._isMacUser() ? content.scrollMac : content.scroll;
        resolve(content);
      };
      import(baseURL + "./locales/" + lang + ".js").then(consume).catch(() => import(baseURL + "./locales/" + lang.split("-")[0] + ".js").then(consume).catch(() => consume({ default: en_default })));
      return promise;
    },
    _handleTouch(e) {
      const ignore = e.target.classList.contains("leaflet-interactive") || e.target.closest(".leaflet-control-container") || e.target.closest(".leaflet-popup-pane");
      if (ignore) {
        if (e.target.classList.contains("leaflet-interactive") && e.type === "touchmove" && e.touches.length === 1) {
          this._enableTouchWarning();
        } else {
          this._disableTouchWarning();
          if ((e.type === "touchend" || e.type === "touchcancel") && e.touches.length === 0) {
            this._enableInteractions();
          }
        }
      } else if (e.type !== "touchmove" && e.type !== "touchstart") {
        this._disableTouchWarning();
        this._enableInteractions();
      } else if (e.touches.length === 1) {
        this._enableTouchWarning();
      } else {
        e.preventDefault();
        this._disableTouchWarning();
        this._enableInteractions();
      }
    },
    _enableTouchWarning() {
      this._enableWarning("touch");
      this._disableInteractions();
    },
    _disableTouchWarning(delay) {
      clearTimeout(this._isTouching);
      this._isTouching = setTimeout(
        () => {
          this._disableWarning("touch");
        },
        delay || 0
      );
    },
    _enableScrollWarning() {
      this._enableWarning("scroll");
      this._disableInteraction("scrollWheelZoom");
    },
    _disableScrollWarning(delay) {
      clearTimeout(this._isScrolling);
      this._isScrolling = setTimeout(
        () => {
          this._disableWarning("scroll");
          this._enableInteraction("scrollWheelZoom");
        },
        delay || 0
      );
    },
    _handleScroll(e) {
      const scrollZoom = this._map.scrollWheelZoom;
      const scrollWarning = this._map._container.classList.contains("leaflet-gesture-handling-scroll");
      if (e.metaKey || e.ctrlKey || e.shiftKey && this._map._rotate) {
        if (scrollZoom && (scrollZoom.enabled() || scrollWarning)) {
          e.preventDefault();
          if (scrollWarning && !scrollZoom.enabled()) {
            this._enableInteraction("scrollWheelZoom");
            scrollZoom._onWheelScroll(e);
          }
          this._disableScrollWarning();
        }
      } else if (scrollZoom && scrollZoom.enabled()) {
        this._enableScrollWarning();
        this._disableScrollWarning(this._map.options.gestureHandlingOptions.duration);
      }
    },
    _handleScrollOnPopup(e) {
      leaflet_compat_default.DomEvent[e.type == "popupopen" ? "on" : "off"](e.popup._contentNode, "wheel", this._handleScroll, this);
    },
    _handleMouseOver(e) {
      this._enableInteractions();
    },
    _handleMouseOut(e) {
      if (!draggingMap) this._disableInteractions();
    },
    _onExitFullscreen() {
      if (this._map.options.gestureHandling)
        this._map.gestureHandling.enable();
    },
    _onEnterFullscreen() {
      if (this._map.options.gestureHandling)
        this._map.gestureHandling.disable();
    }
  });
  leaflet_compat_default.Map.mergeOptions({
    gestureHandlingOptions
  });
  leaflet_compat_default.Map.addInitHook("addHandler", "gestureHandling", GestureHandling);

  // node_modules/@raruto/leaflet-edit-osm/leaflet-edit-osm.js
  init_leaflet_compat();
  leaflet_compat_default.Control.EditInOSM = class extends leaflet_compat_default.Control {
    _edit() {
      window.open(`http://www.openstreetmap.org/edit?zoom=${this._map.getZoom()}${this.options.editor ? "&editor=" + this.options.editor : ""}&lat=${this._map.getCenter().lat}&lon=${this._map.getCenter().lng}`);
    }
    onAdd(map) {
      const container = leaflet_compat_default.DomUtil.create("div", "leaflet-control-attribution leaflet-edit-osm"), link = leaflet_compat_default.DomUtil.create("a", "", container);
      link.href = "#";
      link.innerHTML = "\u270E Edit";
      link.title = "Edit in OpenStreetMap";
      leaflet_compat_default.DomEvent.on(link, "click", leaflet_compat_default.DomEvent.stopPropagation).on(link, "mousedown", leaflet_compat_default.DomEvent.stopPropagation).on(link, "dblclick", leaflet_compat_default.DomEvent.stopPropagation).on(link, "click", leaflet_compat_default.DomEvent.preventDefault).on(link, "click", this._edit, this);
      return container;
    }
  };
  leaflet_compat_default.Control.EditInOSM.prototype.options = Object.assign(Object.create(leaflet_compat_default.Control.prototype.options), {
    position: "bottomright",
    editor: false
    // eg: "id", "potlatch2" or "remote"
  });
  if (leaflet_compat_default.control) {
    leaflet_compat_default.control.editInOSM = function(options) {
      return new leaflet_compat_default.Control.EditInOSM(options);
    };
  }

  // node_modules/leaflet-control-layers-inline/leaflet-control-layers-inline.js
  init_leaflet_compat();
  (function() {
    const layersProto = leaflet_compat_default.Control.Layers.prototype;
    const initializeLayersProto = layersProto.initialize;
    const onAddLayersProto = layersProto.onAdd;
    layersProto.options.inline = false;
    leaflet_compat_default.Control.Layers.include({
      initialize(baseLayers, overlays, options) {
        options = options || {};
        if (options.inline) {
          options.collapsed = false;
        }
        initializeLayersProto.call(this, baseLayers, overlays, options);
      },
      onAdd(map) {
        onAddLayersProto.call(this, map);
        if (this.options.inline) {
          this.options.collapsed = false;
          this._container.classList.add("leaflet-control-layers-inline");
        }
        if (this.options.className) {
          this._container.classList.add(...this.options.className.split(/\s+/).filter(Boolean));
        }
        return this._container;
      }
    });
  })();

  // node_modules/leaflet-minimap/dist/Control.MiniMap.min.js
  init_leaflet_compat();
  (function(factory, window2) {
    if (false) {
      define(["leaflet"], factory);
    } else if (false) {
      Control_MiniMap_min_module.exports = factory(null);
    }
    if (typeof window2 !== "undefined" && window2.L) {
      window2.L.Control.MiniMap = factory(leaflet_compat_default);
      window2.L.control.minimap = function(layer, options) {
        return new window2.L.Control.MiniMap(layer, options);
      };
    }
  })(function(L3) {
    var MiniMap = L3.Control.extend({ includes: L3.Evented ? L3.Mixin.Events : L3.Mixin.Events, options: { position: "bottomright", toggleDisplay: false, zoomLevelOffset: -5, zoomLevelFixed: false, centerFixed: false, zoomAnimation: false, autoToggleDisplay: false, minimized: false, width: 150, height: 150, collapsedWidth: 19, collapsedHeight: 19, aimingRectOptions: { color: "#ff7800", weight: 1, clickable: false }, shadowRectOptions: { color: "#000000", weight: 1, clickable: false, opacity: 0, fillOpacity: 0 }, strings: { hideText: "Hide MiniMap", showText: "Show MiniMap" }, mapOptions: {} }, initialize: function(layer, options) {
      L3.Util.setOptions(this, options);
      this.options.aimingRectOptions.clickable = false;
      this.options.shadowRectOptions.clickable = false;
      this._layer = layer;
    }, onAdd: function(map) {
      this._mainMap = map;
      this._container = L3.DomUtil.create("div", "leaflet-control-minimap");
      this._container.style.width = this.options.width + "px";
      this._container.style.height = this.options.height + "px";
      L3.DomEvent.disableClickPropagation(this._container);
      L3.DomEvent.on(this._container, "mousewheel", L3.DomEvent.stopPropagation);
      var mapOptions = { attributionControl: false, dragging: !this.options.centerFixed, zoomControl: false, zoomAnimation: this.options.zoomAnimation, autoToggleDisplay: this.options.autoToggleDisplay, touchZoom: this.options.centerFixed ? "center" : !this._isZoomLevelFixed(), scrollWheelZoom: this.options.centerFixed ? "center" : !this._isZoomLevelFixed(), doubleClickZoom: this.options.centerFixed ? "center" : !this._isZoomLevelFixed(), boxZoom: !this._isZoomLevelFixed(), crs: map.options.crs };
      mapOptions = L3.Util.extend(this.options.mapOptions, mapOptions);
      this._miniMap = new L3.Map(this._container, mapOptions);
      this._miniMap.addLayer(this._layer);
      this._mainMapMoving = false;
      this._miniMapMoving = false;
      this._userToggledDisplay = false;
      this._minimized = false;
      if (this.options.toggleDisplay) {
        this._addToggleButton();
      }
      this._miniMap.whenReady(L3.Util.bind(function() {
        this._aimingRect = L3.rectangle(this._mainMap.getBounds(), this.options.aimingRectOptions).addTo(this._miniMap);
        this._shadowRect = L3.rectangle(this._mainMap.getBounds(), this.options.shadowRectOptions).addTo(this._miniMap);
        this._mainMap.on("moveend", this._onMainMapMoved, this);
        this._mainMap.on("move", this._onMainMapMoving, this);
        this._miniMap.on("movestart", this._onMiniMapMoveStarted, this);
        this._miniMap.on("move", this._onMiniMapMoving, this);
        this._miniMap.on("moveend", this._onMiniMapMoved, this);
      }, this));
      return this._container;
    }, addTo: function(map) {
      L3.Control.prototype.addTo.call(this, map);
      var center = this.options.centerFixed || this._mainMap.getCenter();
      this._miniMap.setView(center, this._decideZoom(true));
      this._setDisplay(this.options.minimized);
      return this;
    }, onRemove: function(map) {
      this._mainMap.off("moveend", this._onMainMapMoved, this);
      this._mainMap.off("move", this._onMainMapMoving, this);
      this._miniMap.off("moveend", this._onMiniMapMoved, this);
      this._miniMap.removeLayer(this._layer);
    }, changeLayer: function(layer) {
      this._miniMap.removeLayer(this._layer);
      this._layer = layer;
      this._miniMap.addLayer(this._layer);
    }, _addToggleButton: function() {
      this._toggleDisplayButton = this.options.toggleDisplay ? this._createButton("", this._toggleButtonInitialTitleText(), "leaflet-control-minimap-toggle-display leaflet-control-minimap-toggle-display-" + this.options.position, this._container, this._toggleDisplayButtonClicked, this) : void 0;
      this._toggleDisplayButton.style.width = this.options.collapsedWidth + "px";
      this._toggleDisplayButton.style.height = this.options.collapsedHeight + "px";
    }, _toggleButtonInitialTitleText: function() {
      if (this.options.minimized) {
        return this.options.strings.showText;
      } else {
        return this.options.strings.hideText;
      }
    }, _createButton: function(html, title, className, container, fn, context) {
      var link = L3.DomUtil.create("a", className, container);
      link.innerHTML = html;
      link.href = "#";
      link.title = title;
      var stop = L3.DomEvent.stopPropagation;
      L3.DomEvent.on(link, "click", stop).on(link, "mousedown", stop).on(link, "dblclick", stop).on(link, "click", L3.DomEvent.preventDefault).on(link, "click", fn, context);
      return link;
    }, _toggleDisplayButtonClicked: function() {
      this._userToggledDisplay = true;
      if (!this._minimized) {
        this._minimize();
      } else {
        this._restore();
      }
    }, _setDisplay: function(minimize) {
      if (minimize !== this._minimized) {
        if (!this._minimized) {
          this._minimize();
        } else {
          this._restore();
        }
      }
    }, _minimize: function() {
      if (this.options.toggleDisplay) {
        this._container.style.width = this.options.collapsedWidth + "px";
        this._container.style.height = this.options.collapsedHeight + "px";
        this._toggleDisplayButton.className += " minimized-" + this.options.position;
        this._toggleDisplayButton.title = this.options.strings.showText;
      } else {
        this._container.style.display = "none";
      }
      this._minimized = true;
      this._onToggle();
    }, _restore: function() {
      if (this.options.toggleDisplay) {
        this._container.style.width = this.options.width + "px";
        this._container.style.height = this.options.height + "px";
        this._toggleDisplayButton.className = this._toggleDisplayButton.className.replace("minimized-" + this.options.position, "");
        this._toggleDisplayButton.title = this.options.strings.hideText;
      } else {
        this._container.style.display = "block";
      }
      this._minimized = false;
      this._onToggle();
    }, _onMainMapMoved: function(e) {
      if (!this._miniMapMoving) {
        var center = this.options.centerFixed || this._mainMap.getCenter();
        this._mainMapMoving = true;
        this._miniMap.setView(center, this._decideZoom(true));
        this._setDisplay(this._decideMinimized());
      } else {
        this._miniMapMoving = false;
      }
      this._aimingRect.setBounds(this._mainMap.getBounds());
    }, _onMainMapMoving: function(e) {
      this._aimingRect.setBounds(this._mainMap.getBounds());
    }, _onMiniMapMoveStarted: function(e) {
      if (!this.options.centerFixed) {
        var lastAimingRect = this._aimingRect.getBounds();
        var sw = this._miniMap.latLngToContainerPoint(lastAimingRect.getSouthWest());
        var ne = this._miniMap.latLngToContainerPoint(lastAimingRect.getNorthEast());
        this._lastAimingRectPosition = { sw, ne };
      }
    }, _onMiniMapMoving: function(e) {
      if (!this.options.centerFixed) {
        if (!this._mainMapMoving && this._lastAimingRectPosition) {
          this._shadowRect.setBounds(new L3.LatLngBounds(this._miniMap.containerPointToLatLng(this._lastAimingRectPosition.sw), this._miniMap.containerPointToLatLng(this._lastAimingRectPosition.ne)));
          this._shadowRect.setStyle({ opacity: 1, fillOpacity: 0.3 });
        }
      }
    }, _onMiniMapMoved: function(e) {
      if (!this._mainMapMoving) {
        this._miniMapMoving = true;
        this._mainMap.setView(this._miniMap.getCenter(), this._decideZoom(false));
        this._shadowRect.setStyle({ opacity: 0, fillOpacity: 0 });
      } else {
        this._mainMapMoving = false;
      }
    }, _isZoomLevelFixed: function() {
      var zoomLevelFixed = this.options.zoomLevelFixed;
      return this._isDefined(zoomLevelFixed) && this._isInteger(zoomLevelFixed);
    }, _decideZoom: function(fromMaintoMini) {
      if (!this._isZoomLevelFixed()) {
        if (fromMaintoMini) {
          return this._mainMap.getZoom() + this.options.zoomLevelOffset;
        } else {
          var currentDiff = this._miniMap.getZoom() - this._mainMap.getZoom();
          var proposedZoom = this._miniMap.getZoom() - this.options.zoomLevelOffset;
          var toRet;
          if (currentDiff > this.options.zoomLevelOffset && this._mainMap.getZoom() < this._miniMap.getMinZoom() - this.options.zoomLevelOffset) {
            if (this._miniMap.getZoom() > this._lastMiniMapZoom) {
              toRet = this._mainMap.getZoom() + 1;
              this._miniMap.setZoom(this._miniMap.getZoom() - 1);
            } else {
              toRet = this._mainMap.getZoom();
            }
          } else {
            toRet = proposedZoom;
          }
          this._lastMiniMapZoom = this._miniMap.getZoom();
          return toRet;
        }
      } else {
        if (fromMaintoMini) {
          return this.options.zoomLevelFixed;
        } else {
          return this._mainMap.getZoom();
        }
      }
    }, _decideMinimized: function() {
      if (this._userToggledDisplay) {
        return this._minimized;
      }
      if (this.options.autoToggleDisplay) {
        if (this._mainMap.getBounds().contains(this._miniMap.getBounds())) {
          return true;
        }
        return false;
      }
      return this._minimized;
    }, _isInteger: function(value) {
      return typeof value === "number";
    }, _isDefined: function(value) {
      return typeof value !== "undefined";
    }, _onToggle: function() {
      L3.Util.requestAnimFrame(function() {
        L3.DomEvent.on(this._container, "transitionend", this._fireToggleEvents, this);
        if (!L3.Browser.any3d) {
          L3.Util.requestAnimFrame(this._fireToggleEvents, this);
        }
      }, this);
    }, _fireToggleEvents: function() {
      L3.DomEvent.off(this._container, "transitionend", this._fireToggleEvents, this);
      var data = { minimized: this._minimized };
      this.fire(this._minimized ? "minimize" : "restore", data);
      this.fire("toggle", data);
    } });
    L3.Map.mergeOptions({ miniMapControl: false });
    L3.Map.addInitHook(function() {
      if (this.options.miniMapControl) {
        this.miniMapControl = new MiniMap().addTo(this);
      }
    });
    return MiniMap;
  }, window);

  // node_modules/leaflet-loading/src/Control.Loading.js
  init_leaflet_compat();
  (function() {
    var console2 = window.console || {
      error: function() {
      },
      warn: function() {
      }
    };
    function defineLeafletLoading(L3) {
      L3.Control.Loading = L3.Control.extend({
        options: {
          delayIndicator: null,
          position: "topleft",
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
          L3.setOptions(this, options);
          this._dataLoaders = {};
          if (this.options.zoomControl !== null) {
            this.zoomControl = this.options.zoomControl;
          }
        },
        onAdd: function(map) {
          if (this.options.spinjs && typeof Spinner !== "function") {
            return console2.error("Leaflet.loading cannot load because you didn't load spin.js (http://fgnass.github.io/spin.js/), even though you set it in options.");
          }
          this._addLayerListeners(map);
          this._addMapListeners(map);
          if (!this.options.separate && !this.zoomControl) {
            if (map.zoomControl) {
              this.zoomControl = map.zoomControl;
            } else if (map.zoomsliderControl) {
              this.zoomControl = map.zoomsliderControl;
            }
          }
          var classes = "leaflet-control-loading";
          var container;
          if (this.zoomControl && !this.options.separate) {
            container = this.zoomControl._container;
            classes += " leaflet-bar-part-bottom leaflet-bar-part last";
            L3.DomUtil.addClass(this._getLastControlButton(), "leaflet-bar-part-bottom");
          } else {
            container = L3.DomUtil.create("div", "leaflet-control-zoom leaflet-control-layer-container leaflet-bar");
          }
          this._indicatorContainer = container;
          this._indicator = L3.DomUtil.create("a", classes, container);
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
        removeFrom: function(map) {
          if (this.zoomControl && !this.options.separate) {
            this._container.removeChild(this._indicator);
            this._map = null;
            this.onRemove(map);
            return this;
          } else {
            return L3.Control.prototype.removeFrom.call(this, map);
          }
        },
        addLoader: function(id) {
          this._dataLoaders[id] = true;
          if (this.options.delayIndicator && !this.delayIndicatorTimeout) {
            var that = this;
            this.delayIndicatorTimeout = setTimeout(function() {
              that.updateIndicator();
              that.delayIndicatorTimeout = null;
            }, this.options.delayIndicator);
          } else {
            this.updateIndicator();
          }
        },
        removeLoader: function(id) {
          delete this._dataLoaders[id];
          this.updateIndicator();
          if (this.options.delayIndicator && this.delayIndicatorTimeout && !this.isLoading()) {
            clearTimeout(this.delayIndicatorTimeout);
            this.delayIndicatorTimeout = null;
          }
        },
        updateIndicator: function() {
          if (this.isLoading()) {
            this._showIndicator();
          } else {
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
          L3.DomUtil.addClass(this._indicator, "is-loading");
          L3.DomUtil.addClass(this._indicatorContainer, "is-loading");
          if (!this.options.separate) {
            if (this.zoomControl instanceof L3.Control.Zoom) {
              L3.DomUtil.removeClass(this._getLastControlButton(), "leaflet-bar-part-bottom");
            } else if (typeof L3.Control.Zoomslider === "function" && this.zoomControl instanceof L3.Control.Zoomslider) {
              L3.DomUtil.removeClass(this.zoomControl._ui.zoomOut, "leaflet-bar-part-bottom");
            }
          }
        },
        _hideIndicator: function() {
          L3.DomUtil.removeClass(this._indicator, "is-loading");
          L3.DomUtil.removeClass(this._indicatorContainer, "is-loading");
          if (!this.options.separate) {
            if (this.zoomControl instanceof L3.Control.Zoom) {
              L3.DomUtil.addClass(this._getLastControlButton(), "leaflet-bar-part-bottom");
            } else if (typeof L3.Control.Zoomslider === "function" && this.zoomControl instanceof L3.Control.Zoomslider) {
              L3.DomUtil.addClass(this.zoomControl._ui.zoomOut, "leaflet-bar-part-bottom");
            }
          }
        },
        _getLastControlButton: function() {
          var container = this.zoomControl._container, index = container.children.length - 1;
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
        _handleBaseLayerChange: function(e) {
          var that = this;
          if (e.layer && e.layer.eachLayer && typeof e.layer.eachLayer === "function") {
            e.layer.eachLayer(function(layer) {
              that._handleBaseLayerChange({ layer });
            });
          } else {
            if (!(L3.TileLayer.Canvas && e.layer instanceof L3.TileLayer.Canvas)) {
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
          } else if (e.layer) {
            return e.layer._leaflet_id;
          }
          return e.target._leaflet_id;
        },
        _layerAdd: function(e) {
          if (!e.layer || !e.layer.on) return;
          try {
            e.layer.on({
              loading: this._handleLoading,
              load: this._handleLoad
            }, this);
          } catch (exception) {
            console2.warn("L.Control.Loading: Tried and failed to add  event handlers to layer", e.layer);
            console2.warn("L.Control.Loading: Full details", exception);
          }
        },
        _layerRemove: function(e) {
          if (!e.layer || !e.layer.off) return;
          try {
            e.layer.off({
              loading: this._handleLoading,
              load: this._handleLoad
            }, this);
          } catch (exception) {
            console2.warn("L.Control.Loading: Tried and failed to remove event handlers from layer", e.layer);
            console2.warn("L.Control.Loading: Full details", exception);
          }
        },
        _addLayerListeners: function(map) {
          map.eachLayer(function(layer) {
            if (!layer.on) return;
            layer.on({
              loading: this._handleLoading,
              load: this._handleLoad
            }, this);
          }, this);
          map.on("layeradd", this._layerAdd, this);
          map.on("layerremove", this._layerRemove, this);
        },
        _removeLayerListeners: function(map) {
          map.eachLayer(function(layer) {
            if (!layer.off) return;
            layer.off({
              loading: this._handleLoading,
              load: this._handleLoad
            }, this);
          }, this);
          map.off("layeradd", this._layerAdd, this);
          map.off("layerremove", this._layerRemove, this);
        },
        _addMapListeners: function(map) {
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
      L3.Map.addInitHook(function() {
        if (this.options.loadingControl) {
          this.loadingControl = new L3.Control.Loading();
          this.addControl(this.loadingControl);
        }
      });
      L3.Control.loading = function(options) {
        return new L3.Control.Loading(options);
      };
    }
    if (false) {
      define(["leaflet"], function(L3) {
        defineLeafletLoading(L3);
      });
    } else {
      defineLeafletLoading(leaflet_compat_default);
    }
  })();

  // node_modules/leaflet-search/dist/leaflet-search.src.js
  init_leaflet_compat();
  (function(factory) {
    if (false) {
      define(["leaflet"], factory);
    } else if (false) {
      leaflet_search_src_module.exports = factory(null);
    } else {
      if (typeof window.L === "undefined")
        throw "Leaflet must be loaded first";
      factory(leaflet_compat_default);
    }
  })(function(L3) {
    L3.Control.Search = L3.Control.extend({
      includes: L3.version[0] === "1" ? L3.Mixin.Events : L3.Mixin.Events,
      options: {
        url: "",
        //url for search by ajax request, ex: "search.php?q={s}". Can be function to returns string for dynamic parameter setting
        layer: null,
        //layer where search markers(is a L.LayerGroup)				
        sourceData: null,
        //function to fill _recordsCache, passed searching text by first param and callback in second				
        //TODO implements uniq option 'sourceData' to recognizes source type: url,array,callback or layer				
        jsonpParam: null,
        //jsonp param name for search by jsonp service, ex: "callback"
        propertyLoc: "loc",
        //field for remapping location, using array: ['latname','lonname'] for select double fields(ex. ['lat','lon'] ) support dotted format: 'prop.subprop.title'
        propertyName: "title",
        //property in marker.options(or feature.properties for vector layer) trough filter elements in layer,
        formatData: null,
        //callback for reformat all data from source to indexed data object
        filterData: null,
        //callback for filtering data from text searched, params: textSearch, allRecords
        moveToLocation: null,
        //callback run on location found, params: latlng, title, map
        buildTip: null,
        //function to return row tip html node(or html string), receive text tooltip in first param
        container: "",
        //container id to insert Search Control		
        zoom: null,
        //default zoom level for move to location
        minLength: 1,
        //minimal text length for autocomplete
        initial: true,
        //search elements only by initial text
        casesensitive: false,
        //search elements in case sensitive text
        autoType: true,
        //complete input with first suggested result and select this filled-in text.
        delayType: 400,
        //delay while typing for show tooltip
        tooltipLimit: -1,
        //limit max results to show in tooltip. -1 for no limit, 0 for no results
        tipAutoSubmit: true,
        //auto map panTo when click on tooltip
        firstTipSubmit: false,
        //auto select first result con enter click
        autoResize: true,
        //autoresize on input change
        collapsed: true,
        //collapse search control at startup
        autoCollapse: false,
        //collapse search control after submit(on button or on tips if enabled tipAutoSubmit)
        autoCollapseTime: 1200,
        //delay for autoclosing alert and collapse after blur
        textErr: "Location not found",
        //error message
        textCancel: "Cancel",
        //title in cancel button		
        textPlaceholder: "Search...",
        //placeholder value			
        hideMarkerOnCollapse: false,
        //remove circle and marker on search control collapsed		
        position: "topleft",
        marker: {
          //custom L.Marker or false for hide
          icon: false,
          //custom L.Icon for maker location or false for hide
          animate: true,
          //animate a circle over location found
          circle: {
            //draw a circle in location found
            radius: 10,
            weight: 3,
            color: "#e03",
            stroke: true,
            fill: false
          }
        }
      },
      _getPath: function(obj, prop) {
        var parts = prop.split("."), last = parts.pop(), len = parts.length, cur = parts[0], i = 1;
        if (len > 0)
          while ((obj = obj[cur]) && i < len)
            cur = parts[i++];
        if (obj)
          return obj[last];
      },
      _isObject: function(obj) {
        return Object.prototype.toString.call(obj) === "[object Object]";
      },
      initialize: function(options) {
        L3.Util.setOptions(this, options || {});
        this._inputMinSize = this.options.textPlaceholder ? this.options.textPlaceholder.length : 10;
        this._layer = this.options.layer || new L3.LayerGroup();
        this._filterData = this.options.filterData || this._defaultFilterData;
        this._formatData = this.options.formatData || this._defaultFormatData;
        this._moveToLocation = this.options.moveToLocation || this._defaultMoveToLocation;
        this._autoTypeTmp = this.options.autoType;
        this._countertips = 0;
        this._recordsCache = {};
        this._curReq = null;
      },
      onAdd: function(map) {
        this._map = map;
        this._container = L3.DomUtil.create("div", "leaflet-control-search");
        this._input = this._createInput(this.options.textPlaceholder, "search-input");
        this._tooltip = this._createTooltip("search-tooltip");
        this._cancel = this._createCancel(this.options.textCancel, "search-cancel");
        this._button = this._createButton(this.options.textPlaceholder, "search-button");
        this._alert = this._createAlert("search-alert");
        if (this.options.collapsed === false)
          this.expand(this.options.collapsed);
        if (this.options.marker) {
          if (this.options.marker instanceof L3.Marker || this.options.marker instanceof L3.CircleMarker)
            this._markerSearch = this.options.marker;
          else if (this._isObject(this.options.marker))
            this._markerSearch = new L3.Control.Search.Marker([0, 0], this.options.marker);
          this._markerSearch._isMarkerSearch = true;
        }
        this.setLayer(this._layer);
        map.on({
          // 		'layeradd': this._onLayerAddRemove,
          // 		'layerremove': this._onLayerAddRemove
          "resize": this._handleAutoresize
        }, this);
        return this._container;
      },
      addTo: function(map) {
        if (this.options.container) {
          this._container = this.onAdd(map);
          this._wrapper = L3.DomUtil.get(this.options.container);
          this._wrapper.style.position = "relative";
          this._wrapper.appendChild(this._container);
        } else
          L3.Control.prototype.addTo.call(this, map);
        return this;
      },
      onRemove: function(map) {
        this._recordsCache = {};
        map.off({
          // 		'layeradd': this._onLayerAddRemove,
          // 		'layerremove': this._onLayerAddRemove
          "resize": this._handleAutoresize
        }, this);
      },
      // _onLayerAddRemove: function(e) {
      // 	//without this, run setLayer also for each Markers!! to optimize!
      // 	if(e.layer instanceof L.LayerGroup)
      // 		if( L.stamp(e.layer) != L.stamp(this._layer) )
      // 			this.setLayer(e.layer);
      // },
      setLayer: function(layer) {
        this._layer = layer;
        this._layer.addTo(this._map);
        return this;
      },
      showAlert: function(text) {
        var self2 = this;
        text = text || this.options.textErr;
        this._alert.style.display = "block";
        this._alert.innerHTML = text;
        clearTimeout(this.timerAlert);
        this.timerAlert = setTimeout(function() {
          self2.hideAlert();
        }, this.options.autoCollapseTime);
        return this;
      },
      hideAlert: function() {
        this._alert.style.display = "none";
        return this;
      },
      cancel: function() {
        this._input.value = "";
        this._handleKeypress({ keyCode: 8 });
        this._input.size = this._inputMinSize;
        this._input.focus();
        this._cancel.style.display = "none";
        this._hideTooltip();
        this.fire("search:cancel");
        return this;
      },
      expand: function(toggle) {
        toggle = typeof toggle === "boolean" ? toggle : true;
        this._input.style.display = "block";
        L3.DomUtil.addClass(this._container, "search-exp");
        if (toggle !== false) {
          this._input.focus();
          this._map.on("dragstart click", this.collapse, this);
        }
        this.fire("search:expanded");
        return this;
      },
      collapse: function() {
        this._hideTooltip();
        this.cancel();
        this._alert.style.display = "none";
        this._input.blur();
        if (this.options.collapsed) {
          this._input.style.display = "none";
          this._cancel.style.display = "none";
          L3.DomUtil.removeClass(this._container, "search-exp");
          if (this.options.hideMarkerOnCollapse) {
            this._map.removeLayer(this._markerSearch);
          }
          this._map.off("dragstart click", this.collapse, this);
        }
        this.fire("search:collapsed");
        return this;
      },
      collapseDelayed: function() {
        var self2 = this;
        if (!this.options.autoCollapse) return this;
        clearTimeout(this.timerCollapse);
        this.timerCollapse = setTimeout(function() {
          self2.collapse();
        }, this.options.autoCollapseTime);
        return this;
      },
      collapseDelayedStop: function() {
        clearTimeout(this.timerCollapse);
        return this;
      },
      ////start DOM creations
      _createAlert: function(className) {
        var alert2 = L3.DomUtil.create("div", className, this._container);
        alert2.style.display = "none";
        L3.DomEvent.on(alert2, "click", L3.DomEvent.stop, this).on(alert2, "click", this.hideAlert, this);
        return alert2;
      },
      _createInput: function(text, className) {
        var self2 = this;
        var label = L3.DomUtil.create("label", className, this._container);
        var input = L3.DomUtil.create("input", className, this._container);
        input.type = "text";
        input.size = this._inputMinSize;
        input.value = "";
        input.autocomplete = "off";
        input.autocorrect = "off";
        input.autocapitalize = "off";
        input.placeholder = text;
        input.style.display = "none";
        input.role = "search";
        input.id = input.role + input.type + input.size;
        label.htmlFor = input.id;
        label.style.display = "none";
        label.value = text;
        L3.DomEvent.disableClickPropagation(input).on(input, "keyup", this._handleKeypress, this).on(input, "paste", function(e) {
          setTimeout(function(e2) {
            self2._handleKeypress(e2);
          }, 10, e);
        }, this).on(input, "blur", this.collapseDelayed, this).on(input, "focus", this.collapseDelayedStop, this);
        return input;
      },
      _createCancel: function(title, className) {
        var cancel = L3.DomUtil.create("a", className, this._container);
        cancel.href = "#";
        cancel.title = title;
        cancel.style.display = "none";
        cancel.innerHTML = "<span>&otimes;</span>";
        L3.DomEvent.on(cancel, "click", L3.DomEvent.stop, this).on(cancel, "click", this.cancel, this);
        return cancel;
      },
      _createButton: function(title, className) {
        var button = L3.DomUtil.create("a", className, this._container);
        button.href = "#";
        button.title = title;
        L3.DomEvent.on(button, "click", L3.DomEvent.stop, this).on(button, "click", this._handleSubmit, this).on(button, "focus", this.collapseDelayedStop, this).on(button, "blur", this.collapseDelayed, this);
        return button;
      },
      _createTooltip: function(className) {
        var self2 = this;
        var tool = L3.DomUtil.create("ul", className, this._container);
        tool.style.display = "none";
        L3.DomEvent.disableClickPropagation(tool).on(tool, "blur", this.collapseDelayed, this).on(tool, "wheel", function(e) {
          self2.collapseDelayedStop();
          L3.DomEvent.stopPropagation(e);
        }, this).on(tool, "mouseover", function(e) {
          self2.collapseDelayedStop();
        }, this);
        return tool;
      },
      _createTip: function(text, val) {
        var tip;
        if (this.options.buildTip) {
          tip = this.options.buildTip.call(this, text, val);
          if (typeof tip === "string") {
            var tmpNode = L3.DomUtil.create("div");
            tmpNode.innerHTML = tip;
            tip = tmpNode.firstChild;
          }
        } else {
          tip = L3.DomUtil.create("li", "");
          tip.innerHTML = text;
        }
        L3.DomUtil.addClass(tip, "search-tip");
        tip._text = text;
        if (this.options.tipAutoSubmit)
          L3.DomEvent.disableClickPropagation(tip).on(tip, "click", L3.DomEvent.stop, this).on(tip, "click", function(e) {
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
        return typeof this.options.url === "function" ? this.options.url(text) : this.options.url;
      },
      _defaultFilterData: function(text, records) {
        var init, icase, regSearch, frecords = {};
        text = text.replace(/[.*+?^${}()|[\]\\]/g, "");
        if (text === "") {
          return [];
        }
        init = this.options.initial ? "^" : "";
        icase = !this.options.casesensitive ? "i" : void 0;
        regSearch = new RegExp(init + text, icase);
        for (let key in records) {
          if (regSearch.test(key)) {
            frecords[key] = records[key];
          }
        }
        return frecords;
      },
      showTooltip: function(records) {
        this._countertips = 0;
        this._tooltip.innerHTML = "";
        this._tooltip.currentSelection = -1;
        if (this.options.tooltipLimit) {
          for (let key in records) {
            if (this._countertips === this.options.tooltipLimit) {
              break;
            }
            this._countertips++;
            this._tooltip.appendChild(this._createTip(key, records[key]));
          }
        }
        if (this._countertips > 0) {
          this._tooltip.style.display = "block";
          if (this._autoTypeTmp) {
            this._autoType();
          }
          this._autoTypeTmp = this.options.autoType;
        } else {
          this._hideTooltip();
        }
        this._tooltip.scrollTop = 0;
        return this._countertips;
      },
      _hideTooltip: function() {
        this._tooltip.style.display = "none";
        this._tooltip.innerHTML = "";
        return 0;
      },
      _defaultFormatData: function(json) {
        var self2 = this, propName = this.options.propertyName, propLoc = this.options.propertyLoc, jsonret = {};
        if (L3.Util.isArray(propLoc)) {
          for (let i in json) {
            jsonret[self2._getPath(json[i], propName)] = L3.latLng(self2._getPath(json[i], propLoc[0]), self2._getPath(json[i], propLoc[1]));
          }
        } else {
          for (let i in json) {
            jsonret[self2._getPath(json[i], propName)] = L3.latLng(self2._getPath(json[i], propLoc));
          }
        }
        return jsonret;
      },
      _recordsFromJsonp: function(text, callAfter) {
        L3.Control.Search.callJsonp = callAfter;
        var script = L3.DomUtil.create("script", "leaflet-search-jsonp", document.getElementsByTagName("body")[0]), url = L3.Util.template(this._getUrl(text) + "&" + this.options.jsonpParam + "=L.Control.Search.callJsonp", { s: text });
        script.type = "text/javascript";
        script.src = url;
        return { abort: function() {
          script.parentNode.removeChild(script);
        } };
      },
      _recordsFromAjax: function(text, callAfter) {
        if (window.XMLHttpRequest === void 0) {
          window.XMLHttpRequest = function() {
            try {
              return new ActiveXObject("Microsoft.XMLHTTP.6.0");
            } catch (e1) {
              try {
                return new ActiveXObject("Microsoft.XMLHTTP.3.0");
              } catch (e2) {
                throw new Error("XMLHttpRequest is not supported");
              }
            }
          };
        }
        var IE8or9 = L3.Browser.ie && !window.atob && document.querySelector, request = IE8or9 ? new XDomainRequest() : new XMLHttpRequest(), url = L3.Util.template(this._getUrl(text), { s: text });
        request.open("GET", url);
        request.onload = function() {
          callAfter(JSON.parse(request.responseText));
        };
        request.onreadystatechange = function() {
          if (request.readyState === 4 && request.status === 200) {
            this.onload();
          }
        };
        request.send();
        return request;
      },
      _searchInLayer: function(layer, retRecords, propName) {
        var self2 = this, loc;
        if (layer instanceof L3.Control.Search.Marker) return;
        if (layer instanceof L3.Marker || layer instanceof L3.CircleMarker) {
          if (self2._getPath(layer.options, propName)) {
            loc = layer.getLatLng();
            loc.layer = layer;
            retRecords[self2._getPath(layer.options, propName)] = loc;
          } else if (self2._getPath(layer.feature.properties, propName)) {
            loc = layer.getLatLng();
            loc.layer = layer;
            retRecords[self2._getPath(layer.feature.properties, propName)] = loc;
          } else {
          }
        } else if (layer instanceof L3.Path || layer instanceof L3.Polyline || layer instanceof L3.Polygon) {
          if (self2._getPath(layer.options, propName)) {
            loc = layer.getBounds().getCenter();
            loc.layer = layer;
            retRecords[self2._getPath(layer.options, propName)] = loc;
          } else if (self2._getPath(layer.feature.properties, propName)) {
            loc = layer.getBounds().getCenter();
            loc.layer = layer;
            retRecords[self2._getPath(layer.feature.properties, propName)] = loc;
          } else {
          }
        } else if (layer.hasOwnProperty("feature")) {
          if (layer.feature.properties.hasOwnProperty(propName)) {
            if (layer.getLatLng && typeof layer.getLatLng === "function") {
              loc = layer.getLatLng();
              loc.layer = layer;
              retRecords[layer.feature.properties[propName]] = loc;
            } else if (layer.getBounds && typeof layer.getBounds === "function") {
              loc = layer.getBounds().getCenter();
              loc.layer = layer;
              retRecords[layer.feature.properties[propName]] = loc;
            } else {
            }
          } else {
          }
        } else if (layer instanceof L3.LayerGroup) {
          layer.eachLayer(function(layer2) {
            self2._searchInLayer(layer2, retRecords, propName);
          });
        }
      },
      _recordsFromLayer: function() {
        var self2 = this, retRecords = {}, propName = this.options.propertyName;
        this._layer.eachLayer(function(layer) {
          self2._searchInLayer(layer, retRecords, propName);
        });
        return retRecords;
      },
      _autoType: function() {
        var start = this._input.value.length, firstRecord = this._tooltip.firstChild ? this._tooltip.firstChild._text : "", end = firstRecord.length;
        if (firstRecord.indexOf(this._input.value) === 0) {
          this._input.value = firstRecord;
          this._handleAutoresize();
          if (this._input.createTextRange) {
            var selRange = this._input.createTextRange();
            selRange.collapse(true);
            selRange.moveStart("character", start);
            selRange.moveEnd("character", end);
            selRange.select();
          } else if (this._input.setSelectionRange) {
            this._input.setSelectionRange(start, end);
          } else if (this._input.selectionStart) {
            this._input.selectionStart = start;
            this._input.selectionEnd = end;
          }
        }
      },
      _hideAutoType: function() {
        var sel;
        if ((sel = this._input.selection) && sel.empty) {
          sel.empty();
        } else if (this._input.createTextRange) {
          sel = this._input.createTextRange();
          sel.collapse(true);
          var end = this._input.value.length;
          sel.moveStart("character", end);
          sel.moveEnd("character", end);
          sel.select();
        } else {
          if (this._input.getSelection) {
            this._input.getSelection().removeAllRanges();
          }
          this._input.selectionStart = this._input.selectionEnd;
        }
      },
      _handleKeypress: function(e) {
        var self2 = this;
        switch (e.keyCode) {
          case 27:
            this.collapse();
            break;
          case 13:
            if (this._countertips == 1 || this.options.firstTipSubmit && this._countertips > 0) {
              if (this._tooltip.currentSelection == -1) {
                this._handleArrowSelect(1);
              }
            }
            this._handleSubmit();
            break;
          case 38:
            this._handleArrowSelect(-1);
            break;
          case 40:
            this._handleArrowSelect(1);
            break;
          case 8:
          //Backspace
          case 45:
          //Insert
          case 46:
            this._autoTypeTmp = false;
            break;
          case 37:
          //Left
          case 39:
          //Right
          case 16:
          //Shift
          case 17:
          //Ctrl
          case 35:
          //End
          case 36:
            break;
          default:
            if (this._input.value.length)
              this._cancel.style.display = "block";
            else
              this._cancel.style.display = "none";
            if (this._input.value.length >= this.options.minLength) {
              clearTimeout(this.timerKeypress);
              this.timerKeypress = setTimeout(function() {
                self2._fillRecordsCache();
              }, this.options.delayType);
            } else
              this._hideTooltip();
        }
        this._handleAutoresize();
      },
      searchText: function(text) {
        var code = text.charCodeAt(text.length);
        this._input.value = text;
        this._input.style.display = "block";
        L3.DomUtil.addClass(this._container, "search-exp");
        this._autoTypeTmp = false;
        this._handleKeypress({ keyCode: code });
      },
      _fillRecordsCache: function() {
        var self2 = this, inputText = this._input.value, records;
        if (this._curReq && this._curReq.abort)
          this._curReq.abort();
        L3.DomUtil.addClass(this._container, "search-load");
        if (this.options.layer) {
          this._recordsCache = this._recordsFromLayer();
          records = this._filterData(this._input.value, this._recordsCache);
          this.showTooltip(records);
          L3.DomUtil.removeClass(this._container, "search-load");
        } else {
          if (this.options.sourceData)
            this._retrieveData = this.options.sourceData;
          else if (this.options.url)
            this._retrieveData = this.options.jsonpParam ? this._recordsFromJsonp : this._recordsFromAjax;
          this._curReq = this._retrieveData.call(this, inputText, function(data) {
            self2._recordsCache = self2._formatData.call(self2, data);
            if (self2.options.sourceData)
              records = self2._filterData(self2._input.value, self2._recordsCache);
            else
              records = self2._recordsCache;
            self2.showTooltip(records);
            L3.DomUtil.removeClass(self2._container, "search-load");
          });
        }
      },
      _handleAutoresize: function() {
        var maxWidth;
        if (this._input.style.maxWidth !== this._map._container.offsetWidth) {
          maxWidth = this._map._container.clientWidth;
          maxWidth -= 10 + 20 + 1 + 30 + 22;
          this._input.style.maxWidth = maxWidth.toString() + "px";
        }
        if (this.options.autoResize && this._container.offsetWidth + 20 < this._map._container.offsetWidth) {
          this._input.size = this._input.value.length < this._inputMinSize ? this._inputMinSize : this._input.value.length;
        }
      },
      _handleArrowSelect: function(velocity) {
        var searchTips = this._tooltip.hasChildNodes() ? this._tooltip.childNodes : [];
        for (let i = 0; i < searchTips.length; i++) {
          L3.DomUtil.removeClass(searchTips[i], "search-tip-select");
        }
        if (velocity == 1 && this._tooltip.currentSelection >= searchTips.length - 1) {
          L3.DomUtil.addClass(searchTips[this._tooltip.currentSelection], "search-tip-select");
        } else if (velocity == -1 && this._tooltip.currentSelection <= 0) {
          this._tooltip.currentSelection = -1;
        } else if (this._tooltip.style.display != "none") {
          this._tooltip.currentSelection += velocity;
          L3.DomUtil.addClass(searchTips[this._tooltip.currentSelection], "search-tip-select");
          this._input.value = searchTips[this._tooltip.currentSelection]._text;
          var tipOffsetTop = searchTips[this._tooltip.currentSelection].offsetTop;
          if (tipOffsetTop + searchTips[this._tooltip.currentSelection].clientHeight >= this._tooltip.scrollTop + this._tooltip.clientHeight) {
            this._tooltip.scrollTop = tipOffsetTop - this._tooltip.clientHeight + searchTips[this._tooltip.currentSelection].clientHeight;
          } else if (tipOffsetTop <= this._tooltip.scrollTop) {
            this._tooltip.scrollTop = tipOffsetTop;
          }
        }
      },
      _handleSubmit: function() {
        this._hideAutoType();
        this.hideAlert();
        this._hideTooltip();
        if (this._input.style.display == "none")
          this.expand();
        else {
          if (this._input.value === "")
            this.collapse();
          else {
            var loc = this._getLocation(this._input.value);
            if (!loc) {
              this.showAlert();
            } else {
              this.showLocation(loc, this._input.value);
              this.fire("search:locationfound", {
                latlng: loc,
                text: this._input.value,
                layer: loc.layer ? loc.layer : null
              });
            }
          }
        }
      },
      _getLocation: function(key) {
        if (this._recordsCache.hasOwnProperty(key))
          return this._recordsCache[key];
        else
          return false;
      },
      _defaultMoveToLocation: function(latlng, title, map) {
        if (this.options.zoom)
          this._map.setView(latlng, this.options.zoom);
        else
          this._map.panTo(latlng);
      },
      showLocation: function(latlng, title) {
        var self2 = this;
        self2._map.once("moveend zoomend", function(e) {
          if (self2._markerSearch) {
            self2._markerSearch.addTo(self2._map).setLatLng(latlng);
          }
        });
        self2._moveToLocation(latlng, title, self2._map);
        if (self2.options.autoCollapse)
          self2.collapse();
        return self2;
      }
    });
    L3.Control.Search.Marker = L3.Marker.extend({
      includes: L3.version[0] === "1" ? L3.Mixin.Events : L3.Mixin.Events,
      options: {
        icon: new L3.Icon.Default(),
        animate: true,
        circle: {
          radius: 10,
          weight: 3,
          color: "#e03",
          stroke: true,
          fill: false
        }
      },
      initialize: function(latlng, options) {
        L3.setOptions(this, options);
        if (options.icon === true)
          options.icon = new L3.Icon.Default();
        L3.Marker.prototype.initialize.call(this, latlng, options);
        if (L3.Control.Search.prototype._isObject(this.options.circle))
          this._circleLoc = new L3.CircleMarker(latlng, this.options.circle);
      },
      onAdd: function(map) {
        L3.Marker.prototype.onAdd.call(this, map);
        if (this._circleLoc) {
          map.addLayer(this._circleLoc);
          if (this.options.animate)
            this.animate();
        }
      },
      onRemove: function(map) {
        L3.Marker.prototype.onRemove.call(this, map);
        if (this._circleLoc)
          map.removeLayer(this._circleLoc);
      },
      setLatLng: function(latlng) {
        L3.Marker.prototype.setLatLng.call(this, latlng);
        if (this._circleLoc)
          this._circleLoc.setLatLng(latlng);
        return this;
      },
      _initIcon: function() {
        if (this.options.icon)
          L3.Marker.prototype._initIcon.call(this);
      },
      _removeIcon: function() {
        if (this.options.icon)
          L3.Marker.prototype._removeIcon.call(this);
      },
      animate: function() {
        if (this._circleLoc) {
          var circle = this._circleLoc, tInt = 200, ss = 5, mr = parseInt(circle._radius / ss), oldrad = this.options.circle.radius, newrad = circle._radius * 2, acc = 0;
          circle._timerAnimLoc = setInterval(function() {
            acc += 0.5;
            mr += acc;
            newrad -= mr;
            circle.setRadius(newrad);
            if (newrad < oldrad) {
              clearInterval(circle._timerAnimLoc);
              circle.setRadius(oldrad);
            }
          }, tInt);
        }
        return this;
      }
    });
    L3.Map.addInitHook(function() {
      if (this.options.searchControl) {
        this.searchControl = L3.control.search(this.options.searchControl);
        this.addControl(this.searchControl);
      }
    });
    L3.control.search = function(options) {
      return new L3.Control.Search(options);
    };
    return L3.Control.Search;
  });

  // node_modules/leaflet-easyprint/dist/bundle.js
  init_leaflet_compat();
  !(function(t, e) {
    false ? e() : false ? define(e) : e();
  })(0, function() {
    "use strict";
    function t(t2, e2) {
      return e2 = { exports: {} }, t2(e2, e2.exports), e2.exports;
    }
    var e = "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : {}, n = t(function(t2) {
      !(function(e2) {
        function n2(t3, e3) {
          function n3(t4) {
            return e3.bgcolor && (t4.style.backgroundColor = e3.bgcolor), e3.width && (t4.style.width = e3.width + "px"), e3.height && (t4.style.height = e3.height + "px"), e3.style && Object.keys(e3.style).forEach(function(n4) {
              t4.style[n4] = e3.style[n4];
            }), t4;
          }
          return e3 = e3 || {}, s(e3), Promise.resolve(t3).then(function(t4) {
            return u(t4, e3.filter, true);
          }).then(c).then(d).then(n3).then(function(n4) {
            return g(n4, e3.width || h.width(t3), e3.height || h.height(t3));
          });
        }
        function i2(t3, e3) {
          return l(t3, e3 || {}).then(function(e4) {
            return e4.getContext("2d").getImageData(0, 0, h.width(t3), h.height(t3)).data;
          });
        }
        function o(t3, e3) {
          return l(t3, e3 || {}).then(function(t4) {
            return t4.toDataURL();
          });
        }
        function r(t3, e3) {
          return e3 = e3 || {}, l(t3, e3).then(function(t4) {
            return t4.toDataURL("image/jpeg", e3.quality || 1);
          });
        }
        function a(t3, e3) {
          return l(t3, e3 || {}).then(h.canvasToBlob);
        }
        function s(t3) {
          void 0 === t3.imagePlaceholder ? w.impl.options.imagePlaceholder = M.imagePlaceholder : w.impl.options.imagePlaceholder = t3.imagePlaceholder, void 0 === t3.cacheBust ? w.impl.options.cacheBust = M.cacheBust : w.impl.options.cacheBust = t3.cacheBust;
        }
        function l(t3, e3) {
          function i3(t4) {
            var n3 = document.createElement("canvas");
            if (n3.width = e3.width || h.width(t4), n3.height = e3.height || h.height(t4), e3.bgcolor) {
              var i4 = n3.getContext("2d");
              i4.fillStyle = e3.bgcolor, i4.fillRect(0, 0, n3.width, n3.height);
            }
            return n3;
          }
          return n2(t3, e3).then(h.makeImage).then(h.delay(100)).then(function(e4) {
            var n3 = i3(t3);
            return n3.getContext("2d").drawImage(e4, 0, 0), n3;
          });
        }
        function u(t3, e3, n3) {
          function i3(t4) {
            return t4 instanceof HTMLCanvasElement ? h.makeImage(t4.toDataURL()) : t4.cloneNode(false);
          }
          function o2(t4, e4, n4) {
            var i4 = t4.childNodes;
            return 0 === i4.length ? Promise.resolve(e4) : (function(t5, e5, n5) {
              var i5 = Promise.resolve();
              return e5.forEach(function(e6) {
                i5 = i5.then(function() {
                  return u(e6, n5);
                }).then(function(e7) {
                  e7 && t5.appendChild(e7);
                });
              }), i5;
            })(e4, h.asArray(i4), n4).then(function() {
              return e4;
            });
          }
          function r2(t4, e4) {
            function n4() {
              !(function(t5, e5) {
                t5.cssText ? e5.cssText = t5.cssText : (function(t6, e6) {
                  h.asArray(t6).forEach(function(n5) {
                    e6.setProperty(n5, t6.getPropertyValue(n5), t6.getPropertyPriority(n5));
                  });
                })(t5, e5);
              })(window.getComputedStyle(t4), e4.style);
            }
            function i4() {
              function n5(n6) {
                var i5 = window.getComputedStyle(t4, n6), o4 = i5.getPropertyValue("content");
                if ("" !== o4 && "none" !== o4) {
                  var r4 = h.uid();
                  e4.className = e4.className + " " + r4;
                  var a2 = document.createElement("style");
                  a2.appendChild((function(t5, e5, n7) {
                    var i6 = "." + t5 + ":" + e5, o5 = n7.cssText ? (function(t6) {
                      var e6 = t6.getPropertyValue("content");
                      return t6.cssText + " content: " + e6 + ";";
                    })(n7) : (function(t6) {
                      function e6(e7) {
                        return e7 + ": " + t6.getPropertyValue(e7) + (t6.getPropertyPriority(e7) ? " !important" : "");
                      }
                      return h.asArray(t6).map(e6).join("; ") + ";";
                    })(n7);
                    return document.createTextNode(i6 + "{" + o5 + "}");
                  })(r4, n6, i5)), e4.appendChild(a2);
                }
              }
              [":before", ":after"].forEach(function(t5) {
                n5(t5);
              });
            }
            function o3() {
              t4 instanceof HTMLTextAreaElement && (e4.innerHTML = t4.value), t4 instanceof HTMLInputElement && e4.setAttribute("value", t4.value);
            }
            function r3() {
              e4 instanceof SVGElement && (e4.setAttribute("xmlns", "http://www.w3.org/2000/svg"), e4 instanceof SVGRectElement && ["width", "height"].forEach(function(t5) {
                var n5 = e4.getAttribute(t5);
                n5 && e4.style.setProperty(t5, n5);
              }));
            }
            return e4 instanceof Element ? Promise.resolve().then(n4).then(i4).then(o3).then(r3).then(function() {
              return e4;
            }) : e4;
          }
          return n3 || !e3 || e3(t3) ? Promise.resolve(t3).then(i3).then(function(n4) {
            return o2(t3, n4, e3);
          }).then(function(e4) {
            return r2(t3, e4);
          }) : Promise.resolve();
        }
        function c(t3) {
          return p.resolveAll().then(function(e3) {
            var n3 = document.createElement("style");
            return t3.appendChild(n3), n3.appendChild(document.createTextNode(e3)), t3;
          });
        }
        function d(t3) {
          return f.inlineAll(t3).then(function() {
            return t3;
          });
        }
        function g(t3, e3, n3) {
          return Promise.resolve(t3).then(function(t4) {
            return t4.setAttribute("xmlns", "http://www.w3.org/1999/xhtml"), new XMLSerializer().serializeToString(t4);
          }).then((svg) => svg.replace(/%/g, "%25")).then(h.escapeXhtml).then(function(t4) {
            return '<foreignObject x="0" y="0" width="100%" height="100%">' + t4 + "</foreignObject>";
          }).then(function(t4) {
            return '<svg xmlns="http://www.w3.org/2000/svg" width="' + e3 + '" height="' + n3 + '">' + t4 + "</svg>";
          }).then(function(t4) {
            return "data:image/svg+xml;charset=utf-8," + t4;
          });
        }
        var h = /* @__PURE__ */ (function() {
          function t3() {
            var t4 = "application/font-woff", e4 = "image/jpeg";
            return { woff: t4, woff2: t4, ttf: "application/font-truetype", eot: "application/vnd.ms-fontobject", png: "image/png", jpg: e4, jpeg: e4, gif: "image/gif", tiff: "image/tiff", svg: "image/svg+xml" };
          }
          function e3(t4) {
            var e4 = /\.([^\.\/]*?)$/g.exec(t4);
            return e4 ? e4[1] : "";
          }
          function n3(n4) {
            var i4 = e3(n4).toLowerCase();
            return t3()[i4] || "";
          }
          function i3(t4) {
            return -1 !== t4.search(/^(data:)/);
          }
          function o2(t4) {
            return new Promise(function(e4) {
              for (var n4 = window.atob(t4.toDataURL().split(",")[1]), i4 = n4.length, o3 = new Uint8Array(i4), r3 = 0; r3 < i4; r3++) o3[r3] = n4.charCodeAt(r3);
              e4(new Blob([o3], { type: "image/png" }));
            });
          }
          function r2(t4) {
            return t4.toBlob ? new Promise(function(e4) {
              t4.toBlob(e4);
            }) : o2(t4);
          }
          function a2(t4, e4) {
            var n4 = document.implementation.createHTMLDocument(), i4 = n4.createElement("base");
            n4.head.appendChild(i4);
            var o3 = n4.createElement("a");
            return n4.body.appendChild(o3), i4.href = e4, o3.href = t4, o3.href;
          }
          function s2(t4) {
            return new Promise(function(e4, n4) {
              var i4 = new Image();
              i4.onload = function() {
                e4(i4);
              }, i4.onerror = n4, i4.src = t4;
            });
          }
          function l2(t4) {
            var e4 = 3e4;
            return w.impl.options.cacheBust && (t4 += (/\?/.test(t4) ? "&" : "?") + (/* @__PURE__ */ new Date()).getTime()), new Promise(function(n4) {
              function i4() {
                if (4 === a3.readyState) {
                  if (200 !== a3.status) return void (s3 ? n4(s3) : r3("cannot fetch resource: " + t4 + ", status: " + a3.status));
                  var e5 = new FileReader();
                  e5.onloadend = function() {
                    var t5 = e5.result.split(/,/)[1];
                    n4(t5);
                  }, e5.readAsDataURL(a3.response);
                }
              }
              function o3() {
                s3 ? n4(s3) : r3("timeout of " + e4 + "ms occured while fetching resource: " + t4);
              }
              function r3(t5) {
                console.error(t5), n4("");
              }
              var a3 = new XMLHttpRequest();
              a3.onreadystatechange = i4, a3.ontimeout = o3, a3.responseType = "blob", a3.timeout = e4, a3.open("GET", t4, true), a3.send();
              var s3;
              if (w.impl.options.imagePlaceholder) {
                var l3 = w.impl.options.imagePlaceholder.split(/,/);
                l3 && l3[1] && (s3 = l3[1]);
              }
            });
          }
          function u2(t4, e4) {
            return "data:" + e4 + ";base64," + t4;
          }
          function c2(t4) {
            return t4.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
          }
          function d2(t4) {
            return function(e4) {
              return new Promise(function(n4) {
                setTimeout(function() {
                  n4(e4);
                }, t4);
              });
            };
          }
          function g2(t4) {
            for (var e4 = [], n4 = t4.length, i4 = 0; i4 < n4; i4++) e4.push(t4[i4]);
            return e4;
          }
          function h2(t4) {
            return t4.replace(/#/g, "%23").replace(/\n/g, "%0A");
          }
          function m2(t4) {
            var e4 = f2(t4, "border-left-width"), n4 = f2(t4, "border-right-width");
            return t4.scrollWidth + e4 + n4;
          }
          function p2(t4) {
            var e4 = f2(t4, "border-top-width"), n4 = f2(t4, "border-bottom-width");
            return t4.scrollHeight + e4 + n4;
          }
          function f2(t4, e4) {
            var n4 = window.getComputedStyle(t4).getPropertyValue(e4);
            return parseFloat(n4.replace("px", ""));
          }
          return { escape: c2, parseExtension: e3, mimeType: n3, dataAsUrl: u2, isDataUrl: i3, canvasToBlob: r2, resolveUrl: a2, getAndEncode: l2, uid: /* @__PURE__ */ (function() {
            var t4 = 0;
            return function() {
              return "u" + (function() {
                return ("0000" + (Math.random() * Math.pow(36, 4) << 0).toString(36)).slice(-4);
              })() + t4++;
            };
          })(), delay: d2, asArray: g2, escapeXhtml: h2, makeImage: s2, width: m2, height: p2 };
        })(), m = /* @__PURE__ */ (function() {
          function t3(t4) {
            return -1 !== t4.search(o2);
          }
          function e3(t4) {
            for (var e4, n4 = []; null !== (e4 = o2.exec(t4)); ) n4.push(e4[1]);
            return n4.filter(function(t5) {
              return !h.isDataUrl(t5);
            });
          }
          function n3(t4, e4, n4, i4) {
            function o3(t5) {
              return new RegExp(`(url\\(['"]?)(` + h.escape(t5) + `)(['"]?\\))`, "g");
            }
            return Promise.resolve(e4).then(function(t5) {
              return n4 ? h.resolveUrl(t5, n4) : t5;
            }).then(i4 || h.getAndEncode).then(function(t5) {
              return h.dataAsUrl(t5, h.mimeType(e4));
            }).then(function(n5) {
              return t4.replace(o3(e4), "$1" + n5 + "$3");
            });
          }
          function i3(i4, o3, r2) {
            return (function() {
              return !t3(i4);
            })() ? Promise.resolve(i4) : Promise.resolve(i4).then(e3).then(function(t4) {
              var e4 = Promise.resolve(i4);
              return t4.forEach(function(t5) {
                e4 = e4.then(function(e5) {
                  return n3(e5, t5, o3, r2);
                });
              }), e4;
            });
          }
          var o2 = /url\(['"]?([^'"]+?)['"]?\)/g;
          return { inlineAll: i3, shouldProcess: t3, impl: { readUrls: e3, inline: n3 } };
        })(), p = /* @__PURE__ */ (function() {
          function t3() {
            return e3(document).then(function(t4) {
              return Promise.all(t4.map(function(t5) {
                return t5.resolve();
              }));
            }).then(function(t4) {
              return t4.join("\n");
            });
          }
          function e3() {
            function t4(t5) {
              return t5.filter(function(t6) {
                return t6.type === CSSRule.FONT_FACE_RULE;
              }).filter(function(t6) {
                return m.shouldProcess(t6.style.getPropertyValue("src"));
              });
            }
            function e4(t5) {
              var e5 = [];
              return t5.forEach(function(t6) {
                try {
                  h.asArray(t6.cssRules || []).forEach(e5.push.bind(e5));
                } catch (e6) {
                  console.log("Error while reading CSS rules from " + t6.href, e6.toString());
                }
              }), e5;
            }
            function n3(t5) {
              return { resolve: function() {
                var e5 = (t5.parentStyleSheet || {}).href;
                return m.inlineAll(t5.cssText, e5);
              }, src: function() {
                return t5.style.getPropertyValue("src");
              } };
            }
            return Promise.resolve(h.asArray(document.styleSheets)).then(e4).then(t4).then(function(t5) {
              return t5.map(n3);
            });
          }
          return { resolveAll: t3, impl: { readAll: e3 } };
        })(), f = /* @__PURE__ */ (function() {
          function t3(t4) {
            function e4(e5) {
              return h.isDataUrl(t4.src) ? Promise.resolve() : Promise.resolve(t4.src).then(e5 || h.getAndEncode).then(function(e6) {
                return h.dataAsUrl(e6, h.mimeType(t4.src));
              }).then(function(e6) {
                return new Promise(function(n3, i3) {
                  t4.onload = n3, t4.onerror = i3, t4.src = e6;
                });
              });
            }
            return { inline: e4 };
          }
          function e3(n3) {
            return n3 instanceof Element ? (function(t4) {
              var e4 = t4.style.getPropertyValue("background");
              return e4 ? m.inlineAll(e4).then(function(e5) {
                t4.style.setProperty("background", e5, t4.style.getPropertyPriority("background"));
              }).then(function() {
                return t4;
              }) : Promise.resolve(t4);
            })(n3).then(function() {
              return n3 instanceof HTMLImageElement ? t3(n3).inline() : Promise.all(h.asArray(n3.childNodes).map(function(t4) {
                return e3(t4);
              }));
            }) : Promise.resolve(n3);
          }
          return { inlineAll: e3, impl: { newImage: t3 } };
        })(), M = { imagePlaceholder: void 0, cacheBust: false }, w = { toSvg: n2, toPng: o, toJpeg: r, toBlob: a, toPixelData: i2, impl: { fontFaces: p, images: f, util: h, inliner: m, options: {} } };
        t2.exports = w;
      })();
    }), i = t(function(t2) {
      var n2 = n2 || (function(t3) {
        if (!(void 0 === t3 || "undefined" != typeof navigator && /MSIE [1-9]\./.test(navigator.userAgent))) {
          var e2 = t3.document, n3 = function() {
            return t3.URL || t3.webkitURL || t3;
          }, i2 = e2.createElementNS("http://www.w3.org/1999/xhtml", "a"), o = "download" in i2, r = function(t4) {
            var e3 = new MouseEvent("click");
            t4.dispatchEvent(e3);
          }, a = /constructor/i.test(t3.HTMLElement) || t3.safari, s = /CriOS\/[\d]+/.test(navigator.userAgent), l = function(e3) {
            (t3.setImmediate || t3.setTimeout)(function() {
              throw e3;
            }, 0);
          }, u = function(t4) {
            var e3 = function() {
              "string" == typeof t4 ? n3().revokeObjectURL(t4) : t4.remove();
            };
            setTimeout(e3, 4e4);
          }, c = function(t4, e3, n4) {
            e3 = [].concat(e3);
            for (var i3 = e3.length; i3--; ) {
              var o2 = t4["on" + e3[i3]];
              if ("function" == typeof o2) try {
                o2.call(t4, n4 || t4);
              } catch (t5) {
                l(t5);
              }
            }
          }, d = function(t4) {
            return /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(t4.type) ? new Blob([String.fromCharCode(65279), t4], { type: t4.type }) : t4;
          }, g = function(e3, l2, g2) {
            g2 || (e3 = d(e3));
            var h2, m2 = this, p = e3.type, f = "application/octet-stream" === p, M = function() {
              c(m2, "writestart progress write writeend".split(" "));
            };
            if (m2.readyState = m2.INIT, o) return h2 = n3().createObjectURL(e3), void setTimeout(function() {
              i2.href = h2, i2.download = l2, r(i2), M(), u(h2), m2.readyState = m2.DONE;
            });
            !(function() {
              if ((s || f && a) && t3.FileReader) {
                var i3 = new FileReader();
                return i3.onloadend = function() {
                  var e4 = s ? i3.result : i3.result.replace(/^data:[^;]*;/, "data:attachment/file;");
                  t3.open(e4, "_blank") || (t3.location.href = e4), e4 = void 0, m2.readyState = m2.DONE, M();
                }, i3.readAsDataURL(e3), void (m2.readyState = m2.INIT);
              }
              if (h2 || (h2 = n3().createObjectURL(e3)), f) t3.location.href = h2;
              else {
                t3.open(h2, "_blank") || (t3.location.href = h2);
              }
              m2.readyState = m2.DONE, M(), u(h2);
            })();
          }, h = g.prototype, m = function(t4, e3, n4) {
            return new g(t4, e3 || t4.name || "download", n4);
          };
          return "undefined" != typeof navigator && navigator.msSaveOrOpenBlob ? function(t4, e3, n4) {
            return e3 = e3 || t4.name || "download", n4 || (t4 = d(t4)), navigator.msSaveOrOpenBlob(t4, e3);
          } : (h.abort = function() {
          }, h.readyState = h.INIT = 0, h.WRITING = 1, h.DONE = 2, h.error = h.onwritestart = h.onprogress = h.onwrite = h.onabort = h.onerror = h.onwriteend = null, m);
        }
      })("undefined" != typeof self && self || "undefined" != typeof window && window || e.content);
      t2.exports && (t2.exports.saveAs = n2);
    });
    leaflet_compat_default.Control.EasyPrint = leaflet_compat_default.Control.extend({ options: { title: "Print map", position: "topleft", sizeModes: ["Current"], filename: "map", exportOnly: false, hidden: false, tileWait: 500, hideControlContainer: true, hideClasses: [], customWindowTitle: window.document.title, spinnerBgCOlor: "#0DC5C1", customSpinnerClass: "epLoader", defaultSizeTitles: { Current: "Current Size", A4Landscape: "A4 Landscape", A4Portrait: "A4 Portrait" } }, onAdd: function() {
      this.mapContainer = this._map.getContainer(), this.options.sizeModes = this.options.sizeModes.map(function(t3) {
        return "Current" === t3 ? { name: this.options.defaultSizeTitles.Current, className: "CurrentSize" } : "A4Landscape" === t3 ? { height: this._a4PageSize.height, width: this._a4PageSize.width, name: this.options.defaultSizeTitles.A4Landscape, className: "A4Landscape page" } : "A4Portrait" === t3 ? { height: this._a4PageSize.width, width: this._a4PageSize.height, name: this.options.defaultSizeTitles.A4Portrait, className: "A4Portrait page" } : t3;
      }, this);
      var t2 = leaflet_compat_default.DomUtil.create("div", "leaflet-control-easyPrint leaflet-bar leaflet-control");
      if (!this.options.hidden) {
        this._addCss(), leaflet_compat_default.DomEvent.addListener(t2, "mouseover", this._togglePageSizeButtons, this), leaflet_compat_default.DomEvent.addListener(t2, "mouseout", this._togglePageSizeButtons, this);
        var e2 = "leaflet-control-easyPrint-button";
        this.options.exportOnly && (e2 += "-export"), this.link = leaflet_compat_default.DomUtil.create("a", e2, t2), this.link.id = "leafletEasyPrint", this.link.title = this.options.title, this.holder = leaflet_compat_default.DomUtil.create("ul", "easyPrintHolder", t2), this.options.sizeModes.forEach(function(t3) {
          var e3 = leaflet_compat_default.DomUtil.create("li", "easyPrintSizeMode", this.holder);
          e3.title = t3.name;
          leaflet_compat_default.DomUtil.create("a", t3.className, e3);
          leaflet_compat_default.DomEvent.addListener(e3, "click", this.printMap, this);
        }, this), leaflet_compat_default.DomEvent.disableClickPropagation(t2);
      }
      return t2;
    }, printMap: function(t2, e2) {
      e2 && (this.options.filename = e2), this.options.exportOnly || (this._page = window.open("", "_blank", "toolbar=no,status=no,menubar=no,scrollbars=no,resizable=no,left=10, top=10, width=200, height=250, visible=none"), this._page.document.write(this._createSpinner(this.options.customWindowTitle, this.options.customSpinnerClass, this.options.spinnerBgCOlor))), this.originalState = { mapWidth: this.mapContainer.style.width, widthWasAuto: false, widthWasPercentage: false, mapHeight: this.mapContainer.style.height, zoom: this._map.getZoom(), center: this._map.getCenter() }, "auto" === this.originalState.mapWidth ? (this.originalState.mapWidth = this._map.getSize().x + "px", this.originalState.widthWasAuto = true) : this.originalState.mapWidth.includes("%") && (this.originalState.percentageWidth = this.originalState.mapWidth, this.originalState.widthWasPercentage = true, this.originalState.mapWidth = this._map.getSize().x + "px"), this._map.fire("easyPrint-start", { event: t2 }), this.options.hidden || this._togglePageSizeButtons({ type: null }), this.options.hideControlContainer && this._toggleControls(), this.options.hideClasses.length > 0 && this._toggleClasses(this.options.hideClasses);
      var n2 = "string" != typeof t2 ? t2.target.className : t2;
      if ("CurrentSize" === n2) return this._printOpertion(n2);
      this.outerContainer = this._createOuterContainer(this.mapContainer), this.originalState.widthWasAuto && (this.outerContainer.style.width = this.originalState.mapWidth), this._createImagePlaceholder(n2);
    }, _createImagePlaceholder: function(t2) {
      var e2 = this;
      n.toPng(this.mapContainer, { width: parseInt(this.originalState.mapWidth.replace("px")), height: parseInt(this.originalState.mapHeight.replace("px")) }).then(function(n2) {
        e2.blankDiv = document.createElement("div");
        var i2 = e2.blankDiv;
        e2.outerContainer.parentElement.insertBefore(i2, e2.outerContainer), i2.className = "epHolder", i2.style.backgroundImage = 'url("' + n2 + '")', i2.style.position = "absolute", i2.style.zIndex = 1011, i2.style.display = "initial", i2.style.width = e2.originalState.mapWidth, i2.style.height = e2.originalState.mapHeight, e2._resizeAndPrintMap(t2);
      }).catch(function(t3) {
        console.error("oops, something went wrong!", t3);
      });
    }, _resizeAndPrintMap: function(t2) {
      this.outerContainer.style.opacity = 0;
      var e2 = this.options.sizeModes.filter(function(e3) {
        return e3.className === t2;
      });
      e2 = e2[0], this.mapContainer.style.width = e2.width + "px", this.mapContainer.style.height = e2.height + "px", this.mapContainer.style.width > this.mapContainer.style.height ? this.orientation = "portrait" : this.orientation = "landscape", this._map.setView(this.originalState.center), this._map.setZoom(this.originalState.zoom), this._map.invalidateSize(), this.options.tileLayer ? this._pausePrint(t2) : this._printOpertion(t2);
    }, _pausePrint: function(t2) {
      var e2 = this, n2 = setInterval(function() {
        e2.options.tileLayer.isLoading() || (clearInterval(n2), e2._printOpertion(t2));
      }, e2.options.tileWait);
    }, _printOpertion: function(t2) {
      var e2 = this, o = this.mapContainer.style.width;
      (this.originalState.widthWasAuto && "CurrentSize" === t2 || this.originalState.widthWasPercentage && "CurrentSize" === t2) && (o = this.originalState.mapWidth), n.toPng(e2.mapContainer, { width: parseInt(o), height: parseInt(e2.mapContainer.style.height.replace("px")) }).then(function(t3) {
        var n2 = e2._dataURItoBlob(t3);
        e2.options.exportOnly ? i.saveAs(n2, e2.options.filename + ".png") : e2._sendToBrowserPrint(t3, e2.orientation), e2._toggleControls(true), e2._toggleClasses(e2.options.hideClasses, true), e2.outerContainer && (e2.originalState.widthWasAuto ? e2.mapContainer.style.width = "auto" : e2.originalState.widthWasPercentage ? e2.mapContainer.style.width = e2.originalState.percentageWidth : e2.mapContainer.style.width = e2.originalState.mapWidth, e2.mapContainer.style.height = e2.originalState.mapHeight, e2._removeOuterContainer(e2.mapContainer, e2.outerContainer, e2.blankDiv), e2._map.invalidateSize(), e2._map.setView(e2.originalState.center), e2._map.setZoom(e2.originalState.zoom)), e2._map.fire("easyPrint-finished");
      }).catch(function(t3) {
        console.error("Print operation failed", t3);
      });
    }, _sendToBrowserPrint: function(t2, e2) {
      this._page.resizeTo(600, 800);
      var n2 = this._createNewWindow(t2, e2, this);
      this._page.document.body.innerHTML = "", this._page.document.write(n2), this._page.document.close();
    }, _createSpinner: function(t2, e2, n2) {
      return "<html><head><title>" + t2 + "</title></head><body><style>\n      body{\n        background: " + n2 + `;
      }
      .epLoader,
      .epLoader:before,
      .epLoader:after {
        border-radius: 50%;
      }
      .epLoader {
        color: #ffffff;
        font-size: 11px;
        text-indent: -99999em;
        margin: 55px auto;
        position: relative;
        width: 10em;
        height: 10em;
        box-shadow: inset 0 0 0 1em;
        -webkit-transform: translateZ(0);
        -ms-transform: translateZ(0);
        transform: translateZ(0);
      }
      .epLoader:before,
      .epLoader:after {
        position: absolute;
        content: '';
      }
      .epLoader:before {
        width: 5.2em;
        height: 10.2em;
        background: #0dc5c1;
        border-radius: 10.2em 0 0 10.2em;
        top: -0.1em;
        left: -0.1em;
        -webkit-transform-origin: 5.2em 5.1em;
        transform-origin: 5.2em 5.1em;
        -webkit-animation: load2 2s infinite ease 1.5s;
        animation: load2 2s infinite ease 1.5s;
      }
      .epLoader:after {
        width: 5.2em;
        height: 10.2em;
        background: #0dc5c1;
        border-radius: 0 10.2em 10.2em 0;
        top: -0.1em;
        left: 5.1em;
        -webkit-transform-origin: 0px 5.1em;
        transform-origin: 0px 5.1em;
        -webkit-animation: load2 2s infinite ease;
        animation: load2 2s infinite ease;
      }
      @-webkit-keyframes load2 {
        0% {
          -webkit-transform: rotate(0deg);
          transform: rotate(0deg);
        }
        100% {
          -webkit-transform: rotate(360deg);
          transform: rotate(360deg);
        }
      }
      @keyframes load2 {
        0% {
          -webkit-transform: rotate(0deg);
          transform: rotate(0deg);
        }
        100% {
          -webkit-transform: rotate(360deg);
          transform: rotate(360deg);
        }
      }
      </style>
    <div class="` + e2 + '">Loading...</div></body></html>';
    }, _createNewWindow: function(t2, e2, n2) {
      return "<html><head>\n        <style>@media print {\n          img { max-width: 98%!important; max-height: 98%!important; }\n          @page { size: " + e2 + `;}}
        </style>
        <script>function step1(){
        setTimeout('step2()', 10);}
        function step2(){window.print();window.close()}
        <\/script></head><body onload='step1()'>
        <img src="` + t2 + '" style="display:block; margin:auto;"></body></html>';
    }, _createOuterContainer: function(t2) {
      var e2 = document.createElement("div");
      return t2.parentNode.insertBefore(e2, t2), t2.parentNode.removeChild(t2), e2.appendChild(t2), e2.style.width = t2.style.width, e2.style.height = t2.style.height, e2.style.display = "inline-block", e2.style.overflow = "hidden", e2;
    }, _removeOuterContainer: function(t2, e2, n2) {
      e2.parentNode && (e2.parentNode.insertBefore(t2, e2), e2.parentNode.removeChild(n2), e2.parentNode.removeChild(e2));
    }, _addCss: function() {
      var t2 = document.createElement("style");
      t2.type = "text/css", t2.innerHTML = ".leaflet-control-easyPrint-button { \n      background-image: url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjE2cHgiIGhlaWdodD0iMTZweCIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPGc+Cgk8cGF0aCBkPSJNMTI4LDMyaDI1NnY2NEgxMjhWMzJ6IE00ODAsMTI4SDMyYy0xNy42LDAtMzIsMTQuNC0zMiwzMnYxNjBjMCwxNy42LDE0LjM5OCwzMiwzMiwzMmg5NnYxMjhoMjU2VjM1Mmg5NiAgIGMxNy42LDAsMzItMTQuNCwzMi0zMlYxNjBDNTEyLDE0Mi40LDQ5Ny42LDEyOCw0ODAsMTI4eiBNMzUyLDQ0OEgxNjBWMjg4aDE5MlY0NDh6IE00ODcuMTk5LDE3NmMwLDEyLjgxMy0xMC4zODcsMjMuMi0yMy4xOTcsMjMuMiAgIGMtMTIuODEyLDAtMjMuMjAxLTEwLjM4Ny0yMy4yMDEtMjMuMnMxMC4zODktMjMuMiwyMy4xOTktMjMuMkM0NzYuODE0LDE1Mi44LDQ4Ny4xOTksMTYzLjE4Nyw0ODcuMTk5LDE3NnoiIGZpbGw9IiMwMDAwMDAiLz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K);\n      background-size: 16px 16px; \n      cursor: pointer; \n    }\n    .leaflet-control-easyPrint-button-export { \n      background-image: url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjE2cHgiIGhlaWdodD0iMTZweCIgdmlld0JveD0iMCAwIDQzMy41IDQzMy41IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA0MzMuNSA0MzMuNTsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8Zz4KCTxnIGlkPSJmaWxlLWRvd25sb2FkIj4KCQk8cGF0aCBkPSJNMzk1LjI1LDE1M2gtMTAyVjBoLTE1M3YxNTNoLTEwMmwxNzguNSwxNzguNUwzOTUuMjUsMTUzeiBNMzguMjUsMzgyLjV2NTFoMzU3di01MUgzOC4yNXoiIGZpbGw9IiMwMDAwMDAiLz4KCTwvZz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K);\n      background-size: 16px 16px; \n      cursor: pointer; \n    }\n    .easyPrintHolder a {\n      background-size: 16px 16px;\n      cursor: pointer;\n    }\n    .easyPrintHolder .CurrentSize{\n      background-image: url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTZweCIgdmVyc2lvbj0iMS4xIiBoZWlnaHQ9IjE2cHgiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgNjQgNjQiPgogIDxnPgogICAgPGcgZmlsbD0iIzFEMUQxQiI+CiAgICAgIDxwYXRoIGQ9Ik0yNS4yNTUsMzUuOTA1TDQuMDE2LDU3LjE0NVY0Ni41OWMwLTEuMTA4LTAuODk3LTIuMDA4LTIuMDA4LTIuMDA4QzAuODk4LDQ0LjU4MiwwLDQ1LjQ4MSwwLDQ2LjU5djE1LjQwMiAgICBjMCwwLjI2MSwwLjA1MywwLjUyMSwwLjE1NSwwLjc2N2MwLjIwMywwLjQ5MiwwLjU5NCwwLjg4MiwxLjA4NiwxLjA4N0MxLjQ4Niw2My45NDcsMS43NDcsNjQsMi4wMDgsNjRoMTUuNDAzICAgIGMxLjEwOSwwLDIuMDA4LTAuODk4LDIuMDA4LTIuMDA4cy0wLjg5OC0yLjAwOC0yLjAwOC0yLjAwOEg2Ljg1NWwyMS4yMzgtMjEuMjRjMC43ODQtMC43ODQsMC43ODQtMi4wNTUsMC0yLjgzOSAgICBTMjYuMDM5LDM1LjEyMSwyNS4yNTUsMzUuOTA1eiIgZmlsbD0iIzAwMDAwMCIvPgogICAgICA8cGF0aCBkPSJtNjMuODQ1LDEuMjQxYy0wLjIwMy0wLjQ5MS0wLjU5NC0wLjg4Mi0xLjA4Ni0xLjA4Ny0wLjI0NS0wLjEwMS0wLjUwNi0wLjE1NC0wLjc2Ny0wLjE1NGgtMTUuNDAzYy0xLjEwOSwwLTIuMDA4LDAuODk4LTIuMDA4LDIuMDA4czAuODk4LDIuMDA4IDIuMDA4LDIuMDA4aDEwLjU1NmwtMjEuMjM4LDIxLjI0Yy0wLjc4NCwwLjc4NC0wLjc4NCwyLjA1NSAwLDIuODM5IDAuMzkyLDAuMzkyIDAuOTA2LDAuNTg5IDEuNDIsMC41ODlzMS4wMjctMC4xOTcgMS40MTktMC41ODlsMjEuMjM4LTIxLjI0djEwLjU1NWMwLDEuMTA4IDAuODk3LDIuMDA4IDIuMDA4LDIuMDA4IDEuMTA5LDAgMi4wMDgtMC44OTkgMi4wMDgtMi4wMDh2LTE1LjQwMmMwLTAuMjYxLTAuMDUzLTAuNTIyLTAuMTU1LTAuNzY3eiIgZmlsbD0iIzAwMDAwMCIvPgogICAgPC9nPgogIDwvZz4KPC9zdmc+Cg==)\n    }\n    .easyPrintHolder .page {\n      background-image: url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMS4xLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDQ0NC44MzMgNDQ0LjgzMyIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDQ0LjgzMyA0NDQuODMzOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGc+Cgk8Zz4KCQk8cGF0aCBkPSJNNTUuMjUsNDQ0LjgzM2gzMzQuMzMzYzkuMzUsMCwxNy03LjY1LDE3LTE3VjEzOS4xMTdjMC00LjgxNy0xLjk4My05LjM1LTUuMzgzLTEyLjQ2N0wyNjkuNzMzLDQuNTMzICAgIEMyNjYuNjE3LDEuNywyNjIuMzY3LDAsMjU4LjExNywwSDU1LjI1Yy05LjM1LDAtMTcsNy42NS0xNywxN3Y0MTAuODMzQzM4LjI1LDQzNy4xODMsNDUuOSw0NDQuODMzLDU1LjI1LDQ0NC44MzN6ICAgICBNMzcyLjU4MywxNDYuNDgzdjAuODVIMjU2LjQxN3YtMTA4LjhMMzcyLjU4MywxNDYuNDgzeiBNNzIuMjUsMzRoMTUwLjE2N3YxMzAuMzMzYzAsOS4zNSw3LjY1LDE3LDE3LDE3aDEzMy4xNjd2MjI5LjVINzIuMjVWMzR6ICAgICIgZmlsbD0iIzAwMDAwMCIvPgoJPC9nPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=);\n    }\n    .easyPrintHolder .A4Landscape { \n      transform: rotate(-90deg);\n    }\n\n    .leaflet-control-easyPrint-button{\n      display: inline-block;\n    }\n    .easyPrintHolder{\n      margin-top:-31px;\n      margin-bottom: -5px;\n      margin-left: 30px;\n      padding-left: 0px;\n      display: none;\n    }\n\n    .easyPrintSizeMode {\n      display: inline-block;\n    }\n    .easyPrintHolder .easyPrintSizeMode a {\n      border-radius: 0px;\n    }\n\n    .easyPrintHolder .easyPrintSizeMode:last-child a{\n      border-top-right-radius: 2px;\n      border-bottom-right-radius: 2px;\n      margin-left: -1px;\n    }\n\n    .easyPrintPortrait:hover, .easyPrintLandscape:hover{\n      background-color: #757570;\n      cursor: pointer;\n    }", document.body.appendChild(t2);
    }, _dataURItoBlob: function(t2) {
      for (var e2 = atob(t2.split(",")[1]), n2 = t2.split(",")[0].split(":")[1].split(";")[0], i2 = new ArrayBuffer(e2.length), o = new DataView(i2), r = 0; r < e2.length; r++) o.setUint8(r, e2.charCodeAt(r));
      return new Blob([i2], { type: n2 });
    }, _togglePageSizeButtons: function(t2) {
      var e2 = this.holder.style, n2 = this.link.style;
      "mouseover" === t2.type ? (e2.display = "block", n2.borderTopRightRadius = "0", n2.borderBottomRightRadius = "0") : (e2.display = "none", n2.borderTopRightRadius = "2px", n2.borderBottomRightRadius = "2px");
    }, _toggleControls: function(t2) {
      var e2 = document.getElementsByClassName("leaflet-control-container")[0];
      if (t2) return e2.style.display = "block";
      e2.style.display = "none";
    }, _toggleClasses: function(t2, e2) {
      t2.forEach(function(t3) {
        var n2 = document.getElementsByClassName(t3)[0];
        if (e2) return n2.style.display = "block";
        n2.style.display = "none";
      });
    }, _a4PageSize: { height: 715, width: 1045 } }), leaflet_compat_default.easyPrint = function(t2) {
      return new leaflet_compat_default.Control.EasyPrint(t2);
    };
  });

  // node_modules/leaflet.control.resizer/L.Control.Resizer.js
  init_leaflet_compat();
  (function(L3) {
    if (typeof L3 === "undefined") {
      throw new Error("Leaflet must be included first");
    }
    L3.Control.Resizer = L3.Control.extend({
      options: {
        direction: "e",
        // valid values e, s, se
        onlyOnHover: false,
        updateAlways: true,
        pan: false
      },
      _END: {
        mousedown: "mouseup",
        touchstart: "touchend",
        pointerdown: "touchend",
        MSPointerDown: "touchend"
      },
      _MOVE: {
        mousedown: "mousemove",
        touchstart: "touchmove",
        pointerdown: "touchmove",
        MSPointerDown: "touchmove"
      },
      initialize: function(options) {
        L3.Util.setOptions(this, options);
        this._initialOffsetX = 0;
        this._initialOffsetY = 0;
        this.options.position = "leaflet-control-resizer-corner-" + this.options.direction;
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
      onAdd: function(map) {
        this._prepareLocation(map);
        var className = "leaflet-control-resizer";
        var classNameTransp = className + (this.options.onlyOnHover ? "-transparent" : "-opaque");
        var classNameLoc = className + "-" + this.options.direction;
        this._container = L3.DomUtil.create(
          "div",
          className + " " + classNameTransp + " " + classNameLoc,
          map.getContainer()
        );
        var container = this._container;
        L3.DomEvent.on(container, "pointerdown mousedown mouseup click touchstart drag", L3.DomEvent.stopPropagation);
        L3.DomEvent.on(container, "mousedown touchstart", this._initResize, this);
        return this._container;
      },
      onRemove: function(map) {
        L3.DomEvent.off(this._container, "mousedown touchstart", this._initResize, this);
        L3.DomEvent.off(this._container, "pointerdown mousedown mouseup click touchstart drag", L3.DomEvent.stopPropagation);
      },
      fakeHover: function(ms) {
        var className = "leaflet-control-resizer-transparent-fakedhover";
        var cont = this._container;
        L3.DomUtil.addClass(cont, className);
        setTimeout(function() {
          L3.DomUtil.removeClass(cont, className);
        }, ms | 1e3);
      },
      _prepareLocation: function(map) {
        var corners = map._controlCorners;
        var l = "leaflet-control-resizer-corner-" + this.options.direction;
        var container = map._controlContainer;
        corners[l] = L3.DomUtil.create("div", l, container);
      },
      _initResize: function(e) {
        if (e._simulated || !this._enabled) {
          return;
        }
        if (this._started) return;
        this._started = true;
        this._moved = false;
        var first = e.touches && e.touches.length === 1 ? e.touches[0] : e;
        L3.DomUtil.disableImageDrag();
        L3.DomUtil.disableTextSelection();
        this.fire("down", e);
        var mapCont = this._map.getContainer();
        this._initialOffsetX = mapCont.offsetWidth + mapCont.offsetLeft - first.clientX;
        this._initialOffsetY = mapCont.offsetHeight + mapCont.offsetTop - first.clientY;
        L3.DomEvent.on(document, this._END[e.type], this._stopResizing, this);
        L3.DomEvent.on(this._container, this._END[e.type], this._stopResizing, this);
        L3.DomEvent.on(document, this._MOVE[e.type], this._duringResizing, this);
      },
      _duringResizing: function(e) {
        if (e._simulated) {
          return;
        }
        var first = e.touches && e.touches.length === 1 ? e.touches[0] : e;
        L3.DomEvent.preventDefault(e);
        if (!this._moved) {
          this.fire("dragstart", e);
        }
        this.fire("predrag", e);
        var mapCont = this._map.getContainer();
        if (this.options.direction.indexOf("e") >= 0) {
          mapCont.style.width = first.clientX - mapCont.offsetLeft + this._initialOffsetX + "px";
          this._moved = true;
        }
        if (this.options.direction.indexOf("s") >= 0) {
          mapCont.style.height = first.clientY - mapCont.offsetTop + this._initialOffsetY + "px";
          this._moved = true;
        }
        this._moved = true;
        if (this.options.updateAlways) {
          this._map.invalidateSize({ pan: this.options.pan });
        }
        this.fire("drag", e);
      },
      _stopResizing: function(e) {
        if (e._simulated) {
          return;
        }
        for (var i in this._MOVE) {
          L3.DomEvent.off(document, this._MOVE[i], this._duringResizing, this);
          L3.DomEvent.off(document, this._END[i], this._stopResizing, this);
          L3.DomEvent.off(this._container, this._END[i], this._stopResizing, this);
        }
        this._map.invalidateSize({ pan: this.options.pan });
        L3.DomUtil.enableImageDrag();
        L3.DomUtil.enableTextSelection();
        this._started = false;
        this.fire("dragend", e);
      }
    });
    L3.Control.Resizer.include(L3.Mixin.Events);
    L3.control.resizer = function(options) {
      return new L3.Control.Resizer(options);
    };
  })(leaflet_compat_default);

  // node_modules/leaflet.visualclick/dist/L.VisualClick.js
  init_leaflet_compat();
  leaflet_compat_default.Map.VisualClick = leaflet_compat_default.Handler.extend({
    _makeVisualIcon: function() {
      var touchMode = this._map.options.visualClickMode === "touch" ? true : false;
      return leaflet_compat_default.divIcon({
        className: "leaflet-visualclick-icon" + (touchMode ? "-touch" : ""),
        // See L.VisualClick.css
        iconSize: [0, 0],
        clickable: false
      });
    },
    _visualIcon: null,
    _onClick: function(e) {
      var map = this._map;
      var latlng = e.latlng;
      var marker = leaflet_compat_default.marker(latlng, {
        pane: this._map.options.visualClickPane,
        icon: this._visualIcon,
        interactive: false
      }).addTo(map);
      window.setTimeout(function() {
        if (map) {
          map.removeLayer(marker);
        }
      }.bind(this), map.options.visualClick.removeTimeout || 450);
      return true;
    },
    addHooks: function() {
      if (this._visualIcon === null) {
        this._visualIcon = this._makeVisualIcon();
      }
      if (this._map.options.visualClickPane === "ie10-visual-click-pane") {
        this._map.createPane("ie10-visual-click-pane");
      }
      this._map.on(this._map.options.visualClickEvents, this._onClick, this);
    },
    removeHooks: function() {
      this._map.off(this._map.options.visualClickEvents, this._onClick, this);
    }
  });
  leaflet_compat_default.Map.mergeOptions({
    visualClick: leaflet_compat_default.Browser.any3d ? true : false,
    //Can be true, desktop, touch, false. Not straight forward to use L.Browser.touch flag because true on IE10
    visualClickMode: leaflet_compat_default.Browser.touch && leaflet_compat_default.Browser.mobile ? "touch" : "desktop",
    //Not straight forward to use only L.Browser.touch flag because true on IE10 - so this is slightly better
    visualClickEvents: "click contextmenu",
    //Standard leaflety way of defining which events to hook on to
    visualClickPane: leaflet_compat_default.Browser.ie && document.documentMode === 10 ? "ie10-visual-click-pane" : "shadowPane"
    // Map pane where the pulse markers will be showh
  });
  leaflet_compat_default.Map.addInitHook("addHandler", "visualClick", leaflet_compat_default.Map.VisualClick);

  // src/leaflet-ui.js
  leaflet_compat_default.Control.Locate = leaflet_compat_default.Control.Locate.LocateControl;
  leaflet_compat_default.control.fullscreen = (options) => new leaflet_compat_default.Control.FullScreen(options);
  (function() {
    const currentScript = document.currentScript;
    const currentVersion = version.split("+")[0].trim();
    let lazyLoader = {
      baseURL: "https://unpkg.com/",
      // Save a reference to any lazy loaded scripts to prevent multiple loading (multiple-maps)
      scripts: {},
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
        lazyLoader.scripts[url] = lazyLoader.scripts[url] ? lazyLoader.scripts[url] : new Promise((resolve, reject) => {
          let type = url.split(".").pop().split("?")[0];
          let tag = type == "css" ? "link" : "script";
          let script = document.createElement(tag);
          let head = document.head;
          let root_script = (head.contains(currentScript) ? currentScript : head.lastChild) || head;
          let prev_tag = lazyLoader["prev_" + tag] || (tag == "script" && lazyLoader.prev_link ? lazyLoader.prev_link : root_script);
          let base_url = url.indexOf(".") === 0 || url.indexOf("/") === 0 || url.indexOf("http://") === 0 || url.indexOf("https://") === 0 ? "" : lazyLoader.baseURL;
          if (type == "css") {
            script.rel = "stylesheet";
          }
          script.addEventListener("load", resolve, { once: true });
          script.setAttribute(type == "css" ? "href" : "src", base_url + url);
          if (prev_tag.parentNode && prev_tag.nextSibling)
            prev_tag.parentNode.insertBefore(script, prev_tag.nextSibling);
          else
            head.appendChild(script);
          lazyLoader["prev_" + tag] = script;
        });
        return lazyLoader.scripts[url];
      }
    };
    let default_options = {
      mapTypes: {
        atlas: {
          name: "Atlas",
          url: "https://{s}.tile.thunderforest.com/mobile-atlas/{z}/{x}/{y}{r}.png",
          options: {
            maxZoom: 24,
            maxNativeZoom: 22,
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Map style: &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>',
            // apikey: '<your apikey>',
            r: leaflet_compat_default.Browser.retina ? "@2x" : ""
          }
        },
        streets: {
          name: "Streets",
          url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          options: {
            maxZoom: 24,
            maxNativeZoom: 19,
            attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          }
        },
        cycle: {
          name: "Cycle",
          url: "https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}{r}.png",
          options: {
            maxZoom: 24,
            maxNativeZoom: 22,
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Map style: &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>',
            // apikey: '<your apikey>',
            r: leaflet_compat_default.Browser.retina ? "@2x" : ""
          }
        },
        terrain: {
          name: "Terrain",
          url: "https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}{r}.png",
          options: {
            maxZoom: 24,
            maxNativeZoom: 22,
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Map style: &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>',
            // apikey: '<your apikey>',
            r: leaflet_compat_default.Browser.retina ? "@2x" : ""
          }
        },
        satellite: {
          name: "Satellite",
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          options: {
            maxZoom: 24,
            maxNativeZoom: 18,
            attribution: 'Map data: &copy; <a href="http://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          }
        },
        topo: {
          name: "Topo",
          url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
          options: {
            maxZoom: 24,
            maxNativeZoom: 17,
            attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
          }
        }
      },
      zoomControl: {
        position: "bottomright"
      },
      rotateControl: {
        position: "bottomright"
      },
      scaleControl: {
        width: 200,
        position: "bottomright",
        imperial: false
      },
      pegmanControl: {
        position: "bottomright",
        theme: "leaflet-pegman-v3-small"
      },
      locateControl: {
        position: "bottomright"
      },
      fullscreenControl: {
        position: "topright",
        title: "Enter Fullscreen",
        titleCancel: "Exit Fullscreen",
        forceSeparateButton: true
      },
      layersControl: {
        inline: true,
        position: "topleft"
      },
      minimapControl: {
        position: "bottomleft",
        toggleDisplay: false,
        toggleMapTypes: true,
        // Automatically switch between "satellite" and "roads" layers.
        width: 75,
        height: 75,
        aimingRectOptions: {
          color: "#000000",
          weight: 1,
          opacity: 0,
          fillOpacity: 0
        },
        shadowRectOptions: {
          color: "#000000",
          weight: 1,
          opacity: 0,
          fillOpacity: 0
        },
        mapOptions: {
          mapTypeId: "satellite",
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
        position: "bottomright"
      },
      searchControl: {
        url: "https://nominatim.openstreetmap.org/search?format=json&accept-language={querylang}&q={s}",
        querylang: "en-US",
        detectUserLang: true,
        jsonpParam: "json_callback",
        propertyName: "display_name",
        propertyLoc: ["lat", "lon"],
        markerLocation: true,
        autoType: false,
        autoCollapse: true,
        firstTipSubmit: true,
        minLength: 1,
        zoom: 10,
        position: "bottomright"
      },
      printControl: {
        position: "bottomright",
        hideControlContainer: true,
        exportOnly: true,
        sizeModes: [
          /*'Current',*/
          "A4Portrait",
          "A4Landscape"
        ]
        //tileWait: 1200,
      },
      resizerControl: {
        direction: "s"
      },
      disableDefaultUI: false,
      // TODO: pluginsBaseURL: 'https://unpkg.com/',
      plugins: [
        // "@raruto/leaflet-elevation@0.4.5/leaflet-elevation.css",
        // "@raruto/leaflet-elevation@0.4.5/leaflet-elevation.js",
        // "leaflet-kmz@0.3.1/dist/leaflet-kmz.js",
        // "leaflet-transparency@0.0.5/leaflet-transparency.min.js"
      ],
      _isMiniMap: false
      // used to prevent infinite loops when loading the minimap control.
    };
    leaflet_compat_default.Map.mergeOptions({
      mapTypeId: "streets",
      mapTypeIds: ["streets", "terrain", "satellite", "topo"],
      mapTypes: void 0,
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
      apiKeys: void 0,
      // eg. { thunderforest: "", google: "", ... }
      _isMiniMap: false
      // used to prevent infinite loops when loading the minimap control.
    });
    leaflet_compat_default.Map.addInitHook(function() {
      disableDefaultUI.call(this);
      if (this.options._isMiniMap) {
        return;
      }
      if (!this.options.disableDefaultUI) {
        setDefaultOptions.call(this);
        initMap.call(this);
      }
    });
    function disableDefaultUI() {
      if (this.zoomControl) this.zoomControl.remove();
      if (this.rotateControl) this.rotateControl.remove();
      if (this.fullscreenControl) this.fullscreenControl.remove();
      if (this.searchControl && this.options.searchControl) this.searchControl.remove();
      if (this.attributionControl) this.attributionControl.remove();
    }
    function setDefaultOptions() {
      let opts = this.options;
      for (let i in default_options) {
        if (opts[i] === true || typeof opts[i] === "undefined") {
          opts[i] = isObject(default_options[i]) ? deepMerge({}, default_options[i]) : default_options[i];
        } else if (typeof this.options[i] === "object" && opts[i] instanceof Array === false) {
          opts[i] = deepMerge({}, default_options[i], opts[i]);
        }
      }
      if (opts.apiKeys) {
        if (opts.apiKeys.thunderforest) {
          opts.mapTypes.atlas.options.apikey = opts.apiKeys.thunderforest;
          opts.mapTypes.terrain.options.apikey = opts.apiKeys.thunderforest;
          opts.mapTypes.cycle.options.apikey = opts.apiKeys.thunderforest;
        }
        if (opts.apiKeys.google) {
          opts.pegmanControl.apiKey = opts.apiKeys.google;
        }
      }
      for (let k of ["atlas", "terrain", "cycle"]) {
        if (opts.mapTypes[k].options.apikey && opts.mapTypes[k].url.indexOf("apikey=") === -1) {
          opts.mapTypes[k].url += (opts.mapTypes[k].url.indexOf("?") === -1 ? "?" : "&") + "apikey={apikey}";
        }
      }
      if (opts.mapTypeIds.includes(opts.mapTypeId) === false && opts.mapTypeIds.length > 0) {
        opts.mapTypeId = opts.mapTypeIds[0];
      }
      if (opts.searchControl && opts.searchControl.detectUserLang) {
        opts.searchControl.querylang = window.navigator.languages ? window.navigator.languages[0] : window.navigator.userLanguage || window.navigator.language;
      }
      if (opts.searchControl && opts.searchControl.querylang) {
        opts.searchControl.url = opts.searchControl.url.replace("{querylang}", opts.searchControl.querylang);
      }
      if (opts.minimapControl && !opts.center && !opts.zoom) {
        this.setView([0, 0], 0);
      }
    }
    function initMap() {
      let controls = {}, layers = {}, baseMaps = {}, opts = this.options;
      if (opts.gestureHandling) {
        this.gestureHandling.enable();
      }
      for (let i in opts.mapTypeIds) {
        let id = opts.mapTypeIds[i];
        if (opts.mapTypes[id]) {
          baseMaps[opts.mapTypes[id].name] = layers[id] = new leaflet_compat_default.TileLayer(opts.mapTypes[id].url, opts.mapTypes[id].options);
          layers[id].mapTypeId = id;
        }
      }
      this._lastMapTypeId = opts.mapTypeId;
      this._prevMapTypeId = opts.mapTypeId;
      this.on("baselayerchange", function(e) {
        if (e && e.layer && e.layer.mapTypeId) {
          this._prevMapTypeId = this._lastMapTypeId;
          this._lastMapTypeId = e.layer.mapTypeId;
        }
      });
      this.on("baselayerchange", function(e) {
        if (e && e.layer && e.layer.mapTypeId && e.layer.bringToBack) e.layer.bringToBack();
      });
      if (opts.layersControl) {
        controls.layers = new leaflet_compat_default.Control.Layers(baseMaps, null, opts.layersControl);
        this.on("zoomend", autoToggleSatelliteLayer, this);
      }
      if (opts.attributionControl && this.attributionControl) {
        this.attributionControl.addTo(this);
        controls.attribution = this.attributionControl;
        this.on("baselayerchange", updateLeafletAttribution.bind(this, this.attributionControl.options.prefix));
      }
      if (opts.editInOSMControl) {
        controls.editInOSM = new leaflet_compat_default.Control.EditInOSM(opts.editInOSMControl);
      }
      if (opts.scaleControl) {
        controls.scale = new leaflet_compat_default.Control.Scale(opts.scaleControl);
      }
      if (opts.zoomControl && this.zoomControl) {
        this.zoomControl.setPosition(opts.zoomControl.position);
        this.zoomControl.addTo(this);
        controls.zoom = this.zoomControl;
      }
      if (opts.rotateControl && this.rotateControl) {
        this.rotateControl.setPosition(opts.rotateControl.position);
        this.rotateControl.addTo(this);
        controls.rotate = this.rotateControl;
      }
      if (opts.pegmanControl) {
        controls.pegman = new leaflet_compat_default.Control.Pegman(opts.pegmanControl);
      }
      if (opts.locateControl) {
        controls.locate = new leaflet_compat_default.Control.Locate(opts.locateControl);
      }
      if (opts.searchControl) {
        controls.search = this.searchControl = new leaflet_compat_default.Control.Search(opts.searchControl);
      }
      if (opts.printControl) {
        controls.print = new leaflet_compat_default.Control.EasyPrint(opts.printControl);
      }
      if (opts.loadingControl) {
        controls.loading = new leaflet_compat_default.Control.Loading(opts.loadingControl);
      }
      if (opts.fullscreenControl) {
        controls.fullscreen = this.fullscreenControl;
        leaflet_compat_default.Util.setOptions(controls.fullscreen, opts.fullscreenControl);
      }
      if (opts.minimapControl) {
        let miniMapTypeId = opts.minimapControl.mapOptions.mapTypeId;
        let miniMapLayer = opts.mapTypes[miniMapTypeId];
        if (miniMapLayer) {
          miniMapLayer = new leaflet_compat_default.TileLayer(miniMapLayer.url, miniMapLayer.options);
          miniMapLayer.mapTypeId = miniMapTypeId;
          controls.minimap = new leaflet_compat_default.Control.MiniMap(miniMapLayer, opts.minimapControl);
          controls.minimap._mainMapBaseLayers = baseMaps;
        }
      }
      if (opts.resizerControl) {
        controls.resizer = new leaflet_compat_default.Control.Resizer(opts.resizerControl);
      }
      for (let i in controls) {
        if (controls[i].addTo) {
          controls[i].addTo(this);
        }
      }
      this.controls = controls;
      this.whenReady(function() {
        this.fire("idle");
        if (opts.mapTypeId) {
          let baseLayer = opts.mapTypes[opts.mapTypeId];
          if (baseLayer && baseMaps[baseLayer.name]) {
            opts.layers = opts.layers.filter((item) => item._leaflet_id !== baseMaps[baseLayer.name]._leaflet_id);
            let layer = baseMaps[baseLayer.name];
            if (layer.setZIndex) layer.setZIndex(0);
            else if (layer.bringToBack) layer.bringToBack();
          }
        }
      }, this);
      if (opts.mapTypeId) {
        let baseLayer = opts.mapTypes[opts.mapTypeId];
        if (baseLayer && baseMaps[baseLayer.name]) {
          opts.layers.unshift(baseMaps[baseLayer.name]);
        }
      }
      if (opts.plugins) {
        let core_plugins = [];
        if (opts.includeLeafletUICSS) {
          core_plugins.unshift("leaflet-ui@" + currentVersion + "/dist/leaflet-ui.css");
        }
        if (!window.L && !window.leaflet) {
          core_plugins.unshift("leaflet@1.9.4/dist/leaflet.css");
          core_plugins.unshift("leaflet@1.9.4/dist/leaflet.js");
        } else if (opts.includeLeafletCSS && leaflet_compat_default.version) {
          let core_css_url = "leaflet@" + leaflet_compat_default.version + "/dist/leaflet.css";
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
        if (this._initHooks) {
          let initHooks = this._initHooks.length;
          this.once("plugins_loaded", function() {
            if (initHooks < this._initHooks.length)
              for (let i = initHooks, len = this._initHooks.length; i < len; i++) {
                this._initHooks[i].call(this);
              }
            this.fire("initHooks_called");
          });
        }
        lazyLoader.loadSyncScripts([core_plugins, opts.plugins]).then(() => this.fire("plugins_loaded"));
      }
    }
    function updateLeafletAttribution(defaultAttribution, e) {
      if (e && e.layer) {
        this.attributionControl.setPrefix(leaflet_compat_default.GridLayer.GoogleMutant && e.layer instanceof leaflet_compat_default.GridLayer.GoogleMutant ? false : defaultAttribution);
      }
    }
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
              let input2 = inputs[j];
              let layer2 = control._getLayer(input2.layerId).layer;
              let mapTypeId2 = layer2.mapTypeId;
              if (mapTypeId2 == this._prevMapTypeId) {
                input2.click();
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
    let minimapProto = leaflet_compat_default.Control.MiniMap.prototype;
    let onAddMinimapProto = minimapProto.onAdd;
    leaflet_compat_default.Control.MiniMap.include({
      onAdd: function(map) {
        let container = onAddMinimapProto.call(this, map);
        if (this._miniMap) {
          this._miniMap.doubleClickZoom.disable();
          this._miniMap.touchZoom.disable();
          this._miniMap.scrollWheelZoom.disable();
        }
        if (this.options.toggleMapTypes) {
          map.on("baselayerchange", this._handleMainMapTypeChange, this);
          leaflet_compat_default.DomEvent.on(this._container, "click", this._handleMiniMapTypeToggle, this);
        }
        return container;
      },
      _handleMainMapTypeChange: function(e) {
        if (!this._handligMiniMapTypeToggle) {
          if (e && e.layer) {
            let minimap = this, mainmap = this._mainMap, miniMapTypeId = minimap._layer.mapTypeId, mainMapTypeId = e.layer.mapTypeId;
            if (mainmap.options.mapTypeIds.length > 0 && inArray(mainmap.options.mapTypeIds, mainMapTypeId)) {
              if (mainMapTypeId != miniMapTypeId) {
                minimap._lastMapTypeId = mainMapTypeId;
              }
              let mapTypeId, miniMapLayer;
              if (mainMapTypeId == "satellite" && miniMapTypeId == "satellite") {
                mapTypeId = minimap._lastMapTypeId;
              } else if (mainMapTypeId != "satellite" && miniMapTypeId != "satellite") {
                mapTypeId = "satellite";
              }
              miniMapLayer = mainmap.options.mapTypes[mapTypeId];
              if (miniMapLayer) {
                miniMapLayer = new leaflet_compat_default.TileLayer(miniMapLayer.url, miniMapLayer.options);
                miniMapLayer.mapTypeId = mapTypeId;
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
          let minimap = this, mainmap = this._mainMap, miniMapTypeId = this._layer.mapTypeId, mainMapTypeId;
          for (let i in this._mainMapBaseLayers) {
            if (mainmap.hasLayer(this._mainMapBaseLayers[i]) && miniMapTypeId != this._mainMapBaseLayers[i].mapTypeId) {
              mainMapTypeId = this._mainMapBaseLayers[i].mapTypeId;
              break;
            }
          }
          if (mainmap.options.mapTypeIds.length > 0 && inArray(mainmap.options.mapTypeIds, miniMapTypeId)) {
            let mapTypeId, miniMapLayer;
            mapTypeId = minimap._lastMapTypeId || mainmap.options.mapTypeId;
            if (minimap._lastMapTypeId != "satellite" && miniMapTypeId != "satellite") {
              mapTypeId = "satellite";
            }
            miniMapLayer = mainmap.options.mapTypes[mapTypeId];
            if (miniMapLayer) {
              miniMapLayer = new leaflet_compat_default.TileLayer(miniMapLayer.url, miniMapLayer.options);
              miniMapLayer.mapTypeId = mapTypeId;
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
      }
    });
    function inArray(array, items) {
      return array.some((r) => items.includes(r));
    }
    function isObject(item) {
      return item && typeof item === "object" && !Array.isArray(item);
    }
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
})();
/*! Bundled license information:

leaflet.fullscreen/dist/Control.FullScreen.umd.js:
  (*!
   * leaflet.fullscreen
   * (c) Bruno B.; MIT License
   * https://github.com/brunob/leaflet.fullscreen
   *)
  (*! GENERATED FILE - DO NOT EDIT DIRECTLY. Edit files in src/ and run 'npm run build' *)

leaflet.locatecontrol/dist/L.Control.Locate.umd.js:
  (*! Version: 0.90.1
  Copyright (c) 2016 Dominik Moritz *)
  (*!
    Copyright (c) 2016 Dominik Moritz
  
    This file is part of the leaflet locate control. It is licensed under the MIT license.
    You can find the project at: https://github.com/domoritz/leaflet-locatecontrol
    *)

leaflet-pegman/leaflet-pegman.js:
  (**
   * leaflet-pegman
   *
   * @author    Raruto
   * @license   GPL-3.0+
   * @link https://github.com/Raruto/leaflet-pegman
   * @desc Leaflet plugin that allows an easy integration with the Google StreetView Service API
   *)

leaflet-control-layers-inline/leaflet-control-layers-inline.js:
  (**
   * leaflet-control-layers-inline
   *
   * @author    Raruto
   * @license   GPL-3.0+
   * @link https://github.com/Raruto/leaflet-control-layers-inline
   * @desc Leaflet plugin that allows to display inline layers control
   *)
*/
//# sourceMappingURL=leaflet-ui-src.js.map
