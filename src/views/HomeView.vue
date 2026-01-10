<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { Play, Music2, Mic2, Guitar, Flame, Crown, Trophy, Disc3, Radio, ChevronRight } from 'lucide-vue-next'

const router = useRouter()
const playerStore = usePlayerStore()

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const artists = ref([
  {
    name: 'Peso Pluma',
    genre: 'Corridos Tumbados',
    icon: 'Music2',
    color: 'from-purple-500 to-pink-600',
    image: 'https://www.pngall.com/wp-content/uploads/5/Profile.png'
  },
  {
    name: 'Natanael Cano',
    genre: 'Corridos Tumbados',
    icon: 'Guitar',
    color: 'from-blue-500 to-cyan-600',
    image: 'https://www.pngall.com/wp-content/uploads/5/Profile.png'
  },
  {
    name: 'Junior H',
    genre: 'Corridos',
    icon: 'Mic2',
    color: 'from-orange-500 to-red-600',
    image: 'https://www.pngall.com/wp-content/uploads/5/Profile.png'
  },
  {
    name: 'Bad Bunny',
    genre: 'Reggaetón',
    icon: 'Crown',
    color: 'from-yellow-500 to-orange-600',
    image: 'https://www.pngall.com/wp-content/uploads/5/Profile.png'
  },
  {
    name: 'Karol G',
    genre: 'Reggaetón',
    icon: 'Trophy',
    color: 'from-pink-500 to-rose-600',
    image: 'https://www.pngall.com/wp-content/uploads/5/Profile.png'
  },
  {
    name: 'Feid',
    genre: 'Reggaetón',
    icon: 'Disc3',
    color: 'from-green-500 to-emerald-600',
    image: 'https://www.pngall.com/wp-content/uploads/5/Profile.png'
  },
  {
    name: 'Anuel AA',
    genre: 'Reggaetón',
    icon: 'Crown',
    color: 'from-red-500 to-pink-600',
    image: 'https://www.pngall.com/wp-content/uploads/5/Profile.png'
  },
  {
    name: 'Grupo Frontera',
    genre: 'Regional Mexicano',
    icon: 'Radio',
    color: 'from-indigo-500 to-purple-600',
    image: 'https://www.pngall.com/wp-content/uploads/5/Profile.png'
  },
  {
    name: 'Fuerza Regida',
    genre: 'Corridos',
    icon: 'Flame',
    color: 'from-amber-500 to-red-600',
    image: 'https://www.pngall.com/wp-content/uploads/5/Profile.png'
  }
])

const songs = ref([
  {
    title: 'Ella Baila Sola',
    artist: 'Peso Pluma',
    genre: 'Corridos Tumbados',
    color: 'bg-purple-600',
    image: 'https://www.pngall.com/wp-content/uploads/5/Profile.png'
  },
  {
    title: 'PRC',
    artist: 'Natanael Cano',
    genre: 'Corridos Tumbados',
    color: 'bg-blue-600',
    image: 'https://www.pngall.com/wp-content/uploads/5/Profile.png'
  },
  {
    title: 'Soy El Diablo',
    artist: 'Natanael Cano',
    genre: 'Corridos',
    color: 'bg-cyan-600',
    image: 'https://www.pngall.com/wp-content/uploads/5/Profile.png'
  },
  {
    title: 'Tití Me Preguntó',
    artist: 'Bad Bunny',
    genre: 'Reggaetón',
    color: 'bg-yellow-600',
    image: 'https://www.pngall.com/wp-content/uploads/5/Profile.png'
  },
  {
    title: 'Provenza',
    artist: 'Karol G',
    genre: 'Reggaetón',
    color: 'bg-pink-600',
    image: 'https://www.pngall.com/wp-content/uploads/5/Profile.png'
  },
  {
    title: 'Classy 101',
    artist: 'Feid',
    genre: 'Reggaetón',
    color: 'bg-green-600',
    image: 'https://www.pngall.com/wp-content/uploads/5/Profile.png'
  },
  {
    title: 'Bebé Dame',
    artist: 'Fuerza Regida',
    genre: 'Corridos',
    color: 'bg-red-600',
    image: 'https://www.pngall.com/wp-content/uploads/5/Profile.png'
  },
  {
    title: 'Un X100to',
    artist: 'Grupo Frontera',
    genre: 'Regional Mexicano',
    color: 'bg-indigo-600',
    image: 'https://www.pngall.com/wp-content/uploads/5/Profile.png'
  }
])


const shuffledArtists = computed(() =>
  [...artists.value].sort(() => Math.random() - 0.5).slice(0, 6)
)

const shuffledSongs = computed(() =>
  [...songs.value].sort(() => Math.random() - 0.5).slice(0, 6)
)

const getIconComponent = (iconName) => {
  const icons = { Music2, Mic2, Guitar, Flame, Crown, Trophy, Disc3, Radio }
  return icons[iconName] || Music2
}

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
  <div class="home-apple">
    <section class="section">
      <h2 class="section-title">Para Ti</h2>
      <div class="quick-grid">
        <div
          v-for="song in shuffledSongs"
          :key="song.title"
          class="quick-card"
          @click="playSong(song)"
        >
          <div class="quick-image-container">
            <img :src="song.image" :alt="song.title" class="quick-image" />
            <div class="quick-overlay"></div>
          </div>
          <div class="quick-info">
            <h3 class="quick-title">{{ song.title }}</h3>
            <p class="quick-artist">{{ song.artist }}</p>
          </div>
          <button class="quick-play-btn" @click.stop="playSong(song)">
            <div class="play-btn-circle">
              <Play :size="20" fill="currentColor" />
            </div>
          </button>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Artistas Destacados</h2>
        <button class="see-all" @click="goSearch('artistas populares')">
          Ver Todo
          <ChevronRight :size="18" />
        </button>
      </div>

      <div class="artists-scroll">
        <div
          v-for="artist in shuffledArtists"
          :key="artist.name"
          class="artist-card-apple"
          @click="goSearch(artist.name)"
        >
          <div class="artist-circle-container">
            <img :src="artist.image" :alt="artist.name" class="artist-image" />
            <div class="artist-overlay"></div>
          </div>
          <h3 class="artist-name">{{ artist.name }}</h3>
          <p class="artist-genre">{{ artist.genre }}</p>
        </div>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">Explora por Género</h2>
      <div class="genres-grid">
        <div class="genre-card" :class="`bg-gradient-to-br from-purple-600 to-pink-700`" @click="goSearch('corridos tumbados')">
          <div class="genre-icon-container">
            <Guitar :size="48" :stroke-width="1.5" />
          </div>
          <h3 class="genre-name">Corridos Tumbados</h3>
        </div>
        <div class="genre-card" :class="`bg-gradient-to-br from-yellow-500 to-orange-600`" @click="goSearch('reggaeton')">
          <div class="genre-icon-container">
            <Flame :size="48" :stroke-width="1.5" />
          </div>
          <h3 class="genre-name">Reggaetón</h3>
        </div>
        <div class="genre-card" :class="`bg-gradient-to-br from-red-600 to-rose-700`" @click="goSearch('regional mexicano')">
          <div class="genre-icon-container">
            <Radio :size="48" :stroke-width="1.5" />
          </div>
          <h3 class="genre-name">Regional Mexicano</h3>
        </div>
        <div class="genre-card" :class="`bg-gradient-to-br from-blue-600 to-indigo-700`" @click="goSearch('corridos')">
          <div class="genre-icon-container">
            <Music2 :size="48" :stroke-width="1.5" />
          </div>
          <h3 class="genre-name">Corridos</h3>
        </div>
      </div>
    </section>

    <section class="section songs-section">
      <h2 class="section-title">Todas las Canciones</h2>

      <div class="songs-list">
        <div
          v-for="(song, index) in songs"
          :key="song.title"
          class="song-row"
          @click="playSong(song)"
        >
          <div class="song-number">{{ index + 1 }}</div>
          
          <div class="song-thumbnail-container">
            <img :src="song.image" :alt="song.title" class="song-thumbnail-image" />
            <div class="song-thumbnail-overlay">
              <Play :size="20" fill="currentColor" />
            </div>
          </div>
          
          <div class="song-details">
            <h3 class="song-title">{{ song.title }}</h3>
            <p class="song-meta">{{ song.artist }} · {{ song.genre }}</p>
          </div>

          <button class="song-play-btn" @click.stop="playSong(song)">
            <Play :size="20" />
          </button>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
.home-apple {
  padding-bottom: 4rem;
  min-height: 100vh;
}

.hero-welcome {
  position: relative;
  margin: 1rem 1rem 2rem 1rem;
  padding: 3rem 2rem;
  border-radius: 1.5rem;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.hero-gradient {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 50%);
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 10;
}

.hero-title {
  font-size: 3rem;
  font-weight: 900;
  color: white;
  margin-bottom: 0.5rem;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: rgba(255,255,255,0.9);
  font-weight: 500;
}

.section {
  margin: 2.5rem 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.875rem;
  font-weight: 800;
  color: white;
  letter-spacing: -0.02em;
}

.see-all {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  color: rgba(255,255,255,0.7);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;
  padding: 0.5rem;
}

.see-all:hover {
  color: white;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1rem;
}

.quick-card {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.08);
  border-radius: 0.75rem;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 80px;
  position: relative;
  backdrop-filter: blur(10px);
}

.quick-card:hover {
  background: rgba(255,255,255,0.15);
  transform: scale(1.02);
}

.quick-card:active {
  transform: scale(0.98);
}

.quick-image-container {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.quick-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.quick-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.1) 100%);
}

.quick-info {
  flex: 1;
  padding: 0 1rem;
  min-width: 0;
}

.quick-title {
  font-size: 1rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-artist {
  font-size: 0.875rem;
  color: rgba(255,255,255,0.7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-play-btn {
  background: none;
  border: none;
  color: white;
  padding: 1rem;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-card:hover .quick-play-btn {
  opacity: 1;
}

.play-btn-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.9);
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.play-btn-circle:hover {
  background: white;
  transform: scale(1.1);
}

.artists-scroll {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 1rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.2) transparent;
  scroll-behavior: smooth;
}

.artists-scroll::-webkit-scrollbar {
  height: 8px;
}

.artists-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.artists-scroll::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.2);
  border-radius: 4px;
}

.artist-card-apple {
  flex: 0 0 160px;
  cursor: pointer;
  transition: transform 0.2s;
  text-align: center;
}

.artist-card-apple:hover {
  transform: translateY(-4px);
}

.artist-circle-container {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  margin-bottom: 0.75rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}

.artist-card-apple:hover .artist-circle-container {
  transform: scale(1.05);
  box-shadow: 0 12px 32px rgba(0,0,0,0.4);
}

.artist-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artist-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 100%);
}

.artist-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.25rem;
}

.artist-genre {
  font-size: 0.875rem;
  color: rgba(255,255,255,0.6);
}

.genres-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.genre-card {
  height: 140px;
  border-radius: 1rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.genre-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 70% 30%, rgba(255,255,255,0.15) 0%, transparent 50%);
  pointer-events: none;
}

.genre-card:hover {
  transform: scale(1.03);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
}

.genre-icon-container {
  position: absolute;
  top: 1rem;
  right: 1rem;
  color: white;
  opacity: 0.9;
  transform: rotate(-15deg);
}

.genre-name {
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
  text-shadow: 0 2px 8px rgba(0,0,0,0.2);
  position: relative;
  z-index: 10;
}

.songs-section {
  margin-bottom: 6rem;
}

.songs-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.song-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: rgba(255,255,255,0.05);
  cursor: pointer;
  transition: background 0.2s;
}

.song-row:hover {
  background: rgba(255,255,255,0.1);
}

.song-number {
  width: 32px;
  text-align: center;
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255,255,255,0.5);
  flex-shrink: 0;
}

.song-thumbnail-container {
  width: 56px;
  height: 56px;
  border-radius: 0.5rem;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s;
}

.song-row:hover .song-thumbnail-container {
  transform: scale(1.05);
}

.song-thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.song-thumbnail-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  color: white;
}

.song-row:hover .song-thumbnail-overlay {
  opacity: 1;
}

.song-details {
  flex: 1;
  min-width: 0;
}

.song-title {
  font-size: 1rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-meta {
  font-size: 0.875rem;
  color: rgba(255,255,255,0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-play-btn {
  background: none;
  border: none;
  color: white;
  padding: 0.75rem;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.song-row:hover .song-play-btn {
  opacity: 1;
}

@media (max-width: 1024px) {
  .hero-welcome {
    padding: 2.5rem 1.5rem;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.125rem;
  }

  .section-title {
    font-size: 1.625rem;
  }

  .quick-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .hero-welcome {
    margin: 0.75rem 0.75rem 1.5rem 0.75rem;
    padding: 2rem 1.25rem;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .section {
    margin: 2rem 0.75rem;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .quick-grid {
    grid-template-columns: 1fr;
  }

  .artist-circle-container {
    width: 140px;
    height: 140px;
  }

  .artist-card-apple {
    flex: 0 0 140px;
  }

  .genres-grid {
    grid-template-columns: 1fr;
  }

  .genre-card {
    height: 120px;
  }
}

@media (max-width: 480px) {
  .hero-welcome {
    margin: 0.5rem 0.5rem 1rem 0.5rem;
    padding: 1.75rem 1rem;
    border-radius: 1rem;
  }

  .hero-title {
    font-size: 1.75rem;
  }

  .hero-subtitle {
    font-size: 0.875rem;
  }

  .section {
    margin: 1.5rem 0.5rem;
  }

  .section-title {
    font-size: 1.25rem;
  }

  .see-all {
    font-size: 0.875rem;
  }

  .quick-grid {
    gap: 0.75rem;
  }

  .quick-card {
    height: 72px;
  }

  .quick-image-container {
    width: 72px;
    height: 72px;
  }

  .artist-circle-container {
    width: 120px;
    height: 120px;
  }

  .artist-card-apple {
    flex: 0 0 120px;
  }

  .artist-name {
    font-size: 0.875rem;
  }

  .artist-genre {
    font-size: 0.75rem;
  }

  .genre-card {
    height: 110px;
    padding: 1.25rem;
  }

  .genre-icon-container {
    transform: scale(0.85) rotate(-15deg);
  }

  .genre-name {
    font-size: 1.25rem;
  }

  .song-number {
    width: 24px;
    font-size: 0.875rem;
  }

  .song-thumbnail-container {
    width: 48px;
    height: 48px;
  }

  .song-title {
    font-size: 0.875rem;
  }

  .song-meta {
    font-size: 0.75rem;
  }
}

@media (max-width: 375px) {
  .hero-title {
    font-size: 1.5rem;
  }

  .section-title {
    font-size: 1.125rem;
  }

  .quick-card {
    height: 64px;
  }

  .quick-image-container {
    width: 64px;
    height: 64px;
  }

  .artist-circle-container {
    width: 100px;
    height: 100px;
  }

  .artist-card-apple {
    flex: 0 0 100px;
  }
}
</style>
