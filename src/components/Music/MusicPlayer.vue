<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { usePlayerStore } from '../../../src/stores/player'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat
} from 'lucide-vue-next'

const playerStore = usePlayerStore()
const audioElement = ref(null)
const isSeeking = ref(false)

const canGoPrevious = computed(() => {
  return playerStore.currentIndex > 0 || playerStore.currentTime > 3
})

const canGoNext = computed(() => {
  return playerStore.currentIndex < playerStore.queue.length - 1
})

onMounted(() => {
  playerStore.initAudioPlayer(audioElement.value)
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

  <div v-if="playerStore.currentTrack" class="player-bar">
    <div class="track-info">
      <img :src="playerStore.currentTrack.thumbnail" alt="Cover" class="track-thumbnail" />
      <div class="track-details">
        <p class="track-title">{{ playerStore.currentTrack.title }}</p>
        <p class="track-artist">{{ playerStore.currentTrack.artist }}</p>
      </div>
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
  background: linear-gradient(to top, #000, #111);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 30px 15px;
  border-top: 2px solid #1db954;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.track-info {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
  min-width: 0;
  max-width: 300px;
}

.track-thumbnail {
  width: 55px;
  height: 55px;
  border-radius: 8px;
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

.player-controls {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  max-width: 600px;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 10px;
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
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: #404040;
  outline: none;
  -webkit-appearance: none;
  cursor: pointer;
}

.progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #1db954;
  cursor: pointer;
  transition: transform 0.1s;
}

.progress-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.progress-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #1db954;
  cursor: pointer;
  border: none;
  transition: transform 0.1s;
}

.progress-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
}

.controls {
  display: flex;
  gap: 8px;
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
  color: #1db954;
  background: #282828;
}

.play-button {
  background: #1db954;
  border: none;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(29, 185, 84, 0.4);
}

.play-button:hover {
  background: #1ed760;
  transform: scale(1.1);
}

.queue-info {
  margin-top: 4px;
}

.queue-text {
  font-size: 11px;
  color: #b3b3b3;
}

@media (max-width: 768px) {
  .player-bar {
    flex-direction: column;
    padding: 15px 20px;
    gap: 15px;
  }
  
  .track-info,
  .player-controls {
    max-width: 100%;
    width: 100%;
  }
}
</style>