import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 后端地址（context-path=/api）
        changeOrigin: true, // 关键：伪造源，让后端认为是同域
        rewrite: (path) => path.replace(/^\/api/, ''), // 剥离/api前缀（后端已带context-path）
      },
    },
    hmr: { overlay: false },
  },
})
