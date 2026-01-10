<!-- src/App.vue -->
<template>
  <div class="app-layout">
    <AppHeader />

    <div class="main-container">
      <Sidebar class="sidebar" />

      <main class="content-area">
        <router-view />
      </main>
    </div>

    <MusicPlayer class="music-player" />
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
  min-height: -webkit-fill-available; /* Mejora compatibilidad iOS */
  display: grid;
  grid-template-rows: auto 1fr auto;
  background: #121212;
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
}

.main-container {
  display: grid;
  grid-template-columns: 240px 1fr;
  overflow: hidden;
}

.content-area {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* Mejor scroll en iOS */
  padding: 1.5rem 2rem;
  background: linear-gradient(to bottom, #121212, #0f0f0f);
}

/* Mobile-first adjustments */
@media (max-width: 1024px) {
  .main-container {
    grid-template-columns: 220px 1fr;
  }
}

@media (max-width: 768px) {
  .main-container {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none; /* Ocultamos sidebar en móvil */
  }

  .content-area {
    padding: 1rem 1.2rem;
  }
}

/* Muy pequeños (ej: iPhone SE, móviles antiguos) */
@media (max-width: 480px) {
  .content-area {
    padding: 0.8rem 1rem;
  }
}

/* Music Player - muy importante en móvil */
.music-player {
  grid-row: 3;
  /* Añade estas líneas si tu MusicPlayer no las tiene ya */
  width: 100%;
  max-height: 90px;           /* ← ajusta según tu diseño */
  min-height: 70px;
  flex-shrink: 0;
}

/* Evitar que el contenido quede tapado por el player en móvil */
.content-area {
  padding-bottom: 80px; /* espacio base */
}

@media (max-width: 768px) {
  .content-area {
    padding-bottom: 100px; /* más espacio en móvil por el player */
  }
}

/* Opcional: fondo más oscuro y contraste en móviles */
@media (max-width: 768px) {
  .app-layout {
    background: #0a0a0a;
  }
}
</style>