import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Reading Buddy',
        short_name: 'ReadingBuddy',
        description: 'Phonics learning for little readers',
        theme_color: '#4a90d9',
        background_color: '#e8f4fc',
        display: 'fullscreen',
        orientation: 'landscape',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3}'],
      },
    }),
  ],
  server: {
    proxy: {
      '/api/tts': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
