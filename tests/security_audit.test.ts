import { describe, it, expect } from 'vitest';
import { safeJsonParse, sanitizeJsonObject, importSave } from '../src/saves/persist';

describe('Sentinel Security Audit - Prototype Pollution & JSON Sanitization', () => {
  it('sanitizeJsonObject strips toxic prototype pollution keys', () => {
    const maliciousPayload = JSON.parse(`{
      "version": 5,
      "rng": 12345,
      "__proto__": { "polluted": true },
      "constructor": { "prototype": { "isAdmin": true } },
      "player": {
        "name": "Camille",
        "prototype": "hacked"
      }
    }`);

    const clean = sanitizeJsonObject(maliciousPayload);

    expect(clean).not.toHaveProperty('__proto__.polluted');
    expect(clean).not.toHaveProperty('constructor');
    expect(clean).not.toHaveProperty('player.prototype');
    expect(Object.prototype).not.toHaveProperty('polluted');
  });

  it('safeJsonParse prevents prototype pollution during parsing', () => {
    const jsonString = `{
      "version": 5,
      "player": { "name": "Camille" },
      "__proto__": { "hacked": 1 }
    }`;

    const parsed = safeJsonParse(jsonString) as Record<string, unknown>;
    expect(parsed).not.toHaveProperty('__proto__.hacked');
    expect((({} as unknown) as { hacked?: number }).hacked).toBeUndefined();
  });

  it('importSave safely imports valid save files without polluting prototype', () => {
    const validSaveWithPollution = `{
      "version": 5,
      "time": { "tick": 100, "day": 2, "season": "printemps", "year": 2020 },
      "rng": 123,
      "rngEvents": 456,
      "player": { "name": "Test", "money": 100, "stress": 0, "energy": 100, "reputation": 50, "competences": {} },
      "inventory": {},
      "district": { "meteo": "soleil", "prices": {}, "demand": {} },
      "places": {},
      "ghosts": {},
      "campaign": { "chapter": 1, "completedActs": [], "flags": {} },
      "log": [],
      "__proto__": { "vulnerable": true }
    }`;

    const world = importSave(validSaveWithPollution);
    expect(world.version).toBe(5);
    expect((({} as unknown) as { vulnerable?: boolean }).vulnerable).toBeUndefined();
  });
});
