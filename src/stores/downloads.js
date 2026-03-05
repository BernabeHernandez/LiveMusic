import { defineStore } from 'pinia';
import { ref } from 'vue';
import { dbService } from '../services/db.js';
import axios from 'axios';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useDownloadsStore = defineStore('downloads', () => {
    const downloadedTracks = ref([]);
    const activeDownloads = ref(new Set()); // Para saber cuáles se están descargando

    async function loadDownloads() {
        const authStore = useAuthStore();
        if (!authStore.user) {
            downloadedTracks.value = [];
            return;
        }

        try {
            // 1. Cargar lo que hay localmente
            const localTracks = await dbService.getAllDownloads();
            const localVideoIds = new Set(localTracks.map(t => t.videoId));

            // Mostrar locales inicialmente para rapidez
            downloadedTracks.value = localTracks;

            // 2. Traer la lista del backend (la fuente de la verdad para este usuario)
            const response = await axios.get(`${API_URL}/api/downloads?userId=${authStore.user._id}`);
            const serverTracks = response.data.downloads || [];

            let needsLocalReload = false;

            // 3. Sincronizar: Si el server tiene una canción que no está en IndexedDB
            for (const serverTrack of serverTracks) {
                if (!localVideoIds.has(serverTrack.videoId)) {
                    console.log(`Sincronizando canción faltante: ${serverTrack.title}`);
                    try {
                        activeDownloads.value.add(serverTrack.videoId);

                        // Descargar silenciosamente el blob usando el backend
                        const streamResponse = await axios.get(`${API_URL}/api/downloads/${serverTrack.videoId}/stream?userId=${authStore.user._id}`, {
                            responseType: 'blob'
                        });

                        await dbService.saveDownload({
                            videoId: serverTrack.videoId,
                            title: serverTrack.title,
                            artist: serverTrack.artist,
                            thumbnail: serverTrack.thumbnail,
                            duration: serverTrack.duration
                        }, streamResponse.data);

                        needsLocalReload = true;
                    } catch (syncErr) {
                        console.error(`Error sincronizando ${serverTrack.videoId}:`, syncErr);
                    } finally {
                        activeDownloads.value.delete(serverTrack.videoId);
                    }
                }
            }

            // 4. Limpieza (opcional): si IndexedDB tiene algo que no está en el user backend (ej: otro user lo borró de mongo)
            const serverVideoIds = new Set(serverTracks.map(t => t.videoId));
            for (const localTrack of localTracks) {
                if (!serverVideoIds.has(localTrack.videoId)) {
                    console.log(`Borrando local huérfano: ${localTrack.title}`);
                    await dbService.removeDownload(localTrack.videoId);
                    needsLocalReload = true;
                }
            }

            if (needsLocalReload) {
                downloadedTracks.value = await dbService.getAllDownloads();
            }

        } catch (error) {
            console.error('Error al cargar y sincronizar descargas:', error);
            // Si falla la red, quedarnos con los locales
            downloadedTracks.value = await dbService.getAllDownloads();
        }
    }

    async function isDownloaded(videoId) {
        return await dbService.isDownloaded(videoId);
    }

    async function downloadTrack(track) {
        if (activeDownloads.value.has(track.videoId)) return;

        const authStore = useAuthStore();
        if (!authStore.user) throw new Error("Debes iniciar sesión para descargar");

        try {
            activeDownloads.value.add(track.videoId);

            // 1. Pedir al backend que descargue la canción
            await axios.post(`${API_URL}/api/downloads/${track.videoId}?userId=${authStore.user._id}`);

            // 2. Traer el archivo ya procesado del servidor (stream en formato m4a)
            const response = await axios.get(`${API_URL}/api/downloads/${track.videoId}/stream?userId=${authStore.user._id}`, {
                responseType: 'blob' // Es vital pedirlo como BLOB
            });

            // 3. Guardar en IndexedDB
            await dbService.saveDownload({
                videoId: track.videoId,
                title: track.title,
                artist: track.artist || track.uploader,
                thumbnail: track.thumbnail,
                duration: track.duration
            }, response.data);

            await loadDownloads();

        } catch (error) {
            console.error(`Error descargando la canción ${track.videoId}:`, error);
            throw error;
        } finally {
            activeDownloads.value.delete(track.videoId);
        }
    }

    async function removeDownload(videoId) {
        const authStore = useAuthStore();

        try {
            // Borrar de IndexedDB
            await dbService.removeDownload(videoId);

            // Intentar borrar del Backend (para liberar espacio localmente)
            if (authStore.user) {
                axios.delete(`${API_URL}/api/downloads/${videoId}?userId=${authStore.user._id}`).catch(err => {
                    console.warn('No se pudo borrar del backend:', err);
                });
            }

            await loadDownloads();
        } catch (error) {
            console.error(`Error eliminando la canción ${videoId}:`, error);
        }
    }

    return {
        downloadedTracks,
        activeDownloads,
        loadDownloads,
        isDownloaded,
        downloadTrack,
        removeDownload
    };
});
