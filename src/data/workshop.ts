/**
 * Données et configurations pour l'Atelier de Réparation de la Friche (Second projet économique).
 * Pièces détachées, collecte de récupération, recrutement de Karim, commandes initiales.
 */
import type { NpcId, SkillId } from '../core/types';

export const WORKSHOP_CONFIG = {
  id: 'atelier_friche' as const,
  name: 'Atelier de Réparation de la Friche',
  partsCost: 15,            // 15 € pour 10 pièces neuves
  partsUnits: 10,
  salvageTimeTicks: 2,      // 20 min de collecte (2 ticks x 10 min)
  salvageFatigue: 6,
  recruitSkill: 'technique' as SkillId,
  recruitMinLevel: 1,
  recruitables: ['karim', 'yasmine'] as readonly NpcId[],
};

export interface InitialOrderDef {
  id: string;
  clientName: string;
  npcId?: NpcId;
  itemLabel: string;
  partsNeeded: number;
  salvageNeeded: number;
  workNeeded: number;       // unités de 20 min
  reward: number;           // €
  deadlineDays: number;     // jours à partir de la création
  minTechnique: number;
}

export const INITIAL_REPAIR_ORDERS: readonly InitialOrderDef[] = [
  {
    id: 'velo_bertin',
    clientName: 'Mme Bertin',
    npcId: 'bertin',
    itemLabel: 'Vélo de livraison (freins grippés)',
    partsNeeded: 2,
    salvageNeeded: 1,
    workNeeded: 2,
    reward: 14,
    deadlineDays: 4,
    minTechnique: 0,
  },
  {
    id: 'grille_pain_monique',
    clientName: 'Monique',
    npcId: 'monique',
    itemLabel: 'Grille-pain (résistance HS)',
    partsNeeded: 1,
    salvageNeeded: 1,
    workNeeded: 1,
    reward: 8,
    deadlineDays: 3,
    minTechnique: 0,
  },
  {
    id: 'radio_yasmine',
    clientName: 'Yasmine',
    npcId: 'yasmine',
    itemLabel: 'Poste radio vintage',
    partsNeeded: 3,
    salvageNeeded: 2,
    workNeeded: 3,
    reward: 22,
    deadlineDays: 5,
    minTechnique: 1,
  },
  {
    id: 'trottinette_noah',
    clientName: 'Noah',
    npcId: 'noah',
    itemLabel: 'Trottinette (roulement à billes cassé)',
    partsNeeded: 2,
    salvageNeeded: 1,
    workNeeded: 2,
    reward: 16,
    deadlineDays: 4,
    minTechnique: 1,
  },
];

export const DYNAMIC_ORDER_TEMPLATES: readonly Omit<InitialOrderDef, 'id'>[] = [
  {
    clientName: 'Habitant du quartier',
    itemLabel: 'Lampe de chevet à réparer',
    partsNeeded: 1,
    salvageNeeded: 1,
    workNeeded: 1,
    reward: 10,
    deadlineDays: 3,
    minTechnique: 0,
  },
  {
    clientName: 'Artisan local',
    itemLabel: 'Perceuse d’occasion à réviser',
    partsNeeded: 2,
    salvageNeeded: 2,
    workNeeded: 3,
    reward: 25,
    deadlineDays: 4,
    minTechnique: 1,
  },
  {
    clientName: 'Collégien de Val-Ferrand',
    itemLabel: 'Casque audio avec faux contact',
    partsNeeded: 1,
    salvageNeeded: 0,
    workNeeded: 2,
    reward: 12,
    deadlineDays: 2,
    minTechnique: 0,
  },
  {
    clientName: 'Mme Moreau',
    npcId: 'moreau',
    itemLabel: 'Cafetière de la salle des profs',
    partsNeeded: 2,
    salvageNeeded: 1,
    workNeeded: 2,
    reward: 18,
    deadlineDays: 3,
    minTechnique: 1,
  },
];
