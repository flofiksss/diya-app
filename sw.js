const CACHE = 'diya-v1';
const FILES = [
  '/diya-app/',
  '/diya-app/index.html',
  '/diya-app/style.css',
  '/diya-app/app.js',
  '/diya-app/icon-192.png',
  '/diya-app/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
