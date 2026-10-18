/**
 * NEURAPOLIS — Détecteur de dérive d'état et diff lisible.
 *
 * Fonction pure diffStates(a, b, { maxEntries }) produisant une liste
 * triée de différences { chemin, avant, après } entre deux états du monde ou objets.
 *
 * Garanties :
 * - Aucune utilisation de Math.random() ni Date.now() (déterministe).
 * - Tri stable par chemin pour une sortie reproductible.
 * - Gestion des cas limites : clés absentes, longueurs de tableaux, NaN, objets cycliques.
 */

export interface StateDiffEntry {
  chemin: string;
  avant: unknown;
  après: unknown;
}

export interface DiffStatesOptions {
  /** Nombre maximum d'entrées renvoyées avant troncature. */
  maxEntries?: number;
}

export interface StateDiffList extends Array<StateDiffEntry> {
  /** Indique si la liste a été tronquée en raison de maxEntries. */
  truncated: boolean;
  /** Nombre total de différences trouvées avant toute troncature. */
  totalDiffs: number;
}

/**
 * Calcule un diff structuré entre deux états ou objets a et b.
 *
 * @param a État initial ou de référence (ex. avant)
 * @param b État comparé ou nouveau (ex. après)
 * @param options Options de diff (maxEntries pour borner la taille de la liste)
 * @returns Liste des différences triée par chemin, avec métadonnées truncated et totalDiffs
 */
export function diffStates(
  a: unknown,
  b: unknown,
  options?: DiffStatesOptions
): StateDiffList {
  const diffs: StateDiffEntry[] = [];
  const ancestorsA = new Set<object>();
  const ancestorsB = new Set<object>();

  function compare(valA: unknown, valB: unknown, path: string): void {
    // Cas NaN vs NaN : considérés égaux dans le diff d'état
    if (typeof valA === 'number' && typeof valB === 'number' && Number.isNaN(valA) && Number.isNaN(valB)) {
      return;
    }

    // Égalité directe (mêmes primitives, même référence objet, etc.)
    if (Object.is(valA, valB)) {
      return;
    }

    const isObjA = valA !== null && typeof valA === 'object';
    const isObjB = valB !== null && typeof valB === 'object';

    // Refus explicite des objets cycliques
    if (isObjA && ancestorsA.has(valA as object)) {
      throw new Error('Objet cyclique détecté dans diffStates');
    }
    if (isObjB && ancestorsB.has(valB as object)) {
      throw new Error('Objet cyclique détecté dans diffStates');
    }

    // Si les deux valeurs sont des objets (non null)
    if (isObjA && isObjB) {
      const arrA = Array.isArray(valA);
      const arrB = Array.isArray(valB);

      // Incompatibilité de type structurel : Tableau vs Objet simple
      if (arrA !== arrB) {
        diffs.push({ chemin: path, avant: valA, après: valB });
        return;
      }

      // Comparaison de deux tableaux
      if (arrA && arrB) {
        ancestorsA.add(valA as object);
        ancestorsB.add(valB as object);

        const listA = valA as unknown[];
        const listB = valB as unknown[];
        const maxLen = Math.max(listA.length, listB.length);

        for (let i = 0; i < maxLen; i++) {
          const itemPath = path ? `${path}.${i}` : `${i}`;
          const hasItemA = i < listA.length;
          const hasItemB = i < listB.length;

          if (!hasItemA) {
            diffs.push({ chemin: itemPath, avant: undefined, après: listB[i] });
          } else if (!hasItemB) {
            diffs.push({ chemin: itemPath, avant: listA[i], après: undefined });
          } else {
            compare(listA[i], listB[i], itemPath);
          }
        }

        ancestorsA.delete(valA as object);
        ancestorsB.delete(valB as object);
        return;
      }

      // Comparaison de deux objets simples
      ancestorsA.add(valA as object);
      ancestorsB.add(valB as object);

      const objA = valA as Record<string, unknown>;
      const objB = valB as Record<string, unknown>;

      const keysA = Object.keys(objA);
      const keysB = Object.keys(objB);
      const allKeys = Array.from(new Set([...keysA, ...keysB]));

      for (const key of allKeys) {
        const keyPath = path ? `${path}.${key}` : key;
        const hasA = key in objA;
        const hasB = key in objB;

        if (!hasA) {
          diffs.push({ chemin: keyPath, avant: undefined, après: objB[key] });
        } else if (!hasB) {
          diffs.push({ chemin: keyPath, avant: objA[key], après: undefined });
        } else {
          compare(objA[key], objB[key], keyPath);
        }
      }

      ancestorsA.delete(valA as object);
      ancestorsB.delete(valB as object);
      return;
    }

    // Primitives différentes ou Mismatch Objet vs Primitive
    diffs.push({ chemin: path, avant: valA, après: valB });
  }

  compare(a, b, '');

  // Tri stable par chemin pour un résultat déterministe
  diffs.sort((x, y) => (x.chemin < y.chemin ? -1 : x.chemin > y.chemin ? 1 : 0));

  const totalDiffs = diffs.length;
  const maxEntries = options?.maxEntries;
  const truncated = typeof maxEntries === 'number' && maxEntries > 0 && totalDiffs > maxEntries;

  const resultList = (truncated ? diffs.slice(0, maxEntries) : diffs) as StateDiffList;
  Object.defineProperty(resultList, 'truncated', {
    value: truncated,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(resultList, 'totalDiffs', {
    value: totalDiffs,
    enumerable: false,
    writable: true,
    configurable: true,
  });

  return resultList;
}

/**
 * Formate une liste de diffs sous forme d'une chaîne lisible en français.
 * Utile pour enrichir les messages d'erreur de tests ou journaux de dérive.
 */
export function formatStateDiff(diffs: StateDiffEntry[] | StateDiffList): string {
  if (!diffs || diffs.length === 0) {
    return 'Aucune différence d’état détectée.';
  }

  const lines = diffs.map((d) => {
    const vBefore = typeof d.avant === 'object' && d.avant !== null ? JSON.stringify(d.avant) : String(d.avant);
    const vAfter = typeof d.après === 'object' && d.après !== null ? JSON.stringify(d.après) : String(d.après);
    return `  - ${d.chemin}: ${vBefore} → ${vAfter}`;
  });

  const list = diffs as Partial<StateDiffList>;
  if (list.truncated) {
    const hiddenCount = (list.totalDiffs ?? diffs.length) - diffs.length;
    lines.push(`  ... (${hiddenCount} autre(s) différence(s) masquée(s) par maxEntries)`);
  }

  return lines.join('\n');
}
