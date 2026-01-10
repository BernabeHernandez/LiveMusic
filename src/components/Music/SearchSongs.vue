<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePlayerStore } from '../../../src/stores/player'

const route = useRoute()
const playerStore = usePlayerStore()

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const query = ref('')
const results = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const maxResults = ref(50)

/* 🔍 FUNCIÓN DE BÚSQUEDA */
const search = async (append = false) => {
  if (!query.value.trim()) return

  isLoading.value = true
  if (!append) results.value = []
  errorMessage.value = ''

  try {
    const url = `${API_URL}/api/search?q=${encodeURIComponent(query.value)}&maxResults=${maxResults.value}`
    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Error en la búsqueda')
    }

    const items = data.items || data
    results.value = append
      ? [...results.value, ...items]
      : items

    if (!results.value.length) {
      errorMessage.value = 'No se encontraron resultados'
    }
  } catch (err) {
    errorMessage.value = err.message
  }

  isLoading.value = false
}

/* ▶️ REPRODUCIR CANCIÓN */
const playTrack = (item) => {
  const videoId =
    item.videoId ||
    item.url?.split('v=')[1]?.split('&')[0] ||
    item.url?.split('/').pop()

  playerStore.playTrack(videoId, {
    title: item.title,
    artist: item.uploaderName || item.artist,
    thumbnail: item.thumbnail
  })
}

/* ♾️ SCROLL INFINITO */
const handleScroll = () => {
  const nearBottom =
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 500

  if (nearBottom && !isLoading.value && results.value.length) {
    maxResults.value += 20
    search(true)
  }
}

/* 🧠 ESCUCHAR CAMBIOS EN LA URL */
watch(
  () => route.query.q,
  (newQuery) => {
    if (newQuery) {
      query.value = newQuery
      maxResults.value = 50
      search()
    }
  },
  { immediate: true }
)

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="search-container">
    <h2 v-if="query">Resultados para "{{ query }}"</h2>

    <div v-if="isLoading && !results.length" class="loading">
      🔍 Buscando resultados...
    </div>

    <div v-if="errorMessage" class="error-message">
      ❌ {{ errorMessage }}
    </div>

    <div class="results">
      <div
        v-for="item in results"
        :key="item.url"
        class="song-card"
        @click="playTrack(item)"
      >
        <img
          :src="item.thumbnail"
          @error="e => e.target.src = 'https://via.placeholder.com/60?text=🎵'"
          class="thumbnail"
        />
        <div class="info">
          <p class="title">{{ item.title }}</p>
          <p class="artist">{{ item.uploaderName || item.artist }}</p>
        </div>
      </div>
    </div>

    <div v-if="isLoading && results.length" class="loading-more">
      Cargando más resultados...
    </div>
  </div>
</template>
