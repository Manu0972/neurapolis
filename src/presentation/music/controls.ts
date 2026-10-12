/**
 * Panneau « Son » du tiroir de menu : volume musique, volume effets, coupure, état musical en cours.
 * Se greffe sous la barre caméra & son existante ; styles autonomes (aucun fichier CSS partagé touché).
 */
import { audio } from '../audio';
import { benchMusicOffline } from './engine';

const STYLE_ID = 'music-controls-style';
const CSS = `
.music-controls { display: grid; gap: 6px; margin-top: 6px; font-size: 12px; }
.music-controls label.mc-row { display: grid; grid-template-columns: 64px 1fr 38px; align-items: center; gap: 8px; }
.music-controls input[type=range] { width: 100%; accent-color: #d9973e; min-width: 0; }
.music-controls .mc-val { text-align: right; font-variant-numeric: tabular-nums; opacity: .85; }
.music-controls label.mc-mute { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.music-controls .mc-now { opacity: .8; font-size: 11.5px; line-height: 1.4; }
`;

function ensureStyle(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const st = document.createElement('style');
  st.id = STYLE_ID;
  st.textContent = CSS;
  document.head.appendChild(st);
}

function slider(label: string, value: number, onInput: (v: number) => void): { row: HTMLLabelElement; set(v: number): void } {
  const row = document.createElement('label');
  row.className = 'mc-row';
  const name = document.createElement('span');
  name.textContent = label;
  const input = document.createElement('input');
  input.type = 'range';
  input.min = '0';
  input.max = '100';
  input.step = '5';
  input.setAttribute('aria-label', `Volume ${label.toLowerCase()}`);
  const val = document.createElement('span');
  val.className = 'mc-val';
  const set = (v: number): void => {
    const pct = Math.round(v * 100);
    input.value = String(pct);
    val.textContent = `${pct} %`;
  };
  set(value);
  input.addEventListener('input', () => {
    const v = Number(input.value) / 100;
    val.textContent = `${Math.round(v * 100)} %`;
    onInput(v);
  });
  row.append(name, input, val);
  return { row, set };
}

/**
 * Monte le panneau Son après `anchor` (la barre caméra & son) et synchronise le bouton 🔊/🔇.
 * Charge aussi les réglages mémorisés et met le son en pause quand l'onglet est caché.
 */
export function mountSoundControls(anchor: HTMLElement, muteBtn?: HTMLButtonElement): HTMLElement {
  audio.loadPrefs();
  ensureStyle();
  const box = document.createElement('div');
  box.className = 'music-controls';
  const music = slider('Musique', audio.getMusicVolume(), (v) => audio.setMusicVolume(v));
  const effects = slider('Effets', audio.getEffectsVolume(), (v) => audio.setEffectsVolume(v));
  const muteRow = document.createElement('label');
  muteRow.className = 'mc-mute';
  const mute = document.createElement('input');
  mute.type = 'checkbox';
  mute.addEventListener('change', () => audio.setMuted(mute.checked));
  muteRow.append(mute, document.createTextNode('Couper tout le son'));
  const nowEl = document.createElement('div');
  nowEl.className = 'mc-now';
  box.append(music.row, effects.row, muteRow, nowEl);
  anchor.after(box);

  const sync = (): void => {
    const muted = audio.isMuted();
    mute.checked = muted;
    if (muteBtn) muteBtn.textContent = muted ? '🔇' : '🔊';
    music.set(audio.getMusicVolume());
    effects.set(audio.getEffectsVolume());
    const st = audio.musicStatus();
    nowEl.textContent = st.running
      ? `♪ ${st.label} · ${st.bpm} BPM — ${st.reason}`
      : muted ? '♪ Son coupé' : audio.getMusicVolume() === 0 ? '♪ Musique coupée' : '♪ La musique démarre au premier clic';
  };
  audio.onChange(sync);
  sync();
  // Le tempo glisse : on rafraîchit l'affichage tant que le panneau est visible.
  setInterval(() => { if (box.offsetParent !== null) sync(); }, 1000);

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => audio.setHidden(document.hidden));
  }
  // Outils de mesure en développement seulement (console : __musique.bench(), __musique.stats()).
  if (import.meta.env?.DEV && typeof window !== 'undefined') {
    Object.assign(window, { __musique: { bench: benchMusicOffline, stats: () => audio.musicStats(), status: () => audio.musicStatus() } });
  }
  return box;
}
