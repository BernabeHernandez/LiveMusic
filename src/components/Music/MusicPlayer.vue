<script setup>
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { usePlayerStore } from '../../../src/stores/player'
import ExpandedPlayer from '../ExpandedPlayer.vue'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat,
  Heart
} from 'lucide-vue-next'

const playerStore = usePlayerStore()    
const audioElement = ref(null)
const isSeeking = ref(false)
const isExpanded = ref(false)
const backgroundColor = ref('#121212')

// Function to extract dominant color from image
const extractDominantColor = (imageUrl) => {
  if (!imageUrl) return
  
  const img = new Image()
  img.crossOrigin = 'Anonymous'
  img.src = imageUrl
  
  img.onload = () => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = 10
    canvas.height = 10
    
    context.drawImage(img, 0, 0, 10, 10)
    const data = context.getImageData(0, 0, 10, 10).data
    
    let r = 0, g = 0, b = 0
    for (let i = 0; i < data.length; i += 4) {
      r += data[i]
      g += data[i+1]
      b += data[i+2]
    }
    
    r = Math.floor(r / (data.length / 4))
    g = Math.floor(g / (data.length / 4))
    b = Math.floor(b / (data.length / 4))
    
    // produces a more vibrant color for the bar
    const darkenFactor = 0.85
    const dr = Math.floor(r * darkenFactor)
    const dg = Math.floor(g * darkenFactor)
    const db = Math.floor(b * darkenFactor)
    
    backgroundColor.value = `rgb(${dr}, ${dg}, ${db})`
  }
}

// Watch for track changes
watch(() => playerStore.currentTrack?.thumbnail, (newThumb) => {
  if (newThumb) extractDominantColor(newThumb)
}, { immediate: true })

const canGoPrevious = computed(() => {
  return playerStore.currentIndex > 0 || playerStore.currentTime > 3
})

const canGoNext = computed(() => {
  return playerStore.currentIndex < playerStore.queue.length - 1
})

const isCurrentFavorite = computed(() => {
  return playerStore.isCurrentTrackFavorite
})

const toggleFavorite = () => {
  if (playerStore.currentTrack) {
    playerStore.toggleFavorite(playerStore.currentTrack)
  }
}

const expandPlayer = () => {
  isExpanded.value = true
}

const closeExpandedPlayer = () => {
  isExpanded.value = false
}

onMounted(() => {
  playerStore.initAudioPlayer(audioElement.value)
  playerStore.initStore()
})

onUnmounted(() => {
  playerStore.cleanup()
})

const handleSeekStart = () => {
  isSeeking.value = true
}

const handleSeek = (e) => {
  if (!isSeeking.value) return
  const percent = parseFloat(e.target.value)
  playerStore.seekTo(percent)
}

const handleSeekEnd = (e) => {
  const percent = parseFloat(e.target.value)
  playerStore.seekTo(percent)
  isSeeking.value = false
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<template>
  <audio ref="audioElement" preload="metadata"></audio>

  <ExpandedPlayer 
    :isExpanded="isExpanded" 
    @close="closeExpandedPlayer"
  />

  <div 
    v-if="playerStore.currentTrack && !isExpanded" 
    class="player-bar"
    :style="{ '--bar-bg-color': backgroundColor }"
  >
    <div class="track-info" @click="expandPlayer">
      <img :src="playerStore.currentTrack.thumbnail" alt="Cover" class="track-thumbnail" />
      <div class="track-details">
        <p class="track-title">{{ playerStore.currentTrack.title }}</p>
        <p class="track-artist">{{ playerStore.currentTrack.artist }}</p>
      </div>
      <button 
        @click.stop="toggleFavorite" 
        class="favorite-button-mini"
        :class="{ 'is-favorite': isCurrentFavorite }"
        :title="isCurrentFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'"
      >
        <Heart :size="18" :fill="isCurrentFavorite ? 'currentColor' : 'none'" />
      </button>
    </div>

    <div class="player-controls">
      <div class="progress-container">
        <span class="time-label">{{ formatTime(playerStore.currentTime) }}</span>
        <input 
          type="range" 
          min="0" max="100" step="0.1"
          :value="playerStore.progress"
          @mousedown="handleSeekStart"
          @touchstart="handleSeekStart"
          @input="handleSeek"
          @change="handleSeekEnd"
          :style="`--progress: ${playerStore.progress}%`"
          class="progress-slider"
        />
        <span class="time-label">{{ formatTime(playerStore.duration) }}</span>
      </div>

      <div class="controls">
        <button 
          @click="playerStore.toggleShuffle()" 
          class="control-button shuffle-button" 
          :class="{ active: playerStore.isShuffleEnabled }"
          title="Aleatorio"
        >
          <Shuffle :size="18" />
        </button>
        
        <button 
          @click="playerStore.previousTrack()" 
          class="control-button" 
          :disabled="!canGoPrevious"
          title="Anterior"
        >
          <SkipBack :size="20" />
        </button>
        
        <button @click="playerStore.togglePlay()" class="play-button" title="Reproducir/Pausar">
          <Play v-if="!playerStore.isPlaying" :size="24" />
          <Pause v-else :size="24" />
        </button>
        
        <button 
          @click="playerStore.nextTrack()" 
          class="control-button" 
          :disabled="!canGoNext"
          title="Siguiente"
        >
          <SkipForward :size="20" />
        </button>

        <button 
          @click="playerStore.toggleRepeat()" 
          class="control-button repeat-button" 
          :class="{ active: playerStore.isRepeatEnabled }"
          title="Repetir canción actual"
        >
          <Repeat :size="18" />
        </button>
      </div>

      <div class="queue-info" v-if="playerStore.queue.length > 0">
        <span class="queue-text">
          {{ playerStore.currentIndex + 1 }} / {{ playerStore.queue.length }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.player-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 75px; /* Altura slim del diseño original */
  background: var(--bar-bg-color, #111);
  color: white;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.5);
  z-index: 3000;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.track-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  max-width: 250px;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: background 0.2s;
}

.track-info:hover {
  background: rgba(255, 255, 255, 0.05);
}

.track-thumbnail {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.track-details {
  flex: 1;
  min-width: 0;
}

.track-title {
  margin: 0 0 5px 0;
  font-weight: bold;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-artist {
  margin: 0;
  color: #b3b3b3;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-button-mini {
  background: transparent;
  border: none;
  color: #b3b3b3;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: all 0.2s;
  flex-shrink: 0;
}

.favorite-button-mini:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}

.favorite-button-mini.is-favorite {
  color: #ff2d55;
}

.favorite-button-mini.is-favorite:hover {
  color: #ff375f;
}

.player-controls {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  position: relative;
}

.progress-container {
  position: absolute;
  top: -12px; /* Lo mueve arriba del todo como en el diseño original */
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  width: 100%;
}

.time-label {
  font-size: 11px;
  color: #b3b3b3;
  min-width: 40px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.progress-slider {
  -webkit-appearance: none;
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.1);
  background-image: linear-gradient(to right, #ff2d55 var(--progress, 0%), transparent var(--progress, 0%));
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.progress-slider:hover {
  height: 6px;
}

.progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
  opacity: 0;
  transition: all 0.2s ease;
}

.progress-container:hover .progress-slider::-webkit-slider-thumb,
.progress-slider:active::-webkit-slider-thumb {
  opacity: 1;
  transform: scale(1.2);
}

.progress-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
  opacity: 0;
  transition: all 0.2s ease;
}

.progress-container:hover .progress-slider::-moz-range-thumb,
.progress-slider:active::-moz-range-thumb {
  opacity: 1;
  transform: scale(1.2);
}

.controls {
  display: flex;
  gap: 16px; /* Más espacio */
  align-items: center;
  justify-content: center;
}

.control-button {
  background: transparent;
  border: none;
  color: #b3b3b3;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-button:hover:not(:disabled) {
  color: white;
  background: #282828;
  transform: scale(1.05);
}

.control-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.shuffle-button.active,
.repeat-button.active {
  color: #ff2d55;
  background: rgba(255, 45, 85, 0.1);
}

.play-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: white;
  color: #000;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.play-button:hover {
  background: #f0f0f0;
}

@media (max-width: 768px) {
  .player-bar {
    height: auto;
    padding: 6px 16px; 
    flex-direction: column;
    gap: 2px;
  }
  
  .track-info {
    max-width: 100%;
    width: 100%;
    justify-content: space-between;
    padding: 0;
    gap: 12px;
  }

  .track-title {
    font-size: 16px; /* Aumentado de 14px */
  }

  .track-artist {
    font-size: 14px; /* Aumentado de 12px */
  }

  .track-thumbnail {
    width: 44px; /* Reducido de 52px a 44px */
    height: 44px;
  }

  .player-controls {
    width: 100%;
    gap: 8px;
  }

  .progress-container {
    position: relative;
    top: 0;
    margin: 0;
    width: 100%;
    padding: 0;
    gap: 12px; /* Espacio para etiquetas de tiempo */
  }

  .time-label {
    display: block;
    min-width: 35px;
    font-size: 13px; /* Aumentado de 11px */
  }

  .progress-slider {
    height: 6px; /* Más grueso como en el expandido */
    border-radius: 3px;
  }

  .controls {
    width: auto;
    justify-content: center;
    gap: 20px; /* Espaciado "normal" no tan separado ni pegado */
    padding: 4px 0;
  }

  .play-button {
    width: 42px; /* Reducido de 56px a 42px */
    height: 42px;
    background: white;
    color: black;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }

  .queue-info {
    display: flex;
    justify-content: center;
    width: 100%;
    margin-top: 2px;
  }

  .shuffle-button, .repeat-button {
    display: flex;
  }
}
</style>