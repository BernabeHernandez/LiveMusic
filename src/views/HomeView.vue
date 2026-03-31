<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '../stores/player'
import { 
  Play, 
  Heart, 
  TrendingUp, 
  Clock, 
  Music2,
  Sparkles,
  Flame,
  Radio
} from 'lucide-vue-next'

const router = useRouter()
const playerStore = usePlayerStore()

const currentTime = ref(new Date().getHours())
const isLoading = ref(true)

const trendingSearches = ref([
  { query: 'Bad Bunny', icon: Flame, color: '#ff6b6b' },
  { query: 'The Weeknd', icon: TrendingUp, color: '#4ecdc4' },
  { query: 'Taylor Swift', icon: Sparkles, color: '#a78bfa' },
  { query: 'Drake', icon: Radio, color: '#fbbf24' },
  { query: 'Billie Eilish', icon: Music2, color: '#34d399' },
  { query: 'Ed Sheeran', icon: Heart, color: '#f472b6' }
])

const genres = ref([
  { 
    name: 'Pop', 
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    searches: ['Dua Lipa', 'Ariana Grande', 'Harry Styles']
  },
  { 
    name: 'Rock', 
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    searches: ['Queen', 'Guns N\' Roses', 'Nirvana']
  },
  { 
    name: 'Hip Hop', 
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    searches: ['Kendrick Lamar', 'J. Cole', 'Travis Scott']
  },
  { 
    name: 'Electronic', 
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    searches: ['Daft Punk', 'Calvin Harris', 'The Chainsmokers']
  },
  { 
    name: 'Latin', 
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    searches: ['Bad Bunny', 'J Balvin', 'Karol G']
  },
  { 
    name: 'R&B', 
    gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    searches: ['The Weeknd', 'SZA', 'Frank Ocean']
  },
  { 
    name: 'Indie', 
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    searches: ['Arctic Monkeys', 'Tame Impala', 'The 1975']
  },
  { 
    name: 'Reggaeton', 
    gradient: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
    searches: ['Daddy Yankee', 'Ozuna', 'Nicky Jam']
  }
])

const suggestedPlaylists = ref([
  {
    title: 'Top Hits 2024',
    description: 'Lo más escuchado del momento',
    query: 'Top hits 2024',
    color: '#ff2d55'
  },
  {
    title: 'Chill Vibes',
    description: 'Música relajante para estudiar',
    query: 'Chill music study',
    color: '#8e44ad'
  },
  {
    title: 'Workout Energy',
    description: 'Música para entrenar',
    query: 'Workout music gym',
    color: '#e74c3c'
  },
  {
    title: 'Música en Español',
    description: 'Los mejores éxitos latinos',
    query: 'Música en español 2024',
    color: '#f39c12'
  }
])

const greeting = computed(() => {
  const hour = currentTime.value
  if (hour < 12) return '¡Buenos días!'
  if (hour < 18) return '¡Buenas tardes!'
  return '¡Buenas noches!'
})

const recentFavorites = computed(() => {
  return playerStore.favorites.slice(0, 6)
})

const hasFavorites = computed(() => {
  return playerStore.favorites.length > 0
})

const searchMusic = (query) => {
  router.push({ path: '/search', query: { q: query } })
}

const playFavorite = (track, index) => {
  const favorites = playerStore.favorites
  playerStore.setQueue(favorites, index)
}

const quickPlayGenre = (genre) => {
  const randomSearch = genre.searches[Math.floor(Math.random() * genre.searches.length)]
  searchMusic(randomSearch)
}

onMounted(() => {
  setTimeout(() => {
    isLoading.value = false
  }, 300)
})
</script>

<template>
  <div class="home-view">
    <section v-if="hasFavorites" class="section">
      <div class="section-header">
        <h2 class="section-title">Escuchado recientemente</h2>
        <router-link to="/favorites" class="see-all-link">Ver todo</router-link>
      </div>

      <div class="horizontal-scroll">
        <div
          v-for="(track, index) in recentFavorites"
          :key="track.videoId"
          @click="playFavorite(track, index)"
          class="media-card"
        >
          <div class="card-image-wrapper">
            <img :src="track.thumbnail" :alt="track.title" />
            <div class="card-play-overlay">
              <Play :size="24" fill="currentColor" />
            </div>
          </div>
          <div class="card-info">
            <p class="card-title">{{ track.title }}</p>
            <p class="card-subtitle">{{ track.artist }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Playlists recomendadas</h2>
      </div>

      <div class="horizontal-scroll">
        <div
          v-for="playlist in suggestedPlaylists"
          :key="playlist.title"
          @click="searchMusic(playlist.query)"
          class="playlist-item"
        >
          <div class="playlist-sq" :style="{ background: `linear-gradient(135deg, ${playlist.color}, rgba(0,0,0,0.4))` }">
            <Music2 :size="40" />
          </div>
          <p class="item-title">{{ playlist.title }}</p>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Explorar por género</h2>
      </div>
      <div class="horizontal-scroll-lg">
        <div
          v-for="genre in genres"
          :key="genre.name"
          @click="quickPlayGenre(genre)"
          class="genre-chip"
          :style="{ background: genre.gradient }"
        >
          <span>{{ genre.name }}</span>
          <Music2 class="chip-icon" :size="40" />
        </div>
      </div>
    </section>

    <section class="section trending-section">
      <div class="section-header">
        <h2 class="section-title">
          <TrendingUp :size="24" class="section-icon" />
          Tendencias
        </h2>
      </div>

      <div class="trending-list">
        <div
          v-for="(search, index) in trendingSearches"
          :key="search.query"
          @click="searchMusic(search.query)"
          class="trending-item"
        >
          <div class="trending-number">{{ index + 1 }}</div>
          <component 
            :is="search.icon" 
            :size="20" 
            class="trending-icon"
            :style="{ color: search.color }"
          />
          <div class="trending-info">
            <p class="trending-query">{{ search.query }}</p>
            <p class="trending-label">Buscar artista</p>
          </div>
          <div class="trending-action">
            <Play :size="20" />
          </div>
        </div>
      </div>
    </section>

    <section v-if="!hasFavorites" class="section empty-favorites">
      <div class="empty-state">
        <div class="empty-icon">
          <Heart :size="64" />
        </div>
        <h3 class="empty-title">Aún no tienes favoritos</h3>
        <p class="empty-description">
          Marca tus canciones favoritas con ❤️ y aparecerán aquí
        </p>
        <button @click="router.push('/search')" class="cta-button">
          <Music2 :size="20" />
          Explorar Música
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-view {
  width: 100%;
  padding: 0.75rem 1rem 140px;
  max-width: 100%;
  margin: 0;
  box-sizing: border-box;
}

/* Media queries for fluid padding removed to keep edge-to-edge look */

/* Grid de contenido responsivo */
.horizontal-scroll {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

@media (max-width: 640px) {
  .horizontal-scroll {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

@media (min-width: 1920px) {
  .horizontal-scroll {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}

.media-card {
  width: 100%; /* Ajustar al grid */
  background: rgba(255, 255, 255, 0.03);
  padding: 14px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.media-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-5px);
  border-color: rgba(255, 255, 255, 0.1);
}

.card-image-wrapper {
  width: 100%;
  aspect-ratio: 1/1;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  margin-bottom: 12px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.3);
}

.card-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.media-card:hover .card-image-wrapper img {
  transform: scale(1.1);
}

/* Géneros en Grid */
.horizontal-scroll-lg {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

@media (max-width: 640px) {
  .horizontal-scroll-lg {
    grid-template-columns: repeat(2, 1fr);
  }
}

.genre-chip {
  width: 100%;
  height: 120px;
  border-radius: 16px;
  padding: 20px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.genre-chip:hover {
  transform: scale(1.03);
}

.genre-chip span {
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
  position: relative;  z-index: 2;
}

.chip-icon {
  position: absolute;
  right: -10px;
  bottom: -10px;
  transform: rotate(25deg);
  opacity: 0.3;
  z-index: 1;
}

/* Playlists en Grid */
.playlist-sq {
  width: 100%;
  aspect-ratio: 1/1;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
}

.playlist-item {
  width: 100%;
}

.item-title {
  font-weight: 600;
  font-size: 1rem;
  color: white;
  margin-top: 8px;
}

/* Secciones */
.section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 1.5rem; /* text-2xl */
  font-weight: 700;
  background: linear-gradient(to right, white, rgba(255, 255, 255, 0.6));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  line-height: 1.25;
}

@media (min-width: 768px) {
  .section-title {
    font-size: 1.875rem; /* text-3xl */
  }
}

.see-all-link {
  color: #ff2d55;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  transition: opacity 0.2s;
}

.see-all-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

/* Tendencias */
.trending-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.trending-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.trending-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.trending-number {
  font-size: 1.25rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.2);
  min-width: 24px;
}

.trending-info {
  flex: 1;
}

.trending-query {
  font-weight: 600;
  color: white;
  margin: 0;
}

.trending-label {
  font-size: 0.85rem;
  color: #b3b3b3;
  margin: 0;
}

.trending-action {
  color: #ff2d55;
  opacity: 0;
  transition: opacity 0.2s;
}

.trending-item:hover .trending-action {
  opacity: 1;
}

/* Empty State */
.empty-favorites {
  margin-top: 80px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  max-width: 480px;
  margin: 0 auto;
}

.empty-icon {
  width: 120px;
  height: 120px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 45, 85, 0.1);
  border-radius: 50%;
  color: #ff2d55;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 12px 0;
}

.empty-description {
  font-size: 1rem;
  color: #b3b3b3;
  margin: 0 0 32px 0;
  line-height: 1.5;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 32px;
  background: #ff2d55;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(255, 45, 85, 0.3);
}

.cta-button:hover {
  background: #ff375f;
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(255, 45, 85, 0.4);
}

/* Responsive */
@media (max-width: 640px) {
  .home-view {
    padding: 0.5rem 0.5rem 120px;
  }
  
  .greeting {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }



  .quick-actions {
    grid-template-columns: 1fr;
  }

  .favorites-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .playlists-grid {
    grid-template-columns: 1fr;
  }

  .genres-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .trending-number {
    font-size: 1rem;
    min-width: 24px;
  }
}

@media (min-width: 1024px) {
  .favorites-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }

  .genres-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

@media (min-width: 1280px) {
  .quick-actions {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>