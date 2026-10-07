/**
 * Dessins des fantômes : petites silhouettes kawaii en SVG, à la couleur et à l'emblème de
 * chaque penseur. `duoAvatar` dessine un double face (une silhouette coupée en deux).
 * Les données (couleurs, emblèmes) viennent des registres du jeu, jamais d'une saisie.
 */
import { GHOST_DEFS_BY_ID } from '../data/ghosts/registry';
import { DUELS } from '../data/ascension/duels';

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

const SVG_NS = 'http://www.w3.org/2000/svg';
const BODY = 'M12 31 C12 15 21 6 32 6 C43 6 52 15 52 31 L52 55 L46 50 L40 56 L34 50 L28 56 L22 50 L16 56 L12 53 Z';

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const n = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
}

function face(svg: SVGSVGElement, mood: GhostMood): void {
  const ink = '#2a1a14';
  if (mood === 'joie') {
    for (const cx of [24, 40]) svg.appendChild(svgEl('path', { d: `M${cx - 4} 31 Q${cx} 26 ${cx + 4} 31`, stroke: ink, 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round' }));
  } else if (mood === 'dort') {
    for (const cx of [24, 40]) svg.appendChild(svgEl('path', { d: `M${cx - 4} 30 Q${cx} 33 ${cx + 4} 30`, stroke: ink, 'stroke-width': 2.2, fill: 'none', 'stroke-linecap': 'round' }));
    const z = svgEl('text', { x: 46, y: 14, 'font-size': 10, fill: '#fff', 'font-weight': 700 });
    z.textContent = 'z';
    svg.appendChild(z);
  } else {
    const ry = mood === 'alerte' ? 5.5 : 4.5;
    for (const cx of [24, 40]) {
      svg.appendChild(svgEl('ellipse', { cx, cy: 30, rx: 3.6, ry, fill: ink }));
      svg.appendChild(svgEl('circle', { cx: cx + 1.2, cy: 28.4, r: 1.2, fill: '#fff' }));
    }
    if (mood === 'alerte') svg.appendChild(svgEl('path', { d: 'M50 18 Q53 23 50 26 Q47 23 50 18 Z', fill: '#9fd8ff', stroke: '#5aa9d6', 'stroke-width': 0.8 }));
  }
  for (const cx of [18, 46]) svg.appendChild(svgEl('ellipse', { cx, cy: 37, rx: 3.6, ry: 2.2, fill: '#ff8fa3', opacity: 0.55 }));
  const mouth = mood === 'alerte' ? 'M29 41 Q32 38 35 41' : 'M29 39 Q32 42 35 39';
  svg.appendChild(svgEl('path', { d: mouth, stroke: ink, 'stroke-width': 1.8, fill: 'none', 'stroke-linecap': 'round' }));
}

function badge(svg: SVGSVGElement, emoji: string, x: number): void {
  svg.appendChild(svgEl('circle', { cx: x, cy: 12, r: 8.5, fill: '#fbf3e2', stroke: '#2a1a14', 'stroke-width': 1.2 }));
  const t = svgEl('text', { x, y: 16, 'font-size': 11, 'text-anchor': 'middle' });
  t.textContent = emoji;
  svg.appendChild(t);
}

/** Petit fantôme d'un penseur. */
export function ghostAvatar(id: string, mood: GhostMood = 'calme', size = 40): SVGSVGElement {
  const m = thinkerMeta(id);
  const svg = svgEl('svg', { viewBox: '0 0 64 64', width: size, height: size, class: 'ghost-svg', role: 'img', 'aria-label': m.name });
  svg.appendChild(svgEl('path', { d: BODY, fill: m.color, stroke: '#2a1a14', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
  svg.appendChild(svgEl('path', { d: 'M18 22 Q22 12 30 10', stroke: '#ffffff', 'stroke-width': 2.5, fill: 'none', opacity: 0.45, 'stroke-linecap': 'round' }));
  face(svg, mood);
  badge(svg, m.emoji, 52);
  return svg;
}

let clipSeq = 0;

/** Double face : deux penseurs dans une seule silhouette coupée en deux. */
export function duoAvatar(aId: string, bId: string, mood: GhostMood = 'calme', size = 96): SVGSVGElement {
  const a = thinkerMeta(aId);
  const b = thinkerMeta(bId);
  const id = `duo${++clipSeq}`;
  const svg = svgEl('svg', { viewBox: '0 0 64 64', width: size, height: size, class: 'ghost-svg duo', role: 'img', 'aria-label': `${a.name} et ${b.name}` });
  const defs = svgEl('defs', {});
  const left = svgEl('clipPath', { id: `${id}l` });
  left.appendChild(svgEl('rect', { x: 0, y: 0, width: 32, height: 64 }));
  const right = svgEl('clipPath', { id: `${id}r` });
  right.appendChild(svgEl('rect', { x: 32, y: 0, width: 32, height: 64 }));
  defs.appendChild(left);
  defs.appendChild(right);
  svg.appendChild(defs);
  svg.appendChild(svgEl('path', { d: BODY, fill: a.color, 'clip-path': `url(#${id}l)` }));
  svg.appendChild(svgEl('path', { d: BODY, fill: b.color, 'clip-path': `url(#${id}r)` }));
  svg.appendChild(svgEl('path', { d: BODY, fill: 'none', stroke: '#2a1a14', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
  svg.appendChild(svgEl('line', { x1: 32, y1: 7, x2: 32, y2: 54, stroke: '#fbf3e2', 'stroke-width': 1.4, 'stroke-dasharray': '3 2' }));
  face(svg, mood);
  badge(svg, a.emoji, 12);
  badge(svg, b.emoji, 52);
  return svg;
}
