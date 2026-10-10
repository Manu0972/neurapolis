/**
 * Types minimaux des modules Node utilisés par les tests et outils (le projet n'embarque pas
 * @types/node pour respecter l'invariant d'absence de dépendances inutiles).
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

declare module 'child_process' {
  export function execSync(cmd: string, options?: { encoding?: string; maxBuffer?: number; stdio?: unknown }): string;
}

declare module 'fs' {
  export function existsSync(p: string): boolean;
  export function readFileSync(p: string, encoding: string): string;
  export function writeFileSync(p: string, content: string, encoding?: string): void;
  export function mkdirSync(p: string, options?: { recursive?: boolean }): void;
  export function statSync(p: string): { size: number; isFile(): boolean; isDirectory(): boolean };
}

declare module 'node:fs' {
  export function existsSync(p: string): boolean;
  export function readFileSync(p: string, encoding: string): string;
  export function writeFileSync(p: string, content: string, encoding?: string): void;
  export function mkdirSync(p: string, options?: { recursive?: boolean }): void;
  export function statSync(p: string): { size: number; isFile(): boolean; isDirectory(): boolean };
  const fs: { existsSync: typeof existsSync; readFileSync: typeof readFileSync; statSync: typeof statSync };
  export default fs;
}

declare module 'path' {
  export function join(...parts: string[]): string;
  export function dirname(p: string): string;
  export function extname(p: string): string;
  export function resolve(...parts: string[]): string;
}

declare module 'node:path' {
  export function join(...parts: string[]): string;
  export function dirname(p: string): string;
  export function extname(p: string): string;
  export function resolve(...parts: string[]): string;
  const path: { join: typeof join; dirname: typeof dirname; resolve: typeof resolve; extname: typeof extname };
  export default path;
}

declare const process: {
  cwd(): string;
  env: Record<string, string | undefined>;
  argv: string[];
};
declare const __dirname: string;
