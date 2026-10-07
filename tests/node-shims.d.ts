/**
 * Types minimaux des modules Node utilisés par les tests du relais (le projet n'embarque pas
 * @types/node : aucune dépendance de plus pour deux fonctions).
 */
declare module 'node:http' {
  export interface Server {
    listen(port: number, host: string, cb?: () => void): Server;
    close(cb?: (err?: Error) => void): Server;
    address(): unknown;
    on(event: string, listener: (...args: unknown[]) => void): Server;
    off(event: string, listener: (...args: unknown[]) => void): Server;
  }
  export function createServer(handler?: (req: unknown, res: { end(body?: string): void }) => void): Server;
}

declare module 'node:net' {
  export interface AddressInfo {
    address: string;
    family: string;
    port: number;
  }
}

declare module 'node:fs' {
  export function existsSync(p: string): boolean;
  export function readFileSync(p: string, encoding: string): string;
  export function readdirSync(p: string): string[];
  export function statSync(p: string): { size: number; isFile(): boolean; isDirectory(): boolean };
  const fs: { existsSync: typeof existsSync; readFileSync: typeof readFileSync; readdirSync: typeof readdirSync; statSync: typeof statSync };
  export default fs;
}

declare module 'node:path' {
  export function join(...parts: string[]): string;
  export function dirname(p: string): string;
  export function resolve(...parts: string[]): string;
  const path: { join: typeof join; dirname: typeof dirname; resolve: typeof resolve };
  export default path;
}

declare const process: { cwd(): string; env: Record<string, string | undefined> };
declare const __dirname: string;
