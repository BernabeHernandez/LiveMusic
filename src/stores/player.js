import { defineStore } from 'pinia';

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
    backendDuration: 0, 
    progress: 0,
    isShuffleEnabled: false,
    playedIndices: [],
    durationFixed: false 
  }),

  actions: {
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
            console.warn('⚠️ Duración incorrecta detectada. Forzando corrección...');
            this.duration = this.currentTime;
          }
          
          this.progress = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
          
          if (this.backendDuration > 0 && this.currentTime >= this.backendDuration - 0.5) {
            console.log('✅ Canción terminada según duración del backend');
            this.nextTrack();
          }
        });

        this.audio.addEventListener('loadedmetadata', () => {
          console.log('📊 loadedmetadata - audio.duration:', this.audio.duration);
          console.log('📊 backendDuration guardada:', this.backendDuration);
          
          if (this.audio.duration && !isNaN(this.audio.duration) && isFinite(this.audio.duration)) {
            const audioDuration = this.audio.duration;
            
            if (this.backendDuration > 0) {
              const diff = Math.abs(audioDuration - this.backendDuration);
              if (diff > 10) { 
                console.warn('⚠️ Duración discrepante:', {
                  audio: audioDuration,
                  backend: this.backendDuration,
                  diferencia: diff
                });
                console.log('✅ Usando duración del backend');
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
          console.log('🎵 Evento ended disparado');
          this.nextTrack();
        });

        this.audio.addEventListener('error', (e) => {
          console.error('❌ Error al reproducir audio:', e);
          alert('Error al reproducir esta canción. Puede estar restringida o no disponible.');
        });

        this.audio.addEventListener('canplay', () => {
          console.log('✅ Audio listo para reproducir');
          console.log('📊 Duración final:', this.duration);
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

      const existingIndex = this.queue.findIndex(t => t.videoId === videoId);
      if (existingIndex === -1) {
        this.queue.push(this.currentTrack);
        this.currentIndex = this.queue.length - 1;
      } else {
        this.currentIndex = existingIndex;
      }

      try {
        console.log('🎵 Cargando canción:', videoId);
        
        const response = await fetch(`${API_URL}/api/audio/${videoId}`);
        const data = await response.json();

        if (data.audioUrl) {

          this.duration = 0;
          this.backendDuration = data.duration || 0; 
          this.currentTime = 0;
          this.progress = 0;
          this.durationFixed = false;
          
          console.log('📊 Duración del backend:', this.backendDuration, 'segundos');
          console.log('📊 URL del audio:', data.audioUrl.substring(0, 50) + '...');
          
          this.audio.src = data.audioUrl;
          
          await this.audio.play();
          this.isPlaying = true;

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
        console.error('❌ Error cargando audio:', error);
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
      if (!this.audio || isNaN(this.duration) || this.duration === 0) return;
      
      const maxDuration = this.backendDuration > 0 ? this.backendDuration : this.duration;
      const time = (percent / 100) * maxDuration;
      
      console.log('⏭️ Seeking a:', time, 'de', maxDuration);
      
      if (time <= maxDuration) {
        this.audio.currentTime = time;
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