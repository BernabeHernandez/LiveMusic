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
