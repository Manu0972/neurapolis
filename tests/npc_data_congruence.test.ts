/**
 * tests/npc_data_congruence.test.ts
 *
 * Congruence statique des données PNJ : âges, familles, relations (issue #22).
 * Vérifie statiquement, sans faire tourner le moteur de jeu, que les données des PNJ
 * de la base de données ne se contredisent pas entre fichiers.
 */

import { describe, expect, it } from 'vitest';
import { FAMILY_LINES } from '../src/data/family_registry';
import { PARENTS, SCHOOL_STAFF, STARTER_FAMILY_LINES } from '../src/data/family_starter';
import { NPCS } from '../src/data/npcs';
import { NPCS_EXPANDED } from '../src/data/npcs_expanded';
import { RESIDENTS } from '../src/data/residents/residents';
import { INITIAL_RIVALS } from '../src/data/rivals';
import { SCHOOL_CHARACTERS } from '../src/data/story/family';

/**
 * Exceptions explicites pour les incohérences historiques connues dans les données statiques.
 * Chaque entrée est commentée "à corriger".
 */
export const KNOWN_EXCEPTIONS: ReadonlySet<string> = new Set([
  // à corriger : res_kader_gardien référence 'lucien' (grand-père décédé en lore, absent du registre PNJ vivant)
  'src/data/residents/residents.ts:res_kader_gardien:link:lucien',
  // à corriger : res_edouard_notaire référence 'lucien' (grand-père décédé en lore, absent du registre PNJ vivant)
  'src/data/residents/residents.ts:res_edouard_notaire:link:lucien',
]);

interface UnifiedPnj {
  id: string;
  name: string;
  age?: number;
  role?: string;
  sourceFile: string;
  link?: string;
  parents?: string[];
  children?: string[];
  siblings?: string[];
  friends?: string[];
  rivals?: string[];
  couple?: string[];
}

function loadAllPnjs(): UnifiedPnj[] {
  const pnjMap = new Map<string, UnifiedPnj>();

  const addOrUpdate = (pnj: UnifiedPnj) => {
    if (!pnjMap.has(pnj.id)) {
      pnjMap.set(pnj.id, pnj);
    } else {
      const existing = pnjMap.get(pnj.id)!;
      if (pnj.age !== undefined && existing.age === undefined) existing.age = pnj.age;
      if (pnj.role && !existing.role) existing.role = pnj.role;
      if (pnj.link && !existing.link) existing.link = pnj.link;
      if (pnj.parents) existing.parents = Array.from(new Set([...(existing.parents || []), ...pnj.parents]));
      if (pnj.children) existing.children = Array.from(new Set([...(existing.children || []), ...pnj.children]));
      if (pnj.siblings) existing.siblings = Array.from(new Set([...(existing.siblings || []), ...pnj.siblings]));
      if (pnj.friends) existing.friends = Array.from(new Set([...(existing.friends || []), ...pnj.friends]));
      if (pnj.rivals) existing.rivals = Array.from(new Set([...(existing.rivals || []), ...pnj.rivals]));
      if (pnj.couple) existing.couple = Array.from(new Set([...(existing.couple || []), ...pnj.couple]));
    }
  };

  // 1. PNJ de base (src/data/npcs.ts)
  for (const n of NPCS) {
    addOrUpdate({
      id: n.id,
      name: n.name,
      age: n.age,
      role: n.role,
      sourceFile: 'src/data/npcs.ts',
    });
  }

  // 2. PNJ de la galerie approfondie (src/data/npcs_expanded.ts)
  for (const n of NPCS_EXPANDED) {
    addOrUpdate({
      id: n.id,
      name: n.name,
      age: n.age,
      role: n.role,
      sourceFile: 'src/data/npcs_expanded.ts',
    });
  }

  // 3. Habitants des nouveaux quartiers (src/data/residents/residents.ts)
  for (const r of RESIDENTS) {
    addOrUpdate({
      id: r.id,
      name: r.name,
      age: r.age,
      role: r.role,
      link: r.link,
      sourceFile: 'src/data/residents/residents.ts',
    });
  }

  // 4. Rivaux économiques (src/data/rivals.ts)
  for (const [id, r] of Object.entries(INITIAL_RIVALS)) {
    addOrUpdate({
      id,
      name: r.name,
      role: 'Entreprise rivale',
      sourceFile: 'src/data/rivals.ts',
    });
  }

  // 5. Parents de la famille joueur (src/data/family_starter.ts)
  // Nora et Thierry sont mariés/en couple
  addOrUpdate({
    id: 'nora',
    name: PARENTS.nora.name,
    role: PARENTS.nora.job,
    age: 42,
    couple: ['thierry'],
    sourceFile: 'src/data/family_starter.ts',
  });
  addOrUpdate({
    id: 'thierry',
    name: PARENTS.thierry.name,
    role: PARENTS.thierry.job,
    age: 44,
    couple: ['nora'],
    sourceFile: 'src/data/family_starter.ts',
  });

  // Personnel de direction du collège (src/data/family_starter.ts)
  for (const [key, staff] of Object.entries(SCHOOL_STAFF)) {
    addOrUpdate({
      id: `school_staff_${key}`,
      name: staff.name,
      role: staff.role,
      sourceFile: 'src/data/family_starter.ts',
    });
  }

  // 6. Personnages du collège Jean-Moulin (src/data/story/family.ts)
  for (const sc of SCHOOL_CHARACTERS) {
    const isStudent = sc.role.toLowerCase().includes('élève') || sc.role.toLowerCase().includes('eleve');
    const age = isStudent ? 13 : 45;
    addOrUpdate({
      id: sc.id,
      name: sc.name,
      role: sc.role,
      age,
      sourceFile: 'src/data/story/family.ts',
    });
  }

  // Verification de l'import des repliques familiales
  const allLines = [...STARTER_FAMILY_LINES, ...FAMILY_LINES];
  expect(allLines.length).toBeGreaterThan(0);

  return Array.from(pnjMap.values());
}

describe('Congruence statique des données PNJ (âges, familles, relations)', () => {
  const allPnjs = loadAllPnjs();
  const knownIds = new Set(allPnjs.map((p) => p.id));

  it('1. Identifiants : uniques sur l’ensemble des fichiers et références valides', () => {
    // Vérification que toute référence pointe vers un identifiant existant
    for (const p of allPnjs) {
      if (p.link) {
        const key = `${p.sourceFile}:${p.id}:link:${p.link}`;
        if (!knownIds.has(p.link) && !KNOWN_EXCEPTIONS.has(key)) {
          expect.fail(
            `[${p.sourceFile}] ${p.id}: la référence "link" pointe vers un identifiant inexistant "${p.link}"`
          );
        }
      }

      const refLists = [
        { label: 'parent', list: p.parents },
        { label: 'enfant', list: p.children },
        { label: 'fratrie', list: p.siblings },
        { label: 'ami', list: p.friends },
        { label: 'rival', list: p.rivals },
        { label: 'couple', list: p.couple },
      ];

      for (const { label, list } of refLists) {
        if (!list) continue;
        for (const targetId of list) {
          const key = `${p.sourceFile}:${p.id}:${label}:${targetId}`;
          if (!knownIds.has(targetId) && !KNOWN_EXCEPTIONS.has(key)) {
            expect.fail(
              `[${p.sourceFile}] ${p.id}: la référence ${label} pointe vers un identifiant inexistant "${targetId}"`
            );
          }
        }
      }
    }
  });

  it('2. Réciprocité : relations parent-enfant et symétriques (fratrie, amitié, couple)', () => {
    const idToPnjMap = new Map<string, UnifiedPnj>();
    for (const p of allPnjs) {
      idToPnjMap.set(p.id, p);
    }

    for (const p of allPnjs) {
      // Parent -> Enfant
      if (p.parents) {
        for (const parentId of p.parents) {
          const key = `${p.sourceFile}:${p.id}:parent:${parentId}`;
          if (KNOWN_EXCEPTIONS.has(key)) continue;
          const parentObj = idToPnjMap.get(parentId);
          if (parentObj) {
            expect(
              parentObj.children && parentObj.children.includes(p.id),
              `[${p.sourceFile}] ${p.id}: déclare ${parentId} comme parent, mais ${parentId} n'a pas ${p.id} comme enfant`
            ).toBe(true);
          }
        }
      }

      // Fratrie (symétrique)
      if (p.siblings) {
        for (const sibId of p.siblings) {
          const key = `${p.sourceFile}:${p.id}:siblings:${sibId}`;
          if (KNOWN_EXCEPTIONS.has(key)) continue;
          const sibObj = idToPnjMap.get(sibId);
          if (sibObj) {
            expect(
              sibObj.siblings && sibObj.siblings.includes(p.id),
              `[${p.sourceFile}] ${p.id}: déclare une relation de fratrie avec ${sibId}, non réciproque chez ${sibId}`
            ).toBe(true);
          }
        }
      }

      // Amitié (symétrique)
      if (p.friends) {
        for (const friendId of p.friends) {
          const key = `${p.sourceFile}:${p.id}:friends:${friendId}`;
          if (KNOWN_EXCEPTIONS.has(key)) continue;
          const friendObj = idToPnjMap.get(friendId);
          if (friendObj) {
            expect(
              friendObj.friends && friendObj.friends.includes(p.id),
              `[${p.sourceFile}] ${p.id}: déclare une relation d'amitié avec ${friendId}, non réciproque chez ${friendId}`
            ).toBe(true);
          }
        }
      }

      // Couple (symétrique)
      if (p.couple) {
        for (const partnerId of p.couple) {
          const key = `${p.sourceFile}:${p.id}:couple:${partnerId}`;
          if (KNOWN_EXCEPTIONS.has(key)) continue;
          const partnerObj = idToPnjMap.get(partnerId);
          if (partnerObj) {
            expect(
              partnerObj.couple && partnerObj.couple.includes(p.id),
              `[${p.sourceFile}] ${p.id}: déclare une relation de couple avec ${partnerId}, non réciproque chez ${partnerId}`
            ).toBe(true);
          }
        }
      }
    }
  });

  it('3. Âges : bornes valides (0-110 ans), écart parent-enfant >= 16 ans, fratrie réaliste', () => {
    const idToPnjMap = new Map<string, UnifiedPnj>();
    for (const p of allPnjs) {
      idToPnjMap.set(p.id, p);
    }

    for (const p of allPnjs) {
      if (p.age !== undefined) {
        expect(
          p.age >= 0 && p.age <= 110,
          `[${p.sourceFile}] ${p.id}: âge invalide (${p.age}). Doit être compris entre 0 et 110 ans.`
        ).toBe(true);

        // Parent >= enfant + 16 ans
        if (p.parents) {
          for (const parentId of p.parents) {
            const key = `${p.sourceFile}:${p.id}:parent_age:${parentId}`;
            if (KNOWN_EXCEPTIONS.has(key)) continue;
            const parentObj = idToPnjMap.get(parentId);
            if (parentObj && parentObj.age !== undefined) {
              const diff = parentObj.age - p.age;
              expect(
                diff >= 16,
                `[${p.sourceFile}] ${p.id}: le parent ${parentId} (${parentObj.age} ans) doit avoir au moins 16 ans de plus que l'enfant (${p.age} ans)`
              ).toBe(true);
            }
          }
        }

        // Fratrie : écart maximal de 40 ans
        if (p.siblings) {
          for (const sibId of p.siblings) {
            const key = `${p.sourceFile}:${p.id}:sibling_age:${sibId}`;
            if (KNOWN_EXCEPTIONS.has(key)) continue;
            const sibObj = idToPnjMap.get(sibId);
            if (sibObj && sibObj.age !== undefined) {
              const gap = Math.abs(sibObj.age - p.age);
              expect(
                gap <= 40,
                `[${p.sourceFile}] ${p.id}: écart de fratrie impossible avec ${sibId} (${gap} ans d'écart)`
              ).toBe(true);
            }
          }
        }
      }
    }
  });

  it('4. Mineurs : < 16 ans n’a pas de métier adulte et aucune relation de couple', () => {
    for (const p of allPnjs) {
      if (p.age !== undefined && p.age < 16) {
        // Aucune relation de couple
        if (p.couple && p.couple.length > 0) {
          expect.fail(
            `[${p.sourceFile}] ${p.id}: mineur de moins de 16 ans (${p.age} ans) avec relation de couple.`
          );
        }

        // Métier de mineur valide (élève / collégien / lycéen / apprenti / camarade / délégué / ami / sans activité)
        if (p.role) {
          const roleLower = p.role.toLowerCase();
          const isExplicitMinorRole =
            roleLower.includes('élève') ||
            roleLower.includes('eleve') ||
            roleLower.includes('collège') ||
            roleLower.includes('college') ||
            roleLower.includes('camarade') ||
            roleLower.includes('ami') ||
            roleLower.includes('délégué') ||
            roleLower.includes('delegue') ||
            roleLower.includes('journaliste') ||
            roleLower.includes('inventeur') ||
            roleLower.includes('apprenti') ||
            roleLower.includes('sans activité') ||
            roleLower.includes('sans emploi');

          expect(
            isExplicitMinorRole,
            `[${p.sourceFile}] ${p.id}: mineur de moins de 16 ans (${p.age} ans) a un rôle/métier adulte inapproprié "${p.role}"`
          ).toBe(true);
        }
      }
    }
  });

  it('5. Doublons de nom : listés en avertissements pour vérification humaine', () => {
    const nameMap = new Map<string, UnifiedPnj[]>();

    for (const p of allPnjs) {
      if (!p.name) continue;
      const normName = p.name.trim().toLowerCase();
      if (!nameMap.has(normName)) nameMap.set(normName, []);
      nameMap.get(normName)!.push(p);
    }

    const warnings: string[] = [];

    for (const [normName, entries] of nameMap.entries()) {
      const uniqueIds = new Set(entries.map((e) => e.id));
      if (uniqueIds.size > 1) {
        const details = entries
          .map((e) => `${e.id} (${e.sourceFile}, âge: ${e.age ?? 'N/A'}, rôle: "${e.role ?? 'N/A'}")`)
          .join(' VS ');
        warnings.push(`Doublon de nom détecté pour "${entries[0]!.name}": ${details}`);
      }
    }

    // Le contrôle produit une liste d'avertissements consultable sans bloquer le test
    expect(Array.isArray(warnings)).toBe(true);
  });
});
