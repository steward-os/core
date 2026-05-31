import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

let commitHash = 'dev';
try { commitHash = execSync('git rev-parse --short HEAD').toString().trim(); } catch (_) {}

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:8090',
      '/manifest.json': 'http://localhost:8090',
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(new Date().toISOString()),
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  optimizeDeps: {
    include: ['mjml-browser'],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-mjml': ['mjml-browser'],
'vendor-pdf': ['jspdf', 'jszip', 'xlsx'],
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(), // Add as a Vite plugin, not PostCSS
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        swDest: 'dist/sw.js',
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MiB
      },
      devOptions: {
        enabled: true,
        type: 'module'
      },
      manifest: false,
      includeAssets: [
        'favicon.ico',
        'robots.txt',
        'icon-192.png',
        'icon-512.png',
        'badge.png',
      ],
    }),
  ],
});