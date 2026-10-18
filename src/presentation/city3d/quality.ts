/**
 * Qualité graphique (bas / moyen / haut) : préréglages de rendu, détection simple de la capacité
 * de la machine, préférence du joueur (« Caméra et son ») et abonnement du moteur de rendu.
 * La logique de choix est pure (testée) ; seul `qualitySelectEl` touche au DOM.
 */
export type QualityLevel = 'bas' | 'moyen' | 'haut';
export type QualityPref = 'auto' | QualityLevel;

export interface QualityPreset {
  /** Plafond du rapport de pixels (écrans haute densité). */
  maxPixelRatio: number;
  /** Taille de la carte d'ombre du soleil (px) et demi-largeur du cadre d'ombre (m). */
  shadowMap: number;
  shadowExtent: number;
  /** Ombres douces (PCF filtré) plutôt que nettes. */
  softShadows: boolean;
  /**
   * Post-traitement : `aucun` (rendu direct), `leger` (rendu direct anticrénelé + vignette en
   * surimpression, presque gratuit), `complet` (cible HDR MSAA + passe finale : étalonnage chaud,
   * vignette, halo).
   */
  postfx: 'aucun' | 'leger' | 'complet';
  /** Échantillons d'anticrénelage de la cible intermédiaire (MSAA). */
  msaa: number;
  /** Halo lumineux discret autour des sources (lampadaires, vitrines). */
  bloom: boolean;
  /** Vraies lumières ponctuelles sur les lampadaires proches. */
  lampLights: number;
  /** Relief procédural (bump) des façades et des sols. */
  relief: boolean;
}

export const QUALITY_PRESETS: Record<QualityLevel, QualityPreset> = {
  bas: { maxPixelRatio: 1, shadowMap: 1024, shadowExtent: 32, softShadows: false, postfx: 'aucun', msaa: 0, bloom: false, lampLights: 3, relief: false },
  moyen: { maxPixelRatio: 1.5, shadowMap: 2048, shadowExtent: 42, softShadows: true, postfx: 'leger', msaa: 0, bloom: false, lampLights: 6, relief: true },
  haut: { maxPixelRatio: 2, shadowMap: 2048, shadowExtent: 45, softShadows: true, postfx: 'complet', msaa: 4, bloom: true, lampLights: 8, relief: true },
};

export interface GpuCaps {
  /** Nom du processeur graphique (WEBGL_debug_renderer_info), s'il est connu. */
  renderer?: string;
  /** Appareil tactile / téléphone. */
  mobile?: boolean;
  /** navigator.hardwareConcurrency et deviceMemory (Go). */
  cores?: number;
  memoryGb?: number;
  maxTextureSize?: number;
  webgl2?: boolean;
}

/** Détection simple : rendu logiciel ou petite machine → bas ; graphique intégré ou téléphone → moyen ; sinon haut. */
export function chooseQuality(c: GpuCaps): QualityLevel {
  const r = (c.renderer ?? '').toLowerCase();
  if (c.webgl2 === false) return 'bas';
  if (/swiftshader|llvmpipe|software|basic render|microsoft basic/.test(r)) return 'bas';
  if ((c.maxTextureSize ?? 8192) < 4096) return 'bas';
  if ((c.memoryGb ?? 8) <= 2 || (c.cores ?? 8) <= 2) return 'bas';
  if (c.mobile) return /apple gpu|adreno \(tm\) (7|8)\d\d|mali-g7\d\d/.test(r) ? 'moyen' : 'bas';
  if (/intel|uhd|iris|hd graphics|mesa|radeon\(tm\) graphics|vega \d+ graphics/.test(r)) return 'moyen';
  if ((c.cores ?? 8) <= 4) return 'moyen';
  return 'haut';
}

/** Niveau effectif : la préférence du joueur, ou la détection si « auto ». */
export function resolveQuality(pref: QualityPref, caps: GpuCaps): QualityLevel {
  return pref === 'auto' ? chooseQuality(caps) : pref;
}

export function isQualityPref(v: unknown): v is QualityPref {
  return v === 'auto' || v === 'bas' || v === 'moyen' || v === 'haut';
}

const KEY = 'neurapolis.qualite';
let pref: QualityPref = 'auto';
try {
  const v = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
  if (isQualityPref(v)) pref = v;
} catch { /* stockage indisponible : auto */ }
const listeners = new Set<(p: QualityPref) => void>();

export function getQualityPref(): QualityPref { return pref; }
export function setQualityPref(p: QualityPref): void {
  pref = p;
  try { localStorage.setItem(KEY, p); } catch { /* sans stockage : pour la session seulement */ }
  for (const l of listeners) l(p);
}
export function onQualityPref(cb: (p: QualityPref) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Capacités lues sur un contexte WebGL existant (sans en créer un nouveau). */
export function readGpuCaps(gl: WebGLRenderingContext | WebGL2RenderingContext): GpuCaps {
  let renderer: string | undefined;
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    renderer = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  } catch { /* nom inconnu */ }
  const nav = typeof navigator !== 'undefined' ? navigator as Navigator & { deviceMemory?: number } : undefined;
  return {
    renderer,
    mobile: typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches,
    cores: nav?.hardwareConcurrency,
    memoryGb: nav?.deviceMemory,
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) as number,
    webgl2: typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext,
  };
}

/** Libellé de la qualité détectée, partagé avec le menu (posé par le moteur de rendu). */
export const detectedQuality: { level: QualityLevel | null } = { level: null };

/** Sélecteur « Qualité graphique » du menu Caméra et son. */
export function qualitySelectEl(): HTMLElement {
  const wrap = document.createElement('label');
  wrap.className = 'hud2-quality';
  wrap.style.cssText = 'display:flex;align-items:center;gap:8px;margin:6px 0;font-size:13px;';
  const label = document.createElement('span');
  label.textContent = '🎨 Qualité graphique';
  wrap.appendChild(label);
  const sel = document.createElement('select');
  sel.title = 'Qualité graphique (ombres, halo, anticrénelage)';
  const opts: [QualityPref, string][] = [['auto', 'Auto'], ['bas', 'Basse'], ['moyen', 'Moyenne'], ['haut', 'Haute']];
  for (const [v, label] of opts) {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = v === 'auto' && detectedQuality.level ? `Auto (${detectedQuality.level})` : label;
    sel.appendChild(o);
  }
  sel.value = getQualityPref();
  sel.addEventListener('focus', () => {
    const first = sel.options?.[0];
    if (detectedQuality.level && first) first.textContent = `Auto (${detectedQuality.level})`;
  });
  sel.addEventListener('change', () => { if (isQualityPref(sel.value)) setQualityPref(sel.value); });
  wrap.appendChild(sel);
  return wrap;
}
