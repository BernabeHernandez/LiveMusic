<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Menu } from 'lucide-vue-next'

const router = useRouter()
const query = ref('')

const emit = defineEmits(['toggle-sidebar'])

const goSearch = () => {
  if (!query.value.trim()) return

  router.push({
    name: 'search',
    query: { q: query.value }
  })
}

const toggleSidebar = () => {
  emit('toggle-sidebar')
}
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
      <input
        v-model="query"
        @keyup.enter="goSearch"
        placeholder="Buscar música..."
        class="search-input"
      />

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
  transition: background 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.hamburger-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.logo {
  font-size: 1.4rem;
  font-weight: bold;
  flex-shrink: 0;
  color: white;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  justify-content: flex-end;
  min-width: 0; 
}

.header-nav a {
  color: white;
  text-decoration: none;
  opacity: 0.8;
  white-space: nowrap;
}

.header-nav a.router-link-active {
  opacity: 1;
  font-weight: bold;
}

.search-input {
  width: 100%;
  max-width: 100%;
  padding: 12px 18px;
  border-radius: 999px;
  border: none;
  outline: none;
  background: rgba(255,255,255,0.15);
  color: white;
  font-size: 1rem;
}

.search-input::placeholder {
  color: rgba(255,255,255,0.7);
}

@media (min-width: 768px) {
  .app-header {
    padding: 0 2rem;
  }

  .hamburger-btn {
    display: none;
  }

  .logo {
    font-size: 1.6rem;
  }

  .search-input {
    width: 260px;
  }

  .header-nav {
    gap: 2rem;
  }
}

@media (max-width: 479px) {
  .app-header {
    padding: 0 0.75rem;
  }

  .logo {
    font-size: 1.2rem;
  }

  .library-link {
    display: none;
  }
}
</style>
