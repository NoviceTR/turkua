// TürkUA Service Worker — v1.0
const CACHE = 'turkua-v1';
const ASSETS = [
  '/turkua/',
  '/turkua/index.html',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600&family=Inter:wght@300;400;500;600&display=swap'
];

// Kurulum: temel dosyaları önbelleğe al
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// Aktivasyon: eski önbellekleri temizle
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: önce önbellek, sonra ağ (network-first for HTML, cache-first for assets)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // HTML — her zaman ağdan al, önbelleğe de kaydet
  if (e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Yazı tipleri ve statik dosyalar — önce önbellek
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
    return;
  }

  // Döviz/haber API'leri — sadece ağ (önbellek yok)
  if (url.hostname.includes('er-api') || url.hostname.includes('rss2json')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{}', { status: 503 })));
    return;
  }
});
