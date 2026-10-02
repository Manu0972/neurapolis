/**
 * NEURAPOLIS — Urban Renovation & City Transformation Simulation System.
 * Couche : simulation/ (Moteur pur, déterministe, headless, testable sous Vitest).
 *
 * Exigences Axis 3 :
 * 1. Déverrouillage progressif des 6 quartiers :
 *    - Roses (centre), Docks (canal), Hauts (résidentiel), Bassin (industrie), Caves (souterrains), Tramway (connexion métropole)
 * 2. Chantiers citoyens articulés en 5 typologies :
 *    - façades (crépi chaud, briques, fresques)
 *    - toits végétalisés (potagers suspendus, ruches)
 *    - friches (réhabilitation Taret, fablabs)
 *    - voies piétonnes (pavés doux, rampes triporteurs)
 *    - canal (berges moussues, pontons)
 * 3. États des chantiers (planifie, en_cours, termine, suspendu) avec progression déterministe basée sur :
 *    - ressources allouées (matériaux)
 *    - bénévolat citoyen actif
 *    - compétences artisanales (technique, organisation, recherche)
 * 4. Fonctions de requêtes pures pour l'affichage de l'état esthétique et structurel de la ville.
 */

import type {
  CityAestheticReport,
  CityGovernanceState,
  CityMetrics,
  DistrictId,
  DistrictRenovationSummary,
  DistrictUnlockState,
  ParticipatoryProjectDef,
  RenovationType,
  WorksiteState,
  WorksiteStatus,
} from '../core/governance_types';
import type { WorldState } from '../core/types';
import { pushEvent } from './events';

// ============================================================================
// 1. Catalogue et Usines de Chantiers Citoyens
// ============================================================================

/**
 * Crée un chantier citoyen directement à partir d'un projet lauréat du budget participatif.
 */
export function createWorksiteFromProject(
  project: ParticipatoryProjectDef,
  currentDay: number,
): WorksiteState {
  let renovationType: RenovationType = 'facades';
  switch (project.category) {
    case 'environnement':
      renovationType = project.districtId === 'docks' ? 'canal' : 'toits_vegetalises';
      break;
    case 'mobilites':
      renovationType = 'voies_pietonnes';
      break;
    case 'patrimoine':
      renovationType = 'facades';
      break;
    case 'solidarite':
    case 'economie':
      renovationType = 'friches';
      break;
    default:
      renovationType = 'facades';
  }

  const visualFlag = `renovation_${renovationType}_${project.id}`;

  return {
    id: `ws_${project.id}`,
    name: project.title,
    description: project.description,
    districtId: project.districtId,
    type: renovationType,
    status: 'en_cours',
    progressPct: 0,
    workHoursInvested: 0,
    workHoursNeeded: project.workHoursNeeded,
    materialsSupplied: Math.round(project.materialsNeeded * 0.4), // 40% approvisionné d'office par la dotation
    materialsNeeded: project.materialsNeeded,
    craftSkillsApplied: { technique: 1, organisation: 1 },
    volunteersActive: 4,
    doctrineAffinity: project.doctrine,
    associatedProjectId: project.id,
    startedDay: currentDay,
    aesthetic: {
      primaryPalette: ['#c15f4a', '#efd9ac', '#488b56'],
      visualFlags: [visualFlag],
      summaryDescription: `Chantier citoyen issu du scrutin participatif : ${project.title}.`,
    },
    permanentBonus: {
      vitaliteBonus: project.impacts.vitaliteBonus ?? 5,
      confianceBonus: project.impacts.confianceBonus ?? 8,
      moralBonus: project.impacts.moraleDelta ?? 10,
      parkBonus: project.impacts.parkBonus ?? 5,
      attractivenessBonus: project.impacts.attractivenessDelta ?? 12,
    },
  };
}

/**
 * Catalogue initial de chantiers emblématiques prêts à être engagés dans la ville.
 */
export function createDefaultWorksitesCatalog(): Record<string, WorksiteState> {
  return {
    ws_facades_roses: {
      id: 'ws_facades_roses',
      name: 'Ravalement Chaud & Fresque Historique des Roses',
      description: 'Décapage du vieux crépi, rejointoiement à la chaux et fresque murale célébrant la mémoire ouvrière.',
      districtId: 'roses',
      type: 'facades',
      status: 'en_cours',
      progressPct: 25,
      workHoursInvested: 30,
      workHoursNeeded: 120,
      materialsSupplied: 35,
      materialsNeeded: 50,
      craftSkillsApplied: { technique: 1, organisation: 1 },
      volunteersActive: 3,
      doctrineAffinity: 'communs_ostrom',
      startedDay: 1,
      aesthetic: {
        primaryPalette: ['#c15f4a', '#efd9ac', '#2a1a14'],
        visualFlags: ['facades_roses_renovees', 'fresque_memoire_ouvriere'],
        summaryDescription: 'Crépi chaleureux 1800K, moulures soignées et fresque artisanale aux pigments naturels.',
      },
      permanentBonus: {
        vitaliteBonus: 8,
        confianceBonus: 10,
        moralBonus: 6,
        parkBonus: 4,
        attractivenessBonus: 15,
      },
    },
    ws_toits_hauts: {
      id: 'ws_toits_hauts',
      name: 'Toitures Végétalisées & Potagers Suspendus des Hauts',
      description: 'Installation de substrats légers, bacs maraîchers en bois de réemploi et ruches sur les toits-terrasses.',
      districtId: 'hauts',
      type: 'toits_vegetalises',
      status: 'planifie',
      progressPct: 0,
      workHoursInvested: 0,
      workHoursNeeded: 160,
      materialsSupplied: 20,
      materialsNeeded: 70,
      craftSkillsApplied: { technique: 2, recherche: 1 },
      volunteersActive: 0,
      doctrineAffinity: 'communs_ostrom',
      aesthetic: {
        primaryPalette: ['#488b56', '#86cc68', '#785139'],
        visualFlags: ['toits_verts_hauts', 'ruches_citoyennes'],
        summaryDescription: 'Canopée maraîchère suspendue, bacs d’aromates et lampions alimentés par de petits panneaux solaires.',
      },
      permanentBonus: {
        vitaliteBonus: 4,
        confianceBonus: 12,
        moralBonus: 14,
        parkBonus: 15,
        attractivenessBonus: 18,
      },
    },
    ws_rehab_friche: {
      id: 'ws_rehab_friche',
      name: 'Réhabilitation de la Halle Taret & Ateliers Modulaires',
      description: 'Remplacement des verrières cassées, remise en état de l’établi collectif et sécurisation des machines.',
      districtId: 'bassin',
      type: 'friches',
      status: 'planifie',
      progressPct: 0,
      workHoursInvested: 0,
      workHoursNeeded: 220,
      materialsSupplied: 30,
      materialsNeeded: 100,
      craftSkillsApplied: { technique: 3, organisation: 2 },
      volunteersActive: 0,
      doctrineAffinity: 'socialiste_commune',
      aesthetic: {
        primaryPalette: ['#8f3a34', '#7b8499', '#ffd98a'],
        visualFlags: ['verrieres_friche_remplacees', 'enseigne_taret_peinte'],
        summaryDescription: 'Verrières translucides baignées de soleil, briques brossées et outillage ordonné sur râteliers.',
      },
      permanentBonus: {
        vitaliteBonus: 15,
        confianceBonus: 16,
        moralBonus: 12,
        parkBonus: 5,
        attractivenessBonus: 14,
      },
    },
    ws_voies_pietonnes: {
      id: 'ws_voies_pietonnes',
      name: 'Pavage Confortable & Voie des Triporteurs',
      description: 'Remplacement des ornières par des dalles de granit scié, dépose des bordures coupantes et bancs de repos.',
      districtId: 'roses',
      type: 'voies_pietonnes',
      status: 'planifie',
      progressPct: 0,
      workHoursInvested: 0,
      workHoursNeeded: 130,
      materialsSupplied: 15,
      materialsNeeded: 60,
      craftSkillsApplied: { organisation: 2, technique: 1 },
      volunteersActive: 0,
      doctrineAffinity: 'productiviste_taylor',
      aesthetic: {
        primaryPalette: ['#cfa97f', '#533c31', '#ffeab3'],
        visualFlags: ['paves_doux_pietons', 'corridor_triporteur'],
        summaryDescription: 'Voies de circulation douce parfaitement régulières, bancs ergonomiques et rampes d’accès aisées.',
      },
      permanentBonus: {
        vitaliteBonus: 10,
        confianceBonus: 8,
        moralBonus: 7,
        parkBonus: 10,
        attractivenessBonus: 12,
      },
    },
    ws_quais_canal: {
      id: 'ws_quais_canal',
      name: 'Restauration des Berges & Ponton Associatif du Canal',
      description: 'Consolidation de la maçonnerie de quai, anneaux d’amarrage en fer forgé et plantation de joncs filtrants.',
      districtId: 'docks',
      type: 'canal',
      status: 'planifie',
      progressPct: 0,
      workHoursInvested: 0,
      workHoursNeeded: 200,
      materialsSupplied: 25,
      materialsNeeded: 90,
      craftSkillsApplied: { technique: 2, recherche: 2 },
      volunteersActive: 0,
      doctrineAffinity: 'communs_ostrom',
      aesthetic: {
        primaryPalette: ['#396e94', '#488b56', '#533c31'],
        visualFlags: ['quai_granit_consolide', 'ponton_peniche_associative'],
        summaryDescription: 'Berges vivantes en pierre calcaire avec reflets dorés le soir, péniche fleurie et lampadaires restaurés.',
      },
      permanentBonus: {
        vitaliteBonus: 12,
        confianceBonus: 14,
        moralBonus: 16,
        parkBonus: 18,
        attractivenessBonus: 22,
      },
    },
  };
}

// ============================================================================
// 2. Déverrouillage Progressif des Quartiers
// ============================================================================

/**
 * Vérifie si un quartier peut être déverrouillé selon l'état actuel de la simulation.
 */
export function canUnlockDistrict(
  state: CityGovernanceState,
  districtId: DistrictId,
  worldState?: WorldState,
): { allowed: boolean; reasons: string[] } {
  const district = state.districts[districtId];
  if (!district) {
    return { allowed: false, reasons: [`Quartier introuvable : ${districtId}`] };
  }
  if (district.unlocked) {
    return { allowed: false, reasons: [`Le quartier ${district.name} est déjà déverrouillé.`] };
  }

  const req = district.requirements;
  const reasons: string[] = [];

  // 1. Réputation du joueur
  const playerReputation = worldState?.player?.reputation ?? state.metrics.overallCivicEngagement;
  if (playerReputation < req.minReputation) {
    reasons.push(`Réputation requise : ${req.minReputation} (actuel : ${Math.round(playerReputation)})`);
  }

  // 2. Confiance du quartier
  const confiance = worldState?.district?.confianceQuartier ?? state.districts.roses.civicEngagement;
  if (confiance < req.minConfianceQuartier) {
    reasons.push(`Confiance citoyenne requise : ${req.minConfianceQuartier} (actuel : ${Math.round(confiance)})`);
  }

  // 3. Vitalité de l'épicerie / commerces
  const vitalite = worldState?.district?.vitaliteEpicerie ?? state.districts.roses.vitality;
  if (vitalite < req.minVitaliteEpicerie) {
    reasons.push(`Vitalité commerciale requise : ${req.minVitaliteEpicerie} (actuel : ${Math.round(vitalite)})`);
  }

  // 4. Trésorerie requise
  const playerMoney = worldState?.player?.money ?? 999;
  if (playerMoney < req.costEuros) {
    reasons.push(`Fonds municipaux requis : ${req.costEuros} € (disponible : ${playerMoney} €)`);
  }

  // 5. Compétence requise
  if (req.requiredSkill && worldState?.player?.skills) {
    const sId = req.requiredSkill.skillId as keyof typeof worldState.player.skills;
    const skill = worldState.player.skills[sId];
    if (!skill || skill.level < req.requiredSkill.minLevel) {
      reasons.push(`Compétence ${req.requiredSkill.skillId} niveau ${req.requiredSkill.minLevel} requise`);
    }
  }

  // 6. Chantiers préalables requis
  for (const requiredWsId of req.requiredCompletedWorksites) {
    const ws = state.worksites[requiredWsId];
    if (!ws || ws.status !== 'termine') {
      reasons.push(`Chantier préalable inachevé : ${ws?.name ?? requiredWsId}`);
    }
  }

  return {
    allowed: reasons.length === 0,
    reasons,
  };
}

/**
 * Déverrouille un quartier de la cité une fois les prérequis validés.
 */
export function unlockDistrict(
  state: CityGovernanceState,
  districtId: DistrictId,
  currentDay: number,
  worldState?: WorldState,
): boolean {
  const check = canUnlockDistrict(state, districtId, worldState);
  if (!check.allowed) return false;

  const district = state.districts[districtId];
  if (!district) return false;

  district.unlocked = true;
  district.unlockedDay = currentDay;
  district.attractiveness = Math.min(100, district.attractiveness + 15);
  district.vitality = Math.min(100, district.vitality + 10);

  // Déduction financière optionnelle
  if (worldState && district.requirements.costEuros > 0) {
    worldState.player.money -= district.requirements.costEuros;
  }

  // Déblocage des chantiers associés à ce nouveau quartier
  for (const ws of Object.values(state.worksites)) {
    if (ws.districtId === districtId && ws.status === 'planifie') {
      ws.status = 'en_cours';
      ws.startedDay = currentDay;
      district.activeWorksiteIds.push(ws.id);
    }
  }

  // Notification d'événement systémique
  if (worldState) {
    pushEvent(worldState, {
      type: 'quartier',
      title: `Nouveau Quartier Déverrouillé : ${district.name}`,
      text: `Les barrières s’ouvrent ! ${district.description}. L’attractivité de Val-Ferrand progresse.`,
      causes: [
        { facteur: 'réputation du joueur', seuil: String(district.requirements.minReputation), poids: 3 },
        { facteur: 'confiance citoyenne', seuil: String(district.requirements.minConfianceQuartier), poids: 2 },
      ],
    });
  }

  return true;
}

// ============================================================================
// 3. Progression Déterministe des Chantiers
// ============================================================================

/**
 * Alloue des ressources (matériaux, bénévoles, compétences) à un chantier.
 */
export function allocateWorksiteResources(
  worksite: WorksiteState,
  allocation: {
    materialsDelta?: number;
    volunteersActive?: number;
    craftSkills?: Record<string, number>;
  },
): void {
  if (allocation.materialsDelta !== undefined) {
    worksite.materialsSupplied = Math.max(
      0,
      Math.min(worksite.materialsNeeded * 2, worksite.materialsSupplied + allocation.materialsDelta),
    );
  }
  if (allocation.volunteersActive !== undefined) {
    worksite.volunteersActive = Math.max(0, allocation.volunteersActive);
  }
  if (allocation.craftSkills) {
    worksite.craftSkillsApplied = {
      ...worksite.craftSkillsApplied,
      ...allocation.craftSkills,
    };
  }
}

/**
 * Calcule et applique l'avancement quotidien d'un chantier selon la formule déterministe :
 *
 * EfficacitéMatériaux = clamp(materialsSupplied / materialsNeeded, 0.20, 1.0)
 * BoniArtisanat = sum(skillLevel * 3.0)
 * BénévolatEffectif = volunteersActive * 4.0 * (1 + civicEngagement / 200)
 * HeuresJour = (BénévolatEffectif + BoniArtisanat) * EfficacitéMatériaux
 * DeltaProgress = (HeuresJour / workHoursNeeded) * 100
 */
export function advanceWorksiteDay(
  worksite: WorksiteState,
  district: DistrictUnlockState,
  currentDay: number,
  worldState?: WorldState,
): { progressDelta: number; completed: boolean } {
  if (worksite.status !== 'en_cours') {
    return { progressDelta: 0, completed: worksite.status === 'termine' };
  }

  // 1. Facteur d'approvisionnement en matériaux [0.20 à 1.0]
  const materialRatio = worksite.materialsNeeded > 0
    ? worksite.materialsSupplied / worksite.materialsNeeded
    : 1.0;
  const materialEfficiency = Math.max(0.20, Math.min(1.0, materialRatio));

  // 2. Compétences artisanales appliquées (technique, organisation, recherche)
  let craftSkillBonusHours = 0;
  for (const level of Object.values(worksite.craftSkillsApplied)) {
    craftSkillBonusHours += Math.max(0, level) * 3.0;
  }

  // 3. Travail bénévole amplifié par l'engagement civique du quartier
  const civicMultiplier = 1.0 + Math.max(0, Math.min(100, district.civicEngagement)) / 200.0;
  const volunteerBaseHours = worksite.volunteersActive * 4.0; // 4h/jour par bénévole
  const effectiveVolunteerHours = volunteerBaseHours * civicMultiplier;

  // 4. Heures utiles effectives investies ce jour
  const totalDailyEffectiveHours = (effectiveVolunteerHours + craftSkillBonusHours) * materialEfficiency;

  if (totalDailyEffectiveHours <= 0) {
    return { progressDelta: 0, completed: false };
  }

  // 5. Calcul de l'incrément de progression
  const progressIncrement = (totalDailyEffectiveHours / worksite.workHoursNeeded) * 100.0;
  const roundedIncrement = Math.round(progressIncrement * 100) / 100;

  worksite.workHoursInvested = Math.round((worksite.workHoursInvested + totalDailyEffectiveHours) * 10) / 10;
  worksite.progressPct = Math.min(100, Math.round((worksite.progressPct + roundedIncrement) * 100) / 100);

  // 6. Test d'achèvement
  let completed = false;
  if (worksite.progressPct >= 100) {
    worksite.status = 'termine';
    worksite.completedDay = currentDay;
    completed = true;

    // Mise à jour des index du quartier
    district.activeWorksiteIds = district.activeWorksiteIds.filter((id) => id !== worksite.id);
    if (!district.completedWorksiteIds.includes(worksite.id)) {
      district.completedWorksiteIds.push(worksite.id);
    }

    // Application des bonus permanents au quartier
    district.vitality = Math.min(100, district.vitality + worksite.permanentBonus.vitaliteBonus);
    district.attractiveness = Math.min(100, district.attractiveness + worksite.permanentBonus.attractivenessBonus);
    district.civicEngagement = Math.min(100, district.civicEngagement + worksite.permanentBonus.confianceBonus);

    // Synchronisation avec WorldState si disponible
    if (worldState) {
      worldState.district.vitaliteEpicerie = Math.min(
        100,
        worldState.district.vitaliteEpicerie + Math.round(worksite.permanentBonus.vitaliteBonus / 2),
      );
      worldState.district.confianceQuartier = Math.min(
        100,
        worldState.district.confianceQuartier + worksite.permanentBonus.confianceBonus,
      );
      worldState.district.frequentationParc = Math.min(
        100,
        worldState.district.frequentationParc + worksite.permanentBonus.parkBonus,
      );
      worldState.player.needs.moral = Math.min(
        100,
        worldState.player.needs.moral + worksite.permanentBonus.moralBonus,
      );

      pushEvent(worldState, {
        type: 'quartier',
        title: `Chantier Achevé : ${worksite.name}`,
        text: `Fierté citoyenne ! ${worksite.aesthetic.summaryDescription} (+${worksite.permanentBonus.attractivenessBonus} Attractivité).`,
        causes: [
          { facteur: 'travail bénévole et artisanal', seuil: `${Math.round(worksite.workHoursInvested)}h`, poids: 3 },
          { facteur: `quartier ${district.name}`, poids: 2 },
        ],
      });
    }
  }

  return { progressDelta: roundedIncrement, completed };
}

/**
 * Fait avancer tous les chantiers en cours de la cité d'un jour.
 */
export function advanceAllWorksitesDay(
  state: CityGovernanceState,
  currentDay: number,
  worldState?: WorldState,
): string[] {
  const completedIds: string[] = [];

  for (const worksite of Object.values(state.worksites)) {
    if (worksite.status === 'en_cours') {
      const district = state.districts[worksite.districtId];
      if (district) {
        const result = advanceWorksiteDay(worksite, district, currentDay, worldState);
        if (result.completed) {
          completedIds.push(worksite.id);
        }
      }
    }
  }

  return completedIds;
}

// ============================================================================
// 4. Fonctions de Requêtes Pures pour l'Affichage
// ============================================================================

/**
 * Rapport visuel complet décrivant l'esthétique actuelle de la ville.
 */
export function getCityAestheticOverview(state: CityGovernanceState): CityAestheticReport {
  const activeFlags: string[] = [];
  let completedCount = 0;
  let inProgressCount = 0;

  for (const ws of Object.values(state.worksites)) {
    if (ws.status === 'termine') {
      completedCount += 1;
      activeFlags.push(...ws.aesthetic.visualFlags);
    } else if (ws.status === 'en_cours') {
      inProgressCount += 1;
    }
  }

  const unlockedCount = Object.values(state.districts).filter((d) => d.unlocked).length;

  const districtSummaries = Object.values(state.districts).map((d) => {
    const completedInDistrict = Object.values(state.worksites).filter(
      (w) => w.districtId === d.districtId && w.status === 'termine',
    );
    const summary = completedInDistrict.length > 0
      ? completedInDistrict.map((w) => w.aesthetic.summaryDescription).join(' | ')
      : d.unlocked
      ? 'Quartier ouvert en attente de transformations majeures.'
      : 'Zone encore inaccessible — accès soumis aux exigences citoyennes.';

    return {
      districtId: d.districtId,
      name: d.name,
      unlocked: d.unlocked,
      attractiveness: d.attractiveness,
      aestheticSummary: summary,
    };
  });

  return {
    dominantDoctrine: state.metrics.dominantDoctrine,
    activeVisualFlags: Array.from(new Set(activeFlags)),
    unlockedDistrictsCount: unlockedCount,
    totalWorksitesCompleted: completedCount,
    totalWorksitesInProgress: inProgressCount,
    districtSummaries,
  };
}

/**
 * Rapport détaillé d'un quartier spécifique.
 */
export function getDistrictRenovationStatus(
  state: CityGovernanceState,
  districtId: DistrictId,
): DistrictRenovationSummary {
  const district = state.districts[districtId] ?? {
    districtId,
    name: 'Quartier Inconnu',
    description: '',
    unlocked: false,
    vitality: 0,
    attractiveness: 0,
    civicEngagement: 0,
    ambientKelvin: 1800,
    activeWorksiteIds: [],
    completedWorksiteIds: [],
    requirements: {
      minReputation: 0,
      minConfianceQuartier: 0,
      minVitaliteEpicerie: 0,
      costEuros: 0,
      requiredCompletedWorksites: [],
    },
  };

  const activeWorksites = Object.values(state.worksites).filter(
    (w) => w.districtId === districtId && w.status === 'en_cours',
  );
  const completedWorksites = Object.values(state.worksites).filter(
    (w) => w.districtId === districtId && w.status === 'termine',
  );

  const allDistrictWorksites = Object.values(state.worksites).filter((w) => w.districtId === districtId);
  const overallProgress = allDistrictWorksites.length > 0
    ? Math.round(allDistrictWorksites.reduce((acc, w) => acc + w.progressPct, 0) / allDistrictWorksites.length)
    : 0;

  return {
    districtId,
    name: district.name,
    unlocked: district.unlocked,
    attractiveness: district.attractiveness,
    civicEngagement: district.civicEngagement,
    vitality: district.vitality,
    activeWorksites,
    completedWorksites,
    overallProgressPct: overallProgress,
  };
}

/**
 * Retourne la liste des chantiers en attente ou en cours.
 */
export function getPendingAndActiveWorksites(state: CityGovernanceState): WorksiteState[] {
  return Object.values(state.worksites).filter((w) => w.status === 'planifie' || w.status === 'en_cours');
}

/**
 * Retourne la liste des chantiers achevés.
 */
export function getCompletedRenovations(state: CityGovernanceState): WorksiteState[] {
  return Object.values(state.worksites).filter((w) => w.status === 'termine');
}

/**
 * Retourne les métriques synthétiques de la ville.
 */
export function getCityGlobalMetrics(state: CityGovernanceState): CityMetrics {
  return { ...state.metrics };
}
