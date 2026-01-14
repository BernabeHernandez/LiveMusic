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
  ChevronDown
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
      <div class="album-background" :style="{
        backgroundImage: `url(${playerStore.currentTrack?.thumbnail || ''})`
      }"></div>
      
      <div class="background-overlay"></div>
      <div class="player-layout">
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
            <button 
              @click="toggleFavorite" 
              class="favorite-button"
              :class="{ 'is-favorite': isCurrentFavorite }"
            >
              <Heart :size="22" :fill="isCurrentFavorite ? 'currentColor' : 'none'" />
            </button>
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  z-index: 2000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh; 
}

.album-background {
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  background-size: cover;
  background-position: center;
  filter: blur(70px) brightness(0.5) saturate(1.3);
  opacity: 0.5;
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
    rgba(0, 0, 0, 0.95) 0%,
    rgba(0, 0, 0, 0.7) 20%,
    rgba(0, 0, 0, 0.4) 50%,
    rgba(0, 0, 0, 0.7) 80%,
    rgba(0, 0, 0, 0.95) 100%
  );
  z-index: 2;
}

.player-layout {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-height: 100vh;
  max-height: 100dvh;
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
  width: min(85vw, 340px);
  aspect-ratio: 1;
  max-height: 60vh;
  margin: 0 auto;
}

.album-art {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  object-fit: cover;
  position: relative;
  z-index: 2;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.08);
}

.art-glow {
  position: absolute;
  inset: -15px;
  border-radius: 20px;
  background: inherit;
  background-image: inherit;
  background-size: cover;
  background-position: center;
  filter: blur(30px) brightness(1.2);
  opacity: 0.4;
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
  color: #1db954;
}
.progress-area {
  flex-shrink: 0;
  margin: 10px 0;
}

.progress-container {
  background: rgba(0, 0, 0, 0.3);
  padding: 16px;
  border-radius: 16px;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.progress-slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(to right, #1db954 var(--progress, 0%), rgba(255, 255, 255, 0.15) var(--progress, 0%));
  outline: none;
  cursor: pointer;
  margin-bottom: 10px;
}

.progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: 3px solid #1db954;
}

.progress-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: 3px solid #1db954;
  border: none;
}

.time-display {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-variant-numeric: tabular-nums;
}

/* CONTROLES - Altura fija */
.controls-area {
  flex-shrink: 0;
  margin: 10px 0;
}

.controls-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgba(0, 0, 0, 0.25);
  padding: 18px;
  border-radius: 24px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.07);
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
  color: #1db954;
  background: rgba(29, 185, 84, 0.15);
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
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.06);
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
    width: min(75vw, 280px);
    max-height: 50vh;
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
  .expanded-player {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }
}

@supports (-webkit-touch-callout: none) {
  .expanded-player {
    height: -webkit-fill-available;
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