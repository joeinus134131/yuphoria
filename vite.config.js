import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        // landing page is the root — served at /
        main:      resolve(__dirname, 'index.html'),
        // photobooth Vue app — served at /photobooth.html
        photobooth: resolve(__dirname, 'photobooth.html'),
      }
    }
  }
})
