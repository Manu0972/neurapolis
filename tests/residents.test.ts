/**
 * Habitants nommés des nouveaux quartiers (AG-3) : une place sur le trottoir de leur rue, des
 * heures de présence, une réplique et une rumeur par jour (indice de secret à la clé).
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { RESIDENTS } from '../src/data/residents/residents';
import { areaAt } from '../src/data/city/layout';
import { isWalkable } from '../src/data/map';
import { ensureAscension } from '../src/simulation/ascension';
import { residentNear, residentSpot, residentsPresent, talkToResident } from '../src/simulation/residents';

describe('habitants des quartiers', () => {
  it('chacun a une place praticable dans son quartier', () => {
    for (const r of RESIDENTS) {
      const s = residentSpot(r);
      expect(s, r.id).not.toBeNull();
      expect(isWalkable(s!.x, s!.y)).toBe(true);
      expect(areaAt(s!.x, s!.y).id, r.id).toBe(r.district);
    }
  });

  it('n’apparaissent que dans les quartiers ouverts', () => {
    const w = createWorld();
    w.time.tick = Math.floor(w.time.tick / 144) * 144 + 6 * 14; // 14 h
    expect(residentsPresent(w)).toHaveLength(0);
    w.economy!.sandbox = true;
    expect(residentsPresent(w).length).toBeGreaterThan(10);
  });

  it('une rumeur par jour et par habitant ; on les trouve à portée de voix', () => {
    const w = createWorld();
    ensureAscension(w).tier = 6;
    w.time.tick = Math.floor(w.time.tick / 144) * 144 + 6 * 14;
    const here = residentsPresent(w)[0]!;
    w.player.pos = { x: here.x, y: here.y };
    expect(residentNear(w)?.id).toBe(here.def.id);
    const a = talkToResident(w, here.def.id);
    expect(a.line.length).toBeGreaterThan(0);
    expect(a.rumor).toBeDefined();
    expect(talkToResident(w, here.def.id).rumor).toBeUndefined();
  });
});

import { askParentsHelp, emergencyHelpStatus, ensureFamily } from '../src/simulation/family';

describe('coup de pouce des parents', () => {
  it('à 0 €, ils dépannent selon leur confiance, une fois tous les 14 jours, et ça coûte de la confiance', () => {
    const w = createWorld();
    w.player.money = 50;
    expect(emergencyHelpStatus(w).available).toBe(false);
    w.player.money = 0;
    const f = ensureFamily(w);
    f.parents.nora.trust = 70;
    f.parents.thierry.trust = 70;
    expect(emergencyHelpStatus(w).amount).toBe(40);
    expect(askParentsHelp(w).ok).toBe(true);
    expect(w.player.money).toBe(40);
    expect(f.parents.nora.trust).toBe(64);
    w.player.money = 0;
    expect(askParentsHelp(w).ok).toBe(false);
    w.time.tick += 15 * 144;
    f.parents.nora.trust = 30;
    f.parents.thierry.trust = 30;
    expect(emergencyHelpStatus(w).reason).toContain('Confiance');
  });
});
