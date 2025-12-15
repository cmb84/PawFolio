import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: '.',                 // ensure Vite uses this folder as root
  publicDir: 'public',       // default but explicit
  base: '/',                 // important for production routing

  plugins: [react()],

  server: {
    host: '0.0.0.0',         // allow external connections
    port: 7012,              // frontend port
    strictPort: true,

    proxy: {
      '/api': {
        target: 'http://10.0.136.216:5000',    // backend PRIVATE IP inside VPC
        changeOrigin: true,
        secure: false,
      }
    }
  },

  preview: {
    host: '0.0.0.0',
    port: 7012,
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});

