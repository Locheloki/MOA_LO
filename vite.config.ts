import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    open: true,
    allowedHosts: 'all',
    watch: {
      ignored: ['**/data/**', '**/server.ts']
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      },
      '/attachments': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      }
    }
  }
});
