const CACHE_NAME = "gita-bali-v12";
const CORE_ASSETS = [
  "/",
  "/?mode=dashboard",
  "/preview/",
  "/preview/index.html",
  "/manifest.webmanifest",
  "/preview/assets/gita-bali-icon.svg",
  "/preview/assets/gita-bali-icon-180.png",
  "/preview/assets/gita-bali-icon-192.png",
  "/preview/assets/gita-bali-icon-512.png",
  "/preview/assets/gita-bali-intro.jpg",
  "/data/bab-01.json",
  "/data/bab-02.json",
  "/data/bab-03.json",
  "/data/bab-04.json",
  "/data/bab-05.json",
  "/data/bab-06.json",
  "/data/bab-07.json",
  "/data/bab-08.json",
  "/data/bab-09.json",
  "/data/bab-10.json",
  "/data/bab-11.json",
  "/data/bab-12.json",
  "/data/bab-13.json",
  "/data/bab-14.json",
  "/data/bab-15.json",
  "/data/bab-16.json",
  "/data/bab-17.json",
  "/data/bab-18.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("gita-bali-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === "opaque")) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (fallbackUrl) return cache.match(fallbackUrl);
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && (response.ok || response.type === "opaque")) cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.pathname.startsWith("/rest/") || url.pathname.startsWith("/auth/") || url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "/preview/index.html"));
    return;
  }
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }
  event.respondWith(networkFirst(request));
});
