<template>
  <aside class="sidebar">
    <nav class="sidebar-nav">
      <router-link to="/" class="nav-item">
        <span>Home</span>
      </router-link>
      <router-link to="/favorites" class="nav-item">
        <span>Favoritos</span>
      </router-link>
      <router-link to="/playlists" class="nav-item">
        <span>Playlists</span>
      </router-link>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  background: #000;
  padding: 1.5rem 1rem;
  overflow-y: auto;
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
}

.nav-item:hover,
.nav-item.router-link-active {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}
</style>