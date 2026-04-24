const CACHE_NAME = 'weekmenu-cache-v4'; // Verhoogd naar v4
const ASSETS_TO_CACHE = [
    './',
    './manifest.json',
    './android-chrome-192x192.png',
    './android-chrome-512x512.png',
    './apple-touch-icon.png',
    './favicon.ico'
];

// Installeer event
self.addEventListener('install', event => {
    self.skipWaiting(); // Forceer onmiddellijke activering
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activeer event (gooit oude caches weg)
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim(); // Neem onmiddellijk de controle over
});

// Fetch event (Network-first benadering voor HTML bestanden)
self.addEventListener('fetch', event => {
    // Alleen GET requests afhandelen
    if (event.request.method !== 'GET') return;

    // Als we index.html opvragen, probeer EERST het netwerk.
    // Lukt dat niet (offline), pak hem dan pas uit de cache.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Sla direct de nieuwste versie in de cache op
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Voor plaatjes en andere bestanden: Cache-first
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            return response || fetch(event.request);
        })
    );
});
