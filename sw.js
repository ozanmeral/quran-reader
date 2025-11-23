const CACHE_NAME = 'quran-reader-v6-offline';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // Pre-cache data for instant offline access
  './data/quranix_yasarnuri_simple.json',
  './data/quranix_mesaj_simple.json'
];

// Install: Cache all critical assets immediately
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching all assets');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch Strategy
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // 1. DATA (JSON): Stale-While-Revalidate
  // Return from cache immediately, then update from network in background
  if (url.pathname.endsWith('.json')) {
    e.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(e.request).then(cachedResponse => {
          const fetchPromise = fetch(e.request).then(networkResponse => {
            cache.put(e.request, networkResponse.clone());
            return networkResponse;
          });
          // Return cached response if available, otherwise wait for network
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 2. ASSETS (HTML, CSS, JS, Images): Cache First, Network Fallback
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request).then(res => {
        // Cache new assets dynamically
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, res.clone());
          return res;
        });
      });
    })
  );
});