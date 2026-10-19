// Service worker de l'appli MJ (D-M18) : l'app s'ouvre sans réseau.
// Modèle de sw.js : vite.config.ts y écrit au build le nom du cache et la liste des fichiers (constantes CACHE et FILES).
// Pages : réseau d'abord (une nouvelle version s'installe dès qu'on est en ligne), cache sinon.
// Autres fichiers (noms versionnés par le build) : cache d'abord.

const CACHE = __CACHE__
const FILES = __FILES__

// GitHub Pages sert les fichiers avec « Cache-Control: max-age=600 » : sans `cache: 'reload'` / `'no-cache'`, le
// navigateur peut rendre l'ancienne page (10 min) qui demande les fichiers de la version précédente, effacés du
// serveur et de l'ancien cache → page blanche (constaté au passage à 0.3.1).
self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(cache => cache.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('onepiece-mj-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', event => {
  const req = event.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  if (req.mode === 'navigate') {
    event.respondWith(
      Promise.race([fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }), new Promise((_, reject) => setTimeout(reject, 4000))]).catch(() =>
        caches.match('./', { ignoreSearch: true }),
      ),
    )
    return
  }
  event.respondWith(caches.match(req).then(hit => hit ?? fetch(req)))
})
