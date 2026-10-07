import type { Server } from 'node:http';

/** Relais WebSocket du multijoueur (voir net-relay.mjs). */
export function attachRelay(
  server: Server,
  opts?: { path?: string; log?: (message: string) => void },
): { rooms(): { room: string; players: number }[]; close(): void };
