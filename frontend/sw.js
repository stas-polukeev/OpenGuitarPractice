const CACHE_NAME = 'guitar-v2';

const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/main.css',
    '/css/fretboard.css',
    '/css/modes/find-the-note.css',
    '/js/app.js',
    '/js/config.js',
    '/js/components/fretboard-svg.js',
    '/js/components/feedback.js',
    '/js/components/overlay.js',
    '/js/components/settings-panel.js',
    '/js/services/api.js',
    '/js/services/audio.js',
    '/js/services/events.js',
    '/js/services/settings.js',
    '/js/services/stats.js',
    '/js/theory/notes.js',
    '/js/theory/fretboard.js',
    '/js/theory/tunings.js',
    '/js/theory/scales.js',
    '/js/theory/intervals-data.js',
    '/js/modes/mode-base.js',
    '/js/modes/mode-registry.js',
    '/js/modes/find-the-note/index.js',
    '/js/modes/find-the-note/game.js',
    '/js/modes/find-the-note/ui.js',
    '/js/modes/guitar-practice/index.js',
    '/js/modes/interval-training/index.js',
    '/js/modes/scale-practice/index.js',
    '/js/pages/theory-intervals.js',
    '/js/pages/theory-scales.js',
    '/js/pages/theory-chords.js',
    '/js/pages/theory-circle.js',
    '/assets/icons/icon-192.svg',
    '/assets/icons/icon-512.svg',
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // API calls: network-first (need server for challenges)
    if (url.pathname.startsWith('/api/')) {
        e.respondWith(
            fetch(e.request).catch(() =>
                new Response(JSON.stringify({ error: 'offline' }), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 503,
                })
            )
        );
        return;
    }

    // Static assets: cache-first, fallback to network
    e.respondWith(
        caches.match(e.request).then(cached => {
            if (cached) return cached;
            return fetch(e.request).then(resp => {
                if (resp.ok) {
                    const clone = resp.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                }
                return resp;
            });
        })
    );
});
