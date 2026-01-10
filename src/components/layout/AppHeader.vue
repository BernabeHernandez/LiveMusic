<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const query = ref('')

const goSearch = () => {
  if (!query.value.trim()) return

  router.push({
    name: 'search',
    query: { q: query.value }
  })
}
</script>

<template>
  <header class="app-header">
    <div class="logo">LiveMusic</div>

    <nav class="header-nav">
      <input
        v-model="query"
        @keyup.enter="goSearch"
        placeholder="Buscar música..."
        class="search-input"
      />

      <router-link to="/library">Tu biblioteca</router-link>
    </nav>
  </header>
</template>

<style scoped>
.app-header {
  height: 70px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  font-size: 1.6rem;
  font-weight: bold;
}

.header-nav {
  display: flex;
  align-items: center;
}

.header-nav a {
  color: white;
  text-decoration: none;
  margin-left: 2rem;
  opacity: 0.8;
}

.header-nav a.router-link-active {
  opacity: 1;
  font-weight: bold;
}

.search-input {
  margin-left: 2rem;
  padding: 8px 14px;
  border-radius: 20px;
  border: none;
  outline: none;
  background: rgba(255,255,255,0.15);
  color: white;
  width: 220px;
}

.search-input::placeholder {
  color: rgba(255,255,255,0.7);
}
</style>
