<template>
  <button
    @click.stop="handleDownloadClick"
    :disabled="isDownloading"
    class="download-button"
    :class="{ 
      'is-downloaded': isDownloadedState,
      'is-downloading': isDownloading 
    }"
    :title="isDownloadedState ? 'Ya descargado' : 'Descargar para escuchar offline'"
  >
    <!-- Spinner mientras descarga -->
    <div
      v-if="isDownloading"
      class="animate-spin w-5 h-5 border-2 border-[#1db954] border-t-transparent rounded-full"
    ></div>

    <!-- Icono descarga -->
    <Download
      v-else
      :size="22"
      class="icon"
    />
  </button>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Download } from 'lucide-vue-next'
import { useDownloadsStore } from '@/stores/downloads'

const props = defineProps({
  track: {
    type: Object,
    required: true
  }
})

const downloadsStore = useDownloadsStore()

const isDownloadedState = ref(false)
const isDownloading = ref(false)

const checkStatus = async () => {
  if (!props.track || !props.track.videoId) {
    isDownloadedState.value = false
    return
  }

  isDownloadedState.value = await downloadsStore.isDownloaded(props.track.videoId)

  isDownloading.value =
    downloadsStore.activeDownloads.value.has(props.track.videoId) || false
}

onMounted(checkStatus)

watch(() => props.track?.videoId, checkStatus)

watch(
  () => downloadsStore.activeDownloads.value,
  () => {
    if (props.track) {
      isDownloading.value =
        downloadsStore.activeDownloads.value.has(props.track.videoId)
    }
  },
  { deep: true }
)

const handleDownloadClick = async () => {
  if (!props.track || isDownloading.value || isDownloadedState.value) return

  try {
    await downloadsStore.downloadTrack(props.track)
  } catch (err) {
    console.error('Download error:', err)

    if (err.response?.status === 429) {
      alert('Has excedido las descargas de YouTube. Intenta de nuevo más tarde.')
    }
  } finally {
    await checkStatus()
  }
}
</script>

<style scoped>
.download-button {
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
  transition: all 0.2s;
}

.download-button:hover:not(:disabled) {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.download-button.is-downloaded {
  color: #1db954;
}

.download-button.is-downloading {
  cursor: not-allowed;
  opacity: 0.7;
}

.icon {
  transition: transform 0.2s;
}

.download-button:hover .icon {
  transform: scale(1.1);
}
</style>
