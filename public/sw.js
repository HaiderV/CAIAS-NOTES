// CAIAS Notes Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple pass-through fetch to satisfy PWA installation criteria
  // without interfering with Vite HMR or API calls.
  event.respondWith(fetch(event.request));
});
