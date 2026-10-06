/**
 * NEURAPOLIS — Suite de Tests Complète M1 P-PERSO (Player Customization)
 * Couvre :
 * 1. Validation d'identité (prénom, nom, genre)
 * 2. Tokens et sanitization de l'apparence esthétique
 * 3. Répartition du pool de 18 points bonus et contraintes min/max
 * 4. Création de monde personnalisé et déterminisme PRNG
 * 5. Sérialisation de sauvegarde v10 et aller-retour export/import
 * 6. Migration v9 → v10 et rétrocompatibilité v0..v9 préservant toutes les données
 */
import { describe, expect, it } from 'vitest';
import {
  BASE_CHARACTERISTICS,
  CHARACTERISTIC_KEYS,
  CHARACTERISTIC_MAX,
  DEFAULT_PLAYER_APPEARANCE,
  DEFAULT_PLAYER_CUSTOMIZATION,
  TOTAL_BONUS_POINTS,
  VALID_GENDERS,
  VALID_HAIR_COLORS,
  VALID_HAIR_STYLES,
  VALID_OUTFIT_COLORS,
  VALID_OUTFIT_STYLES,
  VALID_SKIN_TONES,
  applyMigrationV10,
  computeFinalCharacteristics,
  createCustomWorld,
  importCustomSave,
  migrateSaveToV10,
  validateAppearance,
  validateCharacteristicsAllocation,
  validateIdentity,
  type PlayerAppearance,
  type PlayerCustomization,
  type PlayerGender,
} from '../src/core/player_customization';
import { exportSave, importSave } from '../src/saves/persist';
import { createWorld, SAVE_VERSION } from '../src/core/store';

describe('P-PERSO — 1. Validation de l’Identité du Joueur', () => {
  it('accepte une identité valide avec prénom, nom et genre', () => {
    const res = validateIdentity('Lina', 'Moreau', 'fille');
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
    expect(res.sanitized.firstName).toBe('Lina');
    expect(res.sanitized.lastName).toBe('Moreau');
    expect(res.sanitized.gender).toBe('fille');
    expect(res.sanitized.fullName).toBe('Lina Moreau');
  });

  it('nettoie les espaces superflus (trim) sur le prénom et le nom', () => {
    const res = validateIdentity('   Noah   ', '   Dupont   ', 'garcon');
    expect(res.valid).toBe(true);
    expect(res.sanitized.firstName).toBe('Noah');
    expect(res.sanitized.lastName).toBe('Dupont');
    expect(res.sanitized.fullName).toBe('Noah Dupont');
  });

  it('rejette un prénom vide ou constitué exclusivement d’espaces', () => {
    const res = validateIdentity('   ', 'Dupont', 'non-binaire');
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('prénom'))).toBe(true);
    expect(res.sanitized.firstName).toBe('Camille'); // Repli de secours
  });

  it('rejette un prénom dépassant la longueur maximale de 30 caractères', () => {
    const tropLong = 'A'.repeat(35);
    const res = validateIdentity(tropLong, 'Test', 'fille');
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('30 caractères'))).toBe(true);
  });

  it('rejette un nom de famille dépassant 30 caractères', () => {
    const tropLong = 'B'.repeat(35);
    const res = validateIdentity('Camille', tropLong, 'non-binaire');
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('Nom'))).toBe(true);
  });

  it('rejette un token de genre inconnu et applique le repli par défaut non-binaire', () => {
    const res = validateIdentity('Alex', '', 'autre');
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('Genre invalide'))).toBe(true);
    expect(res.sanitized.gender).toBe('non-binaire');
  });
});

describe('P-PERSO — 2. Validation & Tokens d’Apparence Esthétique', () => {
  it('valide l’ensemble exhaustif des tokens d’apparence conformes à la spécification', () => {
    expect(VALID_GENDERS).toEqual(['fille', 'garcon', 'non-binaire']);
    expect(VALID_SKIN_TONES).toEqual(['claire', 'chaude', 'doree', 'ebene']);
    expect(VALID_HAIR_COLORS).toEqual(['brun', 'chatain', 'blond', 'roux', 'noir']);
    expect(VALID_HAIR_STYLES).toEqual(['court', 'mi-long', 'boucle', 'tresse', 'couettes']);
    expect(VALID_OUTFIT_STYLES).toEqual(['ecolier', 'artisan', 'sportif', 'citoyen']);
    expect(VALID_OUTFIT_COLORS).toEqual(['denim', 'coral', 'vert', 'ocre', 'indigo']);
  });

  it('valide une apparence complètement personnalisée sans erreur', () => {
    const customApp: PlayerAppearance = {
      skinTone: 'doree',
      hairColor: 'roux',
      hairStyle: 'tresse',
      outfitStyle: 'artisan',
      outfitColor: 'vert',
    };
    const res = validateAppearance(customApp);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
    expect(res.appearance).toEqual(customApp);
  });

  it('détecte et remplace une teinte de peau invalide par le repli canonique claire', () => {
    const res = validateAppearance({ skinTone: 'bleue', hairColor: 'brun' });
    expect(res.valid).toBe(false);
    expect(res.appearance.skinTone).toBe('claire');
    expect(res.errors.some((e) => e.includes('Teinte de peau'))).toBe(true);
  });

  it('détecte et remplace une couleur ou coupe de cheveux invalide par les replis canoniques', () => {
    const res = validateAppearance({ hairColor: 'vert_fluo', hairStyle: 'crete' });
    expect(res.valid).toBe(false);
    expect(res.appearance.hairColor).toBe('chatain');
    expect(res.appearance.hairStyle).toBe('court');
  });

  it('gère un objet vide ou null en complétant tous les champs avec l’apparence par défaut', () => {
    const resNull = validateAppearance(null);
    expect(resNull.valid).toBe(false);
    expect(resNull.appearance).toEqual(DEFAULT_PLAYER_APPEARANCE);

    const resEmpty = validateAppearance({});
    expect(resEmpty.valid).toBe(false);
    expect(resEmpty.appearance).toEqual(DEFAULT_PLAYER_APPEARANCE);
  });
});

describe('P-PERSO — 3. Répartition du Pool de Caractéristiques (18 Points)', () => {
  it('valide une allocation exacte de 18 points bonus répartis sur les caractéristiques', () => {
    const bonus = {
      comprehension: 3,
      creativite: 3,
      influence: 3,
      discipline: 3,
      adaptabilite: 3,
      confiance: 3,
    };
    const res = validateCharacteristicsAllocation(bonus);
    expect(res.valid).toBe(true);
    expect(res.totalAllocated).toBe(18);
    expect(res.remainingPoints).toBe(0);
    expect(res.errors).toHaveLength(0);
    expect(res.finalCharacteristics.comprehension).toBe(BASE_CHARACTERISTICS.comprehension + 3);
  });

  it('refuse une allocation où le total est inférieur à 18 (points restants > 0)', () => {
    const bonus = { comprehension: 5, creativite: 5 }; // total = 10, reste 8
    const res = validateCharacteristicsAllocation(bonus);
    expect(res.valid).toBe(false);
    expect(res.totalAllocated).toBe(10);
    expect(res.remainingPoints).toBe(8);
  });

  it('refuse une allocation où le total dépasse 18 (points restants < 0)', () => {
    const bonus = { comprehension: 10, creativite: 10 }; // total = 20 > 18
    const res = validateCharacteristicsAllocation(bonus);
    expect(res.valid).toBe(false);
    expect(res.remainingPoints).toBe(-2);
    expect(res.errors.some((e) => e.includes('Dépassement du pool'))).toBe(true);
  });

  it('rejette strictement toute allocation de points bonus négatifs', () => {
    const bonus = { comprehension: -2, creativite: 20 };
    const res = validateCharacteristicsAllocation(bonus);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('négatifs'))).toBe(true);
  });

  it('rejette les valeurs de points non entières', () => {
    const bonus = { comprehension: 2.5, creativite: 15.5 };
    const res = validateCharacteristicsAllocation(bonus);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('doivent être un entier'))).toBe(true);
  });

  it('empêche une caractéristique finale de dépasser le plafond strict de 100', () => {
    // creativite base = 65, + 36 = 101 > 100
    const bonus = { creativite: 36 };
    const res = validateCharacteristicsAllocation(bonus);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('dépasse le maximum autorisé'))).toBe(true);
  });

  it('computeFinalCharacteristics effectue un calcul borné entre 10 et 100', () => {
    const res = computeFinalCharacteristics(BASE_CHARACTERISTICS, { comprehension: 10 });
    expect(res.comprehension).toBe(BASE_CHARACTERISTICS.comprehension + 10);
    expect(res.creativite).toBe(BASE_CHARACTERISTICS.creativite);
  });
});

describe('P-PERSO — 4. Création de Monde Personnalisé & Initialisation', () => {
  it('crée un monde avec le profil canonique Camille quand aucune option n’est fournie', () => {
    const world = createCustomWorld();
    expect(world.version).toBe(SAVE_VERSION);
    expect(world.player.firstName).toBe('Camille');
    expect(world.player.lastName).toBe('Dupont');
    expect(world.player.gender).toBe('non-binaire');
    expect(world.player.appearance).toEqual(DEFAULT_PLAYER_APPEARANCE);
    expect(world.player.characteristics).toEqual(BASE_CHARACTERISTICS);
  });

  it('initialise fidèlement une identité et une apparence personnalisées', () => {
    const custom: PlayerCustomization = {
      firstName: 'Samia',
      lastName: 'Belkacem',
      gender: 'fille',
      characteristics: {
        comprehension: 50,
        creativite: 68,
        influence: 40,
        discipline: 50,
        adaptabilite: 60,
        confiance: 45,
      },
      appearance: {
        skinTone: 'ebene',
        hairColor: 'noir',
        hairStyle: 'couettes',
        outfitStyle: 'sportif',
        outfitColor: 'indigo',
      },
    };

    const world = createCustomWorld({ customization: custom });
    expect(world.version).toBe(SAVE_VERSION);
    expect(world.player.firstName).toBe('Samia');
    expect(world.player.lastName).toBe('Belkacem');
    expect(world.player.name).toBe('Samia Belkacem');
    expect(world.player.gender).toBe('fille');
    expect(world.player.appearance).toEqual(custom.appearance);
    expect(world.player.characteristics).toEqual(custom.characteristics);
  });

  it('gère un joueur avec prénom uniquement en composant un player.name propre', () => {
    const world = createCustomWorld({
      customization: { firstName: 'Karim', lastName: '' },
    });
    expect(world.player.firstName).toBe('Karim');
    expect(world.player.lastName).toBe('');
    expect(world.player.name).toBe('Karim');
  });

  it('gère l’attribution directe de bonusPoints lors de la création du monde', () => {
    const world = createCustomWorld({
      customization: {
        firstName: 'Lina',
        bonusPoints: { comprehension: 6, influence: 12 },
      },
    });
    expect(world.player.characteristics.comprehension).toBe(BASE_CHARACTERISTICS.comprehension + 6);
    expect(world.player.characteristics.influence).toBe(BASE_CHARACTERISTICS.influence + 12);
  });

  it('préserve strictement le déterminisme du PRNG mulberry32 pour une graine donnée', () => {
    const w1 = createCustomWorld({ seed: 12345, customization: { firstName: 'Alice' } });
    const w2 = createCustomWorld({ seed: 12345, customization: { firstName: 'Bob' } });
    expect(w1.seed).toBe(w2.seed);
    expect(w1.district.meteo).toBe(w2.district.meteo);
    expect(w1.player.pos).toEqual(w2.player.pos);
  });
});

describe('P-PERSO — 5. Sérialisation Sauvegarde v10 & Aller-Retour JSON', () => {
  it('sérialise la sauvegarde v10 avec tous les champs de personnalisation inclus', () => {
    const world = createCustomWorld({
      customization: {
        firstName: 'Zack',
        lastName: 'Taret',
        gender: 'garcon',
        appearance: {
          skinTone: 'chaude',
          hairColor: 'blond',
          hairStyle: 'boucle',
          outfitStyle: 'citoyen',
          outfitColor: 'ocre',
        },
      },
    });

    const jsonStr = exportSave(world as any);
    const parsed = JSON.parse(jsonStr);

    expect(parsed.version).toBe(SAVE_VERSION);
    expect(parsed.player.firstName).toBe('Zack');
    expect(parsed.player.lastName).toBe('Taret');
    expect(parsed.player.gender).toBe('garcon');
    expect(parsed.player.appearance.skinTone).toBe('chaude');
    expect(parsed.player.appearance.hairColor).toBe('blond');
    expect(parsed.player.appearance.hairStyle).toBe('boucle');
    expect(parsed.player.appearance.outfitStyle).toBe('citoyen');
    expect(parsed.player.appearance.outfitColor).toBe('ocre');
  });

  it('restitue fidèlement l’état complet du joueur après round-trip exportSave et importSave', () => {
    const world = createCustomWorld({
      customization: {
        firstName: 'Maxime',
        lastName: 'Roux',
        gender: 'non-binaire',
        appearance: {
          skinTone: 'doree',
          hairColor: 'brun',
          hairStyle: 'court',
          outfitStyle: 'ecolier',
          outfitColor: 'denim',
        },
      },
    });

    const exported = exportSave(world as any);
    const imported = importCustomSave(exported);

    expect(imported.version).toBe(SAVE_VERSION);
    expect(imported.player.name).toBe('Maxime Roux');
    expect((imported.player as any).firstName).toBe('Maxime');
    expect((imported.player as any).lastName).toBe('Roux');
    expect((imported.player as any).gender).toBe('non-binaire');
    expect((imported.player as any).appearance.skinTone).toBe('doree');
    expect((imported.player as any).appearance.hairColor).toBe('brun');
    expect((imported.player as any).appearance.outfitStyle).toBe('ecolier');
    expect((imported.player as any).appearance.outfitColor).toBe('denim');
  });

  it('préserve l’égalité bit-à-bit du JSON re-exporté (idempotence de la persistance v10)', () => {
    const world = createCustomWorld();
    const json1 = exportSave(world as any);
    const restored = importCustomSave(json1);
    const json2 = exportSave(restored as any);
    expect(json2).toBe(json1);
  });
});

describe('P-PERSO — 6. Migration de Sauvegarde v9 → v10 & Rétrocompatibilité', () => {
  it('applyMigrationV10 enrichit une sauvegarde v9 avec les valeurs de personnalisation sans toucher aux rivaux', () => {
    const baseV9 = createWorld({ seed: 42, playerName: 'Camille Ancien' });
    const rawV9 = JSON.parse(exportSave(baseV9));
    rawV9.version = 9;
    delete rawV9.player.firstName;
    delete rawV9.player.lastName;
    delete rawV9.player.gender;
    delete rawV9.player.appearance;
    expect(rawV9.version).toBe(9);
    expect(rawV9.player.firstName).toBeUndefined();

    const v10 = applyMigrationV10(rawV9) as any;
    expect(v10.version).toBe(10);
    expect(v10.player.firstName).toBe('Camille Ancien');
    expect(v10.player.lastName).toBe('');
    expect(v10.player.gender).toBe('non-binaire');
    expect(v10.player.appearance).toEqual(DEFAULT_PLAYER_APPEARANCE);

    // Vérifie que les données de rivaux introduites en v8/v9 sont intactes
    expect(v10.rivals.drive_hyper).toBeDefined();
    expect(v10.rivals.drive_hyper.marketObservation).toBeDefined();
  });

  it('applyMigrationV10 conserve les valeurs de prénom, nom et apparence si déjà présentes', () => {
    const raw = {
      version: 9,
      player: {
        name: 'Noah Bertin',
        firstName: 'Noah',
        lastName: 'Bertin',
        gender: 'garcon',
        appearance: {
          skinTone: 'chaude',
          hairColor: 'noir',
          hairStyle: 'court',
          outfitStyle: 'artisan',
          outfitColor: 'vert',
        },
      },
    };

    const v10: any = applyMigrationV10(raw as any);
    expect(v10.version).toBe(10);
    expect(v10.player.firstName).toBe('Noah');
    expect(v10.player.lastName).toBe('Bertin');
    expect(v10.player.gender).toBe('garcon');
    expect(v10.player.appearance.hairColor).toBe('noir');
    expect(v10.player.appearance.outfitStyle).toBe('artisan');
  });

  it('migrateSaveToV10 fait migrer avec succès une sauvegarde ancienne v0 jusqu’à v10', () => {
    const w = createWorld({ seed: 777, playerName: 'Camille 2020' });
    const raw = JSON.parse(exportSave(w));
    raw.version = 0;
    delete raw.district.meteo;
    delete raw.player.firstName;
    delete raw.player.appearance;

    const v10World = migrateSaveToV10(raw);
    expect(v10World.version).toBe(SAVE_VERSION);
    expect(v10World.district.meteo).toBe('soleil'); // Garanti par migration 0 -> 1
    expect(v10World.player.firstName).toBe('Camille 2020'); // Garanti par migration 9 -> 10
    expect(v10World.player.gender).toBe('non-binaire');
    expect(v10World.player.appearance).toEqual(DEFAULT_PLAYER_APPEARANCE);
  });

  it('migrateSaveToV10 préserve intégralement la trésorerie, la réputation et les besoins des sauvegardes', () => {
    const w = createWorld({ seed: 999 });
    w.player.money = 1250;
    w.player.reputation = 88;
    w.player.needs.moral = 95;

    const raw = JSON.parse(exportSave(w));
    raw.version = 5;

    const migrated = migrateSaveToV10(raw);
    expect(migrated.version).toBe(SAVE_VERSION);
    expect(migrated.player.money).toBe(1250);
    expect(migrated.player.reputation).toBe(88);
    expect(migrated.player.needs.moral).toBe(95);
    expect(migrated.player.appearance).toBeDefined();
  });

  it('rejette une sauvegarde corrompue ou non objet avec une erreur explicite', () => {
    expect(() => migrateSaveToV10(null)).toThrow(/Sauvegarde illisible/);
    expect(() => migrateSaveToV10('chaine')).toThrow(/Sauvegarde illisible/);
  });
});
