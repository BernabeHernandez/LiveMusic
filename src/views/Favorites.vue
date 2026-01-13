<script setup>
import { computed } from 'vue'
import { usePlayerStore } from '../stores/player'
import { Play, Heart, Trash2, Music } from 'lucide-vue-next'

const playerStore = usePlayerStore()

const favorites = computed(() => playerStore.favorites)
const hasFavorites = computed(() => favorites.value.length > 0)

const playTrack = (track, index) => {
  playerStore.playFavorites(index)
}

const playAllFavorites = () => {
  if (favorites.value.length > 0) {
    playerStore.playFavorites(0)
  }
}

const removeFavorite = (videoId) => {
  if (confirm('¿Quitar esta canción de favoritos?')) {
    playerStore.removeFavorite(videoId)
  }
}

const clearAllFavorites = () => {
  if (confirm(`¿Estás seguro de eliminar todos los ${favorites.value.length} favoritos?`)) {
    playerStore.clearFavorites()
  }
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`
  if (days < 365) return `Hace ${Math.floor(days / 30)} meses`
  return `Hace ${Math.floor(days / 365)} años`
}
</script>

<template>
  <div class="favorites-container">
    <div class="header">
      <div class="header-content">
        <div class="header-icon">
          <Heart :size="48" fill="currentColor" />
        </div>
        <div class="header-info">
          <p class="header-label">Playlist</p>
          <h1 class="header-title">Tus Favoritos</h1>
          <p class="header-stats">
            {{ favorites.length }} {{ favorites.length === 1 ? 'canción' : 'canciones' }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="hasFavorites" class="actions-bar">
      <button @click="playAllFavorites" class="play-all-button">
        <Play :size="20" fill="currentColor" />
        <span>Reproducir todo</span>
      </button>
      <button @click="clearAllFavorites" class="clear-button">
        <Trash2 :size="18" />
        <span>Limpiar favoritos</span>
      </button>
    </div>

    <div v-if="hasFavorites" class="favorites-list">
      <div class="list-header">
        <div class="col-number">#</div>
        <div class="col-title">Título</div>
        <div class="col-artist">Artista</div>
        <div class="col-added">Agregado</div>
        <div class="col-duration">Duración</div>
        <div class="col-actions"></div>
      </div>

      <div 
        v-for="(track, index) in favorites" 
        :key="track.videoId"
        class="track-item"
        :class="{ 
          'playing': playerStore.currentTrack?.videoId === track.videoId && playerStore.isPlaying 
        }"
        @click="playTrack(track, index)"
      >
        <div class="col-number">
          <span class="track-number">{{ index + 1 }}</span>
          <button @click="playTrack(track, index)" class="play-button-small">
            <Play :size="16" fill="currentColor" />
          </button>
        </div>

        <div class="col-title">
          <img :src="track.thumbnail" :alt="track.title" class="track-thumbnail" />
          <div class="track-info">
            <p class="track-title">{{ track.title }}</p>
          </div>
        </div>

        <div class="col-artist">
          <p class="track-artist">{{ track.artist }}</p>
        </div>

        <div class="col-added">
          <p class="track-added">{{ formatDate(track.addedAt) }}</p>
        </div>

        <div class="col-duration">
          <p class="track-duration">{{ formatTime(track.duration) }}</p>
        </div>

        <div class="col-actions">
          <button 
            @click="removeFavorite(track.videoId)" 
            class="remove-button"
            title="Quitar de favoritos"
          >
            <Heart :size="18" fill="currentColor" />
          </button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">
        <Music :size="64" />
      </div>
      <h2 class="empty-title">No tienes favoritos aún</h2>
      <p class="empty-description">
        Empieza a marcar tus canciones favoritas haciendo clic en el corazón ❤️
      </p>
    </div>
  </div>
</template>

<style scoped>
.favorites-container {
  padding: 20px 30px 100px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  background: linear-gradient(180deg, #5e1d8c 0%, #1a1a1a 100%);
  border-radius: 12px;
  padding: 40px;
  margin-bottom: 30px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 30px;
}

.header-icon {
  width: 150px;
  height: 150px;
  background: linear-gradient(135deg, #ff0844 0%, #ffb199 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.header-info {
  flex: 1;
}

.header-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 8px 0;
  color: #fff;
}

.header-title {
  font-size: 48px;
  font-weight: bold;
  margin: 0 0 12px 0;
  color: #fff;
}

.header-stats {
  font-size: 14px;
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
}

.actions-bar {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
}

.play-all-button {
  background: #1db954;
  border: none;
  padding: 12px 32px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.play-all-button:hover {
  background: #1ed760;
  transform: scale(1.05);
}

.clear-button {
  background: transparent;
  border: 1px solid #535353;
  padding: 12px 24px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.clear-button:hover {
  border-color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.favorites-list {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  overflow: hidden;
}

.list-header {
  display: grid;
  grid-template-columns: 50px 2fr 1.5fr 150px 100px 60px;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #b3b3b3;
}

.track-item {
  display: grid;
  grid-template-columns: 50px 2fr 1.5fr 150px 100px 60px;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 4px;
  transition: all 0.2s;
  cursor: pointer;
  align-items: center;
}

.track-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.track-item.playing {
  background: rgba(29, 185, 84, 0.2);
}

.col-number {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.track-number {
  color: #b3b3b3;
  font-size: 14px;
}

.play-button-small {
  position: absolute;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.track-item:hover .play-button-small {
  opacity: 1;
}

.track-item:hover .track-number {
  opacity: 0;
}

.col-title {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.track-thumbnail {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

.track-info {
  flex: 1;
  min-width: 0;
}

.track-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-artist {
  margin: 0;
  font-size: 14px;
  color: #b3b3b3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-added {
  margin: 0;
  font-size: 14px;
  color: #b3b3b3;
}

.track-duration {
  margin: 0;
  font-size: 14px;
  color: #b3b3b3;
  text-align: right;
}

.col-actions {
  display: flex;
  justify-content: center;
}

.remove-button {
  background: transparent;
  border: none;
  color: #1db954;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s;
  opacity: 0.7;
}

.remove-button:hover {
  opacity: 1;
  transform: scale(1.1);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  color: #535353;
  margin-bottom: 24px;
}

.empty-title {
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 12px 0;
  color: #fff;
}

.empty-description {
  font-size: 16px;
  color: #b3b3b3;
  margin: 0;
  max-width: 400px;
}

@media (max-width: 1024px) {
  .list-header,
  .track-item {
    grid-template-columns: 40px 2fr 1fr 80px 50px;
  }
  
  .col-added {
    display: none;
  }
}

@media (max-width: 768px) {
  .favorites-container {
    padding: 20px 15px 100px;
  }

  .header {
    padding: 30px 20px;
  }

  .header-content {
    flex-direction: column;
    text-align: center;
  }

  .header-icon {
    width: 120px;
    height: 120px;
  }

  .header-title {
    font-size: 32px;
  }

  .list-header,
  .track-item {
    grid-template-columns: 30px 1fr 60px 40px;
    gap: 8px;
  }

  .col-artist,
  .col-added {
    display: none;
  }

  .track-thumbnail {
    width: 36px;
    height: 36px;
  }
}
</style>