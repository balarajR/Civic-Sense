import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
  },
  build: {
    // Code-splitting: break monolithic bundle into cacheable vendor chunks
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['motion', 'framer-motion'],
          'vendor-icons': ['lucide-react'],
          'vendor-markdown': ['react-markdown'],
        },
      },
    },
    // Increase chunk warning limit — vendor chunks are expected to be larger
    chunkSizeWarningLimit: 300,
    // Generate source maps for production debugging
    sourcemap: false,
    // Minification
    minify: 'esbuild',
    // Target modern browsers for smaller output
    target: 'es2020',
  },
});
