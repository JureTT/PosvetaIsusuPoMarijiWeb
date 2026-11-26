/* Offline cache: opened pages and content keep working without internet. Bump VERSION when files change. */
const VERSION = 'posveta-v6';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'manifest.webmanifest',
  'content/days.json', 'content/intro.json', 'content/prayers.json',
  'themes.js', 'icons/flame.png', 'icons/flame-bold.png', 'icons/flame-detail.png', 'icons/flame-solid.png',
  'fonts/cg-latin-500.woff2', 'fonts/cg-latin-ext-500.woff2', 'fonts/cg-latin-600.woff2', 'fonts/cg-latin-ext-600.woff2', 'fonts/cg-latin-700.woff2', 'fonts/cg-latin-ext-700.woff2',
  'fonts/cg-latin-500i.woff2', 'fonts/cg-latin-ext-500i.woff2', 'fonts/cg-latin-600i.woff2', 'fonts/cg-latin-ext-600i.woff2',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(cache => cache.match(req, {ignoreSearch: true}).then(hit => {
    const net = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  })));
});
