<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { WifiOff, Wifi } from 'lucide-vue-next'

const isOnline = ref(navigator.onLine)
const showOfflineNotice = ref(false)

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine
  
  if (!navigator.onLine) {
    showOfflineNotice.value = true
  } else {
    // Ocultar después de 2 segundos cuando vuelve online
    setTimeout(() => {
      showOfflineNotice.value = false
    }, 2000)
  }
}

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

<template>
  <Transition name="slide-down">
    <div v-if="showOfflineNotice" class="offline-notice" :class="{ 'is-online': isOnline }">
      <div class="notice-content">
        <WifiOff v-if="!isOnline" :size="20" class="notice-icon" />
        <Wifi v-else :size="20" class="notice-icon" />
        
        <div class="notice-text">
          <p v-if="!isOnline" class="notice-title">Sin conexión</p>
          <p v-else class="notice-title">Conectado</p>
          
          <p v-if="!isOnline" class="notice-subtitle">
            Puedes navegar por la app, pero no podrás buscar o reproducir música
          </p>
          <p v-else class="notice-subtitle">
            Conexión restaurada
          </p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.offline-notice {
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  color: white;
  padding: 1rem;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
}

.offline-notice.is-online {
  background: linear-gradient(135deg, #1db954 0%, #1ed760 100%);
}

.notice-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.notice-icon {
  flex-shrink: 0;
}

.notice-text {
  flex: 1;
  min-width: 0;
}

.notice-title {
  margin: 0 0 0.25rem 0;
  font-weight: 700;
  font-size: 0.95rem;
}

.notice-subtitle {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.95;
  line-height: 1.3;
}

/* Animations */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

@media (max-width: 640px) {
  .offline-notice {
    top: 60px;
    padding: 0.75rem;
  }

  .notice-content {
    gap: 0.75rem;
  }

  .notice-title {
    font-size: 0.9rem;
  }

  .notice-subtitle {
    font-size: 0.8rem;
  }
}
</style>