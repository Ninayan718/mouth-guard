var C = 'mouthguard-v4';
var FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-512.png', './icon-180.png', './wallpaper.html', './guide.html'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(C).then(function (c) {
    return Promise.all(FILES.map(function (f) {
      return c.add(f).catch(function () {});
    }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.map(function (k) { return k === C ? null : caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(function (r) {
    return r || fetch(e.request).catch(function () { return caches.match('./index.html'); });
  }));
});
