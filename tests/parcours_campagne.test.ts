/**
 * Parcours complet de la campagne (12 → 16 ans) par un joueur scripté « appliqué » : il tient
 * son stand toute l'année. Voir tests/parcours/joueur-scripte.ts.
 */
import { describe, expect, it } from 'vitest';
import { PLACE_ANCHORS } from '../src/data/map';
import { NPCS } from '../src/data/npcs';
import { lieuxAtteignables } from './parcours/joueur-scripte';
import { grainesSupplementaires, verifierParcours } from './parcours/verifier';

const LONG = 300_000;

describe('parcours de campagne — lieux et PNJ des objectifs', () => {
  it('chaque lieu exigé par un objectif existe et se rejoint à pied depuis la maison', () => {
    const ok = lieuxAtteignables();
    // Stand (place, collège), courses (épicerie), Samir (friche, place), débat (place), Noah (parc).
    for (const place of ['place', 'college', 'epicerie', 'friche', 'parc'] as const) {
      expect(PLACE_ANCHORS[place], place).toBeDefined();
      expect(ok[place], `${place} atteignable`).toBe(true);
    }
  });

  it('les PNJ des objectifs ont un créneau hors des heures de cours', () => {
    const toMin = (s: string): number => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
    const libre = (npcId: string, place: string): boolean => {
      const def = NPCS.find((n) => n.id === npcId);
      // Après 16 h 30 en semaine, ou n'importe quand le week-end.
      return !!def?.routine.some((r) => r.place === place && (r.weekends === true || toMin(r.to) > 16 * 60 + 40));
    };
    expect(libre('samir', 'friche') || libre('samir', 'place'), 'Samir').toBe(true);
    expect(libre('noah', 'parc'), 'Noah').toBe(true);
    expect(libre('lina', 'epicerie') || libre('lina', 'college'), 'Lina').toBe(true);
  });
});

describe('parcours de campagne — joueur appliqué', () => {
  it('graine du jeu (20200901) : les 5 chapitres et l’épilogue, sans blocage ni spirale', () => {
    verifierParcours(20200901, 'applique');
  }, LONG);

  for (const seed of grainesSupplementaires()) {
    it(`graine ${seed}`, () => verifierParcours(seed, 'applique'), LONG);
  }
});
