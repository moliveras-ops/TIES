// TIES — funciona sin señal: guarda la app y las librerías en el teléfono
const CACHE = 'ties-v4';
const BASE = ['./', 'index.html', 'styles.css', 'app.js', 'firebase-config.js', 'manifest.json', 'icon.svg', 'icon-192.png', 'icon-512.png'];
const FB = ['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js'].map(f => 'https://www.gstatic.com/firebasejs/11.0.2/' + f);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(async c => {
    await c.addAll(BASE);
    await Promise.all(FB.map(u => c.add(u).catch(() => {})));
  }).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  const propio = u.origin === location.origin;
  const cdn = u.hostname === 'www.gstatic.com' || u.hostname === 'cdn.jsdelivr.net';
  if (!propio && !cdn) return; // Firestore y Auth van directo
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: propio });
    const red = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return cdn ? (hit || red) : (hit ? (red.catch(() => {}), hit) : red);
  }));
});
