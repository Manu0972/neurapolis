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
  export function readFileSync(p: string, encoding?: string): string;
  export function writeFileSync(p: string, data: string, encoding?: string): void;
  export function mkdirSync(p: string, opts?: { recursive?: boolean }): string | undefined;
  export function statSync(p: string): { size: number; isFile(): boolean; isDirectory(): boolean };
  export function readdirSync(p: string, opts?: unknown): string[];
  const fs: {
    existsSync: typeof existsSync;
    readFileSync: typeof readFileSync;
    writeFileSync: typeof writeFileSync;
    mkdirSync: typeof mkdirSync;
    statSync: typeof statSync;
    readdirSync: typeof readdirSync;
  };
  export default fs;
}

declare module 'node:path' {
  export function join(...parts: string[]): string;
  export function dirname(p: string): string;
  export function resolve(...parts: string[]): string;
  export function relative(from: string, to: string): string;
  const path: { join: typeof join; dirname: typeof dirname; resolve: typeof resolve; relative: typeof relative };
  export default path;
}

declare const process: { cwd(): string; env: Record<string, string | undefined>; argv?: string[]; memoryUsage?: () => { heapUsed: number; rss: number } };
declare const __dirname: string;
