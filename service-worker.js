self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('twitch-pwa').then(cache => {
      return cache.addAll([
        '/twitch-dual-pwa/',
        '/twitch-dual-pwa/index.html',
        '/twitch-dual-pwa/manifest.json',
        '/twitch-dual-pwa/icon-192.png',
        '/twitch-dual-pwa/icon-512.png'
      ]);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});
