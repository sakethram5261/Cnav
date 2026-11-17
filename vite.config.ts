import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'brick-facade.svg', 'landmarks/*.svg'],
      manifest: {
        name: 'Which Block Is 34? — LPU Campus Wayfinding',
        short_name: 'Block 34',
        description: 'Verified walking routes, Block 34 floor guide, and class-change timer for LPU.',
        theme_color: '#F3ECDF',
        background_color: '#F3ECDF',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/rest\/v1\/.*/i,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          d3: ['d3-zoom', 'd3-shape'],
          motion: ['motion'],
          search: ['fuse.js']
        }
      }
    }
  }
});
