<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { usePlayerStore } from '../../../src/stores/player'
import { Search, Music, Play, Pause, Loader } from 'lucide-vue-next'

const route = useRoute()
const playerStore = usePlayerStore()

const API_URL = import.meta.env.VITE_API_URL || 'https://music-qyo5.onrender.com'

const query = ref('')
const results = ref([])
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
const PRELOAD_COUNT = 3

let autoLoadCount = 0
let retryTimeout = null
let scrollTimeout = null
let retryAttempts = 0

const preloadAudioUrls = async (items) => {
  const itemsToPreload = items.slice(0, PRELOAD_COUNT);
  
  console.log(`Pre-cargando URLs de audio para ${itemsToPreload.length} canciones...`);
  
  const preloadPromises = itemsToPreload.map(async (item) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch(`${API_URL}/api/audio/${item.videoId}`, {
        signal: controller.signal,
        priority: 'low'
      });
      
      clearTimeout(timeoutId);
      console.log(`Pre-cargado: ${item.title.substring(0, 30)}...`);
    } catch (err) {
    }
  });
  
  await Promise.allSettled(preloadPromises);
  console.log(`Pre-carga completada`);
};

const search = async (loadMore = false) => {
  if (!query.value.trim()) return

  if (!loadMore) {
    console.log('Nueva búsqueda');
    isLoading.value = true
    results.value = []
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
    thumbnail: result.thumbnail
  }))

  playerStore.setQueue(tracksQueue, index)
  
  const nextItems = results.value.slice(index + 1, index + 1 + PRELOAD_COUNT);
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
    if (newQuery) {
      query.value = newQuery
      search(false)
    }
  },
  { immediate: true }
)

onMounted(() => {
  console.log('Componente montado - Listeners activos')
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  console.log('Componente desmontado')
  window.removeEventListener('scroll', handleScroll)
  if (scrollTimeout) clearTimeout(scrollTimeout)
  if (retryTimeout) clearTimeout(retryTimeout)
})
</script>

<template>
  <div class="search-container">
    <div class="search-header" v-if="query">
      <Search :size="24" class="search-icon" />
      <h2>Resultados para "{{ query }}"</h2>
      <div class="search-stats" v-if="results.length">
        <span class="stats-text">{{ results.length }} de {{ totalAvailable || '?' }} canciones</span>
        <span v-if="isExpanded" class="stats-badge">Expansión completa</span>
        <span v-else-if="expansionInProgress" class="stats-badge expanding">Buscando más...</span>
      </div>
    </div>

    <div v-if="isLoading && !results.length" class="loading">
      <Loader :size="40" class="spinner" />
      <p>Buscando...</p>
    </div>

    <div v-if="errorMessage" class="error-message">
      <p>{{ errorMessage }}</p>
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
  margin-bottom: 1.25rem;
  padding: 0.25rem 0;
}

.search-icon {
  color: #1db954;
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
  -webkit-line-clamp: 2;
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
  color: #1db954;
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

.song-card:hover,
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

.song-card:hover .play-overlay,
.song-card:active .play-overlay {
  opacity: 1;
}

.play-icon {
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
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
  -webkit-line-clamp: 2;
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
  background: #1db954;
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