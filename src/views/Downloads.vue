<template>
  <div class="search-container">
    <div class="search-header">
      <div>
        <h1 class="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">
          Mis Descargas
        </h1>
        <p class="text-[var(--live-text-secondary)] flex items-center gap-2">
          <HardDriveDownload class="w-4 h-4" />
          {{ downloadsStore.downloadedTracks.length }} canciones disponibles offline
        </p>
      </div>
      
      <button 
        v-if="downloadsStore.downloadedTracks.length > 0"
        @click="playAll"
        class="hidden md:flex items-center justify-center w-14 h-14 rounded-full bg-[#1db954] hover:scale-105 transition-transform shadow-[0_0_20px_rgba(29,185,84,0.3)] text-white ml-auto"
      >
        <Play class="w-6 h-6 ml-1" fill="currentColor" />
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="downloadsStore.downloadedTracks.length === 0" 
         class="flex flex-col items-center justify-center text-center p-8 bg-white/5 rounded-2xl border border-white/5 mt-8">
      <div class="w-24 h-24 mb-6 rounded-full bg-white/5 flex items-center justify-center">
        <DownloadCloud class="w-12 h-12 text-white/20" />
      </div>
      <h3 class="text-xl font-bold mb-2">Aún no hay descargas</h3>
      <p class="text-[var(--live-text-secondary)] max-w-sm mb-8">
        Guarda tus canciones favoritas para escucharlas cuando no tengas conexión a internet.
      </p>
      <router-link to="/search" class="px-8 py-3 rounded-full bg-[#1db954] text-white font-medium hover:bg-opacity-90 transition-colors">
        Buscar música
      </router-link>
    </div>

    <!-- Lista de Descargas responsive como SearchSongs -->
    <div v-else class="results-grid">
      <div
        v-for="(item, index) in downloadsStore.downloadedTracks"
        :key="item.videoId"
        class="song-card"
        :class="{ 'is-playing': playerStore.currentTrack?.videoId === item.videoId }"
        @click="playTrack(index)"
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
            class="favorite-badge is-favorite"
            @click.stop="removeDownload(item)"
            title="Eliminar descarga"
            style="color: #ff4444; background: rgba(0,0,0,0.8);"
          >
            <Trash2 :size="16" />
          </button>
        </div>
        
        <div class="info">
          <p class="title">{{ item.title }}</p>
          <div class="metadata">
            <Music :size="14" class="metadata-icon" />
            <span class="artist">{{ item.artist || 'YouTube' }}</span>
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
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { DownloadCloud, Play, Pause, Trash2, HardDriveDownload, Music } from 'lucide-vue-next';
import { useDownloadsStore } from '@/stores/downloads';
import { usePlayerStore } from '@/stores/player';

const downloadsStore = useDownloadsStore();
const playerStore = usePlayerStore();

onMounted(async () => {
  await downloadsStore.loadDownloads();
});

const playTrack = (index) => {
  playerStore.setQueue([...downloadsStore.downloadedTracks], index);
};

const playAll = () => {
  if (downloadsStore.downloadedTracks.length > 0) {
    playerStore.setQueue([...downloadsStore.downloadedTracks], 0);
  }
};

const removeDownload = async (track) => {
  if (confirm(`¿Estás seguro de eliminar "${track.title}" de tus descargas?`)) {
    await downloadsStore.removeDownload(track.videoId);
  }
};

const formatDuration = (seconds) => {
  if (!seconds) return ''
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
};
</script>

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
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  padding: 0.25rem 0;
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

.favorite-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  backdrop-filter: blur(4px);
  border: none;
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

.song-card:hover .favorite-badge {
  opacity: 1;
}

.favorite-badge:hover {
  transform: scale(1.15);
  background: rgba(255, 68, 68, 0.2) !important;
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

@media (max-width: 767px) {
  .search-header {
    flex-direction: column;
    align-items: flex-start;
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
