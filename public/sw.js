// Service Worker - Caché de App Estática (Offline)
// Cachea: HTML, CSS, JS, iconos, fuentes
// NO cachea: API calls, música, imágenes de resultados

const CACHE_NAME = 'music-player-v1'
const STATIC_CACHE = 'music-player-static-v1'

// Assets estáticos que SIEMPRE se cachean
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
]

// Rutas de la app (para navegación offline)
const APP_ROUTES = [
  '/',
  '/search',
  '/library',
  '/favorites',
  '/playlists'
]

// ==========================================
// INSTALL - Cachear TODO desde el inicio
// ==========================================
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker instalando...')
  
  event.waitUntil(
    Promise.all([
      // Cache 1: Assets estáticos críticos (iconos, manifest)
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Cacheando assets críticos...')
        return cache.addAll(STATIC_ASSETS)
      }),
      
      // Cache 2: Pre-cachear TODAS las rutas de la app
      caches.open(CACHE_NAME).then((cache) => {
        console.log('📦 Pre-cacheando TODAS las rutas de la app...')
        // Forzar reload para obtener última versión
        return cache.addAll(
          APP_ROUTES.map(route => new Request(route, { cache: 'reload' }))
        )
      })
    ])
    .then(() => {
      console.log('✅ TODO cacheado - App 100% offline ready')
      return self.skipWaiting()
    })
    .catch((error) => {
      console.error('❌ Error durante instalación:', error)
      // Continuar de todos modos
      return self.skipWaiting()
    })
  )
})

// ==========================================
// ACTIVATE - Limpiar cachés viejos
// ==========================================
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activando...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Eliminar cachés que no sean el actual
            if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
              console.log('🗑️ Eliminando caché viejo:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('✅ Service Worker activado')
        return self.clients.claim()
      })
  )
})

// ==========================================
// FETCH - Estrategia de caché
// ==========================================
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // ==========================================
  // 1. NAVEGACIÓN (HTML) - Cache First con Network Fallback
  // ==========================================
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('📦 Sirviendo desde caché (navegación):', url.pathname)
            return cachedResponse
          }

          // Si no está en caché, intentar red
          return fetch(request)
            .then((response) => {
              // Cachear la respuesta para próximas visitas
              if (response.status === 200) {
                const responseClone = response.clone()
                caches.open(STATIC_CACHE).then((cache) => {
                  cache.put(request, responseClone)
                })
              }
              return response
            })
            .catch(() => {
              // Offline y no está cacheado - devolver index.html
              return caches.match('/index.html')
            })
        })
    )
    return
  }

  // ==========================================
  // 2. ASSETS ESTÁTICOS (JS, CSS, fonts) - Cache First
  // ==========================================
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
            console.log('📦 Sirviendo desde caché (asset):', url.pathname)
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

  // ==========================================
  // 3. ICONOS Y MANIFEST - Cache First
  // ==========================================
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

  // ==========================================
  // 4. API CALLS - Network Only (NO CACHEAR)
  // ==========================================
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname !== self.location.hostname
  ) {
    event.respondWith(
      fetch(request)
        .catch((error) => {
          console.log('❌ API call falló (offline):', url.pathname)
          // Devolver respuesta vacía para evitar errores
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

  // ==========================================
  // 5. TODO LO DEMÁS - Network First con Cache Fallback
  // ==========================================
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
              console.log('📦 Sirviendo desde caché (fallback):', url.pathname)
              return cachedResponse
            }
            // Si no hay nada en caché, devolver index.html
            return caches.match('/index.html')
          })
      })
  )
})

// ==========================================
// MESSAGES - Comunicación con la app
// ==========================================
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