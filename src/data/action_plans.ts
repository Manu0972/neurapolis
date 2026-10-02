/**
 * NEURAPOLIS — Données statiques des Plans d'Action et Cartographie Stratégique.
 */
import type { ActionPlanState, TerritorialZoneId, TerritoryNodeState } from '../core/types';

export interface TacticalBranch {
  id: string;
  label: string;
  description: string;
  modifierSummary: string;
  marginBonus?: number;
  costModifier?: number;
  speedBonus?: number;
}

export interface ActionPlanTemplate {
  id: string;
  title: string;
  category: ActionPlanState['category'];
  description: string;
  ghostAdvisorId: string;
  ghostInsight: string;
  steps: Array<{ id: string; label: string }>;
  unlockedDay: number;
  rewardDescription: string;
  tacticalBranches?: TacticalBranch[];
}

export const INITIAL_ACTION_PLANS: ActionPlanTemplate[] = [
  {
    id: 'plan_approvisionnement_direct',
    title: 'Plan A : Circuit Court & Approvisionnement Direct',
    category: 'approvisionnement',
    description: 'Court-circuiter les marges de la grande distribution en scellant un pacte direct avec Mme Bertin et les producteurs locaux.',
    ghostAdvisorId: 'smith',
    ghostInsight: 'Adam Smith : « L’intérêt bien compris de l’épicier et le vôtre convergent. Achetez en volume régulier, fixez un prix transparent, et la main du commerce fera le reste. »',
    steps: [
      { id: 'step_bertin_tier1', label: 'Atteindre le rang Habitué chez Mme Bertin (Tier 1)' },
      { id: 'step_stock_reserve', label: 'Constituer un stock tampon de 25 portions de goûters' },
      { id: 'step_negocier_remise', label: 'Obtenir une remise fournisseur garantie d’au moins 5%' },
    ],
    unlockedDay: 0,
    rewardDescription: 'Marge bénéficiaire sur les ventes augmentée de 20% et immunité aux petites ruptures de stock.',
    tacticalBranches: [
      {
        id: 'branche_bertin_court',
        label: 'Épicerie Bertin Circuit Court',
        description: 'Approvisionnement local direct chez Mme Bertin : produits frais, confiance quartier renforcée, zéro délai logistique.',
        modifierSummary: 'Marge +15 %, Confiance quartier +2, zéro délai',
        marginBonus: 0.15,
        speedBonus: 1.0,
      },
      {
        id: 'branche_docks_volume',
        label: 'Grossiste Fluvial des Docks',
        description: 'Achat groupé en gros volume sur les péniches du canal : coûts d’achat réduits mais transport plus lourd.',
        modifierSummary: 'Coût d’achat -25 %, Risque météo fluvial, volume doublé',
        costModifier: -0.25,
        marginBonus: 0.25,
      },
    ],
  },
  {
    id: 'plan_optimisation_logistique',
    title: 'Plan B : Flotte Douce & Maillage Territorial',
    category: 'optimisation_reseau',
    description: 'Mettre en place un réseau de distribution à pied et triporteurs avec Noah et Karim pour couvrir tout le quartier sans retard.',
    ghostAdvisorId: 'taylor',
    ghostInsight: 'Taylor : « Chaque seconde perdue sur un trajet mal tracé est un gaspillage d’énergie. Standardisez les tournées, optimisez le portage. »',
    steps: [
      { id: 'step_recruter_logistique', label: 'Assigner un responsable logistique (Noah ou Karim)' },
      { id: 'step_commandes_douces', label: 'Livrer 5 commandes en transport doux (pied / triporteur)' },
      { id: 'step_relais_quartier', label: 'Établir au moins 2 points de relais citoyens' },
    ],
    unlockedDay: 2,
    rewardDescription: 'Vitesse de livraison doublée et satisfaction client +15%.',
    tacticalBranches: [
      {
        id: 'branche_triporteurs_rapides',
        label: 'Flotte de Triporteurs Rapides',
        description: 'Noah et Karim sillonnent le pavé à vélo cargo pour livrer les commandes en un éclair.',
        modifierSummary: 'Vitesse de livraison +50 %, Satisfaction +20 %',
        speedBonus: 0.5,
      },
      {
        id: 'branche_relais_citoyens',
        label: 'Réseau de Relais Citoyens',
        description: 'Dépôts de colis chez les concierges et commerçants du quartier avec retrait flexible.',
        modifierSummary: 'Frais logistiques -40 %, Lien social +25 %',
        costModifier: -0.4,
      },
    ],
  },
  {
    id: 'plan_diplomatie_college',
    title: 'Plan C : Accord Cadre & Emplacement Collège',
    category: 'diplomatie_locale',
    description: 'Négocier avec le professeur Moreau et les délégués pour obtenir un statut toléré et des créneaux de vente officiels.',
    ghostAdvisorId: 'polanyi',
    ghostInsight: 'Karl Polanyi : « Le marché ne flotte pas dans le vide : il doit être encastré dans les règles de la cité. Négociez avec les institutions. »',
    steps: [
      { id: 'step_accord_professeur', label: 'Maintenir une moyenne scolaire ≥ 12/20' },
      { id: 'step_negocier_autorisation', label: 'Négocier un accord de tolérance avec M. Moreau ou les délégués' },
      { id: 'step_zero_incident', label: 'Enchaîner 3 jours sans aucun incident ni retard scolaire' },
    ],
    unlockedDay: 3,
    rewardDescription: 'Autorisation officielle d’activité aux abords du collège sans risque de confiscation.',
    tacticalBranches: [
      {
        id: 'branche_accords_professeurs',
        label: 'Pacte Académique avec Moreau',
        description: 'Négociation d’un horaire d’étude aménagé et stand toléré en sortie de cours.',
        modifierSummary: 'Discipline +5, Risque zéro confiscation',
        marginBonus: 0.1,
      },
      {
        id: 'branche_delegues_eleves',
        label: 'Coalition des Délégués d’Élèves',
        description: 'Mobilisation des camarades de classe pour une coopérative scolaire autogérée.',
        modifierSummary: 'Popularité +15 %, Solidarité étudiante +10',
        speedBonus: 0.2,
      },
    ],
  },
  {
    id: 'plan_expansion_tramway',
    title: 'Plan D : Percée Métropolitaine & Ligne de Tramway',
    category: 'expansion_territoire',
    description: 'Étendre nos activités au quartier de la Gare et du Tramway pour toucher les pendulaires et lycéens.',
    ghostAdvisorId: 'schumpeter',
    ghostInsight: 'Schumpeter : « L’innovateur ne s’arrête jamais à son pré carré. La destruction créatrice exige de conquérir de nouveaux espaces. »',
    steps: [
      { id: 'step_debloquer_tramway', label: 'Débloquer le nœud territorial Tramway & Gare' },
      { id: 'step_comptoir_tramway', label: 'Atteindre le Tier 1 au Comptoir Logistique Tramway' },
      { id: 'step_tresorerie_expansion', label: 'Disposer d’une trésorerie d’au moins 80 €' },
    ],
    unlockedDay: 5,
    rewardDescription: 'Accès au marché de transit métropolitain (+50% de volume de vente potentiel).',
    tacticalBranches: [
      {
        id: 'branche_kiosque_gare',
        label: 'Kiosque Fixe de la Gare',
        description: 'Comptoir permanent au terminus du tramway captant les navetteurs et lycéens.',
        modifierSummary: 'Volume de vente +40 %, Présence stable',
        marginBonus: 0.2,
      },
      {
        id: 'branche_coursiers_pendulaires',
        label: 'Livraison Mobile aux Arrêts',
        description: 'Vente nomade sur les quais aux heures de pointe matinales et vespérales.',
        modifierSummary: 'Marge unitaire +25 %, Flexibilité maximale',
        costModifier: -0.15,
      },
    ],
  },
  {
    id: 'plan_export_regional',
    title: 'Plan E : Centrale Citoyenne Régionale & Fret Fluvial',
    category: 'expansion_territoire',
    description: 'Connecter les Docks pour exporter nos solutions artisanales et réparations vers les communes voisines.',
    ghostAdvisorId: 'keynes',
    ghostInsight: 'Keynes : « Quand la demande locale est saturée, il faut stimuler les flux macroéconomiques et investir dans les grandes infrastructures. »',
    steps: [
      { id: 'step_debloquer_docks', label: 'Sécuriser un partenariat avec le Grossiste Fluvial des Docks' },
      { id: 'step_concession_regionale', label: 'Payer la concession régionale d’exploitation' },
      { id: 'step_chiffre_affaires_cible', label: 'Générer plus de 150 € de chiffre d’affaires cumulé' },
    ],
    unlockedDay: 8,
    rewardDescription: 'Camille devient un acteur économique régional reconnu. Débloque le palier Métropole Régionale.',
    tacticalBranches: [
      {
        id: 'branche_fret_fluvial_ecolo',
        label: 'Fret Fluvial Décarboné',
        description: 'Navettes fluviales douces approvisionnant les coopératives de Saint-Ferrand.',
        modifierSummary: 'Éco-responsabilité +30 %, Reconnaissance régionale',
        marginBonus: 0.3,
      },
      {
        id: 'branche_reseau_comptoirs',
        label: 'Centrale d’Achat Métropolitaine',
        description: 'Connexion directe avec les fablabs et ateliers du grand bassin industriel.',
        modifierSummary: 'Chiffre d’affaires potentiel +60 %, Synergies industrielles',
        costModifier: -0.3,
      },
    ],
  },
];

export const INITIAL_TERRITORY_NODES: Record<TerritorialZoneId, TerritoryNodeState> = {
  roses: {
    id: 'roses',
    name: 'Quartier des Roses (Base)',
    unlocked: true,
    marketPotential: 85,
    ourPresence: 60,
    competitorPresence: 40,
    activeArrangement: true,
    concessionCost: 0,
  },
  bassin: {
    id: 'bassin',
    name: 'Bassin des Mariniers',
    unlocked: true,
    marketPotential: 65,
    ourPresence: 25,
    competitorPresence: 50,
    activeArrangement: false,
    concessionCost: 15,
  },
  caves: {
    id: 'caves',
    name: 'Caves & Friche Artisanale',
    unlocked: true,
    marketPotential: 70,
    ourPresence: 35,
    competitorPresence: 30,
    activeArrangement: true,
    concessionCost: 10,
  },
  hauts: {
    id: 'hauts',
    name: 'Hauts de Val-Ferrand (Résidentiel)',
    unlocked: false,
    marketPotential: 80,
    ourPresence: 0,
    competitorPresence: 65,
    activeArrangement: false,
    concessionCost: 25,
  },
  tramway: {
    id: 'tramway',
    name: 'Gare & Ligne Tramway Centrale',
    unlocked: false,
    marketPotential: 90,
    ourPresence: 0,
    competitorPresence: 75,
    activeArrangement: false,
    concessionCost: 35,
  },
  docks: {
    id: 'docks',
    name: 'Docks Fluviaux & Entrepôts',
    unlocked: false,
    marketPotential: 95,
    ourPresence: 0,
    competitorPresence: 80,
    activeArrangement: false,
    concessionCost: 50,
  },
  ville_voisine: {
    id: 'ville_voisine',
    name: 'Saint-Ferrand (Ville Voisine)',
    unlocked: false,
    marketPotential: 90,
    ourPresence: 0,
    competitorPresence: 70,
    activeArrangement: false,
    concessionCost: 65,
  },
  metropole_regionale: {
    id: 'metropole_regionale',
    name: 'Grand Bassin Métropolitain',
    unlocked: false,
    marketPotential: 98,
    ourPresence: 0,
    competitorPresence: 85,
    activeArrangement: false,
    concessionCost: 100,
  },
  national: {
    id: 'national',
    name: 'Réseau Économique National',
    unlocked: false,
    marketPotential: 100,
    ourPresence: 0,
    competitorPresence: 90,
    activeArrangement: false,
    concessionCost: 200,
  },
};
