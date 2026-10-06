/*
 * ChipSplit — service worker (app instalável e funcionando sem internet).
 * Ao lançar versão nova, troque VERSION para o celular baixar os arquivos novos.
 */
const VERSION = 'chipsplit-v0.9';
const FILES = [
  './', './index.html', './styles.css', './manifest.webmanifest', './config.js', './auth.js',
  './i18n.js', './fx.js', './ui-i18n.js', './chipsplit-core.js', './session-core.js',
  './examples.js', './account.js', './app.js', './live.js', './profile.js', './pwa.js',
  './privacidade.html', './termos.html', './legal.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Páginas: tenta a internet primeiro (pega atualização), senão usa a cópia salva.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // Arquivos do app e fontes: responde rápido com a cópia salva e atualiza em segundo plano.
  const sameOrigin = url.origin === self.location.origin;
  const fonts = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !fonts) return;
  e.respondWith(
    caches.open(VERSION).then((cache) => cache.match(req).then((cached) => {
      const net = fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => cached);
      return cached || net;
    }))
  );
});
