/* Service worker — Inventory
   tiene in cache la "scocca" dell'app per aprirla più in fretta; le pagine vengono sempre ricontrollate col server */
const CACHE = "inv-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

// la pagina può chiedere di attivare subito la nuova versione
self.addEventListener("message", (e) => { if (e.data === "skipWaiting") self.skipWaiting(); });

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// rete prima, cache come riserva (solo file dell'app, stesso dominio)
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("version.json")) return; // sempre dalla rete
  e.respondWith(
    (req.mode === "navigate" ? fetch(req.url, { cache: "no-cache", credentials: "same-origin" }).then((r) => (r.redirected ? fetch(req) : r)) : fetch(req)).then((res) => {
      if (res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
  );
});
