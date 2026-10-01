/**
 * Territoire — évolution quotidienne du quartier, indépendante du joueur (Monde vivant).
 * Chaîne : drive −0,2/jour sur l’épicerie ; seuils 35 (Mme Bertin envisage de fermer)
 * / 60 (embauche + confiance) ; météo saisonnière tirée au PRNG du monde (contrat M5) ;
 * confiance du quartier ≥ 60 → réputation +1/jour ; réputation ≥ 70 → Samir propose
 * un stage (teaser). Données : src/data/district.ts.
 */
import type { Meteo, WorldState } from '../core/types';
import { dateOf, dayIndexOf } from '../core/clock';
import { rngNext } from '../core/rng';
import {
  SEUIL_EMBAUCHE_EPICERIE, SEUIL_FERMETURE_EPICERIE, WEATHER_PROBABILITIES, seasonOfMonth,
} from '../data/district';
import { pushEvent } from './events';

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

export const SEUIL_FERMETURE = SEUIL_FERMETURE_EPICERIE;
export const SEUIL_EMBAUCHE = SEUIL_EMBAUCHE_EPICERIE;

/** Tirage saisonnier déterministe (PRNG passé en paramètre — jamais Math.random). */
export function drawMeteo(rng: { rng: number }, month: number): Meteo {
  const [pSoleil, pNuages] = WEATHER_PROBABILITIES[seasonOfMonth(month)];
  const r = rngNext(rng);
  if (r < pSoleil / 100) return 'soleil';
  if (r < (pSoleil + pNuages) / 100) return 'nuages';
  return 'pluie';
}

/** Seuils de vitalité : fermeture envisagée (<35) ou embauche (≥60) — une fois chacun. */
export function checkVitaliteEvents(w: WorldState): void {
  const d = w.district;
  if (d.vitaliteEpicerie < SEUIL_FERMETURE) {
    pushEvent(w, {
      type: 'quartier',
      title: 'Mme Bertin envisage de fermer',
      text: '« Si ça continue, je baisse le rideau » : les clients se font rares, le drive gagne chaque jour. Le quartier retient son souffle.',
      causes: [
        { facteur: 'vitalité de l’épicerie', seuil: String(SEUIL_FERMETURE), poids: 3 },
        { facteur: 'drive de la grande surface (−0,2/jour)', poids: 2 },
      ],
      once: 'epicerie_fermeture',
    });
    return;
  }
  if (d.vitaliteEpicerie >= SEUIL_EMBAUCHE) {
    const avant = d.confianceQuartier;
    d.confianceQuartier = clamp(avant + 10);
    pushEvent(w, {
      type: 'quartier',
      title: 'L’épicerie embauche',
      text: `Les affaires reprennent : Mme Bertin embauche une aide à mi-temps. La confiance du quartier monte (${Math.round(avant)} → ${Math.round(d.confianceQuartier)}).`,
      causes: [
        { facteur: 'vitalité de l’épicerie', seuil: String(SEUIL_EMBAUCHE), poids: 3 },
        { facteur: 'courses rendues pour l’épicerie', poids: 2 },
      ],
      once: 'epicerie_embauche',
    });
  }
}

/** Teaser : réputation ≥ 70 → Samir (TaretCoop) propose un stage. */
function samirTeaser(w: WorldState): void {
  if (w.player.reputation < 70) return;
  pushEvent(w, {
    type: 'opportunite',
    title: 'Samir te propose un stage',
    text: 'Samir, de TaretCoop, t’a repéré : « Ton stand tourne bien, gamin. Viens voir la coopérative — il y a du vrai travail à apprendre. » (La suite du prototype se construit à la friche Taret.)',
    causes: [{ facteur: 'réputation dans le quartier', seuil: '70', poids: 3 }],
    once: 'stage_samir',
  });
}

export function districtDay(w: WorldState): void {
  const d = w.district;
  const day = dayIndexOf(w.time.tick);
  // La grande surface et son drive grignottent l’épicerie, chaque jour, avec ou sans toi.
  d.vitaliteEpicerie = clamp(d.vitaliteEpicerie - 0.2);
  // La confiance du quartier dérive lentement vers la santé de ses commerces.
  const cible = d.vitaliteEpicerie * 0.4 + 50 * 0.6;
  d.confianceQuartier = clamp(d.confianceQuartier + (cible - d.confianceQuartier) * 0.05);
  // Météo saisonnière, tirée chaque matin au PRNG du monde.
  d.meteo = drawMeteo(w, dateOf(day).m);
  // La confiance du quartier ≥ 60 entretient la réputation du joueur (+1/jour).
  if (d.confianceQuartier >= 60) {
    w.player.reputation = clamp(w.player.reputation + 1);
  }
  checkVitaliteEvents(w);
  samirTeaser(w);
}

export function vitaliteCheck(w: WorldState): 'fermeture' | 'embauche' | null {
  const v = w.district.vitaliteEpicerie;
  if (v < SEUIL_FERMETURE) return 'fermeture';
  if (v >= SEUIL_EMBAUCHE) return 'embauche';
  return null;
}
