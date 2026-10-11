/**
 * Tests de validation du réseau de bus du Taret (src/data/city/transit.ts).
 * Contrôles de structure, de cohérence, de praticabilité des arrêts, de fermeture des tracés et de connexité.
 */
import { describe, expect, it } from 'vitest';
import { isWalkable } from '../src/data/map';
import { BUS_LINES, BUS_STOPS } from '../src/data/city/transit';

/** Liste d'exceptions éventuelles pour les données non conformes à corriger ultérieurement. */
const EXCEPTIONS_A_CORRIGER: string[] = [
  /* à corriger : aucune exception actuelle */
];

describe('réseau de bus du Taret — validation et connexité', () => {
  it('1. identifiants d’arrêts et de lignes uniques ; noms non vides', () => {
    const stopIds = new Set<string>();
    for (const stop of BUS_STOPS) {
      expect(stopIds.has(stop.id), `Identifiant d'arrêt en double : ${stop.id}`).toBe(false);
      stopIds.add(stop.id);
      expect(stop.name.trim().length, `Nom d'arrêt vide pour l'ID : ${stop.id}`).toBeGreaterThan(0);
    }

    const lineIds = new Set<string>();
    for (const line of BUS_LINES) {
      expect(lineIds.has(line.id), `Identifiant de ligne en double : ${line.id}`).toBe(false);
      lineIds.add(line.id);
      expect(line.name.trim().length, `Nom de ligne vide pour l'ID : ${line.id}`).toBeGreaterThan(0);
    }
  });

  it('2. chaque line.stops[i] existe parmi les arrêts', () => {
    const validStopIds = new Set(BUS_STOPS.map((s) => s.id));
    for (const line of BUS_LINES) {
      for (const stopId of line.stops) {
        expect(validStopIds.has(stopId), `Ligne ${line.id} référence l'arrêt inexistant : ${stopId}`).toBe(true);
      }
    }
  });

  it('3. cohérence croisée : un arrêt liste la ligne L dans stop.lines si et seulement si L le dessert dans line.stops', () => {
    const lineMap = Object.fromEntries(BUS_LINES.map((l) => [l.id, l]));

    for (const stop of BUS_STOPS) {
      // Si la ligne L est dans stop.lines, alors line.stops doit contenir stop.id
      for (const lineId of stop.lines) {
        const line = lineMap[lineId];
        expect(line, `Arrêt ${stop.id} référence la ligne inconnue : ${lineId}`).toBeDefined();
        expect(
          line!.stops.includes(stop.id),
          `Arrêt ${stop.id} indique être desservi par la ligne ${lineId}, mais la ligne ${lineId} ne le contient pas dans line.stops`
        ).toBe(true);
      }
    }

    for (const line of BUS_LINES) {
      // Si la ligne dessert stop.id, alors stop.lines doit contenir line.id
      for (const stopId of line.stops) {
        const stop = BUS_STOPS.find((s) => s.id === stopId);
        expect(stop, `Ligne ${line.id} dessert l'arrêt introuvable : ${stopId}`).toBeDefined();
        expect(
          stop!.lines.includes(line.id),
          `Ligne ${line.id} dessert l'arrêt ${stopId}, mais l'arrêt ${stopId} n'inclut pas la ligne ${line.id} dans stop.lines`
        ).toBe(true);
      }
    }
  });

  it('4. aucun arrêt orphelin (desservi par aucune ligne)', () => {
    for (const stop of BUS_STOPS) {
      expect(stop.lines.length, `Arrêt orphelin sans ligne : ${stop.id}`).toBeGreaterThan(0);
    }
  });

  it('5. chaque arrêt est sur une tuile praticable (isWalkable)', () => {
    for (const stop of BUS_STOPS) {
      expect(
        isWalkable(stop.x, stop.y),
        `Arrêt posé sur une tuile non praticable : ${stop.id} en (${stop.x}, ${stop.y})`
      ).toBe(true);
    }
  });

  it('6. chaque line.path est une boucle fermée et deux points consécutifs sont alignés horizontalement ou verticalement', () => {
    for (const line of BUS_LINES) {
      expect(line.path.length, `Tracé de la ligne ${line.id} trop court pour former une boucle`).toBeGreaterThanOrEqual(3);

      for (let i = 0; i < line.path.length; i++) {
        const a = line.path[i]!;
        const b = line.path[(i + 1) % line.path.length]!;

        const aligned = a.x === b.x || a.y === b.y;
        expect(
          aligned,
          `Segment en diagonale ou non aligné sur la ligne ${line.id} entre point ${i} (${a.x},${a.y}) et point ${(i + 1) % line.path.length} (${b.x},${b.y})`
        ).toBe(true);
      }
    }
  });

  it('7. le réseau est connexe : depuis gare, on atteint toutes les lignes et tous les arrêts', () => {
    const startStopId = 'gare';
    const startStop = BUS_STOPS.find((s) => s.id === startStopId);
    expect(startStop, `Arrêt de départ pour la vérification de connexité introuvable : ${startStopId}`).toBeDefined();

    const visitedStops = new Set<string>();
    const visitedLines = new Set<string>();

    const stopQueue: string[] = [startStopId];
    visitedStops.add(startStopId);

    while (stopQueue.length > 0) {
      const currentStopId = stopQueue.shift()!;
      const currentStop = BUS_STOPS.find((s) => s.id === currentStopId);
      if (!currentStop) continue;

      for (const lineId of currentStop.lines) {
        if (!visitedLines.has(lineId)) {
          visitedLines.add(lineId);
          const line = BUS_LINES.find((l) => l.id === lineId);
          if (line) {
            for (const nextStopId of line.stops) {
              if (!visitedStops.has(nextStopId)) {
                visitedStops.add(nextStopId);
                stopQueue.push(nextStopId);
              }
            }
          }
        }
      }
    }

    for (const line of BUS_LINES) {
      expect(visitedLines.has(line.id), `Ligne non accessible depuis la gare : ${line.id}`).toBe(true);
    }

    for (const stop of BUS_STOPS) {
      expect(visitedStops.has(stop.id), `Arrêt non accessible depuis la gare : ${stop.id}`).toBe(true);
    }
  });
});
