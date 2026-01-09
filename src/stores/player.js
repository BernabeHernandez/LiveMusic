import { defineStore } from 'pinia';

// ✅ Variable de entorno para API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

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
    progress: 0,
    isShuffleEnabled: false,
    playedIndices: []
  }),

  actions: {
    initAudioPlayer(audioElement) {
      this.audio = audioElement;
      if (this.audio) {
        this.audio.volume = this.volume;

        this.audio.addEventListener('timeupdate', () => {
          this.currentTime = this.audio.currentTime;
          this.duration = this.audio.duration || 0;
          this.progress = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
        });

        this.audio.addEventListener('ended', () => {
          this.nextTrack();
        });

        this.audio.addEventListener('error', () => {
          console.error('Error al reproducir audio');
          alert('Error al reproducir esta canción. Puede estar restringida o no disponible.');
        });
      }
    },

    async playTrack(videoId, trackInfo = {}) {
      this.currentTrack = {
        title: trackInfo.title || 'Cargando...',
        artist: trackInfo.artist || 'YouTube',
        thumbnail: trackInfo.thumbnail || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        videoId
      };

      // Añadir a la cola
      const existingIndex = this.queue.findIndex(t => t.videoId === videoId);
      if (existingIndex === -1) {
        this.queue.push(this.currentTrack);
        this.currentIndex = this.queue.length - 1;
      } else {
        this.currentIndex = existingIndex;
      }

      try {
        // ✅ Usar API_URL en lugar de localhost
        const response = await fetch(`${API_URL}/api/audio/${videoId}`);
        const data = await response.json();

        if (data.audioUrl) {
          this.audio.src = data.audioUrl;
          this.audio.play();
          this.isPlaying = true;
          this.duration = data.duration || 0;

          // Actualizar metadata real
          const infoRes = await fetch(`${API_URL}/api/video-info/${videoId}`);
          if (infoRes.ok) {
            const info = await infoRes.json();
            this.currentTrack.title = info.title;
            this.currentTrack.artist = info.uploader;
            this.currentTrack.thumbnail = info.thumbnail;
            this.queue[this.currentIndex] = { ...this.currentTrack };
          }

          this.updateMediaSession();
        }
      } catch (error) {
        console.error('Error cargando audio:', error);
        alert('No se pudo reproducir la canción');
      }
    },

    togglePlay() {
      if (!this.audio) return;
      if (this.isPlaying) {
        this.audio.pause();
      } else {
        this.audio.play();
      }
      this.isPlaying = !this.isPlaying;
    },

    seekTo(percent) {
      if (!this.audio || isNaN(this.duration)) return;
      const time = (percent / 100) * this.duration;
      this.audio.currentTime = time;
    },

    setVolume(vol) {
      this.volume = vol;
      if (this.audio) this.audio.volume = vol;
    },

    toggleShuffle() {
      this.isShuffleEnabled = !this.isShuffleEnabled;
      if (!this.isShuffleEnabled) this.playedIndices = [];
    },

    nextTrack() {
      if (this.queue.length === 0) return;

      if (this.isShuffleEnabled) {
        if (this.playedIndices.length >= this.queue.length) this.playedIndices = [];
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * this.queue.length);
        } while (this.playedIndices.includes(randomIndex));
        this.playedIndices.push(randomIndex);
        this.currentIndex = randomIndex;
      } else {
        this.currentIndex = (this.currentIndex + 1) % this.queue.length;
      }

      const next = this.queue[this.currentIndex];
      this.playTrack(next.videoId, next);
    },

    previousTrack() {
      if (this.currentTime > 3) {
        this.audio.currentTime = 0;
        return;
      }

      if (this.queue.length === 0) return;

      if (this.isShuffleEnabled && this.playedIndices.length > 1) {
        this.playedIndices.pop();
        this.currentIndex = this.playedIndices[this.playedIndices.length - 1];
      } else {
        this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.queue.length - 1;
      }

      const prev = this.queue[this.currentIndex];
      this.playTrack(prev.videoId, prev);
    },

    updateMediaSession() {
      if ('mediaSession' in navigator && this.currentTrack) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: this.currentTrack.title,
          artist: this.currentTrack.artist,
          artwork: [{ src: this.currentTrack.thumbnail, sizes: '512x512', type: 'image/jpeg' }]
        });

        navigator.mediaSession.setActionHandler('play', () => this.togglePlay());
        navigator.mediaSession.setActionHandler('pause', () => this.togglePlay());
        navigator.mediaSession.setActionHandler('previoustrack', () => this.previousTrack());
        navigator.mediaSession.setActionHandler('nexttrack', () => this.nextTrack());
      }
    },

    cleanup() {
      if (this.audio) {
        this.audio.pause();
        this.audio.src = '';
      }
    }
  }
});