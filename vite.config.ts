import { defineConfig } from 'vitest/config';
import { attachRelay } from './tools/net-relay.mjs';

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
  // Multijoueur : le relais WebSocket (/net) tourne aussi sur le serveur de dev et d'aperçu.
  plugins: [{
    name: 'neurapolis-net-relay',
    configureServer(server) { if (server.httpServer) attachRelay(server.httpServer as never); },
    configurePreviewServer(server) { if (server.httpServer) attachRelay(server.httpServer as never); },
  }],
});
