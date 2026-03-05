import { openDB } from 'idb';

const DB_NAME = 'LiveMusicDB';
const DB_VERSION = 1;
const STORE_METADATA = 'downloadsMetadata';
const STORE_BLOBS = 'downloadsBlobs';

class DbService {
    constructor() {
        this.dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_METADATA)) {
                    db.createObjectStore(STORE_METADATA, { keyPath: 'videoId' });
                }
                if (!db.objectStoreNames.contains(STORE_BLOBS)) {
                    db.createObjectStore(STORE_BLOBS);
                }
            },
        });
    }

    async saveDownload(trackMetadata, audioBlob) {
        const db = await this.dbPromise;
        const tx = db.transaction([STORE_METADATA, STORE_BLOBS], 'readwrite');

        // Guardar metadata
        await tx.objectStore(STORE_METADATA).put({
            ...trackMetadata,
            downloadedAt: new Date().toISOString()
        });

        // Guardar archivo binario (usando videoId como llave)
        await tx.objectStore(STORE_BLOBS).put(audioBlob, trackMetadata.videoId);

        await tx.done;
        return true;
    }

    async getDownloadMetadata(videoId) {
        const db = await this.dbPromise;
        return await db.transaction(STORE_METADATA).objectStore(STORE_METADATA).get(videoId);
    }

    async getAllDownloads() {
        const db = await this.dbPromise;
        const items = await db.transaction(STORE_METADATA).objectStore(STORE_METADATA).getAll();
        return items.sort((a, b) => new Date(b.downloadedAt) - new Date(a.downloadedAt));
    }

    async getDownloadBlob(videoId) {
        const db = await this.dbPromise;
        return await db.transaction(STORE_BLOBS).objectStore(STORE_BLOBS).get(videoId);
    }

    async removeDownload(videoId) {
        const db = await this.dbPromise;
        const tx = db.transaction([STORE_METADATA, STORE_BLOBS], 'readwrite');

        await tx.objectStore(STORE_METADATA).delete(videoId);
        await tx.objectStore(STORE_BLOBS).delete(videoId);

        await tx.done;
        return true;
    }

    async isDownloaded(videoId) {
        const metadata = await this.getDownloadMetadata(videoId);
        return !!metadata;
    }
}

export const dbService = new DbService();
