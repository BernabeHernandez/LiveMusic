import { defineStore } from 'pinia';
import { ref } from 'vue';
import { dbService } from '../services/db.js';
import axios from 'axios';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useDownloadsStore = defineStore('downloads', () => {
    const downloadedTracks = ref([]);
    const activeDownloads = ref(new Set());

    async function loadDownloads() {
        const authStore = useAuthStore();
        if (!authStore.user) {
            downloadedTracks.value = [];
            return;
        }

        try {
            // 1. Cargar lo que hay localmente para rapidez
            const localTracks = await dbService.getAllDownloads();
            downloadedTracks.value = localTracks;

            // 2. Traer la lista del backend (la fuente de la verdad para este usuario)
            console.log(`Buscando descargas para usuario: ${authStore.user._id}`);
            const response = await axios.get(`${API_URL}/api/downloads?userId=${authStore.user._id}`);
            const serverTracks = response.data.downloads || [];
            console.log(`Servidor respondió con ${serverTracks.length} canciones.`);

            // Actualizar la vista con la metadata del servidor inmediatamente
            // Esto asegura que el usuario vea sus canciones aunque el blob tarde en bajar
            downloadedTracks.value = serverTracks;

            // 3. Sincronizar Blobs a IndexedDB en segundo plano
            const localVideoIds = new Set(localTracks.map(t => t.videoId));
            let syncCount = 0;

            for (const serverTrack of serverTracks) {
                if (!localVideoIds.has(serverTrack.videoId)) {
                    console.log(`Sincronizando blob para: ${serverTrack.title}`);
                    try {
                        activeDownloads.value.add(serverTrack.videoId);

                        const fetchUrl = `${API_URL}/api/downloads/${serverTrack.videoId}/stream?userId=${authStore.user._id}`;
                        const streamResponse = await axios.get(fetchUrl, {
                            responseType: 'blob',
                            timeout: 60000 // 60s timeout
                        });

                        await dbService.saveDownload({
                            videoId: serverTrack.videoId,
                            title: serverTrack.title,
                            artist: serverTrack.artist,
                            thumbnail: serverTrack.thumbnail,
                            duration: serverTrack.duration
                        }, streamResponse.data);

                        syncCount++;
                    } catch (syncErr) {
                        console.error(`Error sincronizando blob de ${serverTrack.videoId}:`, syncErr.message);
                    } finally {
                        activeDownloads.value.delete(serverTrack.videoId);
                    }
                }
            }

            // 4. Limpieza de locales huérfanos
            const serverVideoIds = new Set(serverTracks.map(t => t.videoId));
            for (const localTrack of localTracks) {
                if (!serverVideoIds.has(localTrack.videoId)) {
                    console.log(`Borrando local huérfano: ${localTrack.title}`);
                    await dbService.removeDownload(localTrack.videoId);
                }
            }

            if (syncCount > 0) {
                console.log(`Sincronización completada: ${syncCount} blobs nuevos.`);
            }

        } catch (error) {
            console.error('Error al cargar y sincronizar descargas:', error);
            // Fallback a locales si falla la red
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
            const downloadRes = await axios.post(`${API_URL}/api/downloads/${track.videoId}?userId=${authStore.user._id}`);
            const downloadData = downloadRes.data.download;

            // 2. Traer el archivo ya procesado (Usamos el proxy para evitar CORS)
            const fetchUrl = `${API_URL}/api/downloads/${track.videoId}/stream?userId=${authStore.user._id}`;
            console.log(`Obteniendo blob final (Proxy): ${fetchUrl}`);

            const response = await axios.get(fetchUrl, {
                responseType: 'blob',
                timeout: 120000 // 2 min para descargas directas
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
            // 1. Eliminar de IndexedDB local primero para feedback instantáneo UI
            await dbService.removeDownload(videoId);

            // 2. Eliminar del backend (Disco + Cloud + DB) y esperar confirmación
            if (authStore.user) {
                console.log(`Solicitando eliminación al backend para: ${videoId}`);
                await axios.delete(`${API_URL}/api/downloads/${videoId}?userId=${authStore.user._id}`);
            }

            // 3. Recargar lista para estar seguros
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
