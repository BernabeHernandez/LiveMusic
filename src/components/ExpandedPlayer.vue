<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { usePlayerStore } from '../stores/player'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat,
  Heart,
  ChevronDown
} from 'lucide-vue-next'
import DownloadButton from './DownloadButton.vue'

const playerStore = usePlayerStore()
const backgroundColor = ref('#121212') // Default dark color

const props = defineProps({
  isExpanded: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

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
    
    // lighten color for a more vibrant effect
    const darkenFactor = 0.9
    const dr = Math.floor(r * darkenFactor)
    const dg = Math.floor(g * darkenFactor)
    const db = Math.floor(b * darkenFactor)
    
    backgroundColor.value = `rgb(${dr}, ${dg}, ${db})`
    playerStore.updateThemeColor(backgroundColor.value)
  }
}

// Watch for track changes
watch(() => playerStore.currentTrack?.thumbnail, (newThumb) => {
  if (newThumb) extractDominantColor(newThumb)
}, { immediate: true })

// Ensure theme color is updated when expanding/collapsing
watch(() => props.isExpanded, (expanded) => {
  if (expanded) {
    playerStore.updateThemeColor(backgroundColor.value)
  }
})

const isCurrentFavorite = computed(() => {
  return playerStore.isCurrentTrackFavorite
})

const canGoPrevious = computed(() => {
  return playerStore.currentIndex > 0 || playerStore.currentTime > 3
})

const canGoNext = computed(() => {
  return playerStore.currentIndex < playerStore.queue.length - 1
})

const toggleFavorite = () => {
  if (playerStore.currentTrack) {
    playerStore.toggleFavorite(playerStore.currentTrack)
  }
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const handleClose = () => {
  emit('close')
}

// Swipe to close logic
const startY = ref(0)
const currentDeltaY = ref(0)
const isDragging = ref(false)

const handleTouchStart = (e) => {
  // Solo permitir swipe si no estamos interactuando con otros elementos táctiles específicos (opcional)
  startY.value = e.touches[0].clientY
  isDragging.value = true
}

const handleTouchMove = (e) => {
  if (!isDragging.value) return
  const currentY = e.touches[0].clientY
  const deltaY = currentY - startY.value
  
  // Solo permitir deslizar hacia abajo
  if (deltaY > 0) {
    // Aplicar un poco de resistencia al final opcionalmente, pero aquí 1:1 es común para este gesto
    currentDeltaY.value = deltaY
    
    // Evitar scroll del body mientras se desliza el reproductor
    if (e.cancelable) e.preventDefault()
  }
}

const handleTouchEnd = () => {
  if (!isDragging.value) return
  
  isDragging.value = false
  
  // Umbral para cerrar (150px o 20% de la pantalla)
  const threshold = Math.min(window.innerHeight * 0.2, 150)
  
  if (currentDeltaY.value > threshold) {
    handleClose()
  }
  
  // El reset se hace con la transición definida en los estilos
  currentDeltaY.value = 0
}
</script>

<template>
  <Transition name="expand">
    <div 
      v-if="isExpanded" 
      class="expanded-player" 
      :style="{ '--bg-color': backgroundColor }"
      @click.self="handleClose"
    >
      <div class="album-background" :style="{
        backgroundImage: `url(${playerStore.currentTrack?.thumbnail || ''})`
      }"></div>
      
      <div class="background-overlay"></div>
      <div 
        class="player-layout"
        :style="{ 
          transform: `translateY(${currentDeltaY}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <div class="player-header">
          <button @click="handleClose" class="close-button">
            <ChevronDown :size="24" />
          </button>
          <div class="header-info">
            <span class="header-label">Reproduciendo desde</span>
            <span class="header-source">Cola de reproducción</span>
          </div>
          <div class="header-spacer"></div>
        </div>

        <div class="player-body">
          
          <div class="album-art-area">
            <div class="album-art-frame">
              <img 
                v-if="playerStore.currentTrack?.thumbnail"
                :src="playerStore.currentTrack.thumbnail" 
                :alt="playerStore.currentTrack.title"
                class="album-art"
              />
              <div class="art-glow"></div>
            </div>
          </div>

          <div class="track-info-area">
            <div class="track-info-content">
              <h3 class="track-title">{{ playerStore.currentTrack?.title || 'Sin título' }}</h3>
              <p class="track-artist">{{ playerStore.currentTrack?.artist || 'Artista desconocido' }}</p>
            </div>
            
            <div class="flex items-center gap-1">
              <DownloadButton v-if="playerStore.currentTrack" :track="playerStore.currentTrack" />
              <button 
                @click="toggleFavorite" 
                class="favorite-button"
                :class="{ 'is-favorite': isCurrentFavorite }"
              >
                <Heart :size="22" :fill="isCurrentFavorite ? 'currentColor' : 'none'" />
              </button>
            </div>
          </div>

          <div class="progress-area">
            <div class="progress-container">
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="0.1"
                :value="playerStore.progress || 0"
                @input="(e) => playerStore.seekTo(parseFloat(e.target.value))"
                class="progress-slider"
                :style="`--progress: ${playerStore.progress || 0}%`"
              />
              <div class="time-display">
                <span class="time-current">{{ formatTime(playerStore.currentTime) }}</span>
                <span class="time-total">{{ formatTime(playerStore.duration) }}</span>
              </div>
            </div>
          </div>

          <div class="controls-area">
            <div class="controls-container">
              <button 
                @click="playerStore.toggleShuffle()" 
                class="control-btn" 
                :class="{ active: playerStore.isShuffleEnabled }"
              >
                <Shuffle :size="20" />
              </button>
              
              <button 
                @click="playerStore.previousTrack()" 
                class="control-btn"
                :disabled="!canGoPrevious"
              >
                <SkipBack :size="26" />
              </button>
              
              <button 
                @click="playerStore.togglePlay()" 
                class="play-btn"
              >
                <Play v-if="!playerStore.isPlaying" :size="28" fill="currentColor" />
                <Pause v-else :size="28" fill="currentColor" />
              </button>
              
              <button 
                @click="playerStore.nextTrack()" 
                class="control-btn"
                :disabled="!canGoNext"
              >
                <SkipForward :size="26" />
              </button>

              <button 
                @click="playerStore.toggleRepeat()" 
                class="control-btn" 
                :class="{ active: playerStore.isRepeatEnabled }"
              >
                <Repeat :size="20" />
              </button>
            </div>
          </div>

          <div class="queue-info" v-if="playerStore.queue?.length > 0">
            <span class="queue-text">
              {{ (playerStore.currentIndex || 0) + 1 }} de {{ playerStore.queue.length }} en cola
            </span>
          </div>

        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.expanded-player {
  position: fixed;
  inset: 0;
  background-color: var(--bg-color, #000);
  z-index: 9999;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  transition: background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.album-background {
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  background-size: cover;
  background-position: center;
  filter: blur(70px) brightness(0.9) saturate(1.5);
  opacity: 0.7;
  z-index: 1;
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.2) 0%,
    rgba(0, 0, 0, 0.1) 40%,
    rgba(0, 0, 0, 0.4) 100%
  );
  z-index: 2;
}

.player-layout {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.player-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px;
  min-height: 60px;
}

.close-button {
  background: rgba(0, 0, 0, 0.4);
  border: none;
  color: white;
  cursor: pointer;
  padding: 10px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 44px;
  height: 44px;
}

.header-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
  padding: 0 12px;
}

.header-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 2px;
  font-weight: 600;
}

.header-source {
  font-size: 13px;
  font-weight: 600;
  color: white;
}

.header-spacer {
  width: 44px;
}

.player-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 16px;
  min-height: 0;
  overflow: hidden;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
}

.album-art-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 10px 0;
}

.album-art-frame {
  position: relative;
  width: min(95vw, 480px); /* Aumentado para compensar el cambio de 1:1 a 16:9 */
  aspect-ratio: 16 / 9;
  max-height: 50vh;
  margin: 0 auto;
}

.album-art {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  object-fit: contain; /* Cambiado a contain para asegurar que NADA se corte */
  background: rgba(255, 255, 255, 0.03); /* Fondo sutil para el área si la imagen no llena */
  position: relative;
  z-index: 2;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.08);
}

.art-glow {
  inset: -10px;
  border-radius: 20px;
  background: inherit;
  background-image: inherit;
  background-size: cover;
  background-position: center;
  filter: blur(40px) brightness(1.1);
  opacity: 0.3;
  z-index: 1;
}

.track-info-area {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 10px 0;
  padding: 0 4px;
  min-height: 60px;
}

.track-info-content {
  flex: 1;
  min-width: 0;
}

.track-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 6px 0;
  line-height: 1.2;
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  max-height: 2.4em;
}

.track-artist {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-button {
  background: rgba(0, 0, 0, 0.3);
  border: none;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  padding: 10px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 44px;
  height: 44px;
  margin-top: 4px;
}

.favorite-button.is-favorite {
  color: #ff2d55;
}
.progress-area {
  flex-shrink: 0;
  margin: 10px 0;
}

.progress-container {
  padding: 8px 4px; /* Reducido al quitar el fondo */
}

.progress-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  background-image: linear-gradient(to right, #ff2d55 var(--progress, 0%), transparent var(--progress, 0%));
  outline: none;
  cursor: pointer;
  margin-bottom: 12px;
  transition: height 0.2s ease;
}

.progress-slider:hover {
  height: 8px;
}

.progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: all 0.2s ease;
}

.progress-container:hover .progress-slider::-moz-range-thumb,
.progress-slider:active::-moz-range-thumb {
  opacity: 1;
  transform: scale(1.2);
}

.time-display {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-variant-numeric: tabular-nums;
}

.controls-area {
  flex-shrink: 0;
  margin: 10px 0;
}

.controls-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px; /* Un poco más de espacio ahora que no tiene bordes */
  padding: 8px;
}

.control-btn {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  padding: 12px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
}

.control-btn.active {
  color: #ff2d55;
  background: rgba(255, 45, 85, 0.15);
}

.control-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.play-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: white;
  color: #000;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 8px 30px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}

.queue-info {
  flex-shrink: 0;
  text-align: center;
  padding: 12px;
  margin-top: auto;
}

.queue-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.expand-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.expand-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

@media (max-height: 600px) {
  .album-art-frame {
    width: min(90vw, 400px);
    max-height: 40vh;
  }
  
  .track-title {
    font-size: 0.8rem;
  }
  
  .track-artist {
    font-size: 1rem;
  }
  
  .controls-container {
    padding: 14px;
    gap: 12px;
  }
  
  .control-btn {
    width: 42px;
    height: 42px;
    padding: 10px;
  }
  
  .play-btn {
    width: 56px;
    height: 56px;
  }
  
  .queue-info {
    display: none; 
  }
}

@media (max-height: 500px) {
  .album-art-area {
    padding: 5px 0;
  }
  
  .album-art-frame {
    width: min(65vw, 220px);
    max-height: 40vh;
  }
  
  .track-info-area {
    margin: 5px 0;
    min-height: 50px;
  }
  
  .progress-area,
  .controls-area {
    margin: 5px 0;
  }
  
  .progress-container {
    padding: 12px;
  }
  
  .controls-container {
    padding: 12px;
    gap: 10px;
  }
  
  .control-btn {
    width: 38px;
    height: 38px;
    padding: 8px;
  }
  
  .play-btn {
    width: 50px;
    height: 50px;
  }
  
  .track-title {
    font-size: 0.8rem;
  }
  
  .track-artist {
    font-size: 0.95rem;
  }
}

@media (max-height: 400px) {
  .album-art-frame {
    width: min(55vw, 180px);
    max-height: 35vh;
  }
  
  .player-header {
    padding: calc(env(safe-area-inset-top, 0px) + 8px) 12px 8px;
    min-height: 52px;
  }
  
  .close-button,
  .favorite-button {
    width: 40px;
    height: 40px;
    padding: 8px;
  }
  
  .track-info-area {
    min-height: 40px;
  }
  
  .track-title {
    font-size: 0.8rem;
    margin-bottom: 4px;
  }
  
  .track-artist {
    font-size: 0.9rem;
  }
  
  .progress-container {
    padding: 10px;
  }
  
  .controls-container {
    padding: 10px;
    gap: 8px;
  }
  
  .control-btn {
    width: 34px;
    height: 34px;
    padding: 6px;
  }
  
  .play-btn {
    width: 44px;
    height: 44px;
  }
  
  .progress-slider {
    height: 3px;
  }
  
  .progress-slider::-webkit-slider-thumb {
    width: 14px;
    height: 14px;
  }
}

@media (orientation: landscape) and (max-height: 500px) {
  .player-body {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    padding: 0 20px;
  }
  
  .album-art-area {
    flex: 0 0 40%;
    padding: 0;
  }
  
  .album-art-frame {
    width: 100%;
    max-height: 70vh;
  }
  
  .track-info-area {
    flex: 1;
    margin: 0 0 0 20px;
    min-height: auto;
  }
  
  .progress-area {
    flex: 0 0 100%;
    order: 3;
    margin-top: 15px;
  }
  
  .controls-area {
    flex: 0 0 100%;
    order: 4;
    margin-top: 10px;
  }
  
  .queue-info {
    display: none;
  }
  
  .background-overlay {
    background: linear-gradient(
      to right,
      rgba(0, 0, 0, 0.95) 0%,
      rgba(0, 0, 0, 0.8) 20%,
      rgba(0, 0, 0, 0.6) 40%,
      rgba(0, 0, 0, 0.8) 80%,
      rgba(0, 0, 0, 0.95) 100%
    );
  }
}

@supports (padding: max(0px)) {
  .player-header {
    padding-top: calc(env(safe-area-inset-top, 0px) + 12px);
  }
  
  .player-body {
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
  }
}

@media screen and (max-width: 767px) {
  input[type="range"] {
    font-size: 16px !important;
  }
}

* {
  -webkit-overflow-scrolling: touch;
}

.expanded-player,
.player-layout,
.player-body,
.album-art-area {
  overflow: hidden !important;
  overscroll-behavior: none !important;
}
</style>