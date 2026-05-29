const CACHE_NAME = 'rugby-orcos-cache-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/orcos_logo.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Ignorar WebSocket y hot reload del servidor de desarrollo
  if (e.request.url.includes('ws') || e.request.url.includes('hot-update') || e.request.url.includes('chrome-extension')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // En segundo plano busca una versión fresca para calentar la caché del próximo inicio
        fetch(e.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(e.request, networkResponse);
              });
            }
          })
          .catch(() => {}); // Falla silencioso si está offline
        return cachedResponse;
      }
      return fetch(e.request);
    })
  );
});
