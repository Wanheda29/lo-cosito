const CACHE = "lo-cosito-v2";
const ASSETS = ["./", "./index.html", "./styles.css", "./app.js", "./domain.js", "./combos.js", "./storage.js", "./pdf-export.js", "./vendor/jspdf.umd.min.js", "./vendor/jspdf.plugin.autotable.min.js", "./cloud.js", "./cloud-config.js", "./manifest.webmanifest"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});
self.addEventListener("activate", (event) => event.waitUntil(Promise.all([
  self.clients.claim(),
  caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("lo-cosito-") && key !== CACHE).map((key) => caches.delete(key)))),
])));
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("./index.html")));
    return;
  }
  if (event.request.url === new URL("./cloud-config.js", self.registration.scope).href) {
    event.respondWith(fetch(event.request, { cache: "no-cache" }).then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(CACHE);
        await cache.put(event.request, response.clone());
      }
      return response;
    }).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
