import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useAuthStore = defineStore('auth', () => {
    const user = ref(JSON.parse(localStorage.getItem('user')) || null);
    const router = useRouter();

    async function login(email, password) {
        try {
            const response = await axios.post(`${API_URL}/api/auth/login`, {
                email,
                password
            });

            if (response.data.success) {
                user.value = response.data.user;
                localStorage.setItem('user', JSON.stringify(user.value));

                // Sincronizar favoritos locales a la nube al iniciar sesión
                const playerStore = (await import('./player')).usePlayerStore();
                playerStore.syncLocalFavorites();

                return { success: true };
            }
        } catch (error) {
            console.error('Error de login:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'No se pudo iniciar sesión'
            };
        }
    }

    function logout() {
        // Detener música al cerrar sesión
        import('./player').then(m => {
            const playerStore = m.usePlayerStore();
            playerStore.cleanup();
        }).catch(() => { });

        user.value = null;
        localStorage.removeItem('user');
        router.push('/login');
    }

    const isAuthenticated = () => {
        return user.value !== null;
    };

    return {
        user,
        login,
        logout,
        isAuthenticated
    };
});
