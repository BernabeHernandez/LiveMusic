<script setup>
import SearchSongs from './components/SearchSongs.vue'
import MusicPlayer from './components/MusicPlayer.vue'
</script>

<template>
  <div class="main-app">
    <h1>LiveMusic</h1>
    <SearchSongs />
    <MusicPlayer />
  </div>
</template>

<style>
body { background: #121212; color: white; font-family: sans-serif; margin: 0; padding: 20px; }
.main-app { padding-bottom: 100px; }
</style>