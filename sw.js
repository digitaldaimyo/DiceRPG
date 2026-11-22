const cacheName = 'dicebound-shell-v1';
const home = self.registration.scope;
const assets = ['manifest.webmanifest', 'icons/die-192.png', 'icons/die-512.png']
  .map(path => new URL(path, home).href);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll([home, ...assets])));
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

async function loadGame() {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(home, { cache: 'no-cache' });
    if (response.ok && !response.redirected) {
      await cache.put(home, response.clone());
      return response;
    }
    return await cache.match(home) || response;
  } catch (error) {
    const saved = await cache.match(home);
    if (saved) return saved;
    throw error;
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  url.search = '';
  if (request.mode === 'navigate' && [home, new URL('index.html', home).href].includes(url.href)) {
    event.respondWith(loadGame());
  } else if (assets.includes(request.url)) {
    event.respondWith(caches.open(cacheName).then(async cache =>
      await cache.match(request) || fetch(request)));
  }
});
