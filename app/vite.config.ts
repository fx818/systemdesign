/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'System Design Quest',
        short_name: 'SD Quest',
        description:
          'A gamified quest that teaches system design: scale PixelPost from zero to millions of users through animated lessons, labs, missions and interview rounds.',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        categories: ['education', 'games'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the app shell; MP4 lessons are big, so they are runtime-cached instead.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: 'index.html',
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\/videos\/[^/]*\.mp4$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'sdq-lesson-videos',
              rangeRequests: true,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 40, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rollupOptions: {
      output: {
        // registry.ts eagerly imports every level, so true per-level lazy loading is not
        // possible from here — instead we split deterministic chunks: vendor libs,
        // per-chapter content, and the heavy sim/quiz engines.
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id) || id.includes('react-router'))
              return 'vendor-react';
            if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils'))
              return 'vendor-motion';
            if (id.includes('@dnd-kit')) return 'vendor-dnd';
            if (id.includes('lucide-react')) return 'vendor-lucide';
            if (id.includes('zustand')) return 'vendor-state';
            return 'vendor';
          }
          if (/[\\/]src[\\/]content[\\/]ch\d+[\\/]/.test(id)) {
            const m = id.match(/[\\/]src[\\/]content[\\/](ch\d+)[\\/]/);
            return m ? m[1] : undefined;
          }
          if (id.includes('/src/sim/') || id.includes('\\src\\sim\\')) return 'sim';
          if (id.includes('/src/quiz/') || id.includes('\\src\\quiz\\')) return 'quiz';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 20000,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
