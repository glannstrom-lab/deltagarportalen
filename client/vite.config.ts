import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression2'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

/**
 * Mock API plugin for local development
 * Handles /api/* routes that normally run as Vercel serverless functions
 */
function mockApiPlugin(): Plugin {
  return {
    name: 'mock-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Only handle API routes in development
        if (!req.url?.startsWith('/api/')) {
          return next()
        }

        // Mock /api/upload-image - returns a data URL from the uploaded file
        if (req.url.startsWith('/api/upload-image') && req.method === 'POST') {
          const chunks: Buffer[] = []

          req.on('data', (chunk) => chunks.push(chunk))
          req.on('end', () => {
            const buffer = Buffer.concat(chunks)
            const contentType = req.headers['content-type'] || 'image/jpeg'
            const base64 = buffer.toString('base64')
            const dataUrl = `data:${contentType};base64,${base64}`

            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(JSON.stringify({ url: dataUrl }))
          })
          return
        }

        // Mock /api/test
        if (req.url === '/api/test') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true, time: Date.now(), mode: 'development' }))
          return
        }

        // For other API routes, return 501 Not Implemented in dev mode
        if (req.url.startsWith('/api/')) {
          res.statusCode = 501
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            error: 'API not available in development mode',
            hint: 'Use "vercel dev" or deploy to Vercel for full API support'
          }))
          return
        }

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Mock API endpoints in development
    mockApiPlugin(),
    // Optimize images during build (PNG compression, WebP generation)
    ViteImageOptimizer({
      png: {
        quality: 80,
      },
      jpeg: {
        quality: 80,
      },
      webp: {
        lossless: false,
        quality: 80,
      },
    }),
    // Enable gzip compression for assets
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // Only compress files > 1KB
      deleteOriginFile: false,
    }),
    // Enable brotli compression for better compression ratios
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false,
    }),
    // Bundle visualizer (only in analyze mode)
    mode === 'analyze' && visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ].filter(Boolean),
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    // Optimize chunk size
    chunkSizeWarningLimit: 500,
    // Stäng av automatisk modulepreload helt. Anledning: Vite skulle annars
    // injicera <link rel="modulepreload"> för chunken som innehåller
    // __vitePreload-helpern — och Rollup placerar helpern i en av
    // manualChunks (i vårt fall vendor-jspdf på 411 KB). Resultatet blev
    // att en stor vendor-chunk preloadades på varje sidladdning trots att
    // koden själv är lazy-importerad. Browsers laddar fortfarande
    // dependencies normalt, bara utan den preload-hinten.
    modulePreload: false,
    rollupOptions: {
      output: {
        // Manual chunk splitting för bättre cache + LCP.
        // OBS: Function-form används istället för object-form. Object-form
        // gör att Rollup placerar Vites `__vitePreload`-helper i den största
        // chunken som behöver den — vilket tidigare hamnade i vendor-pdf.
        // Resultatet: vendor-pdf (2.1 MB) blev statisk dependency av entry
        // och modulepreloadades på varje sidladdning trots att PDF-koden är
        // lazy-importerad. Function-form undviker detta.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          // PDF-libs — split per lib så cache kan stabiliseras separat
          if (id.includes('/node_modules/jspdf/') || id.includes('/node_modules/jspdf-autotable/')) {
            return 'vendor-jspdf'
          }
          if (id.includes('/node_modules/@react-pdf/')) {
            return 'vendor-react-pdf'
          }
          if (id.includes('/node_modules/html2canvas/')) {
            return 'vendor-html2canvas'
          }

          // Animation library — tung, kan lazy-loadas
          if (id.includes('/node_modules/framer-motion/')) {
            return 'vendor-animation'
          }

          // Core React
          if (id.includes('/node_modules/react/') ||
              id.includes('/node_modules/react-dom/') ||
              id.includes('/node_modules/scheduler/')) {
            return 'vendor-react'
          }

          // Routing
          if (id.includes('/node_modules/react-router') ||
              id.includes('/node_modules/@remix-run/')) {
            return 'vendor-router'
          }

          // State & data fetching
          if (id.includes('/node_modules/@tanstack/react-query')) {
            return 'vendor-query'
          }
          if (id.includes('/node_modules/zustand/')) {
            return 'vendor-state'
          }

          // Backend
          if (id.includes('/node_modules/@supabase/')) {
            return 'vendor-supabase'
          }

          // Form validation
          if (id.includes('/node_modules/zod/')) {
            return 'vendor-forms'
          }

          // lucide-react INTE i manualChunks — låt tree-shaking köra via icons.ts-barrel.
          // Övriga node_modules: låt Rollup besluta automatiskt.
          return undefined
        },
        // Asset naming for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || []
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff?|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`
          }
          if (/woff2?|ttf|otf|eot/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        // Chunk naming - place all JS in assets folder for consistency
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        // Strip debug-loggar i produktion (586 console.* i src/, ~50KB).
        // Behåll console.error och console.warn för fältdiagnostik.
        drop_console: false,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
      },
      format: {
        comments: false,
      },
    },
    // CSS optimization
    cssMinify: true,
    // Source maps for production debugging (can be disabled for smaller builds)
    sourcemap: mode !== 'production',
  },
  // Optimize dependencies - pre-bundle for faster dev server startup
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'zod',
      'zustand',
      'lucide-react',
    ],
    // Exkludera tunga bibliotek som laddas dynamiskt.
    // OBS: @react-pdf/renderer FÅR INTE exkluderas — då bryter Vites dev-server
    // dess CommonJS-dep base64-js (saknar default-export). Vi vill att Vite
    // förbundlar det till ESM så den dynamiska importen i PDFExportButton funkar.
    exclude: ['jspdf', 'jspdf-autotable'],
  },
}))
