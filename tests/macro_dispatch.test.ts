/**
 * NEURAPOLIS — Tests unitaires pour les dépêches macroéconomiques déterministes (Paliers 5-6).
 */

import { describe, expect, it } from 'vitest';
import type { MacroSnapshot } from '../src/core/macro_dispatch_types';
import { mulberry32 } from '../src/core/rng';
import { dispatchesFromSnapshots } from '../src/simulation/macro_dispatch';

describe('dispatchesFromSnapshots — Dépêches Macro Déterministes', () => {
  const samplePrevSnapshots: MacroSnapshot[] = [
    { region: 'Novos-Boréal', population: 1_000_000, fretIndex: 100, energyIndex: 100, annualVariation: 0.02 },
    { region: 'Arc-Sud', population: 850_000, fretIndex: 120, energyIndex: 110, annualVariation: 0.01 },
    { region: "Archipel d'Éole", population: 500_000, fretIndex: 90, energyIndex: 95, annualVariation: -0.01 },
  ];

  it('1. garantit la reproductibilité absolue (mêmes entrées + même graine = mêmes dépêches)', () => {
    const nextSnapshots: MacroSnapshot[] = [
      { region: 'Novos-Boréal', population: 1_000_000, fretIndex: 70, energyIndex: 100, annualVariation: 0.02 }, // -30% fret
      { region: 'Arc-Sud', population: 850_000, fretIndex: 120, energyIndex: 150, annualVariation: 0.01 }, // +36.3% énergie
      { region: "Archipel d'Éole", population: 400_000, fretIndex: 90, energyIndex: 95, annualVariation: -0.01 }, // -20% pop
    ];

    const seed = 987654;
    const run1 = dispatchesFromSnapshots(samplePrevSnapshots, nextSnapshots, mulberry32(seed));
    const run2 = dispatchesFromSnapshots(samplePrevSnapshots, nextSnapshots, mulberry32(seed));

    expect(run1).toEqual(run2);
    expect(run1.length).toBeGreaterThan(0);
  });

  it('2. ne produit AUCUNE dépêche si les variations restent sous les seuils', () => {
    const nextSubThreshold: MacroSnapshot[] = [
      { region: 'Novos-Boréal', population: 1_000_100, fretIndex: 101, energyIndex: 100.5, annualVariation: 0.021 }, // variations < 2%
      { region: 'Arc-Sud', population: 850_200, fretIndex: 119, energyIndex: 110.5, annualVariation: 0.012 },
      { region: "Archipel d'Éole", population: 499_000, fretIndex: 89.5, energyIndex: 94.8, annualVariation: -0.009 },
    ];

    const dispatches = dispatchesFromSnapshots(samplePrevSnapshots, nextSubThreshold, mulberry32(42));
    expect(dispatches).toEqual([]);
  });

  it('3. respecte le plafond de dépêches (maxDispatches)', () => {
    const manyPrevSnapshots: MacroSnapshot[] = Array.from({ length: 15 }, (_, i) => ({
      region: `Région-${i + 1}`,
      population: 1_000_000,
      fretIndex: 100,
      energyIndex: 100,
      annualVariation: 0.0,
    }));

    const manyNextSnapshots: MacroSnapshot[] = Array.from({ length: 15 }, (_, i) => ({
      region: `Région-${i + 1}`,
      population: 1_000_000,
      fretIndex: 50, // -50% fret sur 15 régions !
      energyIndex: 100,
      annualVariation: 0.0,
    }));

    const defaultCapped = dispatchesFromSnapshots(manyPrevSnapshots, manyNextSnapshots, mulberry32(100));
    expect(defaultCapped.length).toBe(5); // Plafond par défaut = 5

    const customCapped = dispatchesFromSnapshots(manyPrevSnapshots, manyNextSnapshots, mulberry32(100), { maxDispatches: 3 });
    expect(customCapped.length).toBe(3);
  });

  it('4. applique un tri stable par gravité décroissante, puis amplitude de variation, puis région et titre', () => {
    const nextSnapshots: MacroSnapshot[] = [
      { region: 'Novos-Boréal', population: 1_000_000, fretIndex: 85, energyIndex: 100, annualVariation: 0.02 }, // -15% fret (gravity 2)
      { region: 'Arc-Sud', population: 850_000, fretIndex: 120, energyIndex: 145, annualVariation: 0.01 }, // +31.8% énergie (gravity 3)
      { region: "Archipel d'Éole", population: 500_000, fretIndex: 78, energyIndex: 95, annualVariation: -0.01 }, // -13.3% fret (gravity 1)
    ];

    const dispatches = dispatchesFromSnapshots(samplePrevSnapshots, nextSnapshots, mulberry32(777));
    expect(dispatches.length).toBe(3);

    // Première dépêche doit être la plus grave (gravity 3)
    expect(dispatches[0]?.gravity).toBe(3);
    expect(dispatches[0]?.region).toBe('Arc-Sud');

    // Les dépêches suivantes doivent suivre l'ordre décroissant de gravité
    for (let i = 0; i < dispatches.length - 1; i++) {
      const current = dispatches[i]!;
      const next = dispatches[i + 1]!;
      if (current.gravity === next.gravity) {
        expect(Math.abs(current.variation)).toBeGreaterThanOrEqual(Math.abs(next.variation) - 1e-6);
      } else {
        expect(current.gravity).toBeGreaterThan(next.gravity);
      }
    }
  });

  it('5. génère des textes en français neutres en genre, sans mention du joueur ni marques réelles', () => {
    const nextSnapshots: MacroSnapshot[] = [
      { region: 'Novos-Boréal', population: 1_000_000, fretIndex: 60, energyIndex: 100, annualVariation: 0.02 },
      { region: 'Arc-Sud', population: 850_000, fretIndex: 120, energyIndex: 160, annualVariation: -0.10 },
    ];

    const dispatches = dispatchesFromSnapshots(samplePrevSnapshots, nextSnapshots, mulberry32(1234));
    expect(dispatches.length).toBeGreaterThan(0);

    const forbiddenPatterns = [
      /\bjoueur\b/i,
      /\bjoueuse\b/i,
      /\btu\b/i,
      /\bvotre\b/i,
      /\bAmazon\b/i,
      /\bTotal\b/i,
      /\bTesla\b/i,
    ];

    for (const d of dispatches) {
      expect(d.title).toBeTruthy();
      expect(d.text).toBeTruthy();
      for (const pattern of forbiddenPatterns) {
        expect(pattern.test(d.title)).toBe(false);
        expect(pattern.test(d.text)).toBe(false);
      }
    }
  });
});
