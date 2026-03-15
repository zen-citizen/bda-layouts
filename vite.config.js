import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Polyfill Node.js core modules for browser compatibility
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Include specific polyfills needed by shpjs
      include: ['buffer', 'process'],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    // Force pre-bundling of shpjs and its dependencies
    include: ['shpjs', 'buffer'],
  },
  server: {
    port: 5500,
    host: true,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
    hmr: {
      overlay: true,
    },
    // Increase timeout for large file requests
    timeout: 60000, // 60 seconds
  },
})
