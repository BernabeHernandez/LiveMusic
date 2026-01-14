<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Menu, Search, X } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()

const emit = defineEmits(['toggle-sidebar'])

const searchQuery = ref('')
const isFocused = ref(false)

const STORAGE_KEY = 'music_search_state'

const loadLastSearch = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return

    const state = JSON.parse(saved)
    const isRecent = Date.now() - state.timestamp < 24 * 60 * 60 * 1000

    if (isRecent && state.query) {
      searchQuery.value = state.query
    }
  } catch (err) {
    console.error('Error cargando búsqueda:', err)
  }
}

const saveSearch = () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      query: searchQuery.value,
      timestamp: Date.now()
    })
  )
}

watch(
  () => route.query.q,
  (newQuery) => {
    if (newQuery && newQuery !== searchQuery.value) {
      searchQuery.value = newQuery
    }
  },
  { immediate: true }
)

const handleSearch = () => {
  if (!searchQuery.value.trim()) return

  saveSearch()

  router.push({
    path: '/search',
    query: { q: searchQuery.value.trim() }
  })
}

const handleFocus = () => {
  isFocused.value = true

  if (searchQuery.value && route.path !== '/search') {
    router.push({
      path: '/search',
      query: { q: searchQuery.value }
    })
  }
}

const handleBlur = () => {
  isFocused.value = false
}

const clearSearch = () => {
  searchQuery.value = ''
  localStorage.removeItem(STORAGE_KEY)

  if (route.path === '/search') {
    router.push('/')
  }
}

const toggleSidebar = () => {
  emit('toggle-sidebar')
}

onMounted(loadLastSearch)
</script>

<template>
  <header class="app-header">
    <button
      @click="toggleSidebar"
      class="hamburger-btn"
      aria-label="Toggle menu"
    >
      <Menu :size="24" />
    </button>

    <div class="logo">LiveMusic</div>

    <nav class="header-nav">
      <div class="search-wrapper">
        <Search class="search-icon" :size="18" />

        <input
          v-model="searchQuery"
          class="search-input"
          placeholder="Buscar música..."
          @keyup.enter="handleSearch"
          @focus="handleFocus"
          @blur="handleBlur"
        />

        <button
          v-if="searchQuery"
          class="clear-btn"
          @click="clearSearch"
          aria-label="Limpiar búsqueda"
        >
          <X :size="16" />
        </button>
      </div>

      <router-link to="/library" class="library-link">
        Tu biblioteca
      </router-link>
    </nav>
  </header>
</template>

<style scoped>
.app-header {
  height: 70px;
  background: #000;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.hamburger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
}

.hamburger-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.logo {
  font-size: 1.4rem;
  font-weight: bold;
  color: white;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  justify-content: flex-end;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: rgba(255,255,255,0.6);
}

.search-input {
  padding: 12px 40px 12px 38px;
  border-radius: 999px;
  border: none;
  outline: none;
  background: rgba(255,255,255,0.15);
  color: white;
  font-size: 1rem;
  width: 220px;
}

.search-input::placeholder {
  color: rgba(255,255,255,0.7);
}

.clear-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.7);
  cursor: pointer;
}

.library-link {
  color: white;
  text-decoration: none;
  opacity: 0.8;
}

.library-link.router-link-active {
  opacity: 1;
  font-weight: bold;
}

@media (min-width: 768px) {
  .hamburger-btn {
    display: none;
  }

  .search-input {
    width: 260px;
  }
}

@media (max-width: 479px) {
  .library-link {
    display: none;
  }
}
</style>
