// sw.js - Service Worker para LoveTrack PWA
// Solo cachea archivos estáticos del shell, NO intercepta Firebase

const CACHE_NAME  = 'lovetrack-v3';
const SHELL_CACHE = [
    '/index.html',
    '/home.html',
    '/map.html',
    '/chat.html',
    '/moments.html',
    '/profile.html',
    '/css/style.css',
    '/js/app.js',
    '/js/firebase.js',
    '/js/location.js',
    '/js/map.js',
    '/js/chat.js',
    '/manifest.json'
];

// ── Instalar: pre-cache del shell ──────────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(SHELL_CACHE))
            .then(() => self.skipWaiting())
    );
});

// ── Activar: limpiar caches viejos ─────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys =>
                Promise.all(
                    keys
                        .filter(k => k !== CACHE_NAME)
                        .map(k => caches.delete(k))
                )
            )
            .then(() => self.clients.claim())
    );
});

// ── Fetch: estrategia Network-first para Firebase, Cache-first para shell ──
self.addEventListener('fetch', event => {
    const url = event.request.url;

    // NO interceptar Firebase, Google APIs, ni peticiones POST
    if (
        url.includes('firebaseio.com') ||
        url.includes('firestore.googleapis.com') ||
        url.includes('googleapis.com') ||
        url.includes('gstatic.com') ||
        url.includes('nominatim.openstreetmap.org') ||
        url.includes('unpkg.com') ||
        url.includes('fonts.googleapis.com') ||
        url.includes('cdnjs.cloudflare.com') ||
        url.includes('cartocdn.com') ||
        url.includes('basemaps') ||
        event.request.method !== 'GET'
    ) {
        return; // Dejar que el browser lo maneje directamente
    }

    // Para archivos del shell: Cache-first
    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                if (cached) return cached;
                return fetch(event.request)
                    .then(response => {
                        if (response && response.status === 200) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(event.request, clone));
                        }
                        return response;
                    })
                    .catch(() => caches.match('/index.html'));
            })
    );
});
