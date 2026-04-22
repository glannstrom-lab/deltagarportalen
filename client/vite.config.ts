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
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Core vendor chunks - most stable
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],

          // Data fetching and state management
          'vendor-query': ['@tanstack/react-query'],
          'vendor-state': ['zustand'],

          // Backend integration - split to reduce main bundle
          'vendor-supabase': ['@supabase/supabase-js'],

          // Form validation
          'vendor-forms': ['zod'],

          // PDF generation - heavy, only needed for CV export (dynamiskt laddad)
          'vendor-pdf': ['jspdf', 'jspdf-autotable', 'html2canvas', '@react-pdf/renderer'],

          // Animation library - heavy, kan lazy-loadas
          'vendor-animation': ['framer-motion'],

          // NOTE: lucide-react is NOT in manualChunks to enable proper tree-shaking
          // Only the icons imported in icons.ts barrel will be included
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
        // TEMPORARILY ENABLED for debugging white screen issue
        drop_console: false,
        drop_debugger: true,
        // pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
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
    // Exkludera tunga bibliotek som laddas dynamiskt
    exclude: ['jspdf', 'jspdf-autotable', '@react-pdf/renderer'],
  },
}))
