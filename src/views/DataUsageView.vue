<template>
  <div class="usage-container">
    <header class="usage-header">
      <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
        Uso de Datos
      </h1>
      <div class="header-subtitle">
        <p class="text-[var(--live-text-secondary)]">Consumo de red en los últimos 7 días</p>
        <span class="last-sync" v-if="lastSync">Actualizado: {{ lastSync }}</span>
      </div>
    </header>

    <!-- Summary Cards -->
    <div class="stats-grid">
      <div class="stat-card glass">
        <div class="stat-icon streaming">
          <Radio :size="20" />
        </div>
        <div class="stat-info">
          <span class="label">Streaming</span>
          <span class="value">{{ formatBytes(totals.streaming) }}</span>
        </div>
      </div>

      <div class="stat-card glass">
        <div class="stat-icon download">
          <Download :size="20" />
        </div>
        <div class="stat-info">
          <span class="label">Descargas</span>
          <span class="value">{{ formatBytes(totals.download) }}</span>
        </div>
      </div>

      <div class="stat-card glass total">
        <div class="stat-icon total">
          <Activity :size="20" />
        </div>
        <div class="stat-info">
          <span class="label">Total</span>
          <span class="value">{{ formatBytes(totals.streaming + totals.download) }}</span>
        </div>
      </div>
    </div>

    <!-- Today's Summary (New) -->
    <section class="today-section glass">
      <div class="today-header">
        <h2 class="section-title">Hoy</h2>
        <span class="today-status" :class="{ 'has-data': todayUsage.total > 0 }">
          {{ todayUsage.total > 0 ? 'Activo' : 'Sin actividad' }}
        </span>
      </div>
      <div class="today-stats">
        <div class="today-main">
          <span class="today-value">{{ formatBytes(todayUsage.total) }}</span>
          <span class="today-label">Total servido hoy</span>
        </div>
        <div class="today-breakdown">
          <div class="breakdown-item">
            <div class="dot streaming"></div>
            <span>Streaming: {{ formatBytes(todayUsage.streaming) }}</span>
          </div>
          <div class="breakdown-item">
            <div class="dot download"></div>
            <span>Descargas: {{ formatBytes(todayUsage.download) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Usage History (Apple Music Style) -->
    <section class="history-section">
      <h2 class="section-title">Consumo de red en los últimos 7 días</h2>
      <div class="history-list glass">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
        </div>
        
        <div v-else-if="dailyStats.length === 0" class="empty-state">
          No hay datos registrados aún
        </div>

        <div v-else v-for="day in sortedDays" :key="day.date" class="history-item">
          <div class="item-date">
            <span class="day-name">{{ getDayName(day.date) }}</span>
            <span class="full-date">{{ formatDate(day.date) }}</span>
          </div>
          
          <div class="item-bars">
            <div class="bar-container">
              <div class="bar streaming" :style="{ width: getBarWidth(day.streaming) + '%' }"></div>
              <div class="bar download" :style="{ width: getBarWidth(day.download) + '%' }"></div>
            </div>
          </div>

          <div class="item-value">
            {{ formatBytes(day.streaming + day.download) }}
          </div>
        </div>
      </div>
    </section>

    <!-- Tips Section -->
    <section class="tips-section glass">
      <div class="tip-icon">
        <ShieldCheck :size="24" class="text-[#ff2d55]" />
      </div>
      <div class="tip-content">
        <h3>Optimización de Datos</h3>
        <p>Las descargas guardadas en tu dispositivo ayudan a reducir el consumo de datos móviles al escucharlas fuera de casa.</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { Radio, Download, Activity, ShieldCheck } from 'lucide-vue-next';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const loading = ref(true);
const usageData = ref([]);
const lastSync = ref('');
let refreshInterval = null;

const totals = computed(() => {
  return usageData.value.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + curr.bytes;
    return acc;
  }, { streaming: 0, download: 0 });
});

const dailyStats = computed(() => {
  const groups = usageData.value.reduce((acc, curr) => {
    const date = curr.date.split('T')[0];
    if (!acc[date]) acc[date] = { date, streaming: 0, download: 0 };
    acc[date][curr.type] += curr.bytes;
    return acc;
  }, {});
  return Object.values(groups);
});

const sortedDays = computed(() => {
  return [...dailyStats.value].sort((a, b) => new Date(b.date) - new Date(a.date));
});

const todayUsage = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  const stats = dailyStats.value.find(d => d.date === today);
  return stats || { streaming: 0, download: 0, total: 0, ...stats, total: (stats ? stats.streaming + stats.download : 0) };
});

const maxDaily = computed(() => {
  if (dailyStats.value.length === 0) return 1;
  return Math.max(...dailyStats.value.map(d => d.streaming + d.download));
});

onMounted(async () => {
  await fetchUsage();
  // Refrescar cada 15 segundos mientras esté abierta la vista
  refreshInterval = setInterval(fetchUsage, 15000);
});

import { onUnmounted } from 'vue';
onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});

const fetchUsage = async () => {
  if (!authStore.user) return;
  try {
    if (usageData.value.length === 0) loading.value = true;
    const res = await axios.get(`${API_URL}/api/downloads/usage?userId=${authStore.user._id}&days=7`);
    usageData.value = res.data.stats || [];
    lastSync.value = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (err) {
    console.error('Error fetching usage stats:', err);
  } finally {
    loading.value = false;
  }
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getDayName = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const diff = today - date;
  if (diff === 0) return 'Hoy';
  if (diff === 86400000) return 'Ayer';
  
  return date.toLocaleDateString('es-ES', { weekday: 'long' });
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

const getBarWidth = (value) => {
  return (value / maxDaily.value) * 100;
};
</script>

<style scoped>
.usage-container {
  padding: 1rem;
  padding-bottom: 140px;
  max-width: 1000px;
  margin: 0 auto;
}

.usage-header {
  margin-bottom: 2rem;
  padding-top: 1rem;
}

.header-subtitle {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 0.5rem;
}

.last-sync {
  font-size: 0.7rem;
  color: var(--live-text-secondary);
  opacity: 0.6;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.stat-card {
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.08);
}

.today-section {
  padding: 1.5rem;
  margin-bottom: 2.5rem;
  border-left: 4px solid #ff2d55;
}

.today-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.today-header .section-title {
  margin-bottom: 0;
  padding-left: 0;
}

.today-status {
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--live-text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.today-status.has-data {
  background: rgba(50, 215, 75, 0.2);
  color: #32d74b;
}

.today-stats {
  display: flex;
  align-items: center;
  gap: 3rem;
}

.today-main {
  display: flex;
  flex-direction: column;
}

.usage-header h1 {
  background-clip: text;
  -webkit-background-clip: text;
}

.today-label {
  font-size: 0.85rem;
  color: var(--live-text-secondary);
  margin-top: 4px;
}

.today-breakdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.streaming { background: #32d74b; }
.dot.download { background: #007aff; }

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.streaming { background: rgba(50, 215, 75, 0.15); color: #32d74b; }
.stat-icon.download { background: rgba(0, 122, 255, 0.15); color: #007aff; }
.stat-icon.total { background: rgba(255, 45, 85, 0.15); color: #ff2d55; }

.label {
  display: block;
  font-size: 0.75rem;
  color: var(--live-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  margin-top: 2px;
}

.history-section {
  margin-bottom: 2.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
  padding-left: 0.5rem;
}

.history-list {
  padding: 0.5rem;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 1.25rem 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  gap: 1.5rem;
}

.history-item:last-child {
  border-bottom: none;
}

.item-date {
  width: 80px;
  flex-shrink: 0;
}

.day-name {
  display: block;
  font-weight: 600;
  text-transform: capitalize;
  font-size: 0.95rem;
}

.full-date {
  font-size: 0.75rem;
  color: var(--live-text-secondary);
}

.item-bars {
  flex: 1;
}

.bar-container {
  height: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
}

.bar {
  height: 100%;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.bar.streaming { background: #32d74b; }
.bar.download { background: #007aff; }

.item-value {
  width: 100px;
  text-align: right;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.loading-state, .empty-state {
  padding: 4rem 2rem;
  text-align: center;
  color: var(--live-text-secondary);
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: #ff2d55;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.tips-section {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  align-items: center;
}

.tip-content h3 {
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.tip-content p {
  font-size: 0.9rem;
  color: var(--live-text-secondary);
  line-height: 1.4;
}

@media (max-width: 640px) {
  .history-item {
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  
  .item-bars {
    order: 3;
    width: 100%;
    margin-top: 0.5rem;
  }
  
  .item-value {
    margin-left: auto;
  }
}
</style>
