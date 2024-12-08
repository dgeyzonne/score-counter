self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('my-app-cache').then((cache) => {
            return cache.addAll([
                '/',
                'game-list.html',
                'game-list.js',
                'icon-192x192.png',
                'icon-512x512.png',
                'index.html',
                'index.js',
                'score.html',
                'score.js',
                'styles.css'
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});