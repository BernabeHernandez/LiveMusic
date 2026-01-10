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
const currentLimit = ref(50)
const hasMore = ref(true)
const isLoadingMore = ref(false)

const search = async (loadMore = false) => {
  if (!query.value.trim()) return

  if (!loadMore) {
    console.log('🔍 Nueva búsqueda');
    isLoading.value = true
    results.value = []
    currentLimit.value = 50
    hasMore.value = true
  } else {
    console.log('📥 Cargando más resultados');
    isLoadingMore.value = true
    currentLimit.value += 30
  }
  
  errorMessage.value = ''

  try {
    const url = `${API_URL}/api/search?q=${encodeURIComponent(query.value)}&limit=${currentLimit.value}`
    console.log('🌐 Petición:', url);
    
    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Error en la búsqueda')
    }

    const items = data.items || []
    results.value = items

    hasMore.value = data.hasMore !== undefined ? data.hasMore : false
    
    console.log('✅ Resultados:', {
      recibidos: items.length,
      total: data.total,
      unicos: data.unique,
      filtrados: data.filtered,
      hayMas: hasMore.value
    });

    if (!results.value.length && !loadMore) {
      errorMessage.value = 'No se encontraron resultados'
    }

    // Esperar a que el DOM se actualice antes de verificar scroll
    await nextTick()
    
    // Si después de cargar no hay scroll (todo cabe en la pantalla), cargar más automáticamente
    if (hasMore.value && !isScrollable()) {
      console.log('⚠️ No hay scroll, cargando más automáticamente...');
      setTimeout(() => {
        if (hasMore.value && !isLoadingMore.value) {
          search(true)
        }
      }, 500)
    }
  } catch (err) {
    console.error('❌ Error en búsqueda:', err);
    errorMessage.value = err.message
  }

  isLoading.value = false
  isLoadingMore.value = false
}

const isScrollable = () => {
  const scrollHeight = document.documentElement.scrollHeight
  const clientHeight = document.documentElement.clientHeight
  const isScrollable = scrollHeight > clientHeight
  console.log('📏 Scroll:', { scrollHeight, clientHeight, isScrollable });
  return isScrollable
}

const loadMoreResults = () => {
  if (isLoadingMore.value || !hasMore.value || isLoading.value) {
    console.log('⏭️ No cargar más:', { 
      isLoadingMore: isLoadingMore.value, 
      hasMore: hasMore.value, 
      isLoading: isLoading.value 
    });
    return
  }
  
  console.log('📥 Cargando más resultados...');
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
  // Debounce para evitar múltiples llamadas
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }

  scrollTimeout = setTimeout(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollHeight = document.documentElement.scrollHeight
    const clientHeight = document.documentElement.clientHeight
    
    const scrolled = scrollTop + clientHeight
    const threshold = scrollHeight * 0.80 // 80% del scroll
    
    console.log('📍 Scroll:', {
      scrollTop: Math.round(scrollTop),
      scrollHeight: Math.round(scrollHeight),
      clientHeight: Math.round(clientHeight),
      scrolled: Math.round(scrolled),
      threshold: Math.round(threshold),
      percentage: Math.round((scrolled / scrollHeight) * 100) + '%'
    });
    
    if (scrolled >= threshold && !isLoadingMore.value && hasMore.value && !isLoading.value) {
      console.log('🎯 Umbral alcanzado, cargando más...');
      loadMoreResults()
    }
  }, 150) // Esperar 150ms después del último scroll
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
  console.log('✅ Componente montado, añadiendo listener de scroll');
  window.addEventListener('scroll', handleScroll, { passive: true })
  
  // También escuchar el scroll del contenedor
  document.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  console.log('🔚 Componente desmontado, removiendo listeners');
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('scroll', handleScroll)
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
})
</script>

<template>
  <div class="search-container">
    <div class="search-header" v-if="query">
      <Search :size="24" class="search-icon" />
      <h2>Resultados para "{{ query }}"</h2>
    </div>

    <div v-if="isLoading && !results.length" class="loading">
      <Loader :size="32" class="spinner" />
      <p>Buscando las mejores canciones...</p>
    </div>

    <div v-if="errorMessage" class="error-message">
      <p>{{ errorMessage }}</p>
    </div>

    <div class="results" v-if="results.length">
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
            @error="e => e.target.src = 'https://via.placeholder.com/60?text=🎵'"
            class="thumbnail"
            alt="Portada"
          />
          <div class="play-overlay">
            <Play v-if="playerStore.currentTrack?.videoId !== item.videoId || !playerStore.isPlaying" 
                  :size="28" 
                  class="play-icon" 
            />
            <Pause v-else :size="28" class="play-icon" />
          </div>
        </div>
        
        <div class="info">
          <p class="title">{{ item.title }}</p>
          <div class="metadata">
            <Music :size="14" class="metadata-icon" />
            <span class="artist">{{ item.artist || item.uploader || 'YouTube' }}</span>
            <span v-if="item.duration" class="duration">• {{ formatDuration(item.duration) }}</span>
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
      <Loader :size="24" class="spinner" />
      <p>Cargando más canciones... ({{ results.length }} cargadas)</p>
    </div>

    <div v-if="!hasMore && results.length && !isLoading && !isLoadingMore" class="no-more-results">
      <p>✅ Has visto todos los resultados disponibles ({{ results.length }} canciones)</p>
    </div>

    <div v-if="hasMore && results.length >= 30 && !isLoadingMore && !isLoading" class="load-more-hint">
      <p>⬇️ Desliza hacia abajo para ver más resultados</p>
    </div>
  </div>
</template>

<style scoped>
.search-container {
  padding: 20px;
  padding-bottom: 150px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
}

.search-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 30px;
  color: white;
}

.search-icon {
  color: #1db954;
}

.search-header h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.loading, .loading-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 40px 20px;
  color: #b3b3b3;
}

.loading p, .loading-more p {
  margin: 0;
  font-size: 14px;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-message {
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid #ff4444;
  color: #ff6b6b;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  text-align: center;
}

.error-message p {
  margin: 0;
}

.results {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.song-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  background: #181818;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  border: 2px solid transparent;
}

.song-card:hover {
  background: #282828;
  border-color: #1db954;
}

.song-card.is-playing {
  background: #282828;
  border-color: #1db954;
}

.thumbnail-wrapper {
  position: relative;
  flex-shrink: 0;
}

.thumbnail {
  width: 64px;
  height: 64px;
  border-radius: 6px;
  object-fit: cover;
  display: block;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 6px;
}

.song-card:hover .play-overlay {
  opacity: 1;
}

.play-icon {
  color: white;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5));
}

.info {
  flex: 1;
  min-width: 0;
}

.title {
  margin: 0 0 6px 0;
  font-weight: 600;
  color: white;
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.metadata {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #b3b3b3;
  font-size: 13px;
}

.metadata-icon {
  flex-shrink: 0;
}

.artist {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.duration {
  flex-shrink: 0;
  color: #888;
}

.play-indicator {
  flex-shrink: 0;
  margin-left: auto;
}

.equalizer {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 20px;
}

.equalizer .bar {
  width: 3px;
  background: #1db954;
  border-radius: 3px;
  animation: equalize 0.8s ease-in-out infinite;
}

.equalizer .bar:nth-child(1) {
  animation-delay: 0s;
}

.equalizer .bar:nth-child(2) {
  animation-delay: 0.2s;
}

.equalizer .bar:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes equalize {
  0%, 100% { height: 4px; }
  50% { height: 20px; }
}

.no-more-results {
  text-align: center;
  padding: 40px 20px;
  color: #1db954;
  font-size: 14px;
  font-weight: 500;
  background: rgba(29, 185, 84, 0.1);
  border-radius: 12px;
  margin-top: 20px;
}

.no-more-results p {
  margin: 0;
}

.load-more-hint {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 13px;
  animation: bounce 2s ease-in-out infinite;
}

.load-more-hint p {
  margin: 0;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@media (max-width: 768px) {
  .search-container {
    padding: 15px;
    padding-bottom: 150px;
  }

  .search-header h2 {
    font-size: 22px;
  }

  .thumbnail {
    width: 56px;
    height: 56px;
  }

  .title {
    font-size: 14px;
  }

  .metadata {
    font-size: 12px;
  }
}
</style>