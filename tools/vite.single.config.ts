/**
 * Build « un seul fichier » : tout NEURAPOLIS (code, Three.js, styles, images) dans
 * `NEURAPOLIS.html`, qui s'ouvre d'un double-clic, même sans Internet.
 * Le code source reste organisé en modules : ce build n'est qu'un emballage.
 * Usage (là où se trouve node_modules) : vite build --config tools/vite.single.config.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const ROOT = process.cwd();

/** Images du dossier public/assets en data URI (le rendu 2D de secours en a besoin). */
function embeddedAssets(): Record<string, string> {
  const dir = path.resolve(ROOT, 'public/assets');
  const out: Record<string, string> = {};
  const walk = (d: string): void => {
    let names: string[] = [];
    try { names = fs.readdirSync(d); } catch { return; }
    for (const n of names) {
      const f = path.join(d, n);
      if (fs.statSync(f).isDirectory()) walk(f);
      else if (n.endsWith('.png')) out[path.relative(dir, f).split('\\').join('/')] = `data:image/png;base64,${fs.readFileSync(f, 'base64')}`;
    }
  };
  walk(dir);
  return out;
}

/** Remplace les balises <script src> et <link stylesheet> par leur contenu, puis ne garde que la page. */
function singleFile(): Plugin {
  return {
    name: 'neurapolis-single-file',
    enforce: 'post',
    generateBundle(_opts, bundle) {
      const html = Object.values(bundle).find((f) => f.type === 'asset' && f.fileName.endsWith('.html'));
      if (!html || html.type !== 'asset') return;
      let page = String(html.source);
      const safe = (code: string): string => code.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
      for (const f of Object.values(bundle)) {
        if (f.type === 'chunk') {
          page = page.replace(new RegExp(`<script[^>]*src="[^"]*${f.fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*></script>`), () => '');
          page = page.replace('</body>', () => `<script type="module">${safe(f.code)}</script>\n</body>`);
        } else if (f.fileName.endsWith('.css')) {
          page = page.replace(new RegExp(`<link[^>]*href="[^"]*${f.fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`), () => '');
          page = page.replace('</head>', () => `<style>${String(f.source)}</style>\n</head>`);
        }
      }
      page = page.replace(/<link rel="modulepreload"[^>]*>/g, '');
      const assets = `<script>window.__NEURAPOLIS_ASSETS__=${JSON.stringify(embeddedAssets())};</script>`;
      page = page.replace('</head>', () => `${assets}\n</head>`);
      for (const k of Object.keys(bundle)) delete bundle[k];
      this.emitFile({ type: 'asset', fileName: 'NEURAPOLIS.html', source: page });
    },
  };
}

export default defineConfig({
  root: ROOT,
  base: './',
  publicDir: false,
  resolve: { preserveSymlinks: true },
  plugins: [singleFile()],
  build: {
    outDir: 'dist-single',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    modulePreload: false,
    chunkSizeWarningLimit: 10_000,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
