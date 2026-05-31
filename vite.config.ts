import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND_ORIGIN = 'http://localhost:8000';
const BACKEND_API_V1 = `${BACKEND_ORIGIN}/api/v1`;

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/v1': {
        target: BACKEND_API_V1,
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/v1/, '')
      },
      '/api': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
        secure: true
      },
      '/health': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
        secure: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020'
  }
});
