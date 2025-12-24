import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // eslint-disable-next-line no-undef
      '@': path.resolve(__dirname, 'src'), // 配置@别名（可选，不影响连接）
    },
  },
  server: {
    port: 5173, // 前端端口（默认即可）
    proxy: {
      // 核心：代理/api开头的请求到后端
      '/api': {
        target: 'http://localhost:8080', // 后端服务地址（和Swagger一致）
        changeOrigin: true, // 开启跨域
        // 禁止添加rewrite（保留/api前缀，和后端context-path一致）
      },
    },
  },
})
