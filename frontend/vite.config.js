import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
  host: "0.0.0.0",   // REQUIRED so EC2 can serve externally
  strictPort: true,
  port: 7012,        // or 5173 if you want default
  hmr: {
    host: "YOUR_PUBLIC_IP",
    port: 7012
  },
  proxy: {
    "/api": {
      target: "http://YOUR_PUBLIC_IP:5000",   // backend
      changeOrigin: true
    }
  }
},
  preview: { host: true, port: 7012 }
})
