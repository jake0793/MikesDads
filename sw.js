/* Mike's Dads GIM tracker — service worker: network-first app, cache fallback offline */
const CACHE = 'gim-v1';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin.endsWith('.supabase.co')) return;            // live data
  if (url.host === 'api.wiseoldman.net') return;              // live data
  if (url.host === 'templeosrs.com') return;                  // live data
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(r => {
        const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('./')))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
        return res;
      }).catch(() => r))
    );
  }
});
