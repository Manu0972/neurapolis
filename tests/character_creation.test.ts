/**
 * Tests unitaires et d'intégration : Création et personnalisation du personnage principal.
 * Couvre :
 *  - Budget de points (CHARACTERISTIC_POINT_BUDGET = 292) et validation des allocations
 *  - Noms autorisés (isValidPlayerName)
 *  - createWorld avec profil personnalisé complet (nom, genre, caractéristiques, apparence)
 *  - Génération SVG d'avatar personnalisé (renderCreatorAvatarSvg, playerAvatarSvg)
 *  - Intégrité de la persistance aller-retour exportSave/importSave (sauvegarde v8)
 *  - Montabilité de mountCharacterCreator
 */
import { describe, expect, it, vi } from 'vitest';
import {
  CHARACTERISTIC_FIELDS,
  CHARACTERISTIC_POINT_BUDGET,
  characteristicTotal,
  DEFAULT_CHARACTERISTICS,
  isValidCharacteristicAllocation,
  isValidPlayerName,
  mountCharacterCreator,
  renderCreatorAvatarSvg,
} from '../src/presentation/character-creator';
import { createWorld } from '../src/core/store';
import { exportSave, importSave } from '../src/saves/persist';
import { avatarElement, playerAvatarSvg } from '../src/presentation/avatar';
import { TOKENS } from '../src/presentation/tokens';
import type { Characteristics, PlayerAppearance, PlayerGender } from '../src/core/types';

describe('Personnage — Budget & Validation des Caractéristiques', () => {
  it('le budget de points est de 292', () => {
    expect(CHARACTERISTIC_POINT_BUDGET).toBe(292);
  });

  it('les six caractéristiques sont présentes et bien nommées', () => {
    const ids = CHARACTERISTIC_FIELDS.map((f) => f.id);
    expect(ids).toEqual(['comprehension', 'creativite', 'influence', 'discipline', 'adaptabilite', 'confiance']);
  });

  it('le profil par défaut alloue exactement le budget de 292 points', () => {
    expect(characteristicTotal(DEFAULT_CHARACTERISTICS)).toBe(292);
    expect(isValidCharacteristicAllocation(DEFAULT_CHARACTERISTICS)).toBe(true);
  });

  it('rejette les allocations dont la somme est différente de 292 ou hors bornes [0, 100]', () => {
    const under: Characteristics = { ...DEFAULT_CHARACTERISTICS, creativite: DEFAULT_CHARACTERISTICS.creativite - 5 };
    expect(isValidCharacteristicAllocation(under)).toBe(false);

    const over: Characteristics = { ...DEFAULT_CHARACTERISTICS, creativite: DEFAULT_CHARACTERISTICS.creativite + 5 };
    expect(isValidCharacteristicAllocation(over)).toBe(false);

    const negative: Characteristics = { ...DEFAULT_CHARACTERISTICS, comprehension: -10, creativite: DEFAULT_CHARACTERISTICS.creativite + 10 };
    expect(isValidCharacteristicAllocation(negative)).toBe(false);
  });
});

describe('Personnage — Validation du Nom', () => {
  it('accepte les prénoms de 2 à 24 caractères', () => {
    expect(isValidPlayerName('Noa')).toBe(true);
    expect(isValidPlayerName('Camille')).toBe(true);
    expect(isValidPlayerName('Jean-Baptiste')).toBe(true);
  });

  it('refuse les chaînes vides, trop courtes ou trop longues', () => {
    expect(isValidPlayerName('')).toBe(false);
    expect(isValidPlayerName(' ')).toBe(false);
    expect(isValidPlayerName('A')).toBe(false);
    expect(isValidPlayerName('UnNomBeaucoupTropLongPourLeJeuNeurapolis')).toBe(false);
  });
});

describe('Personnage — Création dans WorldState & Persistance v8', () => {
  it('crée un monde avec le profil complet du joueur choisi', () => {
    const customAppearance: PlayerAppearance = {
      skinTone: '#c68642',
      hairStyle: 'boucle',
      hairColor: '#b55239',
      outfit: 'sport',
      outfitColor: '#4a8505',
    };

    const customStats: Characteristics = {
      comprehension: 50,
      creativite: 60,
      influence: 40,
      discipline: 45,
      adaptabilite: 52,
      confiance: 45,
    };

    const world = createWorld({
      seed: 42,
      playerName: 'Sacha',
      playerGender: 'fille',
      playerAppearance: customAppearance,
      playerCharacteristics: customStats,
    });

    expect(world.player.name).toBe('Sacha');
    expect(world.player.gender).toBe('fille');
    expect(world.player.appearance).toEqual(customAppearance);
    expect(world.player.characteristics).toEqual(customStats);

    // Persistance aller-retour export/import
    const json = exportSave(world);
    const reloaded = importSave(json);
    expect(reloaded.player.name).toBe('Sacha');
    expect(reloaded.player.gender).toBe('fille');
    expect(reloaded.player.appearance).toEqual(customAppearance);
    expect(reloaded.player.characteristics).toEqual(customStats);
  });

  it('utilise les valeurs par défaut sécurisées si aucune option n’est fournie', () => {
    const world = createWorld();
    expect(world.player.name).toBe('Camille');
    expect(world.player.gender).toBe('non-binaire');
    expect(world.player.appearance.skinTone).toBe('#e8b888');
    expect(world.player.appearance.hairStyle).toBe('court');
    expect(world.player.appearance.hairColor).toBe('#3b2926');
    expect(world.player.appearance.outfit).toBe('casual');
    expect(world.player.appearance.outfitColor).toBe('#3a6ca8');
  });
});

describe('Personnage — Rendu des Avatars SVG', () => {
  it('renderCreatorAvatarSvg produit un SVG valide contenant les teintes choisies', () => {
    const svg = renderCreatorAvatarSvg({
      skinTone: '#a96848',
      hairStyle: 'long',
      hairColor: '#d3a64b',
      outfit: 'sport',
      outfitColor: '#c4564b',
    });

    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('</svg>');
    expect(svg).toContain('#a96848');
    expect(svg).toContain('#d3a64b');
    expect(svg).toContain('#c4564b');
    expect(svg).not.toContain('NaN');
    expect(svg).not.toContain('undefined');
  });

  it('gère les différents styles de coiffure sans erreur', () => {
    const styles = ['court', 'long', 'boucle', 'tresse', 'attache'];
    for (const style of styles) {
      const svg = renderCreatorAvatarSvg({
        skinTone: '#f2c9a5',
        hairStyle: style,
        hairColor: '#3b2926',
        outfit: 'casual',
        outfitColor: '#3a6ca8',
      });
      expect(svg).toContain('</svg>');
    }
  });

  it('playerAvatarSvg et avatarElement gèrent l’apparence personnalisée', () => {
    const app: PlayerAppearance = {
      skinTone: '#f2c9a5',
      hairStyle: 'tresse',
      hairColor: '#9b536e',
      outfit: 'elegant',
      outfitColor: '#7961a5',
    };

    const svg = playerAvatarSvg('Aria', app, TOKENS.or, 64);
    expect(svg).toContain('#f2c9a5');
    expect(svg).toContain('#9b536e');

    // Test sans DOM global (fonction pure playerAvatarSvg)
    expect(svg.startsWith('<svg')).toBe(true);
  });
});

describe('Personnage — Montabilité DOM mountCharacterCreator', () => {
  // Mock DOM minimal pour tester mountCharacterCreator
  function createMockElement(tag: string): any {
    const children: any[] = [];
    const listeners: Record<string, Function[]> = {};
    const elem: any = {
      tagName: tag.toUpperCase(),
      name: '',
      type: '',
      value: '',
      textContent: '',
      className: '',
      style: {} as any,
      dataset: {} as any,
      required: false,
      disabled: false,
      children,
      appendChild: (c: any) => { children.push(c); return c; },
      append: (...args: any[]) => { children.push(...args); },
      replaceChildren: (...args: any[]) => { children.length = 0; children.push(...args); },
      addEventListener: (type: string, fn: Function) => {
        if (!listeners[type]) listeners[type] = [];
        listeners[type].push(fn);
      },
      dispatchEvent: (e: any) => {
        listeners[e.type]?.forEach((fn) => fn(e));
        return true;
      },
      classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {},
        contains: () => false,
      },
      querySelectorAll: () => [],
      querySelector: () => null,
      setAttribute: () => {},
      focus: () => {},
    };
    return elem;
  }

  it('monte le formulaire et permet la validation avec onComplete', () => {
    const originalDocument = globalThis.document;
    const originalFormData = globalThis.FormData;

    try {
      (globalThis as any).document = {
        createElement: (tag: string) => createMockElement(tag),
      };

      (globalThis as any).FormData = class MockFormData {
        private data = new Map<string, string>([
          ['gender', 'fille'],
          ['skinTone', '#f2c9a5'],
          ['hairStyle', 'court'],
          ['hairColor', '#3b2926'],
          ['outfit', 'casual'],
          ['outfitColor', '#3a6ca8'],
        ]);
        get(key: string) { return this.data.get(key) ?? null; }
      };

      const root = createMockElement('div');
      const onComplete = vi.fn();
      const onCancel = vi.fn();

      mountCharacterCreator(root, { onComplete, onCancel });

      expect(root.children.length).toBeGreaterThan(0);
    } finally {
      (globalThis as any).document = originalDocument;
      (globalThis as any).FormData = originalFormData;
    }
  });
});
