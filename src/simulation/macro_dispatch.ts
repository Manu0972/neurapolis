/**
 * NEURAPOLIS — Paliers 5-6 : Générateur déterministe de dépêches d'actualité mondialisées.
 * Couche : simulation/ (Sans dépendance DOM/Canvas, non branché directement sur WorldState).
 */

import type { DispatchGravity, MacroDispatch, MacroMetric, MacroSnapshot } from '../core/macro_dispatch_types';
import { rngPick } from '../core/rng';

export interface DispatchOptions {
  /** Nombre maximal de dépêches retournées (défaut : 5). */
  maxDispatches?: number;
  /** Seuil de déclenchement du fret en pourcentage relatif (défaut : 0.10, soit 10%). */
  fretThreshold?: number;
  /** Seuil de déclenchement de l'énergie en pourcentage relatif (défaut : 0.10, soit 10%). */
  energyThreshold?: number;
  /** Seuil de déclenchement de la population en pourcentage relatif (défaut : 0.03, soit 3%). */
  popThreshold?: number;
  /** Seuil de déclenchement de la variation annuelle en points de pourcentage (défaut : 0.04, soit 4 points). */
  varThreshold?: number;
}

const DEFAULT_OPTIONS: Required<DispatchOptions> = {
  maxDispatches: 5,
  fretThreshold: 0.10,
  energyThreshold: 0.10,
  popThreshold: 0.03,
  varThreshold: 0.04,
};

/** Marques et consortiums 100% fictifs. */
const FICTIONAL_BRANDS = [
  'Trans-Astra Fret',
  'Vulturne Énergie',
  'Hélios Logistique',
  'Aéro-Kaelis',
  'Oryx Industries',
  'Zéphyr Transport',
  'Consortium Boréal',
  'Néo-Cargo Global',
  'Astra Power',
  'Alliance Éole Logistics',
] as const;

/** Modèles de dépêches pour le Fret. */
const FRET_TEMPLATES_NEG = [
  {
    title: 'Krach du fret à {region}',
    text: "Une chute de {percent}% du fret secoue les routes commerciales de {region}. L'entreprise {brand} annonce un gel temporaire de ses liaisons.",
  },
  {
    title: 'Baisse brutale des expéditions à {region}',
    text: "Le volume de fret dans la région de {region} accuse un recul de {percent}%. Le transporteur {brand} réduit ses rotations quotidiennes.",
  },
  {
    title: 'Ralentissement logistique à {region}',
    text: "Les flux de marchandises vers {region} chutent de {percent}%. Les analystes de {brand} évoquent des tensions sur la chaîne d'approvisionnement.",
  },
];

const FRET_TEMPLATES_POS = [
  {
    title: 'Envolée du fret à {region}',
    text: "Les expéditions de marchandises vers {region} bondissent de {percent}%. La société {brand} déploie une flotte de renfort pour absorber la demande.",
  },
  {
    title: 'Record de livraison fret à {region}',
    text: "Une hausse de {percent}% du trafic fret est enregistrée dans la zone {region}. L'opérateur {brand} salue une dynamique commerciale inédite.",
  },
  {
    title: 'Saturation des axes logistiques à {region}',
    text: "Le fret commercial à {region} augmente de {percent}%. Les infrastructures gérées par {brand} fonctionnent à pleine capacité.",
  },
];

/** Modèles de dépêches pour l'Énergie. */
const ENERGY_TEMPLATES_NEG = [
  {
    title: "Chute de l'indice énergétique à {region}",
    text: "Les cours de l'énergie à {region} dévissent de {percent}%. Le consortium {brand} réajuste sa grille tarifaire à la baisse.",
  },
  {
    title: "Surtension et repli de la production énergétique à {region}",
    text: "L'activité énergétique dans le secteur {region} enregistre une baisse de {percent}%. Les installations de {brand} adaptent leur charge.",
  },
];

const ENERGY_TEMPLATES_POS = [
  {
    title: 'Flambée des tarifs de l énergie à {region}',
    text: "L'indice énergétique à {region} grimpe de {percent}%. Le fournisseur {brand} appelle à une sobriété industrielle temporaire.",
  },
  {
    title: 'Tensions sur le réseau énergétique à {region}',
    text: "Une augmentation de {percent}% des coûts énergétiques frappe la région {region}. La compagnie {brand} renforce sa production d urgence.",
  },
];

/** Modèles de dépêches pour la Démographie. */
const POP_TEMPLATES_NEG = [
  {
    title: 'Exode démographique à {region}',
    text: "La population de {region} diminue de {percent}%. Le cabinet d études {brand} souligne l impact sur le marché du travail local.",
  },
  {
    title: 'Recul de la population active à {region}',
    text: "Un glissement démographique de -{percent}% est constaté à {region}. Le réseau {brand} réorganise ses services régionaux.",
  },
];

const POP_TEMPLATES_POS = [
  {
    title: 'Boom démographique à {region}',
    text: "La région de {region} gagne {percent}% d habitants. Le groupe {brand} investit massivement dans les infrastructures d accueil.",
  },
  {
    title: 'Attractivité record pour {region}',
    text: "Un afflux de population de +{percent}% stimule le secteur de {region}. Les observateurs de {brand} prévoient un essor économique durable.",
  },
];

/** Modèles de dépêches pour la Conjoncture globale. */
const CONJUNCTURE_TEMPLATES_NEG = [
  {
    title: "Ralentissement économique à {region}",
    text: "La variation annuelle à {region} fléchit de {percent} points. Le consortium {brand} anticipe un trimestre de prudence.",
  },
  {
    title: "Tension conjoncturelle à {region}",
    text: "L'indicateur macroéconomique de {region} recule de {percent} points. La direction de {brand} préconise un resserrement des dépenses.",
  },
];

const CONJUNCTURE_TEMPLATES_POS = [
  {
    title: 'Surchauffe économique à {region}',
    text: "La croissance annuelle à {region} accélère de +{percent} points. L'acteur {brand} observe un niveau d activité historique.",
  },
  {
    title: 'Rebond conjoncturel majeur à {region}',
    text: "L'économie de {region} progresse de +{percent} points par rapport à l exercice précédent. La firme {brand} salue une conjoncture très favorable.",
  },
];

/**
 * Calcule la gravité d'un événement selon l'amplitude de la variation.
 */
function computeGravity(absVariation: number, highThreshold: number, criticalThreshold: number): DispatchGravity {
  if (absVariation >= criticalThreshold) return 3;
  if (absVariation >= highThreshold) return 2;
  return 1;
}

/**
 * Génère des dépêches d'actualité mondialisées déterministes à partir de deux clichés macro.
 *
 * @param prev Clichés de la période précédente.
 * @param next Clichés de la période actuelle.
 * @param rng État PRNG déterministe (mulberry32).
 * @param options Seuils et plafonds personnalisés.
 * @returns Liste triée et plafonnée de dépêches d'actualité.
 */
export function dispatchesFromSnapshots(
  prev: readonly MacroSnapshot[],
  next: readonly MacroSnapshot[],
  rng: { rng: number },
  options?: DispatchOptions
): MacroDispatch[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const prevMap = new Map<string, MacroSnapshot>(prev.map((s) => [s.region, s]));
  const candidates: MacroDispatch[] = [];

  for (const nextSnap of next) {
    const prevSnap = prevMap.get(nextSnap.region);
    if (!prevSnap) continue;

    // 1. Variation Fret
    if (prevSnap.fretIndex > 0) {
      const fretDelta = (nextSnap.fretIndex - prevSnap.fretIndex) / prevSnap.fretIndex;
      const absFret = Math.abs(fretDelta);
      if (absFret >= opts.fretThreshold) {
        const templates = fretDelta < 0 ? FRET_TEMPLATES_NEG : FRET_TEMPLATES_POS;
        const tpl = rngPick(rng, templates);
        const brand = rngPick(rng, FICTIONAL_BRANDS);
        const pctStr = Math.round(absFret * 100).toString();
        const gravity = computeGravity(absFret, 0.18, 0.28);

        candidates.push({
          title: tpl.title.replace('{region}', nextSnap.region),
          text: tpl.text.replace('{region}', nextSnap.region).replace('{brand}', brand).replace('{percent}', pctStr),
          gravity,
          region: nextSnap.region,
          metric: 'fret',
          variation: fretDelta,
        });
      }
    }

    // 2. Variation Énergie
    if (prevSnap.energyIndex > 0) {
      const energyDelta = (nextSnap.energyIndex - prevSnap.energyIndex) / prevSnap.energyIndex;
      const absEnergy = Math.abs(energyDelta);
      if (absEnergy >= opts.energyThreshold) {
        const templates = energyDelta < 0 ? ENERGY_TEMPLATES_NEG : ENERGY_TEMPLATES_POS;
        const tpl = rngPick(rng, templates);
        const brand = rngPick(rng, FICTIONAL_BRANDS);
        const pctStr = Math.round(absEnergy * 100).toString();
        const gravity = computeGravity(absEnergy, 0.18, 0.28);

        candidates.push({
          title: tpl.title.replace('{region}', nextSnap.region),
          text: tpl.text.replace('{region}', nextSnap.region).replace('{brand}', brand).replace('{percent}', pctStr),
          gravity,
          region: nextSnap.region,
          metric: 'energie',
          variation: energyDelta,
        });
      }
    }

    // 3. Variation Population
    if (prevSnap.population > 0) {
      const popDelta = (nextSnap.population - prevSnap.population) / prevSnap.population;
      const absPop = Math.abs(popDelta);
      if (absPop >= opts.popThreshold) {
        const templates = popDelta < 0 ? POP_TEMPLATES_NEG : POP_TEMPLATES_POS;
        const tpl = rngPick(rng, templates);
        const brand = rngPick(rng, FICTIONAL_BRANDS);
        const pctStr = (Math.round(absPop * 1000) / 10).toString();
        const gravity = computeGravity(absPop, 0.06, 0.12);

        candidates.push({
          title: tpl.title.replace('{region}', nextSnap.region),
          text: tpl.text.replace('{region}', nextSnap.region).replace('{brand}', brand).replace('{percent}', pctStr),
          gravity,
          region: nextSnap.region,
          metric: 'population',
          variation: popDelta,
        });
      }
    }

    // 4. Variation Conjoncture
    const varDelta = nextSnap.annualVariation - prevSnap.annualVariation;
    const absVar = Math.abs(varDelta);
    if (absVar >= opts.varThreshold) {
      const templates = varDelta < 0 ? CONJUNCTURE_TEMPLATES_NEG : CONJUNCTURE_TEMPLATES_POS;
      const tpl = rngPick(rng, templates);
      const brand = rngPick(rng, FICTIONAL_BRANDS);
      const ptsStr = (Math.round(absVar * 1000) / 10).toString();
      const gravity = computeGravity(absVar, 0.08, 0.15);

      candidates.push({
        title: tpl.title.replace('{region}', nextSnap.region),
        text: tpl.text.replace('{region}', nextSnap.region).replace('{brand}', brand).replace('{percent}', ptsStr),
        gravity,
        region: nextSnap.region,
        metric: 'conjoncture',
        variation: varDelta,
      });
    }
  }

  // Tri stable déterministe
  candidates.sort((a, b) => {
    // 1. Gravité décroissante (3 -> 1)
    if (b.gravity !== a.gravity) {
      return b.gravity - a.gravity;
    }
    // 2. Amplitude absolue de la variation décroissante
    const absDiff = Math.abs(b.variation) - Math.abs(a.variation);
    if (Math.abs(absDiff) > 1e-6) {
      return absDiff;
    }
    // 3. Ordre alphabétique de la région
    const regComp = a.region.localeCompare(b.region);
    if (regComp !== 0) {
      return regComp;
    }
    // 4. Ordre alphabétique du titre
    return a.title.localeCompare(b.title);
  });

  // Plafond de dépêches
  return candidates.slice(0, opts.maxDispatches);
}
