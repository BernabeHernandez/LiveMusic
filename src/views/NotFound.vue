<template>
  <div class="not-found">
    <h1>404</h1>
    <p>Página no encontrada</p>

    <router-link to="/" class="back">
      Volver al inicio
    </router-link>
  </div>
</template>

<script setup>
</script>

<style scoped>
.not-found {
  min-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom, #121212, #0f0f0f);
  color: white;
  text-align: center;
}

h1 {
  font-size: 6rem;
  margin-bottom: 0.5rem;
}

p {
  opacity: 0.7;
  margin-bottom: 1.5rem;
}

.back {
  color: #1db954;
  text-decoration: none;
  font-weight: 600;
}

.back:hover {
  text-decoration: underline;
}
</style>
