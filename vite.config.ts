import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  server: { port: 5173, host: true },
  build: {
    // Three.js dans son propre fichier : mis en cache séparément du code du jeu,
    // qui change à chaque version.
    rollupOptions: {
      output: {
        manualChunks: { three: ['three'] },
      },
    },
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
