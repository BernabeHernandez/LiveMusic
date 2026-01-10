<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'

const router = useRouter()
const playerStore = usePlayerStore()

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const artists = ref([
  { name: 'Peso Pluma', genre: 'Corridos Tumbados' },
  { name: 'Natanael Cano', genre: 'Corridos Tumbados' },
  { name: 'Junior H', genre: 'Corridos' },
  { name: 'Bad Bunny', genre: 'Reggaetón' },
  { name: 'Karol G', genre: 'Reggaetón' },
  { name: 'Feid', genre: 'Reggaetón' },
  { name: 'Anuel AA', genre: 'Reggaetón' },
  { name: 'Grupo Frontera', genre: 'Regional Mexicano' },
  { name: 'Fuerza Regida', genre: 'Corridos' }
])

const songs = ref([
  { title: 'Ella Baila Sola', artist: 'Peso Pluma', genre: 'Corridos Tumbados' },
  { title: 'PRC', artist: 'Natanael Cano', genre: 'Corridos Tumbados' },
  { title: 'Soy El Diablo', artist: 'Natanael Cano', genre: 'Corridos' },
  { title: 'Tití Me Preguntó', artist: 'Bad Bunny', genre: 'Reggaetón' },
  { title: 'Provenza', artist: 'Karol G', genre: 'Reggaetón' },
  { title: 'Classy 101', artist: 'Feid', genre: 'Reggaetón' },
  { title: 'Bebé Dame', artist: 'Fuerza Regida', genre: 'Corridos' },
  { title: 'Un X100to', artist: 'Grupo Frontera', genre: 'Regional Mexicano' }
])

const shuffledArtists = computed(() =>
  [...artists.value].sort(() => Math.random() - 0.5).slice(0, 6)
)

const shuffledSongs = computed(() =>
  [...songs.value].sort(() => Math.random() - 0.5).slice(0, 8)
)

const goSearch = (text) => {
  router.push({
    name: 'search',
    query: { q: text }
  })
}

const playSong = async (song) => {
  try {
    const query = `${song.title} ${song.artist}`

    const res = await fetch(
      `${API_URL}/api/search?q=${encodeURIComponent(query)}`
    )

    const data = await res.json()
    const first = data.items?.[0]

    if (!first?.videoId) {
      console.warn('No se encontró video para:', query)
      return
    }

    playerStore.playTrack(first.videoId, {
      title: song.title,
      artist: song.artist,
      thumbnail: first.thumbnail
    })
  } catch (error) {
    console.error('Error reproduciendo canción:', error)
  }
}
</script>

<template>
  <div class="home">

    <section class="section">
      <h2>Artistas más sonados 🔥</h2>

      <div class="grid">
        <div
          v-for="artist in shuffledArtists"
          :key="artist.name"
          class="card"
          @click="goSearch(artist.name)"
        >
          <div class="avatar">👤</div>
          <h3>{{ artist.name }}</h3>
          <p>{{ artist.genre }}</p>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Para ti ✨</h2>

      <div class="song-list">
        <div
          v-for="song in shuffledSongs"
          :key="song.title"
          class="song"
        >
          <div class="song-info">
            <strong>{{ song.title }}</strong>
            <span>{{ song.artist }} · {{ song.genre }}</span>
          </div>

          <button
            class="play-btn"
            @click.stop="playSong(song)"
            title="Reproducir"
          >
            ▶
          </button>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
.home {
  padding: 2rem;
}

.section {
  margin-bottom: 3rem;
}

.section h2 {
  margin-bottom: 1.2rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1.2rem;
}

.card {
  background: rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;
}

.card:hover {
  transform: translateY(-4px);
  background: rgba(255,255,255,0.15);
}

.avatar {
  font-size: 2.8rem;
  margin-bottom: 0.6rem;
}


.song-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.song {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255,255,255,0.06);
  padding: 0.8rem 1rem;
  border-radius: 10px;
  transition: background 0.2s;
}

.song:hover {
  background: rgba(255,255,255,0.12);
}

.song-info span {
  display: block;
  font-size: 0.85rem;
  opacity: 0.7;
}

.play-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.3rem;
  cursor: pointer;
  opacity: 0.8;
}

.play-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}
</style>
