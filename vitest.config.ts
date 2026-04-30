import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Dedicated Vitest config, separate from vite.config.ts (which manages the build).
 * This avoids the @tailwindcss/vite plugin from loading during test runs.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/test/**', 'src/vite-env.d.ts'],
    },
  },
});
