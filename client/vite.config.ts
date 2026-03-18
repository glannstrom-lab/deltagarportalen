import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression2'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
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
          'vendor-data': ['zustand'],
          
          // Backend integration - split to reduce main bundle
          'vendor-supabase': ['@supabase/supabase-js'],
          
          // Form validation
          'vendor-forms': ['zod'],
          
          // PDF generation - heavy, only needed for CV/PB pages
          'vendor-pdf': ['jspdf', 'html2canvas'],
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
        drop_console: true,
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
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'zod',
      'zustand',
    ],
  },
}))
