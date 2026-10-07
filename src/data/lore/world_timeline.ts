/**
 * Chronologie du monde de 2020 à 2045 (Val-Ferrand, France et macro-économie).
 * Utilisé pour alimenter le flux de nouvelles macro-économiques (macro_news),
 * les chocs d'offre/demande, l'inflation, et l'arrière-plan historique.
 * Référence : docs/VISION.md §3.6, prototype Édition Savoirs, et docs/ANTIGRAVITY-BRIEF-2026-10-07.md (tâche A-3.4).
 */

export interface TimelineEventDef {
  readonly year: number;
  readonly month: number; // 1-12
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly macroEffectSuggestion: {
    readonly inflationDelta?: number; // e.g. +0.03 = +3%
    readonly interestRateDelta?: number;
    readonly demandImpact?: Partial<Record<'epicerie' | 'frais' | 'boisson' | 'boulangerie' | 'snack' | 'cafe' | 'livre' | 'papeterie' | 'vetement' | 'fleur' | 'velo' | 'service', number>>;
    readonly energyCostMult?: number;
  };
  readonly localContextValFerrand: string;
}

export const WORLD_TIMELINE: readonly TimelineEventDef[] = [
  {
    year: 2020,
    month: 9,
    id: 'rentree_2020_val_ferrand',
    title: 'Rentrée scolaire et élection municipale',
    summary: 'Rentrée des classes à Val-Ferrand. Jean-Bernard Pujol entame son mandat de maire après les élections de mars.',
    macroEffectSuggestion: {
      inflationDelta: 0.01,
      demandImpact: { papeterie: 1.3, snack: 1.15 },
    },
    localContextValFerrand: 'Le nouveau maire promet de revitaliser l’avenue Jean-Jaurès tout en autorisant l’extension du Drive HyperVal en périphérie.',
  },
  {
    year: 2021,
    month: 5,
    id: 'crise_matieres_premieres_2021',
    title: 'Tension mondiale sur les matières premières et l’acier',
    summary: 'Perturbations logistiques mondiales. Hausse des coûts du transport maritime et des métaux.',
    macroEffectSuggestion: {
      inflationDelta: 0.03,
      energyCostMult: 1.15,
      demandImpact: { velo: 1.25, service: 1.2 },
    },
    localContextValFerrand: 'Le laminoir Taret tourne à plein régime temporaire, mais les artisans locaux comme Karim peinent à trouver des pièces détachées neuves.',
  },
  {
    year: 2022,
    month: 10,
    id: 'choc_energetique_2022',
    title: 'Flambée des cours de l’électricité et du gaz',
    summary: 'Crise énergétique en Europe. Factures multipliées par deux pour les boulangers et petites industries.',
    macroEffectSuggestion: {
      inflationDelta: 0.05,
      energyCostMult: 1.45,
      demandImpact: { boulangerie: 0.9, cafe: 0.95 },
    },
    localContextValFerrand: 'Jean-Luc Caron au Fournil des Roses menace de fermer l’après-midi. Le débat sur une régie municipale de l’énergie s’enflamme à la Maison du Peuple.',
  },
  {
    year: 2023,
    month: 6,
    id: 'loi_zéro_artificialisation_2023',
    title: 'Application stricte du Zéro Artificialisation Nette (ZAN)',
    summary: 'Gel des autorisations pour les zones commerciales géantes en périphérie.',
    macroEffectSuggestion: {
      demandImpact: { epicerie: 1.1, cafe: 1.15 },
    },
    localContextValFerrand: 'Le projet d’extension du supermarché HyperVal est suspendu par la préfecture, redonnant de l’oxygène aux commerces du centre-ville.',
  },
  {
    year: 2024,
    month: 11,
    id: 'essor_plateformes_circulaires_2024',
    title: 'Bascule vers la seconde main et le réemploi',
    summary: 'Plus de 40% des jeunes achètent leurs vêtements et équipements d’occasion.',
    macroEffectSuggestion: {
      demandImpact: { vetement: 1.35, velo: 1.3, service: 1.25 },
    },
    localContextValFerrand: 'La friperie Seconde Chance et la ressourcerie de la Friche Taret connaissent une affluence record.',
  },
  {
    year: 2025,
    month: 4,
    id: 'accord_paris_2_climat_2025',
    title: 'Sommet climatique : Traité de Paris 2.0',
    summary: 'Taxe carbone aux frontières et quotas d’émissions renforcés sur les transports routiers.',
    macroEffectSuggestion: {
      energyCostMult: 1.2,
      demandImpact: { velo: 1.4, frais: 1.25 },
    },
    localContextValFerrand: 'Le transport fluvial sur le Canal de la Malterie redevient compétitif face aux camions diesel des grossistes.',
  },
  {
    year: 2026,
    month: 9,
    id: 'monnaies_locales_citoyennes_2026',
    title: 'Reconnaissance des réseaux de monnaie locale complémentaire',
    summary: 'La Banque centrale valide l’interopérabilité des monnaies de bassin de vie.',
    macroEffectSuggestion: {
      inflationDelta: -0.01,
      demandImpact: { epicerie: 1.2, livre: 1.15, fleur: 1.1 },
    },
    localContextValFerrand: 'Lancement du « Taret », monnaie locale acceptée chez Mme Bertin, au café de Claire et à l’atelier de Karim.',
  },
  {
    year: 2028,
    month: 3,
    id: 'automatisation_logistique_2028',
    title: 'Automatisation massive des entrepôts périurbains',
    summary: 'Les géants du commerce en ligne déploient des flottes de robots trieurs et préparent des livraisons par navettes autonomes.',
    macroEffectSuggestion: {
      demandImpact: { epicerie: 0.85, vetement: 0.85 },
    },
    localContextValFerrand: 'HyperVal supprime 60 emplois de manutentionnaires au profit de transpalettes guidés par caméra, provoquant un piquet de grève devant le rond-point.',
  },
  {
    year: 2029,
    month: 10,
    id: 'krach_bulle_ia_2029',
    title: 'Éclatement de la bulle technologique IA',
    summary: 'Chute des valorisations des géants du cloud. Retour en grâce de l’économie réelle tangible et de proximité.',
    macroEffectSuggestion: {
      interestRateDelta: -0.02,
      inflationDelta: -0.02,
      demandImpact: { livre: 1.25, cafe: 1.2, service: 1.15 },
    },
    localContextValFerrand: 'Les startups de livraison algorithmique font faillite ; les commerçants indépendants qui ont gardé le lien humain résistent sans encombre.',
  },
  {
    year: 2032,
    month: 1,
    id: 'fermeture_laminoir_taret_2032',
    title: 'Fermeture programmée du laminoir Taret (1 300 emplois)',
    summary: 'Arrêt définitif du dernier site industriel lourd de la métallurgie dans la vallée.',
    macroEffectSuggestion: {
      inflationDelta: -0.01,
      interestRateDelta: 0.01,
      demandImpact: { snack: 0.8, vetement: 0.8 },
    },
    localContextValFerrand: 'Choc émotionnel et économique majeur. L’ancien ouvrier Karim et le collectif citoyen proposent une reprise ouvrière sous statut coopératif (TaretCoop).',
  },
  {
    year: 2034,
    month: 7,
    id: 'canicule_historique_etang_2034',
    title: 'Canicule du siècle et stress hydrique',
    summary: '45 jours consécutifs au-dessus de 38°C en plaine. Réorganisation des horaires urbains (sieste l’après-midi, vie nocturne).',
    macroEffectSuggestion: {
      demandImpact: { boisson: 1.6, frais: 0.75, cafe: 1.1 },
    },
    localContextValFerrand: 'Le square des Solidaires et les berges du canal deviennent les seuls refuges frais de la ville. Les commerces climatisés passivement sont plébiscités.',
  },
  {
    year: 2037,
    month: 2,
    id: 'arrivee_prefete_awa_diallo_2037',
    title: 'Nomination de la préfète Awa Diallo',
    summary: 'Lancement du grand plan de réindustrialisation verte des bassins miniers et métallurgiques.',
    macroEffectSuggestion: {
      interestRateDelta: -0.015,
      demandImpact: { velo: 1.3, service: 1.35 },
    },
    localContextValFerrand: 'Signature du contrat de transition écologique : décontamination des 38 ha de la Friche Taret et financement des ateliers artisanaux.',
  },
  {
    year: 2040,
    month: 5,
    id: 'renaissance_cooperative_2040',
    title: 'Modèle des Communs urbains généralisé',
    summary: '30% des entreprises des villes moyennes fonctionnent désormais avec gouvernance partagée et réinvestissement des bénéfices.',
    macroEffectSuggestion: {
      inflationDelta: 0.01,
      demandImpact: { epicerie: 1.25, boulangerie: 1.2, cafe: 1.2 },
    },
    localContextValFerrand: 'Val-Ferrand est citée en exemple national pour son réseau de boutiques coopératives et son autonomie maraîchère de vallée.',
  },
  {
    year: 2045,
    month: 9,
    id: 'jubile_val_ferrand_2045',
    title: 'Bilan de 25 ans de métamorphose',
    summary: 'Val-Ferrand fête le quart de siècle du renouveau citoyen entamé en septembre 2020.',
    macroEffectSuggestion: {
      inflationDelta: 0.0,
      demandImpact: { livre: 1.3, fleur: 1.3, cafe: 1.3 },
    },
    localContextValFerrand: 'Jean-Bernard Pujol prend sa retraite à 68 ans. Le joueur, désormais adulte aguerri, contemple la ville transformée par ses choix.',
  },
] as const;
