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

    await nextTick()
    
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
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }

  scrollTimeout = setTimeout(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollHeight = document.documentElement.scrollHeight
    const clientHeight = document.documentElement.clientHeight
    
    const scrolled = scrollTop + clientHeight
    const threshold = scrollHeight * 0.80 
    
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
  }, 150) 
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
      <Loader :size="40" class="spinner" />
      <p>Buscando las mejores canciones...</p>
    </div>

    <div v-if="errorMessage" class="error-message">
      <p>{{ errorMessage }}</p>
    </div>

    <div class="results-grid" v-if="results.length">
      <div
        v-for="(item, index) in results"
        :key="`${item.videoId || item.url}-${index}`"
        class="song-card"
        :class="{ 'is-playing': playerStore.currentTrack?.videoId === (item.videoId || item.url?.split('v=')[1]?.split('&')[0]) }"
        @click="playTrack(item, index)"
      >
        <div class="thumbnail-wrapper">
          <img
            :src="item.thumbnail"
            @error="e => { e.target.src = 'https://via.placeholder.com/120?text=🎵' }"
            class="thumbnail"
            alt="Portada"
            loading="lazy"
          />
          <div class="play-overlay">
            <Play v-if="!playerStore.currentTrack || playerStore.currentTrack?.videoId !== (item.videoId || item.url?.split('v=')[1]?.split('&')[0]) || !playerStore.isPlaying" 
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

        <div class="play-indicator" v-if="playerStore.currentTrack?.videoId === (item.videoId || item.url?.split('v=')[1]?.split('&')[0])">
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
      <p>Cargando más... ({{ results.length }} canciones)</p>
    </div>

    <div v-if="!hasMore && results.length && !isLoading && !isLoadingMore" class="no-more-results">
      <p>¡Has llegado al final! ({{ results.length }} canciones)</p>
    </div>
  </div>
</template>

<style scoped>
/* <CHANGE> Base styles optimized for mobile first */
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

/* <CHANGE> Improved grid system with better breakpoints */
.results-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.65rem;
  width: 100%;
}

/* <CHANGE> Song card with better mobile optimization */
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

/* <CHANGE> Responsive thumbnail sizes */
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

/* <CHANGE> Better text overflow handling */
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

/* <CHANGE> Extra small devices (320px - 374px) */
@media (max-width: 374px) {
  .search-container {
    padding: 0.5rem;
    padding-bottom: 130px;
  }
  
  .search-header {
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .search-header h2 {
    font-size: 1.125rem;
  }
  
  .search-icon {
    width: 20px;
    height: 20px;
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
  
  .title {
    font-size: 0.8125rem;
  }
  
  .metadata {
    font-size: 0.6875rem;
    gap: 0.3rem;
  }
  
  .metadata-icon {
    width: 12px;
    height: 12px;
  }
}

/* <CHANGE> Small mobile devices (375px - 479px) */
@media (min-width: 375px) and (max-width: 479px) {
  .thumbnail {
    width: 56px;
    height: 56px;
  }
  
  .title {
    font-size: 0.85rem;
  }
}

/* <CHANGE> Large mobile devices (480px - 639px) */
@media (min-width: 480px) and (max-width: 639px) {
  .search-container {
    padding: 0.875rem;
  }
  
  .results-grid {
    gap: 0.75rem;
  }
  
  .song-card {
    padding: 0.75rem;
    gap: 0.85rem;
  }
  
  .thumbnail {
    width: 64px;
    height: 64px;
  }
  
  .title {
    font-size: 0.9rem;
  }
  
  .metadata {
    font-size: 0.8rem;
  }
}

/* <CHANGE> Small tablets (640px - 767px) */
@media (min-width: 640px) {
  .search-container {
    padding: 1rem;
  }
  
  .search-header {
    gap: 0.875rem;
    margin-bottom: 1.5rem;
  }
  
  .search-header h2 {
    font-size: 1.5rem;
  }
  
  .search-icon {
    width: 26px;
    height: 26px;
  }
  
  .results-grid {
    gap: 1rem;
  }
  
  .song-card {
    padding: 1rem;
    gap: 1rem;
  }
  
  .thumbnail {
    width: 70px;
    height: 70px;
  }
  
  .title {
    font-size: 1rem;
  }
  
  .metadata {
    font-size: 0.8125rem;
    gap: 0.45rem;
  }
  
  .metadata-icon {
    width: 15px;
    height: 15px;
  }
  
  .equalizer {
    height: 22px;
    gap: 3px;
  }
  
  .bar {
    width: 3.5px;
  }
  
  @keyframes equalize {
    0%, 100% { height: 6px; }
    50%      { height: 22px; }
  }
}

/* <CHANGE> Tablets (768px - 1023px) - 2 columns */
@media (min-width: 768px) {
  .search-container {
    padding: 1.25rem;
  }
  
  .results-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .search-header h2 {
    font-size: 1.75rem;
  }
  
  .song-card {
    padding: 1rem;
    gap: 1rem;
  }
  
  .thumbnail {
    width: 76px;
    height: 76px;
    border-radius: 8px;
  }
  
  .play-overlay {
    border-radius: 8px;
  }
  
  .title {
    font-size: 1rem;
  }
  
  .metadata {
    font-size: 0.875rem;
    gap: 0.45rem;
  }
  
  .metadata-icon {
    width: 16px;
    height: 16px;
  }
  
  .equalizer {
    height: 22px;
    gap: 3px;
  }
  
  .bar {
    width: 3.5px;
  }
  
  @keyframes equalize {
    0%, 100% { height: 6px; }
    50%      { height: 22px; }
  }
}

/* <CHANGE> Small laptops (1024px - 1279px) - 3 columns */
@media (min-width: 1024px) {
  .search-container {
    padding: 1.5rem 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .results-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.125rem;
  }
  
  .search-header {
    gap: 1rem;
    margin-bottom: 1.75rem;
  }
  
  .search-header h2 {
    font-size: 2rem;
  }
  
  .search-icon {
    width: 28px;
    height: 28px;
  }
  
  .song-card {
    padding: 1.125rem;
    gap: 1.125rem;
  }
  
  .thumbnail {
    width: 84px;
    height: 84px;
  }
  
  .play-icon {
    width: 36px;
    height: 36px;
  }
  
  .title {
    font-size: 1.0625rem;
  }
  
  .metadata {
    font-size: 0.9rem;
  }
  
  .no-more-results {
    padding: 3rem 1rem;
    font-size: 0.9375rem;
  }
}

/* <CHANGE> Large laptops and desktops (1280px - 1535px) - 4 columns */
@media (min-width: 1280px) {
  .results-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 1.25rem;
  }
  
  .search-header h2 {
    font-size: 2.25rem;
  }
  
  .song-card {
    padding: 1.25rem;
    gap: 1.25rem;
  }
  
  .thumbnail {
    width: 90px;
    height: 90px;
  }
  
  .title {
    font-size: 1.125rem;
  }
  
  .metadata {
    font-size: 0.9375rem;
    gap: 0.5rem;
  }
  
  .equalizer {
    height: 24px;
  }
  
  .bar {
    width: 4px;
  }
  
  @keyframes equalize {
    0%, 100% { height: 7px; }
    50%      { height: 24px; }
  }
}

/* <CHANGE> Extra large screens (1536px+) - 5 columns */
@media (min-width: 1536px) {
  .search-container {
    padding: 2rem 2.5rem;
    max-width: 1600px;
  }
  
  .results-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 1.375rem;
  }
  
  .search-header h2 {
    font-size: 2.5rem;
  }
  
  .thumbnail {
    width: 96px;
    height: 96px;
  }
  
  .title {
    font-size: 1.1875rem;
  }
  
  .metadata {
    font-size: 1rem;
  }
}

/* <CHANGE> Ultra-wide screens (1920px+) - 6 columns */
@media (min-width: 1920px) {
  .search-container {
    max-width: 1800px;
    padding: 2.5rem 3rem;
  }
  
  .results-grid {
    grid-template-columns: repeat(6, 1fr);
    gap: 1.5rem;
  }
}
</style>