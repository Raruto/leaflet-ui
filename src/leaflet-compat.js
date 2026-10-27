/**
 * Adapter for Leaflet v1 
 */
export const Leaflet = window.L || window.leaflet;
if (!Leaflet) throw new Error('Leaflet must be loaded before leaflet-ui');

Leaflet.control ||= {};
Leaflet.gridLayer ||= {};

// Keep compatibility helpers private while sharing plugin registrations.
const L = Object.assign(Object.create(Leaflet), Leaflet.Util);
L.Util = {
  ...Leaflet.Util,
  extend: Object.assign,
  bind: (fn, context, ...args) => fn.bind(context, ...args),
  isArray: Array.isArray,
  requestAnimFrame: (fn, context) => requestAnimationFrame(context ? fn.bind(context) : fn),
};
L.Mixin = { Events: Object.fromEntries(
  Object.getOwnPropertyNames(L.Evented.prototype)
    .filter(name => name !== 'constructor')
    .map(name => [name, L.Evented.prototype[name]]),
) };
for (const [factory, Constructor] of Object.entries({
  marker: L.Marker,
  icon: L.Icon,
  divIcon: L.DivIcon,
  latLng: L.LatLng,
  rectangle: L.Rectangle,
})) {
  if (!L[factory]) L[factory] = (...args) => new Constructor(...args);
}
L.Browser = { any3d: true, ...Leaflet.Browser };
L.DomEvent = {
  ...Leaflet.DomEvent,
  addListener: Leaflet.DomEvent.on,
};
L.DomUtil = {
  ...Leaflet.DomUtil,
  addClass: (element, names) => element.classList.add(...names.trim().split(/\s+/)),
  removeClass: (element, names) => element.classList.remove(...names.trim().split(/\s+/)),
};

export default L;
