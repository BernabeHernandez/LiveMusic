
const CACHE_NAME = 'music-player-v1'
const STATIC_CACHE = 'music-player-static-v1'

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
]

const APP_ROUTES = [
  '/',
  '/search',
  '/library',
  '/favorites',
  '/playlists'
]


self.addEventListener('install', (event) => {
  console.log('Service Worker instalando...')
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log(' Cacheando assets críticos...')
        return cache.addAll(STATIC_ASSETS)
      }),
      
      caches.open(CACHE_NAME).then((cache) => {
        console.log(' Pre-cacheando TODAS las rutas de la app...')
        return cache.addAll(
          APP_ROUTES.map(route => new Request(route, { cache: 'reload' }))
        )
      })
    ])
    .then(() => {
      console.log('TODO cacheado - App 100% offline ready')
      return self.skipWaiting()
    })
    .catch((error) => {
      console.error('Error durante instalación:', error)
      return self.skipWaiting()
    })
  )
})


self.addEventListener('activate', (event) => {
  console.log(' Service Worker activando...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
              console.log('Eliminando caché viejo:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker activado')
        return self.clients.claim()
      })
  )
})


self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)


  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('Sirviendo desde caché (navegación):', url.pathname)
            return cachedResponse
          }
          return fetch(request)
            .then((response) => {
              if (response.status === 200) {
                const responseClone = response.clone()
                caches.open(STATIC_CACHE).then((cache) => {
                  cache.put(request, responseClone)
                })
              }
              return response
            })
            .catch(() => {
              return caches.match('/index.html')
            })
        })
    )
    return
  }

  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.ttf')
  ) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('Sirviendo desde caché (asset):', url.pathname)
            return cachedResponse
          }

          return fetch(request)
            .then((response) => {
              if (response.status === 200) {
                const responseClone = response.clone()
                caches.open(STATIC_CACHE).then((cache) => {
                  cache.put(request, responseClone)
                })
              }
              return response
            })
        })
    )
    return
  }

  if (
    url.pathname.includes('/icon-') ||
    url.pathname.includes('/manifest.json') ||
    request.destination === 'image' && url.origin === self.location.origin
  ) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }

          return fetch(request)
            .then((response) => {
              if (response.status === 200) {
                const responseClone = response.clone()
                caches.open(STATIC_CACHE).then((cache) => {
                  cache.put(request, responseClone)
                })
              }
              return response
            })
        })
    )
    return
  }

  if (
    url.pathname.startsWith('/api/') ||
    url.hostname !== self.location.hostname
  ) {
    event.respondWith(
      fetch(request)
        .catch((error) => {
          console.log('API call falló (offline):', url.pathname)
          return new Response(
            JSON.stringify({ 
              error: 'Sin conexión', 
              offline: true,
              message: 'Esta función requiere conexión a internet'
            }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            }
          )
        })
    )
    return
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              console.log('Sirviendo desde caché (fallback):', url.pathname)
              return cachedResponse
            }
            return caches.match('/index.html')
          })
      })
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(STATIC_CACHE)
        .then((cache) => cache.addAll(event.data.urls))
    )
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        )
      })
    )
  }
})