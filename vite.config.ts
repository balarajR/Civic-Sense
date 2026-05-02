import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type PluginOption } from 'vite';

function buildCsp(mode: string): string {
  const scriptSrc =
    mode === 'production'
      ? "script-src 'self' https://maps.googleapis.com"
      : "script-src 'self' 'unsafe-inline' https://maps.googleapis.com";

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://*.googleapis.com https://*.google.com https://*.gstatic.com",
    "frame-src 'self' https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "connect-src 'self' https://*.googleapis.com https://api.data.gov.in https://www.google.com ws: wss:",
  ].join('; ');
}

function contentSecurityPolicyPlugin(mode: string): PluginOption {
  return {
    name: 'civicsense-csp',
    transformIndexHtml(html) {
      const metaTag = `<meta http-equiv="Content-Security-Policy" content="${buildCsp(mode)}" />`;
      return html.replace('<!-- CSP_PLACEHOLDER -->', metaTag);
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [contentSecurityPolicyPlugin(mode), react(), tailwindcss()],
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
}));
