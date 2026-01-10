<script setup>
import Favorites from './Favorites.vue'
import Playlists from './Playlists.vue'
</script>

<template>
  <section class="library">
    <h1>Tu biblioteca</h1>

    <div class="library-sections">
      <Favorites />
      <Playlists />
    </div>
  </section>
</template>

<style scoped>
.library {
  padding: 2rem;
  color: white;
}

.library h1 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
}

.library-sections {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}
</style>
