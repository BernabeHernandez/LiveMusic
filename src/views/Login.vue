<template>
  <div class="login-container">
    <div class="glass-bg">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
    </div>
    
    <div class="login-box">
      <div class="brand-header">
        <div class="logo-wrapper">
          <h1 class="logo">Live<span>Music</span></h1>
        </div>
        <p class="subtitle">Inicia sesión con tu cuenta</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <div class="input-wrapper">
            <Mail class="input-icon" :size="18" />
            <input 
              type="email" 
              id="email" 
              v-model="email" 
              placeholder="Correo electrónico" 
              required 
              :disabled="isLoading"
            />
          </div>
        </div>

        <div class="input-group">
          <div class="input-wrapper">
            <Lock class="input-icon" :size="18" />
            <input 
              type="password" 
              id="password" 
              v-model="password" 
              placeholder="Contraseña" 
              required 
              :disabled="isLoading"
            />
          </div>
        </div>

        <div v-if="error" class="error-message">
          <AlertCircle :size="16" />
          <span>{{ error }}</span>
        </div>

        <button type="submit" class="login-button" :disabled="isLoading">
          <span v-if="isLoading" class="spinner"></span>
          <span v-else>Iniciar sesión</span>
        </button>
      </form>
      
      <div class="login-footer">
        <p>¿No tienes una cuenta? <a href="#">Ponte en contacto</a></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { Mail, Lock, AlertCircle } from 'lucide-vue-next';

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
  background: #000;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.glass-bg {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}

.circle-1 {
  width: 400px;
  height: 400px;
  background: #ff2d55; /* Apple Red */
  top: -100px;
  right: -100px;
}

.circle-2 {
  width: 300px;
  height: 300px;
  background: #5856d6; /* iOS Purple/Blue */
  bottom: -50px;
  left: -50px;
}

.login-box {
  width: 100%;
  max-width: 420px;
  background: rgba(28, 28, 30, 0.8); /* Apple dark secondary */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 22px; /* Smoother corners */
  padding: 3rem 2.5rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 2;
  position: relative;
}

.brand-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.logo {
  font-size: 2.2rem;
  font-weight: 700;
  margin: 0;
  color: white;
  letter-spacing: -0.5px;
}

.logo span {
  color: #ff2d55; /* Red accent */
}

.subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
  margin-top: 0.75rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: rgba(255, 255, 255, 0.4);
  transition: color 0.2s;
}

input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 14px 14px 14px 44px;
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
}

input:focus {
  background: rgba(255, 255, 255, 0.08);
  border-color: #ff2d55;
  box-shadow: 0 0 0 4px rgba(255, 45, 85, 0.1);
}

input:focus + .input-icon {
  color: #ff2d55;
}

input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 45, 85, 0.1);
  color: #ff453a;
  padding: 12px;
  border-radius: 12px;
  font-size: 0.9rem;
  border: 1px solid rgba(255, 45, 85, 0.2);
}

.login-button {
  background: #ff2d55;
  color: white;
  border: none;
  border-radius: 14px;
  padding: 14px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 1rem;
  box-shadow: 0 4px 12px rgba(255, 45, 85, 0.3);
}

.login-button:hover:not(:disabled) {
  background: #ff375f;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(255, 45, 85, 0.4);
}

.login-button:active:not(:disabled) {
  transform: scale(0.98);
}

.login-button:disabled {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.3);
  cursor: not-allowed;
  box-shadow: none;
}

.login-footer {
  text-align: center;
  margin-top: 2rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.4);
}

.login-footer a {
  color: #ff2d55;
  text-decoration: none;
  font-weight: 500;
}

.login-footer a:hover {
  text-decoration: underline;
}

.spinner {
  width: 22px;
  height: 22px;
  border: 2.5px solid rgba(255, 255, 255, 0.2);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .login-box {
    padding: 2.5rem 1.5rem;
  }
}
</style>
