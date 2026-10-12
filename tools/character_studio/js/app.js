/**
 * Main Application Controller for GLM Character Studio.
 * Connects UI inputs, reactive state store, visualizers, prompt matrix, and toast system.
 */

import { store } from './state.js';
import { getAllPresets } from './presets.js';
import { 
  evaluateBiometrics, 
  interpretWHR, 
  interpretSHR, 
  interpretGonialAngle, 
  interpretCanthalTilt,
  interpretMuscularity,
  interpretGalbe
} from './biometrics.js';
import { 
  renderBodyMannequin, 
  renderFaceArchitecture, 
  renderRadarChart 
} from './anatomy_renderer.js';
import { generatePromptMatrix } from './prompt_generator.js';
import { 
  exportToJSON, 
  exportToMarkdown, 
  triggerFileDownload, 
  parseImportJSON 
} from './exporter.js';

// DOM Elements Cache
let elements = {};

/**
 * Shows an animated toast notification.
 * @param {string} message
 * @param {'success'|'info'|'warning'|'error'} type
 */
export function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✓' : 'ℹ'}</span>
    <span class="toast-msg">${message}</span>
  `;

  container.appendChild(toast);

  // Trigger animation in
  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });

  // Auto remove after 2.5s
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

/**
 * Copies text to clipboard and displays feedback.
 * @param {string} text
 * @param {string} label
 */
export async function copyToClipboard(text, label = 'Prompt') {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    showToast(`${label} copied to clipboard!`, 'success');
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    showToast('Failed to copy. Check clipboard permissions.', 'error');
  }
}

/**
 * Initializes the preset picker buttons.
 */
function initPresetPicker() {
  const container = document.getElementById('preset-pills');
  if (!container) return;

  const presets = getAllPresets();
  container.innerHTML = presets.map(p => `
    <button type="button" class="preset-pill-btn" data-preset="${p.id}" title="${p.name} (${p.alias || p.role})">
      <span class="preset-pill-avatar" style="background: ${p.colors.accent}"></span>
      <span class="preset-pill-label">${p.name.split(' ')[0]}</span>
    </button>
  `).join('');

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.preset-pill-btn');
    if (!btn) return;
    const presetId = btn.dataset.preset;
    if (presetId) {
      store.loadPreset(presetId);
      showToast(`Loaded preset: ${presetId.replace('_', ' ').toUpperCase()}`, 'info');
      // Highlight active pill
      document.querySelectorAll('.preset-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
  });
}

/**
 * Wires all input elements and sliders to the store.
 */
function bindInputs() {
  // Sliders and their readout elements
  const sliders = [
    { id: 'slider-height', key: 'heightCm', num: true, suffix: ' cm' },
    { id: 'slider-whr', key: 'whr', num: true, decimals: 2 },
    { id: 'slider-vtaper', key: 'vTaper', num: true, decimals: 2 },
    { id: 'slider-muscularity', key: 'muscularity', num: true, pct: true },
    { id: 'slider-galbe', key: 'galbe', num: true, pct: true },
    { id: 'slider-vascularity', key: 'vascularity', num: true, pct: true },
    { id: 'slider-bust', key: 'bustVolume', num: true, pct: true },
    { id: 'slider-canthal', key: 'canthalTilt', num: true, decimals: 1, prefix: '+' },
    { id: 'slider-mandibular', key: 'mandibularAngle', num: true, suffix: '°' },
    { id: 'slider-symmetry', key: 'facialSymmetry', num: true, pct: true },
    { id: 'slider-cheekbones', key: 'cheekbones', num: true, pct: true }
  ];

  sliders.forEach(({ id, key, num, decimals, pct, suffix = '', prefix = '' }) => {
    const el = document.getElementById(id);
    const badge = document.getElementById(`${id}-val`);
    if (!el) return;

    el.addEventListener('input', () => {
      let val = num ? parseFloat(el.value) : el.value;
      store.updateCharacter({ [key]: val });
    });
  });

  // Text inputs & Selects
  const directFields = [
    { id: 'input-name', key: 'name' },
    { id: 'input-alias', key: 'alias' },
    { id: 'input-role', key: 'role' },
    { id: 'input-age', key: 'age', num: true },
    { id: 'select-gender', key: 'gender' },
    { id: 'select-somatotype', key: 'somatotype' },
    { id: 'select-style', key: 'style' },
    { id: 'select-wardrobe', key: 'wardrobe' },
    { id: 'input-backstory', key: 'backstory' }
  ];

  directFields.forEach(({ id, key, num }) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      const val = num ? parseInt(el.value, 10) : el.value;
      store.updateCharacter({ [key]: val });
    });
  });

  // Wardrobe Mode toggle (Duty vs Private)
  const modeToggles = document.querySelectorAll('input[name="wardrobe-mode"]');
  modeToggles.forEach(r => {
    r.addEventListener('change', () => {
      if (r.checked) {
        store.updateCharacter({ wardrobeMode: r.value });
      }
    });
  });

  // Color Pickers
  const colorPickers = [
    { id: 'color-primary', key: 'primary' },
    { id: 'color-secondary', key: 'secondary' },
    { id: 'color-accent', key: 'accent' },
    { id: 'color-skin', key: 'skin' },
    { id: 'color-hair', key: 'hair' },
    { id: 'color-eyes', key: 'eyes' }
  ];

  colorPickers.forEach(({ id, key }) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      store.updateCharacter({
        colors: { [key]: el.value }
      });
    });
  });

  // View Angle Toggle (Front vs Profile)
  const angleBtns = document.querySelectorAll('.angle-toggle-btn');
  angleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      angleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      store.updateUi({ bodyView: btn.dataset.view });
    });
  });

  // Visualizer Display Mode (Body, Face, Split)
  const displayBtns = document.querySelectorAll('.display-mode-btn');
  displayBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      displayBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      store.updateUi({ displayMode: btn.dataset.display });
    });
  });

  // Prompt Mode (Turnaround, Portrait, Action)
  const promptModeBtns = document.querySelectorAll('.prompt-mode-btn');
  promptModeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      promptModeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      store.updateUi({ promptMode: btn.dataset.mode });
    });
  });

  // Accordion / Collapsible Sections
  const sectionHeaders = document.querySelectorAll('.panel-section-header');
  sectionHeaders.forEach(hdr => {
    hdr.addEventListener('click', () => {
      const parent = hdr.closest('.panel-section');
      if (parent) {
        parent.classList.toggle('collapsed');
      }
    });
  });

  // Randomize button
  const randBtn = document.getElementById('btn-randomize');
  if (randBtn) {
    randBtn.addEventListener('click', () => {
      store.randomize();
      showToast('Character randomized with aesthetic balance!', 'info');
    });
  }

  // Export JSON & Markdown buttons
  const btnExportJson = document.getElementById('btn-export-json');
  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      const state = store.getState();
      const json = exportToJSON(state.character);
      const filename = `${state.character.name.toLowerCase().replace(/\s+/g, '_')}_blueprint.json`;
      triggerFileDownload(filename, json, 'application/json');
      showToast(`Exported ${filename}`, 'success');
    });
  }

  const btnExportMd = document.getElementById('btn-export-md');
  if (btnExportMd) {
    btnExportMd.addEventListener('click', () => {
      const state = store.getState();
      const md = exportToMarkdown(state.character);
      const filename = `${state.character.name.toLowerCase().replace(/\s+/g, '_')}_sheet.md`;
      triggerFileDownload(filename, md, 'text/markdown');
      showToast(`Exported ${filename}`, 'success');
    });
  }

  // Import JSON Trigger & File Input
  const btnImport = document.getElementById('btn-import-json');
  const fileInput = document.getElementById('input-file-import');
  if (btnImport && fileInput) {
    btnImport.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = parseImportJSON(event.target.result);
          store.loadImported(imported);
          showToast(`Successfully imported: ${imported.name}`, 'success');
        } catch (err) {
          console.error('Import error:', err);
          showToast('Invalid JSON blueprint file.', 'error');
        }
      };
      reader.readAsText(file);
      fileInput.value = ''; // Reset
    });
  }

  // 1-Click Copy Buttons for Prompt Matrix
  const copyButtons = [
    { id: 'btn-copy-midjourney', textId: 'prompt-text-midjourney', label: 'Midjourney v6 Prompt' },
    { id: 'btn-copy-sdxl-pos', textId: 'prompt-text-sdxl-pos', label: 'SDXL Positive Prompt' },
    { id: 'btn-copy-sdxl-neg', textId: 'prompt-text-sdxl-neg', label: 'SDXL Negative Prompt' },
    { id: 'btn-copy-flux', textId: 'prompt-text-flux', label: 'Flux.1 Prompt' }
  ];

  copyButtons.forEach(({ id, textId, label }) => {
    const btn = document.getElementById(id);
    const txtEl = document.getElementById(textId);
    if (!btn || !txtEl) return;

    btn.addEventListener('click', () => {
      copyToClipboard(txtEl.innerText || txtEl.value, label);
      // Temporary button state
      const origText = btn.innerHTML;
      btn.innerHTML = '<span>✓ Copied!</span>';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = origText;
        btn.classList.remove('copied');
      }, 1500);
    });
  });
}

/**
 * Updates all UI form values to reflect current store state.
 * @param {Object} char
 */
function syncFormValues(char) {
  // Sliders and badges
  const sliderSync = [
    { id: 'slider-height', val: char.heightCm, text: `${char.heightCm} cm` },
    { id: 'slider-whr', val: char.whr, text: char.whr.toFixed(2), badgeFn: () => interpretWHR(char.whr, char.gender).label },
    { id: 'slider-vtaper', val: char.vTaper, text: char.vTaper.toFixed(2), badgeFn: () => interpretSHR(char.vTaper, char.gender).label },
    { id: 'slider-muscularity', val: char.muscularity, text: `${Math.round(char.muscularity * 100)}%`, badgeFn: () => interpretMuscularity(char.muscularity).badge },
    { id: 'slider-galbe', val: char.galbe, text: `${Math.round(char.galbe * 100)}%`, badgeFn: () => interpretGalbe(char.galbe).badge },
    { id: 'slider-vascularity', val: char.vascularity, text: `${Math.round(char.vascularity * 100)}%` },
    { id: 'slider-bust', val: char.bustVolume, text: `${Math.round(char.bustVolume * 100)}%` },
    { id: 'slider-canthal', val: char.canthalTilt, text: `${char.canthalTilt >= 0 ? '+' : ''}${char.canthalTilt.toFixed(1)}°`, badgeFn: () => interpretCanthalTilt(char.canthalTilt).label },
    { id: 'slider-mandibular', val: char.mandibularAngle, text: `${char.mandibularAngle}°`, badgeFn: () => interpretGonialAngle(char.mandibularAngle, char.gender).label },
    { id: 'slider-symmetry', val: char.facialSymmetry, text: `${Math.round(char.facialSymmetry * 100)}%` },
    { id: 'slider-cheekbones', val: char.cheekbones, text: `${Math.round(char.cheekbones * 100)}%` }
  ];

  sliderSync.forEach(({ id, val, text, badgeFn }) => {
    const input = document.getElementById(id);
    const badge = document.getElementById(`${id}-val`);
    if (input && input.value !== String(val)) input.value = val;
    if (badge) badge.innerText = text;

    const descEl = document.getElementById(`${id}-desc`);
    if (descEl && badgeFn) {
      descEl.innerText = badgeFn();
    }
  });

  // Text inputs & Selects
  const syncFields = [
    { id: 'input-name', val: char.name },
    { id: 'input-alias', val: char.alias || '' },
    { id: 'input-role', val: char.role || '' },
    { id: 'input-age', val: char.age },
    { id: 'select-gender', val: char.gender },
    { id: 'select-somatotype', val: char.somatotype },
    { id: 'select-style', val: char.style },
    { id: 'select-wardrobe', val: char.wardrobe },
    { id: 'input-backstory', val: char.backstory || '' }
  ];

  syncFields.forEach(({ id, val }) => {
    const el = document.getElementById(id);
    if (el && el.value !== String(val)) el.value = val;
  });

  // Wardrobe Mode Radios
  const modeRadios = document.querySelectorAll('input[name="wardrobe-mode"]');
  modeRadios.forEach(r => {
    r.checked = (r.value === (char.wardrobeMode || 'duty'));
  });

  // Color inputs
  const colorSync = [
    { id: 'color-primary', val: char.colors.primary },
    { id: 'color-secondary', val: char.colors.secondary },
    { id: 'color-accent', val: char.colors.accent },
    { id: 'color-skin', val: char.colors.skin },
    { id: 'color-hair', val: char.colors.hair },
    { id: 'color-eyes', val: char.colors.eyes }
  ];

  colorSync.forEach(({ id, val }) => {
    const el = document.getElementById(id);
    if (el && el.value !== val) el.value = val;
  });
}

/**
 * Re-renders the Visualizer section and Prompt Matrix.
 * @param {Object} state
 */
function renderStudio(state) {
  const { character, ui } = state;

  // 1. Sync form values
  syncFormValues(character);

  // 2. Evaluate biometrics
  const bio = evaluateBiometrics(character);

  // 3. Render Visualizers
  const mannequinContainer = document.getElementById('mannequin-container');
  const faceContainer = document.getElementById('face-container');
  const visualizerWrapper = document.getElementById('visualizer-stage');

  if (mannequinContainer) {
    mannequinContainer.innerHTML = renderBodyMannequin(character, ui.bodyView);
  }

  if (faceContainer) {
    faceContainer.innerHTML = renderFaceArchitecture(character);
  }

  // Adjust display layout classes (body, face, split)
  if (visualizerWrapper) {
    visualizerWrapper.className = `visualizer-stage stage-${ui.displayMode}`;
  }

  // 4. Character HUD Badge
  const hudName = document.getElementById('hud-char-name');
  const hudAlias = document.getElementById('hud-char-alias');
  const hudRole = document.getElementById('hud-char-role');
  const hudStyleTag = document.getElementById('hud-char-style-tag');

  if (hudName) hudName.innerText = character.name;
  if (hudAlias) hudAlias.innerText = character.alias ? `"${character.alias}"` : '';
  if (hudRole) hudRole.innerText = character.role || 'Vanguard Specialist';
  if (hudStyleTag) {
    const styleLabels = {
      webtoon_action: 'Solo Leveling Manhwa',
      modern_anime: 'Modern Anime Key Visual',
      detailed_seinen: 'Detailed Seinen Manga',
      semi_realistic: 'Semi-Realistic Concept Art'
    };
    hudStyleTag.innerText = styleLabels[character.style] || character.style;
    hudStyleTag.style.borderColor = character.colors.accent;
    hudStyleTag.style.color = character.colors.accent;
  }

  // 5. Palette Swatches
  const swatchContainer = document.getElementById('swatch-bar');
  if (swatchContainer) {
    const entries = [
      { label: 'PRI', hex: character.colors.primary },
      { label: 'SEC', hex: character.colors.secondary },
      { label: 'ACC', hex: character.colors.accent },
      { label: 'SKN', hex: character.colors.skin },
      { label: 'HAR', hex: character.colors.hair },
      { label: 'EYE', hex: character.colors.eyes }
    ];
    swatchContainer.innerHTML = entries.map(s => `
      <div class="swatch-item" title="${s.label}: ${s.hex}">
        <span class="swatch-color" style="background-color: ${s.hex}"></span>
        <span class="swatch-code">${s.hex}</span>
      </div>
    `).join('');
  }

  // 6. Biometrics Radar & Scores
  const radarContainer = document.getElementById('radar-container');
  if (radarContainer) {
    radarContainer.innerHTML = renderRadarChart(bio.radarMetrics, character.colors.accent);
  }

  const scoreBars = [
    { id: 'bar-phi', val: bio.phiScore },
    { id: 'bar-dimorphic', val: bio.dimorphicScore },
    { id: 'bar-vtaper', val: bio.vTaperIndex },
    { id: 'bar-athletic', val: bio.athleticPower },
    { id: 'bar-sharpness', val: bio.facialSharpness },
    { id: 'bar-harmony', val: bio.aestheticHarmony }
  ];

  scoreBars.forEach(({ id, val }) => {
    const bar = document.getElementById(id);
    const label = document.getElementById(`${id}-val`);
    if (bar) {
      bar.style.width = `${val}%`;
      bar.style.backgroundColor = character.colors.accent;
    }
    if (label) label.innerText = `${val}%`;
  });

  // 7. Prompt Matrix Generation
  const prompts = generatePromptMatrix(character, ui.promptMode);
  
  const mjEl = document.getElementById('prompt-text-midjourney');
  const sdxlPosEl = document.getElementById('prompt-text-sdxl-pos');
  const sdxlNegEl = document.getElementById('prompt-text-sdxl-neg');
  const fluxEl = document.getElementById('prompt-text-flux');

  if (mjEl) mjEl.innerText = prompts.midjourney;
  if (sdxlPosEl) sdxlPosEl.innerText = prompts.sdxl.positive;
  if (sdxlNegEl) sdxlNegEl.innerText = prompts.sdxl.negative;
  if (fluxEl) fluxEl.innerText = prompts.flux;
}

/**
 * Initializes the entire Studio application on DOM load.
 */
export function initStudio() {
  initPresetPicker();
  bindInputs();

  // Subscribe renderer to store
  store.subscribe((state) => {
    renderStudio(state);
  });

  console.log('GLM Hyper Character Studio initialized successfully.');
}

// Auto-run if running in browser
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStudio);
  } else {
    initStudio();
  }
}
