<script setup>
import { ref } from 'vue'
import { usePlayerStore } from '../stores/player'
import FavoriteButton from '../components/FavoriteButton.vue'
import { Play } from 'lucide-vue-next'

const playerStore = usePlayerStore()
const searchResults = ref([])

// Ejemplo de uso en resultados de búsqueda
const playTrack = (track, index) => {
  playerStore.setQueue(searchResults.value, index)
}

const addToQueue = (track) => {
  playerStore.addToQueue(track)
}
</script>

<template>
  <div class="search-results">
    <div 
      v-for="(track, index) in searchResults" 
      :key="track.videoId"
      class="track-card"
    >
      <img :src="track.thumbnail" :alt="track.title" class="track-image" />
      
      <div class="track-content">
        <h3 class="track-title">{{ track.title }}</h3>
        <p class="track-artist">{{ track.artist }}</p>
      </div>

      <div class="track-actions">
        <!-- Botón de reproducir -->
        <button @click="playTrack(track, index)" class="action-button play-btn">
          <Play :size="20" />
        </button>

        <!-- Botón de favoritos - Componente reutilizable -->
        <FavoriteButton :track="track" :size="20" />

        <!-- O también puedes usar con label -->
        <!-- <FavoriteButton :track="track" :size="20" :show-label="true" /> -->
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  padding: 20px;
}

.track-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s;
}

.track-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-4px);
}

.track-image {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  object-fit: cover;
  margin-bottom: 12px;
}

.track-content {
  margin-bottom: 12px;
}

.track-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #fff;
}

.track-artist {
  font-size: 12px;
  color: #b3b3b3;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-button {
  background: transparent;
  border: 1px solid #535353;
  color: #fff;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-button:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}

.play-btn:hover {
  background: #1db954;
  border-color: #1db954;
}
</style>