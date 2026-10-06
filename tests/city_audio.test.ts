import { describe, it, expect } from 'vitest';
import { audio, SoundEngine } from '../src/presentation/audio';

describe('Sons de ville et ambiance 3D (A-4 Suite de tests)', () => {
  it('instancie correctement le singleton audio et la classe SoundEngine', () => {
    expect(audio).toBeDefined();
    expect(audio).toBeInstanceOf(SoundEngine);
  });

  it('expose les méthodes demandées par Claude pour la ville 3D (no-op en environnement Node)', () => {
    expect(typeof audio.playDoorBell).toBe('function');
    expect(typeof audio.setTrafficLevel).toBe('function');
    expect(typeof audio.playFootstep).toBe('function');

    // Les appels ne doivent lever aucune exception en environnement headless/Node.js
    expect(() => audio.playDoorBell()).not.toThrow();
    expect(() => audio.setTrafficLevel(0.5)).not.toThrow();
    expect(() => audio.setTrafficLevel(0)).not.toThrow();
    expect(() => audio.playFootstep('asphalte')).not.toThrow();
    expect(() => audio.playFootstep('pave')).not.toThrow();
    expect(() => audio.playFootstep('herbe')).not.toThrow();
    expect(() => audio.playFootstep('parquet')).not.toThrow();
  });

  it('les méthodes existantes continuent de fonctionner sans régression', () => {
    expect(() => audio.playUiClick()).not.toThrow();
    expect(() => audio.playCoin()).not.toThrow();
    expect(() => audio.stopAmbient()).not.toThrow();
    expect(() => audio.setMasterVolume(0.8)).not.toThrow();
    expect(typeof audio.isMuted()).toBe('boolean');
  });
});
