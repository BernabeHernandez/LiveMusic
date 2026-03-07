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
    <div class="header-top">
      <div class="header-left">
        <button
          @click="toggleSidebar"
          class="hamburger-btn"
          aria-label="Toggle menu"
        >
          <Menu :size="24" />
        </button>

        <router-link to="/" class="logo">LiveMusic</router-link>
      </div>

      <div class="header-right">
        <router-link to="/library" class="library-link">
          Tu biblioteca
        </router-link>
      </div>
    </div>

    <div class="header-center">
      <div class="search-wrapper" :class="{ 'is-focused': isFocused }">
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
          @mousedown.prevent
          aria-label="Limpiar búsqueda"
        >
          <X :size="16" />
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0.75rem 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  height: auto;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 44px;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
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
  transition: background 0.2s;
  flex-shrink: 0;
}

.hamburger-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.logo {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
}

.logo:hover {
  color: #1db954;
}

.header-center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 0;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.search-wrapper:hover {
  background: rgba(255, 255, 255, 0.12);
}

.search-wrapper.is-focused {
  background: rgba(255, 255, 255, 0.15);
  border-color: #ff2d55;
  box-shadow: 0 0 0 4px rgba(255, 45, 85, 0.1);
}

.search-icon {
  position: absolute;
  left: 14px;
  color: rgba(255, 255, 255, 0.6);
  pointer-events: none;
  transition: color 0.2s;
}

.search-wrapper.is-focused .search-icon {
  color: #ff2d55;
}

.search-input {
  padding: 10px 40px 10px 42px;
  border-radius: 24px;
  border: none;
  outline: none;
  background: transparent;
  color: white;
  font-size: 16px;
  width: 100%;
  font-family: inherit;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.clear-btn {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.clear-btn:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
}

.library-link {
  color: white;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  opacity: 0.8;
  transition: opacity 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.library-link:hover {
  opacity: 1;
}

.library-link.router-link-active {
  opacity: 1;
  color: #ff2d55;
  font-weight: 600;
}

@media (max-width: 767px) {
  .app-header {
    padding: 0.5rem 1rem 0.75rem;
    gap: 0.75rem;
  }

  .header-center {
    width: 100%;
    margin-top: 0.25rem;
  }

  .search-wrapper {
    max-width: 100%;
    height: 40px;
    background: rgba(255, 255, 255, 0.08);
  }

  .header-right {
    display: none;
  }
}

@media (min-width: 768px) {
  .app-header {
    height: 72px;
    flex-direction: row;
    justify-content: space-between;
    padding: 0 2rem;
  }

  .header-top {
    width: auto;
    height: 100%;
    gap: 1.5rem;
  }

  .logo {
    font-size: 1.4rem;
  }

  .search-wrapper {
    max-width: 360px;
  }

  .search-input {
    font-size: 0.95rem;
  }

  .library-link {
    font-size: 0.95rem;
  }
}

@media (min-width: 1024px) {
  .app-header {
    grid-template-columns: 220px 1fr 180px;
    padding: 0 2rem;
  }

  .search-wrapper {
    max-width: 400px;
  }
}
@media (min-width: 1280px) {
  .app-header {
    grid-template-columns: 240px 1fr 200px;
    padding: 0 2.5rem;
  }

  .logo {
    font-size: 1.5rem;
  }

  .search-wrapper {
    max-width: 480px;
  }

  .search-input {
    font-size: 1rem;
  }

  .library-link {
    font-size: 1rem;
  }
}

@media (min-width: 1920px) {
  .app-header {
    grid-template-columns: 280px 1fr 240px;
    padding: 0 3rem;
  }

  .search-wrapper {
    max-width: 560px;
  }
}
</style>