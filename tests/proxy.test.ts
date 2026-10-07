/**
 * Le prête-nom : un adulte signe pour le joueur mineur ; les limites d'âge des affaires tombent,
 * contre une commission sur les bénéfices (ou la confiance des parents).
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { ensureAscension, ideaStatus } from '../src/simulation/ascension';
import { econAge, mandateActive, mandateBlockers, mandateDay, signMandate } from '../src/simulation/proxy';
import { leaseEligibility } from '../src/simulation/economy';
import { CITY } from '../src/data/map';

function trustedKid() {
  const w = createWorld();
  w.player.money = 1000;
  w.flags['ventes'] = 25;
  w.family!.parents.nora.trust = 75;
  w.family!.parents.thierry.trust = 70;
  return w;
}

describe('prête-nom', () => {
  it('à 12 ans sans mandat, les affaires d’adulte restent fermées', () => {
    const w = createWorld();
    expect(econAge(w)).toBe(12);
    ensureAscension(w).tier = 3;
    expect(ideaStatus(w, 'agence_immobiliere').reasons.join(' ')).toContain('prête-nom');
  });

  it('la SAS familiale : il faut la confiance des parents et une preuve, puis tout s’ouvre', () => {
    const fresh = createWorld();
    expect(mandateBlockers(fresh, 'parents').length).toBeGreaterThan(0);
    const w = trustedKid();
    expect(mandateBlockers(w, 'parents')).toEqual([]);
    const r = signMandate(w, 'parents', 0);
    expect(r.ok).toBe(true);
    expect(w.player.money).toBe(750);
    expect(econAge(w)).toBe(18);
    ensureAscension(w).tier = 3;
    expect(ideaStatus(w, 'agence_immobiliere').reasons.join(' ')).not.toContain('ans');
    const unit = CITY.units.find((u) => !u.buildingId.startsWith('etal_') && u.district === 'centre')!;
    expect(leaseEligibility(w, unit.id).coSigner).toBeNull();
  });

  it('la signature des parents tombe si leur confiance s’effondre, et revient avec elle', () => {
    const w = trustedKid();
    signMandate(w, 'parents', 0);
    w.family!.parents.nora.trust = 20;
    w.family!.parents.thierry.trust = 20;
    expect(mandateActive(w)).toBe(false);
    expect(econAge(w)).toBe(12);
    expect(mandateDay(w, 0).some((n) => n.kind === 'alerte')).toBe(true);
    w.family!.parents.nora.trust = 60;
    w.family!.parents.thierry.trust = 60;
    expect(mandateDay(w, 0).some((n) => n.kind === 'bien')).toBe(true);
  });

  it('Mme Bertin prend 10 % des bénéfices nouveaux, chaque jour', () => {
    const w = createWorld();
    w.player.money = 2000;
    expect(mandateBlockers(w, 'bertin').join(' ')).toContain('connexions');
    ensureAscension(w).contacts['bertin'] = 0;
    expect(signMandate(w, 'bertin', 500).ok).toBe(true);
    mandateDay(w, 1500); // +1 000 € de bénéfices
    expect(w.player.money).toBe(1900);
    mandateDay(w, 1200); // une perte : rien à prélever
    expect(w.player.money).toBe(1900);
    expect(w.flags['mandatCommissions']).toBe(100);
  });
});
