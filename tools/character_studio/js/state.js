/**
 * Central Reactive State Store for GLM Character Studio.
 * Dispatches state change events to visualizers, prompt matrix, and badge cards.
 */

import { PRESETS, getPreset } from './presets.js';

class CharacterStore {
  constructor() {
    // Initial state cloned from the Hunter Protagonist preset
    this.character = getPreset('hunter_protagonist');

    // UI state
    this.ui = {
      displayMode: 'split',    // 'body' | 'face' | 'split'
      bodyView: 'front',       // 'front' | 'profile'
      promptMode: 'turnaround',// 'turnaround' | 'portrait' | 'action'
      activeTab: 'identity'    // 'identity' | 'body' | 'face' | 'palette'
    };

    this.listeners = new Set();
  }

  /**
   * Subscribes a listener to state modifications.
   * @param {Function} listener (state) => void
   * @returns {Function} unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    // Immediately invoke listener with current state
    try {
      listener(this.getState());
    } catch (e) {
      console.error('Error invoking initial store subscriber:', e);
    }
    return () => this.listeners.delete(listener);
  }

  notify() {
    const currentState = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(currentState);
      } catch (err) {
        console.error('Error in store listener:', err);
      }
    }
  }

  getState() {
    return {
      character: { ...this.character, colors: { ...this.character.colors } },
      ui: { ...this.ui }
    };
  }

  /**
   * Updates one or more character properties.
   * @param {Object} partialChar
   */
  updateCharacter(partialChar) {
    if (partialChar.colors) {
      this.character.colors = {
        ...this.character.colors,
        ...partialChar.colors
      };
      delete partialChar.colors;
    }
    this.character = {
      ...this.character,
      ...partialChar
    };
    this.notify();
  }

  /**
   * Updates UI display options.
   * @param {Object} partialUi
   */
  updateUi(partialUi) {
    this.ui = {
      ...this.ui,
      ...partialUi
    };
    this.notify();
  }

  /**
   * Loads a preset by ID.
   * @param {string} presetId
   */
  loadPreset(presetId) {
    const preset = getPreset(presetId);
    if (!preset) return false;
    this.character = preset;
    this.notify();
    return true;
  }

  /**
   * Restores character from imported data.
   * @param {Object} importedChar
   */
  loadImported(importedChar) {
    this.character = importedChar;
    this.notify();
  }

  /**
   * Randomizes character within balanced aesthetic bounds.
   */
  randomize() {
    const genders = ['male', 'female', 'androgynous'];
    const styles = ['webtoon_action', 'modern_anime', 'detailed_seinen', 'semi_realistic'];
    const wardrobes = ['k_streetwear', 'techwear', 'martial', 'classic_tailoring'];
    const modes = ['duty', 'private'];

    const gender = genders[Math.floor(Math.random() * genders.length)];
    const style = styles[Math.floor(Math.random() * styles.length)];
    const wardrobe = wardrobes[Math.floor(Math.random() * wardrobes.length)];
    const wardrobeMode = modes[Math.floor(Math.random() * modes.length)];

    const heightCm = Math.round(162 + Math.random() * 32); // 162 to 194
    const whr = gender === 'female'
      ? Number((0.64 + Math.random() * 0.10).toFixed(2)) // 0.64 to 0.74
      : Number((0.78 + Math.random() * 0.12).toFixed(2)); // 0.78 to 0.90

    const vTaper = gender === 'male'
      ? Number((1.38 + Math.random() * 0.28).toFixed(2)) // 1.38 to 1.66
      : Number((1.04 + Math.random() * 0.18).toFixed(2)); // 1.04 to 1.22

    const muscularity = Number((0.25 + Math.random() * 0.70).toFixed(2));
    const galbe = Number((0.35 + Math.random() * 0.55).toFixed(2));
    const vascularity = gender === 'male' ? Number((Math.random() * 0.75).toFixed(2)) : Number((Math.random() * 0.25).toFixed(2));
    const bustVolume = gender === 'female' ? Number((0.35 + Math.random() * 0.55).toFixed(2)) : Number((0.20 + Math.random() * 0.30).toFixed(2));

    const canthalTilt = Number((-1.0 + Math.random() * 9.0).toFixed(1)); // -1.0 to +8.0
    const mandibularAngle = gender === 'male'
      ? Math.round(110 + Math.random() * 14) // 110 to 124
      : Math.round(124 + Math.random() * 10); // 124 to 134

    const facialSymmetry = Number((0.92 + Math.random() * 0.08).toFixed(2));
    const cheekbones = Number((0.55 + Math.random() * 0.40).toFixed(2));

    // Palettes
    const palettes = [
      { primary: '#0f172a', secondary: '#334155', accent: '#00e5ff', skin: '#fde8db', hair: '#0f172a', eyes: '#00f0ff' },
      { primary: '#581c87', secondary: '#1e1b4b', accent: '#f43f5e', skin: '#ffe4d6', hair: '#a855f7', eyes: '#fbbf24' },
      { primary: '#14532d', secondary: '#064e3b', accent: '#10b981', skin: '#dfa675', hair: '#1c1917', eyes: '#34d399' },
      { primary: '#78350f', secondary: '#451a03', accent: '#f59e0b', skin: '#e2b38b', hair: '#78350f', eyes: '#d97706' },
      { primary: '#18181b', secondary: '#27272a', accent: '#f97316', skin: '#f3d5b5', hair: '#18181b', eyes: '#94a3b8' }
    ];
    const pal = palettes[Math.floor(Math.random() * palettes.length)];

    const firstNames = ['Jin-Woo', 'Sora', 'Kael', 'Ren', 'Maya', 'Dante', 'Elysia', 'Shin', 'Raven'];
    const lastNames = ['Park', 'Kim', 'Vance', 'Cross', 'Chen', 'Rostova', 'Morales', 'Kurogane'];
    const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;

    this.character = {
      id: `random_${Date.now()}`,
      name,
      alias: 'Unknown Operative',
      role: 'Vanguard Synthesist',
      gender,
      age: Math.round(19 + Math.random() * 18),
      heightCm,
      somatotype: muscularity > 0.6 ? 'mesomorph' : 'ecto_mesomorph',
      whr,
      vTaper,
      muscularity,
      galbe,
      vascularity,
      bustVolume,
      canthalTilt,
      mandibularAngle,
      facialSymmetry,
      cheekbones,
      style,
      wardrobe,
      wardrobeMode,
      colors: { ...pal },
      backstory: 'Generated character synthesized according to neoclassical golden ratios and action aesthetic canons.'
    };

    this.notify();
  }
}

export const store = new CharacterStore();
