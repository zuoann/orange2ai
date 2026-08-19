/* 菌物志 · 菌菌有神 —— Service Worker（离线缓存） */
var CACHE = "junjun-v1";
var CORE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./data.js",
  "./manifest.json"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) {
        return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  // 跨域（如 TF.js CDN）：网络优先，成功后缓存
  if (url.origin !== self.location.origin) {
    e.respondWith(
      caches.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) {
          if (res && res.status === 200) {
            var clone = res.clone();
            caches.open(CACHE).then(function (c) { c.put(req, clone); });
          }
          return res;
        });
      })
    );
    return;
  }

  // 同源：先缓存后网络；离线时回退首页
  e.respondWith(
    caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res && res.status === 200 &&
            (/\.(jpg|jpeg|png|webp|svg|css|js)$/.test(url.pathname) || url.pathname.indexOf("refs/") !== -1)) {
          var clone = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, clone); });
        }
        return res;
      });
    }).catch(function () {
      return caches.match("./index.html");
    })
  );
});
