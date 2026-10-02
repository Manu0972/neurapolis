import { describe, it, expect, beforeEach } from 'vitest';
import { soundManager } from '../src/presentation/audio';

describe('Sound Engine State & Control', () => {
  beforeEach(() => {
    soundManager.setVolume(0.5);
    if (soundManager.isMuted()) {
      soundManager.toggleMute();
    }
  });

  it('manages volume within [0, 1] range', () => {
    soundManager.setVolume(0.8);
    expect(soundManager.getVolume()).toBe(0.8);

    soundManager.setVolume(1.5);
    expect(soundManager.getVolume()).toBe(1.0);

    soundManager.setVolume(-0.5);
    expect(soundManager.getVolume()).toBe(0);
  });

  it('toggles mute state correctly', () => {
    expect(soundManager.isMuted()).toBe(false);

    const mutedState = soundManager.toggleMute();
    expect(mutedState).toBe(true);
    expect(soundManager.isMuted()).toBe(true);

    const unmutedState = soundManager.toggleMute();
    expect(unmutedState).toBe(false);
    expect(soundManager.isMuted()).toBe(false);
  });

  it('safely handles play calls when WebAudio is unavailable in node env', () => {
    expect(() => {
      soundManager.play('click');
      soundManager.play('cash');
      soundManager.play('fanfare');
      soundManager.play('event_crisis');
    }).not.toThrow();
  });
});
