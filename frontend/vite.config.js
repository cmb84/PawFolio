import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 7012,
    proxy: {
      '/api': {
        target: 'http://100.83.8.45:7013',
        changeOrigin: true,
      }
    }
  },
  preview: { host: true, port: 7012 }
})
