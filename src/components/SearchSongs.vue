<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { usePlayerStore } from '../stores/player'

const query = ref('')
const results = ref([])
const playerStore = usePlayerStore()
const isLoading = ref(false)
const errorMessage = ref('')
const maxResults = ref(50)

const search = async (append = false) => {
  if (!query.value.trim()) return;
  
  isLoading.value = true;
  if (!append) {
    results.value = [];
  }
  errorMessage.value = '';
  
  try {
    const url = `http://localhost:3000/api/search?q=${encodeURIComponent(query.value)}&maxResults=${maxResults.value}`;
    
    console.log("Buscando:", query.value);

    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    const items = data.items || data;
    
    if (append) {
      results.value = [...results.value, ...items];
    } else {
      results.value = Array.isArray(items) ? items : [];
    }
    
    console.log(" Resultados encontrados:", results.value.length);
    
    if (results.value.length === 0) {
      errorMessage.value = 'No se encontraron resultados';
    }
    
  } catch (error) {
    console.error(" Error:", error);
    errorMessage.value = error.message;
  }
  
  isLoading.value = false;
}

const playTrack = (item) => {
  const videoId = item.videoId || (item.url.includes('?v=') 
    ? item.url.split('?v=')[1].split('&')[0]
    : item.url.split('/').pop());
  
  console.log("Reproduciendo:", videoId);
  
  playerStore.playTrack(videoId, {
    title: item.title,
    artist: item.artist,
    thumbnail: item.thumbnail
  });
}

const handleScroll = () => {
  const scrollPosition = window.innerHeight + window.scrollY;
  const threshold = document.documentElement.scrollHeight - 500;
  
  if (scrollPosition >= threshold && !isLoading.value && results.value.length > 0) {
    maxResults.value += 20;
    search(true);
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
})
</script>

<template>
  <div class="search-container">
    <div class="search-box">
      <input 
        v-model="query" 
        @keyup.enter="search()" 
        placeholder="Buscar música..."
      />
      <button @click="search()" :disabled="isLoading">
        {{ isLoading ? 'Buscando...' : 'Buscar' }}
      </button>
    </div>

    <div v-if="isLoading && results.length === 0" class="loading">
       Buscando resultados...
      <p class="loading-hint">Esto puede tardar unos segundos</p>
    </div>

    <div v-if="errorMessage" class="error-message">
       {{ errorMessage }}
      <p>Intenta buscar otra cosa o espera unos minutos</p>
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
          @error="(e) => e.target.src = 'https://via.placeholder.com/60/1e1e1e/fff?text=🎵'"
          alt="Portada" 
          class="thumbnail"
        />
        <div class="info">
          <p class="title">{{ item.title }}</p>
          <p class="artist">{{ item.uploaderName }}</p>
          <p class="duration" v-if="item.duration">
            {{ Math.floor(item.duration / 60) }}:{{ String(item.duration % 60).padStart(2, '0') }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="isLoading && results.length > 0" class="loading-more">
      Cargando más resultados...
    </div>

    <div v-if="!isLoading && results.length === 0 && query && !errorMessage" class="no-results">
       "{{ query }}"
    </div>
  </div>
</template>

<style scoped>
.search-container { max-width: 800px; margin: 0 auto; }
.search-box { display: flex; gap: 10px; margin-bottom: 20px; }
.song-card { 
  display: flex; 
  align-items: center; 
  gap: 15px; 
  background: #1e1e1e; 
  padding: 12px; 
  border-radius: 8px; 
  margin-bottom: 10px; 
  cursor: pointer; 
  transition: all 0.2s;
  border: 2px solid transparent;
}
.song-card:hover { 
  background: #2a2a2a; 
  border-color: #1db954;
  transform: translateX(5px);
}
.thumbnail { 
  width: 60px; 
  height: 60px; 
  border-radius: 6px; 
  object-fit: cover;
  flex-shrink: 0;
}
.info { flex: 1; min-width: 0; }
.title { 
  margin: 0 0 5px 0; 
  font-weight: bold; 
  color: white; 
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.artist { 
  margin: 0 0 3px 0; 
  color: #b3b3b3; 
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.duration { 
  margin: 0; 
  color: #888; 
  font-size: 12px; 
  font-weight: 500;
}
input { 
  flex: 1; 
  padding: 12px 16px; 
  background: #222; 
  border: 2px solid #333; 
  color: white; 
  border-radius: 8px;
  font-size: 15px;
  transition: border-color 0.2s;
}
input:focus {
  outline: none;
  border-color: #1db954;
}
button { 
  background: #1db954; 
  color: white; 
  border: none; 
  padding: 12px 24px; 
  border-radius: 8px; 
  cursor: pointer; 
  font-weight: bold;
  font-size: 15px;
  transition: all 0.2s;
}
button:hover:not(:disabled) { 
  background: #1ed760;
  transform: scale(1.05);
}
button:disabled { 
  opacity: 0.5; 
  cursor: not-allowed;
  transform: none;
}
.loading, .loading-more { 
  text-align: center; 
  padding: 40px 20px; 
  color: #888;
  font-size: 16px;
}
.loading-hint {
  font-size: 12px;
  color: #666;
  margin-top: 10px;
}
.error-message {
  text-align: center;
  padding: 20px;
  background: #ff4444;
  color: white;
  border-radius: 8px;
  margin-bottom: 20px;
}
.error-message p {
  margin-top: 10px;
  font-size: 14px;
  opacity: 0.9;
}
.no-results { 
  text-align: center; 
  padding: 40px 20px; 
  color: #888;
  font-size: 16px;
}
</style>