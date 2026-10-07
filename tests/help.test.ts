/**
 * Aide en jeu (V1.1, lot A) : chaque élément annoté a sa fiche, chaque fiche de fenêtre
 * correspond à une vraie fenêtre, et aucune fiche n'est vide.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CONTROL_HELP, SCREEN_HELP } from '../src/data/help/controls';
import { NAV_LABELS, NEED_IDS } from '../src/presentation/ui';
import { PACES } from '../src/presentation/time-pace';

const src = (rel: string): string => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');

describe('aide des boutons', () => {
  it('chaque identifiant écrit en dur dans l’interface a sa fiche', () => {
    const literal = [...src('src/presentation/ui.ts').matchAll(/help\(\w+, '([^']+)'\)/g)].map((m) => m[1]!);
    const game = [...src('src/presentation/game.ts').matchAll(/setHelp\(\w+, '([^']+)'\)/g)].map((m) => m[1]!);
    const ids = [
      ...literal,
      ...game,
      'help-btn',
      ...NEED_IDS.map((id) => `need:${id}`),
      ...PACES.map((p) => `pace:${p.id}`),
      ...NAV_LABELS.map((l) => `nav:${l}`),
    ];
    expect(literal.length).toBeGreaterThan(15);
    const missing = ids.filter((id) => !CONTROL_HELP[id]);
    expect(missing).toEqual([]);
  });

  it('chaque fiche de fenêtre porte le titre exact d’une fenêtre du jeu', () => {
    const dir = path.join(process.cwd(), 'src/presentation');
    const all = fs.readdirSync(dir).filter((f) => f.endsWith('.ts')).map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
    const titles = new Set([...all.matchAll(/showModal\(\s*'([^']+)'/g)].map((m) => m[1]!));
    const unknown = Object.keys(SCREEN_HELP).filter((t) => !titles.has(t));
    expect(unknown).toEqual([]);
  });

  it('aucune fiche vide', () => {
    for (const e of [...Object.values(CONTROL_HELP), ...Object.values(SCREEN_HELP)]) {
      expect(e.title.trim().length).toBeGreaterThan(2);
      expect(e.body.trim().length).toBeGreaterThan(20);
    }
  });
});
