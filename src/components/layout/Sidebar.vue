<script setup>
import { X, DownloadCloud, LogOut, Home, Heart, ListMusic, Activity } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
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
  <div 
    class="sidebar-overlay"
    :class="{ 'sidebar-open': isOpen }"
    @click="closeSidebar"
  ></div>

  <aside class="sidebar" :class="{ 'sidebar-open': isOpen }">
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
        <Home :size="20" class="mr-3" />
        <span>Escuchar ahora</span>
      </router-link>
      <router-link to="/favorites" class="nav-item" @click="closeSidebar">
        <Heart :size="20" class="mr-3" />
        <span>Favoritos</span>
      </router-link>
      <router-link to="/playlists" class="nav-item" @click="closeSidebar">
        <ListMusic :size="20" class="mr-3" />
        <span>Playlists</span>
      </router-link>
      <router-link to="/downloads" class="nav-item" @click="closeSidebar">
        <DownloadCloud :size="20" class="mr-3" />
        <span>Descargas</span>
      </router-link>
      <router-link to="/data-usage" class="nav-item" @click="closeSidebar">
        <Activity :size="20" class="mr-3" />
        <span>Uso de Datos</span>
      </router-link>
    </nav>

    <div class="sidebar-footer" v-if="authStore.isAuthenticated()">
      <button @click="authStore.logout()" class="nav-item logout-btn">
        <LogOut :size="20" class="mr-3" />
        <span>Cerrar Sesión</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 2000;
  backdrop-filter: blur(8px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.sidebar-overlay.sidebar-open {
  opacity: 1;
  pointer-events: auto;
}

.sidebar {
  background: rgba(28, 28, 30, 0.85); /* Apple dark secondary translúcido */
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  padding: 2rem 0.75rem;
  overflow-y: auto;
  position: relative;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-footer {
  margin-top: auto;
  padding: 1rem 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  /* Asegura un espacio mínimo al fondo en todas las plataformas */
  padding-bottom: 24px; 
}

.logout-btn {
  width: 100%;
  text-align: left;
  background: rgba(255, 45, 85, 0.1);
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 500;
  color: #ff3b30;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: rgba(255, 59, 48, 0.2);
  transform: translateY(-1px);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
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
  padding: 0.75rem 1.25rem;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  border-radius: 12px;
  margin: 2px 0;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  font-size: 0.95rem;
}

.nav-item:hover {
  color: white;
  background: rgba(255, 255, 255, 0.05);
}

.nav-item.router-link-active {
  color: white;
  background: rgba(255, 45, 85, 0.15); /* Fondo suave rojo Apple */
  color: #ff2d55; /* Texto rojo Apple */
}

.nav-item.router-link-active span {
  font-weight: 600;
}

.mr-3 {
  margin-right: 12px;
}

@media (max-width: 767px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 300px;
    max-width: 85vw;
    height: 100dvh;
    z-index: 2001;
    transform: translateX(-100%);
    box-shadow: 20px 0 40px rgba(0, 0, 0, 0.5);
  }

  .sidebar.sidebar-open {
    transform: translateX(0);
  }

  .sidebar-footer {
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
  }
}

@media (min-width: 768px) {
  .sidebar {
    position: relative;
    transform: none !important;
    width: 240px;     
    min-width: 240px;  
    height: 100%;
    border-right: 1px solid rgba(255,255,255,0.08);
  }

  .sidebar-header {
    display: none;
  }

  .sidebar-overlay {
    display: none !important;
  }
}

</style>
