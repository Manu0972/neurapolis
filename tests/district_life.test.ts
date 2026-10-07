/**
 * Vie des nouveaux quartiers : lieux remarquables (hôpital, lycée, stade, cimetière, brasserie)
 * avec portes, horaires et activités ; commerçants des quartiers installés comme concurrents.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY } from '../src/core/types';
import { dateOf, dayIndexOf } from '../src/core/clock';
import { LANDMARKS } from '../src/data/city/landmarks';
import { DISTRICT_SHOPS } from '../src/data/city/district_shops';
import { COMPETITORS } from '../src/data/city/competitors';
import { CITY, isWalkable, landmarkAt } from '../src/data/map';
import { activityBlocker, doLandmarkActivity, landmarkAdjacent } from '../src/simulation/landmarks';
import { ensureFamily } from '../src/simulation/family';
import { signMandate } from '../src/simulation/proxy';

/** Monde placé un jour donné (0 = dimanche … 6 = samedi) à une heure donnée. */
function at(weekday: number, hour: number, minute = 0) {
  const w = createWorld();
  let day = dayIndexOf(w.time.tick) + 1;
  while (dateOf(day).weekday !== weekday) day++;
  w.time.tick = day * TICKS_PER_DAY + Math.floor((hour * 60 + minute) / 10);
  w.player.money = 100;
  return w;
}

describe('lieux remarquables', () => {
  it('chaque lieu a une porte praticable sur la carte, devant un sol praticable', () => {
    for (const lm of LANDMARKS) {
      const b = CITY.buildings.find((x) => x.id === lm.buildingId);
      expect(b, lm.id).toBeDefined();
      const d = b!.doors[0]!;
      expect(landmarkAt(d.x, d.y)).toBe(lm.id);
      const out = d.face === 'n' ? { x: d.x, y: d.y - 1 } : d.face === 's' ? { x: d.x, y: d.y + 1 } : d.face === 'w' ? { x: d.x - 1, y: d.y } : { x: d.x + 1, y: d.y };
      expect(isWalkable(out.x, out.y), `${lm.id} devant la porte`).toBe(true);
      const w = createWorld();
      w.player.pos = out;
      expect(landmarkAdjacent(w)?.id).toBe(lm.id);
    }
  });

  it('respecte les horaires et le « une fois par jour »', () => {
    const w = at(2, 10); // mardi 10 h
    const lm = LANDMARKS.find((l) => l.id === 'hopital')!;
    const nora = lm.activities.find((a) => a.id === 'h_nora')!;
    expect(activityBlocker(w, nora)).toContain('De 18 h');
    const r = doLandmarkActivity(w, 'hopital', 'h_benevolat');
    expect(r.ok).toBe(true);
    expect(r.minutes).toBe(120);
    expect(doLandmarkActivity(w, 'hopital', 'h_benevolat').message).toContain('Déjà fait');
  });

  it('apporter un repas à Nora rassure les parents ; le club d’économie apprend un concept', () => {
    const w = at(2, 19);
    const before = ensureFamily(w).parents.nora.trust;
    expect(doLandmarkActivity(w, 'hopital', 'h_nora').ok).toBe(true);
    expect(ensureFamily(w).parents.nora.trust).toBeGreaterThan(before);
    const wed = at(3, 14);
    expect(doLandmarkActivity(wed, 'lycee', 'l_club_eco').ok).toBe(true);
    expect(wed.ascension?.concepts['asymetrie_information']).toBeDefined();
  });

  it('la buvette du stade paie le samedi ; les drêches demandent 16 ans ou un prête-nom', () => {
    const sat = at(6, 14);
    const m0 = sat.player.money;
    expect(doLandmarkActivity(sat, 'stade', 's_buvette').ok).toBe(true);
    expect(sat.player.money).toBeGreaterThan(m0 + 30);
    const mon = at(1, 10);
    expect(doLandmarkActivity(mon, 'brasserie', 'b_dreches').message).toContain('prête-nom');
    mon.family!.parents.nora.trust = 80;
    mon.family!.parents.thierry.trust = 80;
    mon.flags['ventes'] = 30;
    mon.player.money = 500;
    expect(signMandate(mon, 'parents', 0).ok).toBe(true);
    expect(doLandmarkActivity(mon, 'brasserie', 'b_dreches').ok).toBe(true);
  });
});

describe('commerçants des nouveaux quartiers', () => {
  it('chacun tient un local de son quartier, sans doublon', () => {
    const district = COMPETITORS.filter((c) => DISTRICT_SHOPS.some((s) => `concurrent_${s.id}` === c.id));
    expect(district.length).toBe(DISTRICT_SHOPS.length);
    expect(new Set(COMPETITORS.map((c) => c.unitId)).size).toBe(COMPETITORS.length);
    for (const c of district) {
      const def = DISTRICT_SHOPS.find((s) => `concurrent_${s.id}` === c.id)!;
      expect(c.unitId.startsWith(`${def.district}_`)).toBe(true);
    }
  });
});
