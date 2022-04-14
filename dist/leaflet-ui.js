!function(t){"function"==typeof define&&define.amd?define(t):t()}((function(){"use strict";let t=window.L=window.L||{};t.plugins=["leaflet-i18n@0.3.1/Leaflet.i18n.js","leaflet-rotate@0.1.4/dist/leaflet-rotate.js","@raruto/leaflet-gesture-handling@1.4.1/dist/leaflet-gesture-handling.min.js","leaflet.visualclick@1.1.4/dist/L.VisualClick.js","leaflet.locatecontrol@0.76.0/src/L.Control.Locate.js","leaflet-pegman@0.1.6/leaflet-pegman.min.js","@raruto/leaflet-edit-osm@0.0.2/leaflet-edit-osm.min.js","leaflet-control-layers-inline@0.0.7/leaflet-control-layers-inline.min.js","leaflet-minimap@3.6.1/dist/Control.MiniMap.min.js","leaflet-loading@0.1.24/src/Control.Loading.js","leaflet-search@3.0.2/dist/leaflet-search.min.js","leaflet-easyprint@2.1.9/dist/bundle.js","leaflet.control.resizer@0.0.1/L.Control.Resizer.js"],t.import=(t,e="https://unpkg.com/")=>"string"==typeof t?import(e+t):Promise.all(t.map((t=>import(e+t)))),t.initUI=()=>{!function(){let e=t.i18n.bind({});t.i18n=t._=(o,i)=>(t.locale&&t.locales[t.locale]&&""==t.locales[t.locale][o]&&(t.locales[t.locale][o]="​"),e.call(null,o,i))}(),function(){const e=document.currentScript,o="0.5.5+dynamic.f634be9e".split("+")[0].trim();let i={baseURL:"https://unpkg.com/",loadSyncScripts:function(t){return t.reduce(((t,e)=>t.then((()=>i.loadAsyncScripts(e)))),Promise.resolve())},loadAsyncScripts:function(t){return Promise.all(t.map((t=>i.loadScript(t))))},loadScript:function(t){return new Promise(((o,a)=>{let n=t.split(".").pop().split("?")[0],l="css"==n?"link":"script",r=document.createElement(l),s=document.head,p=(s.contains(e)?e:s.lastChild)||s,m=i["prev_"+l]||("script"==l&&i.prev_link?i.prev_link:p),h=0===t.indexOf(".")||0===t.indexOf("/")||0===t.indexOf("http://")||0===t.indexOf("https://")?"":i.baseURL;"css"==n&&(r.rel="stylesheet"),r.addEventListener("load",o,{once:!0}),r.setAttribute("css"==n?"href":"src",h+t),m.parentNode&&m.nextSibling?m.parentNode.insertBefore(r,m.nextSibling):s.appendChild(r),i["prev_"+l]=r}))}},a={mapTypes:{atlas:{name:"Atlas",url:"https://{s}.tile.thunderforest.com/mobile-atlas/{z}/{x}/{y}.png",options:{maxZoom:24,maxNativeZoom:22,attribution:'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Map style: &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>'}},streets:{name:"Streets",url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",options:{maxZoom:24,maxNativeZoom:19,attribution:'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'}},cycle:{name:"Cycle",url:"https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png",options:{maxZoom:24,maxNativeZoom:22,attribution:'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Map style: &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>'}},terrain:{name:"Terrain",url:"https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png",options:{maxZoom:24,maxNativeZoom:22,attribution:'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Map style: &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>'}},satellite:{name:"Satellite",url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",options:{maxZoom:24,maxNativeZoom:18,attribution:'Map data: &copy; <a href="http://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'}},topo:{name:"Topo",url:"https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",options:{maxZoom:24,maxNativeZoom:17,attribution:'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'}}},zoomControl:{position:"bottomright"},rotateControl:{position:"bottomright"},scaleControl:{width:200,position:"bottomright",imperial:!1},pegmanControl:{position:"bottomright",theme:"leaflet-pegman-v3-small"},locateControl:{position:"bottomright"},fullscreenControl:{position:"topright",title:"Enter Fullscreen",titleCancel:"Exit Fullscreen",forceSeparateButton:!0},layersControl:{inline:!0,position:"topleft"},minimapControl:{position:"bottomleft",toggleDisplay:!1,toggleMapTypes:!0,width:75,height:75,aimingRectOptions:{color:"#000000",weight:1,opacity:0,fillOpacity:0},shadowRectOptions:{color:"#000000",weight:1,opacity:0,fillOpacity:0},mapOptions:{mapTypeId:"satellite",gestureHandling:!1,searchControl:!1,loadingControl:!1,_isMiniMap:!0,rotateControl:!1}},editInOSMControl:{position:"bottomright"},loadingControl:{separate:!0,position:"bottomright"},searchControl:{url:"https://nominatim.openstreetmap.org/search?format=json&accept-language={querylang}&q={s}",querylang:"en-US",detectUserLang:!0,jsonpParam:"json_callback",propertyName:"display_name",propertyLoc:["lat","lon"],markerLocation:!0,autoType:!1,autoCollapse:!0,firstTipSubmit:!0,minLength:1,zoom:10,position:"bottomright"},printControl:{position:"bottomright",hideControlContainer:!0,exportOnly:!0,sizeModes:["A4Portrait","A4Landscape"]},resizerControl:{direction:"s"},disableDefaultUI:!1,plugins:[],_isMiniMap:!1};function n(){this.zoomControl&&this.zoomControl.remove(),this.rotateControl&&this.rotateControl.remove(),this.fullscreenControl&&this.options.fullscreenControl&&!this.options.zoomControl&&this.fullscreenControl.remove(),this.searchControl&&this.options.searchControl&&this.searchControl.remove(),this.attributionControl&&this.attributionControl.remove()}function l(){let t=this.options;for(let e in a)!0===t[e]||void 0===t[e]?t[e]=a[e]:"object"==typeof this.options[e]&&t[e]instanceof Array==!1&&(t[e]=d(a[e],t[e]));t.apiKeys&&(t.apiKeys.thunderforest&&(t.mapTypes.atlas.options.apikey=t.apiKeys.thunderforest,t.mapTypes.terrain.options.apikey=t.apiKeys.thunderforest,t.mapTypes.cycle.options.apikey=t.apiKeys.thunderforest),t.apiKeys.google&&(t.pegmanControl.apiKey=t.apiKeys.google));for(let e of["atlas","terrain","cycle"])t.mapTypes[e].options.apikey&&-1===t.mapTypes[e].url.indexOf("apikey=")&&(t.mapTypes[e].url+=(-1===t.mapTypes[e].url.indexOf("?")?"?":"&")+"apikey={apikey}");!1===t.mapTypeIds.includes(t.mapTypeId)&&t.mapTypeIds.length>0&&(t.mapTypeId=t.mapTypeIds[0]),t.searchControl&&t.searchControl.detectUserLang&&(t.searchControl.querylang=window.navigator.languages?window.navigator.languages[0]:window.navigator.userLanguage||window.navigator.language),t.searchControl&&t.searchControl.querylang&&(t.searchControl.url=t.searchControl.url.replace("{querylang}",t.searchControl.querylang)),!t.minimapControl||t.center||t.zoom||this.setView([0,0],0)}function r(){let e={},a={},n={},l=this.options;l.gestureHandling&&this.gestureHandling.enable();for(let e in l.mapTypeIds){let o=l.mapTypeIds[e];l.mapTypes[o]&&(n[l.mapTypes[o].name]=a[o]=new t.TileLayer(l.mapTypes[o].url,l.mapTypes[o].options),a[o].mapTypeId=o)}if(this._lastMapTypeId=l.mapTypeId,this._prevMapTypeId=l.mapTypeId,this.on("baselayerchange",(function(t){t&&t.layer&&t.layer.mapTypeId&&(this._prevMapTypeId=this._lastMapTypeId,this._lastMapTypeId=t.layer.mapTypeId)})),this.on("baselayerchange",(function(t){t&&t.layer&&t.layer.mapTypeId&&t.layer.bringToBack&&t.layer.bringToBack()})),l.layersControl&&(e.layers=new t.Control.Layers(n,null,l.layersControl),this.on("zoomend",p,this)),l.attributionControl&&this.attributionControl&&(this.attributionControl.addTo(this),e.attribution=this.attributionControl,this.on("baselayerchange",t.bind(s,this,this.attributionControl.options.prefix))),l.editInOSMControl&&(e.editInOSM=new t.Control.EditInOSM(l.editInOSMControl)),l.scaleControl&&(e.scale=new t.Control.Scale(l.scaleControl)),l.zoomControl&&this.zoomControl&&(this.zoomControl.setPosition(l.zoomControl.position),this.zoomControl.addTo(this),e.zoom=this.zoomControl),l.rotateControl&&this.rotateControl&&(this.rotateControl.setPosition(l.rotateControl.position),this.rotateControl.addTo(this),e.rotate=this.rotateControl),l.pegmanControl&&(e.pegman=new t.Control.Pegman(l.pegmanControl)),l.locateControl&&(e.locate=new t.Control.Locate(l.locateControl)),l.searchControl&&(e.search=this.searchControl=new t.Control.Search(l.searchControl)),l.printControl&&(e.print=new t.Control.EasyPrint(l.printControl)),l.loadingControl&&(e.loading=new t.Control.Loading(l.loadingControl)),l.fullscreenControl&&t.Control.FullScreen&&(e.fullscreen=this.fullscreenControl=new t.Control.FullScreen(l.fullscreenControl)),l.minimapControl){let o=l.minimapControl.mapOptions.mapTypeId,i=l.mapTypes[o];i&&(i=new t.TileLayer(i.url,i.options),i.mapTypeId=o,e.minimap=new t.Control.MiniMap(i,l.minimapControl),e.minimap._mainMapBaseLayers=n)}l.resizerControl&&(e.resizer=new t.Control.Resizer(l.resizerControl));for(let t in e)e[t].addTo&&e[t].addTo(this);if(this.controls=e,this.whenReady((function(){if(this.fire("idle"),l.mapTypeId){let t=l.mapTypes[l.mapTypeId];if(t&&n[t.name]){l.layers=l.layers.filter((e=>e._leaflet_id!==n[t.name]._leaflet_id));let e=n[t.name];e.setZIndex?e.setZIndex(0):e.bringToBack&&e.bringToBack()}}}),this),l.mapTypeId){let t=l.mapTypes[l.mapTypeId];t&&n[t.name]&&l.layers.unshift(n[t.name])}if(l.plugins){if(!i.loader){let e=[];if(l.includeLeafletUICSS&&e.unshift("leaflet-ui@"+o+"/dist/leaflet-ui.css"),window.L){if(l.includeLeafletCSS&&t.version){let o="leaflet@"+t.version+"/dist/leaflet.css",i=!1;for(let t=0;t<document.styleSheets.length;t++)if(document.styleSheets[t].href&&document.styleSheets[t].href.indexOf(o)>0){i=!0;break}i||e.unshift(o)}}else e.unshift("leaflet@1.3.4/dist/leaflet.css"),e.unshift("leaflet@1.3.4/dist/leaflet.js");i.loader=i.loadSyncScripts([e,l.plugins])}if(this._initHooks){let t=this._initHooks.length;this.once("plugins_loaded",(function(){if(t<this._initHooks.length)for(let e=t,o=this._initHooks.length;e<o;e++)this._initHooks[e].call(this);this.fire("initHooks_called")}))}i.loader.then((()=>this.fire("plugins_loaded")))}}function s(e,o){o&&o.layer&&this.attributionControl.setPrefix(!(t.GridLayer.GoogleMutant&&o.layer instanceof t.GridLayer.GoogleMutant)&&e)}function p(t){let e=this.getZoom(),o=this.controls.layers,i=o._layerControlInputs;for(let t in i){let a=i[t],n=o._getLayer(a.layerId).layer;if("satellite"==n.mapTypeId){if(e>=18&&!n._map&&!n._isAutoToggled){n._isAutoToggled=!0,a.click();break}if(e<18&&n._map&&n._isAutoToggled){for(let t in i){let e=i[t];if(o._getLayer(e.layerId).layer.mapTypeId==this._prevMapTypeId){e.click();break}}n._isAutoToggled=!1;break}if(e<18&&!n._map&&n._isAutoToggled){n._isAutoToggled=!1;break}}}}t.Map.mergeOptions({mapTypeId:"streets",mapTypeIds:["streets","terrain","satellite","topo"],mapTypes:void 0,gestureHandling:!0,visualClick:!0,zoomControl:!0,scaleControl:!0,pegmanControl:!0,locateControl:!0,fullscreenControl:!0,layersControl:!0,minimapControl:!0,editInOSMControl:!0,loadingControl:!0,searchControl:!0,printControl:!1,resizerControl:!1,disableDefaultUI:!1,includeLeafletCSS:!0,includeLeafletUICSS:!0,apiKeys:void 0,_isMiniMap:!1}),t.Map.addInitHook((function(){n.call(this),this.options._isMiniMap||this.options.disableDefaultUI||(l.call(this),r.call(this))}));let m=t.Control.MiniMap.prototype.onAdd;function h(t,e){return t.some((t=>e.includes(t)))}function c(t){return t&&"object"==typeof t&&!Array.isArray(t)}function d(t,...e){if(!e.length)return t;const o=e.shift();if(c(t)&&c(o))for(const e in o)c(o[e])?(t[e]||Object.assign(t,{[e]:{}}),d(t[e],o[e])):Object.assign(t,{[e]:o[e]});return d(t,...e)}t.Control.MiniMap.include({onAdd:function(e){let o=m.call(this,e);return this._miniMap&&(this._miniMap.doubleClickZoom.disable(),this._miniMap.touchZoom.disable(),this._miniMap.scrollWheelZoom.disable()),this.options.toggleMapTypes&&(t.DomEvent.on(e,"baselayerchange",this._handleMainMapTypeChange,this),t.DomEvent.on(this._container,"click",this._handleMiniMapTypeToggle,this)),o},_handleMainMapTypeChange:function(e){if(!this._handligMiniMapTypeToggle&&e&&e.layer){let o=this,i=this._mainMap,a=o._layer.mapTypeId,n=e.layer.mapTypeId;if(i.options.mapTypeIds.length>0&&h(i.options.mapTypeIds,n)){let e,l;n!=a&&(o._lastMapTypeId=n),"satellite"==n&&"satellite"==a?e=o._lastMapTypeId:"satellite"!=n&&"satellite"!=a&&(e="satellite"),l=i.options.mapTypes[e],l&&(l=new t.TileLayer(l.url,l.options),l.mapTypeId=e,o._lastMapTypeId=a,o.changeLayer(l))}}},_handleMiniMapTypeToggle:function(){if(this._handligMiniMapTypeToggle=!0,this._layer&&this._mainMapBaseLayers){let e,o=this,i=this._mainMap,a=this._layer.mapTypeId;for(let t in this._mainMapBaseLayers)if(i.hasLayer(this._mainMapBaseLayers[t])&&a!=this._mainMapBaseLayers[t].mapTypeId){e=this._mainMapBaseLayers[t].mapTypeId;break}if(i.options.mapTypeIds.length>0&&h(i.options.mapTypeIds,a)){let e,n;if(e=o._lastMapTypeId||i.options.mapTypeId,"satellite"!=o._lastMapTypeId&&"satellite"!=a&&(e="satellite"),n=i.options.mapTypes[e],n){n=new t.TileLayer(n.url,n.options),n.mapTypeId=e,o._lastMapTypeId=a,o.changeLayer(n);for(let t in this._mainMapBaseLayers)this._mainMapBaseLayers[t].remove(),o._lastMapTypeId==this._mainMapBaseLayers[t].mapTypeId&&this._mainMapBaseLayers[t].addTo(i)}}this._handligMiniMapTypeToggle=!1}}})}()},t.init=()=>t.version?t.import(t.plugins).then(t.initUI):t.import("leaflet@1.7.1/dist/leaflet-src.esm.js").then((e=>e.extend(t,e)&&t.import(t.plugins).then(t.initUI)))}));
//# sourceMappingURL=leaflet-ui.js.map
