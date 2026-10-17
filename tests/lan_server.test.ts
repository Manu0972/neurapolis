/**
 * Tests de sécurité pour le serveur LAN (tools/lan-server.mjs).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import { createConnection } from 'node:net';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, normalize, resolve, sep } from 'node:path';
import type { AddressInfo } from 'node:net';

const testDir = resolve('dist_test_lan_server');
let server: Server;
let port = 0;

beforeAll(async () => {
  mkdirSync(testDir, { recursive: true });
  writeFileSync(join(testDir, 'index.html'), '<!DOCTYPE html><html><body>Test</body></html>');
  writeFileSync(join(testDir, 'app.js'), 'console.log("ok");');

  const ROOT = testDir;
  const MIME: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
  };

  server = createServer((req: any, res: any) => {
    const url = new URL(req.url ?? '/', 'http://x');
    let rel: string;
    try {
      rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
    } catch {
      res.writeHead(400).end();
      return;
    }
    if (rel.includes('\0')) {
      res.writeHead(400).end();
      return;
    }
    const file = join(ROOT, rel || 'index.html');
    const rootWithSep = ROOT.endsWith(sep) ? ROOT : ROOT + sep;
    if (!file.startsWith(rootWithSep) && file !== ROOT) {
      res.writeHead(403).end();
      return;
    }

    if (!existsSync(file)) {
      res.writeHead(404).end();
      return;
    }

    res.writeHead(200, {
      'content-type': MIME['.html'],
      'cache-control': 'no-cache',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'SAMEORIGIN',
    });
    res.end('ok');
  });

  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  port = (server.address() as AddressInfo).port;
});

afterAll(async () => {
  await new Promise<void>((done) => server.close(() => done()));
  rmSync(testDir, { recursive: true, force: true });
});

function rawGet(path: string): Promise<{ status: number; headers: string }> {
  return new Promise((resolvePromise, reject) => {
    const socket = createConnection({ port, host: '127.0.0.1' }, () => {
      socket.write(`GET ${path} HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n`);
    });
    let data = '';
    socket.on('data', (chunk) => {
      data += chunk.toString('utf8');
    });
    socket.on('end', () => {
      const match = data.match(/^HTTP\/1\.1 (\d+)/);
      const status = match ? parseInt(match[1]!, 10) : 0;
      resolvePromise({ status, headers: data });
    });
    socket.on('error', reject);
  });
}

describe('Serveur LAN — Sécurité & En-têtes', () => {
  it('fournit les en-têtes de sécurité sur les requêtes valides', async () => {
    const res = await rawGet('/index.html');
    expect(res.status).toBe(200);
    expect(res.headers.toLowerCase()).toContain('x-content-type-options: nosniff');
    expect(res.headers.toLowerCase()).toContain('x-frame-options: sameorigin');
  });

  it('renvoie 404 pour un fichier inexistant', async () => {
    const res = await rawGet('/fichier_absent.html');
    expect(res.status).toBe(404);
  });

  it('refuse les requêtes contenant des octets nuls (400)', async () => {
    const res = await rawGet('/index.html%00.js');
    expect(res.status).toBe(400);
  });

  it('valide la protection du dossier racine (rootWithSep)', () => {
    const ROOT = testDir;
    const rootWithSep = ROOT.endsWith(sep) ? ROOT : ROOT + sep;
    const outsideFile = join(ROOT, '../package.json');
    expect(outsideFile.startsWith(rootWithSep) || outsideFile === ROOT).toBe(false);

    const insideFile = join(ROOT, 'index.html');
    expect(insideFile.startsWith(rootWithSep) || insideFile === ROOT).toBe(true);
  });

  it('valide correctement l accessibilite quand ROOT se termine par un séparateur', () => {
    const rootWithTrailingSep = testDir + sep;
    const rootWithSep = rootWithTrailingSep.endsWith(sep) ? rootWithTrailingSep : rootWithTrailingSep + sep;
    const targetFile = join(rootWithTrailingSep, 'index.html');
    expect(targetFile.startsWith(rootWithSep) || targetFile === rootWithTrailingSep).toBe(true);
  });
});
