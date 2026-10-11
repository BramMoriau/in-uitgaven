// In/uitgave: maakt de app offline beschikbaar.
// Verhoog het versienummer als je een nieuwe index.html uploadt.
var CACHE = 'kasboek-v10';
var FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

// Elk bestand apart bewaren: ontbreekt er een, dan werkt de rest toch offline.
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(FILES.map(function (f) {
      return fetch(f, {cache: 'reload'}).then(function (res) {
        if (res && res.ok && !res.redirected) return c.put(f, res);
      }).catch(function () {});
    }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
// Eerst uit de cache (werkt offline), op de achtergrond vernieuwen als er internet is.
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(req, {ignoreSearch: true}).then(function (hit) {
      // Bij het openen van de app altijd de bewaarde startpagina kunnen tonen.
      if (!hit && req.mode === 'navigate') return c.match('index.html').then(function (h) { return h || c.match('./'); });
      return hit;
    }).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok && !res.redirected) c.put(req, res.clone());
        return res;
      }).catch(function () { return hit || Response.error(); });
      return hit || net;
    });
  }));
});
