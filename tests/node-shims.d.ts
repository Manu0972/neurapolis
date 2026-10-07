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
