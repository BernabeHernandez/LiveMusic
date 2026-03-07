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
    <!-- Hero Section: Featured Cards -->
    <section class="hero-section">
      <div class="hero-carousel">
        <div class="featured-card main">
          <div class="featured-tag">ESTRENO</div>
          <h1 class="featured-title">{{ greeting }}</h1>
          <p class="featured-subtitle">Descubre música que te encantará</p>
          <button class="featured-play-btn" @click="searchMusic('Lo más nuevo')">
            Escuchar ahora
          </button>
        </div>
        
        <div class="featured-card secondary" @click="searchMusic('Chill')">
          <div class="featured-tag">RELAX</div>
          <h3 class="featured-title-sm">Vibras de Tarde</h3>
          <p class="featured-subtitle-sm">Perfecto para desconectar</p>
        </div>
      </div>

      <div class="quick-pills">
        <div 
          v-for="search in trendingSearches.slice(0, 6)" 
          :key="search.query"
          @click="searchMusic(search.query)"
          class="nav-pill"
        >
          <component :is="search.icon" :size="16" />
          <span>{{ search.query }}</span>
        </div>
      </div>
    </section>

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
  padding: 1rem 1.5rem 120px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Hero Carousel */
.hero-carousel {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  overflow-x: auto;
  padding: 10px 0;
  scrollbar-width: none;
  align-items: flex-start;
}

.hero-carousel::-webkit-scrollbar { display: none; }

.featured-card {
  flex-shrink: 0;
  border-radius: 20px;
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.featured-card:hover { transform: scale(1.01); }

.featured-card.main {
  width: 100%;
  aspect-ratio: 24/5;
  background: linear-gradient(135deg, rgba(255, 45, 85, 0.2) 0%, rgba(255, 45, 85, 0.8) 100%);
  box-shadow: 0 10px 40px rgba(255, 45, 85, 0.2);
  align-self: flex-start;
}

.featured-card.secondary {
  width: 300px;
  aspect-ratio: 1;
  background: linear-gradient(135deg, rgba(88, 86, 214, 0.2) 0%, rgba(88, 86, 214, 0.8) 100%);
  box-shadow: 0 10px 40px rgba(88, 86, 214, 0.2);
}

.featured-tag {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
}

.featured-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.04em;
}

.featured-title-sm {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.featured-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 16px;
}

.featured-play-btn {
  width: fit-content;
  background: white;
  color: black;
  border: none;
  padding: 10px 24px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.9rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* Quick Pills */
.quick-pills {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 5px 0 20px;
  scrollbar-width: none;
}

.quick-pills::-webkit-scrollbar { display: none; }

.nav-pill {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.nav-pill:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

/* Horizontal Scroll Layouts */
.horizontal-scroll {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding: 5px 0 15px;
  margin-right: -1.5rem;
  scrollbar-width: none;
}

.horizontal-scroll::-webkit-scrollbar { display: none; }

.media-card {
  width: 180px;
  flex-shrink: 0;
  cursor: pointer;
}

.card-image-wrapper {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  margin-bottom: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.card-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.media-card:hover img { transform: scale(1.05); }

.card-play-overlay {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  background: white;
  color: black;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.media-card:hover .card-play-overlay {
  opacity: 1;
  transform: translateY(0);
}

.card-info { padding: 0 2px; }

.card-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-subtitle {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.playlist-item {
  width: 220px;
  flex-shrink: 0;
  cursor: pointer;
}

.playlist-sq {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.item-title { font-weight: 700; margin: 0; font-size: 1rem; }
.item-subtitle { color: #ff2d55; margin: 0; font-size: 0.85rem; font-weight: 600; }

.horizontal-scroll-lg {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 5px 0 15px;
  scrollbar-width: none;
}

.horizontal-scroll-lg::-webkit-scrollbar { display: none; }

.genre-chip {
  flex-shrink: 0;
  width: 200px;
  height: 110px;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.genre-chip:hover { transform: scale(1.02); }

.genre-chip span {
  font-size: 1.25rem;
  font-weight: 800;
  color: white;
  z-index: 1;
}

.chip-icon {
  position: absolute;
  bottom: -5px;
  right: -5px;
  opacity: 0.2;
  transform: rotate(-15deg);
}

/* Sections */
.section { margin-bottom: 40px; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
  padding: 0 2px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.02em;
}

.see-all-link {
  color: #ff2d55;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .featured-card.main { aspect-ratio: 16/5; padding: 12px 16px; }
  .featured-card.secondary { display: none; }
  .featured-title { font-size: 1.25rem; margin-bottom: 8px; }
  .featured-subtitle { display: none; }
  .featured-play-btn { padding: 4px 12px; font-size: 0.75rem; }
  .home-view { padding: 1rem 1rem 120px; }
  .hero-carousel { margin-bottom: 12px; }
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