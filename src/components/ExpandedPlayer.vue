<script setup>
import { computed } from 'vue'
import { usePlayerStore } from '../stores/player'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat,
  Heart,
  ChevronDown,
  Volume2
} from 'lucide-vue-next'

const playerStore = usePlayerStore()

const props = defineProps({
  isExpanded: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

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
</script>

<template>
  <Transition name="expand">
    <div v-if="isExpanded" class="expanded-player" @click.self="handleClose">
      <!-- Fondo dinámico basado en la carátula -->
      <div class="album-background" :style="{
        backgroundImage: `url(${playerStore.currentTrack?.thumbnail || ''})`
      }"></div>
      
      <!-- Overlay de gradiente -->
      <div class="background-overlay"></div>
      
      <div class="expanded-content">
        <!-- Header -->
        <div class="expanded-header">
          <button @click="handleClose" class="close-button">
            <ChevronDown :size="28" />
          </button>
          <div class="header-info">
            <span class="header-label">Reproduciendo desde</span>
            <span class="header-source">Cola de reproducción</span>
          </div>
          <div class="header-spacer"></div>
        </div>

        <!-- Contenido principal -->
        <div class="main-content">
          <!-- Carátula con efecto de resplandido -->
          <div class="album-art-container">
            <div class="album-art-wrapper">
              <img 
                v-if="playerStore.currentTrack?.thumbnail"
                :src="playerStore.currentTrack.thumbnail" 
                :alt="playerStore.currentTrack.title"
                class="album-art"
              />
              <!-- Sombra difuminada alrededor de la carátula -->
              <div class="art-shadow-glow"></div>
            </div>
          </div>

          <!-- Información de la canción -->
          <div class="track-info-section">
            <div class="track-main-info">
              <h1 class="track-title-large">{{ playerStore.currentTrack?.title || 'Sin título' }}</h1>
              <p class="track-artist-large">{{ playerStore.currentTrack?.artist || 'Artista desconocido' }}</p>
            </div>
            <button 
              @click="toggleFavorite" 
              class="favorite-button-large"
              :class="{ 'is-favorite': isCurrentFavorite }"
            >
              <Heart :size="28" :fill="isCurrentFavorite ? 'currentColor' : 'none'" />
            </button>
          </div>

          <!-- Barra de progreso -->
          <div class="progress-section">
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="0.1"
              :value="playerStore.progress || 0"
              @input="(e) => playerStore.seekTo(parseFloat(e.target.value))"
              class="progress-slider-large"
              :style="`--progress: ${playerStore.progress || 0}%`"
            />
            <div class="time-row">
              <span class="time-current">{{ formatTime(playerStore.currentTime) }}</span>
              <span class="time-total">{{ formatTime(playerStore.duration) }}</span>
            </div>
          </div>

          <!-- Controles de reproducción -->
          <div class="controls-section">
            <button 
              @click="playerStore.toggleShuffle()" 
              class="control-icon" 
              :class="{ active: playerStore.isShuffleEnabled }"
            >
              <Shuffle :size="24" />
            </button>
            
            <button 
              @click="playerStore.previousTrack()" 
              class="control-icon"
              :disabled="!canGoPrevious"
            >
              <SkipBack :size="32" />
            </button>
            
            <button 
              @click="playerStore.togglePlay()" 
              class="play-button-large"
            >
              <Play v-if="!playerStore.isPlaying" :size="36" fill="currentColor" />
              <Pause v-else :size="36" fill="currentColor" />
            </button>
            
            <button 
              @click="playerStore.nextTrack()" 
              class="control-icon"
              :disabled="!canGoNext"
            >
              <SkipForward :size="32" />
            </button>

            <button 
              @click="playerStore.toggleRepeat()" 
              class="control-icon" 
              :class="{ active: playerStore.isRepeatEnabled }"
            >
              <Repeat :size="24" />
            </button>
          </div>

          <!-- Información de la cola -->
          <div class="queue-info-section" v-if="playerStore.queue?.length > 0">
            <span class="queue-counter">
              {{ (playerStore.currentIndex || 0) + 1 }} de {{ playerStore.queue.length }} en cola
            </span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Estilos base */
.expanded-player {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 2000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Fondo desenfocado de la carátula */
.album-background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(80px) brightness(0.6) saturate(1.4);
  transform: scale(1.1);
  opacity: 0.5;
  z-index: 1;
  transition: background-image 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: background-image;
}

/* Overlay de gradiente para el efecto desvanecido */
.background-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.95) 0%,
    rgba(0, 0, 0, 0.8) 15%,
    rgba(0, 0, 0, 0.6) 30%,
    rgba(0, 0, 0, 0.4) 50%,
    rgba(0, 0, 0, 0.6) 70%,
    rgba(0, 0, 0, 0.8) 85%,
    rgba(0, 0, 0, 0.95) 100%
  );
  z-index: 2;
}

/* Contenedor principal */
.expanded-content {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 0;
  max-width: 100%;
  z-index: 3;
}

/* Header */
.expanded-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: max(8px, env(safe-area-inset-top, 8px)) clamp(12px, 4vw, 20px) 16px;
  flex-shrink: 0;
  min-height: 56px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), transparent);
}

.close-button {
  background: rgba(0, 0, 0, 0.4);
  border: none;
  color: white;
  cursor: pointer;
  padding: 10px;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.08);
}

.close-button:active {
  transform: scale(0.95);
}

.header-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
  min-width: 0;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 20px;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.header-label {
  font-size: clamp(10px, 2.5vw, 11px);
  color: rgba(255, 255, 255, 0.85);
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  font-weight: 700;
}

.header-source {
  font-size: clamp(12px, 3vw, 14px);
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.header-spacer {
  width: 44px;
  flex-shrink: 0;
}

/* Contenido principal */
.main-content {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 clamp(12px, 4vw, 24px);
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: max(20px, env(safe-area-inset-bottom, 20px));
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(0, 0, 0, 0.25) 30%,
    rgba(0, 0, 0, 0.6) 60%,
    rgba(0, 0, 0, 0.85) 80%,
    #000 100%
  );
}

/* Carátula con efectos */
.album-art-container {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: clamp(8px, 2vh, 20px) 0 clamp(20px, 4vh, 40px);
  min-height: 0;
  position: relative;
}

.album-art-wrapper {
  position: relative;
  width: 100%;
  max-width: min(85vw, 400px);
  aspect-ratio: 1;
  margin: 0 auto;
  z-index: 1;
}

.album-art {
  width: 100%;
  height: 100%;
  border-radius: clamp(12px, 3vw, 16px);
  object-fit: cover;
  position: relative;
  z-index: 2;
  animation: fadeInScale 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  box-shadow: 
    0 25px 70px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(255, 255, 255, 0.08);
  opacity: 0;
  transform: scale(0.9);
}

/* Efecto de resplandido difuminado */
.art-shadow-glow {
  position: absolute;
  inset: -25px;
  border-radius: clamp(20px, 5vw, 30px);
  background: inherit;
  background-image: inherit;
  background-size: cover;
  background-position: center;
  filter: blur(45px) brightness(1.3) saturate(1.6);
  opacity: 0.6;
  z-index: 1;
  animation: glowPulse 5s ease-in-out infinite alternate;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9) rotate(-3deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes glowPulse {
  0% {
    opacity: 0.4;
    transform: scale(0.92);
  }
  50% {
    opacity: 0.7;
    transform: scale(1);
  }
  100% {
    opacity: 0.5;
    transform: scale(0.96);
  }
}

/* Información de la canción */
.track-info-section {
  display: flex;
  align-items: flex-start;
  gap: clamp(12px, 3vw, 16px);
  margin-bottom: clamp(20px, 4vh, 32px);
  flex-shrink: 0;
  position: relative;
  z-index: 3;
}

.track-main-info {
  flex: 1;
  min-width: 0;
}

.track-title-large {
  font-size: clamp(1.3rem, 6vw, 1.8rem);
  font-weight: 800;
  margin: 0 0 clamp(6px, 1.5vh, 10px) 0;
  line-height: 1.2;
  color: white;
  text-shadow: 0 2px 15px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  max-height: 2.4em;
  letter-spacing: -0.5px;
}

.track-artist-large {
  font-size: clamp(1.05rem, 4.5vw, 1.3rem);
  color: rgba(255, 255, 255, 0.92);
  margin: 0;
  font-weight: 500;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  letter-spacing: -0.3px;
}

.favorite-button-large {
  background: rgba(0, 0, 0, 0.45);
  border: none;
  color: rgba(255, 255, 255, 0.92);
  cursor: pointer;
  padding: clamp(8px, 2vw, 12px);
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  margin-top: 8px;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.favorite-button-large:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: scale(1.12);
}

.favorite-button-large.is-favorite {
  color: #1db954;
  background: rgba(29, 185, 84, 0.25);
  border-color: rgba(29, 185, 84, 0.3);
}

.favorite-button-large.is-favorite:hover {
  color: #1ed760;
  background: rgba(30, 215, 96, 0.3);
}

/* Barra de progreso */
.progress-section {
  margin-bottom: clamp(20px, 4vh, 32px);
  flex-shrink: 0;
  position: relative;
  z-index: 3;
  background: rgba(0, 0, 0, 0.35);
  padding: 18px 22px;
  border-radius: 20px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.progress-slider-large {
  width: 100%;
  height: 5px;
  border-radius: 3px;
  background: linear-gradient(to right, #1db954 var(--progress, 0%), rgba(255, 255, 255, 0.15) var(--progress, 0%));
  outline: none;
  cursor: pointer;
  margin-bottom: 14px;
  -webkit-appearance: none;
  appearance: none;
  position: relative;
  overflow: hidden;
}

.progress-slider-large::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to right, #1db954, #1ed760);
  width: var(--progress, 0%);
  border-radius: 3px;
}

.progress-slider-large::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 
    0 2px 10px rgba(0, 0, 0, 0.6),
    0 0 0 3px rgba(29, 185, 84, 0.3);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 3px solid #1db954;
  position: relative;
  z-index: 2;
}

.progress-slider-large::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 
    0 3px 15px rgba(0, 0, 0, 0.7),
    0 0 0 4px rgba(29, 185, 84, 0.4);
}

.progress-slider-large::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: 3px solid #1db954;
  box-shadow: 
    0 2px 10px rgba(0, 0, 0, 0.6),
    0 0 0 3px rgba(29, 185, 84, 0.3);
  transition: all 0.2s;
}

.progress-slider-large::-moz-range-thumb:hover {
  transform: scale(1.15);
  box-shadow: 
    0 3px 15px rgba(0, 0, 0, 0.7),
    0 0 0 4px rgba(29, 185, 84, 0.4);
}

.time-row {
  display: flex;
  justify-content: space-between;
  font-size: clamp(11px, 2.5vw, 13px);
  color: rgba(255, 255, 255, 0.85);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  letter-spacing: 0.3px;
}

/* Controles de reproducción */
.controls-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(14px, 3.5vw, 20px);
  margin-bottom: clamp(16px, 3vh, 24px);
  flex-shrink: 0;
  position: relative;
  z-index: 3;
  padding: 22px 24px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 28px;
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.07);
  margin-top: auto;
}

.control-icon {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: rgba(255, 255, 255, 0.92);
  cursor: pointer;
  padding: clamp(10px, 2.5vw, 14px);
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.control-icon:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.12);
  color: white;
}

.control-icon:active:not(:disabled) {
  transform: scale(0.95);
}

.control-icon:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none !important;
}

.control-icon.active {
  color: #1db954;
  background: rgba(29, 185, 84, 0.2);
  border-color: rgba(29, 185, 84, 0.25);
}

.control-icon.active:hover {
  color: #1ed760;
  background: rgba(30, 215, 96, 0.25);
}

.control-icon svg {
  width: clamp(20px, 5vw, 24px);
  height: clamp(20px, 5vw, 24px);
}

.control-icon:nth-child(2) svg,
.control-icon:nth-child(4) svg {
  width: clamp(26px, 6.5vw, 32px);
  height: clamp(26px, 6.5vw, 32px);
}

/* Botón de reproducción principal */
.play-button-large {
  width: clamp(70px, 18vw, 90px);
  height: clamp(70px, 18vw, 90px);
  border-radius: 50%;
  background: white;
  color: #000;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
  position: relative;
  z-index: 2;
  margin: 0 8px;
}

.play-button-large::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.8), transparent 75%);
  opacity: 0;
  transition: opacity 0.3s;
}

.play-button-large:hover {
  transform: scale(1.08);
  box-shadow: 
    0 15px 50px rgba(0, 0, 0, 0.7),
    0 0 0 2px rgba(255, 255, 255, 0.2);
}

.play-button-large:hover::before {
  opacity: 0.2;
}

.play-button-large:active {
  transform: scale(0.98);
}

.play-button-large svg {
  width: clamp(30px, 8vw, 40px);
  height: clamp(30px, 8vw, 40px);
}

/* Información de la cola */
.queue-info-section {
  text-align: center;
  padding: clamp(14px, 2.5vh, 18px);
  flex-shrink: 0;
  position: relative;
  z-index: 3;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 20px;
  margin-bottom: max(20px, env(safe-area-inset-bottom, 20px));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.queue-counter {
  font-size: clamp(13px, 3.5vw, 15px);
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* Animaciones de entrada/salida */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.expand-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.expand-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.expand-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.expand-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

.expand-enter-active .album-art,
.expand-leave-active .album-art {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Optimizaciones para pantallas pequeñas */
@media (max-height: 700px) {
  .album-art-wrapper {
    max-width: 75vw;
  }
  
  .track-title-large {
    -webkit-line-clamp: 1;
    max-height: 1.3em;
  }
  
  .controls-section {
    padding: 18px 20px;
    gap: clamp(10px, 2.5vw, 16px);
  }
  
  .play-button-large {
    width: clamp(60px, 15vw, 75px);
    height: clamp(60px, 15vw, 75px);
  }
  
  .background-overlay {
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.95) 0%,
      rgba(0, 0, 0, 0.8) 15%,
      rgba(0, 0, 0, 0.65) 30%,
      rgba(0, 0, 0, 0.8) 70%,
      rgba(0, 0, 0, 0.95) 100%
    );
  }
}

@media (max-height: 600px) {
  .album-art-wrapper {
    max-width: 65vw;
    margin: 10px auto;
  }
  
  .track-info-section {
    margin-bottom: 15px;
  }
  
  .progress-section {
    margin-bottom: 15px;
    padding: 12px 16px;
  }
  
  .controls-section {
    margin-bottom: 15px;
    padding: 12px 16px;
  }
  
  .queue-info-section {
    padding: 10px;
    margin-bottom: 10px;
  }
}

/* Orientación horizontal */
@media (orientation: landscape) and (max-height: 500px) {
  .main-content {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 20px;
    padding: 10px clamp(12px, 4vw, 24px);
  }
  
  .album-art-container {
    flex: 0 0 35%;
    margin: 0;
  }
  
  .album-art-wrapper {
    max-width: 100%;
  }
  
  .track-info-section {
    flex: 1;
    min-width: 0;
    margin-bottom: 0;
  }
  
  .progress-section {
    flex: 0 0 100%;
    order: 3;
  }
  
  .controls-section {
    flex: 0 0 100%;
    order: 4;
    margin-top: 10px;
  }
  
  .queue-info-section {
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

/* Soporte para áreas seguras (notch, etc.) */
@supports (padding: max(0px)) {
  .expanded-player {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  .main-content {
    padding-left: max(clamp(12px, 4vw, 24px), env(safe-area-inset-left));
    padding-right: max(clamp(12px, 4vw, 24px), env(safe-area-inset-right));
  }
  
  .expanded-header {
    padding-left: max(clamp(12px, 4vw, 20px), env(safe-area-inset-left));
    padding-right: max(clamp(12px, 4vw, 20px), env(safe-area-inset-right));
  }
}

/* Mejora de rendimiento para dispositivos con hardware limitado */
@media (prefers-reduced-motion: reduce) {
  .album-art,
  .close-button,
  .control-icon,
  .play-button-large,
  .favorite-button-large,
  .expand-enter-active,
  .expand-leave-active,
  .album-background {
    animation: none !important;
    transition: none !important;
  }
}

/* Corrección para navegadores que no soportan backdrop-filter */
@supports not (backdrop-filter: blur(10px)) {
  .close-button,
  .header-info,
  .controls-section,
  .progress-section,
  .queue-info-section,
  .control-icon,
  .favorite-button-large {
    background: rgba(0, 0, 0, 0.7);
  }
}
</style>