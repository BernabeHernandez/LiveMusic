<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { usePlayerStore } from '../../stores/player'
import { 
  X, 
  Play, 
  Pause, 
  Plus, 
  ListMusic, 
  ChevronRight,
  Loader,
  Music,
  Shuffle
} from 'lucide-vue-next'

const props = defineProps({
  album: {
    type: Object,
    required: true
  },
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const playerStore = usePlayerStore()
const tracks = ref([])
const isLoading = ref(true)
const error = ref(null)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const cleanUploader = (name) => {
  if (!name) return 'Artista desconocido'
  return name.replace(/\s*-\s*Topic$/i, '').replace(/YouTube/i, 'Oficial')
}

const fetchTracks = async () => {
  isLoading.value = true
  error.value = null
  try {
    const response = await fetch(`${API_URL}/api/search/playlists/${props.album.id}/songs`)
    if (!response.ok) throw new Error('No se pudieron cargar las canciones')
    const data = await response.json()
    tracks.value = data.songs
  } catch (err) {
    console.error('Error fetching album tracks:', err)
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

const playTrack = (track, index) => {
  playerStore.setQueue(tracks.value, index)
}

const playAll = () => {
  if (tracks.value.length > 0) {
    playerStore.setQueue(tracks.value, 0)
  }
}

const shuffleAll = () => {
  if (tracks.value.length > 0) {
    const shuffled = [...tracks.value].sort(() => Math.random() - 0.5)
    playerStore.setQueue(shuffled, 0)
  }
}

const formatDuration = (seconds) => {
  if (!seconds) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

onMounted(() => {
  fetchTracks()
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <Transition name="slide-up">
    <div v-if="isOpen" class="album-view-overlay">
      <div class="header-actions">
        <button @click="emit('close')" class="close-btn">
          <X :size="24" />
        </button>
      </div>

      <div class="content-scroll">
        <div class="album-hero">
          <div class="artwork-wrapper">
            <img :src="album.thumbnail" :alt="album.title" class="album-artwork" />
          </div>
          <div class="album-info">
            <h1>{{ album.title }}</h1>
            <div class="uploader-container">
              <p class="artist-name">{{ cleanUploader(album.uploader) }}</p>
              <span v-if="album.isOfficial" class="official-badge">
                <Disc :size="12" fill="currentColor" />
                Oficial
              </span>
            </div>
            <p class="album-meta">{{ tracks.length }} canciones</p>
          </div>
          
          <div class="main-actions">
            <button @click="playAll" class="action-btn primary" :disabled="isLoading">
              <Play :size="20" fill="currentColor" />
              Reproducir
            </button>
            <button @click="shuffleAll" class="action-btn secondary" :disabled="isLoading">
              <Shuffle :size="20" />
              Aleatorio
            </button>
          </div>
        </div>

        <div class="tracklist-container">
          <div v-if="isLoading" class="loading-state">
            <Loader :size="40" class="spinner" />
            <p>Cargando canciones...</p>
          </div>

          <div v-else-if="error" class="error-state">
            <p>{{ error }}</p>
            <button @click="fetchTracks" class="retry-btn">Reintentar</button>
          </div>

          <div v-else class="tracklist">
            <div 
              v-for="(track, index) in tracks" 
              :key="track.videoId"
              class="track-item"
              :class="{ 'is-playing': playerStore.currentTrack?.videoId === track.videoId }"
              @click="playTrack(track, index)"
            >
              <span class="track-number">{{ index + 1 }}</span>
              <div class="track-artwork">
                <img :src="track.thumbnail" :alt="track.title" loading="lazy" />
              </div>
              <div class="track-info">
                <p class="track-title">{{ track.title }}</p>
                <p class="track-artist">{{ track.artist }}</p>
              </div>
              <span class="track-duration">{{ formatDuration(track.duration) }}</span>
              <button class="track-more">
                <ChevronRight :size="20" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.album-view-overlay {
  position: fixed;
  inset: 0;
  bottom: 75px; /* Matches fixed player height */
  z-index: 2000;
  background: rgba(12, 12, 12, 0.98);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  display: flex;
  flex-direction: column;
  padding-top: env(safe-area-inset-top);
}
@media (min-width: 768px) {
  .album-view-overlay {
    top: 72px;
    left: 240px;
    bottom: 75px;
    background: #121212;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: none;
    padding-top: 0;
    height: auto;
    width: auto;
  }
}
@media (min-width: 1280px) {
  .album-view-overlay {
    left: 260px;
  }
}
@media (min-width: 1536px) {
  .album-view-overlay {
    left: 280px;
  }
}

.header-actions {
  padding: 1rem;
  display: flex;
  justify-content: flex-end;
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(18, 18, 18, 0.8);
  backdrop-filter: blur(20px);
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.content-scroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 120px;
}

.album-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem 1rem;
  background: linear-gradient(to bottom, rgba(255, 45, 85, 0.05), transparent);
}

@media (min-width: 768px) {
  .album-hero {
    flex-direction: row;
    align-items: flex-end;
    text-align: left;
    padding: 2.5rem 3rem;
    gap: 2.5rem;
  }
  
  .artwork-wrapper {
    width: 240px !important;
    height: 240px !important;
    margin-bottom: 0 !important;
  }
  
  .album-info {
    flex: 1;
    align-items: flex-start !important;
  }
  
  .uploader-container {
    justify-content: flex-start !important;
  }
  
  .main-actions {
    justify-content: flex-start !important;
    margin-top: 2rem !important;
  }
}

.artwork-wrapper {
  width: 200px;
  height: 200px;
  margin-bottom: 1.5rem;
  box-shadow: 0 12px 40px rgba(0,0,0,0.5);
  border-radius: 12px;
  overflow: hidden;
}

.album-artwork {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-info h1 {
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.uploader-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.official-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(255, 45, 85, 0.15);
  color: #ff2d55;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  text-transform: uppercase;
}

.artist-name {
  font-size: 1.1rem;
  color: #ff2d55;
  font-weight: 600;
  margin: 0;
}

.album-meta {
  font-size: 0.9rem;
  color: #888;
}

.main-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  width: 100%;
  max-width: 400px;
  margin-top: 1.5rem;
}

.action-btn {
  height: 48px;
  border-radius: 10px;
  border: none;
  font-weight: 700;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.primary {
  background: white;
  color: black;
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.action-btn:active {
  transform: scale(0.96);
}

.tracklist-container {
  padding: 0 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .tracklist-container {
    padding: 0 3rem;
  }
}

.track-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.track-item:active {
  background: rgba(255, 255, 255, 0.05);
}

.track-item.is-playing {
  background: rgba(255, 45, 85, 0.1);
}

.track-item.is-playing .track-title {
  color: #ff2d55;
}

.track-number {
  width: 24px;
  font-size: 0.9rem;
  color: #666;
  text-align: center;
  flex-shrink: 0;
}

.track-artwork {
  width: 44px;
  height: 44px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.05);
}

.track-artwork img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.track-info {
  flex: 1;
  min-width: 0;
}

.track-title {
  font-weight: 600;
  font-size: 0.95rem;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-artist {
  font-size: 0.85rem;
  color: #888;
  margin: 0;
}

.track-duration {
  font-size: 0.85rem;
  color: #666;
}

.track-more {
  background: none;
  border: none;
  color: #444;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
  text-align: center;
}

.spinner {
  animation: spin 1s linear infinite;
  color: #ff2d55;
  margin-bottom: 1rem;
}

.retry-btn {
  background: #ff2d55;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  margin-top: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Animations */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

/* Tablet/PC overrides removed as they are integrated above */
</style>
