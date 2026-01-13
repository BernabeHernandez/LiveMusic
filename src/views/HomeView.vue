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
    color: '#1db954'
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
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="greeting">{{ greeting }}</h1>
        <p class="hero-subtitle">¿Qué quieres escuchar hoy?</p>
      </div>
      
      <div class="quick-actions">
        <div 
          v-for="search in trendingSearches.slice(0, 4)" 
          :key="search.query"
          @click="searchMusic(search.query)"
          class="quick-action-card"
        >
          <component 
            :is="search.icon" 
            :size="24" 
            :style="{ color: search.color }"
          />
          <span>{{ search.query }}</span>
        </div>
      </div>
    </section>

    <section v-if="hasFavorites" class="section favorites-section">
      <div class="section-header">
        <h2 class="section-title">
          <Heart :size="24" class="section-icon" />
          Tus Favoritos
        </h2>
        <router-link to="/favorites" class="see-all-link">
          Ver todos
        </router-link>
      </div>

      <div class="favorites-grid">
        <div
          v-for="(track, index) in recentFavorites"
          :key="track.videoId"
          @click="playFavorite(track, index)"
          class="favorite-card"
          :class="{ 'is-playing': playerStore.currentTrack?.videoId === track.videoId }"
        >
          <div class="favorite-thumbnail">
            <img :src="track.thumbnail" :alt="track.title" />
            <div class="play-overlay">
              <div class="play-button-large">
                <Play :size="28" fill="currentColor" />
              </div>
            </div>
          </div>
          <div class="favorite-info">
            <p class="favorite-title">{{ track.title }}</p>
            <p class="favorite-artist">{{ track.artist }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section playlists-section">
      <div class="section-header">
        <h2 class="section-title">
          <Sparkles :size="24" class="section-icon" />
          Playlists Recomendadas
        </h2>
      </div>

      <div class="playlists-grid">
        <div
          v-for="playlist in suggestedPlaylists"
          :key="playlist.title"
          @click="searchMusic(playlist.query)"
          class="playlist-card"
        >
          <div class="playlist-cover" :style="{ background: playlist.color }">
            <Music2 :size="48" class="playlist-icon" />
          </div>
          <div class="playlist-info">
            <p class="playlist-title">{{ playlist.title }}</p>
            <p class="playlist-description">{{ playlist.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section genres-section">
      <div class="section-header">
        <h2 class="section-title">
          <Music2 :size="24" class="section-icon" />
          Explorar por Género
        </h2>
      </div>

      <div class="genres-grid">
        <div
          v-for="genre in genres"
          :key="genre.name"
          @click="quickPlayGenre(genre)"
          class="genre-card"
          :style="{ background: genre.gradient }"
        >
          <h3 class="genre-name">{{ genre.name }}</h3>
          <div class="genre-icon-bg">
            <Music2 :size="64" class="genre-icon" />
          </div>
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
  padding-bottom: 40px;
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-section {
  margin-bottom: 48px;
}

.hero-content {
  margin-bottom: 32px;
}

.greeting {
  font-size: 3rem;
  font-weight: 800;
  margin: 0 0 12px 0;
  background: linear-gradient(135deg, #1db954 0%, #1ed760 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
  animation: slideDown 0.6s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-subtitle {
  font-size: 1.25rem;
  color: #b3b3b3;
  margin: 0;
  animation: slideDown 0.6s ease-out 0.1s backwards;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  animation: slideUp 0.6s ease-out 0.2s backwards;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.quick-action-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.quick-action-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.1);
}

.quick-action-card span {
  font-weight: 600;
  font-size: 0.95rem;
}

/* Section Styles */
.section {
  margin-bottom: 48px;
  animation: fadeIn 0.6s ease-out;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  letter-spacing: -0.01em;
}

.section-icon {
  color: #1db954;
}

.see-all-link {
  color: #b3b3b3;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  transition: color 0.2s;
}

.see-all-link:hover {
  color: #1db954;
}

/* Favorites Grid */
.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}

.favorite-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
}

.favorite-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.1);
}

.favorite-card.is-playing {
  background: rgba(29, 185, 84, 0.15);
  border-color: #1db954;
}

.favorite-thumbnail {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.favorite-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.favorite-card:hover .favorite-thumbnail img {
  transform: scale(1.05);
}

.play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.favorite-card:hover .play-overlay {
  opacity: 1;
}

.play-button-large {
  width: 56px;
  height: 56px;
  background: #1db954;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  box-shadow: 0 8px 24px rgba(29, 185, 84, 0.4);
  transition: transform 0.2s;
}

.play-button-large:hover {
  transform: scale(1.1);
}

.favorite-info {
  padding: 0 4px;
}

.favorite-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-artist {
  font-size: 0.85rem;
  color: #b3b3b3;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Playlists Grid */
.playlists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.playlist-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.playlist-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.1);
}

.playlist-cover {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.playlist-icon {
  color: rgba(255, 255, 255, 0.9);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.playlist-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 4px 0;
}

.playlist-description {
  font-size: 0.85rem;
  color: #b3b3b3;
  margin: 0;
  line-height: 1.4;
}

/* Genres Grid */
.genres-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.genre-card {
  position: relative;
  height: 140px;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.genre-card:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.genre-name {
  font-size: 1.25rem;
  font-weight: 800;
  margin: 0;
  position: relative;
  z-index: 2;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.genre-icon-bg {
  position: absolute;
  bottom: -10px;
  right: -10px;
  opacity: 0.3;
  transform: rotate(-15deg);
}

.genre-icon {
  color: rgba(255, 255, 255, 0.8);
}

/* Trending List */
.trending-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trending-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.trending-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.1);
}

.trending-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: #b3b3b3;
  min-width: 32px;
}

.trending-icon {
  flex-shrink: 0;
}

.trending-info {
  flex: 1;
  min-width: 0;
}

.trending-query {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 2px 0;
}

.trending-label {
  font-size: 0.8rem;
  color: #b3b3b3;
  margin: 0;
}

.trending-action {
  color: #1db954;
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
  background: rgba(29, 185, 84, 0.1);
  border-radius: 50%;
  color: #1db954;
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
  background: #1db954;
  color: #000;
  border: none;
  border-radius: 24px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 16px rgba(29, 185, 84, 0.3);
}

.cta-button:hover {
  background: #1ed760;
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(29, 185, 84, 0.4);
}

/* Responsive */
@media (max-width: 640px) {
  .greeting {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .section-title {
    font-size: 1.35rem;
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