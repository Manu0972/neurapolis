/**
 * NEURAPOLIS — Données statiques Multi-Entreprises, Rôles et Aléas Économiques.
 */
import type { EconomicHazard, VentureId, VentureRole, VentureState } from '../core/types';

export interface VentureDef {
  id: VentureId;
  name: string;
  category: string;
  description: string;
  unlockConditionText: string;
  baseRevenuePerDay: number;
  baseExpensesPerDay: number;
  unlockedByDefault: boolean;
}

export const VENTURE_DEFS: Record<VentureId, VentureDef> = {
  stand_roses: {
    id: 'stand_roses',
    name: 'Stand des Roses (Goûters & Boissons)',
    category: 'Alimentation & Vente Directe',
    description: 'Vente de collations artisanales, confiseries bio et boissons fraîches aux élèves et habitants.',
    unlockConditionText: 'Actif dès le début de l’aventure (Chapitre 1).',
    baseRevenuePerDay: 12,
    baseExpensesPerDay: 5,
    unlockedByDefault: true,
  },
  atelier_friche: {
    id: 'atelier_friche',
    name: 'Atelier de la Friche (Réparation & Recyclage)',
    category: 'Artisanat & Économie Circulaire',
    description: 'Réparation d’objets, réemploi de pièces et confection coopérative avec Karim.',
    unlockConditionText: 'Débloqué avec Karim à la Friche (Chapitre 2).',
    baseRevenuePerDay: 18,
    baseExpensesPerDay: 7,
    unlockedByDefault: false,
  },
  coursiers_doux: {
    id: 'coursiers_doux',
    name: 'Les Coursiers des Roses (Logistique Douce)',
    category: 'Transport & Fret Citoyen',
    description: 'Flotte de livraison douce à pied et triporteurs pour les commerçants du quartier.',
    unlockConditionText: 'Débloqué lors du déploiement de la logistique douce.',
    baseRevenuePerDay: 22,
    baseExpensesPerDay: 8,
    unlockedByDefault: false,
  },
  gazette_citoyenne: {
    id: 'gazette_citoyenne',
    name: 'Radio Val-Ferrand & La Gazette des Roses',
    category: 'Média & Information Locale',
    description: 'Journal papier indépendant et émetteur radio pirate citoyen (108.4 FM).',
    unlockConditionText: 'Débloqué avec la publication du premier journal ou émission.',
    baseRevenuePerDay: 15,
    baseExpensesPerDay: 6,
    unlockedByDefault: false,
  },
  grossiste_regional: {
    id: 'grossiste_regional',
    name: 'Comptoir Régional des Communs (Centrale d’Achat)',
    category: 'Commerce de Gros & Fret Régional',
    description: 'Centrale d’approvisionnement et d’exportation alimentant plusieurs communes.',
    unlockConditionText: 'Débloqué lors de l’expansion aux Docks et Tramway.',
    baseRevenuePerDay: 45,
    baseExpensesPerDay: 18,
    unlockedByDefault: false,
  },
};

export interface RoleDef {
  role: VentureRole;
  title: string;
  description: string;
  requiredTraitOrSkill: string;
  bonusText: string;
}

export const VENTURE_ROLE_DEFS: Record<VentureRole, RoleDef> = {
  directeur: {
    role: 'directeur',
    title: 'Direction & Stratégie',
    description: 'Coordonne l’équipe, planifie les investissements et résout les conflits internes.',
    requiredTraitOrSkill: 'Organisation ou Influence',
    bonusText: '+25 % de rendement global et réduction des aléas économiques.',
  },
  logistique: {
    role: 'logistique',
    title: 'Responsable Logistique',
    description: 'Gère les stocks, organise les tournées et réduit les délais de livraison.',
    requiredTraitOrSkill: 'Discipline ou Technique',
    bonusText: '+30 % de rapidité de livraison et zéro rupture de stock.',
  },
  negociateur: {
    role: 'negociateur',
    title: 'Achats & Négociation',
    description: 'Négocie avec les fournisseurs, marchands et autorités pour faire baisser les coûts.',
    requiredTraitOrSkill: 'Négociation ou Communication',
    bonusText: '−15 % sur toutes les dépenses d’exploitation.',
  },
  tresorier: {
    role: 'tresorier',
    title: 'Trésorerie & Comptabilité',
    description: 'Tient le grand livre des comptes, calcule les marges et sécurise la caisse.',
    requiredTraitOrSkill: 'Comptabilité',
    bonusText: 'Élimine totalement les erreurs de caisse et optimise la fiscalité.',
  },
  qualite: {
    role: 'qualite',
    title: 'Qualité, Éthique & Solidarité',
    description: 'Veille à la qualité artisanale, à l’impact écologique et à la satisfaction des habitants.',
    requiredTraitOrSkill: 'Recherche ou Confiance',
    bonusText: '+20 % de réputation de quartier et fidélité accrue des clients.',
  },
};

export const INITIAL_ECONOMIC_HAZARDS: EconomicHazard[] = [
  {
    id: 'hazard_vol_recre',
    ventureId: 'stand_roses',
    title: 'Vol de goûters pendant la récréation',
    description: 'Des paquets de biscuits ont disparu du stock temporaire près de la grille du collège.',
    type: 'vol_gouters',
    severity: 1,
    resolved: false,
    costToResolve: 6,
    ghostAdvisorId: 'hobbes',
    ghostAdviceText: 'Thomas Hobbes : « L’absence de surveillance invite l’opportunisme. Verrouillez les malles ou signez un contrat clair avec les délégués. »',
  },
  {
    id: 'hazard_erreur_caisse',
    ventureId: 'stand_roses',
    title: 'Erreur de calcul de marge sur les jus',
    description: 'Le prix au verre a été mal calculé hier, créant un manque à gagner de 8 €.',
    type: 'erreur_marge',
    severity: 1,
    resolved: false,
    costToResolve: 8,
    ghostAdvisorId: 'taylor',
    ghostAdviceText: 'Taylor : « Standardisez vos fiches de prix et confiez les calculs à un tableau de bord rigoureux. »',
  },
  {
    id: 'hazard_guerre_prix',
    ventureId: 'stand_roses',
    title: 'Offensive agressive de la concurrence',
    description: 'Le distributeur automatique et le Drive ont cassé leurs prix sur les sodas industriels.',
    type: 'guerre_prix',
    severity: 2,
    resolved: false,
    costToResolve: 15,
    ghostAdvisorId: 'polanyi',
    ghostAdviceText: 'Polanyi : « Ne rivalisez pas sur le poison chimique. Mettez en avant le goût vrai, le lien humain et l’origine locale. »',
  },
  {
    id: 'hazard_concession_emplacement',
    ventureId: 'coursiers_doux',
    title: 'Contrôle d’occupation de la voirie',
    description: 'L’agent de quartier demande un justificatif pour le stationnement des triporteurs sur la place.',
    type: 'controle_concession',
    severity: 2,
    resolved: false,
    costToResolve: 12,
    ghostAdvisorId: 'commons',
    ghostAdviceText: 'John R. Commons : « Le droit de travailler dans l’espace public s’obtient par des transactions institutionnelles négociées. Régularisez la convention. »',
  },
];
