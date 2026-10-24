import { describe, expect, it } from 'vitest';
import {
  ArrivalWatch, FootstepClock, VoiceLimiter, ambienceLevels, coinCount, edge, moneyTrend, newSales, panelCue,
  runFactor, stepInterval, surfaceOfFloor, surfaceOfTile,
} from '../src/presentation/sfx/logic';
import {
  RUN_SPEED, WALK_SPEED, addShake, createCameraFeel, runPullBack, springStep, stepCameraFeel,
} from '../src/presentation/city3d/locomotion';

describe('sensations — choix du son de pas', () => {
  it('associe chaque sol de la ville à un bruit de pas', () => {
    expect(surfaceOfTile('pave')).toBe('pave');
    expect(surfaceOfTile('trottoir')).toBe('brique');
    expect(surfaceOfTile('herbe')).toBe('herbe');
    expect(surfaceOfTile('aire_jeux')).toBe('herbe');
    expect(surfaceOfTile('gravier')).toBe('terre');
    expect(surfaceOfTile('chaussee')).toBe('asphalte');
    expect(surfaceOfTile('passage')).toBe('asphalte');
    expect(surfaceOfTile(undefined)).toBe('pave');
  });

  it('associe les sols intérieurs (parquet, carrelage, pavés, herbe)', () => {
    expect(surfaceOfFloor('parquet')).toBe('parquet');
    expect(surfaceOfFloor('carrelage')).toBe('sol');
    expect(surfaceOfFloor('lino')).toBe('sol');
    expect(surfaceOfFloor('paves')).toBe('pave');
    expect(surfaceOfFloor('herbe')).toBe('herbe');
  });

  it('accélère la cadence avec la vitesse, dans des bornes raisonnables', () => {
    expect(stepInterval(RUN_SPEED)).toBeLessThan(stepInterval(WALK_SPEED));
    for (let v = 0; v <= 10; v += 0.5) {
      expect(stepInterval(v)).toBeGreaterThanOrEqual(0.27);
      expect(stepInterval(v)).toBeLessThanOrEqual(0.62);
    }
    expect(runFactor(WALK_SPEED)).toBe(0);
    expect(runFactor(RUN_SPEED)).toBe(1);
  });

  it('émet des pas au rythme de la marche, aucun à l’arrêt', () => {
    const count = (speed: number, secs: number): number => {
      const c = new FootstepClock();
      let n = 0;
      for (let t = 0; t < secs; t += 1 / 60) if (c.update(1 / 60, speed)) n++;
      return n;
    };
    expect(count(0, 5)).toBe(0);
    const walk = count(WALK_SPEED, 10);
    const run = count(RUN_SPEED, 10);
    expect(walk).toBeGreaterThanOrEqual(18);
    expect(walk).toBeLessThanOrEqual(22);
    expect(run).toBeGreaterThan(walk);
    // Le premier pas tombe vite au démarrage.
    const c = new FootstepClock();
    let first = -1;
    for (let i = 0; i < 60 && first < 0; i++) if (c.update(1 / 60, WALK_SPEED)) first = i;
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThan(15);
  });
});

describe('sensations — limiteur de voix', () => {
  it('écarte les doublons trop rapprochés d’une même famille', () => {
    const v = new VoiceLimiter();
    expect(v.tryStart('ui', 0, 0.03)).toBe(true);
    expect(v.tryStart('ui', 0.01, 0.03)).toBe(false);
    expect(v.tryStart('ui', 0.2, 0.03)).toBe(true);
    expect(v.refused).toBe(1);
  });

  it('borne les voix simultanées par famille', () => {
    const v = new VoiceLimiter();
    expect(v.tryStart('piece', 0, 1)).toBe(true);
    expect(v.tryStart('piece', 0.1, 1)).toBe(true);
    expect(v.tryStart('piece', 0.2, 1)).toBe(true);
    expect(v.tryStart('piece', 0.3, 1)).toBe(false); // max 3
    expect(v.tryStart('piece', 1.5, 1)).toBe(true); // les premières sont finies
  });

  it('borne le total, sauf pour les sons prioritaires (caisse, jingle)', () => {
    const v = new VoiceLimiter(3);
    expect(v.tryStart('porte', 0, 5)).toBe(true);
    expect(v.tryStart('porte', 0.5, 5)).toBe(true);
    expect(v.tryStart('ui', 0.6, 5)).toBe(true);
    expect(v.count(0.7)).toBe(3);
    expect(v.tryStart('fenetre', 0.8, 1)).toBe(false);
    expect(v.tryStart('caisse', 0.8, 1)).toBe(true);
    expect(v.tryStart('jingle', 0.9, 1)).toBe(true);
  });

  it('tient la charge : 10 000 demandes en rafale restent sous le plafond', () => {
    const v = new VoiceLimiter(12);
    const kinds = ['pas', 'ui', 'fenetre', 'porte', 'caisse', 'piece', 'jingle', 'lointain', 'alerte'] as const;
    let maxActive = 0;
    for (let i = 0; i < 10_000; i++) {
      const now = i * 0.002;
      v.tryStart(kinds[i % kinds.length]!, now, 0.3);
      maxActive = Math.max(maxActive, v.count(now));
    }
    expect(maxActive).toBeLessThanOrEqual(14); // 12 + au plus 2 prioritaires
    expect(v.started + v.refused).toBe(10_000);
  });
});

describe('sensations — ambiances et déclencheurs', () => {
  it('règle pluie, vent, rue et intérieur selon la météo et le lieu', () => {
    const rueSoleil = ambienceLevels({ meteo: 'soleil', inside: false, hour: 14, location: 'ville' });
    expect(rueSoleil.rain).toBe(0);
    expect(rueSoleil.street).toBeGreaterThan(0.5);
    expect(rueSoleil.room).toBe(0);
    const ruePluie = ambienceLevels({ meteo: 'pluie', inside: false, hour: 14, location: 'ville' });
    expect(ruePluie.rain).toBeGreaterThan(0);
    expect(ruePluie.wind).toBeGreaterThan(rueSoleil.wind);
    const dedans = ambienceLevels({ meteo: 'pluie', inside: true, hour: 14, location: 'maison' });
    expect(dedans.muffled).toBe(true);
    expect(dedans.rain).toBeLessThan(ruePluie.rain);
    expect(dedans.street).toBeLessThan(ruePluie.street);
    expect(dedans.room).toBe(1);
    const nuit = ambienceLevels({ meteo: 'soleil', inside: false, hour: 23, location: 'ville' });
    expect(nuit.street).toBeLessThan(rueSoleil.street);
  });

  it('détecte les fronts (entrée, sortie) et le son des fenêtres', () => {
    expect(edge(false, true)).toBe('on');
    expect(edge(true, false)).toBe('off');
    expect(edge(true, true)).toBeNull();
    expect(panelCue(false, true, true)).toBe('phone-open');
    expect(panelCue(true, false, true)).toBe('phone-close');
    expect(panelCue(false, true, false)).toBe('panel-open');
    expect(panelCue(true, false, false)).toBe('panel-close');
    expect(panelCue(true, true, false)).toBeNull();
  });

  it('anime le compteur dans le bon sens et dose les pièces', () => {
    expect(moneyTrend(10, 12.5)).toBe('up');
    expect(moneyTrend(10, 9)).toBe('down');
    expect(moneyTrend(10, 10.001)).toBeNull();
    expect(moneyTrend(Number.NaN, 3)).toBeNull();
    expect(coinCount(0)).toBe(0);
    expect(coinCount(1)).toBeGreaterThanOrEqual(3);
    expect(coinCount(10_000)).toBe(12);
    expect(coinCount(50)).toBeGreaterThan(coinCount(2));
  });

  it('compte les ventes sans prendre la remise à zéro du matin pour une vente', () => {
    expect(newSales(3, 5)).toBe(2);
    expect(newSales(5, 5)).toBe(0);
    expect(newSales(12, 0)).toBe(0);
  });

  it('signale l’arrivée sur la balise une seule fois par étape', () => {
    const a = new ArrivalWatch();
    expect(a.update('etape1', false)).toBe(false);
    expect(a.update('etape1', true)).toBe(true);
    expect(a.update('etape1', true)).toBe(false);
    expect(a.update('etape2', true)).toBe(false); // déjà sur place quand l'étape commence
    expect(a.update('etape2', false)).toBe(false);
    expect(a.update('etape2', true)).toBe(true);
  });
});

describe('sensations — caméra', () => {
  it('le ressort atteint sa cible ; léger dépassement amorti, aucun en critique', () => {
    const run = (zeta: number): { end: number; peak: number } => {
      let s = { x: 0, v: 0 };
      let peak = 0;
      for (let i = 0; i < 240; i++) { s = springStep(s, 1, 8.5, zeta, 1 / 60); peak = Math.max(peak, s.x); }
      return { end: s.x, peak };
    };
    const soft = run(0.78);
    const crit = run(1);
    expect(soft.end).toBeCloseTo(1, 3);
    expect(soft.peak).toBeGreaterThan(1);
    expect(soft.peak).toBeLessThan(1.03); // amorti léger
    expect(crit.peak).toBeLessThanOrEqual(1.0001);
    // Stable même à très basse cadence.
    let s = { x: 0, v: 0 };
    for (let i = 0; i < 20; i++) s = springStep(s, 1, 8.5, 0.78, 0.25);
    expect(Number.isFinite(s.x)).toBe(true);
    expect(Math.abs(s.x - 1)).toBeLessThan(0.01);
  });

  it('recule un peu à la course, pas en marchant', () => {
    expect(runPullBack(WALK_SPEED)).toBe(0);
    expect(runPullBack(RUN_SPEED)).toBeCloseTo(0.9, 5);
    const f = createCameraFeel();
    let out = stepCameraFeel(f, { x: 0, y: 1, z: 0 }, { x: 0, y: 1, z: 0 }, RUN_SPEED, 1 / 60, false);
    for (let i = 0; i < 180; i++) out = stepCameraFeel(f, out, { x: 0, y: 1, z: 0 }, RUN_SPEED, 1 / 60, false);
    expect(out.distAdd).toBeGreaterThan(0.8);
  });

  it('repart sans élan après une téléportation (entrée dans un intérieur)', () => {
    const f = createCameraFeel();
    let out = stepCameraFeel(f, { x: 0, y: 0, z: 0 }, { x: 5, y: 0, z: 0 }, 3, 1 / 60, false);
    out = stepCameraFeel(f, out, { x: 5, y: 0, z: 0 }, 3, 1 / 60, false);
    const jumped = stepCameraFeel(f, { x: 100, y: 0, z: 100 }, { x: 100, y: 0, z: 100 }, 0, 1 / 60, false);
    expect(jumped.x).toBeCloseTo(100, 5);
    expect(jumped.z).toBeCloseTo(100, 5);
  });

  it('secousse légère qui s’éteint, et aucune avec « Réduire les animations »', () => {
    const f = createCameraFeel();
    let pos = { x: 0, y: 0, z: 0 };
    stepCameraFeel(f, pos, pos, 0, 1 / 60, false);
    addShake(f, 1); // plafonnée
    expect(f.shake).toBeLessThanOrEqual(0.12);
    let maxShake = 0;
    for (let i = 0; i < 120; i++) {
      const o = stepCameraFeel(f, pos, { x: 0, y: 0, z: 0 }, 0, 1 / 60, false);
      pos = o;
      maxShake = Math.max(maxShake, Math.abs(o.shakeX), Math.abs(o.shakeY));
    }
    expect(maxShake).toBeGreaterThan(0);
    expect(maxShake).toBeLessThanOrEqual(0.12);
    expect(f.shake).toBeLessThan(0.001);
    const g = createCameraFeel();
    addShake(g, 0.05);
    const o = stepCameraFeel(g, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 0, 1 / 60, true);
    expect(o.shakeX).toBe(0);
    expect(o.shakeY).toBe(0);
    expect(g.shake).toBe(0);
  });
});
