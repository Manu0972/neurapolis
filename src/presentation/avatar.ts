/**
 * Avatars SVG procéduraux par seed (contrat M7) : un visage simple et lisible,
 * déterministe — hash stable de la clé + mulberry32 (core/rng), jamais Math.random.
 * La présentation ne fait que dessiner : aucune donnée de simulation ici.
 */
import { makeSeed, rngInt, rngNext } from '../core/rng';
import { TOKENS } from './tokens';

const SKINS = ['#f2c9a5', '#e8b98c', '#d9a06b', '#c68a5a', '#8a5a3b'];
const HAIRS = ['#3a2c22', '#1f1a26', '#5b3a24', '#2c2c33', '#a3542a'];

/** FNV-1a 32 bits : clé stable (« pnj:noah », « joueur:Camille ») → seed numérique. */
function hash32(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h | 0;
}

interface AvatarParts {
  skin: string;
  hair: string;
  hairStyle: number; // 0 frange, 1 mèches, 2 crâne ras
  shirt: string;
  glasses: boolean;
  smile: number; // 0 sourire, 1 neutre, 2 grand sourire
}

function partsFor(seedKey: string, color: string): AvatarParts {
  const rng = { rng: makeSeed(hash32(seedKey)) };
  return {
    skin: SKINS[rngInt(rng, 0, SKINS.length - 1)] ?? SKINS[0] ?? '#f2c9a5',
    hair: HAIRS[rngInt(rng, 0, HAIRS.length - 1)] ?? HAIRS[0] ?? '#3a2c22',
    hairStyle: rngInt(rng, 0, 2),
    shirt: color,
    glasses: rngNext(rng) < 0.18,
    smile: rngInt(rng, 0, 2),
  };
}

/** SVG complet du visage, teinté par la couleur du personnage. */
export function avatarSvg(seedKey: string, color: string, size = 48): string {
  const p = partsFor(seedKey, color);

  const hair =
    p.hairStyle === 0
      ? `<path d="M12 26 Q10 9 24 9 Q38 9 36 26 L34 22 Q33 12 24 12 Q15 12 14 22 Z" fill="${p.hair}"/>`
      : p.hairStyle === 1
        ? `<path d="M12 26 Q9 10 24 10 Q39 10 36 26 Q36 17 33 15 Q29 19 27 15 Q25 18 24 15 Q23 19 21 15 Q19 18 15 15 Q12 17 12 26 Z" fill="${p.hair}"/>`
        : `<path d="M12 26 Q10 12 24 12 Q38 12 36 26 Q30 20 24 20 Q18 20 12 26 Z" fill="${p.hair}"/>`;

  const mouth =
    p.smile === 0
      ? `<path d="M18 32.5 Q24 36.5 30 32.5" stroke="#3a2530" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
      : p.smile === 1
        ? `<line x1="20" y1="33.5" x2="28" y2="33.5" stroke="#3a2530" stroke-width="1.6" stroke-linecap="round"/>`
        : `<path d="M18 32 Q24 38 30 32 Z" fill="#3a2530"/>`;

  const glasses = p.glasses
    ? `<circle cx="17.5" cy="25" r="4.6" fill="none" stroke="${TOKENS.ink}" stroke-width="1.4"/>
       <circle cx="30.5" cy="25" r="4.6" fill="none" stroke="${TOKENS.ink}" stroke-width="1.4"/>
       <line x1="22.1" y1="25" x2="25.9" y2="25" stroke="${TOKENS.ink}" stroke-width="1.4"/>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img">` +
    `<rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${TOKENS.panel}"/>` +
    `<circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.42}" fill="${color}" fill-opacity="0.14"/>` +
    `<circle cx="${size / 2}" cy="${size + 8}" r="${size * 0.34}" fill="${p.shirt}"/>` +
    `<circle cx="${size / 2}" cy="${size * 0.55}" r="${size * 0.27}" fill="${p.skin}"/>` +
    hair +
    `<circle cx="${size * 0.365}" cy="${size * 0.53}" r="1.8" fill="#1c1620"/>` +
    `<circle cx="${size * 0.635}" cy="${size * 0.53}" r="1.8" fill="#1c1620"/>` +
    mouth +
    glasses +
    `</svg>`;
}

import type { PlayerAppearance } from '../core/types';
import { renderCreatorAvatarSvg } from './character-creator';

/** SVG spécifique du joueur reflétant son apparence personnalisée. */
export function playerAvatarSvg(name: string, appearance?: PlayerAppearance, color: string = TOKENS.or, size = 48): string {
  if (appearance) {
    return renderCreatorAvatarSvg(appearance, size);
  }
  return avatarSvg(`joueur:${name}`, color, size);
}

/** Élément avatar prêt pour les panneaux (dimension en px). */
export function avatarElement(seedKey: string, color: string, name: string, size = 44, appearance?: PlayerAppearance): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'avatar';
  wrap.style.width = `${size}px`;
  wrap.style.height = `${size}px`;
  wrap.setAttribute('aria-label', name);
  wrap.innerHTML = appearance ? playerAvatarSvg(name, appearance, color, size) : avatarSvg(seedKey, color, size);
  return wrap;
}
