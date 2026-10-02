/**
 * NEURAPOLIS — Réseau Social des PNJ, Propagation de Rumeurs & Entraide Spontanée (Axis 4).
 * Couche : simulation/ (Moteur pur, déterministe, sans dépendances DOM).
 *
 * Exigences Axis 4 :
 * - Matrice d'affinités et de confiance bilatérale entre habitants
 * - Propagation déterministe de nouvelles, rumeurs et alertes par capillarité sociale
 * - Déclenchement d'effets systémiques à seuil critique de diffusion
 * - Entraide citoyenne spontanée en cas de crise ou de surcharge
 */

import type {
  MutualAidEvent,
  MutualAidNeedType,
  RumorCategory,
  SocialEdge,
  SocialNetworkState,
  SocialRumor,
} from '../core/simulation_extended_types';

// ============================================================================
// 1. Constantes et Traits de Sociabilité des Habitants
// ============================================================================

export interface NpcSociabilityTraits {
  gossipBonus: number;       // Tendance naturelle à propager les nouvelles (0 à 40)
  receptivityBonus: number;  // Tendance à croire et écouter autrui (0 à 30)
  altruismScore: number;     // Propension à l'entraide spontanée (0 à 50)
  domain: string;
}

export const NPC_SOCIABILITY_MAP: Record<string, NpcSociabilityTraits> = {
  noah: { gossipBonus: 25, receptivityBonus: 20, altruismScore: 35, domain: 'bricolage_skate' },
  lina: { gossipBonus: 10, receptivityBonus: 15, altruismScore: 40, domain: 'gestion_comptable' },
  yasmine: { gossipBonus: 40, receptivityBonus: 30, altruismScore: 30, domain: 'medias_college' },
  samir: { gossipBonus: 15, receptivityBonus: 25, altruismScore: 45, domain: 'cooperatives_mecanique' },
  karim: { gossipBonus: 10, receptivityBonus: 15, altruismScore: 40, domain: 'outillage_metal' },
  bertin: { gossipBonus: 20, receptivityBonus: 25, altruismScore: 45, domain: 'commerce_tisanes' },
  monique: { gossipBonus: 30, receptivityBonus: 20, altruismScore: 50, domain: 'memoire_solidarite' },
  moreau: { gossipBonus: 5, receptivityBonus: 10, altruismScore: 35, domain: 'pedagogie_regles' },
  camille: { gossipBonus: 15, receptivityBonus: 25, altruismScore: 40, domain: 'coordination' },
};

// ============================================================================
// 2. Initialisation d'État
// ============================================================================

export function getEdgeKey(npcA: string, npcB: string): string {
  return npcA < npcB ? `${npcA}:${npcB}` : `${npcB}:${npcA}`;
}

export function createInitialSocialNetworkState(nodeIds?: string[]): SocialNetworkState {
  const nodes = nodeIds ?? ['noah', 'lina', 'yasmine', 'samir', 'karim', 'bertin', 'monique', 'moreau', 'camille'];
  const edges: Record<string, SocialEdge> = {};

  // Fonction interne d'enregistrement symétrique
  const addEdge = (a: string, b: string, affinity: number, trust: number, mutualAid = 0) => {
    const key = getEdgeKey(a, b);
    const [npcA, npcB] = a < b ? [a, b] : [b, a];
    edges[key] = {
      npcA,
      npcB,
      affinity,
      trust,
      interactionCount: 5,
      mutualAidCount: mutualAid,
      lastInteractionDay: 1,
    };
  };

  // Liens communautaires initiaux
  addEdge('noah', 'lina', 65, 80, 2);      // Camarades d'enfance inséparables
  addEdge('noah', 'camille', 75, 75, 1);   // Alliés de jeu et de stand
  addEdge('lina', 'camille', 70, 80, 1);   // Confiance méthodologique
  addEdge('samir', 'karim', 80, 85, 4);    // Ancien binôme de l'usine Taret
  addEdge('bertin', 'monique', 75, 90, 5); // Piliers historiques du quartier
  addEdge('bertin', 'lina', 70, 75, 2);    // Lina aide au magasin
  addEdge('noah', 'samir', 65, 60, 1);     // Noah admire l'atelier
  addEdge('yasmine', 'noah', 60, 50, 0);   // Connexions du collège
  addEdge('yasmine', 'lina', 55, 65, 0);
  addEdge('monique', 'camille', 65, 70, 1);// Bienveillance envers le jeune joueur
  addEdge('bertin', 'camille', 65, 70, 1); // Confiance naissante
  addEdge('karim', 'samir', 80, 85, 3);
  addEdge('moreau', 'lina', 60, 75, 0);    // Élève modèle
  addEdge('moreau', 'noah', 45, 50, 0);    // Élève turbulent mais attachant

  return {
    active: true,
    nodes,
    edges,
    rumors: [],
    mutualAidHistory: [],
    spontaneousAidReadiness: 65,
    communitySolidarityIndex: 58,
  };
}

// ============================================================================
// 3. Formules Mathématiques Pures Déterministes
// ============================================================================

const clamp = (v: number, min = -100, max = 100): number => Math.max(min, Math.min(max, v));

/**
 * Récupère ou instancie une arête relationnelle entre deux habitants.
 */
export function getOrCreateEdge(state: SocialNetworkState, a: string, b: string): SocialEdge {
  const key = getEdgeKey(a, b);
  let edge = state.edges[key];
  if (!edge) {
    const [npcA, npcB] = a < b ? [a, b] : [b, a];
    edge = {
      npcA,
      npcB,
      affinity: 20,
      trust: 30,
      interactionCount: 0,
      mutualAidCount: 0,
      lastInteractionDay: 1,
    };
    state.edges[key] = edge;
  }
  return edge;
}

/**
 * Calcul déterministe du score de transmission d'une information entre deux habitants :
 * Score = 0.35 * Affinité + 0.35 * Confiance + GossipBonus(A) + ReceptivityBonus(B)
 */
export function calculateTransmissionScore(
  affinity: number,
  trust: number,
  sourceNpcId: string,
  targetNpcId: string,
): number {
  const sourceTraits = NPC_SOCIABILITY_MAP[sourceNpcId] ?? { gossipBonus: 10, receptivityBonus: 10, altruismScore: 25 };
  const targetTraits = NPC_SOCIABILITY_MAP[targetNpcId] ?? { gossipBonus: 10, receptivityBonus: 10, altruismScore: 25 };

  const affinityFactor = Math.max(0, (affinity + 100) / 2); // ramène -100..100 vers 0..100
  const score = (affinityFactor * 0.35) + (trust * 0.35) + sourceTraits.gossipBonus + targetTraits.receptivityBonus;
  return Math.round(score * 10) / 10;
}

/**
 * Seuil déterministe requis pour qu'une nouvelle soit transmise :
 * Seuil = max(20, 50 - floor(Intensité / 4) - floor(Crédibilité / 6))
 */
export function calculateTransmissionThreshold(intensity: number, credibility: number): number {
  const reduction = Math.floor(intensity / 4) + Math.floor(credibility / 6);
  return Math.max(20, 50 - reduction);
}

// ============================================================================
// 4. Moteur de Propagation de Rumeurs & Nouvelles
// ============================================================================

export interface RumorStepReport {
  rumorId: string;
  newInformedNpcs: string[];
  totalAwareCount: number;
  criticalMassReached: boolean;
  systemicEffectFired: boolean;
  effectDescription?: string;
}

/**
 * Lance une nouvelle rumeur ou information dans le graphe social.
 */
export function launchSocialRumor(
  state: SocialNetworkState,
  rumorDef: {
    id: string;
    category: RumorCategory;
    headline: string;
    originNpc: string;
    intensity: number;
    credibility: number;
    createdDay: number;
  },
): SocialRumor {
  const rumor: SocialRumor = {
    id: rumorDef.id,
    category: rumorDef.category,
    headline: rumorDef.headline,
    originNpc: rumorDef.originNpc,
    createdDay: rumorDef.createdDay,
    intensity: clamp(rumorDef.intensity, 0, 100),
    credibility: clamp(rumorDef.credibility, 0, 100),
    knownByNpcs: {
      [rumorDef.originNpc]: {
        belief: clamp(rumorDef.credibility, 0, 100),
        dayHeard: rumorDef.createdDay,
      },
    },
    systemicTriggered: false,
  };

  state.rumors.push(rumor);
  return rumor;
}

/**
 * Exécute un pas déterministe de propagation des rumeurs actives à travers le réseau.
 */
export function propagateRumorsCycle(
  state: SocialNetworkState,
  currentDay: number,
): RumorStepReport[] {
  const reports: RumorStepReport[] = [];

  for (const rumor of state.rumors) {
    const awareNpcs = Object.keys(rumor.knownByNpcs);
    const newInformedNpcs: string[] = [];
    const threshold = calculateTransmissionThreshold(rumor.intensity, rumor.credibility);

    // Pour chaque habitant informé, tentative de transmission à ses voisins non-informés
    for (const sourceId of awareNpcs) {
      const sourceBelief = rumor.knownByNpcs[sourceId]?.belief ?? 0;
      if (sourceBelief < 25) continue; // Si la source n'y croit pas, elle ne colporte pas

      for (const targetId of state.nodes) {
        if (targetId === sourceId || rumor.knownByNpcs[targetId]) continue;

        const edge = getOrCreateEdge(state, sourceId, targetId);
        const score = calculateTransmissionScore(edge.affinity, edge.trust, sourceId, targetId);

        if (score >= threshold) {
          // Transmission réussie ! Calcul de la croyance du destinataire
          const trustRatio = Math.max(0.2, edge.trust / 100);
          const credibilityRatio = Math.max(0.2, rumor.credibility / 100);
          const targetBelief = Math.round(sourceBelief * trustRatio * credibilityRatio);

          rumor.knownByNpcs[targetId] = {
            belief: Math.max(10, Math.min(100, targetBelief)),
            dayHeard: currentDay,
          };
          newInformedNpcs.push(targetId);
          edge.interactionCount += 1;
          edge.lastInteractionDay = currentDay;
        }
      }
    }

    const totalAware = Object.keys(rumor.knownByNpcs).length;
    // Seuil critique : au moins 4 habitants croient fermement (croyance >= 40)
    const believers = Object.values(rumor.knownByNpcs).filter((k) => k.belief >= 40).length;
    const criticalMass = believers >= 4;

    let systemicEffectFired = false;
    let effectDesc: string | undefined;

    if (criticalMass && !rumor.systemicTriggered) {
      rumor.systemicTriggered = true;
      systemicEffectFired = true;

      // Déclenchement systémique selon la catégorie
      switch (rumor.category) {
        case 'drive_scandale':
          effectDesc = 'Scandale public : Boycott spontané du Drive, vitalité locale en hausse.';
          state.communitySolidarityIndex = Math.min(100, state.communitySolidarityIndex + 8);
          break;
        case 'atelier_besoin':
          effectDesc = 'Solidarité d’atelier : Vague de dons de bois et matériaux de récupération.';
          state.spontaneousAidReadiness = Math.min(100, state.spontaneousAidReadiness + 12);
          break;
        case 'solidarite_locale':
          effectDesc = 'Ferveur collective : Banquets de rue et regain d’optimisme populaire.';
          state.communitySolidarityIndex = Math.min(100, state.communitySolidarityIndex + 10);
          break;
        case 'tresor_roses':
          effectDesc = 'Effervescence : Les enfants et les aînés s’entraident pour explorer les caves.';
          state.spontaneousAidReadiness = Math.min(100, state.spontaneousAidReadiness + 8);
          break;
        case 'csa_patrouille':
          effectDesc = 'Vigilance : Guetteurs bénévoles déployés sur les toits pour protéger l’antenne.';
          break;
      }
    }

    reports.push({
      rumorId: rumor.id,
      newInformedNpcs,
      totalAwareCount: totalAware,
      criticalMassReached: criticalMass,
      systemicEffectFired,
      effectDescription: effectDesc,
    });
  }

  return reports;
}

// ============================================================================
// 5. Moteur d'Entraide Spontanée
// ============================================================================

export interface MutualAidCheckResult {
  triggered: boolean;
  event?: MutualAidEvent;
  helperId?: string;
  recipientId: string;
  needType: MutualAidNeedType;
  solidarityGain: number;
}

/**
 * Évalue si un habitant ou le joueur en situation de besoin reçoit une aide spontanée
 * de la part de ses voisins les plus proches et fiables.
 */
export function evaluateMutualAid(
  state: SocialNetworkState,
  day: number,
  recipientId: string,
  needType: MutualAidNeedType,
  emergencySeverity = 50,
): MutualAidCheckResult {
  let bestCandidateId: string | undefined;
  let bestScore = -1;

  for (const candidateId of state.nodes) {
    if (candidateId === recipientId) continue;

    const edge = getOrCreateEdge(state, recipientId, candidateId);
    if (edge.affinity < 30 || edge.trust < 30) continue; // Pas d'aide si relation trop froide ou méfiante

    const traits = NPC_SOCIABILITY_MAP[candidateId] ?? { gossipBonus: 10, receptivityBonus: 10, altruismScore: 25 };
    const affinityBonus = Math.max(0, edge.affinity);
    const score = affinityBonus + (edge.trust * 0.8) + traits.altruismScore + (state.spontaneousAidReadiness * 0.4);

    if (score > bestScore) {
      bestScore = score;
      bestCandidateId = candidateId;
    }
  }

  // Seuil d'intervention déterministe
  const activationThreshold = Math.max(50, 110 - Math.floor(emergencySeverity / 2));
  if (!bestCandidateId || bestScore < activationThreshold) {
    return {
      triggered: false,
      recipientId,
      needType,
      solidarityGain: 0,
    };
  }

  // L'aide spontanée a lieu !
  const edge = getOrCreateEdge(state, recipientId, bestCandidateId);
  edge.affinity = clamp(edge.affinity + 6, -100, 100);
  edge.trust = clamp(edge.trust + 5, 0, 100);
  edge.mutualAidCount += 1;
  edge.lastInteractionDay = day;

  state.spontaneousAidReadiness = Math.min(100, state.spontaneousAidReadiness + 3);
  state.communitySolidarityIndex = Math.min(100, state.communitySolidarityIndex + 2);

  let desc = '';
  let resolution = '';

  switch (needType) {
    case 'bris_outillage':
      desc = `${bestCandidateId} a prêté sa trousse à outils personnelle pour débloquer le chantier.`;
      resolution = '+25 points d’état d’outils immédiats et fin du blocage technique.';
      break;
    case 'penurie_matiere':
      desc = `${bestCandidateId} a fouillé son garage et apporté des planches de chêne et des vis.`;
      resolution = '+15 unités de matériaux de réemploi apportées gracieusement.';
      break;
    case 'surmenage_epicerie':
      desc = `${bestCandidateId} est venue prêter main-forte à la caisse pour désengorger la queue.`;
      resolution = 'Le calme revient chez Mme Bertin, clients rassurés.';
      break;
    case 'colis_urgent':
      desc = `${bestCandidateId} a enfourché son vélo pour doubler la cadence de livraison.`;
      resolution = 'Délai sauvé in extremis avec le sourire.';
      break;
    case 'tresse_fatigue':
      desc = `${bestCandidateId} a préparé un grand bol de tisane chaude et pris le relais une heure.`;
      resolution = '-20 de stress et soulagement partagé.';
      break;
  }

  const event: MutualAidEvent = {
    id: `aid_${day}_${recipientId}_${bestCandidateId}`,
    day,
    recipientId,
    helperId: bestCandidateId,
    needType,
    description: desc,
    resolutionEffect: resolution,
    affinityDelta: 6,
  };

  state.mutualAidHistory.unshift(event);
  if (state.mutualAidHistory.length > 50) state.mutualAidHistory.length = 50;

  return {
    triggered: true,
    event,
    helperId: bestCandidateId,
    recipientId,
    needType,
    solidarityGain: 2,
  };
}

/**
 * Met à jour directement la relation entre deux habitants.
 */
export function updateSocialRelation(
  state: SocialNetworkState,
  a: string,
  b: string,
  deltas: { affinityDelta?: number; trustDelta?: number; day?: number },
): SocialEdge {
  const edge = getOrCreateEdge(state, a, b);
  if (deltas.affinityDelta) edge.affinity = clamp(edge.affinity + deltas.affinityDelta, -100, 100);
  if (deltas.trustDelta) edge.trust = clamp(edge.trust + deltas.trustDelta, 0, 100);
  if (deltas.day) edge.lastInteractionDay = deltas.day;
  edge.interactionCount += 1;
  return edge;
}
