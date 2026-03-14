import { defineStore } from 'pinia';
import { dbService } from '../services/db.js';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const getFavoritesKey = (userId) => userId ? `music_favorites_${userId}` : 'music_player_favorites_anon'

export const usePlayerStore = defineStore('player', {
  state: () => ({
    currentTrack: null,
    isPlaying: false,
    audio: null,
    volume: 0.8,
    queue: [],
    currentIndex: 0,
    currentTime: 0,
    duration: 0,
    backendDuration: 0,
    progress: 0,
    isShuffleEnabled: false,
    playedIndices: [],
    durationFixed: false,
    isRepeatEnabled: false,
    favorites: [],
    activeLocalObjectUrl: null,
    prefetchedData: new Map(), // { videoId: { audioUrl, duration, info } }
    pendingPrefetches: new Set(), // Track in-flight prefetches to avoid duplicates
    currentAbortController: null,
    dominantColor: '#121212',
    isExpanded: false
  }),

  getters: {

    isFavorite: (state) => (videoId) => {
      return state.favorites.some(fav => fav.videoId === videoId);
    },
    favoritesCount: (state) => state.favorites.length,
    isCurrentTrackFavorite: (state) => {
      if (!state.currentTrack) return false;
      return state.favorites.some(fav => fav.videoId === state.currentTrack.videoId);
    }
  },

  actions: {
    initStore() {
      this.loadFavorites();
    },

    saveFavorites() {
      const authStore = useAuthStore();
      const userId = authStore.user?._id;
      const key = getFavoritesKey(userId);
      localStorage.setItem(key, JSON.stringify(this.favorites));
    },

    async loadFavorites() {
      const authStore = useAuthStore();
      if (authStore.isAuthenticated()) {
        const userId = authStore.user._id;
        try {
          const response = await fetch(`${API_URL}/api/favorites?userId=${userId}`);
          if (response.ok) {
            const data = await response.json();

            // VALIDACIÓN CRÍTICA: Asegurarse de que el usuario no haya cambiado durante la petición
            if (!authStore.isAuthenticated() || authStore.user._id !== userId) {
              console.log('⚠️ Ignorando carga de favoritos: el usuario cambió durante la espera.');
              return;
            }

            this.favorites = data;
            console.log(`✅ Favoritos sincronizados desde la nube (${userId}): ${this.favorites.length}`);
            this.saveFavorites(); // Guardar en el storage específico del usuario
            return;
          }
        } catch (error) {
          console.error('Error sincronizando favoritos:', error);
        }

        // Cargar desde el storage específico del usuario si falla la nube
        const key = getFavoritesKey(userId);
        const stored = localStorage.getItem(key);
        if (stored) {
          this.favorites = JSON.parse(stored);
          console.log(`✅ Cargados ${this.favorites.length} favoritos locales para usuario ${userId}`);
          return;
        }
      }

      // Fallback a anónimo si no hay usuario
      try {
        const key = getFavoritesKey(null);
        const stored = localStorage.getItem(key);
        if (stored) {
          this.favorites = JSON.parse(stored);
          console.log(`✅ Cargados ${this.favorites.length} favoritos locales anónimos`);
        } else {
          this.favorites = [];
        }
      } catch (error) {
        console.error('Error cargando favoritos locales:', error);
        this.favorites = [];
      }
    },

    async toggleFavorite(track) {
      const authStore = useAuthStore();
      const index = this.favorites.findIndex(fav => fav.videoId === track.videoId);

      if (index !== -1) {
        // Quitar
        this.favorites.splice(index, 1);
        if (authStore.isAuthenticated()) {
          fetch(`${API_URL}/api/favorites/${authStore.user._id}/${track.videoId}`, { method: 'DELETE' });
        }
        console.log('💔 Quitado de favoritos:', track.title);
      } else {
        // Agregar
        const favoriteTrack = {
          videoId: track.videoId,
          title: track.title,
          artist: track.artist || 'YouTube',
          thumbnail: this.upgradeThumbnail(track.thumbnail || `https://i.ytimg.com/vi/${track.videoId}/mqdefault.jpg`),
          duration: track.duration || 0,
          addedAt: new Date().toISOString()
        };

        this.favorites.unshift(favoriteTrack);
        if (authStore.isAuthenticated()) {
          fetch(`${API_URL}/api/favorites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...favoriteTrack, userId: authStore.user._id })
          });
        }
        console.log('❤️ Agregado a favoritos:', track.title);
      }

      this.saveFavorites();
    },

    async removeFavorite(videoId) {
      const authStore = useAuthStore();
      const index = this.favorites.findIndex(fav => fav.videoId === videoId);
      if (index !== -1) {
        const removed = this.favorites.splice(index, 1)[0];
        if (authStore.isAuthenticated()) {
          fetch(`${API_URL}/api/favorites/${authStore.user._id}/${videoId}`, { method: 'DELETE' });
        }
        this.saveFavorites();
        console.log('💔 Quitado de favoritos:', removed.title);
        return true;
      }
      return false;
    },

    async syncLocalFavorites() {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated()) return;

      const userId = authStore.user._id;
      // Primero intentamos sincronizar lo que sea que esté en la lista actual 
      // (que podría venir de una sesión anónima previa si no se limpió)
      if (this.favorites.length > 0) {
        console.log('🔄 Sincronizando favoritos actuales con la nube...');
        for (const fav of this.favorites) {
          try {
            await fetch(`${API_URL}/api/favorites`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...fav, userId })
            });
          } catch (e) {
            console.warn('Error sincronizando favorito:', fav.title);
          }
        }
      }
      this.loadFavorites(); // Forzar recarga desde nube para este usuario
    },

    async clearFavorites() {
      const authStore = useAuthStore();
      if (authStore.isAuthenticated()) {
        const userId = authStore.user._id;
        try {
          console.log(`🗑️ Limpiando favoritos en la nube para usuario ${userId}...`);
          await fetch(`${API_URL}/api/favorites/${userId}`, { method: 'DELETE' });
        } catch (e) {
          console.error('Error al limpiar favoritos en nube:', e);
        }
      }
      this.favorites = [];
      this.saveFavorites();
      console.log('🗑️ Favoritos locales y de nube limpiados');
    },

    playFavorites(startIndex = 0) {
      if (this.favorites.length === 0) {
        console.warn('No hay favoritos para reproducir');
        return;
      }

      this.setQueue([...this.favorites], startIndex);
      console.log(`🎵 Reproduciendo favoritos (${this.favorites.length} canciones)`);
    },

    initAudioPlayer(audioElement) {
      this.audio = audioElement;
      if (this.audio) {
        this.audio.volume = this.volume;

        this.audio.addEventListener('timeupdate', () => {
          this.currentTime = this.audio.currentTime;

          if (this.backendDuration > 0) {
            this.duration = this.backendDuration;
          } else if (this.audio.duration && !isNaN(this.audio.duration) && isFinite(this.audio.duration)) {
            this.duration = this.audio.duration;
          }

          if (this.currentTime > this.duration && this.duration > 0) {
            console.warn('Duración incorrecta detectada. Forzando corrección...');
            this.duration = this.currentTime;
          }

          this.progress = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;

          if (this.backendDuration > 0 && this.currentTime >= this.backendDuration - 0.5) {
            console.log('Canción terminada según duración del backend');
            this.handleTrackEnd();
          }
        });

        this.audio.addEventListener('loadedmetadata', () => {
          console.log('loadedmetadata - audio.duration:', this.audio.duration);
          console.log('backendDuration guardada:', this.backendDuration);

          if (this.audio.duration && !isNaN(this.audio.duration) && isFinite(this.audio.duration)) {
            const audioDuration = this.audio.duration;

            if (this.backendDuration > 0) {
              const diff = Math.abs(audioDuration - this.backendDuration);
              if (diff > 10) {
                console.warn('Duración discrepante:', {
                  audio: audioDuration,
                  backend: this.backendDuration,
                  diferencia: diff
                });
                console.log('Usando duración del backend');
                this.duration = this.backendDuration;
              } else {
                this.duration = audioDuration;
              }
            } else {
              this.duration = audioDuration;
            }
          }
        });

        this.audio.addEventListener('ended', () => {
          console.log('Evento ended disparado');
          this.handleTrackEnd();
        });

        this.audio.addEventListener('error', (e) => {
          // Si el src está vacío, no es un error real de reproducción
          if (!this.audio.src || this.audio.src === window.location.href) return;

          console.error('Error al reproducir audio:', e);
          // Omitimos el alert por petición del usuario
          this.nextTrack();
        });

        // Sincronizar estado real del audio con la app para evitar bugs en pantalla bloqueada
        this.audio.addEventListener('play', () => {
          this.isPlaying = true;
          this.updatePositionState();
        });

        this.audio.addEventListener('pause', () => {
          this.isPlaying = false;
        });

        this.audio.addEventListener('canplay', () => {
          console.log('Audio listo para reproducir');
          console.log('Duración final:', this.duration);
        });
      }
    },

    handleTrackEnd() {
      if (this.isRepeatEnabled) {
        this.audio.currentTime = 0;
        this.audio.play();
      } else {
        this.nextTrack();
      }
    },

    setQueue(tracks, startIndex = 0) {
      this.queue = tracks;
      this.currentIndex = startIndex;
      const track = this.queue[this.currentIndex];
      if (track) {
        this.playTrack(track.videoId, track);
      }
    },

    addToQueue(track) {
      const exists = this.queue.findIndex(t => t.videoId === track.videoId);
      if (exists === -1) {
        this.queue.push(track);
        console.log('Canción agregada a la cola:', track.title);
      }
    },

    async playTrack(videoId, trackInfo = {}) {
      if (this.currentAbortController) this.currentAbortController.abort();
      this.currentAbortController = new AbortController();
      const signal = this.currentAbortController.signal;
      const targetVideoId = videoId;

      this.currentTrack = {
        title: trackInfo.title || 'Cargando...',
        artist: trackInfo.artist || 'Artista...',
        thumbnail: this.upgradeThumbnail(trackInfo.thumbnail || `https://i.ytimg.com/vi/${targetVideoId}/mqdefault.jpg`),
        videoId: targetVideoId,
        duration: trackInfo.duration || 0
      };

      const existingIndex = this.queue.findIndex(t => t.videoId === targetVideoId);
      if (existingIndex !== -1) {
        this.currentIndex = existingIndex;
        if (this.queue[existingIndex].title !== 'Cargando...') {
          const q = this.queue[existingIndex];
          this.currentTrack.title = q.title;
          this.currentTrack.artist = q.artist;
          this.currentTrack.thumbnail = q.thumbnail;
        }
      } else {
        this.queue.push(this.currentTrack);
        this.currentIndex = this.queue.length - 1;
      }

      const targetIndex = this.currentIndex;

      try {
        console.log('🎵 Cargando canción:', videoId);

        let audioSourceUrl = null;

        // 1. Revisar en IndexedDB si la canción está descargada
        const downloadedBlob = await dbService.getDownloadBlob(videoId);

        if (downloadedBlob) {
          console.log('⚡ Reproduciendo OFFLINE');
          if (this.activeLocalObjectUrl) URL.revokeObjectURL(this.activeLocalObjectUrl);
          audioSourceUrl = URL.createObjectURL(downloadedBlob);
          this.activeLocalObjectUrl = audioSourceUrl;

          const metadata = await dbService.getDownloadMetadata(targetVideoId);
          if (metadata && this.currentTrack.videoId === targetVideoId) {
            this.backendDuration = metadata.duration || 0;
            this.currentTrack.title = metadata.title || this.currentTrack.title;
            this.currentTrack.artist = metadata.artist || this.currentTrack.artist;
            this.currentTrack.thumbnail = this.upgradeThumbnail(metadata.thumbnail || this.currentTrack.thumbnail);
            this.queue[targetIndex] = { ...this.currentTrack };
          }
        } else {
          // 2. Reproducción ONLINE normal
          const prefetched = this.prefetchedData.get(targetVideoId);

          if (prefetched) {
            console.log('⚡ Reproduciendo desde PREFETCH:', targetVideoId);
            audioSourceUrl = prefetched.audioUrl;
            this.backendDuration = prefetched.duration;
            if (prefetched.info && this.currentTrack.videoId === targetVideoId) {
              this.currentTrack.title = prefetched.info.title || this.currentTrack.title;
              this.currentTrack.artist = prefetched.info.artist || prefetched.info.uploader || this.currentTrack.artist;
              this.currentTrack.thumbnail = this.upgradeThumbnail(prefetched.info.thumbnail || this.currentTrack.thumbnail);
              this.currentTrack.duration = prefetched.info.duration || this.currentTrack.duration;
              this.queue[targetIndex] = { ...this.currentTrack };
            }
            this.prefetchedData.delete(targetVideoId);
            console.log('  - Pre-fetch consumido');
          } else {
            console.log('  - Buscando URL en backend:', targetVideoId);
            try {
              const authStore = useAuthStore();
              const userIdParam = authStore.isAuthenticated() ? `?userId=${authStore.user._id}` : '';
              const audioResponse = await fetch(`${API_URL}/api/audio/${targetVideoId}${userIdParam}`, { signal });
              const data = await audioResponse.json();

              console.log('  - Respuesta backend recibida:', !!data.audioUrl);
              if (!data.audioUrl) throw new Error('No audio URL');

              audioSourceUrl = data.audioUrl;
              this.backendDuration = data.duration || 0;

              // Actualizamos info básica si no la tenemos
              fetch(`${API_URL}/api/video-info/${targetVideoId}`, { signal })
                .then(r => r.json())
                .then(info => {
                  if (info && info.title && this.currentTrack?.videoId === targetVideoId) {
                    this.currentTrack.title = info.title;
                    this.currentTrack.artist = info.uploader || 'YouTube';
                    if (info.thumbnail) {
                      this.currentTrack.thumbnail = this.upgradeThumbnail(info.thumbnail);
                    }
                    this.currentTrack.duration = info.duration || this.currentTrack.duration;
                    this.queue[targetIndex] = { ...this.currentTrack };
                    this.updateMediaSession();
                  }
                })
                .catch(err => {
                  if (err.name !== 'AbortError') console.warn('Metadata extra falló:', err);
                });

            } catch (err) {
              if (err.name === 'AbortError') return;
              throw err;
            }
          }
        }

        if (audioSourceUrl) {
          this.duration = 0;
          this.currentTime = 0;
          this.progress = 0;
          this.durationFixed = false;

          console.log('  - Estableciendo audio.src:', audioSourceUrl.substring(0, 50) + '...');
          this.audio.src = audioSourceUrl;

          try {
            await this.audio.play();
            console.log('  - Reproducción iniciada');
            this.isPlaying = true;
            this.updateMediaSession();
            this.prefetchNextTrack();
          } catch (playError) {
            if (playError.name !== 'AbortError') {
              console.error('Error en audio.play():', playError);
              throw playError;
            }
          }
        }
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('Fatal playback error:', error);
      }
    },

    togglePlay() {
      if (!this.audio) return;
      if (!this.audio.paused) {
        this.audio.pause();
      } else {
        this.audio.play();
      }
    },

    seekTo(percent) {
      if (!this.audio || isNaN(this.duration) || this.duration === 0) return;

      const maxDuration = this.backendDuration > 0 ? this.backendDuration : this.duration;
      const time = (percent / 100) * maxDuration;

      console.log('Seeking a:', time, 'de', maxDuration);

      if (time <= maxDuration) {
        this.audio.currentTime = time;
        this.updatePositionState();
      }
    },

    setVolume(vol) {
      this.volume = vol;
      if (this.audio) this.audio.volume = vol;
    },

    toggleShuffle() {
      this.isShuffleEnabled = !this.isShuffleEnabled;
      if (!this.isShuffleEnabled) this.playedIndices = [];
    },

    toggleRepeat() {
      this.isRepeatEnabled = !this.isRepeatEnabled;
    },

    nextTrack() {
      if (this.queue.length === 0) {
        console.warn('No hay canciones en la cola');
        return;
      }

      if (this.queue.length === 1 && !this.isShuffleEnabled) {
        console.log('Solo hay una canción en la cola');
        this.audio.pause();
        this.isPlaying = false;
        return;
      }

      let nextIndex;

      if (this.isShuffleEnabled) {
        if (this.playedIndices.length >= this.queue.length) {
          this.playedIndices = [];
        }

        do {
          nextIndex = Math.floor(Math.random() * this.queue.length);
        } while (this.playedIndices.includes(nextIndex) && this.playedIndices.length < this.queue.length);

        this.playedIndices.push(nextIndex);
      } else {
        nextIndex = this.currentIndex + 1;
        if (nextIndex >= this.queue.length) {
          console.log('Llegaste al final de la cola');
          this.audio.pause();
          this.isPlaying = false;
          return;
        }
      }

      this.currentIndex = nextIndex;
      const next = this.queue[this.currentIndex];
      console.log('Siguiente canción:', next.title);
      this.playTrack(next.videoId, next);
    },

    previousTrack() {
      if (this.currentTime > 3) {
        this.audio.currentTime = 0;
        return;
      }

      if (this.queue.length === 0) return;

      let prevIndex;

      if (this.isShuffleEnabled && this.playedIndices.length > 1) {
        this.playedIndices.pop();
        prevIndex = this.playedIndices[this.playedIndices.length - 1];
      } else {
        prevIndex = this.currentIndex - 1;

        if (prevIndex < 0) {
          console.log('Ya estás en la primera canción');
          this.audio.currentTime = 0;
          return;
        }
      }

      this.currentIndex = prevIndex;
      const prev = this.queue[this.currentIndex];
      console.log('Canción anterior:', prev.title);
      this.playTrack(prev.videoId, prev);
    },

    updateMediaSession() {
      if ('mediaSession' in navigator && this.currentTrack) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: this.currentTrack.title,
          artist: this.currentTrack.artist,
          artwork: [{ src: this.currentTrack.thumbnail, sizes: '512x512', type: 'image/jpeg' }]
        });

        navigator.mediaSession.setActionHandler('play', () => this.audio?.play());
        navigator.mediaSession.setActionHandler('pause', () => this.audio?.pause());
        navigator.mediaSession.setActionHandler('previoustrack', () => this.previousTrack());
        navigator.mediaSession.setActionHandler('nexttrack', () => this.nextTrack());
        
        navigator.mediaSession.setActionHandler('seekto', (details) => {
           if (details.fastSeek && 'fastSeek' in this.audio) {
             this.audio.fastSeek(details.seekTime);
             return;
           }
           
           if (this.audio && details.seekTime !== undefined) {
             this.audio.currentTime = details.seekTime;
             this.updatePositionState();
           }
        });
        
        this.updatePositionState();
      }
    },

    updatePositionState() {
      if ('mediaSession' in navigator && this.audio && !isNaN(this.audio.duration)) {
        try {
          const expectedDuration = Number.isFinite(this.audio.duration) ? this.audio.duration : this.duration;
          
          if (expectedDuration > 0) {
            navigator.mediaSession.setPositionState({
              duration: expectedDuration,
              playbackRate: this.audio.playbackRate,
              position: this.audio.currentTime
            });
          }
        } catch (e) {
          console.warn("Could not set position state:", e);
        }
      }
    },

    async prefetchTracks(tracks, limit = 3) {
      if (!tracks || tracks.length === 0) return;

      const toPrefetch = tracks.slice(0, limit);
      console.log(`🚀 Iniciando pre-carga inteligente para ${toPrefetch.length} canciones...`);

      for (const track of toPrefetch) {
        const vid = track.videoId;
        // No pre-cargar si ya está en caché, descargado o ya tiene una petición pendiente
        if (this.prefetchedData.has(vid)) continue;
        if (this.pendingPrefetches.has(vid)) continue;
        if (this.currentTrack?.videoId === vid) continue;

        try {
          this.pendingPrefetches.add(vid);
          // Revisar si está descargada
          const isDownloaded = await dbService.isDownloaded(vid);
          if (isDownloaded) {
            this.pendingPrefetches.delete(vid);
            continue;
          }

          console.log('  - Lote pre-carga:', track.title);

          const authStore = useAuthStore();
          const userIdParam = authStore.isAuthenticated() ? `?userId=${authStore.user._id}` : '';

          // Solo pedimos el audio, la info la sacamos del track si existe
          const audioRes = await fetch(`${API_URL}/api/audio/${track.videoId}${userIdParam}`).then(r => r.json());

          if (audioRes.audioUrl) {
            this.prefetchedData.set(vid, {
              audioUrl: audioRes.audioUrl,
              duration: audioRes.duration,
              info: track // Usamos la info que ya tenemos
            });
            console.log('    ✅ Listo:', vid);
          }
        } catch (err) {
          console.warn('  - Error en pre-carga de:', track.title, err.message);
        } finally {
          this.pendingPrefetches.delete(vid);
        }
      }
    },

    async prefetchNextTrack() {
      const nextIndex = this.currentIndex + 1;
      if (nextIndex < this.queue.length) {
        const nextTrack = this.queue[nextIndex];
        await this.prefetchTracks([nextTrack], 1);
      }
    },

    cleanup() {
      if (this.audio) {
        this.audio.pause();
        this.audio.src = '';
      }
      if (this.activeLocalObjectUrl) {
        URL.revokeObjectURL(this.activeLocalObjectUrl);
        this.activeLocalObjectUrl = null;
      }
      if (this.currentAbortController) {
        this.currentAbortController.abort();
        this.currentAbortController = null;
      }
    },

    reset() {
      this.cleanup();
      this.currentTrack = null;
      this.isPlaying = false;
      this.queue = [];
      this.currentIndex = 0;
      this.currentTime = 0;
      this.duration = 0;
      this.progress = 0;
      this.favorites = [];
      this.prefetchedData.clear();
      this.pendingPrefetches.clear();
      console.log('🧹 Estado del reproductor reiniciado');
    },

    upgradeThumbnail(url) {
      if (!url) return '';
      // Si ya es de alta resolución o no es de YouTube, no tocar
      if (url.includes('maxresdefault') || !url.includes('img.youtube.com') && !url.includes('i.ytimg.com')) {
        return url;
      }
      // Reemplazar mqdefault, hqdefault, sddefault por maxresdefault
      return url.replace(/\/(mqdefault|hqdefault|sddefault|default)\.jpg/, '/maxresdefault.jpg');
    },
    
    updateThemeColor(color) {
      this.dominantColor = color;
      
      // Update meta theme-color
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.name = 'theme-color';
        document.head.appendChild(metaThemeColor);
      }
      metaThemeColor.setAttribute('content', color);
      
      // Update body and HTML background to match player color for iOS home indicator
      document.body.style.backgroundColor = color;
      document.documentElement.style.backgroundColor = color;
    },

    setIsExpanded(value) {
      this.isExpanded = value;
    }
  }
});