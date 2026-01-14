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
      <div class="expanded-content">
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

        <div class="album-art-container">
          <div class="album-art-wrapper">
            <img 
              :src="playerStore.currentTrack.thumbnail" 
              :alt="playerStore.currentTrack.title"
              class="album-art"
            />
            <div class="art-shadow"></div>
          </div>
        </div>

        <div class="track-info-section">
          <div class="track-main-info">
            <h1 class="track-title-large">{{ playerStore.currentTrack.title }}</h1>
            <p class="track-artist-large">{{ playerStore.currentTrack.artist }}</p>
          </div>
          <button 
            @click="toggleFavorite" 
            class="favorite-button-large"
            :class="{ 'is-favorite': isCurrentFavorite }"
          >
            <Heart :size="28" :fill="isCurrentFavorite ? 'currentColor' : 'none'" />
          </button>
        </div>

        <div class="progress-section">
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="0.1"
            :value="playerStore.progress"
            @input="(e) => playerStore.seekTo(parseFloat(e.target.value))"
            class="progress-slider-large"
          />
          <div class="time-row">
            <span class="time-current">{{ formatTime(playerStore.currentTime) }}</span>
            <span class="time-total">{{ formatTime(playerStore.duration) }}</span>
          </div>
        </div>

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

        <div class="queue-info-section" v-if="playerStore.queue.length > 0">
          <span class="queue-counter">
            {{ playerStore.currentIndex + 1 }} de {{ playerStore.queue.length }} en cola
          </span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.expanded-player {
  position: fixed;
  inset: 0;
  background: linear-gradient(180deg, #1a1a1a 0%, #121212 100%);
  z-index: 2000;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.expanded-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.expanded-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  padding-top: 8px;
}

.close-button {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}

.header-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
}

.header-label {
  font-size: 11px;
  color: #b3b3b3;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.header-source {
  font-size: 13px;
  font-weight: 600;
  color: white;
}

.header-spacer {
  width: 44px;
}

.album-art-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 0 40px;
  min-height: 300px;
}

.album-art-wrapper {
  position: relative;
  width: 100%;
  max-width: 400px;
  aspect-ratio: 1;
}

.album-art {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.art-shadow {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

.track-info-section {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 32px;
  padding: 0 8px;
}

.track-main-info {
  flex: 1;
  min-width: 0;
}

.track-title-large {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  line-height: 1.3;
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
}

.track-artist-large {
  font-size: 1.1rem;
  color: #b3b3b3;
  margin: 0;
  font-weight: 500;
}

.favorite-button-large {
  background: transparent;
  border: none;
  color: #b3b3b3;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s;
  flex-shrink: 0;
}

.favorite-button-large:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}

.favorite-button-large.is-favorite {
  color: #1db954;
}

.favorite-button-large.is-favorite:hover {
  color: #ff4444;
}

.progress-section {
  margin-bottom: 32px;
  padding: 0 8px;
}

.progress-slider-large {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #404040;
  outline: none;
  cursor: pointer;
  margin-bottom: 12px;
}

.progress-slider-large::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.1s;
}

.progress-slider-large::-webkit-slider-thumb:active {
  transform: scale(1.2);
}

.progress-slider-large::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.1s;
}

.progress-slider-large::-moz-range-thumb:active {
  transform: scale(1.2);
}

.time-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #b3b3b3;
  font-variant-numeric: tabular-nums;
}

.controls-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 0 8px;
}

.control-icon {
  background: transparent;
  border: none;
  color: #b3b3b3;
  cursor: pointer;
  padding: 12px;
  border-radius: 50%;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-icon:hover:not(:disabled) {
  color: white;
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}

.control-icon:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.control-icon.active {
  color: #1db954;
}

.play-button-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: white;
  color: #000;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.play-button-large:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
}

.play-button-large:active {
  transform: scale(0.98);
}

.queue-info-section {
  text-align: center;
  padding: 0 8px 20px;
}

.queue-counter {
  font-size: 13px;
  color: #b3b3b3;
  font-weight: 500;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.expand-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.expand-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

@media (max-width: 640px) {
  .expanded-content {
    padding: 16px;
  }

  .album-art-container {
    min-height: 250px;
  }

  .track-title-large {
    font-size: 1.25rem;
  }

  .track-artist-large {
    font-size: 1rem;
  }

  .play-button-large {
    width: 70px;
    height: 70px;
  }

  .control-icon {
    padding: 8px;
  }
}

@media (min-width: 768px) {
  .expanded-content {
    padding: 40px;
  }

  .album-art-container {
    min-height: 400px;
  }
}
</style>