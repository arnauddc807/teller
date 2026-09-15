const CACHE = 'teller-v3';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Omzeil de HTTP-cache bij revalidatie: GitHub Pages zet max-age op assets,
// waardoor een nieuwe deploy anders tot 10 minuten onzichtbaar blijft.
const revalidate = (request) => fetch(request, { cache: 'no-cache' });

function put(request, response) {
  if (response && response.ok && response.type === 'basic') {
    const copy = response.clone();
    caches.open(CACHE).then((c) => c.put(request, copy));
  }
  return response;
}

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;

  // Navigatie: network-first, zodat een nieuwe deploy meteen zichtbaar is.
  if (request.mode === 'navigate') {
    e.respondWith(
      revalidate(request)
        .then((res) => put(request, res))
        .catch(() => caches.match(request).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  // Overige bestanden: stale-while-revalidate — snel uit cache, op de achtergrond verversen.
  e.respondWith(
    caches.match(request).then((hit) => {
      const network = revalidate(request).then((res) => put(request, res)).catch(() => hit);
      return hit || network;
    })
  );
});
