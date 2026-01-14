const CACHE_NAME = 'music-player-v1'

self.addEventListener('install', (event) => {
  console.log('Service Worker instalado (sin caché)')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activado')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName)
        })
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  return
})