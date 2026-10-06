import { describe, expect, it } from 'vitest';
import {
  CHARACTERISTIC_POINT_BUDGET,
  DEFAULT_CHARACTERISTICS,
  characteristicTotal,
  isValidCharacteristicAllocation,
  isValidPlayerName,
} from '../src/presentation/character-creator';

describe('création du personnage', () => {
  it('reprend le profil initial sans changer le budget de départ', () => {
    expect(characteristicTotal(DEFAULT_CHARACTERISTICS)).toBe(CHARACTERISTIC_POINT_BUDGET);
    expect(isValidCharacteristicAllocation(DEFAULT_CHARACTERISTICS)).toBe(true);
  });

  it('accepte une redistribution valide des 292 points', () => {
    expect(isValidCharacteristicAllocation({
      comprehension: 80,
      creativite: 50,
      influence: 50,
      discipline: 40,
      adaptabilite: 36,
      confiance: 36,
    })).toBe(true);
  });

  it.each([
    ['budget trop bas', { ...DEFAULT_CHARACTERISTICS, confiance: 43 }],
    ['valeur supérieure à 80', { ...DEFAULT_CHARACTERISTICS, confiance: 81 }],
    ['valeur inférieure à 20', { ...DEFAULT_CHARACTERISTICS, confiance: 19 }],
    ['valeur non entière', { ...DEFAULT_CHARACTERISTICS, confiance: 44.5 }],
  ])('refuse une allocation avec %s', (_reason, values) => {
    expect(isValidCharacteristicAllocation(values)).toBe(false);
  });

  it('valide un nom nettoyé de 2 à 24 caractères', () => {
    expect(isValidPlayerName('  Samir  ')).toBe(true);
    expect(isValidPlayerName('A')).toBe(false);
    expect(isValidPlayerName(' '.repeat(4))).toBe(false);
    expect(isValidPlayerName('N'.repeat(25))).toBe(false);
  });
});
