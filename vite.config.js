import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  build: {
    chunkSizeWarningLimit: 9999999,
    outDir: './ui/public',
  },
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: {
          host: '216.24.57.3',
          protocol: 'https:',
          port: 9998,
        },
      },
    },
  },
});
