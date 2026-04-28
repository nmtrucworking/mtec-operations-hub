import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Development server configuration
    proxy: {
      // Proxy API calls to backend during development
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path
      },
      '/health': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  build: {
    // Ensure environment variables are properly handled in production build
    outDir: 'dist',
    sourcemap: false,
    // Optimize for modern browsers
    target: 'es2020'
  }
});
