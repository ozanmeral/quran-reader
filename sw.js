const CACHE_NAME = 'quran-reader-v5-optimized'; // Sürüm numarasını artırdım
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // Buraya varsayılan veriyi ekliyoruz, diğerleri talep edildikçe cache'lenecek
  './data/quranix_yasarnuri_simple.json'
];

// Install: Temel dosyaları cache'le
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: Eski cache'leri temizle
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

// Fetch: Network-first (JSON için), Cache-first (Static için)
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  
  // Veri dosyaları (json) için önce ağa git, olmazsa cache'e bak, o da yoksa hata
  // Bu sayede veri güncellemeleri anında yansır.
  if (url.pathname.endsWith('.json')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Diğer tüm varlıklar için önce Cache
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request).then(res => {
        // Dinamik olarak yüklenen yeni dosyaları da cache'e at
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      });
    })
  );
});