<template>
  <div class="login-container">
    <div class="login-box">
      <div class="brand-header">
        <h1 class="logo">Live<span>Music</span></h1>
        <p class="subtitle">Inicia sesión y lleva tu música a todas partes</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <label for="email">Correo electrónico</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            placeholder="berna25d@gmail.com" 
            required 
            :disabled="isLoading"
          />
        </div>

        <div class="input-group">
          <label for="password">Contraseña</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            placeholder="Tu contraseña" 
            required 
            :disabled="isLoading"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="login-button" :disabled="isLoading">
          <span v-if="isLoading" class="spinner"></span>
          <span v-else>Iniciar sesión</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  error.value = '';
  isLoading.value = true;

  try {
    const result = await authStore.login(email.value, password.value);
    
    if (result.success) {
      router.push('/');
    } else {
      error.value = result.error;
    }
  } catch (err) {
    error.value = 'Un error inesperado ocurrió.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #121212 0%, #000000 100%);
  padding: 1rem;
}

.login-box {
  width: 100%;
  max-width: 400px;
  background: #181818;
  border-radius: 12px;
  padding: 2.5rem 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.brand-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.logo {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
  color: white;
  letter-spacing: -1px;
}

.logo span {
  color: #1db954;
}

.subtitle {
  color: #b3b3b3;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
}

input {
  background: #282828;
  border: 1px solid transparent;
  padding: 0.875rem 1rem;
  border-radius: 4px;
  color: white;
  font-size: 1rem;
  transition: all 0.2s ease;
  outline: none;
}

input:focus {
  background: #333;
  border-color: #1db954;
}

input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

input::placeholder {
  color: #b3b3b3;
}

.error-message {
  background: rgba(255, 68, 68, 0.1);
  color: #ff6b6b;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  text-align: center;
  border: 1px solid rgba(255, 68, 68, 0.2);
}

.login-button {
  background: #1db954;
  color: black;
  border: none;
  border-radius: 25px;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 0.5rem;
}

.login-button:hover:not(:disabled) {
  transform: scale(1.02);
  background: #1ed760;
}

.login-button:active:not(:disabled) {
  transform: scale(0.98);
}

.login-button:disabled {
  background: #535353;
  color: #b3b3b3;
  cursor: not-allowed;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(0, 0, 0, 0.3);
  border-top-color: black;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
