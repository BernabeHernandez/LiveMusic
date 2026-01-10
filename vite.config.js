import { fileURLToPath, URL } from 'node:url' // Importación necesaria para manejar rutas
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    vue(), 
    tailwindcss()
  ],
  resolve: {
    alias: {
      // Esto le dice a Vite que '@' equivale a la carpeta 'src'
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
