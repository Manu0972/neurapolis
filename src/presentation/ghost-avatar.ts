/**
 * Dessins des fantômes (vague 7, retour de l'utilisateur) : de petits personnages kawaii en 2D,
 * dessinés en SVG procédural (aucune image externe). Corps rond en goutte, grands yeux, joues,
 * et un accessoire propre à chaque voix (perruque de Smith, barbe de Marx, chapeau melon de
 * Keynes…). Les couleurs des registres sont adoucies vers le kraft : pastel, contours #2a1a14,
 * jamais de néon.
 *
 * États sans animation lourde, juste des changements d'état :
 * - `calme` : flotte doucement, cligne des yeux de temps en temps ;
 * - parle (`speak`) : la bouche alterne ouvert / fermé au rythme du texte affiché, petit rebond ;
 * - `joie` : yeux en arcs ; `alerte` : sourcils inquiets et goutte ; `dort` : paupières closes.
 *
 * `ghostSvgMarkup` est une fonction pure (testable sans DOM) ; `ghostAvatar` en fait un élément.
 */
import { GHOST_DEFS_BY_ID } from '../data/ghosts/registry';
import { DUELS } from '../data/ascension/duels';
import { escapeHtml } from './ui';

export type GhostMood = 'calme' | 'joie' | 'alerte' | 'dort';

export interface ThinkerMeta { id: string; name: string; emoji: string; color: string }

const DUEL_FACES: Record<string, ThinkerMeta> = Object.fromEntries(
  DUELS.flatMap((d) => [d.a, d.b]).map((f) => [f.thinker, { id: f.thinker, name: f.name, emoji: f.emoji, color: f.color }]),
);

/** Nom, emblème et couleur d'un penseur (Conseil ou double face). */
export function thinkerMeta(id: string): ThinkerMeta {
  const g = GHOST_DEFS_BY_ID[id];
  if (g) return { id, name: g.name, emoji: g.emoji, color: g.color };
  return DUEL_FACES[id] ?? { id, name: id, emoji: '👻', color: '#b7a6d8' };
}

const INK = '#2a1a14';
const CREAM = '#fbf3e2';

/** Mélange une couleur vive avec le kraft clair : la teinte reste reconnaissable, sans néon. */
export function pastel(hex: string, amount = 0.45): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '#d9cdea';
  const n = parseInt(m[1]!, 16);
  const c = parseInt(CREAM.slice(1), 16);
  const mix = (s: number): number => Math.round(((n >> s) & 255) * (1 - amount) + ((c >> s) & 255) * amount);
  return `#${[16, 8, 0].map((s) => mix(s).toString(16).padStart(2, '0')).join('')}`;
}

/** Accessoire de chaque voix (les 22 du Conseil + les visages des doubles faces). */
export const GHOST_ACCESSORY: Readonly<Record<string, string>> = {
  smith: 'perruque', marx: 'barbe', keynes: 'melon', hayek: 'lunettes', ostrom: 'pousse',
  ricardo: 'haut_de_forme', weber: 'livre', locke: 'plume', rousseau: 'laurier', bourdieu: 'lunettes_carrees',
  machiavel: 'toque', ohno: 'casque', dejours: 'coeur', graeber: 'bonnet', zuboff: 'antenne',
  stiegler: 'fiole', rosa: 'note', raworth: 'donut', illich: 'echarpe', simon: 'mortier',
  hobbes: 'couronne', taylor: 'chrono', ford: 'casquette', schumpeter: 'eclair',
};

/** Contour encré (épaisseur au choix). */
const sw = (w = 2.5): string => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/** Dessin de l'accessoire (coordonnées du viewBox 100 × 100). */
function accessory(kind: string, accent: string): string {
  switch (kind) {
    case 'perruque': return ['36,15,10', '50,11,10', '64,15,10', '20,36,8', '17,49,8', '80,36,8', '83,49,8']
      .map((c) => { const [x, y, r] = c.split(','); return `<circle cx="${x}" cy="${y}" r="${r}" fill="#f3ead8" ${sw()}/>`; }).join('')
      + `<path d="M74 58 q6 4 4 10" fill="none" ${sw()}/><circle cx="78" cy="70" r="3" fill="${accent}" ${sw()}/>`;
    case 'barbe': return `<path d="M24 64 Q22 90 38 90 Q44 96 50 92 Q56 96 62 90 Q78 90 76 64 Q70 72 62 70 Q56 74 50 71 Q44 74 38 70 Q30 72 24 64 Z" fill="#ece4d6" ${sw()}/>`
      + `<circle cx="22" cy="34" r="8" fill="#ece4d6" ${sw()}/><circle cx="78" cy="34" r="8" fill="#ece4d6" ${sw()}/>`;
    case 'melon': return `<path d="M32 19 Q32 1 50 1 Q68 1 68 19 Z" fill="#3a2a30" ${sw()}/><ellipse cx="50" cy="19" rx="25" ry="4.5" fill="#3a2a30" ${sw()}/>`
      + `<path d="M34 14 H66" stroke="${accent}" stroke-width="3"/>`
      + `<path d="M41 59 Q45 55 50 58.5 Q55 55 59 59 Q55 61.5 50 60 Q45 61.5 41 59 Z" fill="#6b4a2f" ${sw(1.5)}/>`;
    case 'lunettes': return `<circle cx="37" cy="51" r="10" fill="rgba(255,255,255,0.18)" ${sw(2.2)}/><circle cx="63" cy="51" r="10" fill="rgba(255,255,255,0.18)" ${sw(2.2)}/><path d="M47 50 Q50 47 53 50" fill="none" ${sw(2)}/>`
      + `<path d="M50 80 L40 74 L40 86 Z M50 80 L60 74 L60 86 Z" fill="${accent}" ${sw(2)}/><circle cx="50" cy="80" r="2.6" fill="${accent}" ${sw(1.6)}/>`;
    case 'lunettes_carrees': return `<rect x="26" y="43" width="22" height="16" rx="4" fill="rgba(255,255,255,0.15)" ${sw(3)}/><rect x="52" y="43" width="22" height="16" rx="4" fill="rgba(255,255,255,0.15)" ${sw(3)}/><path d="M48 50 H52" ${sw()}/>`;
    case 'pousse': return `<path d="M50 15 Q49 6 52 1" fill="none" stroke="#4f7a3a" stroke-width="3" stroke-linecap="round"/>`
      + `<path d="M51 6 Q40 -2 34 6 Q42 12 51 6 Z" fill="#8fc46a" ${sw(2)}/><path d="M52 4 Q62 -4 69 4 Q60 10 52 4 Z" fill="#8fc46a" ${sw(2)}/>`;
    case 'haut_de_forme': return `<rect x="35" y="-6" width="30" height="22" rx="2" fill="#3a2a30" ${sw()}/><rect x="35" y="9" width="30" height="5" fill="${accent}"/><rect x="25" y="14" width="50" height="6" rx="3" fill="#3a2a30" ${sw()}/>`;
    case 'livre': return `<rect x="66" y="66" width="20" height="16" rx="2" fill="#8a5a3a" transform="rotate(-12 76 74)" ${sw()}/><path d="M68 70 H82" stroke="${accent}" stroke-width="2.5" transform="rotate(-12 76 74)"/>`
      + `<circle cx="37" cy="51" r="8" fill="none" ${sw(1.8)}/><circle cx="63" cy="51" r="8" fill="none" ${sw(1.8)}/><path d="M45 50 H55" ${sw(1.8)}/>`;
    case 'plume': return `<path d="M72 26 Q92 2 96 4 Q90 24 74 32 Z" fill="${CREAM}" ${sw(2)}/><path d="M74 31 L90 9" fill="none" stroke="${accent}" stroke-width="2"/>`;
    case 'laurier': return [-1, 1].map((s) => [0, 1, 2].map((i) => {
      const x = 50 + s * (10 + i * 10); const y = 13 + i * 4;
      return `<ellipse cx="${x}" cy="${y}" rx="6" ry="3.4" fill="#8fc46a" transform="rotate(${s * (20 + i * 12)} ${x} ${y})" ${sw(1.8)}/>`;
    }).join('')).join('');
    case 'toque': return `<path d="M26 22 Q26 4 50 4 Q76 4 78 16 Q82 22 74 22 Q50 14 26 22 Z" fill="#c25a40" ${sw()}/>`;
    case 'casque': return `<path d="M24 24 Q24 4 50 4 Q76 4 76 24 Z" fill="#e8b84a" ${sw()}/><rect x="18" y="22" width="64" height="6" rx="3" fill="#e8b84a" ${sw()}/><path d="M50 4 V22" stroke="${INK}" stroke-width="2"/>`;
    case 'coeur': return `<path d="M80 12 C80 6 88 5 89 11 C90 5 98 6 97 12 C97 18 89 22 88.5 25 C88 22 80 18 80 12 Z" fill="#c25a40" ${sw(2)}/>`;
    case 'bonnet': return `<path d="M26 26 Q26 2 50 2 Q74 2 74 26 Z" fill="${accent}" ${sw()}/><rect x="23" y="20" width="54" height="9" rx="4" fill="${pastel(accent, 0.25)}" ${sw()}/><circle cx="50" cy="0" r="6" fill="${CREAM}" ${sw()}/>`;
    case 'antenne': return `<path d="M50 15 V3" ${sw()}/><ellipse cx="50" cy="-1" rx="9" ry="6" fill="${CREAM}" ${sw(2)}/><circle cx="50" cy="-1" r="3" fill="${accent}" stroke="${INK}" stroke-width="1.4"/>`;
    case 'fiole': return `<path d="M82 56 V64 L76 78 Q75 84 82 84 H92 Q99 84 98 78 L92 64 V56 Z" fill="${CREAM}" ${sw(2)}/><path d="M78 74 H96 L98 79 Q98 84 92 84 H82 Q75 84 77 79 Z" fill="${accent}"/><rect x="80" y="52" width="14" height="5" rx="2" fill="#8a5a3a" ${sw(1.6)}/>`;
    case 'note': return `<path d="M84 6 V24" ${sw()}/><path d="M84 6 Q92 8 94 14" fill="none" ${sw()}/><ellipse cx="80" cy="25" rx="5" ry="4" fill="${accent}" ${sw(2)}/>`;
    case 'donut': return `<ellipse cx="50" cy="4" rx="17" ry="6" fill="none" stroke="#d9a066" stroke-width="7"/><ellipse cx="50" cy="3" rx="17" ry="5.5" fill="none" stroke="#f2a7b8" stroke-width="3.5"/>`
      + `<ellipse cx="50" cy="4" rx="20.5" ry="9.5" fill="none" stroke="${INK}" stroke-width="1.6"/>`;
    case 'echarpe': return `<path d="M20 66 Q50 78 80 66 L80 74 Q50 86 20 74 Z" fill="${accent}" ${sw()}/><path d="M64 76 L70 94 L60 94 L56 78 Z" fill="${accent}" ${sw()}/>`;
    case 'mortier': return `<path d="M50 -2 L82 8 L50 18 L18 8 Z" fill="#3a2a30" ${sw()}/><path d="M32 12 V20 Q50 26 68 20 V12" fill="#3a2a30" ${sw()}/><path d="M50 8 L80 10 V24" fill="none" stroke="${accent}" stroke-width="2.5"/><circle cx="80" cy="26" r="3" fill="${accent}"/>`;
    case 'couronne': return `<path d="M30 20 L28 2 L39 12 L50 0 L61 12 L72 2 L70 20 Z" fill="#ffd98a" ${sw()}/><circle cx="50" cy="13" r="3" fill="#c25a40" ${sw(1.4)}/>`;
    case 'chrono': return `<circle cx="86" cy="18" r="11" fill="${CREAM}" ${sw()}/><path d="M86 18 V11 M86 18 L91 21" ${sw(2)}/><rect x="83" y="3" width="6" height="4" rx="1" fill="${accent}" ${sw(1.6)}/>`;
    case 'casquette': return `<path d="M26 22 Q28 6 52 6 Q72 7 74 18 L86 22 Q62 27 26 22 Z" fill="#8a5a3a" ${sw()}/>`;
    case 'eclair': return `<path d="M88 0 L76 20 H86 L80 36 L96 12 H86 L92 0 Z" fill="#ffd98a" ${sw(2)}/>`;
    default: return `<path d="M86 4 L89 13 L98 16 L89 19 L86 28 L83 19 L74 16 L83 13 Z" fill="#ffd98a" ${sw(1.8)}/>`;
  }
}

const BODY = 'M50 15 C74 15 86 33 86 55 C86 70 83 80 78 87 Q71 81 64 87 Q57 81 50 87 Q43 81 36 87 Q29 81 22 87 C17 80 14 70 14 55 C14 33 26 15 50 15 Z';

/** Visage complet : tous les états sont dessinés, le CSS n'affiche que celui de l'humeur. */
function faceMarkup(): string {
  const eye = (cx: number): string => `<g class="gk-eye"><ellipse cx="${cx}" cy="52" rx="6.6" ry="8.2" fill="${INK}"/><circle cx="${cx + 2.2}" cy="48.6" r="2.6" fill="#fff"/><circle cx="${cx - 2}" cy="55.6" r="1.2" fill="#fff"/></g>`;
  const arc = (cx: number, up: boolean): string => `<path d="M${cx - 6} ${up ? 54 : 51} Q${cx} ${up ? 45 : 57} ${cx + 6} ${up ? 54 : 51}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
  return `<g class="gk-eyes-open">${eye(37)}${eye(63)}</g>`
    + `<g class="gk-eyes-happy">${arc(37, true)}${arc(63, true)}</g>`
    + `<g class="gk-eyes-sleep">${arc(37, false)}${arc(63, false)}</g>`
    + `<g class="gk-brows"><path d="M29 40 L42 43" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="M71 40 L58 43" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/></g>`
    + `<ellipse cx="26" cy="63" rx="5.5" ry="3.2" fill="#ff8fa3" opacity="0.6"/><ellipse cx="74" cy="63" rx="5.5" ry="3.2" fill="#ff8fa3" opacity="0.6"/>`
    + `<path class="gk-mouth-closed" d="M45 63 Q50 67.5 55 63" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`
    + `<path class="gk-mouth-worry" d="M44 66 Q47 63 50 66 Q53 69 56 66" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`
    + `<path class="gk-mouth-open" d="M44 61.5 Q50 60 56 61.5 Q56 72 50 72 Q44 72 44 61.5 Z" fill="#8a2c2c" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`
    + `<path class="gk-sweat" d="M80 30 Q85 38 80 42 Q75 38 80 30 Z" fill="#bfe3f2" stroke="#5a8fae" stroke-width="1.4"/>`
    + `<text class="gk-zz" x="78" y="22" font-size="14" font-weight="800" fill="${CREAM}" stroke="${INK}" stroke-width="0.8">z</text>`;
}

/** Délai de clignement propre à chaque voix (stable), pour qu'ils ne clignent pas ensemble. */
function blinkDelay(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 40) / 10;
}

/** Le dessin SVG d'un fantôme (chaîne pure ; sert aussi de texture à la cinématique). */
export function ghostSvgMarkup(
  id: string, mood: GhostMood = 'calme', size = 64,
  opts: { translucent?: boolean; standalone?: boolean; open?: boolean } = {},
): string {
  const m = thinkerMeta(id);
  const body = pastel(m.color);
  const kind = GHOST_ACCESSORY[id] ?? 'etoile';
  const op = opts.translucent ? ' opacity="0.86"' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -8 100 108" width="${size}" height="${size}" class="ghost-svg gk${opts.open ? ' gk-open' : ''}" data-mood="${mood}" data-ghost="${escapeHtml(id)}" role="img" aria-label="${escapeHtml(m.name)}" style="--gk-blink:${blinkDelay(id)}s">`
    + (opts.standalone ? `<style>${STATE_CSS}</style>` : '')
    + `<ellipse cx="50" cy="97" rx="24" ry="3.6" fill="#2c2540" opacity="0.22"/>`
    + `<g class="gk-bob"${op}>`
    + `<ellipse cx="15" cy="62" rx="6" ry="8" fill="${body}" ${sw()} transform="rotate(-20 15 62)"/><ellipse cx="85" cy="62" rx="6" ry="8" fill="${body}" ${sw()} transform="rotate(20 85 62)"/>`
    + `<path d="${BODY}" fill="${body}" ${sw(3)}/>`
    + `<path d="M26 40 Q30 25 44 21" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.55"/>`
    + faceMarkup()
    + accessory(kind, m.color)
    + `</g></svg>`;
}

/** Règles d'état (quel visage montrer) : servent dans la page et dans un SVG autonome. */
const STATE_CSS = `
.gk .gk-eyes-happy, .gk .gk-eyes-sleep, .gk .gk-brows, .gk .gk-sweat, .gk .gk-mouth-open, .gk .gk-mouth-worry, .gk .gk-zz { display: none; }
.gk[data-mood="joie"] .gk-eyes-open, .gk[data-mood="dort"] .gk-eyes-open { display: none; }
.gk[data-mood="joie"] .gk-eyes-happy, .gk[data-mood="dort"] .gk-eyes-sleep, .gk[data-mood="dort"] .gk-zz { display: inline; }
.gk[data-mood="alerte"] .gk-brows, .gk[data-mood="alerte"] .gk-sweat, .gk[data-mood="alerte"] .gk-mouth-worry { display: inline; }
.gk[data-mood="alerte"] .gk-mouth-closed { display: none; }
.gk.gk-open .gk-mouth-closed, .gk.gk-open .gk-mouth-worry { display: none; }
.gk.gk-open .gk-mouth-open { display: inline; }
`;

/** Feuille de style des fantômes dans la page (états + petites animations), injectée une fois. */
const GHOST_CSS = STATE_CSS + `
.gk { overflow: visible; }
.gk .gk-bob { transform-box: view-box; transform-origin: 50% 95%; animation: gk-float 3.4s ease-in-out infinite; }
.gk.gk-talk .gk-bob { animation: gk-hop 0.42s ease-in-out infinite; }
.gk .gk-eye { transform-box: fill-box; transform-origin: center; animation: gk-blink 5s infinite; animation-delay: var(--gk-blink, 0s); }
.gk[data-mood="dort"] .gk-bob { animation-duration: 5s; }
@keyframes gk-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes gk-hop { 0%, 100% { transform: translateY(0) scale(1, 1); } 40% { transform: translateY(-4px) scale(0.97, 1.03); } 80% { transform: translateY(0) scale(1.03, 0.97); } }
@keyframes gk-blink { 0%, 92%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
@media (prefers-reduced-motion: reduce) { .gk .gk-bob, .gk .gk-eye, .gk.gk-talk .gk-bob { animation: none; } }
`;

let cssDone = false;
/** Injecte la feuille de style des fantômes (idempotent). */
export function ensureGhostCss(): void {
  if (cssDone || typeof document === 'undefined') return;
  cssDone = true;
  const st = document.createElement('style');
  st.dataset.owner = 'ghost-avatar';
  st.textContent = GHOST_CSS;
  document.head.appendChild(st);
}

function fromMarkup(markup: string): SVGSVGElement {
  ensureGhostCss();
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
    const el = doc.documentElement;
    if (el && el.tagName.toLowerCase() === 'svg') {
      return el as unknown as SVGSVGElement;
    }
  }
  if (typeof document !== 'undefined') {
    const host = document.createElement('div');
    host.innerHTML = markup;
    return host.firstElementChild as SVGSVGElement;
  }
  return { outerHTML: markup } as unknown as SVGSVGElement;
}

/** Petit fantôme d'un penseur. */
export function ghostAvatar(id: string, mood: GhostMood = 'calme', size = 64): SVGSVGElement {
  return fromMarkup(ghostSvgMarkup(id, mood, size));
}

/** Change l'humeur d'un fantôme déjà affiché. */
export function setGhostMood(svg: Element, mood: GhostMood): void {
  svg.setAttribute('data-mood', mood);
}

/** La bouche suit le texte : ouverte sur les lettres (une sur deux), fermée sur les blancs. */
export function mouthOpenAt(text: string, shown: number): boolean {
  if (shown <= 0 || shown >= text.length) return false;
  const ch = text.charAt(shown - 1);
  if (!/[\p{L}\p{N}]/u.test(ch)) return false;
  return Math.floor(shown / 2) % 2 === 0;
}

/**
 * Le fantôme dit un texte : il s'affiche lettre après lettre dans `target`, la bouche s'ouvre
 * et se ferme au même rythme, le corps rebondit. Retourne une fonction qui termine tout de
 * suite (clic pour passer). `onDone` est appelé une seule fois.
 */
export function speak(svg: Element, target: HTMLElement, text: string, opts: { cps?: number; onDone?: () => void } = {}): () => void {
  const cps = opts.cps ?? 42;
  let shown = 0;
  let timer: number | undefined;
  let done = false;
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finish = (): void => {
    if (done) return;
    done = true;
    if (timer !== undefined) window.clearInterval(timer);
    target.textContent = text;
    svg.classList.remove('gk-talk', 'gk-open');
    opts.onDone?.();
  };
  if (reduce || text.length === 0) { finish(); return finish; }
  svg.classList.add('gk-talk');
  target.textContent = '';
  timer = window.setInterval(() => {
    if (!svg.isConnected && !target.isConnected) { finish(); return; }
    shown += 1;
    target.textContent = text.slice(0, shown);
    svg.classList.toggle('gk-open', mouthOpenAt(text, shown));
    if (shown >= text.length) finish();
  }, 1000 / cps);
  return finish;
}

let clipSeq = 0;

/** Double face : deux penseurs dans une seule silhouette coupée en deux. */
export function duoAvatar(aId: string, bId: string, mood: GhostMood = 'calme', size = 96): SVGSVGElement {
  const a = thinkerMeta(aId);
  const b = thinkerMeta(bId);
  const id = `duo${++clipSeq}`;
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -8 100 108" width="${size}" height="${size}" class="ghost-svg gk duo" data-mood="${mood}" role="img" aria-label="${escapeHtml(`${a.name} et ${b.name}`)}">`
    + `<defs><clipPath id="${id}l"><rect x="-10" y="-10" width="60" height="120"/></clipPath><clipPath id="${id}r"><rect x="50" y="-10" width="60" height="120"/></clipPath></defs>`
    + `<ellipse cx="50" cy="97" rx="24" ry="3.6" fill="#2c2540" opacity="0.22"/>`
    + `<g class="gk-bob">`
    + `<path d="${BODY}" fill="${pastel(a.color)}" clip-path="url(#${id}l)"/><path d="${BODY}" fill="${pastel(b.color)}" clip-path="url(#${id}r)"/>`
    + `<path d="${BODY}" fill="none" ${sw(3)}/>`
    + `<path d="M50 16 V86" stroke="${CREAM}" stroke-width="1.6" stroke-dasharray="4 3"/>`
    + faceMarkup()
    + `<g clip-path="url(#${id}l)">${accessory(GHOST_ACCESSORY[aId] ?? 'etoile', a.color)}</g>`
    + `<g clip-path="url(#${id}r)">${accessory(GHOST_ACCESSORY[bId] ?? 'etoile', b.color)}</g>`
    + `</g></svg>`;
  return fromMarkup(markup);
}
