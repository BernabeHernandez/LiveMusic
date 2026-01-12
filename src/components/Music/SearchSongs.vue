<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { usePlayerStore } from '../../../src/stores/player'
import { Search, Music, Play, Pause, Loader } from 'lucide-vue-next'

const route = useRoute()
const playerStore = usePlayerStore()

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const query = ref('')
const results = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const currentOffset = ref(0)
const hasMore = ref(true)
const isLoadingMore = ref(false)
const totalAvailable = ref(0)

const INITIAL_LIMIT = 20
const LOAD_MORE_LIMIT = 15     
const MAX_RESULTS = 100
const MAX_AUTO_LOADS = 6    

let autoLoadCount = 0

const search = async (loadMore = false) => {
  if (!query.value.trim()) return

  if (!loadMore) {
    console.log('Nueva búsqueda');
    isLoading.value = true
    results.value = []
    currentOffset.value = 0
    hasMore.value = true
    totalAvailable.value = 0
    autoLoadCount = 0
  } else {
    console.log(' Cargando más (offset:', currentOffset.value, ')');
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
    
    if (loadMore) {
      results.value = [...results.value, ...items]
    } else {
      results.value = items
    }

    totalAvailable.value = data.total || 0
    hasMore.value = data.hasMore
    currentOffset.value += items.length
    
    console.log(' Resultados:', {
      recibidos: items.length,
      totalCargados: results.value.length,
      totalDisponibles: totalAvailable.value,
      offset: currentOffset.value,
      hayMas: hasMore.value
    });

    if (!results.value.length && !loadMore) {
      errorMessage.value = 'No se encontraron resultados'
    }

    await nextTick()

    if (hasMore.value && !isScrollable() && autoLoadCount < MAX_AUTO_LOADS) {
      autoLoadCount++
      console.log(` Página sigue sin scroll (auto-carga #${autoLoadCount}/${MAX_AUTO_LOADS})`);
      
      setTimeout(() => {
        if (hasMore.value && !isLoading.value && !isLoadingMore.value) {
          search(true)
        }
      }, 400) 
    }
  } catch (err) {
    console.error('❌ Error:', err)
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
  if (isLoadingMore.value) {
    console.log('Ya está cargando')
    return
  }
  
  if (!hasMore.value) {
    console.log('No hay más resultados')
    return
  }
  
  if (isLoading.value) {
    console.log(' Búsqueda inicial en proceso')
    return
  }
  
  if (results.value.length >= MAX_RESULTS) {
    console.log(' Límite de 100 canciones alcanzado')
    hasMore.value = false
    return
  }
  
  console.log(' Cargando más desde offset:', currentOffset.value)
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
}

const formatDuration = (seconds) => {
  if (!seconds) return ''
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

let scrollTimeout = null

const handleScroll = () => {
  if (scrollTimeout) clearTimeout(scrollTimeout)

  scrollTimeout = setTimeout(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollHeight = document.documentElement.scrollHeight
    const clientHeight = window.innerHeight
    
    const scrolled = scrollTop + clientHeight
    const threshold = scrollHeight * 0.80 

    if (scrolled >= threshold) {
      if (!isLoadingMore.value && hasMore.value && !isLoading.value) {
        console.log(`📍 Scroll detectado (${Math.round((scrolled / scrollHeight) * 100)}%) - cargando más`)
        loadMoreResults()
      }
    }
  }, 120)
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
  console.log(' Componente montado - Listeners activos')
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  console.log(' Componente desmontado')
  window.removeEventListener('scroll', handleScroll)
  if (scrollTimeout) clearTimeout(scrollTimeout)
})
</script>

<template>
  <div class="search-container">
    <div class="search-header" v-if="query">
      <Search :size="24" class="search-icon" />
      <h2>Resultados para "{{ query }}"</h2>
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

    <div v-if="isLoadingMore" class="loading-more">
      <Loader :size="28" class="spinner" />
      <p>Cargando más... ({{ results.length }} / {{ MAX_RESULTS }})</p>
    </div>

    <div v-if="!hasMore && results.length && !isLoading && !isLoadingMore" class="no-more-results">
      <p v-if="results.length >= MAX_RESULTS">
        ¡Límite alcanzado! ({{ results.length }} canciones)
      </p>
      <p v-else>
        ¡Todo cargado! ({{ results.length }} canciones)
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
  align-items: center;
  gap: 0.75rem;
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

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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

.no-more-results {
  text-align: center;
  padding: 2.5rem 1rem;
  color: #1db954;
  font-weight: 500;
  font-size: 0.875rem;
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