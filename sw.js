/* Service worker Repositori SLR: cache cangkerang aplikasi supaya ia boleh dipasang dan dibuka pantas.
   Permintaan ke Google (Firestore, Drive, GIS) tidak pernah dicache. */
const VERSION = 'rslr-v1.2.0';
const CACHE = 'rslr-' + VERSION;
const SHELL = [
  './', './index.html', './app.js', './config.js', './manifest.webmanifest',
  './mod/flip.js', './mod/harian.js', './mod/peta.js', './data/seen_dois.json',
  './vendor/firebase.bundle.js', './vendor/pdf.min.mjs', './vendor/pdf.worker.min.mjs',
  './icons/icon-64.png', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(SHELL.map(async url => { try { await cache.add(new Request(url, { cache: 'reload' })); } catch (e) {} }));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('rslr-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  // Web Share Target: fail PDF yang dikongsi ke aplikasi diletakkan dalam cache, kemudian aplikasi memuat naiknya ke Google Drive.
  if (req.method === 'POST' && new URL(req.url).pathname.endsWith('/kongsi')) {
    event.respondWith((async () => {
      try {
        const fd = await req.formData(); const files = fd.getAll('fail').filter(f => f && typeof f === 'object' && f.size);
        const cache = await caches.open('rslr-kongsi');
        let n = 0;
        for (const f of files) { await cache.put(new Request('./kongsi/' + Date.now() + '_' + (n++) + '.pdf'), new Response(f, { headers: { 'content-type': 'application/pdf', 'x-nama': encodeURIComponent(f.name || 'kongsi.pdf') } })); }
      } catch (e) {}
      return Response.redirect(new URL('./?kongsi=1', self.registration.scope).href, 303);
    })());
    return;
  }
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const isVendor = url.pathname.includes('/vendor/') || url.pathname.includes('/icons/');
  if (isVendor) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      if (res && res.ok) { const c = await caches.open(CACHE); c.put(req, res.clone()); }
      return res;
    })());
    return;
  }
  event.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res && res.ok && (req.mode === 'navigate' || url.pathname.endsWith('.js') || url.pathname.endsWith('.webmanifest') || url.pathname.endsWith('.html') || url.pathname.endsWith('.json'))) {
        const c = await caches.open(CACHE); c.put(req, res.clone());
      }
      return res;
    } catch (e) {
      const cached = await caches.match(req);
      if (cached) return cached;
      if (req.mode === 'navigate') { const shell = await caches.match('./index.html'); if (shell) return shell; }
      throw e;
    }
  })());
});
