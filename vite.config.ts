import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3334,
    proxy: {
      '/api': {
        target: 'http://localhost:3335',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3335',
        ws: true,
      },
    },
  },
})
