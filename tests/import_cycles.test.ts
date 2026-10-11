import { describe, expect, it } from 'vitest';
import { buildImportGraph } from './helpers/imports';

/**
 * Liste d'exceptions des cycles d'imports connus sous src/.
 * Doit être décroissante : tout cycle résolu doit être retiré sous peine d'échec de test.
 */
const KNOWN_CYCLES: readonly string[] = [];

/**
 * Algorithme des composantes fortement connexes (SCC) de Tarjan.
 */
function findStronglyConnectedComponents(graph: Record<string, string[]>): string[][] {
  let index = 0;
  const stack: string[] = [];
  const indices = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const onStack = new Set<string>();
  const sccs: string[][] = [];

  const nodes = Object.keys(graph).sort();

  function strongConnect(v: string): void {
    indices.set(v, index);
    lowlink.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    const neighbors = (graph[v] ?? []).slice().sort();
    for (const w of neighbors) {
      if (!indices.has(w)) {
        strongConnect(w);
        lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
      } else if (onStack.has(w)) {
        lowlink.set(v, Math.min(lowlink.get(v)!, indices.get(w)!));
      }
    }

    if (lowlink.get(v) === indices.get(v)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);

      if (scc.length > 1) {
        sccs.push(scc);
      }
    }
  }

  for (const node of nodes) {
    if (!indices.has(node)) {
      strongConnect(node);
    }
  }

  return sccs;
}

/**
 * Extrait les cycles élémentaires au sein d'une composante fortement connexe.
 */
function findCyclesInSCC(sccNodes: string[], graph: Record<string, string[]>): string[] {
  const sccSet = new Set(sccNodes);
  const cycles: string[][] = [];
  const sortedScc = sccNodes.slice().sort();

  function dfs(startNode: string, current: string, path: string[], visited: Set<string>): void {
    const neighbors = (graph[current] ?? []).slice().sort();
    for (const neighbor of neighbors) {
      if (!sccSet.has(neighbor)) continue;
      if (neighbor === startNode && path.length > 1) {
        cycles.push([...path, startNode]);
      } else if (!visited.has(neighbor) && neighbor > startNode) {
        dfs(startNode, neighbor, [...path, neighbor], new Set([...visited, neighbor]));
      }
    }
  }

  for (const node of sortedScc) {
    dfs(node, node, [node], new Set([node]));
  }

  return cycles.map((c) => c.join(' → ')).sort();
}

describe("Détection des cycles d'importation dans src/", () => {
  it("ne doit contenir aucun cycle d'importation non référencé", () => {
    const startTime = performance.now();
    const graph = buildImportGraph('src');

    const sccs = findStronglyConnectedComponents(graph);
    const foundCycles: string[] = [];

    for (const scc of sccs) {
      const cycles = findCyclesInSCC(scc, graph);
      foundCycles.push(...cycles);
    }

    foundCycles.sort();

    const durationMs = performance.now() - startTime;
    console.log(`Cycles trouvés : ${foundCycles.length} (exécuté en ${durationMs.toFixed(2)} ms)`);

    const expectedSet = new Set(KNOWN_CYCLES);
    const foundSet = new Set(foundCycles);

    // Vérifier les nouveaux cycles
    const unexpectedCycles = foundCycles.filter((c) => !expectedSet.has(c));
    // Vérifier les exceptions obsolètes
    const obsoleteExceptions = KNOWN_CYCLES.filter((c) => !foundSet.has(c));

    expect(
      unexpectedCycles,
      `Nouveau(x) cycle(s) d'importation détecté(s) :\n${unexpectedCycles.join('\n')}`,
    ).toEqual([]);

    expect(
      obsoleteExceptions,
      `Exception(s) devenue(s) inutile(s) dans KNOWN_CYCLES :\n${obsoleteExceptions.join('\n')}`,
    ).toEqual([]);

    expect(durationMs).toBeLessThan(2000);
  });
});
