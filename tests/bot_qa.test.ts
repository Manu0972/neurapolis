import { describe, it, expect } from 'vitest';
import { runBotSimulation, formatCsv } from '../tools/bot';

describe('Bot de QA (A-5 Suite de tests)', () => {
  it('exécute une simulation de 5 jours avec la stratégie prudente sans crash', () => {
    const results = runBotSimulation('prudent', 5, 123);
    expect(results.length).toBe(5);
    expect(results[0]!.day).toBe(1);
    expect(results[4]!.day).toBe(5);
    expect(results[4]!.strategy).toBe('prudent');
    expect(results[4]!.cashEuro).toBeGreaterThanOrEqual(0);
  });

  it('génère un format CSV valide avec en-têtes et lignes conformes', () => {
    const results = runBotSimulation('cooperatif', 3, 456);
    const csv = formatCsv(results);
    const lines = csv.trim().split('\n');
    expect(lines.length).toBe(4); // 1 header + 3 rows
    expect(lines[0]).toBe('day,strategy,cashEuro,reputation,currentAge,chapter,actionsCount');
    expect(lines[1]).toContain('cooperatif');
  });

  it('produit des résultats déterministes pour une graine donnée', () => {
    const resA = runBotSimulation('agressif', 5, 789);
    const resB = runBotSimulation('agressif', 5, 789);
    expect(resA).toEqual(resB);
  });
});
