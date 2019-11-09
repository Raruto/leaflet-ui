import { version } from '../package.json';
import 'leaflet.locatecontrol';
import 'leaflet.fullscreen';
import 'leaflet-pegman';
import '@raruto/leaflet-gesture-handling';
import '@raruto/leaflet-edit-osm';
import 'leaflet-control-layers-inline';
import 'leaflet-minimap';
import 'leaflet-loading';
import 'leaflet-search';
import 'leaflet-easyprint';
import 'leaflet.control.resizer';

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

		// Keep a reference of previous mapTypeId
		this._lastMapTypeId = this.options.mapTypeId;
		this._prevMapTypeId = this.options.mapTypeId;
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
		if (this.options.layersControl) {
			controls.layers = new L.Control.Layers(baseMaps, null, this.options.layersControl);
			this.on('zoomend', autoToggleSatelliteLayer, this);
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
				let baseLayer = this.options.mapTypes[this.options.mapTypeId];
				if (baseLayer && baseMaps[baseLayer.name]) {
					this.options.layers = this.options.layers.filter(item => item._leaflet_id !== baseMaps[baseLayer.name]._leaflet_id);
					let layer = baseMaps[baseLayer.name];
					if (layer.setZIndex) layer.setZIndex(0);
					else if (layer.bringToBack) layer.bringToBack();
				}
			}
		}, this);

		// Set default base layer.
		if (this.options.mapTypeId) {
			let baseLayer = this.options.mapTypes[this.options.mapTypeId];
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
