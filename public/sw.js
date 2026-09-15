/* Rink Rats service worker: precache the app shell, serve offline. */
const CACHE = "rink-rats-v1";
const ROUTES = ["/", "/player", "/player/new", "/player/edit", "/team", "/game/new", "/game/live", "/game/card", "/settings"];
const NETWORK_TIMEOUT_MS = 3000;

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

async function precache() {
  const cache = await caches.open(CACHE);
  const assets = new Set();
  for (const route of ROUTES) {
    for (const url of [route, route === "/" ? "/index.txt" : `${route}.txt`]) {
      try {
        const res = await fetch(url, { cache: "reload" });
        if (!res.ok) continue;
        await cache.put(url, res.clone());
        if (url === route) {
          const html = await res.text();
          for (const m of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)) assets.add(m[1]);
        }
      } catch {
        /* offline during install; runtime caching will fill in */
      }
    }
  }
  await Promise.all([...assets].map((a) => cache.add(a).catch(() => {})));
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
  return res;
}

async function networkFirst(req, { ignoreSearch }) {
  const cache = await caches.open(CACHE);
  try {
    const res = await withTimeout(fetch(req), NETWORK_TIMEOUT_MS);
    if (res.ok) cache.put(ignoreSearch ? new URL(req.url).pathname : req, res.clone());
    return res;
  } catch {
    const cached = await cache.match(req, { ignoreSearch });
    if (cached) return cached;
    if (req.mode === "navigate") return (await cache.match("/")) || Response.error();
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/_next/static/")) return event.respondWith(cacheFirst(req));
  if (req.mode === "navigate" || url.pathname.endsWith(".txt")) return event.respondWith(networkFirst(req, { ignoreSearch: true }));
  event.respondWith(networkFirst(req, { ignoreSearch: false }));
});
