var C = 'mouthguard-v7';
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
  var req = e.request;
  if (req.method !== 'GET') return;

  // HTML 导航用 network-first：每次打开都回源拿最新线上版本，离线才回退缓存。
  // 这样以后改版用户打开即见，不会再卡在旧缓存（之前 cache-first 导致看不到新功能）。
  var isHtml = req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') > -1;
  if (isHtml) {
    e.respondWith(
      fetch(req, { cache: 'no-store' }).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(C).then(function (c) { c.put(req, copy); }).catch(function () {});
        }
        return res;
      }).catch(function () {
        return caches.match(req).then(function (r) {
          return r || caches.match('./index.html') || caches.match('./');
        });
      })
    );
    return;
  }

  // 图片 / manifest 等静态资源仍用 cache-first，保证离线可用。
  e.respondWith(
    caches.match(req).then(function (r) {
      return r || fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(C).then(function (c) { c.put(req, copy); }).catch(function () {});
        }
        return res;
      });
    })
  );
});
