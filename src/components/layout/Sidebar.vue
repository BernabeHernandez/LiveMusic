<script setup>
import { X } from 'lucide-vue-next'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const closeSidebar = () => {
  emit('close')
}
</script>

<template>
  <!-- Overlay para cerrar sidebar al hacer click fuera -->
  <div 
    v-if="isOpen" 
    class="sidebar-overlay"
    @click="closeSidebar"
  ></div>

  <aside class="sidebar" :class="{ 'sidebar-open': isOpen }">
    <!-- Botón de cerrar solo visible en móviles -->
    <div class="sidebar-header">
      <h2 class="sidebar-title">Menú</h2>
      <button 
        @click="closeSidebar"
        class="close-btn"
        aria-label="Cerrar menú"
      >
        <X :size="24" />
      </button>
    </div>

    <nav class="sidebar-nav">
      <router-link to="/" class="nav-item" @click="closeSidebar">
        <span>Home</span>
      </router-link>
      <router-link to="/favorites" class="nav-item" @click="closeSidebar">
        <span>Favoritos</span>
      </router-link>
      <router-link to="/playlists" class="nav-item" @click="closeSidebar">
        <span>Playlists</span>
      </router-link>
    </nav>
  </aside>
</template>

<style scoped>
/* Overlay para móviles */
.sidebar-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
  backdrop-filter: blur(2px);
}

.sidebar {
  background: #000;
  padding: 1.5rem 1rem;
  overflow-y: auto;
  position: relative;
  transition: transform 0.3s ease;
}

/* Header del sidebar con botón de cerrar */
.sidebar-header {
  display: none;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0 0.5rem;
}

.sidebar-title {
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
}

.close-btn {
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

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.close-btn:active {
  background: rgba(255, 255, 255, 0.15);
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.8rem 1rem;
  color: #b3b3b3;
  text-decoration: none;
  border-radius: 8px;
  margin: 0.3rem 0;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.nav-item:hover,
.nav-item.router-link-active {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

/* Estilos responsivos para móviles */
@media (max-width: 767px) {
  .sidebar-overlay.sidebar-open {
    display: block;
  }
  
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 280px;
    max-width: 80vw;
    z-index: 999;
    transform: translateX(-100%);
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
  }

  .sidebar.sidebar-open {
    transform: translateX(0);
  }

  .sidebar-overlay {
    display: block;
  }

  .sidebar-header {
    display: flex;
  }
}

/* Tablets y desktop - comportamiento normal */
@media (min-width: 768px) {
  .sidebar {
    position: relative;
    transform: none !important;
  }

  .sidebar-header {
    display: none;
  }

  .sidebar-overlay {
    display: none !important;
  }
}
</style>
