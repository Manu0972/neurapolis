import type { Server } from 'node:http';

/** Codes de fermeture propres au relais (salon plein, trop de salons, débit). */
export const CLOSE: { plein: number; salons: number; debit: number };

/** Adresses IPv4 du serveur sur le réseau local. */
export function lanAddresses(): string[];

/** Relais WebSocket du multijoueur (voir net-relay.mjs). */
export function attachRelay(
  server: Server,
  opts?: { path?: string; log?: (message: string) => void; maxPlayers?: number; maxRooms?: number },
): { rooms(): { room: string; players: number }[]; close(): void };
