const CACHE_NAME = 'cadmium-cache-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './default_cover.jpg',
  './bg_art.jpg',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => cache.add(url).catch(() => {}))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Pass YouTube, Google APIs, LRC through to network — never cache these
  if (
    url.includes('youtube.com') || url.includes('youtu.be') ||
    url.includes('googlevideo.com') || url.includes('googleapis.com') ||
    url.includes('lrclib.net') || url.includes('googleads') ||
    url.includes('doubleclick') || url.includes('fonts.g')
  ) {
    return;
  }

  // Cache-first for local app assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

// Respond to keep-alive pings from the page
self.addEventListener('message', (event) => {
  if (event.data === 'KEEP_ALIVE') {
    event.source && event.source.postMessage('SW_ALIVE');
  }
});
