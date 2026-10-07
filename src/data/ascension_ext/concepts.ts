/**
 * Concepts économiques du sommet (Workflow AG-2 Phase 3).
 * 12 concepts économiques avancés sans jargon, ancrés dans la vie
 * et les affaires du joueur à Val-Ferrand et au-delà.
 * Conforme à docs/ASCENSION.md §2 et explorer_survey_2/handoff.md §4.2.
 */
import type { EconConcept } from '../ascension/concepts';

export const EXTRA_CONCEPTS: readonly EconConcept[] = [
  {
    id: 'monopole',
    name: 'Le monopole',
    thinker: 'Adam Smith',
    summary: 'Quand un unique vendeur contrôle toute l’offre, il peut imposer ses prix sans craindre la concurrence.',
    example: 'Quand le Drive HyperVal était le seul à livrer le soir, il pouvait doubler ses tarifs sans que personne ne proteste.',
  },
  {
    id: 'oligopole',
    name: 'L’oligopole',
    thinker: 'Antoine-Augustin Cournot',
    summary: 'Une poignée d’acteurs majeurs dominent le marché et coordonnent souvent leurs tarifs sans même avoir besoin de se concerter.',
    example: 'Les trois grossistes en farine de la région gardent le même prix au centime près, obligeant les boulangers à s’aligner.',
  },
  {
    id: 'concurrence_deloyale',
    name: 'La concurrence déloyale',
    thinker: 'Karl Polanyi',
    summary: 'Détourner des clients par la tromperie, l’imitation frauduleuse ou la calomnie plutôt que par l’amélioration de son produit.',
    example: 'Quand un rival a photocopié tes dépliants de goûters en prétendant que tes gâteaux étaient périmés.',
  },
  {
    id: 'capture_reglementaire',
    name: 'La capture réglementaire',
    thinker: 'George Stigler',
    summary: 'Quand les grandes entreprises en place influencent ceux qui écrivent les règlements pour ériger des barrières bloquant les nouveaux arrivants.',
    example: 'L’obligation d’un certificat payant imposée aux livreurs à vélo pour protéger la flotte des vieux transporteurs motorisés.',
  },
  {
    id: 'conglomerat_chaebol',
    name: 'Le conglomérat et le chaebol',
    thinker: 'Max Weber',
    summary: 'Un grand groupe familial unifié intervenant dans dix métiers distincts, capable d’absorber les pertes d’une branche grâce aux gains d’une autre.',
    example: 'Tes chantiers navals de Néo-Baie ont renfloué les premiers mois difficiles de ton journal sans passer par une banque.',
  },
  {
    id: 'alea_moral',
    name: 'L’aléa moral',
    thinker: 'Kenneth Arrow',
    summary: 'Quand une personne ou une firme se sait protégée contre les conséquences d’un sinistre, elle relâche sa vigilance et prend des risques inconsidérés.',
    example: 'L’assurance remboursait tes triporteurs à neuf sans franchise, et tes coursiers ont fini par négliger les antivols.',
  },
  {
    id: 'asymetrie_information',
    name: 'L’asymétrie d’information',
    thinker: 'George Akerlof',
    summary: 'Quand le vendeur détient sur l’objet des renseignements cruciaux dissimulés à l’acheteur, le doute général tire la valeur de tout le marché vers le bas.',
    example: 'Sous le pont du laminoir, personne ne connaissait l’origine des pièces détachées, et personne ne voulait payer le juste prix.',
  },
  {
    id: 'externalite',
    name: 'L’externalité',
    thinker: 'Arthur Cecil Pigou',
    summary: 'L’impact positif ou négatif causé par l’activité d’une entreprise sur son voisinage sans qu’aucune transaction financière n’ait eu lieu.',
    example: 'Les camions du Drive dégradent l’asphalte des Roses, tandis que ton atelier de vélos renforce le lien social du quartier sans rien facturer pour cela.',
  },
  {
    id: 'bien_public',
    name: 'Le bien public',
    thinker: 'Paul Samuelson',
    summary: 'Une ressource dont l’usage par une personne ne prive aucunement les autres et dont l’accès ne peut être restreint sans créer d’injustice.',
    example: 'L’éclairage public du quai de la Malterie sécurise les livraisons de nuit sans que personne ne puisse en faire payer l’accès.',
  },
  {
    id: 'rente',
    name: 'La rente',
    thinker: 'David Ricardo',
    summary: 'Un revenu perçu par la seule possession d’un emplacement ou d’une ressource rare, sans travail fourni ni valeur ajoutée nouvelle.',
    example: 'Le propriétaire qui majore brutalement le loyer de la boutique de l’avenue Jaurès uniquement parce que le tramway s’arrête désormais devant sa porte.',
  },
  {
    id: 'effet_eviction',
    name: 'L’effet d’éviction',
    thinker: 'Friedrich Hayek',
    summary: 'Quand un acteur hégémonique ou public draine l’intégralité des capitaux ou de la main-d’œuvre disponibles, privant les petites entreprises de tout moyen d’essor.',
    example: 'Le grand emprunt municipal a absorbé toute l’épargne locale, et les petits commerçants du centre n’ont plus trouvé un seul prêt bancaire.',
  },
  {
    id: 'dumping',
    name: 'Le dumping',
    thinker: 'Joan Robinson',
    summary: 'Vendre délibérément à perte pendant plusieurs mois pour asphyxier ses concurrents locaux avant de relever ses tarifs une fois le monopole conquis.',
    example: 'Le supermarché bradait le pain à 20 centimes jusqu’à ce que le fournil artisanal de la place du marché soit contraint de fermer boutique.',
  },
];
