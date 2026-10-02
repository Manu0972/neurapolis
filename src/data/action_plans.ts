/**
 * NEURAPOLIS — Données statiques des Plans d'Action et Cartographie Stratégique.
 */
import type { ActionPlanState, TerritorialZoneId, TerritoryNodeState } from '../core/types';

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
