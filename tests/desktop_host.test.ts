/**
 * Application de bureau : l'hôte (desktop/host.cjs, utilisé par desktop/main.cjs) sert la page du
 * jeu et le relais multijoueur, refuse proprement un port déjà pris, et s'arrête.
 */
import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { createHost, hostError } = require('../desktop/host.cjs') as {
  createHost(o: { game: string; relay: string; port?: number; bind?: string }): { start(): Promise<{ port: number; addresses: unknown[] }>; stop(): void; running: boolean };
  hostError(e: unknown, port: number): string;
};

describe('application de bureau : héberger une partie', () => {
  it('sert le jeu et le relais, puis s’arrête', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'neura-host-'));
    const game = join(dir, 'NEURAPOLIS.html');
    writeFileSync(game, '<!doctype html><title>NEURAPOLIS</title>');
    const host = createHost({ game, relay: resolve('tools/net-relay.mjs'), port: 0, bind: '127.0.0.1' });
    const r = await host.start();
    try {
      expect(r.port).toBeGreaterThan(0);
      expect(Array.isArray(r.addresses)).toBe(true);
      const page = await fetch(`http://127.0.0.1:${r.port}/`).then((x) => x.text());
      expect(page).toContain('NEURAPOLIS');
      const ws = new WebSocket(`ws://127.0.0.1:${r.port}/net?room=neurapolis`);
      const welcome = await new Promise<Record<string, unknown>>((ok) => { ws.onmessage = (e) => ok(JSON.parse(String(e.data))); });
      expect(welcome.t).toBe('welcome');
      expect(welcome.port).toBe(r.port);
      ws.close();
      // Un second hôte sur le même port : erreur lisible.
      const other = createHost({ game, relay: resolve('tools/net-relay.mjs'), port: r.port, bind: '127.0.0.1' });
      const err = await other.start().then(() => null, (e: unknown) => e);
      expect(hostError(err, r.port)).toContain('déjà utilisé');
    } finally {
      host.stop();
    }
    expect(host.running).toBe(false);
  });
});
