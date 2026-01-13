<script setup>
import { computed } from 'vue'
import { usePlayerStore } from '../stores/player'
import { Heart } from 'lucide-vue-next'

const props = defineProps({
  track: {
    type: Object,
    required: true
  },
  size: {
    type: Number,
    default: 20
  },
  showLabel: {
    type: Boolean,
    default: false
  }
})

const playerStore = usePlayerStore()

const isFavorite = computed(() => {
  return playerStore.isFavorite(props.track.videoId)
})

const toggleFavorite = () => {
  playerStore.toggleFavorite(props.track)
}
</script>

<template>
  <button 
    @click.stop="toggleFavorite" 
    class="favorite-button"
    :class="{ 'is-favorite': isFavorite }"
    :title="isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'"
  >
    <Heart 
      :size="size" 
      :fill="isFavorite ? 'currentColor' : 'none'"
    />
    <span v-if="showLabel" class="label">
      {{ isFavorite ? 'En favoritos' : 'Agregar a favoritos' }}
    </span>
  </button>
</template>

<style scoped>
.favorite-button {
  background: transparent;
  border: none;
  color: #b3b3b3;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.favorite-button:hover {
  color: #1db954;
  background: rgba(29, 185, 84, 0.1);
  transform: scale(1.1);
}

.favorite-button.is-favorite {
  color: #1db954;
}

.favorite-button.is-favorite:hover {
  color: #ff4444;
}

.label {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}
</style>