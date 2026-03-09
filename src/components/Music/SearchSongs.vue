<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlayerStore } from '../../stores/player'
import { Search, Music, Play, Pause, Loader, Heart, Disc } from 'lucide-vue-next'
import AlbumView from './AlbumView.vue'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const query = ref('')
const results = ref([])
const albums = ref([])
const selectedAlbum = ref(null)
const isAlbumViewOpen = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const currentOffset = ref(0)
const hasMore = ref(true)
const isLoadingMore = ref(false)
const totalAvailable = ref(0)
const expansionInProgress = ref(false)
const isExpanded = ref(false)

const INITIAL_LIMIT = 30  
const LOAD_MORE_LIMIT = 10
const MAX_RESULTS = 100
const MAX_AUTO_LOADS = 6
const RETRY_DELAY = 1500 
const MAX_RETRY_ATTEMPTS = 3 
const PRELOAD_COUNT = 20

const STORAGE_KEY = 'music_search_state'

let autoLoadCount = 0
let retryTimeout = null
let scrollTimeout = null
let retryAttempts = 0

const toggleFavorite = (event, track) => {
  event.stopPropagation() 
  playerStore.toggleFavorite(track)
}

const isFavorite = (videoId) => {
  return playerStore.isFavorite(videoId)
}

const saveSearchState = () => {
  if (!query.value || (results.value.length === 0 && albums.value.length === 0)) return
  
  try {
    const state = {
      query: query.value,
      results: results.value,
      albums: albums.value,
      totalAvailable: totalAvailable.value,
      hasMore: hasMore.value,
      currentOffset: currentOffset.value,
      isExpanded: isExpanded.value,
      timestamp: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    console.log('Estado guardado:', query.value)
  } catch (error) {
    console.error('Error guardando búsqueda:', error)
  }
}

const loadSearchState = (targetQuery = null) => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return false
    
    const state = JSON.parse(saved)
    if (!state || !state.query) return false
    
    // Validación de query objetivo
    if (targetQuery && state.query.toLowerCase() !== targetQuery.toLowerCase()) {
      return false
    }

    // Solo restaurar si realmente hay contenido útil (canciones o álbumes)
    const hasData = (state.results && state.results.length > 0) || (state.albums && state.albums.length > 0)
    if (!hasData) {
      console.log('[Search] Estado guardado vacío o inválido, ignorando');
      return false
    }

    const isRecent = Date.now() - state.timestamp < 24 * 60 * 60 * 1000
    if (!isRecent) {
      localStorage.removeItem(STORAGE_KEY)
      return false
    }
    
    query.value = state.query
    results.value = Array.isArray(state.results) ? state.results : []
    albums.value = Array.isArray(state.albums) ? state.albums : []
    totalAvailable.value = state.totalAvailable || 0
    hasMore.value = state.hasMore !== undefined ? state.hasMore : true
    currentOffset.value = state.currentOffset || 0
    isExpanded.value = state.isExpanded || false
    
    console.log('[Search] Restauración completa:', state.query, `(${results.value.length} temas, ${albums.value.length} álbumes)`)
    return true
  } catch (error) {
    console.error('[Search] Error en loadSearchState:', error)
    return false
  }
}

const cleanUploader = (name) => {
  if (!name) return 'Artista desconocido'
  return name.replace(/\s*-\s*Topic$/i, '').replace(/YouTube/i, 'Oficial')
}

const preloadAudioUrls = async (items) => {
  playerStore.prefetchTracks(items.map(item => ({
    videoId: item.videoId || item.url?.split('v=')[1]?.split('&')[0] || item.url?.split('/').pop(),
    title: item.title,
    artist: item.artist || item.uploader || 'YouTube',
    thumbnail: item.thumbnail,
    duration: item.duration || 0
  })), 3);
};

const search = async (loadMore = false) => {
  if (!query.value.trim()) return

  if (!loadMore) {
    console.log('Nueva búsqueda');
    isLoading.value = true
    results.value = []
    albums.value = []
    currentOffset.value = 0
    hasMore.value = true
    totalAvailable.value = 0
    expansionInProgress.value = false
    isExpanded.value = false
    autoLoadCount = 0
    retryAttempts = 0
    if (retryTimeout) clearTimeout(retryTimeout)
  } else {
    console.log('Cargando más (offset:', currentOffset.value, ')');
    isLoadingMore.value = true
  }
  
  errorMessage.value = ''

  try {
    const limit = loadMore ? LOAD_MORE_LIMIT : INITIAL_LIMIT
    const offset = currentOffset.value
    
    const url = `${API_URL}/api/search?q=${encodeURIComponent(query.value)}&limit=${limit}&offset=${offset}`
    
    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Error en la búsqueda')
    }

    const items = data.items || []
    
    if (loadMore && items.length === 0 && data.hasMore) {
      console.log('Sin items pero backend dice que hay más. Expansion en progreso:', data.expansionInProgress);
      
      if (data.expansionInProgress && retryAttempts < MAX_RETRY_ATTEMPTS) {
        expansionInProgress.value = true;
        retryAttempts++;
        console.log(`Expansión en progreso, reintentando (intento ${retryAttempts}/${MAX_RETRY_ATTEMPTS}) en ${RETRY_DELAY}ms`);
        
        retryTimeout = setTimeout(() => {
          if (hasMore.value && !isLoading.value && !isLoadingMore.value) {
            console.log('Reintentando carga...');
            search(true);
          }
        }, RETRY_DELAY);
        
        isLoadingMore.value = false;
        return; 
      } else if (retryAttempts >= MAX_RETRY_ATTEMPTS) {
        console.log('Máximo de reintentos alcanzado');
        hasMore.value = false;
        expansionInProgress.value = false;
        isLoadingMore.value = false;
        return;
      }
    } else if (loadMore && items.length === 0 && !data.hasMore) {
      console.log(' No hay más resultados disponibles');
      hasMore.value = false;
      isLoadingMore.value = false;
      return;
    }
    
    if (loadMore) {
      results.value = [...results.value, ...items]
    } else {
      results.value = items
      albums.value = data.albums || []
      if (items.length > 0) {
        preloadAudioUrls(items);
      }
    }

    totalAvailable.value = data.total || 0
    hasMore.value = data.hasMore
    expansionInProgress.value = data.expansionInProgress || false
    isExpanded.value = data.isExpanded || false
    currentOffset.value += items.length
    
    if (items.length > 0) {
      retryAttempts = 0;
    }
    
    console.log(' Resultados:', {
      recibidos: items.length,
      totalCargados: results.value.length,
      totalDisponibles: totalAvailable.value,
      offset: currentOffset.value,
      hayMas: hasMore.value,
      expandiendo: expansionInProgress.value,
      expandido: isExpanded.value
    });

    if (!results.value.length && !loadMore) {
      errorMessage.value = 'No se encontraron resultados'
    }

    saveSearchState()

    await nextTick()

    if (!loadMore && hasMore.value && !isScrollable() && autoLoadCount < MAX_AUTO_LOADS) {
      autoLoadCount++
      console.log(`Página sigue sin scroll (auto-carga #${autoLoadCount}/${MAX_AUTO_LOADS})`);
      
      setTimeout(() => {
        if (hasMore.value && !isLoading.value && !isLoadingMore.value && !expansionInProgress.value) {
          search(true)
        }
      }, 400) 
    }
  } catch (err) {
    console.error('Error:', err)
    errorMessage.value = err.message || 'Error al buscar canciones'
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

const isScrollable = () => {
  const scrollHeight = document.documentElement.scrollHeight
  const viewportHeight = window.innerHeight
  return scrollHeight > viewportHeight + 60 
}

const loadMoreResults = () => {
  if (isLoadingMore.value || expansionInProgress.value) {
    console.log('Ya está cargando o expandiendo')
    return
  }
  
  if (!hasMore.value) {
    console.log('No hay más resultados')
    return
  }
  
  if (isLoading.value) {
    console.log('Búsqueda inicial en proceso')
    return
  }
  
  if (results.value.length >= MAX_RESULTS) {
    console.log('Límite de 100 canciones alcanzado')
    hasMore.value = false
    return
  }
  
  console.log('Cargando más desde offset:', currentOffset.value)
  search(true)
}

const playTrack = (item, index) => {
  const tracksQueue = results.value.map(result => ({
    videoId: result.videoId || result.url?.split('v=')[1]?.split('&')[0] || result.url?.split('/').pop(),
    title: result.title,
    artist: result.artist || result.uploader || 'YouTube',
    thumbnail: result.thumbnail,
    duration: result.duration || 0
  }))

  playerStore.setQueue(tracksQueue, index)
  
  const nextItems = results.value.slice(index + 1, index + 4);
  if (nextItems.length > 0) {
    preloadAudioUrls(nextItems);
  }
}

const formatDuration = (seconds) => {
  if (!seconds) return ''
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const openAlbum = (album) => {
  selectedAlbum.value = album
  isAlbumViewOpen.value = true
}

const closeAlbum = () => {
  isAlbumViewOpen.value = false
  // Don't null selectedAlbum immediately to avoid transition glitches
  setTimeout(() => {
    if (!isAlbumViewOpen.value) selectedAlbum.value = null
  }, 400)
}

const handleScroll = () => {
  if (scrollTimeout) clearTimeout(scrollTimeout)

  scrollTimeout = setTimeout(() => {
    if (isLoadingMore.value || expansionInProgress.value || isLoading.value) {
      return 
    }
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollHeight = document.documentElement.scrollHeight
    const clientHeight = window.innerHeight
    
    const scrolled = scrollTop + clientHeight
    const threshold = scrollHeight * 0.85

    if (scrolled >= threshold) {
      if (!isLoadingMore.value && hasMore.value && !isLoading.value && !expansionInProgress.value) {
        console.log(`Scroll detectado (${Math.round((scrolled / scrollHeight) * 100)}%) - cargando más`)
        loadMoreResults()
      }
    }
  }, 150)
}

const manualLoadMore = () => {
  if (!isLoadingMore.value && !expansionInProgress.value && hasMore.value) {
    loadMoreResults();
  }
}

watch(
  () => route.query.q,
  (newQuery) => {
    console.log('[Search] Watch detectado, query:', newQuery);
    
    if (newQuery) {
      const q = String(newQuery).trim();
      
      // 1. Si los resultados actuales ya son correctos en memoria, no hacer nada
      if (q.toLowerCase() === query.value.toLowerCase() && (results.value.length > 0 || albums.value.length > 0)) {
        console.log('[Search] Resultados ya cargados en memoria');
        return;
      }

      // 2. Intentar restaurar de localStorage (ej. cuando volvemos de Favoritos)
      if (loadSearchState(q)) {
        return;
      }

      // 3. Ejecutar búsqueda real si no hay nada guardado
      console.log('[Search] Ejecutando búsqueda fresca para:', q);
      query.value = q;
      search(false);
    } else if (route.path === '/search') {
      // Si entramos a /search sin query, intentar restaurar la última búsqueda si existe
      console.log('[Search] Sin query en URL, intentando restaurar cualquier estado reciente');
      const restored = loadSearchState();
      if (restored && query.value) {
        router.replace({ path: '/search', query: { q: query.value } });
      }
    }
  },
  { immediate: true }
)

onMounted(() => {
  console.log('[Search] Montado');
  window.addEventListener('scroll', handleScroll, { passive: true });
})

onUnmounted(() => {
  console.log('Componente desmontado')
  window.removeEventListener('scroll', handleScroll)
  if (scrollTimeout) clearTimeout(scrollTimeout)
  if (retryTimeout) clearTimeout(retryTimeout)
  if (results.value.length > 0) {
    saveSearchState()
  }
})
</script>

<template>
  <div class="search-container">
    <div class="search-header" v-if="query">
      <Search :size="24" class="search-icon" />
      <h2>Resultados para "{{ query }}"</h2>
      <div class="search-stats" v-if="results.length || albums.length">
        <span class="stats-text" v-if="results.length">{{ results.length }} de {{ totalAvailable || '?' }} canciones</span>
        <span v-if="isExpanded" class="stats-badge">Expansión completa</span>
        <span v-else-if="expansionInProgress" class="stats-badge expanding">Buscando más...</span>
      </div>
    </div>

    <!-- Albums Section -->
    <div v-if="albums.length && !isLoading" class="albums-section">
      <div class="section-header">
        <Disc :size="20" class="section-icon" />
        <h3>Álbumes</h3>
      </div>
      <div class="albums-scroll">
        <div 
          v-for="album in albums" 
          :key="album.id" 
          class="album-card"
          @click="openAlbum(album)"
        >
          <div class="album-artwork-wrapper">
            <img :src="album.thumbnail" :alt="album.title" class="album-artwork" loading="lazy" />
            <div class="album-overlay">
              <Play :size="24" fill="currentColor" />
            </div>
            <!-- Badge oficial flotante -->
            <div v-if="album.isOfficial" class="official-badge-floating" title="Canal Oficial">
              <Disc :size="14" fill="currentColor" />
            </div>
          </div>
          <div class="album-info-short">
            <div class="title-with-badge">
              <p class="album-title">{{ album.title }}</p>
            </div>
            <p class="album-artist">{{ cleanUploader(album.uploader) }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!query && !isLoading" class="search-welcome">
      <div class="welcome-content">
        <Search :size="64" class="welcome-icon" />
        <h3>Encuentra tu música favorita</h3>
        <p>Busca canciones, artistas o álbumes arriba</p>
      </div>
    </div>

    <div v-if="isLoading" class="loading-overlay">
      <Loader :size="40" class="spinner" />
      <p>Buscando resultados...</p>
    </div>

    <div v-else-if="errorMessage" class="error-message">
      <p>{{ errorMessage }}</p>
      <button @click="search(false)" class="retry-btn">Reintentar</button>
    </div>

    <div v-else-if="query && !results.length && !albums.length && !isLoading" class="no-results-found">
      <Music :size="48" class="no-results-icon" />
      <p>No encontramos resultados para "{{ query }}"</p>
      <span>Prueba con otros términos de búsqueda</span>
    </div>

    <div class="results-grid" v-if="results.length">
      <div
        v-for="(item, index) in results"
        :key="`${item.videoId}-${index}`"
        class="song-card"
        :class="{ 'is-playing': playerStore.currentTrack?.videoId === item.videoId }"
        @click="playTrack(item, index)"
      >
        <div class="thumbnail-wrapper">
          <img
            :src="item.thumbnail"
            @error="e => { e.target.src = 'https://via.placeholder.com/120?text=' }"
            class="thumbnail"
            alt="Portada"
            loading="lazy"
          />
          <div class="play-overlay">
            <Play v-if="!playerStore.currentTrack || playerStore.currentTrack?.videoId !== item.videoId || !playerStore.isPlaying" 
                  :size="32" 
                  class="play-icon" 
            />
            <Pause v-else :size="32" class="play-icon" />
          </div>
          
          <button
            class="favorite-badge"
            :class="{ 'is-favorite': isFavorite(item.videoId) }"
            @click="toggleFavorite($event, item)"
            :title="isFavorite(item.videoId) ? 'Quitar de favoritos' : 'Agregar a favoritos'"
          >
            <Heart 
              :size="16" 
              :fill="isFavorite(item.videoId) ? 'currentColor' : 'none'"
            />
          </button>
        </div>
        
        <div class="info">
          <p class="title">{{ item.title }}</p>
          <div class="metadata">
            <Music :size="14" class="metadata-icon" />
            <span class="artist">{{ item.artist || item.uploader || 'YouTube' }}</span>
            <span v-if="item.duration" class="duration">{{ formatDuration(item.duration) }}</span>
          </div>
        </div>

        <div class="play-indicator" v-if="playerStore.currentTrack?.videoId === item.videoId">
          <div class="equalizer" v-if="playerStore.isPlaying">
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="expansionInProgress" class="loading-more expansion-message">
      <Loader :size="28" class="spinner" />
      <div class="expansion-details">
        <p>Buscando más resultados...</p>
        <p class="expansion-subtext">({{ results.length }} cargados - Intento {{ retryAttempts + 1 }}/{{ MAX_RETRY_ATTEMPTS }})</p>
      </div>
    </div>

    <div v-if="isLoadingMore && !expansionInProgress" class="loading-more">
      <Loader :size="28" class="spinner" />
      <p>Cargando más... ({{ results.length }} / {{ totalAvailable }})</p>
    </div>

    <div v-if="hasMore && !isLoadingMore && !expansionInProgress && results.length > 0" class="load-more-button-container">
      <button class="load-more-button" @click="manualLoadMore" :disabled="isLoadingMore || expansionInProgress">
        <Loader v-if="isLoadingMore" :size="20" class="button-spinner" />
        <span v-else>Cargar más resultados</span>
      </button>
    </div>

    <div v-if="!hasMore && results.length && !isLoading && !isLoadingMore && !expansionInProgress" class="no-more-results">
      <p v-if="results.length >= MAX_RESULTS">
        ¡Límite máximo alcanzado! ({{ MAX_RESULTS }} canciones)
      </p>
      <p v-else-if="isExpanded && results.length >= totalAvailable">
        ¡Todo cargado! ({{ results.length }} canciones de {{ totalAvailable }} disponibles)
      </p>
      <p v-else-if="!isExpanded && results.length < totalAvailable">
        {{ results.length }} canciones disponibles (expansión no completada)
      </p>
      <p v-else>
        {{ results.length }} canciones disponibles
      </p>
    </div>

    <!-- Album Detail View Overlay -->
    <AlbumView 
      v-if="selectedAlbum" 
      :album="selectedAlbum" 
      :is-open="isAlbumViewOpen"
      @close="closeAlbum"
    />
  </div>
</template>

<style scoped>
.search-container {
  padding: 0.75rem;
  padding-bottom: 140px;
  min-height: 100vh;
  color: white;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.search-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.25rem 0;
}

/* Albums Section Styles */
.albums-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.section-icon {
  color: #ff2d55;
}

.section-header h3 {
  margin: 0;
  font-size: 1.1rem;
  letter-spacing: -0.02em;
}

.albums-scroll {
  display: flex;
  gap: 1.25rem;
  overflow-x: auto;
  padding: 0.5rem 0.5rem 1.5rem;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  position: relative;
}

/* Sombreado a la derecha para indicar scroll */
.albums-section::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 40px;
  background: linear-gradient(to right, transparent, #121212);
  pointer-events: none;
  z-index: 5;
  opacity: 0.8;
}

.albums-scroll::-webkit-scrollbar {
  display: none;
}

.album-card {
  flex: 0 0 160px;
  scroll-snap-align: start;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.album-card:active {
  transform: scale(0.95);
}

.album-artwork-wrapper {
  position: relative;
  width: 160px;
  height: 160px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  background: #282828;
  margin-bottom: 0.75rem;
}

.official-badge-floating {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 45, 85, 0.9);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

.album-artwork {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.album-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  color: white;
  backdrop-filter: blur(4px);
}

.album-card:hover .album-artwork {
  transform: scale(1.05);
}

.album-card:hover .album-overlay {
  opacity: 1;
}

.album-info-short {
  min-width: 0;
  padding: 0 4px;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.album-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #fff;
}

.album-artist {
  margin: 0;
  font-size: 0.8rem;
  color: #b3b3b3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-icon {
  color: #ff2d55;
  flex-shrink: 0;
}

.search-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

.search-stats {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #b3b3b3;
}

.stats-text {
  font-weight: 500;
}

.stats-badge {
  background: rgba(29, 185, 84, 0.2);
  color: #ff2d55;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.stats-badge.expanding {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Feedback States */
.search-welcome, .no-results-found, .loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  gap: 1.5rem;
  padding: 2rem;
  color: #b3b3b3;
  animation: fadeIn 0.4s ease-out;
}

.welcome-icon, .no-results-icon {
  color: rgba(255, 45, 85, 0.4);
}

.welcome-content h3, .no-results-found p {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  letter-spacing: -0.01em;
}

.welcome-content p, .no-results-found span {
  margin-top: 0.5rem;
  font-size: 0.95rem;
  opacity: 0.7;
}

.retry-btn {
  margin-top: 1rem;
  background: #ff2d55;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.retry-btn:hover {
  transform: scale(1.05);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.loading, .loading-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 1rem;
  color: #b3b3b3;
  padding: 1rem;
}

.loading-more {
  min-height: auto;
  padding: 2rem 1rem;
}

.expansion-message {
  color: #ffc107;
  border: 1px solid rgba(255, 193, 7, 0.3);
  background: rgba(255, 193, 7, 0.1);
  border-radius: 10px;
  margin: 1rem 0;
  text-align: center;
}

.expansion-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.expansion-subtext {
  font-size: 0.875rem;
  opacity: 0.8;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.button-spinner {
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
}

.error-message {
  background: rgba(255, 68, 68, 0.12);
  border: 1px solid #ff4444;
  color: #ff6b6b;
  padding: 1rem;
  border-radius: 10px;
  text-align: center;
  margin: 1rem 0;
}

.results-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.65rem;
  width: 100%;
}

.song-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem;
  background: #181818;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  min-height: 72px;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

@media (hover: hover) {
  .song-card:hover {
    background: #282828;
  }
}

.song-card.is-playing {
  background: #282828;
}

.song-card:active {
  transform: scale(0.98);
}

.thumbnail-wrapper {
  position: relative;
  flex-shrink: 0;
}

.thumbnail {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  object-fit: cover;
  display: block;
}

.play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s ease;
  border-radius: 6px;
}

@media (hover: hover) {
  .song-card:hover .play-overlay,
  .song-card:active .play-overlay {
    opacity: 1;
  }
}

@media (hover: none) {
  .song-card.is-playing .play-overlay {
    opacity: 1;
  }
}

.play-icon {
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
}

.favorite-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  border: none;
  color: #b3b3b3;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: all 0.2s;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
}

@media (hover: hover) {
  .song-card:hover .favorite-badge {
    opacity: 1;
  }
}

@media (hover: none) {
  .favorite-badge {
    opacity: 1;
  }
}

.favorite-badge.is-favorite {
  opacity: 1;
  color: #ff2d55;
  background: rgba(29, 185, 84, 0.2);
}

.favorite-badge:hover {
  transform: scale(1.15);
  background: rgba(29, 185, 84, 0.3);
  color: #ff2d55;
}

.favorite-badge.is-favorite:hover {
  color: #ff4444;
  background: rgba(255, 68, 68, 0.2);
}

.info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  padding-right: 0.5rem;
}

.title {
  margin: 0 0 0.3rem 0;
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

.metadata {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #b3b3b3;
  font-size: 0.75rem;
  line-height: 1.2;
  flex-wrap: wrap;
}

.metadata-icon {
  flex-shrink: 0;
}

.artist {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.duration {
  flex-shrink: 0;
  color: #888;
  white-space: nowrap;
}

.play-indicator {
  flex-shrink: 0;
  margin-left: auto;
  padding-left: 0.5rem;
}

.equalizer {
  display: flex;
  align-items: flex-end;
  gap: 2.5px;
  height: 20px;
}

.bar {
  width: 3px;
  background: #ff2d55;
  border-radius: 3px;
  animation: equalize 0.9s ease-in-out infinite;
}

.bar:nth-child(2) { animation-delay: 0.2s; }
.bar:nth-child(3) { animation-delay: 0.35s; }

@keyframes equalize {
  0%, 100% { height: 5px; }
  50%      { height: 20px; }
}

.load-more-button-container {
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
}

.load-more-button {
  background: #1db954;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 180px;
}

.load-more-button:hover:not(:disabled) {
  background: #1ed760;
  transform: scale(1.05);
}

.load-more-button:active:not(:disabled) {
  transform: scale(0.95);
}

.load-more-button:disabled {
  background: #535353;
  cursor: not-allowed;
  opacity: 0.7;
}

.no-more-results {
  text-align: center;
  padding: 2.5rem 1rem;
  color: #b3b3b3;
  font-weight: 500;
  font-size: 0.875rem;
  border-top: 1px solid #282828;
  margin-top: 1rem;
}

@media (max-width: 374px) {
  .search-container {
    padding: 0.5rem;
    padding-bottom: 130px;
  }
  
  .thumbnail {
    width: 52px;
    height: 52px;
  }
  
  .song-card {
    gap: 0.6rem;
    padding: 0.6rem;
    min-height: 64px;
  }
  
  .load-more-button {
    padding: 0.6rem 1.2rem;
    min-width: 160px;
  }
  
  .favorite-badge {
    padding: 4px;
  }
}

@media (min-width: 768px) {
  .results-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .thumbnail {
    width: 76px;
    height: 76px;
  }
  
  .search-header {
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .search-stats {
    margin-left: auto;
  }
}

@media (min-width: 1024px) {
  .results-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .results-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1536px) {
  .results-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (min-width: 1920px) {
  .results-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}
</style>