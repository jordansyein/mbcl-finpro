import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { config as loadDotenv } from 'dotenv'
import apiDevPlugin from './vite-api-plugin'

// Load .env into process.env so local API routes (api/*.ts) can read
// ANTHROPIC_API_KEY etc. the same way they will on Vercel.
loadDotenv()

export default defineConfig({
  plugins: [
    react(),
    apiDevPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'SenpAI — Japanese lesson continuity',
        short_name: 'SenpAI',
        description: 'Capture Japanese lessons, drill them with spaced repetition, and walk in prepared.',
        theme_color: '#1f2933',
        background_color: '#0f1720',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icons/icon.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  server: {
    host: true,
  },
})
