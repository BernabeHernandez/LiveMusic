<template>
  <div class="app-layout">
    <AppHeader @toggle-sidebar="toggleSidebar" />

    <div class="main-container">
      <Sidebar 
        class="sidebar" 
        :isOpen="isSidebarOpen"
        @close="closeSidebar"
      />

      <main class="content-area">
        <router-view />
      </main>
    </div>

    <MusicPlayer class="music-player" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePlayerStore } from './stores/player'
import AppHeader from './components/layout/AppHeader.vue'
import Sidebar from './components/layout/Sidebar.vue'
import MusicPlayer from './components/Music/MusicPlayer.vue'

const playerStore = usePlayerStore()
const isSidebarOpen = ref(false)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}

onMounted(() => {
  playerStore.initStore()
  console.log('Favoritos cargados:', playerStore.favoritesCount)
})
</script>

<style scoped>
.app-layout {
  height: 100dvh;
  min-height: -webkit-fill-available;
  display: flex;
  flex-direction: column;
  background: #121212;
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
  position: relative;
}

.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.sidebar {
  display: none;
  width: 240px;
  flex-shrink: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding: 0.75rem;
  background: linear-gradient(to bottom, #121212, #0f0f0f);
  padding-bottom: 110px;
}

.music-player {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: auto;
  max-height: 100px;
  min-height: 70px;
  flex-shrink: 0;
  z-index: 50;
  background: #181818;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

@media (min-width: 320px) and (max-width: 479px) {
  .content-area {
    padding: 0.5rem 0.75rem;
    padding-bottom: 100px;
  }
}

@media (min-width: 480px) and (max-width: 767px) {
  .content-area {
    padding: 0.75rem 1rem;
    padding-bottom: 105px;
  }
}

@media (min-width: 768px) {
  .sidebar {
    display: block;
    width: 200px;
  }

  .content-area {
    padding: 1rem 1.25rem;
    padding-bottom: 110px;
  }

  .music-player {
    left: 200px;
  }
}

@media (min-width: 1024px) {
  .sidebar {
    width: 240px;
  }

  .content-area {
    padding: 1.25rem 1.5rem;
    padding-bottom: 110px;
  }

  .music-player {
    left: 240px;
  }
}

@media (min-width: 1280px) {
  .sidebar {
    width: 260px;
  }

  .content-area {
    padding: 1.5rem 2rem;
    padding-bottom: 110px;
  }

  .music-player {
    left: 260px;
  }
}

@media (min-width: 1536px) {
  .sidebar {
    width: 280px;
  }

  .content-area {
    padding: 2rem 3rem;
    padding-bottom: 120px;
  }

  .music-player {
    left: 280px;
  }
}

@supports (-webkit-touch-callout: none) {
  .app-layout {
    height: -webkit-fill-available;
  }
}

.content-area::-webkit-scrollbar {
  width: 8px;
}

.content-area::-webkit-scrollbar-track {
  background: transparent;
}

.content-area::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.content-area::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

@media (max-width: 767px) {
  .content-area {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  }
}
</style>