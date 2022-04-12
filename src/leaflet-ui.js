import { version } from '../package.json';

const base_url = 'https://unpkg.com/';

Promise.all([
		import(base_url + 'leaflet-i18n'),
		import(base_url + 'leaflet-rotate'),
		import(base_url + 'leaflet.locatecontrol'),
		import(base_url + 'leaflet.fullscreen'),
		import(base_url + 'leaflet-pegman'),
		import(base_url + '@raruto/leaflet-gesture-handling'),
		import(base_url + '@raruto/leaflet-edit-osm'),
		import(base_url + 'leaflet-control-layers-inline'),
		import(base_url + 'leaflet-minimap'),
		import(base_url + 'leaflet-loading'),
		import(base_url + 'leaflet-search'),
		import(base_url + 'leaflet-easyprint'),
		import(base_url + 'leaflet.control.resizer'),
		import(base_url + 'leaflet.visualclick')
	]).then(() => {

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

	});