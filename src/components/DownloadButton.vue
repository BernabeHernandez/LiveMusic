<template>
  <button
    @click.stop="handleDownloadClick"
    :disabled="isDownloading"
    class="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full transition-all duration-200"
    :class="[
      isDownloadedState
        ? 'text-[#1db954] hover:bg-white/10'
        : 'text-white/70 hover:text-white hover:bg-white/10',
      isDownloading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
    ]"
    title="Descargar para escuchar offline"
  >

    <!-- Spinner mientras descarga -->
    <div
      v-if="isDownloading"
      class="animate-spin w-5 h-5 border-2 border-[#1db954] border-t-transparent rounded-full"
    ></div>

    <!-- Icono descarga -->
    <Download
      v-else
      class="w-5 h-5 md:w-6 md:h-6 transition-transform duration-200 group-hover:scale-110"
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