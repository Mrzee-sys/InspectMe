import { defineConfig, createLogger } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const logger = createLogger()
const originalWarn = logger.warn.bind(logger)
logger.warn = (msg, options) => {
  if (msg.includes('Gradient has outdated direction syntax')) return
  originalWarn(msg, options)
}

// https://vite.dev/config/
export default defineConfig({
  customLogger: logger,
  appType: 'spa', // <--- Ensures all routes fallback to index.html on hard refresh
  server: {
    port: 5173,
    host: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'InspectMe',
        short_name: 'InspectMe',
        description: 'Mobile-first inspection management application',
        theme_color: '#0d9488',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        navigateFallback: '/index.html',
      },
      devOptions: {
        enabled: true,
        suppressWarnings: true,
      },
    }),
  ],
})
