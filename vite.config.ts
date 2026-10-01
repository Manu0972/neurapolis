import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  server: { port: 5173, host: true },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
