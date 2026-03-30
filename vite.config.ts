import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// https://vite.dev/config/
// Deploy under a subpath (e.g. Mini App at https://app.example.com/mini/): set base: '/mini/'
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        mobile: resolve(__dirname, 'index-mobile.html'),
      },
    },
  },
});
