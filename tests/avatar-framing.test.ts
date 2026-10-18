import { describe, expect, it } from 'vitest';
import { frameAvatar } from '../src/presentation/avatar-framing';

describe('frameAvatar', () => {
  it('fait entrer la tête et les pieds dans le cadre, centré', () => {
    for (const h of [1.0, 1.4, 1.52, 1.75, 1.9]) {
      const f = frameAvatar(h, 0.8);
      const half = Math.tan((30 * Math.PI) / 360) * f.camZ;
      expect(f.lookY - half).toBeLessThan(0); // les pieds (y=0) sont dans le cadre
      expect(f.lookY + half).toBeGreaterThan(h); // la tête aussi
      expect(Math.abs(f.lookY - h / 2)).toBeLessThan(h * 0.06); // centré verticalement
    }
  });
  it("s'éloigne proportionnellement à la taille (cohérence avec l'âge)", () => {
    const a = frameAvatar(1.5, 0.8).camZ;
    const b = frameAvatar(1.75, 0.8).camZ;
    expect(b / a).toBeCloseTo(1.75 / 1.5, 1);
  });
  it('tient aussi sur un cadre étroit et ignore une taille aberrante', () => {
    const f = frameAvatar(1.5, 0.4);
    const halfW = Math.tan((30 * Math.PI) / 360) * f.camZ * 0.4;
    expect(halfW * 2).toBeGreaterThan(1.5 * 0.55);
    expect(Number.isFinite(frameAvatar(0, 1).camZ)).toBe(true);
  });
});
