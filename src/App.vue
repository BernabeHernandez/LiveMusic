<!-- src/App.vue -->
<template>
  <div class="app-layout">
    <AppHeader />

    <div class="main-container">
      <Sidebar />

      <main class="content-area">
        <router-view />
      </main>
    </div>

    <MusicPlayer />
  </div>
</template>

<script setup>
import AppHeader from './components/layout/AppHeader.vue'
import Sidebar from './components/layout/Sidebar.vue'
import MusicPlayer from './components/Music/MusicPlayer.vue'

</script>

<style scoped>
.app-layout {
  height: 100dvh;          
  display: grid;
  grid-template-rows: auto 1fr auto;  
  background: #121212;
  color: white;
  font-family: -apple-system, BlinkMacOSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.main-container {
  display: grid;
  grid-template-columns: 240px 1fr;    
  overflow: hidden;
}

.content-area {
  overflow-y: auto;
  padding: 1.5rem 2rem;
  background: linear-gradient(to bottom, #121212, #0f0f0f);
}

MusicPlayer {
  grid-row: 3;
}

@media (max-width: 768px) {
  .main-container {
    grid-template-columns: 1fr;          
  }
  
  .sidebar {
    display: none;                       
  }
  
  .content-area {
    padding: 1rem;
  }
}
</style>