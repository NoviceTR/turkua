// TurkUA Service Worker - base-path safe static build 2026-07-01
const CACHE = 'turkua-v32-20260701';
const ASSETS = [
  './index.html',
  './manifest.json',
  './assets/css/style.min.css?v=20260701-28',
  './assets/js/site.min.js?v=20260701-28',
  './assets/img/icon-192.png',
  './data.min.js?v=20260701-28'
];
const PRECACHE_URLS = ASSETS.map(asset => new URL(asset, self.location.href).href);
const OFFLINE_URL = new URL('./index.html', self.location.href).href;
const ADMIN_PATH = new URL('./admin/', self.location.href).pathname;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => {
        if (key !== CACHE) return caches.delete(key);
        return Promise.resolve();
      })))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;
  if (url.origin === self.location.origin && url.pathname.startsWith(ADMIN_PATH)) return;

  if (url.hostname.includes('er-api') || url.hostname.includes('rss2json')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }).catch(() => new Response('{}', { status: 503 })));
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});
