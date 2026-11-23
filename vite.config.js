import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const base = process.env.AGENDA_BASE || '/'
const cleanBase = base.endsWith('/') ? base : base + '/'
const shouldMinify =
  process.env.VITE_MINIFY !== undefined
    ? process.env.VITE_MINIFY !== 'false'
    : process.platform !== 'win32'

export default defineConfig({
  // base configurable: dev en "/", despliegue integrado opcional
  base: cleanBase,
  build: {
    target: 'esnext',
    // En Linux/producción minifica con esbuild; en Windows se puede desactivar por defecto para evitar bloqueo %TEMP% de esbuild
    minify: shouldMinify ? 'esbuild' : false,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'favicon.ico', 'apple-touch-icon.png', 'logo.png'],
      manifest: {
        name: 'Agenda Sami',
        short_name: 'Agenda Sami',
        lang: 'es',
        description: 'Centro de organización personal para universidad, trabajo y vida cotidiana',
        theme_color: '#4c6ef5',
        background_color: '#f8f9fc',
        display: 'standalone',
        scope: cleanBase,
        start_url: cleanBase,
        icons: [
          {
            src: `${cleanBase}pwa-192x192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${cleanBase}pwa-512x512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${cleanBase}pwa-512x512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Nunca interceptar /api ni /api/* ni descargas de backup con index.html
        navigateFallbackDenylist: [/^\/api(\/|$)/],
        // Nunca cachear respuestas privadas de API ni backups
        runtimeCaching: [],
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        globIgnores: [
          '**/sprites-backup-*/**',
          '**/sprites/preview.html',
          '**/logo.app.jpg',
          '**/vite.svg',
        ],
      },
    }),
  ],
})
