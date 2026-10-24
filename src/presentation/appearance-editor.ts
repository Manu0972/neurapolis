/**
 * Éditeur d'apparence (création de personnage et armoire de la chambre) : onglets Silhouette,
 * Corps, Visage, Cheveux, Tenue, Accessoires ; options non genrées ; tenues verrouillées selon le
 * palier ; barbe à partir de 16 ans ; « Aléatoire » déterministe.
 *
 * Silhouette (v26) : le personnage dessiné (tous les réglages) ou un modèle détaillé du studio de la
 * tranche d'âge, choisi sur vignette. Sur un modèle détaillé, peau, cheveux, haut, bas, chaussures et
 * accessoires s'appliquent ; coupe, yeux, morphologie et barbe viennent du modèle.
 */
import type { PlayerAppearance, PlayerGear, PlayerGearColorKey } from '../core/types';
import {
  ACCESSORY_INFO, BEARD_INFO, BEARD_MIN_AGE, BODY_INFO, EYES_INFO, EYE_COLOR_INFO, GLASSES_INFO,
  HAIR_COLOR_INFO, HAIR_STYLE_INFO, OUTFIT_COLOR_INFO, OUTFIT_STYLE_INFO, OUTFIT_TIER, SKIN_TONE_INFO, VALID_BEARDS,
  VALID_BODIES, VALID_EYES, VALID_EYE_COLORS, VALID_GEAR, VALID_GLASSES, VALID_HAIR_COLORS, VALID_HAIR_STYLES,
  VALID_OUTFIT_COLORS, VALID_OUTFIT_STYLES, VALID_SKIN_TONES, chosenModel, outfitAllowed, randomAppearance, toggleGear,
  wornGear,
} from '../core/player_customization';
import { startRiggedCharacters } from './city3d/rigged/library';
import type { RigModelEntry } from './city3d/rigged/manifest';
import { playerRigModel, setPlayerRigModel, silhouetteChoices } from './city3d/rigged/playerModel';
import { rigThumbnail } from './avatar-preview3d';

// Compatibilité : l'aléatoire vit désormais dans le cœur (logique pure, testée).
export { randomAppearance };

export interface AppearanceEditorOptions {
  age: number;
  tier: number;
  onChange(a: PlayerAppearance): void;
}

const TIER_NAMES = ['', 'La Cour', 'Le Quartier', 'La Ville', 'La Vallée', 'Le Pays', 'Le Monde'];

type Tab = 'silhouette' | 'corps' | 'visage' | 'cheveux' | 'tenue' | 'accessoires';
const TABS: { id: Tab; label: string }[] = [
  { id: 'silhouette', label: '🧍 Silhouette' },
  { id: 'corps', label: '🎨 Corps' },
  { id: 'visage', label: '🙂 Visage' },
  { id: 'cheveux', label: '💇 Cheveux' },
  { id: 'tenue', label: '👕 Tenue' },
  { id: 'accessoires', label: '🎒 Accessoires' },
];

const GEAR_LABEL: Record<PlayerGearColorKey, string> = { ...Object.fromEntries(VALID_GEAR.map((g) => [g, ACCESSORY_INFO[g].label])), lunettes: 'Lunettes' } as Record<PlayerGearColorKey, string>;

function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Silhouette affichée : celle de l'apparence, sinon la préférence de l'appareil (parties d'avant v26). */
export function effectiveModel(a: PlayerAppearance): string | null {
  const c = chosenModel(a);
  return c !== undefined ? c : playerRigModel() ?? null;
}

export function buildAppearanceEditor(initial: PlayerAppearance, opts: AppearanceEditorOptions): { root: HTMLElement; get(): PlayerAppearance; set(a: PlayerAppearance): void } {
  let a: PlayerAppearance = { ...initial };
  let tab: Tab = 'silhouette';
  let seed = 1;
  let models: RigModelEntry[] = [];
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

  // Silhouettes de la tranche d'âge (manifeste du studio) ; sans manifeste : seulement le dessin.
  void startRiggedCharacters().then((m) => {
    models = m ? silhouetteChoices(m.models, opts.age) : [];
    if (models.length > 0) render();
  });

  const detailed = (): boolean => {
    const id = effectiveModel(a);
    return !!id && models.some((m) => m.id === id);
  };

  function group(label: string): HTMLElement {
    const g = h('div', 'ae-group');
    g.appendChild(h('div', 'ae-label', label));
    panel.appendChild(g);
    return g;
  }

  function note(text: string): void {
    panel.appendChild(h('p', 'ae-note', text));
  }

  /** Pastilles de couleur ; `origin` ajoute une pastille « d'origine » (valeur absente). */
  function swatches<T extends string>(label: string, list: readonly T[], info: Record<T, { label: string; hex: string }>, cur: T | undefined, pick: (v: T | undefined) => void, origin?: string): void {
    const g = group(label);
    const row = h('div', 'ae-swatches');
    const add = (v: T | undefined, title: string, hex?: string): void => {
      const on = v === cur;
      const b = h('button', `ae-swatch${on ? ' on' : ''}${hex ? '' : ' ae-origin'}`);
      b.type = 'button';
      b.title = title;
      b.setAttribute('aria-label', `${label} : ${title}`);
      b.setAttribute('aria-pressed', String(on));
      if (hex) b.style.setProperty('--sw', hex);
      b.addEventListener('click', () => pick(v));
      row.appendChild(b);
    };
    if (origin) add(undefined, origin);
    for (const v of list) add(v, info[v].label, info[v].hex);
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

  function silhouettePanel(): void {
    const cur = effectiveModel(a);
    const g = group('Choisis ta silhouette');
    const grid = h('div', 'ae-sil-grid');
    const card = (id: string | null, caption: string, fill: (box: HTMLElement) => void): void => {
      const on = id === cur || (id === null && !detailed());
      const b = h('button', `ae-sil${on ? ' on' : ''}`);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', `Silhouette : ${caption}`);
      b.dataset.model = id ?? 'dessin';
      const box = h('span', 'ae-sil-img');
      fill(box);
      b.append(box, h('span', 'ae-sil-cap', caption));
      b.addEventListener('click', () => {
        setPlayerRigModel(id ?? undefined);
        change({ model: id ?? 'dessin' });
      });
      grid.appendChild(b);
    };
    card(null, 'Dessiné', (box) => { box.textContent = '✏️'; box.classList.add('ae-sil-draw'); });
    models.forEach((m, i) => card(m.id, `Détaillée ${i + 1}`, (box) => {
      box.textContent = '…';
      void rigThumbnail(m).then((url) => {
        if (!url) { box.textContent = '🧍'; return; }
        const img = new Image();
        img.src = url;
        img.alt = '';
        box.replaceChildren(img);
      });
    }));
    g.appendChild(grid);
    if (models.length === 0) note('Aucune silhouette détaillée sur cet appareil : le personnage dessiné garde tous les réglages.');
    else if (detailed()) note('Silhouette détaillée : peau, cheveux, haut, bas, chaussures et accessoires sont à toi ; la coupe, les yeux et la morphologie viennent du modèle.');
    else note('Personnage dessiné : tous les réglages s’appliquent (coupe, yeux, morphologie, barbe…).');
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
    rnd.title = 'Une tenue au hasard (toujours la même suite de propositions)';
    rnd.addEventListener('click', () => {
      const r = randomAppearance(seed++, opts.age, opts.tier, models.map((m) => m.id));
      if (r.model) setPlayerRigModel(r.model);
      change(models.length > 0 ? r : { ...r, model: a.model });
    });
    tabs.appendChild(rnd);
    panel.replaceChildren();
    const fromModel = detailed() ? ' (silhouette dessinée seulement)' : '';
    if (tab === 'silhouette') {
      silhouettePanel();
    } else if (tab === 'corps') {
      swatches('Teinte de peau', VALID_SKIN_TONES, SKIN_TONE_INFO, a.skinTone, (v) => v && change({ skinTone: v }));
      pills(`Morphologie${fromModel}`, VALID_BODIES, BODY_INFO, a.body, (v) => change({ body: v }));
      const g = group(`Taille : ${['très petite', 'petite', 'moyenne', 'grande', 'très grande'][(a.heightAdj ?? 0) + 2]}`);
      const range = h('input', 'ae-range');
      range.type = 'range';
      range.min = '-2';
      range.max = '2';
      range.step = '1';
      range.value = String(a.heightAdj ?? 0);
      range.setAttribute('aria-label', 'Taille');
      range.addEventListener('change', () => change({ heightAdj: Number(range.value) }));
      g.appendChild(range);
    } else if (tab === 'visage') {
      if (detailed()) note('Sur une silhouette détaillée, le visage vient du modèle : ces réglages valent pour le personnage dessiné.');
      pills('Forme des yeux', VALID_EYES, EYES_INFO, a.eyes, (v) => change({ eyes: v }));
      swatches('Couleur des yeux', VALID_EYE_COLORS, EYE_COLOR_INFO, a.eyeColor, (v) => v && change({ eyeColor: v }));
      const g = group('Taches de rousseur');
      const t = h('button', `ae-pill${a.freckles ? ' on' : ''}`, a.freckles ? '✨ Oui' : 'Non');
      t.type = 'button';
      t.setAttribute('aria-pressed', String(!!a.freckles));
      t.addEventListener('click', () => change({ freckles: !a.freckles }));
      g.appendChild(t);
      pills('Barbe', VALID_BEARDS, BEARD_INFO, a.beard, (v) => change({ beard: v }), (v) => (v !== 'aucune' && opts.age < BEARD_MIN_AGE ? `À partir de ${BEARD_MIN_AGE} ans` : null));
    } else if (tab === 'cheveux') {
      swatches('Couleur', VALID_HAIR_COLORS, HAIR_COLOR_INFO, a.hairColor, (v) => v && change({ hairColor: v }));
      pills(`Coupe${fromModel}`, VALID_HAIR_STYLES, HAIR_STYLE_INFO, a.hairStyle, (v) => change({ hairStyle: v }));
    } else if (tab === 'tenue') {
      pills('Style', VALID_OUTFIT_STYLES, OUTFIT_STYLE_INFO, a.outfitStyle, (v) => change({ outfitStyle: v }), (v) => (outfitAllowed(v, opts.tier) ? null : `Palier ${OUTFIT_TIER[v]} — ${TIER_NAMES[OUTFIT_TIER[v]] ?? ''}`));
      swatches('Haut', VALID_OUTFIT_COLORS, OUTFIT_COLOR_INFO, a.outfitColor, (v) => v && change({ outfitColor: v }));
      swatches('Bas (pantalon, jupe)', VALID_OUTFIT_COLORS, OUTFIT_COLOR_INFO, a.bottomColor, (v) => change({ bottomColor: v }), 'D’origine');
      swatches('Chaussures', VALID_OUTFIT_COLORS, OUTFIT_COLOR_INFO, a.shoesColor, (v) => change({ shoesColor: v }), 'D’origine');
    } else {
      const worn = wornGear(a);
      const g = group('À porter (plusieurs à la fois)');
      const row = h('div', 'ae-pills');
      for (const k of VALID_GEAR) {
        const on = worn.includes(k);
        const b = h('button', `ae-pill${on ? ' on' : ''}`, `${ACCESSORY_INFO[k].icon} ${ACCESSORY_INFO[k].label}`);
        b.type = 'button';
        b.dataset.gear = k;
        b.setAttribute('aria-pressed', String(on));
        if (k === 'casquette' || k === 'bonnet') b.title = 'Casquette ou bonnet : l’un remplace l’autre';
        b.addEventListener('click', () => change(toggleGear(a, k as PlayerGear)));
        row.appendChild(b);
      }
      g.appendChild(row);
      pills('Lunettes', VALID_GLASSES, GLASSES_INFO, a.glasses, (v) => change({ glasses: v }));
      const colored: PlayerGearColorKey[] = [...worn, ...(a.glasses && a.glasses !== 'aucune' ? ['lunettes' as const] : [])];
      for (const k of colored) {
        // « D'origine » : couleur propre à la pièce (celle du dessin ou, sur un modèle détaillé, la teinte par défaut).
        swatches(`Couleur — ${GEAR_LABEL[k]}`, VALID_OUTFIT_COLORS, OUTFIT_COLOR_INFO, a.gearColors?.[k], (v) => {
          const gearColors = { ...a.gearColors };
          if (v) gearColors[k] = v; else delete gearColors[k];
          change({ gearColors });
        }, 'D’origine');
      }
      if (colored.length === 0) note('Choisis un accessoire pour régler sa couleur.');
    }
  }

  ensureEditorStyles();
  render();
  return { root, get: () => ({ ...a }), set: (n) => { a = { ...n }; render(); } };
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
  .ae-note { margin: 0; font-size: 12.5px; line-height: 1.4; opacity: 0.8; }
  .ae-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
  .ae-swatch { width: 34px; height: 34px; border-radius: 50%; border: 3px solid rgba(255, 255, 255, 0.85); background: var(--sw); box-shadow: 0 0 0 2px rgba(60, 42, 32, 0.25); cursor: pointer; transition: transform 0.12s ease; }
  .ae-swatch.ae-origin { background: linear-gradient(135deg, #f3ead8 0 45%, #b5483a 45% 55%, #f3ead8 55% 100%); }
  .ae-swatch:hover { transform: scale(1.08); }
  .ae-swatch.on { box-shadow: 0 0 0 3px #3c2a20, 0 0 0 6px #ffd98a; transform: scale(1.1); }
  .ae-pills { display: flex; flex-wrap: wrap; gap: 6px; }
  .ae-pill { border: 2px solid rgba(60, 42, 32, 0.2); background: rgba(255, 255, 255, 0.6); color: #2a1a14; border-radius: 10px; padding: 6px 10px; font: inherit; font-size: 13px; cursor: pointer; }
  .ae-pill.on { background: #ffd98a; border-color: #3c2a20; font-weight: 800; }
  .ae-pill.locked { opacity: 0.5; cursor: not-allowed; }
  .ae-sil-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(78px, 1fr)); gap: 8px; }
  .ae-sil { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 6px 4px; border: 2px solid rgba(60, 42, 32, 0.2); border-radius: 12px; background: rgba(255, 255, 255, 0.6); color: #2a1a14; font: inherit; font-size: 12px; cursor: pointer; transition: transform 0.12s ease; }
  .ae-sil:hover { transform: translateY(-2px); }
  .ae-sil.on { background: #ffd98a; border-color: #3c2a20; font-weight: 800; }
  .ae-sil-img { width: 63px; height: 84px; display: flex; align-items: center; justify-content: center; font-size: 26px; border-radius: 8px; background: radial-gradient(ellipse at 50% 38%, #fff7e6 0%, #efe0c2 70%); }
  .ae-sil-img img { width: 100%; height: 100%; object-fit: contain; }
  .ae-sil-cap { line-height: 1.1; }
  .ae-tab:focus-visible, .ae-swatch:focus-visible, .ae-pill:focus-visible, .ae-sil:focus-visible { outline: 3px solid #f48c5d; outline-offset: 2px; }
  .ae-range { width: 100%; accent-color: #3c2a20; }
  @media (prefers-reduced-motion: reduce) { .ae-swatch, .ae-sil { transition: none; } }
  `;
  document.head.appendChild(css);
}
