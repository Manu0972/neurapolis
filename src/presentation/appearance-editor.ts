/**
 * Éditeur d'apparence (création de personnage et armoire de la chambre) : onglets Corps,
 * Visage, Cheveux, Tenue, Accessoires ; options non genrées ; tenues verrouillées selon le
 * palier ; barbe à partir de 16 ans ; « Aléatoire » déterministe.
 */
import type { PlayerAppearance, PlayerGender } from '../core/types';
import {
  ADULT_HEIGHT_MAX_CM, ADULT_HEIGHT_MIN_CM, adultHeightOf, familyLooks, formatHeight, heightAtAge,
} from '../core/human_variety';
import {
  ACCESSORY_INFO, BEARD_INFO, BEARD_MIN_AGE, BODY_INFO, EYES_INFO, EYE_COLOR_INFO, GLASSES_INFO, HAIR_COLOR_INFO,
  HAIR_STYLE_INFO, OUTFIT_COLOR_INFO, OUTFIT_STYLE_INFO, OUTFIT_TIER, SKIN_TONE_INFO, VALID_ACCESSORIES, VALID_BEARDS,
  VALID_BODIES, VALID_EYES, VALID_EYE_COLORS, VALID_GLASSES, VALID_HAIR_COLORS, VALID_HAIR_STYLES,
  VALID_OUTFIT_COLORS, VALID_OUTFIT_STYLES, VALID_SKIN_TONES, outfitAllowed,
} from '../core/player_customization';

export interface AppearanceEditorOptions {
  age: number;
  tier: number;
  /** Genre choisi : il règle la croissance (pic plus tôt chez les filles) et la famille. */
  gender?: () => PlayerGender | undefined;
  onChange(a: PlayerAppearance): void;
}

const TIER_NAMES = ['', 'La Cour', 'Le Quartier', 'La Ville', 'La Vallée', 'Le Pays', 'Le Monde'];

type Tab = 'corps' | 'visage' | 'cheveux' | 'tenue' | 'accessoires';
const TABS: { id: Tab; label: string }[] = [
  { id: 'corps', label: '🧍 Corps' },
  { id: 'visage', label: '🙂 Visage' },
  { id: 'cheveux', label: '💇 Cheveux' },
  { id: 'tenue', label: '👕 Tenue' },
  { id: 'accessoires', label: '🎒 Accessoires' },
];

function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function buildAppearanceEditor(initial: PlayerAppearance, opts: AppearanceEditorOptions): { root: HTMLElement; get(): PlayerAppearance; set(a: PlayerAppearance): void } {
  let a: PlayerAppearance = { ...initial };
  let tab: Tab = 'corps';
  let seed = 1;
  const root = h('div', 'ae');
  const tabs = h('div', 'ae-tabs');
  tabs.setAttribute('role', 'tablist');
  const panel = h('div', 'ae-panel');
  panel.setAttribute('role', 'tabpanel');
  root.append(tabs, panel);

  const change = (patch: Partial<PlayerAppearance>): void => {
    a = { ...a, ...patch };
    opts.onChange(a);
    render();
  };

  function group(label: string): HTMLElement {
    const g = h('div', 'ae-group');
    g.appendChild(h('div', 'ae-label', label));
    panel.appendChild(g);
    return g;
  }

  function swatches<T extends string>(label: string, list: readonly T[], info: Record<T, { label: string; hex: string }>, cur: T | undefined, pick: (v: T) => void): void {
    const g = group(label);
    const row = h('div', 'ae-swatches');
    for (const v of list) {
      const b = h('button', `ae-swatch${v === cur ? ' on' : ''}`);
      b.type = 'button';
      b.title = info[v].label;
      b.setAttribute('aria-label', `${label} : ${info[v].label}`);
      b.setAttribute('aria-pressed', String(v === cur));
      b.style.setProperty('--sw', info[v].hex);
      b.addEventListener('click', () => pick(v));
      row.appendChild(b);
    }
    g.appendChild(row);
  }

  function pills<T extends string>(label: string, list: readonly T[], info: Record<T, { label: string; icon: string }>, cur: T | undefined, pick: (v: T) => void, locked?: (v: T) => string | null): void {
    const g = group(label);
    const row = h('div', 'ae-pills');
    for (const v of list) {
      const lock = locked?.(v) ?? null;
      const b = h('button', `ae-pill${v === cur ? ' on' : ''}${lock ? ' locked' : ''}`, `${lock ? '🔒' : info[v].icon} ${info[v].label}`);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(v === cur));
      if (lock) { b.disabled = true; b.title = lock; } else b.addEventListener('click', () => pick(v));
      row.appendChild(b);
    }
    g.appendChild(row);
  }

  function render(): void {
    tabs.replaceChildren();
    for (const t of TABS) {
      const b = h('button', `ae-tab${t.id === tab ? ' on' : ''}`, t.label);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(t.id === tab));
      b.addEventListener('click', () => { tab = t.id; render(); });
      tabs.appendChild(b);
    }
    const rnd = h('button', 'ae-tab ae-random', '🎲 Aléatoire');
    rnd.type = 'button';
    rnd.addEventListener('click', () => change(randomAppearance(seed++, opts.age, opts.tier)));
    tabs.appendChild(rnd);
    panel.replaceChildren();
    if (tab === 'corps') {
      swatches('Teinte de peau', VALID_SKIN_TONES, SKIN_TONE_INFO, a.skinTone, (v) => change({ skinTone: v }));
      pills('Morphologie', VALID_BODIES, BODY_INFO, a.body, (v) => change({ body: v }));
      // Taille adulte visée : à 12 ans on n'en a qu'une partie ; la croissance fait le reste.
      const gender = opts.gender?.();
      const target = adultHeightOf(a, gender);
      const g = group(`Taille adulte visée : ${formatHeight(target / 100)}`);
      const range = h('input', 'ae-range');
      range.type = 'range';
      range.min = String(ADULT_HEIGHT_MIN_CM);
      range.max = String(ADULT_HEIGHT_MAX_CM);
      range.step = '1';
      range.value = String(target);
      range.setAttribute('aria-label', 'Taille adulte visée');
      const now = h('p', 'ae-note', '');
      const refresh = (cm: number): void => {
        (g.firstChild as HTMLElement).textContent = `Taille adulte visée : ${formatHeight(cm / 100)}`;
        now.textContent = `Aujourd’hui, à ${opts.age} ans : ${formatHeight(heightAtAge(opts.age, cm, gender))}. Tu grandiras jusqu’à ${formatHeight(cm / 100)} vers ${gender === 'fille' ? 16 : 18} ans.`;
      };
      refresh(target);
      range.addEventListener('input', () => refresh(Number(range.value)));
      range.addEventListener('change', () => change({ adultHeightCm: Number(range.value) }));
      g.append(range, now);
      // La famille suit le personnage : teintes, cheveux, yeux et tailles cohérents.
      const fam = group('Ta famille (elle découle de tes choix)');
      for (const p of familyLooks(a, gender)) {
        const row = h('div', 'ae-family');
        const dot = h('span', 'ae-family-dot');
        dot.style.setProperty('--sw', SKIN_TONE_INFO[p.appearance.skinTone].hex);
        const hair = h('span', 'ae-family-dot');
        hair.style.setProperty('--sw', HAIR_COLOR_INFO[p.appearance.hairColor].hex);
        row.append(dot, hair, h('span', '', `${p.name}, ${p.role} · ${SKIN_TONE_INFO[p.appearance.skinTone].label.toLowerCase()} · cheveux ${HAIR_COLOR_INFO[p.appearance.hairColor].label.toLowerCase()} · ${formatHeight(p.heightM)}`));
        fam.appendChild(row);
      }
    } else if (tab === 'visage') {
      pills('Forme des yeux', VALID_EYES, EYES_INFO, a.eyes, (v) => change({ eyes: v }));
      swatches('Couleur des yeux', VALID_EYE_COLORS, EYE_COLOR_INFO, a.eyeColor, (v) => change({ eyeColor: v }));
      pills('Lunettes', VALID_GLASSES, GLASSES_INFO, a.glasses, (v) => change({ glasses: v }));
      const g = group('Taches de rousseur');
      const t = h('button', `ae-pill${a.freckles ? ' on' : ''}`, a.freckles ? '✨ Oui' : 'Non');
      t.type = 'button';
      t.setAttribute('aria-pressed', String(!!a.freckles));
      t.addEventListener('click', () => change({ freckles: !a.freckles }));
      g.appendChild(t);
      pills('Barbe', VALID_BEARDS, BEARD_INFO, a.beard, (v) => change({ beard: v }), (v) => (v !== 'aucune' && opts.age < BEARD_MIN_AGE ? `À partir de ${BEARD_MIN_AGE} ans` : null));
    } else if (tab === 'cheveux') {
      pills('Coupe', VALID_HAIR_STYLES, HAIR_STYLE_INFO, a.hairStyle, (v) => change({ hairStyle: v }));
      swatches('Couleur', VALID_HAIR_COLORS, HAIR_COLOR_INFO, a.hairColor, (v) => change({ hairColor: v }));
    } else if (tab === 'tenue') {
      pills('Style', VALID_OUTFIT_STYLES, OUTFIT_STYLE_INFO, a.outfitStyle, (v) => change({ outfitStyle: v }), (v) => (outfitAllowed(v, opts.tier) ? null : `Palier ${OUTFIT_TIER[v]} — ${TIER_NAMES[OUTFIT_TIER[v]] ?? ''}`));
      swatches('Couleur', VALID_OUTFIT_COLORS, OUTFIT_COLOR_INFO, a.outfitColor, (v) => change({ outfitColor: v }));
    } else {
      pills('Accessoire', VALID_ACCESSORIES, ACCESSORY_INFO, a.accessory, (v) => change({ accessory: v }));
    }
  }

  ensureEditorStyles();
  render();
  return { root, get: () => ({ ...a }), set: (n) => { a = { ...n }; render(); } };
}

/** Apparence au hasard, reproductible (même graine → même résultat), respectant âge et palier. */
export function randomAppearance(seed: number, age: number, tier: number): PlayerAppearance {
  let s = (seed * 2654435761) >>> 0;
  const r = (): number => {
    s = Math.imul(s ^ (s >>> 15), 2246822519) >>> 0;
    s = Math.imul(s ^ (s >>> 13), 3266489917) >>> 0;
    return ((s ^ (s >>> 16)) >>> 0) / 4294967296;
  };
  const pick = <T,>(list: readonly T[]): T => list[Math.floor(r() * list.length)]!;
  const outfits = VALID_OUTFIT_STYLES.filter((o) => outfitAllowed(o, tier));
  return {
    skinTone: pick(VALID_SKIN_TONES),
    hairColor: r() < 0.82 ? pick(VALID_HAIR_COLORS.slice(0, 6)) : pick(VALID_HAIR_COLORS),
    hairStyle: pick(VALID_HAIR_STYLES),
    outfitStyle: pick(outfits),
    outfitColor: pick(VALID_OUTFIT_COLORS),
    body: pick(VALID_BODIES),
    adultHeightCm: Math.round(150 + (r() + r() + r()) / 3 * 45),
    eyes: pick(VALID_EYES),
    eyeColor: pick(VALID_EYE_COLORS),
    glasses: r() < 0.65 ? 'aucune' : pick(VALID_GLASSES),
    freckles: r() < 0.25,
    beard: age >= BEARD_MIN_AGE && r() < 0.4 ? pick(VALID_BEARDS) : 'aucune',
    accessory: r() < 0.5 ? 'aucun' : pick(VALID_ACCESSORIES),
  };
}

let stylesDone = false;
function ensureEditorStyles(): void {
  if (stylesDone) return;
  stylesDone = true;
  const css = document.createElement('style');
  css.textContent = `
  .ae { display: flex; flex-direction: column; gap: 10px; }
  .ae-tabs { display: flex; flex-wrap: wrap; gap: 6px; }
  .ae-tab { border: 2px solid rgba(60, 42, 32, 0.25); background: rgba(255, 255, 255, 0.55); color: inherit; border-radius: 999px; padding: 6px 12px; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
  .ae-tab.on { background: #3c2a20; color: #fbf3e2; border-color: #3c2a20; }
  .ae-random { margin-left: auto; }
  .ae-panel { display: flex; flex-direction: column; gap: 12px; }
  .ae-group { display: flex; flex-direction: column; gap: 6px; }
  .ae-label { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.75; }
  .ae-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
  .ae-swatch { width: 34px; height: 34px; border-radius: 50%; border: 3px solid rgba(255, 255, 255, 0.85); background: var(--sw); box-shadow: 0 0 0 2px rgba(60, 42, 32, 0.25); cursor: pointer; transition: transform 0.12s ease; }
  .ae-swatch:hover { transform: scale(1.08); }
  .ae-swatch.on { box-shadow: 0 0 0 3px #3c2a20, 0 0 0 6px #ffd98a; transform: scale(1.1); }
  .ae-pills { display: flex; flex-wrap: wrap; gap: 6px; }
  .ae-pill { border: 2px solid rgba(60, 42, 32, 0.2); background: rgba(255, 255, 255, 0.6); color: #2a1a14; border-radius: 10px; padding: 6px 10px; font: inherit; font-size: 13px; cursor: pointer; }
  .ae-pill.on { background: #ffd98a; border-color: #3c2a20; font-weight: 800; }
  .ae-pill.locked { opacity: 0.5; cursor: not-allowed; }
  .ae-tab:focus-visible, .ae-swatch:focus-visible, .ae-pill:focus-visible { outline: 3px solid #f48c5d; outline-offset: 2px; }
  .ae-range { width: 100%; accent-color: #3c2a20; }
  .ae-note { margin: 4px 0 0; font-size: 12px; opacity: 0.8; }
  .ae-family { display: flex; align-items: center; gap: 6px; font-size: 12.5px; margin-top: 4px; }
  .ae-family-dot { width: 14px; height: 14px; border-radius: 50%; background: var(--sw); border: 1px solid rgba(0,0,0,0.3); flex: 0 0 auto; }
  .avatar-preview-canvas { width: 100%; max-width: 240px; aspect-ratio: 4 / 5; height: auto; display: block; margin: 0 auto; cursor: grab; border-radius: 16px; background: radial-gradient(ellipse at 50% 40%, #fff7e6 0%, #e9d9bc 100%); }
  .avatar-preview-canvas:active { cursor: grabbing; }
  @media (prefers-reduced-motion: reduce) { .ae-swatch { transition: none; } }
  `;
  document.head.appendChild(css);
}
