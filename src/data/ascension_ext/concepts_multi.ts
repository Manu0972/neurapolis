/**
 * NEURAPOLIS — Ascension & Pédagogie économique (AG-3 Phase 4)
 * Concepts économiques et de théorie des jeux pour le multijoueur.
 * 7 concepts majeurs : dilemme_prisonnier, cartel, coentreprise,
 * confiance_repetee, barriere_entree, guerre_des_prix, passager_clandestin.
 * Conforme à docs/ASCENSION.md, spec_miner_ag3/specs.md et ANTIGRAVITY-WORKFLOW-AG3.md.
 */
import type { EconConcept as BaseEconConcept } from '../ascension/concepts';

export interface MultiEconConcept extends BaseEconConcept {
  tier: 3 | 4 | 5;
  quote: string;
  practicalEffect: string;
  multiplier: number;
  unlockedBy: 'story' | 'reading' | 'choice';
}

export type EconConcept = MultiEconConcept;

export const MULTI_CONCEPTS: readonly MultiEconConcept[] = [
  {
    id: 'dilemme_prisonnier',
    name: 'Le dilemme du prisonnier',
    thinker: 'John Nash',
    summary: 'Deux partenaires ont chacun un intérêt individuel à trahir, mais leur défection mutuelle produit un résultat bien pire que la coopération.',
    tier: 3,
    example: 'Si ton atelier et ton rival cassez vos prix en cachette pour emporter les commandes du Faubourg, vos marges s’effondrent ; si vous tenez vos prix, vous restez rentables tous les deux.',
    quote: '« Le meilleur résultat pour un groupe s’obtient lorsque chaque membre fait ce qui est le mieux pour lui-même et pour le groupe. » — John Nash',
    practicalEffect: 'Révèle la stratégie dominante adverse lors des arbitrages et confère un bonus temporaire de rentabilité en cas de défection unilatérale.',
    multiplier: 1.15,
    unlockedBy: 'choice',
  },
  {
    id: 'cartel',
    name: 'Le cartel',
    thinker: 'Adam Smith',
    summary: 'Une entente secrète ou explicite entre producteurs indépendants pour fixer des prix élevés, geler l’offre et se partager le marché au détriment des acheteurs.',
    tier: 4,
    example: 'Les grossistes en matériaux de la Vallée se réunissent au café des Docks pour imposer un tarif plancher uniforme sur le ciment et le bois de charpente.',
    quote: '« Les gens du même métier se rassemblent rarement pour s’amuser sans que leur conversation finisse par une conspiration contre le public ou par quelque machination pour hausser les prix. » — Adam Smith',
    practicalEffect: 'Permet de verrouiller un tarif plancher concerté avec une entreprise rivale mais expose à une perte brutale de confiance populaire en cas de découverte.',
    multiplier: 1.20,
    unlockedBy: 'choice',
  },
  {
    id: 'coentreprise',
    name: 'La coentreprise',
    thinker: 'Elinor Ostrom',
    summary: 'L’association contractuelle de deux entreprises autonomes pour financer et exploiter un projet commun sans fusionner leurs structures respectives.',
    tier: 3,
    example: 'Ton atelier de réparation s’associe à la société de coursiers pour créer une flotte partagée de triporteurs cargos électriques à la Gare Est.',
    quote: '« La mise en commun concertée d’infrastructures et de règles transparentes permet d’accomplir ce qu’aucune entreprise isolée ne pourrait financer seule. » — Elinor Ostrom',
    practicalEffect: 'Partage 15 % des bénéfices sur les projets communs et stimule la demande croisée (+6 % de clientèle) entre les deux enseignes associées.',
    multiplier: 1.25,
    unlockedBy: 'story',
  },
  {
    id: 'confiance_repetee',
    name: 'La confiance répétée',
    thinker: 'Robert Axelrod',
    summary: 'Dans un cadre d’échanges répétés, la perspective de futures collaborations rend l’honnêteté et la coopération rationnellement plus payantes que la tricherie immédiate.',
    tier: 3,
    example: 'Parce que tu commerces chaque semaine avec les artisans de la Friche, honorer scrupuleusement tes engagements t’assure des facilités de paiement durables et un soutien sans faille.',
    quote: '« L’ombre du futur incite à la réciprocité : coopérer au départ, punir sans délai la défection, puis pardonner dès que l’autre revient à la loyauté. » — Robert Axelrod',
    practicalEffect: 'Multiplie les gains mutuels dans les accords durables et divise par deux le risque d’annulation de contrat avec les partenaires réguliers.',
    multiplier: 1.15,
    unlockedBy: 'reading',
  },
  {
    id: 'barriere_entree',
    name: 'La barrière à l’entrée',
    thinker: 'Joe Bain',
    summary: 'Un obstacle financier, technique, légal ou réputationnel qui dissuade ou empêche de nouveaux concurrents de s’implanter sur un marché rentable.',
    tier: 4,
    example: 'Détenir l’unique quai de déchargement ferroviaire à la Gare Est empêche tout nouvel entrepôt de concurrencer ta logistique sans payer un droit de péage.',
    quote: '« Les barrières à l’entrée confèrent aux entreprises établies le pouvoir durable d’élever leurs prix au-dessus du coût marginal sans attirer de rivaux. » — Joe Bain',
    practicalEffect: 'Protège tes parts de marché contre l’installation de nouveaux concurrents locaux et stabilise ta marge bénéficiaire.',
    multiplier: 1.10,
    unlockedBy: 'reading',
  },
  {
    id: 'guerre_des_prix',
    name: 'La guerre des prix',
    thinker: 'Antoine-Augustin Cournot',
    summary: 'Une confrontation agressive où des concurrents baissent successivement leurs tarifs jusqu’au coût marginal, détruisant la marge de tout le secteur pour asphyxier l’adversaire.',
    tier: 3,
    example: 'Pour évincer un étal concurrent sur la place, tu vends tes cagettes de pommes à prix coûtant durant plusieurs semaines jusqu’à ce que sa trésorerie soit épuisée.',
    quote: '« Lorsque deux producteurs se disputent les mêmes acheteurs par le seul levier du prix, le marché tend vers l’annulation du profit économique. » — Antoine-Augustin Cournot',
    practicalEffect: 'Réduit temporairement la rentabilité du secteur mais permet de siphonner agressivement la clientèle d’une entreprise rivale affaiblie.',
    multiplier: 1.30,
    unlockedBy: 'choice',
  },
  {
    id: 'passager_clandestin',
    name: 'Le passager clandestin',
    thinker: 'Mancur Olson',
    summary: 'Le comportement d’un acteur économique qui tire profit d’un bien public ou d’un aménagement collectif sans contribuer à son financement ni à son entretien.',
    tier: 5,
    example: 'Un commerce de la rue piétonne refuse de participer financièrement aux illuminations et au nettoyage de l’allée tout en bénéficiant de l’afflux de promeneurs attirés.',
    quote: '« Les membres d’un grand groupe ne contribueront pas volontairement à la production d’un bien collectif s’ils peuvent en jouir gratuitement sans payer. » — Mancur Olson',
    practicalEffect: 'Permet d’économiser les charges collectives d’un aménagement de quartier au prix d’une dégradation marquée de la réputation civique.',
    multiplier: 1.15,
    unlockedBy: 'story',
  },
];

export const MULTI_CONCEPT_BY_ID: Readonly<Record<string, MultiEconConcept>> = Object.fromEntries(
  MULTI_CONCEPTS.map((c) => [c.id, c])
);
