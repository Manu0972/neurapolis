/**
 * Carnet d'économie : les concepts que le joueur vit avant de les lire. Chacun s'apprend
 * par un verdict de duel, un palier franchi ou une rencontre ; le carnet les garde.
 */

export interface EconConcept {
  id: string;
  name: string;
  /** Penseur qui l'incarne dans le jeu. */
  thinker: string;
  /** Une phrase, sans jargon. */
  summary: string;
  /** Ce que le joueur a vécu qui l'illustre. */
  example: string;
}

export const ECON_CONCEPTS: readonly EconConcept[] = [
  { id: 'economies_echelle', name: 'Économies d’échelle', thinker: 'Henry Ford', summary: 'Plus on produit, moins chaque unité coûte : les coûts fixes se répartissent.', example: 'Ta grosse fournée coûte moins cher par pièce… tant que tout se vend.' },
  { id: 'juste_a_temps', name: 'Juste-à-temps', thinker: 'Taiichi Ohno', summary: 'Produire ce qui est demandé, quand c’est demandé : moins de stock dormant, moins de gâchis.', example: 'Plus d’invendus jetés le soir, mais une rupture le jour d’affluence.' },
  { id: 'cout_stock', name: 'Le coût du stock', thinker: 'Taiichi Ohno', summary: 'Un stock immobilise de l’argent, prend de la place et peut se perdre.', example: 'Les cartons qui dorment, c’est de la trésorerie qui ne travaille pas.' },
  { id: 'main_invisible', name: 'La main invisible', thinker: 'Adam Smith', summary: 'Chacun cherchant son intérêt, l’échange libre peut produire un ordre utile à tous.', example: 'Tes prix au niveau du marché ont attiré du monde sans qu’on te le demande.' },
  { id: 'plus_value', name: 'La plus-value', thinker: 'Karl Marx', summary: 'La valeur créée par le travail dépasse le salaire versé ; la question est : à qui revient l’écart ?', example: 'Partager les bénéfices a motivé ton équipe… et réduit ta marge.' },
  { id: 'demande_effective', name: 'La demande effective', thinker: 'John Maynard Keynes', summary: 'En crise, ce qui manque, ce sont les acheteurs : investir peut relancer la machine.', example: 'Ton emprunt a payé quand la conjoncture repartait.' },
  { id: 'signal_prix', name: 'Le prix comme signal', thinker: 'Friedrich Hayek', summary: 'Les prix transmettent une information qu’aucun plan ne peut rassembler ; la prudence garde de la marge d’erreur.', example: 'Sans dette, ta petite structure a encaissé le mauvais mois.' },
  { id: 'levier', name: 'L’effet de levier', thinker: 'John Maynard Keynes', summary: 'Emprunter amplifie les gains… et les pertes.', example: 'Tes intérêts tombent chaque jour, que les clients viennent ou non.' },
  { id: 'organisation_scientifique', name: 'L’organisation scientifique du travail', thinker: 'Frederick W. Taylor', summary: 'Chronométrer et standardiser chaque geste fait gagner du temps.', example: 'Ta cadence a baissé tes coûts, puis la fatigue a usé la qualité.' },
  { id: 'souffrance_travail', name: 'La souffrance au travail', thinker: 'Christophe Dejours', summary: 'Le travail réel déborde toujours la consigne ; ignorer ce qu’il coûte aux gens finit par coûter cher.', example: 'Écouter ton équipe a fait monter la qualité, client après client.' },
  { id: 'avantage_comparatif', name: 'L’avantage comparatif', thinker: 'David Ricardo', summary: 'Chacun gagne à se spécialiser dans ce qu’il fait relativement le mieux, puis à échanger.', example: 'Vendre plus loin a ouvert un marché plus grand, et plus nerveux.' },
  { id: 'donut', name: 'Le donut', thinker: 'Kate Raworth', summary: 'Prospérer entre un plancher social et un plafond écologique, sans croissance à tout prix.', example: 'Rester local t’a valu des clients fidèles et un prix un peu plus haut.' },
  { id: 'destruction_creatrice', name: 'La destruction créatrice', thinker: 'Joseph Schumpeter', summary: 'L’innovation remplace l’ancien : des gagnants rapides, des perdants aussi.', example: 'Ton idée nouvelle a raflé le marché… après des débuts coûteux.' },
  { id: 'communs', name: 'Les communs', thinker: 'Elinor Ostrom', summary: 'Une ressource partagée peut être bien gérée par ceux qui l’utilisent, avec leurs propres règles.', example: 'Mutualiser les coûts avec d’autres t’a protégé des mauvais jours.' },
  { id: 'cout_fixe_variable', name: 'Coûts fixes et coûts variables', thinker: 'Adam Smith', summary: 'Certains coûts tombent même sans client (loyer), d’autres suivent les ventes (marchandise).', example: 'Le jour sans clients, le loyer, lui, est passé.' },
  { id: 'marge', name: 'La marge', thinker: 'David Ricardo', summary: 'Ce qui reste entre le prix de vente et le coût : c’est elle qui paie tout le reste.', example: 'Un prix trop bas remplit la boutique et vide la caisse.' },
  { id: 'effet_reseau', name: 'L’effet de réseau', thinker: 'Joseph Schumpeter', summary: 'Un service vaut plus quand plus de gens l’utilisent.', example: 'Chaque nouveau commerçant sur ton appli en attire d’autres.' },
  { id: 'franchise', name: 'La franchise', thinker: 'Adam Smith', summary: 'Prêter sa marque et sa méthode à d’autres contre une redevance : grandir sans tout payer soi-même.', example: 'Tes franchisés ouvrent des boutiques que tu n’as pas financées.' },
  { id: 'faillite', name: 'La faillite', thinker: 'Friedrich Hayek', summary: 'Une entreprise qui perd de l’argent trop longtemps libère ses ressources pour d’autres usages.', example: 'Fermer à temps a sauvé le reste de tes affaires.' },
  { id: 'capital_social', name: 'Le capital social', thinker: 'Pierre Bourdieu', summary: 'Les relations sont une ressource : elles ouvrent des portes que l’argent n’ouvre pas.', example: 'Une ancienne camarade de classe t’a ouvert le marché de la Vallée.' },
];

export const CONCEPT_BY_ID: Readonly<Record<string, EconConcept>> = Object.fromEntries(ECON_CONCEPTS.map((c) => [c.id, c]));
